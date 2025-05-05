import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Union
import logging

# 로깅 설정
logger = logging.getLogger(__name__)

class TechnicalIndicators:
    """
    기술적 지표 계산 클래스.
    차트 데이터를 기반으로 RSI, MACD, 볼린저 밴드 등의 지표를 계산합니다.
    """
    
    @staticmethod
    def calculate_rsi(prices: List[float], period: int = 14) -> List[Optional[float]]:
        """
        상대강도지수(RSI) 계산
        
        Args:
            prices: 종가 리스트
            period: 기간 (기본값: 14)
            
        Returns:
            RSI 값 리스트 (0-100 사이의 값)
        """
        if len(prices) < period + 1:
            return [None] * len(prices)
            
        # 가격 변화 계산
        delta = np.diff(prices)
        
        # 상승/하락 구분
        gain = np.where(delta > 0, delta, 0)
        loss = np.where(delta < 0, -delta, 0)
        
        # 평균 상승/하락 계산
        avg_gain = np.zeros_like(delta)
        avg_loss = np.zeros_like(delta)
        
        # 첫 번째 평균값 계산
        avg_gain[period - 1] = np.mean(gain[:period])
        avg_loss[period - 1] = np.mean(loss[:period])
        
        # 나머지 평균값 계산 (스무딩)
        for i in range(period, len(delta)):
            avg_gain[i] = (avg_gain[i - 1] * (period - 1) + gain[i]) / period
            avg_loss[i] = (avg_loss[i - 1] * (period - 1) + loss[i]) / period
        
        # RSI 계산
        rs = avg_gain / np.where(avg_loss == 0, 1e-10, avg_loss)  # 0으로 나누기 방지
        rsi = 100 - (100 / (1 + rs))
        
        # 결과 포맷팅
        result = [None] * period + list(rsi[period - 1:])
        return result
    
    @staticmethod
    def calculate_macd(
        prices: List[float],
        fast_period: int = 12,
        slow_period: int = 26,
        signal_period: int = 9
    ) -> Dict[str, List[Optional[float]]]:
        """
        이동평균수렴확산지수(MACD) 계산
        
        Args:
            prices: 종가 리스트
            fast_period: 단기 이동평균 기간 (기본값: 12)
            slow_period: 장기 이동평균 기간 (기본값: 26)
            signal_period: 시그널 이동평균 기간 (기본값: 9)
            
        Returns:
            MACD, Signal, Histogram 값을 포함하는 딕셔너리
        """
        if len(prices) < slow_period + signal_period:
            empty = [None] * len(prices)
            return {"macd": empty, "signal": empty, "histogram": empty}
            
        # 지수이동평균(EMA) 계산
        ema_fast = TechnicalIndicators.calculate_ema(prices, fast_period)
        ema_slow = TechnicalIndicators.calculate_ema(prices, slow_period)
        
        # MACD 계산 (빠른 EMA - 느린 EMA)
        macd = []
        for i in range(len(prices)):
            if ema_fast[i] is not None and ema_slow[i] is not None:
                macd.append(ema_fast[i] - ema_slow[i])
            else:
                macd.append(None)
        
        # 시그널 라인 계산 (MACD의 EMA)
        macd_values = [x for x in macd if x is not None]
        signal = [None] * (len(prices) - len(macd_values)) + TechnicalIndicators.calculate_ema(macd_values, signal_period)
        
        # 히스토그램 계산 (MACD - 시그널)
        histogram = []
        for i in range(len(prices)):
            if macd[i] is not None and signal[i] is not None:
                histogram.append(macd[i] - signal[i])
            else:
                histogram.append(None)
        
        return {
            "macd": macd,
            "signal": signal,
            "histogram": histogram
        }
    
    @staticmethod
    def calculate_bollinger_bands(
        prices: List[float],
        period: int = 20,
        std_dev: float = 2.0
    ) -> Dict[str, List[Optional[float]]]:
        """
        볼린저 밴드 계산
        
        Args:
            prices: 종가 리스트
            period: 이동평균 기간 (기본값: 20)
            std_dev: 표준편차 승수 (기본값: 2.0)
            
        Returns:
            상단, 중앙, 하단 밴드 값을 포함하는 딕셔너리
        """
        if len(prices) < period:
            empty = [None] * len(prices)
            return {"upper": empty, "middle": empty, "lower": empty}
            
        # 중앙 밴드 (단순이동평균)
        middle_band = TechnicalIndicators.calculate_sma(prices, period)
        
        # 표준편차 계산
        rolling_std = []
        for i in range(len(prices)):
            if i < period - 1:
                rolling_std.append(None)
            else:
                window = prices[i - (period - 1):i + 1]
                std = np.std(window, ddof=1)  # 표본 표준편차 (ddof=1)
                rolling_std.append(std)
        
        # 상단 및 하단 밴드 계산
        upper_band = []
        lower_band = []
        
        for i in range(len(prices)):
            if middle_band[i] is not None and rolling_std[i] is not None:
                upper_band.append(middle_band[i] + (std_dev * rolling_std[i]))
                lower_band.append(middle_band[i] - (std_dev * rolling_std[i]))
            else:
                upper_band.append(None)
                lower_band.append(None)
        
        return {
            "upper": upper_band,
            "middle": middle_band,
            "lower": lower_band
        }
    
    @staticmethod
    def calculate_sma(prices: List[float], period: int) -> List[Optional[float]]:
        """
        단순이동평균(SMA) 계산
        
        Args:
            prices: 종가 리스트
            period: 기간
            
        Returns:
            SMA 값 리스트
        """
        result = []
        for i in range(len(prices)):
            if i < period - 1:
                result.append(None)
            else:
                window = prices[i - (period - 1):i + 1]
                sma = sum(window) / period
                result.append(sma)
        return result
    
    @staticmethod
    def calculate_ema(prices: List[float], period: int) -> List[Optional[float]]:
        """
        지수이동평균(EMA) 계산
        
        Args:
            prices: 종가 리스트
            period: 기간
            
        Returns:
            EMA 값 리스트
        """
        if len(prices) < period:
            return [None] * len(prices)
            
        k = 2 / (period + 1)  # 스무딩 팩터
        
        # 첫 번째 EMA는 SMA로 계산
        ema = [None] * (period - 1)
        ema.append(sum(prices[:period]) / period)
        
        # 나머지 EMA 계산
        for i in range(period, len(prices)):
            ema.append(prices[i] * k + ema[-1] * (1 - k))
        
        return ema
    
    @staticmethod
    def calculate_all_indicators(candles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        모든 기술적 지표 계산
        
        Args:
            candles: 캔들 데이터 리스트 (각 캔들은 open, high, low, close, volume, timestamp를 포함)
            
        Returns:
            계산된 모든 지표를 포함하는 딕셔너리
        """
        # 데이터프레임으로 변환
        df = pd.DataFrame(candles)
        
        # 시간순으로 정렬 (오래된 데이터가 먼저 오도록)
        df = df.sort_values("timestamp")
        
        # 종가 리스트 추출
        close_prices = df["close"].tolist()
        
        # 각 지표 계산
        rsi = TechnicalIndicators.calculate_rsi(close_prices)
        macd = TechnicalIndicators.calculate_macd(close_prices)
        bb = TechnicalIndicators.calculate_bollinger_bands(close_prices)
        
        # 결과를 데이터프레임에 추가
        result_df = df.copy()
        result_df["rsi"] = rsi
        result_df["macd"] = macd["macd"]
        result_df["macd_signal"] = macd["signal"]
        result_df["macd_histogram"] = macd["histogram"]
        result_df["bb_upper"] = bb["upper"]
        result_df["bb_middle"] = bb["middle"]
        result_df["bb_lower"] = bb["lower"]
        
        # 원래 시간 순서로 정렬
        result_df = result_df.sort_values("timestamp", ascending=False)
        
        # 딕셔너리 형태로 반환
        return result_df.to_dict("records") 