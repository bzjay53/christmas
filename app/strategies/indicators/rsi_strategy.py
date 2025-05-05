"""RSI(Relative Strength Index) 기반 매매 전략."""
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
import logging

from app.strategies.base_strategy import BaseStrategy, Signal, SignalType

logger = logging.getLogger(__name__)


class RSIStrategy(BaseStrategy):
    """
    RSI(Relative Strength Index) 지표를 기반으로 한 매매 전략.
    
    RSI가 과매수 기준(70 이상)을 넘으면 매도 신호를 생성하고,
    RSI가 과매도 기준(30 이하)을 넘으면 매수 신호를 생성합니다.
    """
    
    def __init__(
        self,
        symbols: List[str],
        rsi_period: int = 14,
        overbought_threshold: float = 70.0,
        oversold_threshold: float = 30.0,
        name: str = "RSI"
    ):
        """
        RSI 전략을 초기화합니다.
        
        Args:
            symbols: 전략을 적용할 종목 목록
            rsi_period: RSI 계산에 사용할 기간
            overbought_threshold: 과매수 기준점
            oversold_threshold: 과매도 기준점
            name: 전략 이름
        """
        super().__init__(name, symbols)
        self.rsi_period = rsi_period
        self.overbought_threshold = overbought_threshold
        self.oversold_threshold = oversold_threshold
        
        # 상태 저장용 변수
        self._last_signals: Dict[str, SignalType] = {symbol: SignalType.HOLD for symbol in symbols}
    
    def calculate_rsi(self, data: pd.DataFrame, column: str = 'close') -> pd.Series:
        """
        주어진 데이터를 기반으로 RSI 값을 계산합니다.
        
        Args:
            data: OHLCV 데이터프레임
            column: RSI 계산에 사용할 열 이름
            
        Returns:
            pd.Series: 계산된 RSI 값 시리즈
        """
        # 가격 변화 계산
        delta = data[column].diff()
        
        # 상승과 하락 분리
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        
        # 첫 번째 평균 계산
        avg_gain = gain.rolling(window=self.rsi_period).mean()
        avg_loss = loss.rolling(window=self.rsi_period).mean()
        
        # 후속 평균 계산
        for i in range(self.rsi_period, len(delta)):
            avg_gain.iloc[i] = (avg_gain.iloc[i-1] * (self.rsi_period-1) + gain.iloc[i]) / self.rsi_period
            avg_loss.iloc[i] = (avg_loss.iloc[i-1] * (self.rsi_period-1) + loss.iloc[i]) / self.rsi_period
        
        # 상대 강도 (RS) 계산
        rs = avg_gain / avg_loss.replace(0, np.finfo(float).eps)  # 0으로 나누기 방지
        
        # RSI 계산
        rsi = 100 - (100 / (1 + rs))
        
        return rsi
    
    def generate_signals(self, data: pd.DataFrame) -> List[Signal]:
        """
        RSI 지표를 기반으로 매매 신호를 생성합니다.
        
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
            
            if len(symbol_data) < self.rsi_period + 1:
                logger.warning(f"심볼 {symbol}의 데이터가 충분하지 않습니다 (필요: {self.rsi_period+1}, 실제: {len(symbol_data)})")
                continue
            
            # RSI 계산
            symbol_data['rsi'] = self.calculate_rsi(symbol_data)
            
            # 마지막 RSI 값으로 신호 생성
            last_row = symbol_data.iloc[-1]
            last_rsi = last_row['rsi']
            last_close = last_row['close']
            timestamp = pd.Timestamp(last_row.name if isinstance(last_row.name, (str, pd.Timestamp)) else last_row['timestamp'])
            
            # 신호 유형 결정
            if last_rsi <= self.oversold_threshold:
                signal_type = SignalType.BUY
                confidence = min(1.0, (self.oversold_threshold - last_rsi) / 10)  # 과매도 정도에 따른 확신도
            elif last_rsi >= self.overbought_threshold:
                signal_type = SignalType.SELL
                confidence = min(1.0, (last_rsi - self.overbought_threshold) / 10)  # 과매수 정도에 따른 확신도
            else:
                signal_type = SignalType.HOLD
                # 중간 영역에서는 RSI가 중앙값(50)에서 멀수록 확신도가 높아짐
                confidence = 1.0 - (abs(last_rsi - 50) / 20)
            
            # 이전 신호와 다를 경우에만 신호 생성
            if signal_type != self._last_signals.get(symbol, SignalType.HOLD) and signal_type != SignalType.HOLD:
                signal = Signal(
                    symbol=symbol,
                    signal_type=signal_type,
                    price=last_close,
                    timestamp=timestamp,
                    confidence=confidence,
                    meta={"rsi": last_rsi}
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