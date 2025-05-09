"""
Christmas 프로젝트 - 모듈 간 통합 테스트
"""
import pytest
import time
import json
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.api.main import app

# 테스트 클라이언트 생성
client = TestClient(app)

def get_test_api_key():
    """테스트용 API 키 생성"""
    auth_response = client.post(
        "/auth/api-key",
        json={"user_id": "test_module_integration", "permissions": ["write", "read"]}
    )
    
    assert auth_response.status_code == 201
    return auth_response.json()["api_key"]

def test_auth_to_protected_resource():
    """인증 -> 보호된 리소스 접근 통합 테스트"""
    # API 키 생성
    api_key = get_test_api_key()
    headers = {"X-API-Key": api_key}
    
    # 보호된 리소스 접근
    response = client.get(
        "/api/protected-resource",
        headers=headers
    )
    
    # 접근 성공 확인
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "user_id" in data
    assert data["user_id"] == "test_module_integration"
    
    # 잘못된 API 키로 접근
    invalid_headers = {"X-API-Key": "invalid_key"}
    invalid_response = client.get(
        "/api/protected-resource",
        headers=invalid_headers
    )
    
    # 접근 실패 확인
    assert invalid_response.status_code == 401

def test_full_data_pipeline():
    """시장 데이터 -> 시그널 -> 주문 전체 파이프라인 테스트"""
    # API 키 생성
    api_key = get_test_api_key()
    headers = {"X-API-Key": api_key}
    
    # 1. 시장 데이터 수집
    market_data = {
        "symbol": "AAPL/USD",
        "timestamp": datetime.now().isoformat(),
        "price": 180.5,
        "volume": 10000,
        "bid": 180.4,
        "ask": 180.6,
        "source": "integration_test"
    }
    
    ingest_response = client.post(
        "/api/v1/ingest/market-data",
        json=market_data,
        headers=headers
    )
    
    assert ingest_response.status_code == 200
    data_id = ingest_response.json()["data_id"]
    
    # 시간 지연 (데이터 처리 대기)
    time.sleep(2)
    
    # 2. 시그널 생성 및 조회
    signals_response = client.get(
        f"/api/v1/signals?symbol={market_data['symbol']}&limit=5",
        headers=headers
    )
    
    assert signals_response.status_code == 200
    signals = signals_response.json()
    
    # 시그널이 없을 경우 직접 생성
    if len(signals) == 0:
        # 테스트용 시그널 생성
        test_signal = {
            "symbol": market_data['symbol'],
            "strategy": "integration_test_strategy",
            "signal_type": "buy",
            "confidence": 0.9,
            "price": market_data['price'],
            "timestamp": datetime.now().isoformat(),
            "metadata": {
                "data_id": data_id,
                "test": True
            }
        }
        
        signal_create_response = client.post(
            "/api/v1/signals",
            json=test_signal,
            headers=headers
        )
        
        assert signal_create_response.status_code == 200
        signal_id = signal_create_response.json()["signal_id"]
    else:
        # 기존 시그널 사용
        signal_id = signals[0]["id"]
    
    # 시간 지연 (주문 생성 대기)
    time.sleep(2)
    
    # 3. 주문 조회
    orders_response = client.get(
        f"/api/v1/orders?signal_id={signal_id}",
        headers=headers
    )
    
    assert orders_response.status_code == 200
    orders = orders_response.json()
    
    # 주문이 생성되었는지 확인
    assert len(orders) > 0
    
    # 주문 정보 검증
    order = orders[0]
    assert "id" in order
    assert "symbol" in order
    assert "order_type" in order
    assert "side" in order
    assert "price" in order
    assert "quantity" in order
    assert "status" in order
    assert "signal_id" in order
    assert order["signal_id"] == signal_id

def test_error_handling():
    """에러 핸들링 통합 테스트"""
    # API 키 생성
    api_key = get_test_api_key()
    headers = {"X-API-Key": api_key}
    
    # 1. 잘못된 데이터 형식 테스트
    invalid_data = {
        "symbol": "BTC/USDT",
        # timestamp 필드 누락
        "price": "invalid_price",  # 숫자가 아닌 문자열
        "volume": -1,  # 음수 볼륨
    }
    
    ingest_response = client.post(
        "/api/v1/ingest/market-data",
        json=invalid_data,
        headers=headers
    )
    
    # 에러 응답 확인 - 실패하더라도 서버 오류가 아닌 클라이언트 오류여야 함
    assert ingest_response.status_code < 500
    
    # 2. 잘못된 시그널 데이터 테스트
    invalid_signal = {
        "symbol": "BTC/USDT",
        "strategy": "test_strategy",
        "signal_type": "invalid_type",  # 유효하지 않은 시그널 타입
        "confidence": 2.0,  # 범위 초과
        "price": -100.0,  # 음수 가격
    }
    
    signal_response = client.post(
        "/api/v1/signals",
        json=invalid_signal,
        headers=headers
    )
    
    # 에러 응답 확인 - 실패하더라도 서버 오류가 아닌 클라이언트 오류여야 함
    assert signal_response.status_code < 500 