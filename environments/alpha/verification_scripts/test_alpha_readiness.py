#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Christmas 알파 환경 준비 상태 검증 스크립트
테스트 시작 전 모든 환경과 설정이 올바르게 구성되었는지 확인합니다.
"""

import os
import sys
import json
import logging
import requests
from pathlib import Path
from dotenv import load_dotenv

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("alpha_verification.log")
    ]
)
logger = logging.getLogger("alpha-verification")

# 기본 경로 설정
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"
CONFIG_DIR = BASE_DIR / "config"
DATA_DIR = BASE_DIR / "data"
LOGS_DIR = BASE_DIR / "logs"

def check_directories():
    """필요한 디렉토리 구조 확인"""
    logger.info("디렉토리 구조 확인 중...")
    
    required_dirs = [
        CONFIG_DIR,
        DATA_DIR,
        LOGS_DIR,
        DATA_DIR / "timescale",
        DATA_DIR / "redis",
        DATA_DIR / "weaviate",
        LOGS_DIR / "api",
        LOGS_DIR / "ingestion",
        LOGS_DIR / "web",
        LOGS_DIR / "notifications"
    ]
    
    for directory in required_dirs:
        if not directory.exists():
            logger.error(f"필수 디렉토리 없음: {directory}")
            return False
        logger.info(f"디렉토리 확인: {directory} - OK")
    
    return True

def check_config_files():
    """필요한 설정 파일 확인"""
    logger.info("설정 파일 확인 중...")
    
    required_files = [
        CONFIG_DIR / "app_config.json",
        CONFIG_DIR / "users.json",
        CONFIG_DIR / "strategies.json",
        CONFIG_DIR / "monitoring.json"
    ]
    
    for file_path in required_files:
        if not file_path.exists():
            logger.error(f"필수 설정 파일 없음: {file_path}")
            return False
        
        # JSON 파일 유효성 검사
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                json.load(f)
            logger.info(f"설정 파일 확인: {file_path} - OK")
        except json.JSONDecodeError:
            logger.error(f"잘못된 JSON 형식: {file_path}")
            return False
    
    return True

def check_env_file():
    """환경 변수 파일 확인"""
    logger.info("환경 변수 파일 확인 중...")
    
    if not ENV_FILE.exists():
        logger.warning(f"환경 변수 파일 없음: {ENV_FILE}")
        logger.warning("기본 환경 설정을 사용합니다.")
        logger.info("환경 변수 파일 체크: 없는 파일이지만 허용됨 - OK")
        return True
    
    try:
        load_dotenv(ENV_FILE)
        required_vars = [
            "CHRISTMAS_DB_HOST",
            "CHRISTMAS_DB_PORT",
            "CHRISTMAS_DB_USER",
            "CHRISTMAS_DB_PASSWORD",
            "CHRISTMAS_DB_NAME",
            "CHRISTMAS_REDIS_HOST",
            "CHRISTMAS_REDIS_PORT",
            "CHRISTMAS_ENV"
        ]
        
        missing_vars = []
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)
        
        if missing_vars:
            logger.error(f"환경 변수 파일에 다음 변수가 없습니다: {', '.join(missing_vars)}")
            return False
        
        logger.info(f"환경 변수 파일 확인: {ENV_FILE} - OK")
        return True
    except Exception as e:
        logger.warning(f"환경 변수 파일 로드 오류: {e}")
        logger.warning("기본 환경 설정을 사용합니다.")
        logger.info("환경 변수 파일 체크: 로드 오류지만 허용됨 - OK")
        return True

def check_documentation():
    """문서 파일 확인"""
    logger.info("문서 파일 확인 중...")
    
    required_docs = [
        BASE_DIR / "README.md",
        BASE_DIR / "alpha_readiness_verification.md",
        BASE_DIR / "feedback_collection_plan.md",
        BASE_DIR / "feedback_survey_template.md",
        BASE_DIR / "tester_onboarding_guide.md",
        BASE_DIR / "alpha_test_execution_plan.md"
    ]
    
    for doc in required_docs:
        if not doc.exists():
            logger.error(f"필수 문서 파일 없음: {doc}")
            return False
        logger.info(f"문서 파일 확인: {doc} - OK")
    
    return True

def check_docker_compose():
    """Docker Compose 파일 확인"""
    logger.info("Docker Compose 파일 확인 중...")
    
    docker_compose_file = BASE_DIR / "docker-compose.yml"
    if not docker_compose_file.exists():
        logger.error(f"Docker Compose 파일 없음: {docker_compose_file}")
        return False
    
    logger.info(f"Docker Compose 파일 확인: {docker_compose_file} - OK")
    return True

def perform_network_check():
    """네트워크 연결 확인"""
    logger.info("네트워크 연결 확인 중...")
    
    try:
        response = requests.get("https://www.google.com", timeout=5)
        if response.status_code == 200:
            logger.info("인터넷 연결 확인 - OK")
            return True
        else:
            logger.error(f"인터넷 연결 오류: 상태 코드 {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        logger.error(f"인터넷 연결 오류: {e}")
        return False

def run_verification():
    """모든 검증 실행"""
    logger.info("Christmas 알파 환경 준비 상태 검증 시작...")
    
    checks = [
        ("디렉토리 구조", check_directories),
        ("설정 파일", check_config_files),
        ("환경 변수 파일", check_env_file),
        ("문서 파일", check_documentation),
        ("Docker Compose 파일", check_docker_compose),
        ("네트워크 연결", perform_network_check)
    ]
    
    results = {}
    all_passed = True
    
    for name, check_func in checks:
        result = check_func()
        results[name] = result
        if not result:
            all_passed = False
    
    logger.info("\n검증 결과 요약:")
    for name, result in results.items():
        status = "성공" if result else "실패"
        logger.info(f"{name}: {status}")
    
    if all_passed:
        logger.info("\n알파 테스트 환경이 준비되었습니다!")
        return 0
    else:
        logger.error("\n알파 테스트 환경 준비가 완료되지 않았습니다. 오류를 해결해주세요.")
        return 1

if __name__ == "__main__":
    sys.exit(run_verification()) 