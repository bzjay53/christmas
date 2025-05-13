#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
한국투자증권 API 토큰 갱신 테스트 스크립트
"""

import os
import sys
import json
import logging
import time
import datetime
from dotenv import load_dotenv

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("token_refresh_test")

# 프로젝트 루트 경로 설정
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "../.."))
sys.path.insert(0, project_root)

# 환경 변수 로드
load_dotenv()

from app.broker.kr_investment import KoreaInvestmentAPI, KoreaInvestmentCredentials


def test_token_refresh_cycle():
    """토큰 갱신 주기 테스트"""
    logger.info("API 토큰 갱신 주기 테스트 시작...")
    
    try:
        # 환경 변수에서 API 키 정보 가져오기
        app_key = os.environ.get("KIS_MOCK_APP_KEY")
        app_secret = os.environ.get("KIS_MOCK_APP_SECRET")
        account_number = os.environ.get("KIS_MOCK_ACCOUNT")
        
        if not all([app_key, app_secret, account_number]):
            logger.error("환경 변수에 API 키 정보가 설정되지 않았습니다.")
            return False
        
        # 인증 정보 생성
        credentials = KoreaInvestmentCredentials(
            app_key=app_key,
            app_secret=app_secret,
            account_number=account_number,
            is_virtual=True  # 모의투자 API 사용
        )
        
        # API 클라이언트 생성
        api = KoreaInvestmentAPI(credentials)
        
        # 초기 토큰 발급
        logger.info("초기 토큰 발급 중...")
        initial_token = api.get_access_token()
        initial_expiry = api.token_expiry
        
        if not initial_token:
            logger.error("초기 토큰 발급 실패")
            return False
        
        logger.info(f"초기 토큰: {initial_token[:10]}... (일부만 표시)")
        logger.info(f"초기 만료 시간: {initial_expiry}")
        
        # 만료 시간 10분 전으로 조작
        logger.info("토큰 만료 시간 10분 전으로 조작...")
        api.token_expiry = datetime.datetime.now() + datetime.timedelta(minutes=5)
        fake_expiry = api.token_expiry
        logger.info(f"조작된 만료 시간: {fake_expiry}")
        
        # 토큰 유효성 확인
        is_valid = api.is_token_valid()
        logger.info(f"토큰 유효성: {is_valid} (False 예상)")
        
        # ensure_token 메서드 호출 (자동 갱신)
        logger.info("토큰 자동 갱신 확인...")
        renewed_token = api.ensure_token()
        renewed_expiry = api.token_expiry
        
        if renewed_token == initial_token:
            logger.error("토큰이 갱신되지 않았습니다.")
            return False
        
        logger.info(f"갱신된 토큰: {renewed_token[:10]}... (일부만 표시)")
        logger.info(f"갱신된 만료 시간: {renewed_expiry}")
        
        # 테스트 성공
        logger.info("토큰 갱신 주기 테스트 성공")
        return True
        
    except Exception as e:
        logger.error(f"토큰 갱신 주기 테스트 중 오류 발생: {str(e)}")
        return False


def test_token_continuous_use():
    """토큰 지속적 사용 시나리오 테스트"""
    logger.info("API 토큰 지속적 사용 테스트 시작...")
    
    try:
        # 환경 변수에서 API 키 정보 가져오기
        app_key = os.environ.get("KIS_MOCK_APP_KEY")
        app_secret = os.environ.get("KIS_MOCK_APP_SECRET")
        account_number = os.environ.get("KIS_MOCK_ACCOUNT")
        
        if not all([app_key, app_secret, account_number]):
            logger.error("환경 변수에 API 키 정보가 설정되지 않았습니다.")
            return False
        
        # 인증 정보 생성
        credentials = KoreaInvestmentCredentials(
            app_key=app_key,
            app_secret=app_secret,
            account_number=account_number,
            is_virtual=True  # 모의투자 API 사용
        )
        
        # API 클라이언트 생성
        api = KoreaInvestmentAPI(credentials)
        
        # 초기 토큰 발급
        logger.info("초기 토큰 발급 중...")
        api.get_access_token()
        
        # 여러 번 API 호출 시뮬레이션
        logger.info("API 반복 호출 시뮬레이션...")
        sample_stock_code = "005930"  # 삼성전자
        
        for i in range(5):
            logger.info(f"API 호출 {i+1}번째...")
            
            # 일부러 토큰 만료 시간 조작 (3번째 호출 시)
            if i == 2:
                logger.info("3번째 호출에서 토큰 만료 시간 조작...")
                api.token_expiry = datetime.datetime.now() - datetime.timedelta(minutes=5)
            
            # API 호출
            result = api.get_stock_price(sample_stock_code)
            
            if not result:
                logger.error(f"{i+1}번째 API 호출 실패")
                return False
            
            logger.info(f"{i+1}번째 API 호출 성공")
            time.sleep(1)  # API 호출 간 지연
        
        # 테스트 성공
        logger.info("토큰 지속적 사용 테스트 성공")
        return True
        
    except Exception as e:
        logger.error(f"토큰 지속적 사용 테스트 중 오류 발생: {str(e)}")
        return False


if __name__ == "__main__":
    logger.info("한국투자증권 API 토큰 갱신 테스트 스크립트 실행")
    
    refresh_test_result = test_token_refresh_cycle()
    logger.info(f"토큰 갱신 주기 테스트 결과: {'성공' if refresh_test_result else '실패'}")
    
    continuous_test_result = test_token_continuous_use()
    logger.info(f"토큰 지속적 사용 테스트 결과: {'성공' if continuous_test_result else '실패'}")
    
    if refresh_test_result and continuous_test_result:
        logger.info("모든 테스트가 성공적으로 완료되었습니다.")
        sys.exit(0)
    else:
        logger.error("일부 테스트가 실패했습니다.")
        sys.exit(1) 