#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import json
import logging
import datetime
from dotenv import load_dotenv

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("kis_api_test")

# 프로젝트 루트 경로 설정
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "../.."))
sys.path.insert(0, project_root)

# 환경 변수 로드
load_dotenv()

from app.broker.kr_investment import KoreaInvestmentAPI, KoreaInvestmentCredentials


def test_api_connection():
    """한국투자증권 API 연결 테스트"""
    logger.info("한국투자증권 API 연결 테스트 시작...")
    
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
        
        # 토큰 발급 테스트
        logger.info("토큰 발급 테스트...")
        token = api.get_access_token()
        if not token:
            logger.error("토큰 발급 실패")
            return False
        logger.info(f"토큰 발급 성공: {token[:10]}... (토큰 일부만 표시)")
        
        # 주식 현재가 조회 테스트
        logger.info("주식 현재가 조회 테스트...")
        sample_stock_code = "005930"  # 삼성전자
        stock_price_result = api.get_stock_price(sample_stock_code)
        if not stock_price_result:
            logger.error("주식 현재가 조회 실패")
            return False
        
        logger.info(f"주식 현재가 조회 성공: {json.dumps(stock_price_result, indent=2, ensure_ascii=False)}")
        
        # 테스트 성공
        logger.info("모든 API 연결 테스트가 성공적으로 완료되었습니다.")
        return True
        
    except Exception as e:
        logger.error(f"API 연결 테스트 중 오류 발생: {str(e)}")
        return False


def test_token_refresh():
    """토큰 갱신 테스트"""
    logger.info("토큰 갱신 테스트 시작...")
    
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
        
        # 토큰 발급
        logger.info("초기 토큰 발급...")
        initial_token = api.get_access_token()
        logger.info(f"초기 토큰: {initial_token[:10]}... (토큰 일부만 표시)")
        
        # 토큰 유효성 확인
        logger.info("토큰 유효성 확인...")
        is_valid = api.is_token_valid()
        logger.info(f"토큰 유효성: {is_valid}")
        
        # 강제로 토큰 만료시키기 위해 만료 시간 조작
        logger.info("토큰 만료 시간 조작...")
        original_expiry = api.token_expiry
        api.token_expiry = datetime.datetime.now() - datetime.timedelta(hours=1)
        
        # 토큰 유효성 재확인
        is_valid_after = api.is_token_valid()
        logger.info(f"조작 후 토큰 유효성: {is_valid_after}")
        
        # ensure_token 메서드 테스트 (자동 갱신)
        logger.info("자동 토큰 갱신 테스트...")
        renewed_token = api.ensure_token()
        logger.info(f"갱신된 토큰: {renewed_token[:10]}... (토큰 일부만 표시)")
        
        # 토큰이 갱신되었는지 확인
        if renewed_token != initial_token:
            logger.info("토큰이 성공적으로 갱신되었습니다.")
        else:
            logger.warning("토큰이 갱신되지 않았습니다.")
        
        # 원래 만료 시간 복원
        api.token_expiry = original_expiry
        
        # 테스트 성공
        logger.info("토큰 갱신 테스트가 성공적으로 완료되었습니다.")
        return True
        
    except Exception as e:
        logger.error(f"토큰 갱신 테스트 중 오류 발생: {str(e)}")
        return False


if __name__ == "__main__":
    logger.info("한국투자증권 API 테스트 스크립트 실행")
    
    connection_test_result = test_api_connection()
    logger.info(f"연결 테스트 결과: {'성공' if connection_test_result else '실패'}")
    
    token_refresh_test_result = test_token_refresh()
    logger.info(f"토큰 갱신 테스트 결과: {'성공' if token_refresh_test_result else '실패'}")
    
    if connection_test_result and token_refresh_test_result:
        logger.info("모든 테스트가 성공적으로 완료되었습니다.")
        sys.exit(0)
    else:
        logger.error("일부 테스트가 실패했습니다.")
        sys.exit(1) 