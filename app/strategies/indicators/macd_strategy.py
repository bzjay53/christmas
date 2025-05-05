"""MACD(Moving Average Convergence Divergence) 기반 매매 전략."""
from typing import List, Optional, Dict, Any, Tuple
import pandas as pd
import numpy as np
import logging

from app.strategies.base_strategy import BaseStrategy, Signal, SignalType

logger = logging.getLogger(__name__)


class MACDStrategy(BaseStrategy):
    """
    MACD(Moving Average Convergence Divergence) 지표를 기반으로 한 매매 전략.
    
    MACD 라인이 시그널 라인을 상향 돌파할 때 매수 신호를 생성하고,
    MACD 라인이 시그널 라인을 하향 돌파할 때 매도 신호를 생성합니다.
    """
    
    def __init__(
        self,
        symbols: List[str],
        fast_period: int = 12,
        slow_period: int = 26,
        signal_period: int = 9,
        name: str = "MACD"
    ):
        """
        MACD 전략을 초기화합니다.
        
        Args:
            symbols: 전략을 적용할 종목 목록
            fast_period: 단기 EMA 기간
            slow_period: 장기 EMA 기간
            signal_period: 시그널 라인 EMA 기간
            name: 전략 이름
        """
        super().__init__(name, symbols)
        self.fast_period = fast_period
        self.slow_period = slow_period
        self.signal_period = signal_period
        
        # 상태 저장용 변수
        self._last_signals: Dict[str, SignalType] = {symbol: SignalType.HOLD for symbol in symbols}
        self._last_histogram: Dict[str, float] = {symbol: 0.0 for symbol in symbols}
    
    def calculate_ema(self, prices: pd.Series, period: int) -> pd.Series:
        """
        주어진 가격으로 지수 이동 평균을 계산합니다.
        
        Args:
            prices: 가격 시리즈
            period: EMA 기간
            
        Returns:
            pd.Series: 계산된 EMA 시리즈
        """
        return prices.ewm(span=period, adjust=False).mean()
    
    def calculate_macd(self, data: pd.DataFrame, column: str = 'close') -> Tuple[pd.Series, pd.Series, pd.Series]:
        """
        주어진 데이터를 기반으로 MACD, 시그널, 히스토그램을 계산합니다.
        
        Args:
            data: OHLCV 데이터프레임
            column: MACD 계산에 사용할 열 이름
            
        Returns:
            Tuple[pd.Series, pd.Series, pd.Series]: MACD 라인, 시그널 라인, 히스토그램
        """
        # 단기 및 장기 EMA 계산
        fast_ema = self.calculate_ema(data[column], self.fast_period)
        slow_ema = self.calculate_ema(data[column], self.slow_period)
        
        # MACD 라인 = 단기 EMA - 장기 EMA
        macd_line = fast_ema - slow_ema
        
        # 시그널 라인 = MACD의 9일 EMA
        signal_line = self.calculate_ema(macd_line, self.signal_period)
        
        # 히스토그램 = MACD 라인 - 시그널 라인
        histogram = macd_line - signal_line
        
        return macd_line, signal_line, histogram
    
    def generate_signals(self, data: pd.DataFrame) -> List[Signal]:
        """
        MACD 지표를 기반으로 매매 신호를 생성합니다.
        
        Args:
            data: OHLCV 데이터프레임
            
        Returns:
            List[Signal]: 생성된 매매 신호 목록
        """
        signals = []
        
        # 종목별로 처리
        for symbol in self.symbols:
            # 해당 종목 데이터 필터링
            symbol_data = data[data['symbol'] == symbol].copy()
            
            if len(symbol_data) < max(self.fast_period, self.slow_period, self.signal_period) + 5:
                logger.warning(f"심볼 {symbol}의 데이터가 충분하지 않습니다 (필요: {max(self.fast_period, self.slow_period, self.signal_period)+5}, 실제: {len(symbol_data)})")
                continue
            
            # MACD 계산
            macd_line, signal_line, histogram = self.calculate_macd(symbol_data)
            
            # 결과를 데이터프레임에 추가
            symbol_data['macd'] = macd_line
            symbol_data['signal'] = signal_line
            symbol_data['histogram'] = histogram
            
            # 마지막 데이터로 신호 생성
            last_row = symbol_data.iloc[-1]
            prev_row = symbol_data.iloc[-2]
            
            last_close = last_row['close']
            last_histogram = last_row['histogram']
            prev_histogram = prev_row['histogram']
            
            timestamp = pd.Timestamp(last_row.name if isinstance(last_row.name, (str, pd.Timestamp)) else last_row['timestamp'])
            
            # 히스토그램 부호 변화 확인
            signal_type = SignalType.HOLD
            confidence = 0.5
            
            # 히스토그램이 음수에서 양수로 변경 -> 매수 신호
            if prev_histogram < 0 and last_histogram > 0:
                signal_type = SignalType.BUY
                confidence = min(1.0, abs(last_histogram) * 10)  # 히스토그램 크기에 기반한 확신도
            
            # 히스토그램이 양수에서 음수로 변경 -> 매도 신호
            elif prev_histogram > 0 and last_histogram < 0:
                signal_type = SignalType.SELL
                confidence = min(1.0, abs(last_histogram) * 10)  # 히스토그램 크기에 기반한 확신도
            
            # 이전 신호와 다를 경우에만 신호 생성
            if signal_type != self._last_signals.get(symbol, SignalType.HOLD) and signal_type != SignalType.HOLD:
                signal = Signal(
                    symbol=symbol,
                    signal_type=signal_type,
                    price=last_close,
                    timestamp=timestamp,
                    confidence=confidence,
                    meta={
                        "macd": last_row['macd'],
                        "signal": last_row['signal'],
                        "histogram": last_histogram
                    }
                )
                signals.append(signal)
                
                # 상태 업데이트
                self._last_signals[symbol] = signal_type
                self._last_histogram[symbol] = last_histogram
        
        return signals
    
    def update(self, data: pd.DataFrame) -> Optional[Signal]:
        """
        새로운 데이터로 전략을 업데이트하고 필요시 신호를 생성합니다.
        
        Args:
            data: 새로운 OHLCV 데이터
            
        Returns:
            Optional[Signal]: 생성된 매매 신호 (없으면 None)
        """
        if not self.is_active:
            return None
        
        signals = self.generate_signals(data)
        return signals[0] if signals else None 