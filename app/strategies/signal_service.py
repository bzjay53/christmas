"""매매 신호 생성 및 관리 서비스."""
from typing import Dict, List, Optional, Any, Set
import logging
import pandas as pd
from concurrent.futures import ThreadPoolExecutor
import time

from app.strategies.base_strategy import BaseStrategy, Signal, SignalType

logger = logging.getLogger(__name__)


class SignalService:
    """
    여러 매매 전략을 관리하고 매매 신호를 생성하는 서비스.
    """
    
    def __init__(self, max_workers: int = 10):
        """
        신호 서비스를 초기화합니다.
        
        Args:
            max_workers: 동시에 실행할 최대 스레드 수
        """
        self.strategies: Dict[str, BaseStrategy] = {}
        self.signals: List[Signal] = []
        self.max_workers = max_workers
        self.watched_symbols: Set[str] = set()
    
    def register_strategy(self, strategy: BaseStrategy) -> None:
        """
        매매 전략을 등록합니다.
        
        Args:
            strategy: 등록할 전략 객체
        """
        self.strategies[strategy.name] = strategy
        logger.info(f"전략 '{strategy.name}'이(가) 등록되었습니다.")
        
        # 감시 대상 심볼 업데이트
        self.watched_symbols.update(strategy.symbols)
    
    def unregister_strategy(self, strategy_name: str) -> bool:
        """
        등록된 매매 전략을 제거합니다.
        
        Args:
            strategy_name: 제거할 전략의 이름
            
        Returns:
            bool: 성공적으로 제거되었는지 여부
        """
        if strategy_name in self.strategies:
            strategy = self.strategies.pop(strategy_name)
            logger.info(f"전략 '{strategy_name}'이(가) 제거되었습니다.")
            
            # 감시 대상 심볼 재계산
            self.watched_symbols = set()
            for s in self.strategies.values():
                self.watched_symbols.update(s.symbols)
                
            return True
        
        logger.warning(f"전략 '{strategy_name}'을(를) 제거할 수 없습니다. 존재하지 않는 전략입니다.")
        return False
    
    def activate_strategy(self, strategy_name: str) -> bool:
        """
        등록된 매매 전략을 활성화합니다.
        
        Args:
            strategy_name: 활성화할 전략의 이름
            
        Returns:
            bool: 성공적으로 활성화되었는지 여부
        """
        if strategy_name in self.strategies:
            self.strategies[strategy_name].activate()
            logger.info(f"전략 '{strategy_name}'이(가) 활성화되었습니다.")
            return True
        
        logger.warning(f"전략 '{strategy_name}'을(를) 활성화할 수 없습니다. 존재하지 않는 전략입니다.")
        return False
    
    def deactivate_strategy(self, strategy_name: str) -> bool:
        """
        등록된 매매 전략을 비활성화합니다.
        
        Args:
            strategy_name: 비활성화할 전략의 이름
            
        Returns:
            bool: 성공적으로 비활성화되었는지 여부
        """
        if strategy_name in self.strategies:
            self.strategies[strategy_name].deactivate()
            logger.info(f"전략 '{strategy_name}'이(가) 비활성화되었습니다.")
            return True
        
        logger.warning(f"전략 '{strategy_name}'을(를) 비활성화할 수 없습니다. 존재하지 않는 전략입니다.")
        return False
    
    def get_active_strategies(self) -> List[BaseStrategy]:
        """
        활성화된 모든 전략 목록을 반환합니다.
        
        Returns:
            List[BaseStrategy]: 활성화된 전략 목록
        """
        return [s for s in self.strategies.values() if s.is_active]
    
    def get_strategy(self, strategy_name: str) -> Optional[BaseStrategy]:
        """
        등록된 전략을 이름으로 조회합니다.
        
        Args:
            strategy_name: 조회할 전략의 이름
            
        Returns:
            Optional[BaseStrategy]: 찾은 전략 객체 또는 None
        """
        return self.strategies.get(strategy_name)
    
    def process_market_data(self, data: pd.DataFrame) -> List[Signal]:
        """
        시장 데이터를 처리하고 모든 활성화된 전략에서 신호를 생성합니다.
        
        Args:
            data: 분석할 시장 데이터
            
        Returns:
            List[Signal]: 생성된 매매 신호 목록
        """
        start_time = time.time()
        signals = []
        active_strategies = self.get_active_strategies()
        
        logger.info(f"{len(active_strategies)}개의 활성화된 전략으로 시장 데이터 처리 중...")
        
        if not active_strategies:
            logger.warning("활성화된 전략이 없습니다.")
            return []
        
        # 멀티스레딩을 사용하여 병렬 처리
        with ThreadPoolExecutor(max_workers=min(len(active_strategies), self.max_workers)) as executor:
            results = executor.map(lambda s: s.generate_signals(data), active_strategies)
            
            for result in results:
                signals.extend(result)
        
        # 신호 저장
        self.signals.extend(signals)
        
        # 신호가 너무 많아지면 오래된 신호 제거
        if len(self.signals) > 10000:
            self.signals = self.signals[-10000:]
        
        process_time = time.time() - start_time
        logger.info(f"시장 데이터 처리 완료: {len(signals)}개의 신호가 생성되었습니다. (처리 시간: {process_time:.3f}초)")
        
        return signals
    
    def process_real_time_data(self, data: pd.DataFrame) -> List[Signal]:
        """
        실시간 시장 데이터를 처리하고 신호를 생성합니다.
        
        Args:
            data: 실시간 시장 데이터
            
        Returns:
            List[Signal]: 생성된 매매 신호 목록
        """
        signals = []
        active_strategies = self.get_active_strategies()
        
        if not active_strategies:
            return []
        
        # 각 전략 업데이트
        for strategy in active_strategies:
            signal = strategy.update(data)
            if signal:
                signals.append(signal)
                self.signals.append(signal)
        
        # 신호가 너무 많아지면 오래된 신호 제거
        if len(self.signals) > 10000:
            self.signals = self.signals[-10000:]
        
        return signals
    
    def get_signals(self, limit: int = 100, symbol: Optional[str] = None, strategy_name: Optional[str] = None) -> List[Signal]:
        """
        생성된 신호를 필터링하여 반환합니다.
        
        Args:
            limit: 반환할 최대 신호 수
            symbol: 특정 심볼로 필터링 (None이면 모든 심볼)
            strategy_name: 특정 전략으로 필터링 (None이면 모든 전략)
            
        Returns:
            List[Signal]: 필터링된 신호 목록
        """
        # 역순으로 정렬된 신호 목록 (최신 순)
        signals = self.signals[::-1]
        
        # 심볼로 필터링
        if symbol:
            signals = [s for s in signals if s.symbol == symbol]
        
        # 전략으로 필터링
        if strategy_name and strategy_name in self.strategies:
            strategy = self.strategies[strategy_name]
            signals = [s for s in signals if s.symbol in strategy.symbols]
        
        # 개수 제한
        return signals[:limit]
    
    def get_latest_signal(self, symbol: str) -> Optional[Signal]:
        """
        특정 심볼의 최신 신호를 반환합니다.
        
        Args:
            symbol: 대상 심볼
            
        Returns:
            Optional[Signal]: 최신 신호 또는 None
        """
        for signal in reversed(self.signals):
            if signal.symbol == symbol:
                return signal
        return None
    
    def get_watched_symbols(self) -> Set[str]:
        """
        모든 전략이 감시 중인 심볼 목록을 반환합니다.
        
        Returns:
            Set[str]: 감시 중인 심볼 집합
        """
        return self.watched_symbols
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        서비스 통계 정보를 반환합니다.
        
        Returns:
            Dict[str, Any]: 통계 정보
        """
        buy_signals = len([s for s in self.signals if s.signal_type == SignalType.BUY])
        sell_signals = len([s for s in self.signals if s.signal_type == SignalType.SELL])
        hold_signals = len([s for s in self.signals if s.signal_type == SignalType.HOLD])
        
        return {
            "total_strategies": len(self.strategies),
            "active_strategies": len(self.get_active_strategies()),
            "total_signals": len(self.signals),
            "buy_signals": buy_signals,
            "sell_signals": sell_signals,
            "hold_signals": hold_signals,
            "watched_symbols": len(self.watched_symbols),
            "symbols": list(self.watched_symbols)
        } 