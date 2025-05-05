from datetime import timedelta
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from .auth_service import (
    authenticate_user, 
    create_access_token, 
    get_current_active_user,
    check_user_role,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from .models import User, Token, UserCreate, UserUpdate, UserRole

# 라우터 정의
router = APIRouter()

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