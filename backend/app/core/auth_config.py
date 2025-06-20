#!/usr/bin/env python3
"""
Firebase Authentication 설정 및 관리
Christmas Trading 프로젝트용 사용자 인증 시스템
"""

import os
import jwt
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from functools import wraps

try:
    import firebase_admin
    from firebase_admin import auth
    from .firebase_config import firebase_manager
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("Warning: Firebase Admin SDK not available for authentication.", file=sys.stderr)

class AuthManager:
    """Firebase Authentication 관리 클래스"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # JWT 설정
        self.secret_key = os.getenv('SECRET_KEY', 'christmas-trading-secret-key')
        self.algorithm = os.getenv('ALGORITHM', 'HS256')
        self.access_token_expire_minutes = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '30'))
        
        if not FIREBASE_AVAILABLE:
            self.logger.warning("Firebase Authentication not available")
    
    # ==================== Firebase Authentication ====================
    
    async def create_firebase_user(self, email: str, password: str, 
                                 display_name: str = None, 
                                 custom_claims: Dict[str, Any] = None) -> Optional[str]:
        """Firebase 사용자 생성"""
        if not FIREBASE_AVAILABLE:
            return None
            
        try:
            # Firebase 사용자 생성
            user = auth.create_user(
                email=email,
                password=password,
                display_name=display_name,
                email_verified=False
            )
            
            # 커스텀 클레임 설정 (역할, 권한 등)
            if custom_claims:
                auth.set_custom_user_claims(user.uid, custom_claims)
            
            # Firestore에 사용자 프로필 생성
            user_data = {
                'email': email,
                'displayName': display_name or '',
                'tier': custom_claims.get('tier', 'basic') if custom_claims else 'basic',
                'role': custom_claims.get('role', 'user') if custom_claims else 'user',
                'settings': {
                    'kis_api': {
                        'app_key': '',
                        'account': '',
                        'mock_mode': True
                    },
                    'ai_config': {
                        'openai_key': '',
                        'model': 'gpt-4o-mini',
                        'risk_tolerance': 0.5,
                        'learning_enabled': False
                    },
                    'notifications': {
                        'telegram': False,
                        'email': True,
                        'telegram_chat_id': ''
                    }
                },
                'status': 'active',
                'emailVerified': False
            }
            
            success = await firebase_manager.create_user(user.uid, user_data)
            if success:
                self.logger.info(f"Firebase 사용자 생성 완료: {user.uid} ({email})")
                return user.uid
            else:
                # Firestore 저장 실패 시 Firebase 사용자 삭제
                auth.delete_user(user.uid)
                self.logger.error(f"Firestore 사용자 프로필 생성 실패, Firebase 사용자 삭제: {email}")
                return None
                
        except Exception as e:
            self.logger.error(f"Firebase 사용자 생성 실패 ({email}): {e}")
            return None
    
    async def verify_firebase_token(self, id_token: str) -> Optional[Dict[str, Any]]:
        """Firebase ID 토큰 검증"""
        if not FIREBASE_AVAILABLE:
            return None
            
        try:
            # Firebase ID 토큰 검증
            decoded_token = auth.verify_id_token(id_token)
            
            # Firestore에서 사용자 정보 조회
            user_data = await firebase_manager.get_user(decoded_token['uid'])
            
            if user_data:
                return {
                    'uid': decoded_token['uid'],
                    'email': decoded_token.get('email'),
                    'email_verified': decoded_token.get('email_verified', False),
                    'role': decoded_token.get('role', 'user'),
                    'tier': user_data.get('tier', 'basic'),
                    'profile': user_data
                }
            else:
                self.logger.warning(f"Firestore에서 사용자 프로필을 찾을 수 없음: {decoded_token['uid']}")
                return None
                
        except Exception as e:
            self.logger.error(f"Firebase 토큰 검증 실패: {e}")
            return None
    
    async def update_user_claims(self, uid: str, custom_claims: Dict[str, Any]) -> bool:
        """사용자 커스텀 클레임 업데이트"""
        if not FIREBASE_AVAILABLE:
            return False
            
        try:
            auth.set_custom_user_claims(uid, custom_claims)
            
            # Firestore 프로필도 업데이트
            update_data = {}
            if 'role' in custom_claims:
                update_data['role'] = custom_claims['role']
            if 'tier' in custom_claims:
                update_data['tier'] = custom_claims['tier']
            
            if update_data:
                success = await firebase_manager.update_user(uid, update_data)
                if success:
                    self.logger.info(f"사용자 클레임 업데이트 완료: {uid}")
                    return True
            
            return True
            
        except Exception as e:
            self.logger.error(f"사용자 클레임 업데이트 실패 ({uid}): {e}")
            return False
    
    async def delete_user(self, uid: str) -> bool:
        """사용자 삭제"""
        if not FIREBASE_AVAILABLE:
            return False
            
        try:
            # Firebase 사용자 삭제
            auth.delete_user(uid)
            
            # Firestore 데이터는 보관 (상태만 변경)
            update_data = {
                'status': 'deleted',
                'deletedAt': datetime.now(timezone.utc).isoformat()
            }
            
            await firebase_manager.update_user(uid, update_data)
            
            self.logger.info(f"사용자 삭제 완료: {uid}")
            return True
            
        except Exception as e:
            self.logger.error(f"사용자 삭제 실패 ({uid}): {e}")
            return False
    
    # ==================== JWT 토큰 관리 ====================
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: timedelta = None) -> str:
        """JWT 액세스 토큰 생성"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_access_token(self, token: str) -> Optional[Dict[str, Any]]:
        """JWT 액세스 토큰 검증"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            self.logger.warning("JWT 토큰이 만료됨")
            return None
        except jwt.JWTError as e:
            self.logger.error(f"JWT 토큰 검증 실패: {e}")
            return None
    
    def create_service_token(self, service_name: str, permissions: list = None) -> str:
        """서비스 간 통신용 JWT 토큰 생성"""
        data = {
            "sub": service_name,
            "type": "service",
            "permissions": permissions or [],
            "iss": "christmas-trading-backend"
        }
        
        # 서비스 토큰은 더 긴 유효시간 (24시간)
        expires_delta = timedelta(hours=24)
        return self.create_access_token(data, expires_delta)
    
    # ==================== 권한 관리 ====================
    
    def check_permission(self, user_data: Dict[str, Any], required_permission: str) -> bool:
        """사용자 권한 확인"""
        user_role = user_data.get('role', 'user')
        user_tier = user_data.get('tier', 'basic')
        
        # 역할 기반 권한 매핑
        role_permissions = {
            'admin': ['*'],  # 모든 권한
            'premium_user': ['trading.execute', 'trading.view', 'ai.use', 'data.export'],
            'user': ['trading.view', 'portfolio.view'],
            'guest': ['market.view']
        }
        
        # 티어 기반 추가 권한
        tier_permissions = {
            'premium': ['ai.advanced', 'data.realtime'],
            'basic': ['data.delayed'],
            'trial': ['trading.demo']
        }
        
        # 사용자 권한 목록 구성
        user_permissions = role_permissions.get(user_role, [])
        user_permissions.extend(tier_permissions.get(user_tier, []))
        
        # 관리자는 모든 권한
        if '*' in user_permissions:
            return True
        
        # 특정 권한 확인
        return required_permission in user_permissions
    
    # ==================== 데코레이터 ====================
    
    def require_auth(self, required_permission: str = None):
        """인증 및 권한 확인 데코레이터"""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # 요청에서 토큰 추출 (구현은 웹 프레임워크에 따라 다름)
                # 여기서는 예시로 kwargs에서 추출
                token = kwargs.get('auth_token')
                
                if not token:
                    raise Exception("인증 토큰이 필요합니다")
                
                # Firebase 토큰 또는 JWT 토큰 검증
                user_data = None
                
                # Firebase ID 토큰 시도
                if token.startswith('eyJ'):  # JWT 형태
                    user_data = await self.verify_firebase_token(token)
                
                # JWT 액세스 토큰 시도
                if not user_data:
                    jwt_payload = self.verify_access_token(token)
                    if jwt_payload:
                        uid = jwt_payload.get('sub')
                        if uid:
                            profile = await firebase_manager.get_user(uid)
                            if profile:
                                user_data = {
                                    'uid': uid,
                                    'profile': profile,
                                    'role': profile.get('role', 'user'),
                                    'tier': profile.get('tier', 'basic')
                                }
                
                if not user_data:
                    raise Exception("유효하지 않은 인증 토큰입니다")
                
                # 권한 확인
                if required_permission and not self.check_permission(user_data, required_permission):
                    raise Exception(f"권한이 부족합니다: {required_permission}")
                
                # 사용자 정보를 함수에 전달
                kwargs['current_user'] = user_data
                
                return await func(*args, **kwargs)
            
            return wrapper
        return decorator

# 전역 인증 매니저 인스턴스
auth_manager = AuthManager()

# 편의 함수들
async def create_user(email: str, password: str, display_name: str = None, 
                     tier: str = 'basic', role: str = 'user') -> Optional[str]:
    """사용자 생성 편의 함수"""
    custom_claims = {'tier': tier, 'role': role}
    return await auth_manager.create_firebase_user(email, password, display_name, custom_claims)

async def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """토큰 검증 편의 함수"""
    return await auth_manager.verify_firebase_token(token)

def create_token(user_data: Dict[str, Any]) -> str:
    """토큰 생성 편의 함수"""
    return auth_manager.create_access_token(user_data)

# 개발/테스트용 함수
async def create_test_users():
    """테스트용 사용자 생성"""
    if not FIREBASE_AVAILABLE:
        print("❌ Firebase를 사용할 수 없습니다.")
        return
    
    test_users = [
        {
            'email': 'admin@christmas-trading.com',
            'password': 'ChristmasTrading2024!',
            'display_name': 'Christmas Admin',
            'tier': 'premium',
            'role': 'admin'
        },
        {
            'email': 'trader@christmas-trading.com',
            'password': 'Trader2024!',
            'display_name': 'Premium Trader',
            'tier': 'premium',
            'role': 'premium_user'
        },
        {
            'email': 'user@christmas-trading.com',
            'password': 'User2024!',
            'display_name': 'Basic User',
            'tier': 'basic',
            'role': 'user'
        }
    ]
    
    created_users = []
    
    for user_info in test_users:
        uid = await create_user(
            email=user_info['email'],
            password=user_info['password'],
            display_name=user_info['display_name'],
            tier=user_info['tier'],
            role=user_info['role']
        )
        
        if uid:
            created_users.append({'uid': uid, 'email': user_info['email']})
            print(f"✅ 테스트 사용자 생성: {user_info['email']} ({uid})")
        else:
            print(f"❌ 테스트 사용자 생성 실패: {user_info['email']}")
    
    return created_users

if __name__ == "__main__":
    import asyncio
    
    # 인증 시스템 테스트
    async def main():
        print("🔐 Firebase Authentication 테스트 시작...")
        
        # 테스트 사용자 생성 (주석 해제하여 실행)
        # await create_test_users()
        
        # JWT 토큰 테스트
        test_data = {'sub': 'test_user', 'role': 'user', 'tier': 'basic'}
        token = auth_manager.create_access_token(test_data)
        print(f"🔑 생성된 JWT 토큰: {token[:50]}...")
        
        # 토큰 검증 테스트
        verified = auth_manager.verify_access_token(token)
        print(f"✅ 토큰 검증 결과: {verified}")
        
        # 서비스 토큰 생성 테스트
        service_token = auth_manager.create_service_token('trading-system', ['trading.execute'])
        print(f"🔧 서비스 토큰: {service_token[:50]}...")
    
    asyncio.run(main())