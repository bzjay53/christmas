"""
데이터 보호 모듈

시스템의 민감한 데이터를 보호하기 위한 기능을 제공합니다.
암호화, 익명화, 데이터 마스킹 등을 지원합니다.
"""
import logging
import json
import base64
import os
import re
from typing import Dict, List, Optional, Any, Union
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

logger = logging.getLogger(__name__)

class DataEncryption:
    """데이터 암호화 기능을 제공하는 클래스"""
    
    def __init__(self, key: Optional[bytes] = None, key_path: Optional[str] = None):
        """
        데이터 암호화 시스템 초기화
        
        Args:
            key: 암호화 키 (제공되지 않으면 생성 또는 로드)
            key_path: 암호화 키 저장 경로
        """
        self.key_path = key_path
        
        if key:
            self.key = key
        else:
            self.key = self._load_or_generate_key()
            
        self.cipher = Fernet(self.key)
        
    def _load_or_generate_key(self) -> bytes:
        """암호화 키 로드 또는 생성"""
        if self.key_path and os.path.exists(self.key_path):
            try:
                with open(self.key_path, 'rb') as f:
                    return f.read()
            except Exception as e:
                logger.error(f"암호화 키 로드 실패: {e}")
        
        # 키 새로 생성
        key = Fernet.generate_key()
        
        # 키 저장 (있는 경우)
        if self.key_path:
            os.makedirs(os.path.dirname(self.key_path), exist_ok=True)
            try:
                with open(self.key_path, 'wb') as f:
                    f.write(key)
            except Exception as e:
                logger.error(f"암호화 키 저장 실패: {e}")
                
        return key
    
    def encrypt(self, data: Union[str, bytes]) -> bytes:
        """
        데이터 암호화
        
        Args:
            data: 암호화할 데이터
            
        Returns:
            암호화된 데이터
        """
        if isinstance(data, str):
            data = data.encode('utf-8')
            
        return self.cipher.encrypt(data)
    
    def decrypt(self, encrypted_data: bytes) -> bytes:
        """
        데이터 복호화
        
        Args:
            encrypted_data: 복호화할 데이터
            
        Returns:
            복호화된 데이터
        """
        return self.cipher.decrypt(encrypted_data)
    
    def encrypt_to_string(self, data: Union[str, bytes]) -> str:
        """
        데이터를 암호화하여 base64 문자열로 반환
        
        Args:
            data: 암호화할 데이터
            
        Returns:
            암호화된 데이터의 base64 인코딩 문자열
        """
        encrypted = self.encrypt(data)
        return base64.b64encode(encrypted).decode('utf-8')
    
    def decrypt_from_string(self, encrypted_string: str) -> str:
        """
        base64 문자열로 인코딩된 암호화 데이터 복호화
        
        Args:
            encrypted_string: 복호화할 base64 문자열
            
        Returns:
            복호화된 데이터 문자열
        """
        encrypted_data = base64.b64decode(encrypted_string)
        return self.decrypt(encrypted_data).decode('utf-8')
    
    @staticmethod
    def derive_key_from_password(password: str, salt: Optional[bytes] = None) -> Dict[str, bytes]:
        """
        비밀번호로부터 암호화 키 유도
        
        Args:
            password: 키 유도에 사용할 비밀번호
            salt: Salt 값 (없으면 생성)
            
        Returns:
            키와 salt를 포함한 딕셔너리
        """
        if salt is None:
            salt = os.urandom(16)
            
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000
        )
        
        key = base64.urlsafe_b64encode(kdf.derive(password.encode('utf-8')))
        
        return {
            "key": key,
            "salt": salt
        }


class DataProtection:
    """민감한 데이터 보호 기능을 제공하는 클래스"""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        데이터 보호 시스템 초기화
        
        Args:
            config_path: 설정 파일 경로
        """
        self.config_path = config_path
        self.config = self._load_config()
        self.encryption = DataEncryption(key_path=self.config.get("key_path"))
        
    def _load_config(self) -> Dict[str, Any]:
        """설정 파일 로드"""
        if not self.config_path:
            # 기본 설정 사용
            return {
                "key_path": "security/keys/data_protection.key",
                "sensitive_fields": [
                    "password", "api_key", "secret_key", "token", "credit_card",
                    "ssn", "account_number", "private_key"
                ],
                "masking_char": "*",
                "visible_chars": 4
            }
        
        try:
            with open(self.config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"데이터 보호 설정 파일 로드 실패: {e}")
            return {}
    
    def mask_sensitive_data(self, data: str, field_type: Optional[str] = None) -> str:
        """
        민감한 데이터 마스킹 처리
        
        Args:
            data: 마스킹할 데이터
            field_type: 필드 타입 (특정 마스킹 규칙 적용)
            
        Returns:
            마스킹된 데이터
        """
        if not data:
            return data
            
        mask_char = self.config.get("masking_char", "*")
        visible_chars = self.config.get("visible_chars", 4)
        
        # 필드 타입별 특수 마스킹 규칙
        if field_type == "credit_card":
            # 신용카드 포맷: XXXX-XXXX-XXXX-1234
            if len(data) >= 16:
                return (mask_char * 4 + "-" + mask_char * 4 + "-" + mask_char * 4 + "-" + 
                       data[-4:])
            else:
                return mask_char * (len(data) - visible_chars) + data[-visible_chars:]
                
        elif field_type == "email":
            # 이메일 포맷: a****@example.com
            if "@" in data:
                username, domain = data.split("@", 1)
                if len(username) > 1:
                    masked_username = username[0] + mask_char * (len(username) - 1)
                    return f"{masked_username}@{domain}"
                else:
                    return f"{username}@{domain}"
            else:
                return data
                
        elif field_type == "phone":
            # 전화번호 포맷: (XXX) XXX-1234
            if len(data) >= 10:
                # JavaScript 스타일 /\d/g 대신 Python re 모듈 사용
                masked = re.sub(r'\d', mask_char, data[:-4]) + data[-4:]
                return masked
            else:
                return mask_char * (len(data) - visible_chars) + data[-visible_chars:]
        
        # 기본 마스킹: 앞 부분 마스킹, 끝 부분 표시
        if len(data) <= visible_chars:
            return data
            
        return mask_char * (len(data) - visible_chars) + data[-visible_chars:]
    
    def protect_json_data(self, json_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        JSON 데이터 내 민감 정보 보호 처리
        
        Args:
            json_data: 보호할 JSON 데이터
            
        Returns:
            보호 처리된 JSON 데이터
        """
        sensitive_fields = self.config.get("sensitive_fields", [])
        
        def process_item(item):
            if isinstance(item, dict):
                return {k: (process_item(v) if k not in sensitive_fields else 
                          self.mask_sensitive_data(str(v), k)) 
                        for k, v in item.items()}
            elif isinstance(item, list):
                return [process_item(v) for v in item]
            else:
                return item
                
        return process_item(json_data)
    
    def encrypt_sensitive_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        민감 정보 암호화 처리
        
        Args:
            data: 암호화할 데이터
            
        Returns:
            암호화된 민감 정보를 포함한 데이터
        """
        sensitive_fields = self.config.get("sensitive_fields", [])
        
        def process_item(item):
            if isinstance(item, dict):
                return {k: (self.encryption.encrypt_to_string(json.dumps(v)) 
                          if k in sensitive_fields and v is not None
                          else process_item(v)) 
                        for k, v in item.items()}
            elif isinstance(item, list):
                return [process_item(v) for v in item]
            else:
                return item
                
        return process_item(data)
    
    def decrypt_sensitive_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        암호화된 민감 정보 복호화
        
        Args:
            data: 복호화할 데이터
            
        Returns:
            복호화된 민감 정보를 포함한 데이터
        """
        sensitive_fields = self.config.get("sensitive_fields", [])
        
        def process_item(item):
            if isinstance(item, dict):
                return {k: (json.loads(self.encryption.decrypt_from_string(v)) 
                          if k in sensitive_fields and isinstance(v, str)
                          else process_item(v)) 
                        for k, v in item.items()}
            elif isinstance(item, list):
                return [process_item(v) for v in item]
            else:
                return item
                
        return process_item(data) 