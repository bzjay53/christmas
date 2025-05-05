"""매매 전략의 기본 모델과 인터페이스를 정의합니다."""
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Union, Any
from enum import Enum
import pandas as pd
import numpy as np


class SignalType(Enum):
    """매매 신호 유형을 정의하는 열거형."""
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"


class Signal:
    """매매 신호 클래스."""
    
    def __init__(
        self,
        symbol: str,
        signal_type: SignalType,
        price: float,
        timestamp: pd.Timestamp,
        confidence: float = 1.0,
        meta: Optional[Dict[str, Any]] = None
    ):
        """
        매매 신호 객체를 초기화합니다.
        
        Args:
            symbol: 매매 대상 종목의 심볼
            signal_type: 매매 신호 유형 (매수/매도/보유)
            price: 신호 발생 시점의 가격
            timestamp: 신호 발생 시점의 타임스탬프
            confidence: 신호의 확신도 (0.0-1.0)
            meta: 추가 메타데이터
        """
        self.symbol = symbol
        self.signal_type = signal_type
        self.price = price
        self.timestamp = timestamp
        self.confidence = min(max(confidence, 0.0), 1.0)  # 0.0-1.0 범위로 제한
        self.meta = meta or {}
    
    def __str__(self) -> str:
        return f"Signal({self.symbol}, {self.signal_type.value}, {self.price}, {self.timestamp}, conf={self.confidence:.2f})"
    
    def to_dict(self) -> Dict[str, Any]:
        """신호를 사전 형태로 변환합니다."""
        return {
            "symbol": self.symbol,
            "signal_type": self.signal_type.value,
            "price": self.price,
            "timestamp": self.timestamp.isoformat(),
            "confidence": self.confidence,
            "meta": self.meta
        }


class BaseStrategy(ABC):
    """모든 매매 전략의 기본 추상 클래스."""
    
    def __init__(self, name: str, symbols: List[str]):
        """
        전략의 기본 정보를 초기화합니다.
        
        Args:
            name: 전략의 이름
            symbols: 전략이 적용될 종목 심볼 목록
        """
        self.name = name
        self.symbols = symbols
        self.is_active = False
    
    @abstractmethod
    def generate_signals(self, data: pd.DataFrame) -> List[Signal]:
        """
        주어진 데이터를 기반으로 매매 신호를 생성합니다.
        
        Args:
            data: 분석할 시장 데이터 (OHLCV 데이터프레임)
            
        Returns:
            List[Signal]: 생성된 매매 신호 목록
        """
        pass
    
    @abstractmethod
    def update(self, data: pd.DataFrame) -> Optional[Signal]:
        """
        새로운 데이터가 들어올 때 전략을 업데이트하고 신호를 반환합니다.
        
        Args:
            data: 새로운 시장 데이터
            
        Returns:
            Optional[Signal]: 생성된 매매 신호 (없으면 None)
        """
        pass
    
    def activate(self) -> None:
        """전략을 활성화합니다."""
        self.is_active = True
    
    def deactivate(self) -> None:
        """전략을 비활성화합니다."""
        self.is_active = False
    
    def is_valid_for_symbol(self, symbol: str) -> bool:
        """주어진 심볼에 대해 이 전략이 유효한지 확인합니다."""
        return symbol in self.symbols
    
    def __str__(self) -> str:
        status = "active" if self.is_active else "inactive"
        return f"{self.name} Strategy ({status}) for {', '.join(self.symbols)}"


class StrategyPerformance:
    """전략의 성능을 추적하고 평가하는 클래스."""
    
    def __init__(self, strategy_name: str):
        """
        전략 성능 추적 객체를 초기화합니다.
        
        Args:
            strategy_name: 전략의 이름
        """
        self.strategy_name = strategy_name
        self.signals: List[Signal] = []
        self.trades: List[Dict[str, Any]] = []
        self.win_count = 0
        self.loss_count = 0
        self.total_profit = 0.0
        self.total_loss = 0.0
    
    def add_signal(self, signal: Signal) -> None:
        """신호를 추가합니다."""
        self.signals.append(signal)
    
    def add_trade(self, trade: Dict[str, Any]) -> None:
        """거래 결과를 추가합니다."""
        self.trades.append(trade)
        
        # 성공/실패 통계 업데이트
        if trade.get("profit", 0) > 0:
            self.win_count += 1
            self.total_profit += trade.get("profit", 0)
        else:
            self.loss_count += 1
            self.total_loss += abs(trade.get("profit", 0))
    
    def get_win_rate(self) -> float:
        """승률을 계산합니다."""
        total_trades = self.win_count + self.loss_count
        return self.win_count / total_trades if total_trades > 0 else 0.0
    
    def get_profit_factor(self) -> float:
        """수익률 팩터를 계산합니다."""
        return self.total_profit / self.total_loss if self.total_loss > 0 else float('inf')
    
    def get_average_profit(self) -> float:
        """평균 수익을 계산합니다."""
        total_trades = self.win_count + self.loss_count
        return (self.total_profit - self.total_loss) / total_trades if total_trades > 0 else 0.0
    
    def get_statistics(self) -> Dict[str, Any]:
        """전략 성능 통계를 반환합니다."""
        total_trades = self.win_count + self.loss_count
        
        return {
            "strategy_name": self.strategy_name,
            "total_trades": total_trades,
            "win_count": self.win_count,
            "loss_count": self.loss_count,
            "win_rate": self.get_win_rate(),
            "total_profit": self.total_profit,
            "total_loss": self.total_loss,
            "net_profit": self.total_profit - self.total_loss,
            "profit_factor": self.get_profit_factor(),
            "average_profit": self.get_average_profit()
        } 