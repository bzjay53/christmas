"""API 키 관리 모듈 단위 테스트."""
import os
import json
import time
import tempfile
import pytest
from datetime import datetime, timedelta

from app.auth.api_key import ApiKeyManager


class TestApiKeyManager:
    """API 키 관리자 테스트 클래스."""

    @pytest.fixture
    def temp_storage_path(self):
        """임시 저장소 경로를 생성하는 fixture."""
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_path = temp_file.name
        yield temp_path
        if os.path.exists(temp_path):
            os.remove(temp_path)

    @pytest.fixture
    def api_key_manager(self, temp_storage_path):
        """테스트용 API 키 관리자 인스턴스."""
        return ApiKeyManager(storage_path=temp_storage_path)

    def test_initialization(self, api_key_manager, temp_storage_path):
        """초기화 테스트."""
        # 저장소 파일이 생성되었는지 확인
        assert os.path.exists(temp_storage_path)
        
        # 초기 상태 확인
        with open(temp_storage_path, 'r') as f:
            data = json.load(f)
            assert "keys" in data
            assert isinstance(data["keys"], list)
            assert len(data["keys"]) == 0

    def test_generate_key(self, api_key_manager):
        """키 생성 테스트."""
        # 키 생성
        key_info = api_key_manager.generate_key(
            scope="read_only",
            expires_in_days=30,
            user_id="test_user",
            description="Test key"
        )
        
        # 반환값 확인
        assert "api_key" in key_info
        assert "key_id" in key_info
        assert key_info["scope"] == "read_only"
        assert key_info["expires_at"] is not None
        
        # 내부 상태 확인
        assert len(api_key_manager._keys) == 1
        stored_key = api_key_manager._keys[0]
        assert stored_key["id"] == key_info["key_id"]
        assert stored_key["scope"] == "read_only"
        assert stored_key["user_id"] == "test_user"
        assert stored_key["description"] == "Test key"
        assert stored_key["is_active"] is True

    def test_validate_key(self, api_key_manager):
        """키 검증 테스트."""
        # 키 생성
        key_info = api_key_manager.generate_key(scope="full_access")
        api_key = key_info["api_key"]
        
        # 유효한 키 검증
        validation_result = api_key_manager.validate_key(api_key)
        assert validation_result is not None
        assert validation_result["key_id"] == key_info["key_id"]
        assert validation_result["scope"] == "full_access"
        
        # 유효하지 않은 키 검증
        invalid_result = api_key_manager.validate_key("invalid_key")
        assert invalid_result is None
        
        # 마지막 사용 시간 업데이트 확인
        stored_key = api_key_manager._keys[0]
        assert stored_key["last_used"] is not None

    def test_revoke_key(self, api_key_manager):
        """키 취소 테스트."""
        # 키 생성
        key_info = api_key_manager.generate_key()
        key_id = key_info["key_id"]
        api_key = key_info["api_key"]
        
        # 키 취소
        revoke_result = api_key_manager.revoke_key(key_id)
        assert revoke_result is True
        
        # 취소된 키 검증
        validation_result = api_key_manager.validate_key(api_key)
        assert validation_result is None
        
        # 내부 상태 확인
        stored_key = api_key_manager._keys[0]
        assert stored_key["is_active"] is False

    def test_key_expiration(self, api_key_manager):
        """키 만료 테스트."""
        # 매우 짧은 만료 시간으로 키 생성
        key_info = api_key_manager.generate_key(expires_in_days=0)
        api_key = key_info["api_key"]
        
        # 만료된 키 검증
        validation_result = api_key_manager.validate_key(api_key)
        assert validation_result is None

    def test_list_keys(self, api_key_manager):
        """키 목록 조회 테스트."""
        # 여러 사용자의 키 생성
        api_key_manager.generate_key(user_id="user1")
        api_key_manager.generate_key(user_id="user2")
        api_key_manager.generate_key(user_id="user1")
        
        # 전체 목록 조회
        all_keys = api_key_manager.list_keys()
        assert len(all_keys) == 3
        
        # 특정 사용자 목록 조회
        user1_keys = api_key_manager.list_keys(user_id="user1")
        assert len(user1_keys) == 2
        for key in user1_keys:
            assert key["user_id"] == "user1"
        
        # 키 해시 제외 확인
        for key in all_keys:
            assert "key_hash" not in key

    def test_storage_persistence(self, temp_storage_path):
        """저장소 지속성 테스트."""
        # 첫 번째 인스턴스로 키 생성
        manager1 = ApiKeyManager(storage_path=temp_storage_path)
        key_info = manager1.generate_key(
            scope="admin",
            description="Persistent key"
        )
        
        # 새 인스턴스가 이전 데이터를 로드하는지 확인
        manager2 = ApiKeyManager(storage_path=temp_storage_path)
        assert len(manager2._keys) == 1
        stored_key = manager2._keys[0]
        assert stored_key["id"] == key_info["key_id"]
        assert stored_key["scope"] == "admin"
        assert stored_key["description"] == "Persistent key" 