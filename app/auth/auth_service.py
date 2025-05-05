from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Union

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext

from .models import User, TokenData, UserRole

# 설정 값 (실제로는 환경 변수나 설정 파일에서 불러와야 함)
SECRET_KEY = "YOUR_SECRET_KEY_HERE"  # 실제로는 환경 변수에서 불러옴
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# 임시 사용자 DB (실제로는 데이터베이스 사용)
fake_users_db = {
    "admin@example.com": {
        "id": "1",
        "email": "admin@example.com",
        "username": "admin",
        "full_name": "Admin User",
        "hashed_password": pwd_context.hash("adminpassword"),
        "disabled": False,
        "roles": [UserRole.ADMIN, UserRole.USER],
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    },
    "user@example.com": {
        "id": "2",
        "email": "user@example.com",
        "username": "user",
        "full_name": "Normal User",
        "hashed_password": pwd_context.hash("userpassword"),
        "disabled": False,
        "roles": [UserRole.USER],
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }
}


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호 검증"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """비밀번호 해싱"""
    return pwd_context.hash(password)


def get_user(email: str) -> Optional[User]:
    """이메일로 사용자 조회"""
    if email not in fake_users_db:
        return None
    user_data = fake_users_db[email]
    return User(**user_data)


def authenticate_user(email: str, password: str) -> Optional[User]:
    """사용자 인증"""
    user = get_user(email)
    if not user:
        return None
    if not verify_password(password, fake_users_db[email]["hashed_password"]):
        return None
    return user


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """JWT 액세스 토큰 생성"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire.timestamp()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """현재 인증된 사용자 가져오기"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        
        token_data = TokenData(
            sub=email,
            exp=payload.get("exp"),
            roles=payload.get("roles", [UserRole.USER])
        )
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = get_user(token_data.sub)
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """현재 활성화된 사용자 가져오기"""
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def check_user_role(required_roles: List[UserRole]):
    """사용자 역할 확인 의존성"""
    async def check_role(current_user: User = Depends(get_current_active_user)) -> User:
        for role in required_roles:
            if role in current_user.roles:
                return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return check_role 