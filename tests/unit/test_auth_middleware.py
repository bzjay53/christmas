"""인증 미들웨어 단위 테스트."""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi import FastAPI, HTTPException, Request, status

from app.auth.middleware import get_api_key, verify_api_key_scope, setup_api_auth


class TestAuthMiddleware:
    """인증 미들웨어 테스트 클래스."""

    @pytest.fixture
    def mock_api_key_manager(self):
        """API 키 관리자 모의 객체."""
        with patch('app.auth.middleware.get_api_key_manager') as mock_get_manager:
            mock_manager = MagicMock()
            mock_get_manager.return_value = mock_manager
            yield mock_manager

    @pytest.mark.asyncio
    async def test_get_api_key_valid(self, mock_api_key_manager):
        """유효한 API 키 테스트."""
        # 모의 객체 설정
        mock_api_key_manager.validate_key.return_value = {
            "key_id": "test_id",
            "scope": "test_scope",
            "user_id": "test_user"
        }
        
        # 테스트
        result = await get_api_key("valid_api_key")
        
        # 검증
        assert result == {
            "key_id": "test_id",
            "scope": "test_scope",
            "user_id": "test_user"
        }
        mock_api_key_manager.validate_key.assert_called_once_with("valid_api_key")

    @pytest.mark.asyncio
    async def test_get_api_key_missing(self, mock_api_key_manager):
        """API 키 누락 테스트."""
        with pytest.raises(HTTPException) as exc_info:
            await get_api_key(None)
        
        # 예외 검증
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert "API 키가 필요합니다" in exc_info.value.detail
        assert exc_info.value.headers["WWW-Authenticate"] == "ApiKey"
        # API 키 관리자가 호출되지 않았는지 확인
        mock_api_key_manager.validate_key.assert_not_called()

    @pytest.mark.asyncio
    async def test_get_api_key_invalid(self, mock_api_key_manager):
        """유효하지 않은 API 키 테스트."""
        # 모의 객체 설정
        mock_api_key_manager.validate_key.return_value = None
        
        # 테스트
        with pytest.raises(HTTPException) as exc_info:
            await get_api_key("invalid_api_key")
        
        # 예외 검증
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert "API 키가 유효하지 않습니다" in exc_info.value.detail
        assert exc_info.value.headers["WWW-Authenticate"] == "ApiKey"
        # API 키 관리자가 호출되었는지 확인
        mock_api_key_manager.validate_key.assert_called_once_with("invalid_api_key")

    @pytest.mark.asyncio
    async def test_verify_scope_valid(self):
        """유효한 스코프 테스트."""
        # 모의 키 정보
        key_info = {"scope": "admin"}
        
        # 의존성 함수 생성
        verify_scope = verify_api_key_scope("admin")
        
        # 테스트
        result = await verify_scope(key_info)
        
        # 검증
        assert result == key_info

    @pytest.mark.asyncio
    async def test_verify_scope_invalid(self):
        """유효하지 않은 스코프 테스트."""
        # 모의 키 정보
        key_info = {"scope": "read_only"}
        
        # 의존성 함수 생성
        verify_scope = verify_api_key_scope("admin")
        
        # 테스트
        with pytest.raises(HTTPException) as exc_info:
            await verify_scope(key_info)
        
        # 예외 검증
        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "admin" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_verify_scope_full_access(self):
        """full_access 스코프 테스트."""
        # 모의 키 정보
        key_info = {"scope": "full_access"}
        
        # 의존성 함수 생성 (다른 권한 요구)
        verify_scope = verify_api_key_scope("admin")
        
        # 테스트 (full_access는 모든 권한을 가지므로 예외가 발생하지 않아야 함)
        result = await verify_scope(key_info)
        
        # 검증
        assert result == key_info

    @pytest.mark.asyncio
    async def test_setup_api_auth(self, mock_api_key_manager):
        """API 인증 미들웨어 설정 테스트."""
        # FastAPI 앱 인스턴스 생성
        app = FastAPI()
        
        # 미들웨어 설정
        setup_api_auth(app)
        
        # 미들웨어가 등록되었는지 확인
        assert len(app.middleware) > 0
        
        # 미들웨어 함수 추출 및 테스트
        middleware_func = None
        for middleware in app.middleware:
            if middleware.cls.__name__ == "Middleware" and middleware.cls.dispatch_func.__name__ == "log_auth_attempts":
                middleware_func = middleware.cls.dispatch_func
                break
        
        assert middleware_func is not None
        
        # 모의 요청 및 응답 생성
        mock_request = MagicMock(spec=Request)
        mock_request.url.path = "/api/data"
        mock_request.headers = {"X-API-Key": "test_key"}
        
        mock_call_next = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_call_next.return_value = mock_response
        
        # 미들웨어 함수 테스트
        response = await middleware_func(mock_request, mock_call_next)
        
        # 검증
        assert response == mock_response
        mock_call_next.assert_called_once_with(mock_request)

    @pytest.mark.asyncio
    async def test_middleware_exempt_paths(self, mock_api_key_manager):
        """미들웨어 예외 경로 테스트."""
        # FastAPI 앱 인스턴스 생성
        app = FastAPI()
        
        # 미들웨어 설정
        setup_api_auth(app)
        
        # 미들웨어 함수 추출
        middleware_func = None
        for middleware in app.middleware:
            if middleware.cls.__name__ == "Middleware" and middleware.cls.dispatch_func.__name__ == "log_auth_attempts":
                middleware_func = middleware.cls.dispatch_func
                break
        
        assert middleware_func is not None
        
        # 예외 경로에 대한 요청 테스트
        for exempt_path in ["/docs", "/redoc", "/openapi.json", "/api/health", "/api/version", "/metrics"]:
            # 모의 요청 및 응답 생성
            mock_request = MagicMock(spec=Request)
            mock_request.url.path = exempt_path
            mock_request.headers = {}  # API 키 없음
            
            mock_call_next = AsyncMock()
            mock_response = MagicMock()
            mock_call_next.return_value = mock_response
            
            # 미들웨어 함수 테스트
            response = await middleware_func(mock_request, mock_call_next)
            
            # 검증 (API 키 없어도 통과)
            assert response == mock_response
            mock_call_next.assert_called_once_with(mock_request)
            mock_call_next.reset_mock() 