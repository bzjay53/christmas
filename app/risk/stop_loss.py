"""
Christmas 프로젝트 - 손절매/이익실현 관리 모듈
다양한 손절매 및 이익실현 전략을 제공
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Tuple
import logging
import numpy as np

logger = logging.getLogger(__name__)


class StopLossManager(ABC):
    """손절매/이익실현 관리 인터페이스"""
    
    @abstractmethod
    def calculate_exit_points(self, 
                             symbol: str, 
                             entry_price: float, 
                             position_type: str,
                             market_data: Optional[Dict[str, Any]] = None,
                             risk_params: Optional[Dict[str, Any]] = None) -> Tuple[float, float]:
        """
        손절매 및 이익실현 가격 계산
        
        Args:
            symbol: 종목코드
            entry_price: 진입 가격
            position_type: 포지션 유형 ('long' 또는 'short')
            market_data: 시장 데이터 (옵션)
            risk_params: 위험 매개변수 (옵션)
            
        Returns:
            (손절매 가격, 이익실현 가격) 튜플
        """
        pass
    
    @abstractmethod
    def update_exit_points(self,
                          symbol: str,
                          entry_price: float,
                          current_price: float,
                          position_type: str,
                          current_stop: float,
                          current_target: float,
                          market_data: Optional[Dict[str, Any]] = None,
                          risk_params: Optional[Dict[str, Any]] = None) -> Tuple[float, float]:
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
            risk_params: 위험 매개변수 (옵션)
            
        Returns:
            (업데이트된 손절매 가격, 업데이트된 이익실현 가격) 튜플
        """
        pass


class FixedStopLoss(StopLossManager):
    """고정 비율 기반 손절매/이익실현 전략"""
    
    def __init__(self, stop_loss_pct: float = 0.02, take_profit_pct: float = 0.04):
        """
        고정 비율 손절매 관리자 초기화
        
        Args:
            stop_loss_pct: 손절매 비율 (기본값: 2%)
            take_profit_pct: 이익실현 비율 (기본값: 4%)
        """
        self.stop_loss_pct = stop_loss_pct
        self.take_profit_pct = take_profit_pct
    
    def calculate_exit_points(self, 
                             symbol: str, 
                             entry_price: float, 
                             position_type: str,
                             market_data: Optional[Dict[str, Any]] = None,
                             risk_params: Optional[Dict[str, Any]] = None) -> Tuple[float, float]:
        """
        고정 비율 기반 손절매 및 이익실현 가격 계산
        
        Args:
            symbol: 종목코드
            entry_price: 진입 가격
            position_type: 포지션 유형 ('long' 또는 'short')
            market_data: 시장 데이터 (사용하지 않음)
            risk_params: 위험 매개변수 (옵션)
            
        Returns:
            (손절매 가격, 이익실현 가격) 튜플
        """
        # 위험 매개변수에서 값 가져오기 또는 기본값 사용
        stop_loss_pct = risk_params.get('stop_loss_pct', self.stop_loss_pct) if risk_params else self.stop_loss_pct
        take_profit_pct = risk_params.get('take_profit_pct', self.take_profit_pct) if risk_params else self.take_profit_pct
        
        if position_type.lower() == 'long':
            stop_loss = entry_price * (1 - stop_loss_pct)
            take_profit = entry_price * (1 + take_profit_pct)
        elif position_type.lower() == 'short':
            stop_loss = entry_price * (1 + stop_loss_pct)
            take_profit = entry_price * (1 - take_profit_pct)
        else:
            raise ValueError(f"지원하지 않는 포지션 유형: {position_type}")
        
        logger.info(f"고정 비율 손절/익절 계산: {symbol} @ {entry_price}원, {position_type}, 손절: {stop_loss}원, 익절: {take_profit}원")
        return stop_loss, take_profit
    
    def update_exit_points(self,
                          symbol: str,
                          entry_price: float,
                          current_price: float,
                          position_type: str,
                          current_stop: float,
                          current_target: float,
                          market_data: Optional[Dict[str, Any]] = None,
                          risk_params: Optional[Dict[str, Any]] = None) -> Tuple[float, float]:
        """
        고정 비율 손절매/이익실현 가격 업데이트 (변경 없음)
        
        Args:
            symbol: 종목코드
            entry_price: 진입 가격
            current_price: 현재 가격
            position_type: 포지션 유형 ('long' 또는 'short')
            current_stop: 현재 손절매 가격
            current_target: 현재 이익실현 가격
            market_data: 시장 데이터 (사용하지 않음)
            risk_params: 위험 매개변수 (사용하지 않음)
            
        Returns:
            (현재 손절매 가격, 현재 이익실현 가격) 튜플 (업데이트 없음)
        """
        # 고정 손절매/이익실현은 업데이트되지 않음
        return current_stop, current_target


class TrailingStopLoss(StopLossManager):
    """트레일링 스탑 손절매/이익실현 전략"""
    
    def __init__(self, initial_stop_pct: float = 0.02, trail_pct: float = 0.01, take_profit_pct: float = 0.04):
        """
        트레일링 스탑 손절매 관리자 초기화
        
        Args:
            initial_stop_pct: 초기 손절매 비율 (기본값: 2%)
            trail_pct: 트레일링 비율 (기본값: 1%)
            take_profit_pct: 이익실현 비율 (기본값: 4%)
        """
        self.initial_stop_pct = initial_stop_pct
        self.trail_pct = trail_pct
        self.take_profit_pct = take_profit_pct
    
    def calculate_exit_points(self, 
                             symbol: str, 
                             entry_price: float, 
                             position_type: str,
                             market_data: Optional[Dict[str, Any]] = None,
                             risk_params: Optional[Dict[str, Any]] = None) -> Tuple[float, float]:
        """
        트레일링 스탑 손절매 및 이익실현 가격 계산
        
        Args:
            symbol: 종목코드
            entry_price: 진입 가격
            position_type: 포지션 유형 ('long' 또는 'short')
            market_data: 시장 데이터 (사용하지 않음)
            risk_params: 위험 매개변수 (옵션)
            
        Returns:
            (손절매 가격, 이익실현 가격) 튜플
        """
        # 위험 매개변수에서 값 가져오기 또는 기본값 사용
        initial_stop_pct = risk_params.get('initial_stop_pct', self.initial_stop_pct) if risk_params else self.initial_stop_pct
        take_profit_pct = risk_params.get('take_profit_pct', self.take_profit_pct) if risk_params else self.take_profit_pct
        
        if position_type.lower() == 'long':
            stop_loss = entry_price * (1 - initial_stop_pct)
            take_profit = entry_price * (1 + take_profit_pct)
        elif position_type.lower() == 'short':
            stop_loss = entry_price * (1 + initial_stop_pct)
            take_profit = entry_price * (1 - take_profit_pct)
        else:
            raise ValueError(f"지원하지 않는 포지션 유형: {position_type}")
        
        logger.info(f"트레일링 스탑 초기 손절/익절 계산: {symbol} @ {entry_price}원, {position_type}, 손절: {stop_loss}원, 익절: {take_profit}원")
        return stop_loss, take_profit
    
    def update_exit_points(self,
                          symbol: str,
                          entry_price: float,
                          current_price: float,
                          position_type: str,
                          current_stop: float,
                          current_target: float,
                          market_data: Optional[Dict[str, Any]] = None,
                          risk_params: Optional[Dict[str, Any]] = None) -> Tuple[float, float]:
        """
        트레일링 스탑 손절매/이익실현 가격 업데이트
        
        Args:
            symbol: 종목코드
            entry_price: 진입 가격
            current_price: 현재 가격
            position_type: 포지션 유형 ('long' 또는 'short')
            current_stop: 현재 손절매 가격
            current_target: 현재 이익실현 가격
            market_data: 시장 데이터 (사용하지 않음)
            risk_params: 위험 매개변수 (옵션)
            
        Returns:
            (업데이트된 손절매 가격, 현재 이익실현 가격) 튜플
        """
        # 위험 매개변수에서 값 가져오기 또는 기본값 사용
        trail_pct = risk_params.get('trail_pct', self.trail_pct) if risk_params else self.trail_pct
        
        # 손절매 업데이트
        if position_type.lower() == 'long':
            # 롱 포지션의 경우 가격이 상승하면 손절매 가격도 상승
            trail_stop = current_price * (1 - trail_pct)
            if trail_stop > current_stop:
                logger.info(f"트레일링 스탑 업데이트 (롱): {symbol} @ {current_price}원, 손절: {current_stop}원 -> {trail_stop}원")
                return trail_stop, current_target
        elif position_type.lower() == 'short':
            # 숏 포지션의 경우 가격이 하락하면 손절매 가격도 하락
            trail_stop = current_price * (1 + trail_pct)
            if trail_stop < current_stop:
                logger.info(f"트레일링 스탑 업데이트 (숏): {symbol} @ {current_price}원, 손절: {current_stop}원 -> {trail_stop}원")
                return trail_stop, current_target
        
        # 변경 사항이 없는 경우 현재 값 반환
        return current_stop, current_target


class ATRStopLoss(StopLossManager):
    """ATR(Average True Range) 기반 손절매/이익실현 전략"""
    
    def __init__(self, atr_multiplier: float = 2.0, take_profit_atr_multiplier: float = 4.0):
        """
        ATR 기반 손절매 관리자 초기화
        
        Args:
            atr_multiplier: ATR 승수 (기본값: 2.0)
            take_profit_atr_multiplier: 이익실현 ATR 승수 (기본값: 4.0)
        """
        self.atr_multiplier = atr_multiplier
        self.take_profit_atr_multiplier = take_profit_atr_multiplier
    
    def _calculate_atr(self, high_prices: np.ndarray, low_prices: np.ndarray, close_prices: np.ndarray, period: int = 14) -> float:
        """
        ATR 계산
        
        Args:
            high_prices: 고가 배열
            low_prices: 저가 배열
            close_prices: 종가 배열
            period: ATR 기간 (기본값: 14)
            
        Returns:
            ATR 값
        """
        if len(high_prices) < period + 1 or len(low_prices) < period + 1 or len(close_prices) < period + 1:
            logger.warning(f"ATR 계산을 위한 데이터가 부족합니다. 필요: {period+1}, 제공: {len(high_prices)}")
            return 0.0
        
        # True Range 계산
        tr1 = high_prices[1:] - low_prices[1:]
        tr2 = abs(high_prices[1:] - close_prices[:-1])
        tr3 = abs(low_prices[1:] - close_prices[:-1])
        
        tr = np.maximum(np.maximum(tr1, tr2), tr3)
        
        # ATR 계산 (단순 이동 평균)
        atr = np.mean(tr[-period:])
        
        return atr
    
    def calculate_exit_points(self, 
                             symbol: str, 
                             entry_price: float, 
                             position_type: str,
                             market_data: Optional[Dict[str, Any]] = None,
                             risk_params: Optional[Dict[str, Any]] = None) -> Tuple[float, float]:
        """
        ATR 기반 손절매 및 이익실현 가격 계산
        
        Args:
            symbol: 종목코드
            entry_price: 진입 가격
            position_type: 포지션 유형 ('long' 또는 'short')
            market_data: 시장 데이터 (필수)
            risk_params: 위험 매개변수 (옵션)
            
        Returns:
            (손절매 가격, 이익실현 가격) 튜플
        """
        # 위험 매개변수에서 값 가져오기 또는 기본값 사용
        atr_multiplier = risk_params.get('atr_multiplier', self.atr_multiplier) if risk_params else self.atr_multiplier
        take_profit_atr_multiplier = risk_params.get('take_profit_atr_multiplier', self.take_profit_atr_multiplier) if risk_params else self.take_profit_atr_multiplier
        
        # 시장 데이터 확인
        if not market_data or not all(k in market_data for k in ['high', 'low', 'close']):
            logger.error("ATR 계산을 위한 시장 데이터가 부족합니다.")
            # 기본값으로 대체
            atr_value = entry_price * 0.01  # 진입 가격의 1%를 기본 ATR로 사용
        else:
            # ATR 계산
            high_prices = np.array(market_data['high'])
            low_prices = np.array(market_data['low'])
            close_prices = np.array(market_data['close'])
            
            atr_value = self._calculate_atr(high_prices, low_prices, close_prices, period=14)
            
            if atr_value <= 0:
                atr_value = entry_price * 0.01  # 계산에 실패한 경우 기본값 사용
        
        # 손절매 및 이익실현 가격 계산
        if position_type.lower() == 'long':
            stop_loss = entry_price - (atr_value * atr_multiplier)
            take_profit = entry_price + (atr_value * take_profit_atr_multiplier)
        elif position_type.lower() == 'short':
            stop_loss = entry_price + (atr_value * atr_multiplier)
            take_profit = entry_price - (atr_value * take_profit_atr_multiplier)
        else:
            raise ValueError(f"지원하지 않는 포지션 유형: {position_type}")
        
        logger.info(f"ATR 기반 손절/익절 계산: {symbol} @ {entry_price}원, {position_type}, ATR: {atr_value}, 손절: {stop_loss}원, 익절: {take_profit}원")
        return stop_loss, take_profit
    
    def update_exit_points(self,
                          symbol: str,
                          entry_price: float,
                          current_price: float,
                          position_type: str,
                          current_stop: float,
                          current_target: float,
                          market_data: Optional[Dict[str, Any]] = None,
                          risk_params: Optional[Dict[str, Any]] = None) -> Tuple[float, float]:
        """
        ATR 기반 손절매/이익실현 가격 업데이트
        
        Args:
            symbol: 종목코드
            entry_price: 진입 가격
            current_price: 현재 가격
            position_type: 포지션 유형 ('long' 또는 'short')
            current_stop: 현재 손절매 가격
            current_target: 현재 이익실현 가격
            market_data: 시장 데이터 (필수)
            risk_params: 위험 매개변수 (옵션)
            
        Returns:
            (업데이트된 손절매 가격, 현재 이익실현 가격) 튜플
        """
        # ATR 기반 손절매는 새로운 시장 데이터가 있는 경우에만 업데이트
        if market_data and all(k in market_data for k in ['high', 'low', 'close']):
            return self.calculate_exit_points(
                symbol, entry_price, position_type, market_data, risk_params
            )
        
        # 시장 데이터가 없는 경우 현재 값 유지
        return current_stop, current_target 