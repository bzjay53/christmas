"""
Christmas 프로젝트 - 인증 미들웨어 모듈
API 요청에 대한 인증 처리를 위한 미들웨어
"""

import logging
from typing import Callable, Dict, Optional
from fastapi import FastAPI, Request, HTTPException, Depends, Header, status
from fastapi.security import APIKeyHeader
from .api_key import get_api_key_manager

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# API 키 헤더 정의
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

async def get_api_key(api_key: str = Depends(API_KEY_HEADER)) -> Dict:
    """
    API 키 검증
    
    Args:
        api_key: HTTP 헤더에서 추출한 API 키
        
    Returns:
        유효한 API 키 정보
        
    Raises:
        HTTPException: API 키가 유효하지 않은 경우
    """
    if api_key is None:
        logger.warning("API 키 누락")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API 키가 필요합니다",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    key_info = get_api_key_manager().validate_key(api_key)
    
    if key_info is None:
        logger.warning(f"유효하지 않은 API 키 제공")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API 키가 유효하지 않습니다",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    return key_info

def verify_api_key_scope(required_scope: str):
    """
    API 키 스코프 검증 의존성
    
    Args:
        required_scope: 필요한 권한 스코프
    
    Returns:
        인증된 API 키 정보
    """
    async def verify_scope(key_info: Dict = Depends(get_api_key)):
        if key_info.get("scope") != required_scope and key_info.get("scope") != "full_access":
            logger.warning(f"불충분한 권한 스코프: {key_info.get('scope')}, 필요: {required_scope}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"이 작업에는 '{required_scope}' 권한이 필요합니다",
            )
        return key_info
    
    return verify_scope

def setup_api_auth(app: FastAPI):
    """
    FastAPI 앱에 API 키 인증 미들웨어 설정
    
    Args:
        app: FastAPI 앱 인스턴스
    """
    @app.middleware("http")
    async def log_auth_attempts(request: Request, call_next):
        # 요청 경로가 예외 목록에 있는지 확인
        exempt_paths = [
            "/docs", 
            "/redoc", 
            "/openapi.json",
            "/api/health",
            "/api/version",
            "/metrics"
        ]
        
        for path in exempt_paths:
            if request.url.path.startswith(path):
                return await call_next(request)
        
        # API 키 추출
        api_key = request.headers.get("X-API-Key")
        
        # 로깅 (실제 키는 로그에 기록하지 않음)
        if api_key:
            logger.info(f"API 키 인증 시도: 경로={request.url.path}")
        else:
            logger.warning(f"API 키 누락: 경로={request.url.path}")
        
        # 다음 핸들러로 요청 전달
        response = await call_next(request)
        
        # 인증 실패 로깅
        if response.status_code in (401, 403):
            logger.warning(f"인증 실패: 경로={request.url.path}, 상태={response.status_code}")
        
        return response 