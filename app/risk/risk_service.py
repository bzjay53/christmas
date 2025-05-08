"""
Christmas 프로젝트 - 위험 관리 서비스 모듈
포지션 사이징, 손절매/이익실현 관리 등 전체 위험 관리 기능을 통합
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List, Tuple
import logging
import json

from app.risk.position_sizing import PositionSizer, FixedAmountSizer
from app.risk.stop_loss import StopLossManager, FixedStopLoss

logger = logging.getLogger(__name__)


@dataclass
class RiskParameters:
    """위험 관리 매개변수"""
    # 포지션 사이징 관련 매개변수
    position_sizing_method: str = "fixed_amount"  # fixed_amount, fixed_risk, percentage
    fixed_amount: float = 1000000.0  # 100만원
    risk_per_trade: float = 0.01  # 거래당 리스크 비율 (1%)
    position_percentage: float = 0.02  # 총 자산 대비 포지션 비율 (2%)
    
    # 손절매/이익실현 관련 매개변수
    stop_loss_method: str = "fixed"  # fixed, trailing, atr
    stop_loss_pct: float = 0.02  # 손절매 비율 (2%)
    take_profit_pct: float = 0.04  # 이익실현 비율 (4%)
    trail_pct: float = 0.01  # 트레일링 스탑 비율 (1%)
    atr_multiplier: float = 2.0  # ATR 승수
    take_profit_atr_multiplier: float = 4.0  # 이익실현 ATR 승수
    
    # 거래 제한 관련 매개변수
    max_open_positions: int = 5  # 최대 동시 오픈 포지션 수
    max_daily_trades: int = 10  # 최대 일일 거래 횟수
    max_loss_per_day_pct: float = 0.02  # 일일 최대 손실 비율 (2%)
    
    # 기타 위험 관리 매개변수
    max_drawdown_pct: float = 0.10  # 최대 드로다운 비율 (10%)
    position_correlation_limit: float = 0.7  # 포지션 상관관계 제한
    
    def to_dict(self) -> Dict[str, Any]:
        """매개변수를 딕셔너리로 변환"""
        return {
            # 포지션 사이징 관련
            "position_sizing_method": self.position_sizing_method,
            "fixed_amount": self.fixed_amount,
            "risk_per_trade": self.risk_per_trade,
            "position_percentage": self.position_percentage,
            
            # 손절매/이익실현 관련
            "stop_loss_method": self.stop_loss_method,
            "stop_loss_pct": self.stop_loss_pct,
            "take_profit_pct": self.take_profit_pct,
            "trail_pct": self.trail_pct,
            "atr_multiplier": self.atr_multiplier,
            "take_profit_atr_multiplier": self.take_profit_atr_multiplier,
            
            # 거래 제한 관련
            "max_open_positions": self.max_open_positions,
            "max_daily_trades": self.max_daily_trades,
            "max_loss_per_day_pct": self.max_loss_per_day_pct,
            
            # 기타 위험 관리 매개변수
            "max_drawdown_pct": self.max_drawdown_pct,
            "position_correlation_limit": self.position_correlation_limit
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'RiskParameters':
        """딕셔너리에서 매개변수 객체 생성"""
        return cls(**{k: v for k, v in data.items() if k in cls.__annotations__})
    
    def to_json(self) -> str:
        """매개변수를 JSON 문자열로 변환"""
        return json.dumps(self.to_dict(), indent=2)
    
    @classmethod
    def from_json(cls, json_str: str) -> 'RiskParameters':
        """JSON 문자열에서 매개변수 객체 생성"""
        data = json.loads(json_str)
        return cls.from_dict(data)


class RiskService:
    """위험 관리 서비스"""
    
    def __init__(self, risk_params: Optional[RiskParameters] = None):
        """
        위험 관리 서비스 초기화
        
        Args:
            risk_params: 위험 관리 매개변수 (기본값: None, 기본 매개변수 사용)
        """
        self.risk_params = risk_params or RiskParameters()
        
        # 포지션 사이저 생성
        self.position_sizers = self._create_position_sizers()
        
        # 손절매 관리자 생성
        self.stop_loss_managers = self._create_stop_loss_managers()
        
        # 거래 기록 및 통계
        self.daily_trades_count = 0
        self.daily_pnl = 0.0
        self.open_positions: Dict[str, Dict[str, Any]] = {}
        self.trade_history: List[Dict[str, Any]] = []
        
        logger.info("위험 관리 서비스 초기화 완료")
    
    def _create_position_sizers(self) -> Dict[str, PositionSizer]:
        """포지션 사이저 생성"""
        from app.risk.position_sizing import FixedAmountSizer, FixedRiskSizer, PercentageOfEquitySizer
        
        return {
            "fixed_amount": FixedAmountSizer(fixed_amount=self.risk_params.fixed_amount),
            "fixed_risk": FixedRiskSizer(risk_per_trade=self.risk_params.risk_per_trade, 
                                         default_stop_pct=self.risk_params.stop_loss_pct),
            "percentage": PercentageOfEquitySizer(percentage=self.risk_params.position_percentage)
        }
    
    def _create_stop_loss_managers(self) -> Dict[str, StopLossManager]:
        """손절매 관리자 생성"""
        from app.risk.stop_loss import FixedStopLoss, TrailingStopLoss, ATRStopLoss
        
        return {
            "fixed": FixedStopLoss(stop_loss_pct=self.risk_params.stop_loss_pct,
                                  take_profit_pct=self.risk_params.take_profit_pct),
            "trailing": TrailingStopLoss(initial_stop_pct=self.risk_params.stop_loss_pct,
                                        trail_pct=self.risk_params.trail_pct,
                                        take_profit_pct=self.risk_params.take_profit_pct),
            "atr": ATRStopLoss(atr_multiplier=self.risk_params.atr_multiplier,
                              take_profit_atr_multiplier=self.risk_params.take_profit_atr_multiplier)
        }
    
    def calculate_position_size(self, 
                               symbol: str, 
                               price: float, 
                               account_info: Dict[str, Any]) -> int:
        """
        주문할 주식 수량 계산
        
        Args:
            symbol: 종목코드
            price: 현재 가격
            account_info: 계좌 정보
            
        Returns:
            주문 수량 (정수)
        """
        # 위험 관리 조건 확인
        if not self._validate_new_trade(symbol, account_info):
            logger.warning(f"위험 관리 조건을 충족하지 않아 주문이 제한됩니다: {symbol}")
            return 0
        
        # 선택된 포지션 사이징 방식 사용
        method = self.risk_params.position_sizing_method
        if method not in self.position_sizers:
            logger.warning(f"지원하지 않는 포지션 사이징 방식: {method}, 기본값(fixed_amount) 사용")
            method = "fixed_amount"
        
        sizer = self.position_sizers[method]
        quantity = sizer.calculate_position_size(
            symbol, price, account_info, self.risk_params.to_dict()
        )
        
        logger.info(f"계산된 주문 수량: {symbol} @ {price}원 -> {quantity}주 ({method})")
        return quantity
    
    def calculate_exit_points(self, 
                             symbol: str, 
                             entry_price: float, 
                             position_type: str,
                             market_data: Optional[Dict[str, Any]] = None) -> Tuple[float, float]:
        """
        손절매 및 이익실현 가격 계산
        
        Args:
            symbol: 종목코드
            entry_price: 진입 가격
            position_type: 포지션 유형 ('long' 또는 'short')
            market_data: 시장 데이터 (옵션)
            
        Returns:
            (손절매 가격, 이익실현 가격) 튜플
        """
        # 선택된 손절매 방식 사용
        method = self.risk_params.stop_loss_method
        if method not in self.stop_loss_managers:
            logger.warning(f"지원하지 않는 손절매 방식: {method}, 기본값(fixed) 사용")
            method = "fixed"
        
        manager = self.stop_loss_managers[method]
        stop_loss, take_profit = manager.calculate_exit_points(
            symbol, entry_price, position_type, market_data, self.risk_params.to_dict()
        )
        
        logger.info(f"계산된 손절/익절 가격: {symbol} @ {entry_price}원 -> 손절: {stop_loss}원, 익절: {take_profit}원 ({method})")
        return stop_loss, take_profit
    
    def update_exit_points(self,
                          symbol: str,
                          entry_price: float,
                          current_price: float,
                          position_type: str,
                          current_stop: float,
                          current_target: float,
                          market_data: Optional[Dict[str, Any]] = None) -> Tuple[float, float]:
        """
        손절매 및 이익실현 가격 업데이트
        
        Args:
            symbol: 종목코드
            entry_price: 진입 가격
            current_price: 현재 가격
            position_type: 포지션 유형 ('long' 또는 'short')
            current_stop: 현재 손절매 가격
            current_target: 현재 이익실현 가격
            market_data: 시장 데이터 (옵션)
            
        Returns:
            (업데이트된 손절매 가격, 업데이트된 이익실현 가격) 튜플
        """
        # 선택된 손절매 방식 사용
        method = self.risk_params.stop_loss_method
        if method not in self.stop_loss_managers:
            logger.warning(f"지원하지 않는 손절매 방식: {method}, 기본값(fixed) 사용")
            method = "fixed"
        
        manager = self.stop_loss_managers[method]
        updated_stop, updated_target = manager.update_exit_points(
            symbol, entry_price, current_price, position_type, 
            current_stop, current_target, market_data, self.risk_params.to_dict()
        )
        
        # 값이 변경된 경우에만 로그 출력
        if updated_stop != current_stop or updated_target != current_target:
            logger.info(f"손절/익절 가격 업데이트: {symbol} @ {current_price}원 -> 손절: {updated_stop}원, 익절: {updated_target}원")
        
        return updated_stop, updated_target
    
    def register_position(self, 
                         symbol: str, 
                         entry_price: float, 
                         quantity: int, 
                         position_type: str,
                         stop_loss: float,
                         take_profit: float) -> None:
        """
        새 포지션 등록
        
        Args:
            symbol: 종목코드
            entry_price: 진입 가격
            quantity: 수량
            position_type: 포지션 유형 ('long' 또는 'short')
            stop_loss: 손절매 가격
            take_profit: 이익실현 가격
        """
        position_data = {
            "symbol": symbol,
            "entry_price": entry_price,
            "quantity": quantity,
            "position_type": position_type,
            "stop_loss": stop_loss,
            "take_profit": take_profit,
            "current_price": entry_price,
            "pnl": 0.0,
            "pnl_pct": 0.0
        }
        
        self.open_positions[symbol] = position_data
        self.daily_trades_count += 1
        
        logger.info(f"새 포지션 등록: {symbol} {quantity}주 @ {entry_price}원, {position_type}, 손절: {stop_loss}원, 익절: {take_profit}원")
    
    def close_position(self, symbol: str, exit_price: float, exit_reason: str) -> Dict[str, Any]:
        """
        포지션 종료
        
        Args:
            symbol: 종목코드
            exit_price: 종료 가격
            exit_reason: 종료 이유 ('stop_loss', 'take_profit', 'manual', 등)
            
        Returns:
            종료된 포지션 정보
        """
        if symbol not in self.open_positions:
            logger.warning(f"종료할 포지션을 찾을 수 없음: {symbol}")
            return {}
        
        position = self.open_positions.pop(symbol)
        
        # 손익 계산
        if position["position_type"].lower() == "long":
            pnl = (exit_price - position["entry_price"]) * position["quantity"]
            pnl_pct = (exit_price / position["entry_price"] - 1) * 100
        else:  # short
            pnl = (position["entry_price"] - exit_price) * position["quantity"]
            pnl_pct = (position["entry_price"] / exit_price - 1) * 100
        
        # 거래 기록 업데이트
        trade_record = {
            **position,
            "exit_price": exit_price,
            "exit_reason": exit_reason,
            "pnl": pnl,
            "pnl_pct": pnl_pct
        }
        
        self.trade_history.append(trade_record)
        self.daily_pnl += pnl
        
        logger.info(f"포지션 종료: {symbol} @ {exit_price}원, 이유: {exit_reason}, 손익: {pnl}원 ({pnl_pct:.2f}%)")
        return trade_record
    
    def update_position(self, symbol: str, current_price: float, market_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        포지션 정보 업데이트
        
        Args:
            symbol: 종목코드
            current_price: 현재 가격
            market_data: 시장 데이터 (옵션)
            
        Returns:
            업데이트된 포지션 정보
        """
        if symbol not in self.open_positions:
            logger.warning(f"업데이트할 포지션을 찾을 수 없음: {symbol}")
            return {}
        
        position = self.open_positions[symbol]
        
        # 현재 가격 및 손익 업데이트
        position["current_price"] = current_price
        
        if position["position_type"].lower() == "long":
            position["pnl"] = (current_price - position["entry_price"]) * position["quantity"]
            position["pnl_pct"] = (current_price / position["entry_price"] - 1) * 100
        else:  # short
            position["pnl"] = (position["entry_price"] - current_price) * position["quantity"]
            position["pnl_pct"] = (position["entry_price"] / current_price - 1) * 100
        
        # 손절/익절 가격 업데이트
        updated_stop, updated_target = self.update_exit_points(
            symbol, position["entry_price"], current_price, position["position_type"],
            position["stop_loss"], position["take_profit"], market_data
        )
        
        position["stop_loss"] = updated_stop
        position["take_profit"] = updated_target
        
        return position
    
    def check_exit_signals(self, symbol: str, current_price: float) -> Optional[str]:
        """
        종료 신호 확인
        
        Args:
            symbol: 종목코드
            current_price: 현재 가격
            
        Returns:
            종료 이유 ('stop_loss', 'take_profit', None)
        """
        if symbol not in self.open_positions:
            return None
        
        position = self.open_positions[symbol]
        
        # 롱 포지션
        if position["position_type"].lower() == "long":
            # 손절 확인
            if current_price <= position["stop_loss"]:
                return "stop_loss"
            # 익절 확인
            elif current_price >= position["take_profit"]:
                return "take_profit"
        
        # 숏 포지션
        elif position["position_type"].lower() == "short":
            # 손절 확인
            if current_price >= position["stop_loss"]:
                return "stop_loss"
            # 익절 확인
            elif current_price <= position["take_profit"]:
                return "take_profit"
        
        return None
    
    def reset_daily_stats(self) -> None:
        """일일 통계 초기화"""
        self.daily_trades_count = 0
        self.daily_pnl = 0.0
        logger.info("일일 거래 통계 초기화")
    
    def get_risk_metrics(self, account_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        위험 지표 계산
        
        Args:
            account_info: 계좌 정보
            
        Returns:
            위험 지표
        """
        total_equity = account_info.get("total_equity", 0)
        
        # 현재 포지션 리스크 계산
        position_value = 0.0
        for position in self.open_positions.values():
            position_value += position["current_price"] * position["quantity"]
        
        position_exposure = position_value / total_equity if total_equity > 0 else 0
        
        # 일일 손익률
        daily_pnl_pct = self.daily_pnl / total_equity if total_equity > 0 else 0
        
        return {
            "position_count": len(self.open_positions),
            "position_exposure": position_exposure,
            "daily_trades_count": self.daily_trades_count,
            "daily_pnl": self.daily_pnl,
            "daily_pnl_pct": daily_pnl_pct,
            "risk_params": self.risk_params.to_dict(),
            "max_open_positions": self.risk_params.max_open_positions,
            "max_daily_trades": self.risk_params.max_daily_trades,
            "max_loss_per_day_pct": self.risk_params.max_loss_per_day_pct
        }
    
    def _validate_new_trade(self, symbol: str, account_info: Dict[str, Any]) -> bool:
        """
        신규 거래 허용 여부 확인
        
        Args:
            symbol: 종목코드
            account_info: 계좌 정보
            
        Returns:
            거래 허용 여부
        """
        # 이미 해당 종목의 포지션이 있는지 확인
        if symbol in self.open_positions:
            logger.warning(f"이미 {symbol} 종목에 대한 포지션이 존재합니다.")
            return False
        
        # 최대 포지션 수 확인
        if len(self.open_positions) >= self.risk_params.max_open_positions:
            logger.warning(f"최대 포지션 수 ({self.risk_params.max_open_positions}개)에 도달했습니다.")
            return False
        
        # 일일 최대 거래 횟수 확인
        if self.daily_trades_count >= self.risk_params.max_daily_trades:
            logger.warning(f"일일 최대 거래 횟수 ({self.risk_params.max_daily_trades}회)에 도달했습니다.")
            return False
        
        # 일일 최대 손실 확인
        total_equity = account_info.get("total_equity", 0)
        max_daily_loss = total_equity * self.risk_params.max_loss_per_day_pct
        
        if self.daily_pnl < -max_daily_loss:
            logger.warning(f"일일 최대 손실 ({max_daily_loss}원)을 초과했습니다.")
            return False
        
        return True 