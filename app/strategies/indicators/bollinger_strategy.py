"""볼린저 밴드 기반 매매 전략."""
from typing import List, Optional, Dict, Any, Tuple
import pandas as pd
import numpy as np
import logging

from app.strategies.base_strategy import BaseStrategy, Signal, SignalType

logger = logging.getLogger(__name__)


class BollingerStrategy(BaseStrategy):
    """
    볼린저 밴드 지표를 기반으로 한 매매 전략.
    
    가격이 하단 밴드를 돌파하면 매수 신호를 생성하고,
    가격이 상단 밴드를 돌파하면 매도 신호를 생성합니다.
    """
    
    def __init__(
        self,
        symbols: List[str],
        period: int = 20,
        num_std: float = 2.0,
        name: str = "Bollinger Bands"
    ):
        """
        볼린저 밴드 전략을 초기화합니다.
        
        Args:
            symbols: 전략을 적용할 종목 목록
            period: 이동평균 기간
            num_std: 표준편차 승수
            name: 전략 이름
        """
        super().__init__(name, symbols)
        self.period = period
        self.num_std = num_std
        
        # 상태 저장용 변수
        self._last_signals: Dict[str, SignalType] = {symbol: SignalType.HOLD for symbol in symbols}
    
    def calculate_bollinger_bands(self, data: pd.DataFrame, column: str = 'close') -> Tuple[pd.Series, pd.Series, pd.Series]:
        """
        주어진 데이터를 기반으로 볼린저 밴드를 계산합니다.
        
        Args:
            data: OHLCV 데이터프레임
            column: 볼린저 밴드 계산에 사용할 열 이름
            
        Returns:
            Tuple[pd.Series, pd.Series, pd.Series]: 중간 밴드(SMA), 상단 밴드, 하단 밴드
        """
        # 중간 밴드 (SMA)
        middle_band = data[column].rolling(window=self.period).mean()
        
        # 표준편차
        std = data[column].rolling(window=self.period).std()
        
        # 상단 밴드
        upper_band = middle_band + (std * self.num_std)
        
        # 하단 밴드
        lower_band = middle_band - (std * self.num_std)
        
        return middle_band, upper_band, lower_band
    
    def generate_signals(self, data: pd.DataFrame) -> List[Signal]:
        """
        볼린저 밴드 지표를 기반으로 매매 신호를 생성합니다.
        
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
            
            if len(symbol_data) < self.period + 1:
                logger.warning(f"심볼 {symbol}의 데이터가 충분하지 않습니다 (필요: {self.period+1}, 실제: {len(symbol_data)})")
                continue
            
            # 볼린저 밴드 계산
            middle_band, upper_band, lower_band = self.calculate_bollinger_bands(symbol_data)
            
            # 결과를 데이터프레임에 추가
            symbol_data['middle_band'] = middle_band
            symbol_data['upper_band'] = upper_band
            symbol_data['lower_band'] = lower_band
            
            # 현재와 이전 데이터
            last_row = symbol_data.iloc[-1]
            prev_row = symbol_data.iloc[-2]
            
            last_close = last_row['close']
            prev_close = prev_row['close']
            last_upper = last_row['upper_band']
            last_lower = last_row['lower_band']
            prev_upper = prev_row['upper_band']
            prev_lower = prev_row['lower_band']
            
            timestamp = pd.Timestamp(last_row.name if isinstance(last_row.name, (str, pd.Timestamp)) else last_row['timestamp'])
            
            # 기본값은 HOLD
            signal_type = SignalType.HOLD
            confidence = 0.5
            
            # 상단 밴드 돌파 감지 (매도 신호)
            if prev_close <= prev_upper and last_close > last_upper:
                signal_type = SignalType.SELL
                # 돌파 정도에 따른 확신도
                confidence = min(1.0, (last_close - last_upper) / (last_upper - last_row['middle_band']) * 0.5 + 0.5)
            
            # 하단 밴드 돌파 감지 (매수 신호)
            elif prev_close >= prev_lower and last_close < last_lower:
                signal_type = SignalType.BUY
                # 돌파 정도에 따른 확신도
                confidence = min(1.0, (last_lower - last_close) / (last_row['middle_band'] - last_lower) * 0.5 + 0.5)
            
            # 또는, 밴드 내에서 극단값에 가까울 때도 신호 생성 가능
            elif last_close > last_row['middle_band'] and last_close >= last_upper * 0.98:
                signal_type = SignalType.SELL
                # 상단 밴드 접근 정도에 따른 확신도
                confidence = min(1.0, (last_close - last_row['middle_band']) / (last_upper - last_row['middle_band']))
            
            elif last_close < last_row['middle_band'] and last_close <= last_lower * 1.02:
                signal_type = SignalType.BUY
                # 하단 밴드 접근 정도에 따른 확신도
                confidence = min(1.0, (last_row['middle_band'] - last_close) / (last_row['middle_band'] - last_lower))
            
            # 이전 신호와 다를 경우에만 신호 생성
            if signal_type != self._last_signals.get(symbol, SignalType.HOLD) and signal_type != SignalType.HOLD:
                # %B 값 계산 (0 = 하단 밴드, 1 = 상단 밴드)
                percent_b = (last_close - last_lower) / (last_upper - last_lower) if (last_upper - last_lower) != 0 else 0.5
                
                signal = Signal(
                    symbol=symbol,
                    signal_type=signal_type,
                    price=last_close,
                    timestamp=timestamp,
                    confidence=confidence,
                    meta={
                        "middle_band": last_row['middle_band'],
                        "upper_band": last_upper,
                        "lower_band": last_lower,
                        "percent_b": percent_b
                    }
                )
                signals.append(signal)
                
                # 상태 업데이트
                self._last_signals[symbol] = signal_type
        
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