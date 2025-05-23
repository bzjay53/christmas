"""
간단한 기술적 지표 계산 라이브러리
TA-Lib 대신 사용하는 자체 구현 버전
"""
import numpy as np
from typing import Tuple, List

class SimpleIndicators:
    """기술적 지표 계산 클래스"""
    
    @staticmethod
    def sma(prices: np.array, period: int) -> np.array:
        """단순 이동평균 (Simple Moving Average)"""
        if len(prices) < period:
            return np.array([prices[-1]] * len(prices))
        
        sma_values = []
        for i in range(len(prices)):
            if i < period - 1:
                sma_values.append(np.mean(prices[:i+1]))
            else:
                sma_values.append(np.mean(prices[i-period+1:i+1]))
        
        return np.array(sma_values)
    
    @staticmethod
    def ema(prices: np.array, period: int) -> np.array:
        """지수 이동평균 (Exponential Moving Average)"""
        if len(prices) == 0:
            return np.array([])
        
        ema_values = [prices[0]]
        multiplier = 2 / (period + 1)
        
        for price in prices[1:]:
            ema_value = (price * multiplier) + (ema_values[-1] * (1 - multiplier))
            ema_values.append(ema_value)
        
        return np.array(ema_values)
    
    @staticmethod
    def rsi(prices: np.array, period: int = 14) -> float:
        """상대강도지수 (Relative Strength Index)"""
        if len(prices) < period + 1:
            return 50.0
        
        deltas = np.diff(prices)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        
        avg_gain = np.mean(gains[-period:])
        avg_loss = np.mean(losses[-period:])
        
        if avg_loss == 0:
            return 100.0
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        return rsi
    
    @staticmethod
    def macd(prices: np.array, fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[float, float, float]:
        """MACD (Moving Average Convergence Divergence)"""
        if len(prices) < slow:
            return 0.0, 0.0, 0.0
        
        ema_fast = SimpleIndicators.ema(prices, fast)
        ema_slow = SimpleIndicators.ema(prices, slow)
        
        macd_line = ema_fast - ema_slow
        
        if len(macd_line) < signal:
            signal_line = macd_line[-1]
        else:
            signal_line = SimpleIndicators.ema(macd_line, signal)[-1]
        
        histogram = macd_line[-1] - signal_line
        
        return macd_line[-1], signal_line, histogram
    
    @staticmethod
    def bollinger_bands(prices: np.array, period: int = 20, std_dev: float = 2.0) -> Tuple[float, float, float]:
        """볼린저 밴드 (Bollinger Bands)"""
        if len(prices) < period:
            return prices[-1], prices[-1], prices[-1]
        
        sma = SimpleIndicators.sma(prices, period)
        
        # 최근 period개 가격의 표준편차
        recent_prices = prices[-period:]
        std = np.std(recent_prices)
        
        middle = sma[-1]
        upper = middle + (std * std_dev)
        lower = middle - (std * std_dev)
        
        return upper, middle, lower 