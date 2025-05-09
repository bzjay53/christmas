"""
Christmas 프로젝트 - 데이터 흐름 통합 테스트
"""
import pytest
import time
from datetime import datetime
from fastapi.testclient import TestClient

from app.api.main import app

# 테스트 클라이언트 생성
client = TestClient(app)

# 직접 테스트에 필요한 모델 클래스 정의
class MarketData:
    """시장 데이터 모델"""
    def __init__(self, symbol, timestamp, price, volume, bid, ask, source):
        self.symbol = symbol
        self.timestamp = timestamp
        self.price = price
        self.volume = volume
        self.bid = bid
        self.ask = ask
        self.source = source

class Signal:
    """시그널 모델"""
    def __init__(self, symbol, strategy, signal_type, confidence, price, timestamp, metadata=None):
        self.symbol = symbol
        self.strategy = strategy
        self.signal_type = signal_type  # buy or sell
        self.confidence = confidence
        self.price = price
        self.timestamp = timestamp
        self.metadata = metadata or {}


def test_data_ingestion_to_signal():
    """데이터 수집에서 신호 생성까지의 흐름 테스트"""
    # API 키 생성 (테스트용)
    auth_response = client.post(
        "/auth/api-key",
        json={"user_id": "test_integration", "permissions": ["write", "read"]}
    )
    api_key = auth_response.json()["api_key"]
    headers = {"X-API-Key": api_key}
    
    # 테스트 데이터 생성
    test_market_data = {
        "symbol": "BTC/USDT",
        "timestamp": datetime.now().isoformat(),
        "price": 50000.0,
        "volume": 1.5,
        "bid": 49990.0,
        "ask": 50010.0,
        "source": "test"
    }
    
    # 데이터 수집 엔드포인트로 데이터 전송
    ingest_response = client.post(
        "/api/v1/ingest/market-data",
        json=test_market_data,
        headers=headers
    )
    
    assert ingest_response.status_code == 200
    
    # 시그널 생성까지 약간의 지연 허용
    time.sleep(2)
    
    # 생성된 시그널 조회
    signals_response = client.get(
        f"/api/v1/signals?symbol={test_market_data['symbol']}&limit=5",
        headers=headers
    )
    
    assert signals_response.status_code == 200
    signals = signals_response.json()
    
    # 시그널이 생성되었는지 확인
    assert len(signals) > 0
    
    # 가장 최근 시그널이 우리가 보낸 데이터에 기반하는지 확인
    latest_signal = signals[0]
    assert latest_signal["symbol"] == test_market_data["symbol"]
    assert "strategy" in latest_signal
    assert "signal_type" in latest_signal  # buy 또는 sell
    assert "confidence" in latest_signal  # 신뢰도 점수
    assert "timestamp" in latest_signal


def test_signal_to_order():
    """신호에서 주문 생성까지의 흐름 테스트"""
    # API 키 생성 (테스트용)
    auth_response = client.post(
        "/auth/api-key",
        json={"user_id": "test_integration", "permissions": ["write", "read"]}
    )
    api_key = auth_response.json()["api_key"]
    headers = {"X-API-Key": api_key}
    
    # 테스트 시그널 직접 생성
    test_signal = {
        "symbol": "ETH/USDT",
        "strategy": "test_strategy",
        "signal_type": "buy",
        "confidence": 0.85,
        "price": 3000.0,
        "timestamp": datetime.now().isoformat(),
        "metadata": {
            "reason": "통합 테스트",
            "indicators": {
                "rsi": 30,
                "macd": 0.5
            }
        }
    }
    
    # 시그널 생성 엔드포인트로 데이터 전송
    signal_response = client.post(
        "/api/v1/signals",
        json=test_signal,
        headers=headers
    )
    
    assert signal_response.status_code == 200
    signal_id = signal_response.json()["signal_id"]
    
    # 주문 생성까지 약간의 지연 허용
    time.sleep(2)
    
    # 생성된 주문 조회
    orders_response = client.get(
        f"/api/v1/orders?signal_id={signal_id}",
        headers=headers
    )
    
    assert orders_response.status_code == 200
    orders = orders_response.json()
    
    # 주문이 생성되었는지 확인
    assert len(orders) > 0
    
    # 주문이 시그널에 기반하는지 확인
    order = orders[0]
    assert order["symbol"] == test_signal["symbol"]
    assert order["order_type"] in ["market", "limit"]
    assert order["side"] == test_signal["signal_type"]  # buy 또는 sell
    assert order["status"] in ["created", "pending", "filled", "canceled"]
    assert "price" in order 