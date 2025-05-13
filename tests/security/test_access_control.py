import os
import json
import tempfile
import pytest
from datetime import datetime, timedelta
from time import sleep

from app.security.access_control import AccessControl

class TestAccessControl:
    """접근 제어 테스트 클래스"""
    
    def setup_method(self):
        """각 테스트 전 설정"""
        # 임시 설정 파일 생성
        self.temp_dir = tempfile.TemporaryDirectory()
        self.config_path = os.path.join(self.temp_dir.name, "test_access_control_config.json")
        
        # 테스트 설정 파일 생성
        config = {
            "roles": {
                "admin": ["all_permissions"],
                "manager": ["read_data", "write_data", "manage_users"],
                "user": ["read_data", "write_data"],
                "guest": ["read_data"]
            },
            "default_role": "guest",
            "session_timeout": 1,  # 1초 (테스트용)
            "max_failed_attempts": 3,
            "lockout_duration": 30
        }
        
        os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
        with open(self.config_path, 'w') as f:
            json.dump(config, f)
    
    def teardown_method(self):
        """각 테스트 후 정리"""
        self.temp_dir.cleanup()
    
    def test_init_with_config(self):
        """설정 파일로 초기화 테스트"""
        ac = AccessControl(config_path=self.config_path)
        
        # 설정 로드 확인
        assert "roles" in ac.config
        assert "admin" in ac.config["roles"]
        assert "manager" in ac.config["roles"]
        assert ac.config["default_role"] == "guest"
        assert ac.config["session_timeout"] == 1
        
        # 역할 권한 초기화 확인
        assert "admin" in ac.role_permissions
        assert "manage_users" in ac.role_permissions["manager"]
        assert "read_data" in ac.role_permissions["user"]
    
    def test_init_without_config(self):
        """설정 파일 없이 초기화 테스트"""
        ac = AccessControl()
        
        # 기본 설정 사용 확인
        assert "roles" in ac.config
        assert "default_role" in ac.config
        assert "session_timeout" in ac.config
    
    def test_initialize_roles(self):
        """역할 초기화 테스트"""
        ac = AccessControl(config_path=self.config_path)
        
        # all_permissions 처리 확인
        assert "read_data" in ac.role_permissions["admin"]
        assert "write_data" in ac.role_permissions["admin"]
        assert "manage_users" in ac.role_permissions["admin"]
        
        # 일반 역할 권한 확인
        assert "read_data" in ac.role_permissions["user"]
        assert "write_data" in ac.role_permissions["user"]
        assert "manage_users" not in ac.role_permissions["user"]
        
        # 최소 권한 역할 확인
        assert "read_data" in ac.role_permissions["guest"]
        assert "write_data" not in ac.role_permissions["guest"]
    
    def test_assign_role(self):
        """역할 할당 테스트"""
        ac = AccessControl(config_path=self.config_path)
        
        # 유효한 역할 할당
        assert ac.assign_role("test_user", "user") == True
        assert "test_user" in ac.user_roles
        assert "user" in ac.user_roles["test_user"]
        
        # 이미 할당된 역할 재할당
        assert ac.assign_role("test_user", "user") == True
        assert len(ac.user_roles["test_user"]) == 1
        
        # 다른 역할 추가 할당
        assert ac.assign_role("test_user", "manager") == True
        assert len(ac.user_roles["test_user"]) == 2
        assert "manager" in ac.user_roles["test_user"]
        
        # 존재하지 않는 역할 할당 시도
        assert ac.assign_role("test_user", "invalid_role") == False
    
    def test_remove_role(self):
        """역할 제거 테스트"""
        ac = AccessControl(config_path=self.config_path)
        
        # 사용자에게 역할 할당
        ac.assign_role("test_user", "user")
        ac.assign_role("test_user", "manager")
        
        # 역할 제거
        assert ac.remove_role("test_user", "user") == True
        assert "user" not in ac.user_roles["test_user"]
        assert "manager" in ac.user_roles["test_user"]
        
        # 할당되지 않은 역할 제거 시도
        assert ac.remove_role("test_user", "admin") == False
        
        # 존재하지 않는 사용자 역할 제거 시도
        assert ac.remove_role("nonexistent_user", "user") == False
        
        # 마지막 역할 제거
        assert ac.remove_role("test_user", "manager") == True
        assert len(ac.user_roles["test_user"]) == 0
    
    def test_has_permission(self):
        """권한 확인 테스트"""
        ac = AccessControl(config_path=self.config_path)
        
        # 사용자에게 역할 할당
        ac.assign_role("admin_user", "admin")
        ac.assign_role("regular_user", "user")
        
        # 관리자 권한 확인
        assert ac.has_permission("admin_user", "read_data") == True
        assert ac.has_permission("admin_user", "write_data") == True
        assert ac.has_permission("admin_user", "manage_users") == True
        
        # 일반 사용자 권한 확인
        assert ac.has_permission("regular_user", "read_data") == True
        assert ac.has_permission("regular_user", "write_data") == True
        assert ac.has_permission("regular_user", "manage_users") == False
        
        # 역할이 없는 사용자 (기본 역할 적용)
        assert ac.has_permission("new_user", "read_data") == True
        assert ac.has_permission("new_user", "write_data") == False
    
    def test_create_session(self):
        """세션 생성 테스트"""
        ac = AccessControl(config_path=self.config_path)
        
        # 세션 생성
        session_id = ac.create_session("test_user")
        
        # 세션 ID 형식 확인
        assert session_id is not None
        assert "test_user" in session_id
        
        # 세션 저장소 확인
        assert session_id in ac.session_store
        assert ac.session_store[session_id]["user_id"] == "test_user"
        assert isinstance(ac.session_store[session_id]["created_at"], datetime)
        assert isinstance(ac.session_store[session_id]["expires_at"], datetime)
    
    def test_validate_session(self):
        """세션 유효성 검증 테스트"""
        ac = AccessControl(config_path=self.config_path)
        
        # 세션 생성
        session_id = ac.create_session("test_user")
        
        # 유효한 세션 검증
        user_id = ac.validate_session(session_id)
        assert user_id == "test_user"
        
        # 존재하지 않는 세션 검증
        assert ac.validate_session("nonexistent_session") is None
        
        # 만료된 세션 검증
        sleep(1.1)  # 세션 타임아웃보다 약간 더 대기
        assert ac.validate_session(session_id) is None
        assert session_id not in ac.session_store
    
    def test_end_session(self):
        """세션 종료 테스트"""
        ac = AccessControl(config_path=self.config_path)
        
        # 세션 생성
        session_id = ac.create_session("test_user")
        
        # 세션 종료
        assert ac.end_session(session_id) == True
        assert session_id not in ac.session_store
        
        # 존재하지 않는 세션 종료
        assert ac.end_session("nonexistent_session") == False
    
    def test_get_user_permissions(self):
        """사용자 권한 조회 테스트"""
        ac = AccessControl(config_path=self.config_path)
        
        # 여러 역할 할당
        ac.assign_role("test_user", "user")
        ac.assign_role("test_user", "manager")
        
        # 권한 조회
        permissions = ac.get_user_permissions("test_user")
        
        # 권한 확인
        assert "read_data" in permissions
        assert "write_data" in permissions
        assert "manage_users" in permissions
        
        # 역할이 없는 사용자 (기본 역할 적용)
        guest_permissions = ac.get_user_permissions("new_user")
        assert "read_data" in guest_permissions
        assert "write_data" not in guest_permissions
        assert "manage_users" not in guest_permissions


if __name__ == "__main__":
    pytest.main(["-xvs", "test_access_control.py"]) 