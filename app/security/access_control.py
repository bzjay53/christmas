"""
접근 제어 모듈

시스템의 접근 권한을 관리하고 제어하는 기능을 제공합니다.
"""
import logging
import json
from typing import Dict, List, Optional, Any, Set
import time
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class AccessControl:
    """시스템 접근 제어를 관리하는 클래스"""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        접근 제어 시스템 초기화
        
        Args:
            config_path: 접근 제어 설정 파일 경로
        """
        self.config_path = config_path
        self.config = self._load_config()
        self.role_permissions: Dict[str, Set[str]] = {}
        self.user_roles: Dict[str, List[str]] = {}
        self.session_store: Dict[str, Dict[str, Any]] = {}
        self._initialize_roles()
        
    def _load_config(self) -> Dict[str, Any]:
        """설정 파일 로드"""
        if not self.config_path:
            # 기본 설정 사용
            return {
                "roles": {
                    "admin": ["all_permissions"],
                    "trader": ["read_market_data", "create_order", "read_order", "cancel_order"],
                    "analyst": ["read_market_data", "read_signals", "create_signal"],
                    "viewer": ["read_market_data", "read_signals", "read_order"]
                },
                "default_role": "viewer",
                "session_timeout": 3600,  # 1시간
                "max_failed_attempts": 5,
                "lockout_duration": 1800  # 30분
            }
        
        try:
            with open(self.config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"접근 제어 설정 파일 로드 실패: {e}")
            return {}
    
    def _initialize_roles(self) -> None:
        """역할별 권한 초기화"""
        roles_config = self.config.get("roles", {})
        
        for role, permissions in roles_config.items():
            self.role_permissions[role] = set(permissions)
            
            # all_permissions 처리
            if "all_permissions" in permissions:
                # 모든 권한 추가
                all_perms = set()
                for role_perms in roles_config.values():
                    all_perms.update(role_perms)
                
                # all_permissions 제거하고 실제 모든 권한 추가
                self.role_permissions[role].remove("all_permissions")
                self.role_permissions[role].update(all_perms)
    
    def assign_role(self, user_id: str, role: str) -> bool:
        """
        사용자에게 역할 할당
        
        Args:
            user_id: 사용자 ID
            role: 할당할 역할
            
        Returns:
            성공 여부
        """
        if role not in self.role_permissions:
            logger.error(f"존재하지 않는 역할: {role}")
            return False
        
        if user_id not in self.user_roles:
            self.user_roles[user_id] = []
            
        if role not in self.user_roles[user_id]:
            self.user_roles[user_id].append(role)
            logger.info(f"사용자 {user_id}에게 {role} 역할 할당됨")
        
        return True
    
    def remove_role(self, user_id: str, role: str) -> bool:
        """
        사용자에게서 역할 제거
        
        Args:
            user_id: 사용자 ID
            role: 제거할 역할
            
        Returns:
            성공 여부
        """
        if user_id not in self.user_roles:
            logger.warning(f"존재하지 않는 사용자: {user_id}")
            return False
            
        if role in self.user_roles[user_id]:
            self.user_roles[user_id].remove(role)
            logger.info(f"사용자 {user_id}에게서 {role} 역할 제거됨")
            return True
            
        return False
    
    def has_permission(self, user_id: str, permission: str) -> bool:
        """
        사용자의 권한 여부 확인
        
        Args:
            user_id: 사용자 ID
            permission: 확인할 권한
            
        Returns:
            권한 보유 여부
        """
        if user_id not in self.user_roles:
            default_role = self.config.get("default_role")
            if not default_role:
                return False
                
            return permission in self.role_permissions.get(default_role, set())
        
        user_permissions = set()
        for role in self.user_roles[user_id]:
            user_permissions.update(self.role_permissions.get(role, set()))
            
        return permission in user_permissions
    
    def create_session(self, user_id: str) -> Optional[str]:
        """
        사용자 세션 생성
        
        Args:
            user_id: 사용자 ID
            
        Returns:
            세션 ID
        """
        # 간단한 세션 ID 생성 (실제로는 더 안전한 방법 사용)
        session_id = f"{user_id}_{int(time.time())}"
        
        self.session_store[session_id] = {
            "user_id": user_id,
            "created_at": datetime.now(),
            "expires_at": datetime.now() + timedelta(seconds=self.config.get("session_timeout", 3600)),
            "last_activity": datetime.now()
        }
        
        logger.info(f"사용자 {user_id} 세션 생성됨: {session_id}")
        return session_id
    
    def validate_session(self, session_id: str) -> Optional[str]:
        """
        세션 유효성 검증
        
        Args:
            session_id: 세션 ID
            
        Returns:
            유효한 세션의 사용자 ID, 유효하지 않은 경우 None
        """
        if session_id not in self.session_store:
            return None
            
        session = self.session_store[session_id]
        
        # 세션 만료 확인
        if datetime.now() > session["expires_at"]:
            logger.info(f"세션 만료됨: {session_id}")
            del self.session_store[session_id]
            return None
            
        # 세션 갱신
        session["last_activity"] = datetime.now()
        session["expires_at"] = datetime.now() + timedelta(seconds=self.config.get("session_timeout", 3600))
        
        return session["user_id"]
    
    def end_session(self, session_id: str) -> bool:
        """
        세션 종료
        
        Args:
            session_id: 세션 ID
            
        Returns:
            성공 여부
        """
        if session_id in self.session_store:
            del self.session_store[session_id]
            logger.info(f"세션 종료됨: {session_id}")
            return True
            
        return False
    
    def get_user_permissions(self, user_id: str) -> Set[str]:
        """
        사용자의 모든 권한 조회
        
        Args:
            user_id: 사용자 ID
            
        Returns:
            사용자가 보유한 권한 집합
        """
        user_permissions = set()
        
        if user_id in self.user_roles:
            for role in self.user_roles[user_id]:
                user_permissions.update(self.role_permissions.get(role, set()))
        else:
            # 기본 역할 권한 적용
            default_role = self.config.get("default_role")
            if default_role:
                user_permissions.update(self.role_permissions.get(default_role, set()))
                
        return user_permissions 