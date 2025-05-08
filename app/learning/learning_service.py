"""자체 학습형 매매 시스템 핵심 서비스."""

import os
import logging
import json
from typing import Dict, List, Optional, Any, Tuple, Union
from datetime import datetime
import pandas as pd
import numpy as np

from app.strategies.base_strategy import Signal, SignalType
from app.learning.model_manager import ModelManager
from app.learning.adaptive_strategy import AdaptiveStrategy
from app.learning.result_analyzer import ResultAnalyzer

# 로깅 설정
logger = logging.getLogger(__name__)

class LearningService:
    """
    자체 학습형 매매 서비스.
    적응형 매매 전략, 모델 관리, 결과 분석을 통합적으로 관리하는 서비스입니다.
    """
    
    def __init__(
        self,
        model_dir: str = "models",
        data_dir: str = "data/learning",
        report_dir: str = "reports",
        default_symbols: Optional[List[str]] = None
    ):
        """
        학습 서비스를 초기화합니다.
        
        Args:
            model_dir: 모델 저장 디렉토리
            data_dir: 데이터 저장 디렉토리
            report_dir: 보고서 저장 디렉토리
            default_symbols: 기본 종목 코드 목록
        """
        # 모델 관리자 초기화
        self.model_manager = ModelManager(
            models_dir=model_dir,
            data_dir=data_dir
        )
        
        # 결과 분석기 초기화
        self.result_analyzer = ResultAnalyzer(
            model_manager=self.model_manager,
            output_dir=report_dir
        )
        
        # 전략 관리
        self.default_symbols = default_symbols or []
        self.strategies: Dict[str, AdaptiveStrategy] = {}
        
        # 거래 이력 관리
        self.all_trade_history: List[Dict[str, Any]] = []
        
        # 디렉토리 생성
        os.makedirs(model_dir, exist_ok=True)
        os.makedirs(data_dir, exist_ok=True)
        os.makedirs(report_dir, exist_ok=True)
        
        # 서비스 초기화
        self._initialize_service()
    
    def _initialize_service(self) -> None:
        """서비스를 초기화하고 기존 모델이 있다면 로드합니다."""
        # 기존 모델 메타데이터 목록 가져오기
        model_list = self.model_manager.list_models()
        
        # 각 적응형 전략 모델 로드
        adaptive_models = [model for model in model_list if model.get("model_id", "").startswith("adaptive_")]
        
        if adaptive_models:
            for model_meta in adaptive_models:
                model_id = model_meta.get("model_id")
                if model_id:
                    # 전략 이름과 심볼 추출
                    strategy_name = model_meta.get("strategy_name", "adaptive")
                    symbols = model_meta.get("symbols", self.default_symbols)
                    
                    # 적응형 전략 생성
                    try:
                        strategy = AdaptiveStrategy(
                            name=strategy_name,
                            symbols=symbols,
                            model_manager=self.model_manager,
                            model_id=model_id
                        )
                        
                        # 전략 등록
                        self.strategies[model_id] = strategy
                        logger.info(f"적응형 전략 로드 완료: {model_id}")
                        
                    except Exception as e:
                        logger.error(f"적응형 전략 로드 실패: {str(e)}")
        else:
            # 기본 적응형 전략 생성
            self._create_default_strategy()
    
    def _create_default_strategy(self) -> str:
        """
        기본 적응형 전략을 생성합니다.
        
        Returns:
            str: 생성된 전략의 모델 ID
        """
        # 기본 전략 이름 및 심볼 설정
        strategy_name = "adaptive_default"
        
        # 적응형 전략 생성
        strategy = AdaptiveStrategy(
            name=strategy_name,
            symbols=self.default_symbols,
            model_manager=self.model_manager
        )
        
        # 전략 등록
        model_id = strategy.model_id
        self.strategies[model_id] = strategy
        
        logger.info(f"기본 적응형 전략 생성 완료: {model_id}")
        return model_id
    
    def create_adaptive_strategy(
        self,
        name: str,
        symbols: List[str],
        lookback_period: int = 60,
        confidence_threshold: float = 0.7,
        learning_rate: float = 0.001,
        retrain_interval: int = 50
    ) -> str:
        """
        새로운 적응형 전략을 생성합니다.
        
        Args:
            name: 전략 이름
            symbols: 적용할 종목 코드 목록
            lookback_period: 학습 및 예측에 사용할 과거 데이터 기간 (캔들 수)
            confidence_threshold: 매매 시그널 발생 신뢰도 임계값
            learning_rate: 학습률
            retrain_interval: 재학습 간격 (거래 횟수)
            
        Returns:
            str: 생성된 전략의 모델 ID
        """
        # 전략 이름 중복 검사
        for strategy in self.strategies.values():
            if strategy.name == f"adaptive_{name}":
                # 이름이 중복되면 타임스탬프 추가
                name = f"{name}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
                break
        
        # 적응형 전략 생성
        strategy = AdaptiveStrategy(
            name=name,
            symbols=symbols,
            model_manager=self.model_manager,
            lookback_period=lookback_period,
            confidence_threshold=confidence_threshold,
            learning_rate=learning_rate,
            retrain_interval=retrain_interval
        )
        
        # 전략 등록
        model_id = strategy.model_id
        self.strategies[model_id] = strategy
        
        logger.info(f"새로운 적응형 전략 생성 완료: {model_id}")
        return model_id
    
    def process_market_data(self, market_data: pd.DataFrame) -> Dict[str, List[Signal]]:
        """
        시장 데이터를 처리하여 모든 적응형 전략에서 신호를 생성합니다.
        
        Args:
            market_data: 시장 데이터 (OHLCV 데이터프레임)
            
        Returns:
            Dict[str, List[Signal]]: 전략별 신호 목록
        """
        all_signals: Dict[str, List[Signal]] = {}
        
        for model_id, strategy in self.strategies.items():
            try:
                signals = strategy.generate_signals(market_data)
                all_signals[model_id] = signals
                
                logger.info(f"전략 {model_id}에서 {len(signals)}개의 신호 생성")
                
            except Exception as e:
                logger.error(f"시장 데이터 처리 중 오류 발생 (전략 {model_id}): {str(e)}")
                all_signals[model_id] = []
        
        return all_signals
    
    def process_trade_result(
        self, 
        model_id: str,
        symbol: str,
        trade_data: Dict[str, Any],
        result: float
    ) -> None:
        """
        거래 결과를 처리하고 적응형 전략에 피드백을 제공합니다.
        
        Args:
            model_id: 전략 모델 ID
            symbol: 거래 종목 코드
            trade_data: 거래 데이터 (시장 데이터, 신호 정보 등)
            result: 거래 결과 (수익률)
        """
        # 전략 확인
        if model_id not in self.strategies:
            logger.error(f"존재하지 않는 전략: {model_id}")
            return
        
        # 거래 결과 저장
        trade_result = {
            "model_id": model_id,
            "symbol": symbol,
            "trade_data": trade_data,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
        
        # 전체 거래 이력에 추가
        self.all_trade_history.append(trade_result)
        
        # 전략에 피드백 제공
        strategy = self.strategies[model_id]
        strategy.add_trade_result(trade_data, result)
        
        # 정기적으로 결과 분석
        if len(self.all_trade_history) % 50 == 0:
            self.analyze_all_results()
        
        logger.info(f"거래 결과 처리 완료: 전략={model_id}, 종목={symbol}, 결과={result:.4f}")
    
    def get_strategy(self, model_id: str) -> Optional[AdaptiveStrategy]:
        """
        ID로 적응형 전략을 가져옵니다.
        
        Args:
            model_id: 전략 모델 ID
            
        Returns:
            Optional[AdaptiveStrategy]: 적응형 전략 객체
        """
        return self.strategies.get(model_id)
    
    def list_strategies(self) -> List[Dict[str, Any]]:
        """
        모든 적응형 전략의 정보를 반환합니다.
        
        Returns:
            List[Dict[str, Any]]: 전략 정보 목록
        """
        strategy_info = []
        
        for model_id, strategy in self.strategies.items():
            # 성능 통계 가져오기
            performance = strategy.get_performance_stats()
            
            # 전략 정보 추가
            info = {
                "model_id": model_id,
                "name": strategy.name,
                "symbols": strategy.symbols,
                "confidence_threshold": strategy.confidence_threshold,
                "retrain_interval": strategy.retrain_interval,
                "performance": performance
            }
            
            strategy_info.append(info)
        
        return strategy_info
    
    def analyze_all_results(self) -> Dict[str, Any]:
        """
        모든 거래 결과를 분석합니다.
        
        Returns:
            Dict[str, Any]: 분석 결과
        """
        if not self.all_trade_history or len(self.all_trade_history) < 20:
            logger.warning("분석에 필요한 충분한 거래 이력이 없습니다")
            return {"message": "분석에 필요한 충분한 거래 이력이 없습니다"}
        
        # 모든 거래 이력 분석
        analysis = self.result_analyzer.analyze_trades(self.all_trade_history)
        
        # 개선 제안 추출
        suggestions = self.result_analyzer.extract_improvement_suggestions(analysis)
        analysis["improvement_suggestions"] = suggestions
        
        # 보고서 생성
        report_path = self.result_analyzer.generate_report()
        analysis["report_path"] = report_path
        
        logger.info(f"거래 결과 분석 완료: {len(self.all_trade_history)}개 거래, 보고서={report_path}")
        return analysis
    
    def analyze_strategy_results(self, model_id: str) -> Dict[str, Any]:
        """
        특정 전략의 거래 결과만 분석합니다.
        
        Args:
            model_id: 전략 모델 ID
            
        Returns:
            Dict[str, Any]: 분석 결과
        """
        # 해당 전략의 거래 이력만 필터링
        strategy_trades = [
            trade for trade in self.all_trade_history
            if trade.get("model_id") == model_id
        ]
        
        if not strategy_trades or len(strategy_trades) < 20:
            logger.warning(f"전략 {model_id}의 분석에 필요한 충분한 거래 이력이 없습니다")
            return {"message": f"전략 {model_id}의 분석에 필요한 충분한 거래 이력이 없습니다"}
        
        # 전략 거래 이력 분석
        analysis = self.result_analyzer.analyze_trades(strategy_trades)
        
        # 개선 제안 추출
        suggestions = self.result_analyzer.extract_improvement_suggestions(analysis)
        analysis["improvement_suggestions"] = suggestions
        
        # 보고서 생성
        report_path = self.result_analyzer.generate_report()
        analysis["report_path"] = report_path
        
        logger.info(f"전략 {model_id} 결과 분석 완료: {len(strategy_trades)}개 거래, 보고서={report_path}")
        return analysis
    
    def retrain_all_strategies(self) -> Dict[str, bool]:
        """
        모든 적응형 전략을 재학습합니다.
        
        Returns:
            Dict[str, bool]: 전략별 재학습 성공 여부
        """
        results = {}
        
        for model_id, strategy in self.strategies.items():
            try:
                strategy.retrain()
                results[model_id] = True
                logger.info(f"전략 {model_id} 재학습 완료")
                
            except Exception as e:
                results[model_id] = False
                logger.error(f"전략 {model_id} 재학습 실패: {str(e)}")
        
        return results
    
    def save_all_strategies(self) -> None:
        """모든 전략을 저장합니다."""
        for model_id, strategy in self.strategies.items():
            try:
                strategy._save_model()
                logger.info(f"전략 {model_id} 저장 완료")
                
            except Exception as e:
                logger.error(f"전략 {model_id} 저장 실패: {str(e)}")
    
    def load_strategies(self) -> None:
        """모든 전략을 다시 로드합니다."""
        # 기존 전략 클리어
        self.strategies.clear()
        
        # 서비스 초기화 (전략 로드)
        self._initialize_service()
    
    def backup_data(self, backup_dir: Optional[str] = None) -> str:
        """
        모든 학습 데이터를 백업합니다.
        
        Args:
            backup_dir: 백업 디렉토리 (None이면 자동 생성)
            
        Returns:
            str: 백업 디렉토리 경로
        """
        import shutil
        from datetime import datetime
        
        # 백업 디렉토리 생성
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        backup_dir = backup_dir or f"backups/learning_backup_{timestamp}"
        
        try:
            # 디렉토리 생성
            os.makedirs(backup_dir, exist_ok=True)
            
            # 모델 디렉토리 백업
            models_backup = os.path.join(backup_dir, "models")
            if os.path.exists(self.model_manager.models_dir):
                shutil.copytree(
                    self.model_manager.models_dir,
                    models_backup,
                    dirs_exist_ok=True
                )
            
            # 데이터 디렉토리 백업
            data_backup = os.path.join(backup_dir, "data")
            if os.path.exists(self.model_manager.data_dir):
                shutil.copytree(
                    self.model_manager.data_dir,
                    data_backup,
                    dirs_exist_ok=True
                )
            
            # 거래 이력 저장
            trade_history_path = os.path.join(backup_dir, "trade_history.json")
            with open(trade_history_path, 'w', encoding='utf-8') as f:
                json.dump(self.all_trade_history, f, ensure_ascii=False, indent=2)
            
            logger.info(f"학습 데이터 백업 완료: {backup_dir}")
            return backup_dir
            
        except Exception as e:
            logger.error(f"데이터 백업 중 오류 발생: {str(e)}")
            return "" 