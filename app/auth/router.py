from datetime import timedelta
from typing import Dict, Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from .auth_service import (
    authenticate_user, 
    create_access_token, 
    get_current_active_user,
    check_user_role,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from .models import User, Token, UserCreate, UserUpdate, UserRole
from .api_key import get_api_key_manager

# 라우터 정의
router = APIRouter()

# API 키 요청/응답 모델
class ApiKeyRequest(BaseModel):
    user_id: str
    permissions: List[str] = ["read"]
    description: str = ""
    expires_in_days: int = 90

class ApiKeyResponse(BaseModel):
    api_key: str
    expires_at: str = None

class ApiKeyValidationRequest(BaseModel):
    api_key: str

class ApiKeyValidationResponse(BaseModel):
    is_valid: bool
    user_id: str = ""
    permissions: List[str] = []

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()) -> Dict[str, Any]:
    """
    OAuth2 호환 토큰 로그인, 액세스 토큰을 얻습니다.
    """
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "roles": [role for role in user.roles]},
        expires_delta=access_token_expires
    )
    
    # 현재 시간 + 만료 시간을 timestamp로 변환
    expires_at = (timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES) + timedelta(seconds=0)).total_seconds()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_at": expires_at
    }


@router.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)) -> User:
    """
    현재 인증된 사용자 정보를 가져옵니다.
    """
    return current_user


@router.get("/users/me/items")
async def read_own_items(
    current_user: User = Depends(check_user_role([UserRole.USER]))
) -> Dict[str, Any]:
    """
    현재 인증된 사용자의 항목을 가져옵니다. (USER 권한 필요)
    """
    return {"owner": current_user.username, "items": []}


@router.get("/admin")
async def read_admin_data(
    current_user: User = Depends(check_user_role([UserRole.ADMIN]))
) -> Dict[str, Any]:
    """
    관리자 전용 데이터를 가져옵니다. (ADMIN 권한 필요)
    """
    return {"message": "관리자 전용 데이터", "user": current_user.username}


# 테스트를 위한 API 키 관련 엔드포인트 추가
@router.post("/api-key", response_model=ApiKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(request: ApiKeyRequest) -> Dict[str, Any]:
    """
    API 키를 생성합니다.
    """
    api_key_manager = get_api_key_manager()
    result = api_key_manager.generate_key(
        scope=",".join(request.permissions),
        expires_in_days=request.expires_in_days,
        user_id=request.user_id,
        description=request.description
    )
    
    return {
        "api_key": result["api_key"],
        "expires_at": result["expires_at"]
    }


@router.post("/validate-key", response_model=ApiKeyValidationResponse)
async def validate_api_key(request: ApiKeyValidationRequest) -> Dict[str, Any]:
    """
    API 키의 유효성을 검증합니다.
    """
    api_key_manager = get_api_key_manager()
    result = api_key_manager.validate_key(request.api_key)
    
    if not result:
        # 유효하지 않은 API 키에 대해 400 Bad Request 반환
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="유효하지 않은 API 키 형식입니다",
        )
    
    return {
        "is_valid": True,
        "user_id": result["user_id"],
        "permissions": result["scope"].split(",") if result["scope"] else []
    } 