"""자체 학습형 매매 전략 모듈."""

import os
import logging
import json
from typing import Dict, List, Optional, Any, Tuple, Union
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model, save_model
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping

from app.strategies.base_strategy import BaseStrategy, Signal, SignalType
from app.learning.model_manager import ModelManager

# 로깅 설정
logger = logging.getLogger(__name__)

class AdaptiveStrategy(BaseStrategy):
    """
    자체 학습형 매매 전략.
    실제 거래 결과를 바탕으로 지속적으로 학습하며 발전하는 고도화된 전략입니다.
    """
    
    def __init__(
        self, 
        name: str = "adaptive",
        symbols: List[str] = None,
        model_manager: Optional[ModelManager] = None,
        model_id: Optional[str] = None,
        lookback_period: int = 60,
        confidence_threshold: float = 0.7,
        learning_rate: float = 0.001,
        retrain_interval: int = 50,  # 이 횟수만큼 거래 결과가 쌓이면 재학습
    ):
        """
        자체 학습형 전략을 초기화합니다.
        
        Args:
            name: 전략 이름
            symbols: 적용할 종목 코드 목록
            model_manager: 모델 관리자 객체
            model_id: 사용할 모델 ID (None이면 새로 생성)
            lookback_period: 학습 및 예측에 사용할 과거 데이터 기간 (캔들 수)
            confidence_threshold: 매매 시그널 발생 신뢰도 임계값
            learning_rate: 학습률
            retrain_interval: 재학습 간격 (거래 횟수)
        """
        # 기본 전략 초기화
        super().__init__(name=f"adaptive_{name}", symbols=symbols or [])
        
        # 전략 설정
        self.lookback_period = lookback_period
        self.confidence_threshold = confidence_threshold
        self.learning_rate = learning_rate
        self.retrain_interval = retrain_interval
        
        # 모델 관리
        self.model_manager = model_manager or ModelManager()
        self.model_id = model_id or f"adaptive_{name}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # 학습 데이터 관리
        self.trade_history: List[Dict[str, Any]] = []
        self.last_signals: Dict[str, Signal] = {}  # 마지막 생성된 신호 (심볼별)
        
        # 데이터 전처리
        self.scaler = StandardScaler()
        
        # 모델 로드 또는 생성
        self._initialize_model()
        
        # 상태 관리
        self.last_training_time = None
    
    def _initialize_model(self) -> None:
        """모델을 초기화합니다. 기존 모델이 있으면 로드하고, 없으면 새로 생성합니다."""
        # 기존 모델 로드 시도
        model, scaler, metadata = self.model_manager.load_model(self.model_id)
        
        if model is not None:
            self.model = model
            logger.info(f"기존 모델을 로드했습니다: {self.model_id}")
            
            # 스케일러가 있으면 사용
            if scaler is not None:
                self.scaler = scaler
            
            # 거래 이력 로드
            trade_history_id = metadata.get("trade_history_id")
            if trade_history_id:
                history_data, _ = self.model_manager.load_data(trade_history_id)
                if history_data:
                    self.trade_history = history_data
                    logger.info(f"거래 이력을 로드했습니다: {len(self.trade_history)}개")
            
            # 마지막 학습 시간 기록
            self.last_training_time = datetime.fromisoformat(
                metadata.get("last_training_time", datetime.now().isoformat())
            )
        else:
            # 새 모델 생성
            self.model = self._create_model()
            self.last_training_time = datetime.now()
            logger.info(f"새 모델을 생성했습니다: {self.model_id}")
            
            # 모델 저장
            self._save_model()
    
    def _create_model(self) -> tf.keras.Model:
        """새로운 딥러닝 모델을 생성합니다."""
        # 피처 개수 설정 (가격 데이터 + 기술적 지표)
        n_features = 10  # OHLCV + 기본 지표들
        
        # LSTM 모델 구성
        model = Sequential([
            LSTM(50, return_sequences=True, input_shape=(self.lookback_period, n_features)),
            Dropout(0.2),
            LSTM(50, return_sequences=False),
            Dropout(0.2),
            Dense(25, activation='relu'),
            Dense(3, activation='softmax')  # 매수(0), 매도(1), 홀딩(2) 클래스
        ])
        
        # 컴파일
        model.compile(
            optimizer=Adam(learning_rate=self.learning_rate),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def _save_model(self) -> None:
        """현재 모델 상태를 저장합니다."""
        # 거래 이력 저장
        trade_history_id = f"{self.model_id}_trade_history"
        self.model_manager.save_data(trade_history_id, self.trade_history)
        
        # 모델 메타데이터 설정
        metadata = {
            "strategy_name": self.name,
            "symbols": self.symbols,
            "lookback_period": self.lookback_period,
            "confidence_threshold": self.confidence_threshold,
            "learning_rate": self.learning_rate,
            "last_training_time": self.last_training_time.isoformat(),
            "trade_history_id": trade_history_id,
            "trade_history_count": len(self.trade_history),
            "description": "자체 학습형 매매 전략 모델"
        }
        
        # 모델 저장
        self.model_manager.save_model(
            model_id=self.model_id,
            model=self.model,
            scaler=self.scaler,
            metadata=metadata
        )
        
        logger.info(f"모델을 저장했습니다: {self.model_id}")
    
    def generate_signals(self, data: pd.DataFrame) -> List[Signal]:
        """
        시장 데이터를 분석하여 매매 신호를 생성합니다.
        
        Args:
            data: 분석할 시장 데이터 (OHLCV 데이터프레임)
            
        Returns:
            List[Signal]: 생성된 매매 신호 목록
        """
        signals = []
        
        # 심볼별로 그룹화
        data_by_symbol = data.groupby('symbol')
        
        for symbol, df in data_by_symbol:
            # 심볼이 전략 대상인지 확인
            if not self.is_valid_for_symbol(symbol):
                continue
            
            # 데이터 전처리 및 특성 추출
            features = self._prepare_features(df)
            
            # 예측 수행
            prediction = self._predict(features)
            
            if prediction:
                signal_type, confidence, price = prediction
                
                # 신뢰도가 임계값을 넘는 경우에만 신호 생성
                if confidence >= self.confidence_threshold:
                    # 타임스탬프 (최신 데이터의 타임스탬프)
                    timestamp = pd.to_datetime(df['timestamp'].iloc[-1])
                    
                    # 신호 생성
                    signal = Signal(
                        symbol=symbol,
                        signal_type=signal_type,
                        price=price,
                        timestamp=timestamp,
                        confidence=confidence,
                        meta={"strategy": self.name}
                    )
                    
                    signals.append(signal)
                    self.last_signals[symbol] = signal
        
        return signals
    
    def update(self, data: pd.DataFrame) -> Optional[Signal]:
        """
        새로운 데이터가 들어올 때 전략을 업데이트하고 신호를 반환합니다.
        
        Args:
            data: 새로운 시장 데이터 (단일 캔들)
            
        Returns:
            Optional[Signal]: 생성된 매매 신호 (없으면 None)
        """
        # 데이터의 심볼 확인
        symbol = data['symbol'].iloc[0] if 'symbol' in data.columns else None
        if not symbol or not self.is_valid_for_symbol(symbol):
            return None
        
        # 데이터 전처리 및 특성 추출
        features = self._prepare_features(data)
        
        # 특성 데이터가 충분하지 않으면 신호 생성 안함
        if features is None or len(features) < self.lookback_period:
            return None
        
        # 예측 수행
        prediction = self._predict(features)
        
        if prediction:
            signal_type, confidence, price = prediction
            
            # 신뢰도가 임계값을 넘는 경우에만 신호 생성
            if confidence >= self.confidence_threshold:
                # 타임스탬프 (최신 데이터의 타임스탬프)
                timestamp = pd.to_datetime(data['timestamp'].iloc[-1])
                
                # 신호 생성
                signal = Signal(
                    symbol=symbol,
                    signal_type=signal_type,
                    price=price,
                    timestamp=timestamp,
                    confidence=confidence,
                    meta={"strategy": self.name}
                )
                
                self.last_signals[symbol] = signal
                return signal
        
        return None
    
    def _prepare_features(self, data: pd.DataFrame) -> Optional[np.ndarray]:
        """
        학습 및 예측에 사용할 특성을 준비합니다.
        
        Args:
            data: 원시 시장 데이터
            
        Returns:
            Optional[np.ndarray]: 전처리된 특성 데이터
        """
        try:
            # 데이터 복사 및 정렬
            df = data.copy().sort_values('timestamp')
            
            # 데이터 중복 제거
            df = df.drop_duplicates(subset=['timestamp'])
            
            # 데이터가 충분한지 확인
            if len(df) < self.lookback_period:
                logger.warning(f"데이터가 충분하지 않습니다: {len(df)} < {self.lookback_period}")
                return None
            
            # 필요한 기본 컬럼 추출
            required_columns = ['open', 'high', 'low', 'close', 'volume']
            if not all(col in df.columns for col in required_columns):
                logger.error(f"필요한 컬럼이 없습니다: {required_columns}")
                return None
            
            # 기술적 지표 계산
            df = self._calculate_indicators(df)
            
            # 특성 추출 (기술적 지표 포함)
            feature_columns = [
                'open', 'high', 'low', 'close', 'volume',
                'rsi', 'macd', 'macd_signal', 'bb_upper', 'bb_lower'
            ]
            
            # 누락된 지표는 0으로 대체
            for col in feature_columns:
                if col not in df.columns:
                    df[col] = 0
            
            # 특성 배열 생성
            features = df[feature_columns].values
            
            # 데이터 스케일링
            if len(features) > 0:
                # 학습 모드일 때는 스케일러 학습
                if len(self.trade_history) < self.retrain_interval:
                    features = self.scaler.fit_transform(features)
                else:
                    features = self.scaler.transform(features)
                
                # LSTM 입력용 3차원 배열로 변환
                X = []
                for i in range(len(features) - self.lookback_period + 1):
                    X.append(features[i:i + self.lookback_period])
                
                return np.array(X)
            
            return None
        
        except Exception as e:
            logger.error(f"특성 준비 중 오류 발생: {str(e)}")
            return None
    
    def _calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        기술적 지표를 계산합니다.
        
        Args:
            df: 원시 시장 데이터
            
        Returns:
            pd.DataFrame: 기술적 지표가 추가된 데이터프레임
        """
        # 종가 추출
        close = df['close'].values
        
        # RSI 계산 (14일)
        df['rsi'] = self._calculate_rsi(close, period=14)
        
        # MACD 계산 (12, 26, 9)
        df['macd'], df['macd_signal'] = self._calculate_macd(close, fast=12, slow=26, signal=9)
        
        # 볼린저 밴드 계산 (20일, 2시그마)
        df['bb_upper'], df['bb_lower'] = self._calculate_bollinger_bands(close, period=20, std_dev=2)
        
        return df
    
    def _calculate_rsi(self, prices: np.ndarray, period: int = 14) -> np.ndarray:
        """RSI 계산."""
        deltas = np.diff(prices)
        seed = deltas[:period+1]
        up = seed[seed >= 0].sum() / period
        down = -seed[seed < 0].sum() / period
        
        if down == 0:
            rs = float('inf')
        else:
            rs = up / down
        
        rsi = np.zeros_like(prices)
        rsi[:period] = 100. - 100. / (1. + rs)
        
        for i in range(period, len(prices)):
            delta = deltas[i-1]
            
            if delta > 0:
                up_val = delta
                down_val = 0
            else:
                up_val = 0
                down_val = -delta
                
            up = (up * (period - 1) + up_val) / period
            down = (down * (period - 1) + down_val) / period
            
            if down == 0:
                rs = float('inf')
            else:
                rs = up / down
            
            rsi[i] = 100. - 100. / (1. + rs)
            
        return rsi
    
    def _calculate_macd(self, prices: np.ndarray, fast: int = 12, slow: int = 26, 
                       signal: int = 9) -> Tuple[np.ndarray, np.ndarray]:
        """MACD 계산."""
        # EMA 계산 헬퍼 함수
        def ema(prices, period):
            alpha = 2 / (period + 1)
            ema_values = np.zeros_like(prices)
            ema_values[0] = prices[0]
            
            for i in range(1, len(prices)):
                ema_values[i] = alpha * prices[i] + (1 - alpha) * ema_values[i-1]
                
            return ema_values
        
        # 빠른 EMA 및 느린 EMA 계산
        fast_ema = ema(prices, fast)
        slow_ema = ema(prices, slow)
        
        # MACD 라인 계산
        macd_line = fast_ema - slow_ema
        
        # 시그널 라인 계산
        signal_line = ema(macd_line, signal)
        
        return macd_line, signal_line
    
    def _calculate_bollinger_bands(self, prices: np.ndarray, period: int = 20, 
                                  std_dev: float = 2.0) -> Tuple[np.ndarray, np.ndarray]:
        """볼린저 밴드 계산."""
        # 이동평균 계산
        sma = np.zeros_like(prices)
        upper_band = np.zeros_like(prices)
        lower_band = np.zeros_like(prices)
        
        for i in range(period - 1, len(prices)):
            window = prices[i - period + 1:i + 1]
            sma[i] = np.mean(window)
            std = np.std(window)
            upper_band[i] = sma[i] + std_dev * std
            lower_band[i] = sma[i] - std_dev * std
            
        # 초기값 설정
        sma[:period - 1] = sma[period - 1]
        upper_band[:period - 1] = upper_band[period - 1]
        lower_band[:period - 1] = lower_band[period - 1]
        
        return upper_band, lower_band
    
    def _predict(self, features: Optional[np.ndarray]) -> Optional[Tuple[SignalType, float, float]]:
        """
        모델을 사용하여 신호를 예측합니다.
        
        Args:
            features: 전처리된 특성 데이터
            
        Returns:
            Optional[Tuple[SignalType, float, float]]: 신호 유형, 신뢰도, 가격
        """
        if features is None or len(features) == 0:
            return None
        
        try:
            # 마지막 시퀀스만 사용
            X = features[-1:].reshape(1, self.lookback_period, -1)
            
            # 예측 수행
            predictions = self.model.predict(X, verbose=0)[0]
            
            # 가장 높은 확률의 클래스 찾기
            max_prob_idx = np.argmax(predictions)
            confidence = predictions[max_prob_idx]
            
            # 신호 유형 결정
            signal_types = [SignalType.BUY, SignalType.SELL, SignalType.HOLD]
            signal_type = signal_types[max_prob_idx]
            
            # 가격 도출 (마지막 캔들의 종가)
            # features는 이미 스케일링되어 있으므로 원래 스케일로 복원
            last_candle = features[-1, -1].reshape(1, -1)
            last_candle_original = self.scaler.inverse_transform(last_candle)
            price = last_candle_original[0, 3]  # 종가 인덱스 (3)
            
            return signal_type, float(confidence), float(price)
            
        except Exception as e:
            logger.error(f"예측 중 오류 발생: {str(e)}")
            return None
    
    def add_trade_result(self, trade_data: Dict[str, Any], result: float) -> None:
        """
        거래 결과를 추가하고 필요시 모델을 재학습합니다.
        
        Args:
            trade_data: 거래 데이터 (시장 데이터, 신호 정보 등)
            result: 거래 결과 (수익률)
        """
        # 거래 결과 저장
        trade_result = {
            "trade_data": trade_data,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
        
        self.trade_history.append(trade_result)
        logger.info(f"거래 결과 추가: 결과={result:.4f}, 총 {len(self.trade_history)}개")
        
        # 충분한 데이터가 쌓이면 재학습
        if len(self.trade_history) >= self.retrain_interval:
            self.retrain()
    
    def retrain(self) -> None:
        """누적된 거래 결과를 바탕으로 모델을 재학습합니다."""
        if len(self.trade_history) < self.retrain_interval:
            logger.info(f"재학습을 위한 충분한 데이터가 없습니다: {len(self.trade_history)} < {self.retrain_interval}")
            return
        
        try:
            logger.info("모델 재학습 시작")
            
            # 학습 데이터 준비
            X_train, y_train = self._prepare_training_data()
            
            if X_train is None or len(X_train) == 0:
                logger.warning("유효한 학습 데이터가 없습니다.")
                return
            
            # 조기 종료 콜백
            early_stopping = EarlyStopping(
                monitor='val_accuracy',
                patience=5,
                restore_best_weights=True
            )
            
            # 모델 학습
            self.model.fit(
                X_train, y_train,
                epochs=30,
                batch_size=32,
                validation_split=0.2,
                callbacks=[early_stopping],
                verbose=0
            )
            
            # 학습 시간 기록
            self.last_training_time = datetime.now()
            
            # 모델 저장
            self._save_model()
            
            logger.info("모델 재학습 완료")
            
        except Exception as e:
            logger.error(f"모델 재학습 중 오류 발생: {str(e)}")
    
    def _prepare_training_data(self) -> Tuple[Optional[np.ndarray], Optional[np.ndarray]]:
        """
        거래 이력에서 학습 데이터를 준비합니다.
        
        Returns:
            Tuple[Optional[np.ndarray], Optional[np.ndarray]]: 학습 데이터(X) 및 레이블(y)
        """
        X_data = []
        y_data = []
        
        try:
            for trade in self.trade_history:
                # 거래 데이터 및 결과 추출
                trade_data = trade["trade_data"]
                result = trade["result"]
                
                # 특성 데이터 추출
                if "market_data" in trade_data:
                    market_df = pd.DataFrame(trade_data["market_data"])
                    features = self._prepare_features(market_df)
                    
                    if features is not None and len(features) > 0:
                        # 마지막 시퀀스만 사용
                        X_data.append(features[-1])
                        
                        # 레이블 생성 (수익률에 따라 매수/매도/홀딩 결정)
                        if result > 0.01:  # 1% 이상 수익
                            label = [1, 0, 0]  # 매수
                        elif result < -0.01:  # 1% 이상 손실
                            label = [0, 1, 0]  # 매도
                        else:
                            label = [0, 0, 1]  # 홀딩
                        
                        y_data.append(label)
            
            if len(X_data) > 0:
                return np.array(X_data), np.array(y_data)
            
            return None, None
            
        except Exception as e:
            logger.error(f"학습 데이터 준비 중 오류 발생: {str(e)}")
            return None, None
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """
        전략의 성능 통계를 반환합니다.
        
        Returns:
            Dict[str, Any]: 성능 통계 정보
        """
        if not self.trade_history:
            return {"message": "거래 이력이 없습니다."}
        
        try:
            # 결과 추출
            results = [trade["result"] for trade in self.trade_history]
            
            # 승률 계산
            wins = sum(1 for r in results if r > 0)
            losses = sum(1 for r in results if r < 0)
            total = len(results)
            
            win_rate = wins / total if total > 0 else 0
            
            # 수익률 계산
            avg_return = np.mean(results) if results else 0
            max_return = max(results) if results else 0
            min_return = min(results) if results else 0
            
            # 통계 반환
            return {
                "strategy_name": self.name,
                "model_id": self.model_id,
                "total_trades": total,
                "win_count": wins,
                "loss_count": losses,
                "win_rate": win_rate,
                "average_return": avg_return,
                "max_return": max_return,
                "min_return": min_return,
                "last_training": self.last_training_time.isoformat() if self.last_training_time else None
            }
            
        except Exception as e:
            logger.error(f"성능 통계 계산 중 오류 발생: {str(e)}")
            return {"error": str(e)} 