"""
Christmas 프로젝트 - 백테스트 시뮬레이터 모듈
과거 데이터를 사용하여 매매 전략을 테스트하는 기능 제공
"""

import datetime
import logging
import pandas as pd
import numpy as np
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Union, Callable, Tuple
from enum import Enum, auto

from app.strategies import BaseStrategy
from app.risk import RiskService, RiskParameters
from app.execution.order_model import Order, OrderType, OrderStatus, OrderDirection
from app.broker.virtual_broker import VirtualBroker, VirtualPosition

logger = logging.getLogger(__name__)


class BacktestMode(Enum):
    """백테스트 모드"""
    DAILY = auto()  # 일봉 기준 백테스트
    MINUTE = auto()  # 분봉 기준 백테스트
    TICK = auto()    # 틱 기준 백테스트


@dataclass
class BacktestConfig:
    """백테스트 설정"""
    symbol: str  # 종목코드
    start_date: datetime.datetime  # 시작일
    end_date: datetime.datetime  # 종료일
    initial_capital: float = 10000000.0  # 초기 자본금 (1000만원)
    slippage: float = 0.0  # 슬리피지 (체결 시 가격 불이익)
    commission_rate: float = 0.0002  # 수수료율 (0.02%)
    mode: BacktestMode = BacktestMode.DAILY  # 백테스트 모드
    time_unit: int = 1  # 시간 단위 (분 단위로, 1분, 5분, 15분, 등)
    risk_params: Optional[RiskParameters] = None  # 위험 관리 매개변수
    data_source: str = "local"  # 데이터 소스 (local, api, etc.)
    data_path: Optional[str] = None  # 로컬 데이터 경로
    allow_short: bool = False  # 공매도 허용 여부
    use_stop_loss: bool = True  # 손절매 사용 여부
    use_take_profit: bool = True  # 이익실현 사용 여부


class BacktestSimulator:
    """백테스트 시뮬레이터 클래스"""
    
    def __init__(self, config: BacktestConfig, strategy: BaseStrategy):
        """
        백테스트 시뮬레이터 초기화
        
        Args:
            config: 백테스트 설정
            strategy: 테스트할 매매 전략
        """
        self.config = config
        self.strategy = strategy
        
        # 가상 브로커 초기화
        self.broker = VirtualBroker(initial_balance=config.initial_capital)
        
        # 위험 관리 서비스 초기화
        self.risk_service = RiskService(risk_params=config.risk_params)
        
        # 데이터 저장소
        self.data: Optional[pd.DataFrame] = None
        self.current_index = 0
        self.current_date: Optional[datetime.datetime] = None
        
        # 주문 및 거래 이력
        self.orders_history: List[Dict[str, Any]] = []
        self.trades_history: List[Dict[str, Any]] = []
        self.portfolio_history: List[Dict[str, Any]] = []
        
        # 성능 지표
        self.equity_curve: List[float] = []
        self.drawdowns: List[float] = []
        
        logger.info(f"백테스트 시뮬레이터 초기화: {config.symbol}, {config.start_date} ~ {config.end_date}")
    
    def load_data(self) -> bool:
        """
        백테스트용 데이터 로드
        
        Returns:
            데이터 로드 성공 여부
        """
        try:
            if self.config.data_source == "local" and self.config.data_path:
                # 로컬 파일에서 데이터 로드
                self.data = pd.read_csv(self.config.data_path, parse_dates=["datetime"])
            else:
                # 기본 데이터 생성 (예시)
                logger.warning("로컬 데이터 경로가 지정되지 않아 더미 데이터를 생성합니다.")
                self._create_dummy_data()
            
            # 날짜 필터링
            self.data = self.data[
                (self.data["datetime"] >= self.config.start_date) & 
                (self.data["datetime"] <= self.config.end_date)
            ]
            
            # 데이터 정렬
            self.data = self.data.sort_values("datetime").reset_index(drop=True)
            
            if len(self.data) == 0:
                logger.error("필터링된 데이터가 없습니다.")
                return False
            
            logger.info(f"데이터 로드 완료: {len(self.data)}개 데이터 포인트")
            return True
            
        except Exception as e:
            logger.error(f"데이터 로드 실패: {str(e)}")
            return False
    
    def _create_dummy_data(self) -> None:
        """테스트용 더미 데이터 생성"""
        # 날짜 범위 생성
        date_range = pd.date_range(
            start=self.config.start_date,
            end=self.config.end_date,
            freq="D" if self.config.mode == BacktestMode.DAILY else f"{self.config.time_unit}T"
        )
        
        # 기본 가격 데이터 생성
        base_price = 50000
        price_data = np.random.normal(0, 1, len(date_range)).cumsum()
        price_data = (price_data - min(price_data)) / (max(price_data) - min(price_data)) * 10000 + base_price
        
        # 데이터프레임 생성
        self.data = pd.DataFrame({
            "datetime": date_range,
            "open": price_data * (1 + np.random.normal(0, 0.005, len(date_range))),
            "high": price_data * (1 + np.random.normal(0, 0.01, len(date_range))),
            "low": price_data * (1 - np.random.normal(0, 0.01, len(date_range))),
            "close": price_data,
            "volume": np.random.lognormal(10, 1, len(date_range)),
        })
        
        # 데이터 정리
        self.data["symbol"] = self.config.symbol
        
        # OHLC 정리 (High는 최대, Low는 최소)
        self.data["high"] = self.data[["open", "high", "close"]].max(axis=1)
        self.data["low"] = self.data[["open", "low", "close"]].min(axis=1)
    
    def run(self) -> Dict[str, Any]:
        """
        백테스트 실행
        
        Returns:
            백테스트 결과
        """
        if self.data is None:
            success = self.load_data()
            if not success:
                logger.error("데이터 로드에 실패하여 백테스트를 실행할 수 없습니다.")
                return {"success": False, "error": "데이터 로드 실패"}
        
        # 성능 지표 초기화
        self.equity_curve = [self.config.initial_capital]
        self.drawdowns = [0.0]
        
        # 시뮬레이션 시작
        logger.info("백테스트 시작")
        
        for i in range(len(self.data)):
            self.current_index = i
            self.current_date = self.data.iloc[i]["datetime"]
            
            # 현재 시점의 데이터 추출
            current_data = self._get_current_data()
            
            # 가격 업데이트
            current_price = current_data["close"]
            self.broker.update_price(self.config.symbol, current_price, self.current_date)
            
            # 보류 중인 주문 처리
            self.broker.process_pending_orders()
            
            # 전략 실행 및 신호 생성
            signal = self.strategy.generate_signal(current_data)
            
            # 신호에 따른 매매 실행
            if signal:
                self._execute_signal(signal, current_data)
            
            # 포트폴리오 상태 기록
            self._record_portfolio_state()
        
        logger.info("백테스트 완료")
        
        # 결과 반환
        return {
            "success": True,
            "symbol": self.config.symbol,
            "start_date": self.config.start_date,
            "end_date": self.config.end_date,
            "initial_capital": self.config.initial_capital,
            "final_equity": self.equity_curve[-1],
            "return_pct": (self.equity_curve[-1] / self.config.initial_capital - 1) * 100,
            "orders": self.orders_history,
            "trades": self.trades_history,
            "portfolio_history": self.portfolio_history,
            "equity_curve": self.equity_curve,
            "drawdowns": self.drawdowns
        }
    
    def _get_current_data(self) -> Dict[str, Any]:
        """
        현재 시점의 데이터 가져오기
        
        Returns:
            현재 데이터 딕셔너리
        """
        current_row = self.data.iloc[self.current_index]
        
        # 이전 데이터 불러오기 (전략에 필요한 경우)
        lookback = min(self.current_index + 1, 100)  # 최대 100개 이전 데이터
        history = self.data.iloc[self.current_index - lookback + 1:self.current_index + 1]
        
        # 전략 계산을 위한 데이터 변환
        data = {
            "symbol": self.config.symbol,
            "datetime": current_row["datetime"],
            "open": current_row["open"],
            "high": current_row["high"],
            "low": current_row["low"],
            "close": current_row["close"],
            "volume": current_row["volume"],
            "history": {
                "datetime": history["datetime"].tolist(),
                "open": history["open"].tolist(),
                "high": history["high"].tolist(),
                "low": history["low"].tolist(),
                "close": history["close"].tolist(),
                "volume": history["volume"].tolist(),
            }
        }
        
        return data
    
    def _execute_signal(self, signal: Dict[str, Any], data: Dict[str, Any]) -> None:
        """
        매매 신호 실행
        
        Args:
            signal: 매매 신호 정보
            data: 현재 시장 데이터
        """
        signal_type = signal.get("type", "").lower()
        price = data["close"]
        
        # 계좌 정보 조회
        account_info = self.broker.get_account_balance()
        
        # 현재 포지션 확인
        has_position = self.config.symbol in self.broker.account.positions
        
        # 매수 신호
        if signal_type == "buy" and (not has_position or self.config.allow_short):
            # 이미 롱 포지션이 있는 경우 무시
            if has_position and self.broker.account.positions[self.config.symbol].quantity > 0:
                return
            
            # 숏 포지션이 있는 경우 먼저 청산
            if has_position and self.broker.account.positions[self.config.symbol].quantity < 0:
                self._close_position("position_reversed")
            
            # 위험 관리에 따른 주문 수량 계산
            quantity = self.risk_service.calculate_position_size(
                self.config.symbol, price, account_info
            )
            
            if quantity <= 0:
                return
            
            # 손절매/이익실현 계산
            stop_loss, take_profit = self.risk_service.calculate_exit_points(
                self.config.symbol, price, "long", 
                {
                    "high": data["history"]["high"],
                    "low": data["history"]["low"],
                    "close": data["history"]["close"]
                }
            )
            
            # 슬리피지 적용
            execution_price = price * (1 + self.config.slippage)
            
            # 주문 실행
            order_id = self.broker.place_order(
                self.config.symbol, "buy", execution_price, quantity
            )
            
            # 주문 기록
            order_info = {
                "order_id": order_id,
                "datetime": self.current_date,
                "symbol": self.config.symbol,
                "direction": "buy",
                "price": execution_price,
                "quantity": quantity,
                "stop_loss": stop_loss if self.config.use_stop_loss else None,
                "take_profit": take_profit if self.config.use_take_profit else None,
                "status": "filled"  # 백테스트에서는 즉시 체결로 가정
            }
            
            self.orders_history.append(order_info)
            
            # 위험 관리에 포지션 등록
            self.risk_service.register_position(
                self.config.symbol, execution_price, quantity, "long", stop_loss, take_profit
            )
            
            logger.info(f"매수 실행: {self.config.symbol} {quantity}주 @ {execution_price}원")
        
        # 매도 신호
        elif signal_type == "sell":
            # 롱 포지션이 있는 경우 청산
            if has_position and self.broker.account.positions[self.config.symbol].quantity > 0:
                self._close_position("signal_sell")
            
            # 공매도 허용된 경우 숏 포지션 진입
            elif self.config.allow_short and (not has_position or self.broker.account.positions[self.config.symbol].quantity >= 0):
                # 위험 관리에 따른 주문 수량 계산
                quantity = self.risk_service.calculate_position_size(
                    self.config.symbol, price, account_info
                )
                
                if quantity <= 0:
                    return
                
                # 손절매/이익실현 계산
                stop_loss, take_profit = self.risk_service.calculate_exit_points(
                    self.config.symbol, price, "short", 
                    {
                        "high": data["history"]["high"],
                        "low": data["history"]["low"],
                        "close": data["history"]["close"]
                    }
                )
                
                # 슬리피지 적용
                execution_price = price * (1 - self.config.slippage)
                
                # 주문 실행
                order_id = self.broker.place_order(
                    self.config.symbol, "sell", execution_price, quantity
                )
                
                # 주문 기록
                order_info = {
                    "order_id": order_id,
                    "datetime": self.current_date,
                    "symbol": self.config.symbol,
                    "direction": "sell",
                    "price": execution_price,
                    "quantity": quantity,
                    "stop_loss": stop_loss if self.config.use_stop_loss else None,
                    "take_profit": take_profit if self.config.use_take_profit else None,
                    "status": "filled"  # 백테스트에서는 즉시 체결로 가정
                }
                
                self.orders_history.append(order_info)
                
                # 위험 관리에 포지션 등록
                self.risk_service.register_position(
                    self.config.symbol, execution_price, quantity, "short", stop_loss, take_profit
                )
                
                logger.info(f"매도(숏) 실행: {self.config.symbol} {quantity}주 @ {execution_price}원")
        
        # 손절매/이익실현 확인
        if has_position and (self.config.use_stop_loss or self.config.use_take_profit):
            exit_signal = self.risk_service.check_exit_signals(self.config.symbol, price)
            
            if exit_signal:
                self._close_position(exit_signal)
    
    def _close_position(self, reason: str) -> None:
        """
        포지션 종료
        
        Args:
            reason: 종료 이유
        """
        if self.config.symbol not in self.broker.account.positions:
            return
        
        position = self.broker.account.positions[self.config.symbol]
        price = position.current_price
        quantity = position.quantity
        direction = "sell" if quantity > 0 else "buy"
        
        # 슬리피지 적용
        execution_price = price * (1 - self.config.slippage) if direction == "sell" else price * (1 + self.config.slippage)
        
        # 주문 실행
        order_id = self.broker.place_order(
            self.config.symbol, direction, execution_price, abs(quantity)
        )
        
        # 주문 기록
        order_info = {
            "order_id": order_id,
            "datetime": self.current_date,
            "symbol": self.config.symbol,
            "direction": direction,
            "price": execution_price,
            "quantity": abs(quantity),
            "reason": reason,
            "status": "filled"  # 백테스트에서는 즉시 체결로 가정
        }
        
        self.orders_history.append(order_info)
        
        # 위험 관리에서 포지션 종료
        trade_record = self.risk_service.close_position(
            self.config.symbol, execution_price, reason
        )
        
        # 거래 기록 추가
        if trade_record:
            trade_record["exit_datetime"] = self.current_date
            self.trades_history.append(trade_record)
        
        logger.info(f"포지션 종료: {self.config.symbol} {abs(quantity)}주 @ {execution_price}원, 이유: {reason}")
    
    def _record_portfolio_state(self) -> None:
        """포트폴리오 상태 기록"""
        # 계좌 정보 조회
        account_info = self.broker.get_account_balance()
        total_equity = account_info["total_equity"]
        
        # 자산 곡선 기록
        self.equity_curve.append(total_equity)
        
        # 드로다운 계산
        peak = max(self.equity_curve)
        drawdown = (peak - total_equity) / peak * 100 if peak > 0 else 0
        self.drawdowns.append(drawdown)
        
        # 포트폴리오 상태 기록
        self.portfolio_history.append({
            "datetime": self.current_date,
            "equity": total_equity,
            "cash": account_info["cash_balance"],
            "positions_value": account_info["total_position_value"],
            "drawdown": drawdown
        }) 