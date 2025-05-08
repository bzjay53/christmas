"""학습 모델 관리 모듈."""

import os
import json
import logging
import pickle
from typing import Dict, Any, Optional, List, Tuple, Union
from datetime import datetime
import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

# 로깅 설정
logger = logging.getLogger(__name__)

class ModelManager:
    """
    머신러닝 모델 관리 클래스.
    모델의 저장, 로드, 평가 등의 기능을 제공합니다.
    """
    
    def __init__(self, 
                 models_dir: str = "models", 
                 data_dir: str = "data/learning"):
        """
        모델 관리자를 초기화합니다.
        
        Args:
            models_dir: 모델 저장 디렉토리
            data_dir: 학습 데이터 저장 디렉토리
        """
        self.models_dir = models_dir
        self.data_dir = data_dir
        
        # 디렉토리 생성
        os.makedirs(self.models_dir, exist_ok=True)
        os.makedirs(self.data_dir, exist_ok=True)
        
        # 모델과 데이터 전처리기 저장소
        self.models: Dict[str, Any] = {}
        self.scalers: Dict[str, StandardScaler] = {}
        self.model_metadata: Dict[str, Dict[str, Any]] = {}
        
        # 모델 성능 기록
        self.performance_history: Dict[str, List[Dict[str, Any]]] = {}
        
        # 기존 모델 정보 로드
        self._load_metadata()
    
    def save_model(self, model_id: str, model: Any, 
                  scaler: Optional[StandardScaler] = None,
                  metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        모델을 저장합니다.
        
        Args:
            model_id: 모델 ID
            model: 저장할 모델 객체
            scaler: 데이터 스케일러 (선택사항)
            metadata: 모델 메타데이터 (선택사항)
            
        Returns:
            저장된 모델의 경로
        """
        # 모델 경로 생성
        model_path = os.path.join(self.models_dir, f"{model_id}.pkl")
        scaler_path = os.path.join(self.models_dir, f"{model_id}_scaler.pkl")
        metadata_path = os.path.join(self.models_dir, f"{model_id}_metadata.json")
        
        # 메타데이터 준비
        timestamp = datetime.now().isoformat()
        model_metadata = metadata or {}
        model_metadata.update({
            "model_id": model_id,
            "created_at": timestamp,
            "updated_at": timestamp,
            "model_path": model_path,
            "scaler_path": scaler_path if scaler else None
        })
        
        try:
            # 모델 저장
            joblib.dump(model, model_path)
            
            # 스케일러 저장 (있는 경우)
            if scaler is not None:
                joblib.dump(scaler, scaler_path)
            
            # 메타데이터 저장
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(model_metadata, f, ensure_ascii=False, indent=2)
            
            # 메모리에 모델 정보 유지
            self.models[model_id] = model
            if scaler is not None:
                self.scalers[model_id] = scaler
            self.model_metadata[model_id] = model_metadata
            
            logger.info(f"모델 저장 완료: {model_id}")
            return model_path
            
        except Exception as e:
            logger.error(f"모델 저장 실패: {str(e)}")
            raise
    
    def load_model(self, model_id: str) -> Tuple[Any, Optional[StandardScaler], Dict[str, Any]]:
        """
        모델을 로드합니다.
        
        Args:
            model_id: 로드할 모델 ID
            
        Returns:
            (모델, 스케일러, 메타데이터) 튜플
        """
        # 이미 로드된 모델이 있는지 확인
        if model_id in self.models:
            return (
                self.models[model_id],
                self.scalers.get(model_id),
                self.model_metadata.get(model_id, {})
            )
        
        # 모델 파일 경로
        model_path = os.path.join(self.models_dir, f"{model_id}.pkl")
        scaler_path = os.path.join(self.models_dir, f"{model_id}_scaler.pkl")
        metadata_path = os.path.join(self.models_dir, f"{model_id}_metadata.json")
        
        try:
            # 모델 파일 존재 여부 확인
            if not os.path.exists(model_path):
                logger.error(f"모델 파일이 존재하지 않습니다: {model_path}")
                return None, None, {}
            
            # 모델 로드
            model = joblib.load(model_path)
            
            # 스케일러 로드 (있는 경우)
            scaler = None
            if os.path.exists(scaler_path):
                scaler = joblib.load(scaler_path)
            
            # 메타데이터 로드
            metadata = {}
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
            
            # 메모리에 모델 정보 저장
            self.models[model_id] = model
            if scaler is not None:
                self.scalers[model_id] = scaler
            self.model_metadata[model_id] = metadata
            
            logger.info(f"모델 로드 완료: {model_id}")
            return model, scaler, metadata
            
        except Exception as e:
            logger.error(f"모델 로드 실패: {str(e)}")
            return None, None, {}
    
    def save_data(self, data_id: str, data: Union[pd.DataFrame, np.ndarray, List[Dict]],
                 metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        학습 데이터를 저장합니다.
        
        Args:
            data_id: 데이터 ID
            data: 저장할 데이터
            metadata: 데이터 메타데이터 (선택사항)
            
        Returns:
            저장된 데이터 경로
        """
        # 데이터 파일 경로
        if isinstance(data, pd.DataFrame):
            data_path = os.path.join(self.data_dir, f"{data_id}.pkl")
            metadata_path = os.path.join(self.data_dir, f"{data_id}_metadata.json")
            
            # 데이터 저장
            data.to_pickle(data_path)
        else:
            data_path = os.path.join(self.data_dir, f"{data_id}.pkl")
            metadata_path = os.path.join(self.data_dir, f"{data_id}_metadata.json")
            
            # 넘파이 배열이나 다른 형태의 데이터 저장
            with open(data_path, 'wb') as f:
                pickle.dump(data, f)
        
        # 메타데이터 저장
        timestamp = datetime.now().isoformat()
        data_metadata = metadata or {}
        data_metadata.update({
            "data_id": data_id,
            "created_at": timestamp,
            "updated_at": timestamp,
            "data_path": data_path,
            "data_type": type(data).__name__
        })
        
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(data_metadata, f, ensure_ascii=False, indent=2)
        
        logger.info(f"데이터 저장 완료: {data_id}")
        return data_path
    
    def load_data(self, data_id: str) -> Tuple[Any, Dict[str, Any]]:
        """
        저장된 데이터를 로드합니다.
        
        Args:
            data_id: 데이터 ID
            
        Returns:
            (데이터, 메타데이터) 튜플
        """
        # 데이터 파일 경로
        data_path = os.path.join(self.data_dir, f"{data_id}.pkl")
        metadata_path = os.path.join(self.data_dir, f"{data_id}_metadata.json")
        
        # 파일 존재 여부 확인
        if not os.path.exists(data_path):
            logger.error(f"데이터 파일이 존재하지 않습니다: {data_path}")
            return None, {}
        
        try:
            # 메타데이터 로드
            metadata = {}
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
            
            # 데이터 타입에 따라 로드 방식 결정
            data_type = metadata.get("data_type", "")
            
            if data_type == "DataFrame":
                data = pd.read_pickle(data_path)
            else:
                with open(data_path, 'rb') as f:
                    data = pickle.load(f)
            
            logger.info(f"데이터 로드 완료: {data_id}")
            return data, metadata
            
        except Exception as e:
            logger.error(f"데이터 로드 실패: {str(e)}")
            return None, {}
    
    def evaluate_model(self, model_id: str, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, Any]:
        """
        모델 성능을 평가합니다.
        
        Args:
            model_id: 평가할 모델 ID
            X_test: 테스트 데이터
            y_test: 테스트 레이블
            
        Returns:
            성능 지표 사전
        """
        # 모델 로드
        model, scaler, _ = self.load_model(model_id)
        if model is None:
            logger.error(f"모델을 찾을 수 없습니다: {model_id}")
            return {}
        
        try:
            # 데이터 전처리 (스케일러가 있는 경우)
            if scaler is not None:
                X_test = scaler.transform(X_test)
            
            # 예측
            y_pred = model.predict(X_test)
            
            # 이진 분류인 경우
            if len(np.unique(y_test)) == 2:
                performance = {
                    "accuracy": accuracy_score(y_test, y_pred),
                    "precision": precision_score(y_test, y_pred),
                    "recall": recall_score(y_test, y_pred),
                    "f1_score": f1_score(y_test, y_pred),
                    "timestamp": datetime.now().isoformat()
                }
            else:
                # 다중 분류 또는 회귀
                performance = {
                    "accuracy": accuracy_score(y_test, y_pred),
                    "timestamp": datetime.now().isoformat()
                }
            
            # 성능 기록 저장
            if model_id not in self.performance_history:
                self.performance_history[model_id] = []
            self.performance_history[model_id].append(performance)
            
            return performance
            
        except Exception as e:
            logger.error(f"모델 평가 실패: {str(e)}")
            return {}
    
    def list_models(self) -> List[Dict[str, Any]]:
        """
        저장된 모든 모델의 메타데이터 목록을 반환합니다.
        
        Returns:
            모델 메타데이터 목록
        """
        return list(self.model_metadata.values())
    
    def _load_metadata(self) -> None:
        """모델 메타데이터를 로드하여 초기화합니다."""
        # 모델 디렉토리에서 메타데이터 파일 검색
        for filename in os.listdir(self.models_dir):
            if filename.endswith("_metadata.json"):
                model_id = filename.replace("_metadata.json", "")
                metadata_path = os.path.join(self.models_dir, filename)
                
                try:
                    with open(metadata_path, 'r', encoding='utf-8') as f:
                        metadata = json.load(f)
                    
                    self.model_metadata[model_id] = metadata
                    
                except Exception as e:
                    logger.error(f"메타데이터 로드 실패: {str(e)}")
    
    def delete_model(self, model_id: str) -> bool:
        """
        모델을 삭제합니다.
        
        Args:
            model_id: 삭제할 모델 ID
            
        Returns:
            삭제 성공 여부
        """
        model_path = os.path.join(self.models_dir, f"{model_id}.pkl")
        scaler_path = os.path.join(self.models_dir, f"{model_id}_scaler.pkl")
        metadata_path = os.path.join(self.models_dir, f"{model_id}_metadata.json")
        
        try:
            # 파일 삭제
            if os.path.exists(model_path):
                os.remove(model_path)
            
            if os.path.exists(scaler_path):
                os.remove(scaler_path)
                
            if os.path.exists(metadata_path):
                os.remove(metadata_path)
            
            # 메모리에서 모델 정보 제거
            if model_id in self.models:
                del self.models[model_id]
                
            if model_id in self.scalers:
                del self.scalers[model_id]
                
            if model_id in self.model_metadata:
                del self.model_metadata[model_id]
                
            if model_id in self.performance_history:
                del self.performance_history[model_id]
            
            logger.info(f"모델 삭제 완료: {model_id}")
            return True
            
        except Exception as e:
            logger.error(f"모델 삭제 실패: {str(e)}")
            return False 