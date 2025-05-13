#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
베타 테스트 사용자 계정 생성 스크립트
"""

import os
import sys
import json
import logging
import random
import string
import datetime
from dotenv import load_dotenv

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("create_test_users")

# 프로젝트 루트 경로 설정
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "../.."))
sys.path.insert(0, project_root)

# 환경 변수 로드
load_dotenv()

# 데이터베이스 연결 설정
from app.db.database import get_db_session
from app.models.user import User
from app.models.account import Account
from app.models.role import Role, UserRole
from app.models.permission import Permission, RolePermission
from app.core.security import get_password_hash


def generate_random_password(length=12):
    """무작위 암호 생성"""
    chars = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(chars) for _ in range(length))


def create_test_users():
    """베타 테스트 사용자 계정 생성"""
    logger.info("베타 테스트 사용자 계정 생성 시작...")
    
    # 테스트 사용자 정보
    beta_users = [
        # 전문 트레이더 그룹 (그룹 1)
        {"username": "beta_trader_1", "email": "trader1@example.com", "first_name": "김", "last_name": "트레이더", "group": "expert", "role": "beta_trader"},
        {"username": "beta_trader_2", "email": "trader2@example.com", "first_name": "이", "last_name": "전문가", "group": "expert", "role": "beta_trader"},
        {"username": "beta_trader_3", "email": "trader3@example.com", "first_name": "박", "last_name": "애널리스트", "group": "expert", "role": "beta_trader"},
        {"username": "beta_trader_4", "email": "trader4@example.com", "first_name": "최", "last_name": "투자자", "group": "expert", "role": "beta_trader"},
        {"username": "beta_trader_5", "email": "trader5@example.com", "first_name": "정", "last_name": "트레이더", "group": "expert", "role": "beta_trader"},
        {"username": "beta_trader_6", "email": "trader6@example.com", "first_name": "강", "last_name": "전문가", "group": "expert", "role": "beta_trader"},
        {"username": "beta_trader_7", "email": "trader7@example.com", "first_name": "조", "last_name": "애널리스트", "group": "expert", "role": "beta_trader"},
        {"username": "beta_trader_8", "email": "trader8@example.com", "first_name": "윤", "last_name": "투자자", "group": "expert", "role": "beta_trader"},
        {"username": "beta_trader_9", "email": "trader9@example.com", "first_name": "장", "last_name": "전문가", "group": "expert", "role": "beta_trader"},
        {"username": "beta_trader_10", "email": "trader10@example.com", "first_name": "임", "last_name": "트레이더", "group": "expert", "role": "beta_trader"},
        
        # 일반 사용자 그룹 (그룹 2)
        {"username": "beta_user_1", "email": "user1@example.com", "first_name": "김", "last_name": "사용자", "group": "regular", "role": "beta_user"},
        {"username": "beta_user_2", "email": "user2@example.com", "first_name": "이", "last_name": "테스터", "group": "regular", "role": "beta_user"},
        {"username": "beta_user_3", "email": "user3@example.com", "first_name": "박", "last_name": "일반인", "group": "regular", "role": "beta_user"},
        {"username": "beta_user_4", "email": "user4@example.com", "first_name": "최", "last_name": "사용자", "group": "regular", "role": "beta_user"},
        {"username": "beta_user_5", "email": "user5@example.com", "first_name": "정", "last_name": "테스터", "group": "regular", "role": "beta_user"},
        {"username": "beta_user_6", "email": "user6@example.com", "first_name": "강", "last_name": "일반인", "group": "regular", "role": "beta_user"},
        {"username": "beta_user_7", "email": "user7@example.com", "first_name": "조", "last_name": "사용자", "group": "regular", "role": "beta_user"},
        {"username": "beta_user_8", "email": "user8@example.com", "first_name": "윤", "last_name": "테스터", "group": "regular", "role": "beta_user"},
        {"username": "beta_user_9", "email": "user9@example.com", "first_name": "장", "last_name": "일반인", "group": "regular", "role": "beta_user"},
        {"username": "beta_user_10", "email": "user10@example.com", "first_name": "임", "last_name": "사용자", "group": "regular", "role": "beta_user"},
    ]
    
    try:
        # 데이터베이스 세션 생성
        db = next(get_db_session())
        
        # 역할 생성 (없는 경우)
        beta_trader_role = db.query(Role).filter(Role.name == "beta_trader").first()
        if not beta_trader_role:
            beta_trader_role = Role(
                name="beta_trader",
                description="베타 테스트 전문 트레이더 역할",
                created_at=datetime.datetime.now()
            )
            db.add(beta_trader_role)
            db.flush()
            
            # 전문 트레이더 권한 설정
            permissions = [
                "view_dashboard", "execute_trade", "manage_strategy", 
                "view_reports", "view_portfolio", "export_data", 
                "run_backtest", "send_feedback", "use_advanced_features"
            ]
            
            for perm_name in permissions:
                perm = db.query(Permission).filter(Permission.name == perm_name).first()
                if not perm:
                    perm = Permission(name=perm_name, description=f"{perm_name} 권한")
                    db.add(perm)
                    db.flush()
                
                # 역할에 권한 연결
                role_perm = RolePermission(
                    role_id=beta_trader_role.id,
                    permission_id=perm.id
                )
                db.add(role_perm)
        
        # 일반 사용자 역할 생성 (없는 경우)
        beta_user_role = db.query(Role).filter(Role.name == "beta_user").first()
        if not beta_user_role:
            beta_user_role = Role(
                name="beta_user",
                description="베타 테스트 일반 사용자 역할",
                created_at=datetime.datetime.now()
            )
            db.add(beta_user_role)
            db.flush()
            
            # 일반 사용자 권한 설정
            permissions = [
                "view_dashboard", "execute_trade", "view_reports",
                "view_portfolio", "send_feedback", "run_backtest"
            ]
            
            for perm_name in permissions:
                perm = db.query(Permission).filter(Permission.name == perm_name).first()
                if not perm:
                    perm = Permission(name=perm_name, description=f"{perm_name} 권한")
                    db.add(perm)
                    db.flush()
                
                # 역할에 권한 연결
                role_perm = RolePermission(
                    role_id=beta_user_role.id,
                    permission_id=perm.id
                )
                db.add(role_perm)
        
        # 테스트 사용자 생성
        created_users = []
        
        for user_info in beta_users:
            # 이미 존재하는 사용자인지 확인
            existing_user = db.query(User).filter(User.username == user_info["username"]).first()
            if existing_user:
                logger.info(f"이미 존재하는 사용자: {user_info['username']}")
                continue
            
            # 임시 비밀번호 생성
            temp_password = generate_random_password()
            hashed_password = get_password_hash(temp_password)
            
            # 새 사용자 생성
            new_user = User(
                username=user_info["username"],
                email=user_info["email"],
                hashed_password=hashed_password,
                first_name=user_info["first_name"],
                last_name=user_info["last_name"],
                is_active=True,
                is_beta_tester=True,
                beta_group=user_info["group"],
                created_at=datetime.datetime.now()
            )
            db.add(new_user)
            db.flush()
            
            # 사용자에게 역할 할당
            role = beta_trader_role if user_info["role"] == "beta_trader" else beta_user_role
            user_role = UserRole(
                user_id=new_user.id,
                role_id=role.id
            )
            db.add(user_role)
            
            # 계정 생성
            account = Account(
                user_id=new_user.id,
                account_name=f"{user_info['username']}의 베타 계정",
                account_type="beta_test",
                balance=1000000.0,  # 100만원 초기 자산
                currency="KRW",
                is_active=True,
                created_at=datetime.datetime.now()
            )
            db.add(account)
            
            created_users.append({
                "username": user_info["username"],
                "email": user_info["email"],
                "password": temp_password,
                "group": user_info["group"],
                "role": user_info["role"]
            })
        
        # 변경사항 커밋
        db.commit()
        
        # 사용자 정보 파일 저장
        output_file = os.path.join(project_root, "environments", "beta", "beta_test_users.json")
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(created_users, f, indent=2, ensure_ascii=False)
        
        logger.info(f"총 {len(created_users)}명의 테스트 사용자가 생성되었습니다.")
        logger.info(f"사용자 정보가 저장된 파일: {output_file}")
        
        return True
        
    except Exception as e:
        logger.error(f"테스트 사용자 생성 중 오류 발생: {str(e)}")
        return False


if __name__ == "__main__":
    logger.info("베타 테스트 사용자 생성 스크립트 실행")
    
    success = create_test_users()
    
    if success:
        logger.info("테스트 사용자 생성이 완료되었습니다.")
        sys.exit(0)
    else:
        logger.error("테스트 사용자 생성 중 오류가 발생했습니다.")
        sys.exit(1) 