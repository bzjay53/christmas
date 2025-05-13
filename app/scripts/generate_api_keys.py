#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
베타 테스트 API 키 생성 스크립트
"""

import os
import sys
import json
import logging
import uuid
import datetime
import secrets
from dotenv import load_dotenv

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("generate_api_keys")

# 프로젝트 루트 경로 설정
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "../.."))
sys.path.insert(0, project_root)

# 환경 변수 로드
load_dotenv()

# 데이터베이스 연결 설정
from app.db.database import get_db_session
from app.models.user import User
from app.models.api_key import APIKey


def generate_api_key():
    """API 키 생성"""
    return "beta_" + secrets.token_hex(16)


def generate_api_secret():
    """API 시크릿 생성"""
    return secrets.token_urlsafe(32)


def generate_beta_api_keys():
    """베타 테스트 사용자를 위한 API 키 생성"""
    logger.info("베타 테스트 API 키 생성 시작...")
    
    try:
        # 데이터베이스 세션 생성
        db = next(get_db_session())
        
        # 베타 테스터 사용자 조회
        beta_users = db.query(User).filter(User.is_beta_tester == True).all()
        
        if not beta_users:
            logger.warning("베타 테스터가 없습니다. 먼저 베타 테스트 사용자를 생성하세요.")
            return False
        
        logger.info(f"{len(beta_users)}명의 베타 테스터를 찾았습니다.")
        
        # API 키 정보를 저장할 리스트
        api_keys_info = []
        
        for user in beta_users:
            # 이미 API 키가 있는지 확인
            existing_key = db.query(APIKey).filter(
                APIKey.user_id == user.id,
                APIKey.key_type == "beta_test"
            ).first()
            
            if existing_key:
                logger.info(f"사용자 {user.username}에게 이미 API 키가 있습니다.")
                
                # 기존 키 정보 추가
                api_keys_info.append({
                    "username": user.username,
                    "api_key": existing_key.api_key,
                    "api_secret": "********", # 보안상 이유로 기존 시크릿은 표시하지 않음
                    "created_at": existing_key.created_at.isoformat(),
                    "expires_at": existing_key.expires_at.isoformat() if existing_key.expires_at else None
                })
                
                continue
            
            # 새 API 키 및 시크릿 생성
            api_key = generate_api_key()
            api_secret = generate_api_secret()
            
            # 만료일 설정 (3개월 후)
            expires_at = datetime.datetime.now() + datetime.timedelta(days=90)
            
            # API 키 저장
            new_api_key = APIKey(
                user_id=user.id,
                api_key=api_key,
                api_secret=api_secret,
                key_type="beta_test",
                description=f"베타 테스트용 API 키 - {user.username}",
                created_at=datetime.datetime.now(),
                expires_at=expires_at,
                is_active=True,
                permissions="read,write,trade"
            )
            db.add(new_api_key)
            
            # API 키 정보 추가
            api_keys_info.append({
                "username": user.username,
                "api_key": api_key,
                "api_secret": api_secret,
                "created_at": new_api_key.created_at.isoformat(),
                "expires_at": expires_at.isoformat()
            })
        
        # 변경사항 커밋
        db.commit()
        
        # API 키 정보 파일 저장
        output_file = os.path.join(project_root, "environments", "beta", "beta_api_keys.json")
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(api_keys_info, f, indent=2, ensure_ascii=False)
        
        logger.info(f"총 {len(api_keys_info)}개의 API 키가 생성되었습니다.")
        logger.info(f"API 키 정보가 저장된 파일: {output_file}")
        
        # 사용자별 개별 파일도 생성
        keys_dir = os.path.join(project_root, "environments", "beta", "api_keys")
        os.makedirs(keys_dir, exist_ok=True)
        
        for key_info in api_keys_info:
            user_file = os.path.join(keys_dir, f"{key_info['username']}_api_key.json")
            with open(user_file, "w", encoding="utf-8") as f:
                json.dump(key_info, f, indent=2, ensure_ascii=False)
        
        logger.info(f"사용자별 API 키 파일이 {keys_dir} 디렉토리에 생성되었습니다.")
        
        return True
        
    except Exception as e:
        logger.error(f"API 키 생성 중 오류 발생: {str(e)}")
        return False


if __name__ == "__main__":
    logger.info("베타 테스트 API 키 생성 스크립트 실행")
    
    success = generate_beta_api_keys()
    
    if success:
        logger.info("API 키 생성이 완료되었습니다.")
        sys.exit(0)
    else:
        logger.error("API 키 생성 중 오류가 발생했습니다.")
        sys.exit(1) 