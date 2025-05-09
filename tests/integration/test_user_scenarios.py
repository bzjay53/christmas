"""
Christmas 프로젝트 - 사용자 시나리오 통합 테스트
"""
import pytest
import time
import random
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.api.main import app

# 테스트 클라이언트 생성
client = TestClient(app)

def get_test_api_key(user_id=None, permissions=None):
    """테스트용 API 키 생성"""
    if user_id is None:
        user_id = f"test_user_{random.randint(1000, 9999)}"
    
    if permissions is None:
        permissions = ["read", "write"]
        
    auth_response = client.post(
        "/auth/api-key",
        json={"user_id": user_id, "permissions": permissions}
    )
    
    assert auth_response.status_code == 201
    return user_id, auth_response.json()["api_key"]

def test_user_onboarding_scenario():
    """사용자 온보딩 시나리오 테스트 (간소화)"""
    # 1. 사용자 API 키 생성
    user_id, api_key = get_test_api_key(
        user_id="new_trader",
        permissions=["read", "write"]
    )
    headers = {"X-API-Key": api_key}
    
    # 2. 보호된 리소스 접근 확인
    protected_response = client.get(
        "/api/protected-resource",
        headers=headers
    )
    
    assert protected_response.status_code == 200
    assert protected_response.json()["user_id"] == "new_trader"
    
    # 3. 마켓 데이터 조회 시도
    signals_response = client.get(
        "/api/v1/signals?symbol=BTC/USDT&limit=5",
        headers=headers
    )
    
    assert signals_response.status_code == 200
    assert isinstance(signals_response.json(), list)

def test_trader_workflow_scenario():
    """트레이더 워크플로우 시나리오 테스트 (간소화)"""
    # 1. 트레이더 API 키 생성
    user_id, api_key = get_test_api_key(
        user_id="active_trader",
        permissions=["read", "write", "trade"]
    )
    headers = {"X-API-Key": api_key}
    
    # 2. 시장 데이터 수집 API 테스트
    market_data = {
        "symbol": "BTC/USDT",
        "timestamp": datetime.now().isoformat(),
        "price": 50000.0,
        "volume": 1.5,
        "bid": 49990.0,
        "ask": 50010.0,
        "source": "test"
    }
    
    ingest_response = client.post(
        "/api/v1/ingest/market-data",
        json=market_data,
        headers=headers
    )
    
    assert ingest_response.status_code == 200
    assert "data_id" in ingest_response.json()

def test_error_recovery_scenario():
    """오류 복구 시나리오 테스트 (간소화)"""
    # 1. API 키 생성
    user_id, api_key = get_test_api_key(
        user_id="error_recovery_user",
        permissions=["read", "write"]
    )
    headers = {"X-API-Key": api_key}
    
    # 2. 잘못된 요청 시도 (필수 필드 누락)
    invalid_market_data = {
        "symbol": "BTC/USDT",
        # timestamp 누락
        "price": 50000.0
        # volume 누락
    }
    
    error_response = client.post(
        "/api/v1/ingest/market-data",
        json=invalid_market_data,
        headers=headers
    )
    
    # 에러 응답 확인 - 서버 오류가 아닌 클라이언트 오류여야 함
    assert error_response.status_code < 500 