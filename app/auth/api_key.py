"""
Christmas 프로젝트 - API 키 관리 모듈
API 키 생성, 검증, 관리를 위한 모듈
"""

import os
import secrets
import hashlib
import time
import uuid
from typing import Dict, List, Optional, Union
from datetime import datetime, timedelta
import logging
import json
from pathlib import Path

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

class ApiKeyManager:
    """API 키 관리 시스템"""
    
    def __init__(self, storage_path: str = None):
        """
        초기화
        
        Args:
            storage_path: API 키 정보를 저장할 경로
        """
        self.storage_path = storage_path or os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'config',
            'api_keys.json'
        )
        self._ensure_storage_exists()
        self._keys = self._load_keys()
        
    def _ensure_storage_exists(self) -> None:
        """저장 파일이 존재하는지 확인하고 없으면 생성"""
        storage_dir = os.path.dirname(self.storage_path)
        if not os.path.exists(storage_dir):
            os.makedirs(storage_dir)
        
        if not os.path.exists(self.storage_path):
            with open(self.storage_path, 'w') as f:
                json.dump({"keys": []}, f)
    
    def _load_keys(self) -> List[Dict]:
        """저장된 API 키 정보 로드"""
        try:
            with open(self.storage_path, 'r') as f:
                data = json.load(f)
                return data.get("keys", [])
        except (json.JSONDecodeError, FileNotFoundError) as e:
            logger.error(f"API 키 로드 중 오류 발생: {str(e)}")
            return []
    
    def _save_keys(self) -> bool:
        """API 키 정보 저장"""
        try:
            with open(self.storage_path, 'w') as f:
                json.dump({"keys": self._keys}, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"API 키 저장 중 오류 발생: {str(e)}")
            return False
    
    def _hash_key(self, key: str) -> str:
        """API 키 해싱"""
        return hashlib.sha256(key.encode()).hexdigest()
    
    def generate_key(
        self, 
        scope: str = "full_access", 
        expires_in_days: Optional[int] = 90,
        user_id: Optional[str] = None,
        description: str = ""
    ) -> Dict:
        """
        새 API 키 생성
        
        Args:
            scope: 키의 권한 범위
            expires_in_days: 만료 기간 (일), None이면 만료 없음
            user_id: 키와 연결된 사용자 ID
            description: 키에 대한 설명
            
        Returns:
            생성된 키 정보
        """
        # 유일한 키 생성
        api_key = f"xmas_{uuid.uuid4().hex}_{secrets.token_hex(16)}"
        
        # 만료 시간 계산
        expires_at = None
        if expires_in_days is not None:
            expires_at = (datetime.now() + timedelta(days=expires_in_days)).isoformat()
        
        # 키 정보 구성
        key_info = {
            "id": str(uuid.uuid4()),
            "key_prefix": api_key[:10],
            "key_hash": self._hash_key(api_key),
            "scope": scope,
            "created_at": datetime.now().isoformat(),
            "expires_at": expires_at,
            "user_id": user_id,
            "description": description,
            "is_active": True,
            "last_used": None
        }
        
        # 저장
        self._keys.append(key_info)
        self._save_keys()
        
        # 실제 키는 사용자에게만 제공하고 저장하지 않음
        return {
            "api_key": api_key,
            "key_id": key_info["id"],
            "scope": scope,
            "expires_at": expires_at
        }
    
    def validate_key(self, api_key: str) -> Union[Dict, None]:
        """
        API 키 검증
        
        Args:
            api_key: 검증할 API 키
            
        Returns:
            검증 결과, 유효하지 않으면 None
        """
        key_hash = self._hash_key(api_key)
        
        for key_info in self._keys:
            if key_info["key_hash"] == key_hash:
                # 비활성화 키 체크
                if not key_info.get("is_active", True):
                    logger.warning(f"비활성화된 API 키 사용 시도: {key_info['key_prefix']}...")
                    return None
                
                # 만료 체크
                if key_info.get("expires_at"):
                    expires_at = datetime.fromisoformat(key_info["expires_at"])
                    if datetime.now() > expires_at:
                        logger.warning(f"만료된 API 키 사용 시도: {key_info['key_prefix']}...")
                        return None
                
                # 마지막 사용 시간 업데이트
                key_info["last_used"] = datetime.now().isoformat()
                self._save_keys()
                
                return {
                    "key_id": key_info["id"],
                    "scope": key_info["scope"],
                    "user_id": key_info.get("user_id"),
                    "expires_at": key_info.get("expires_at")
                }
        
        logger.warning(f"유효하지 않은 API 키 사용 시도")
        return None
    
    def revoke_key(self, key_id: str) -> bool:
        """
        API 키 취소
        
        Args:
            key_id: 취소할 API 키 ID
            
        Returns:
            성공 여부
        """
        for key_info in self._keys:
            if key_info["id"] == key_id:
                key_info["is_active"] = False
                return self._save_keys()
        
        logger.warning(f"존재하지 않는 API 키 취소 시도: {key_id}")
        return False
    
    def list_keys(self, user_id: Optional[str] = None) -> List[Dict]:
        """
        API 키 목록 조회
        
        Args:
            user_id: 특정 사용자의 키만 조회
            
        Returns:
            키 목록 (해시 제외)
        """
        result = []
        
        for key_info in self._keys:
            if user_id is None or key_info.get("user_id") == user_id:
                # 해시는 제외하고 반환
                key_info_copy = key_info.copy()
                key_info_copy.pop("key_hash", None)
                result.append(key_info_copy)
        
        return result


# 싱글톤 인스턴스
_instance = None

def get_api_key_manager() -> ApiKeyManager:
    """API 키 관리자 싱글톤 인스턴스 반환"""
    global _instance
    if _instance is None:
        _instance = ApiKeyManager()
    return _instance 