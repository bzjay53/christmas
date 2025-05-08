"""주문 모델 테스트."""

import pytest
from datetime import datetime
from app.execution.order_model import Order, OrderBook, OrderType, OrderSide, OrderStatus, OrderTimeInForce


def test_order_creation():
    """기본 주문 생성 테스트."""
    order = Order(
        symbol="005930",  # 삼성전자
        side=OrderSide.BUY,
        order_type=OrderType.LIMIT,
        quantity=10,
        price=67000,
        strategy_id="test_strategy"
    )
    
    assert order.symbol == "005930"
    assert order.side == OrderSide.BUY
    assert order.order_type == OrderType.LIMIT
    assert order.quantity == 10
    assert order.price == 67000
    assert order.strategy_id == "test_strategy"
    assert order.status == OrderStatus.PENDING
    assert order.filled_quantity == 0.0
    assert order.filled_price == 0.0
    assert order.fills == []


def test_order_validation():
    """주문 유효성 검사 테스트."""
    # 지정가 주문에 가격이 없는 경우
    with pytest.raises(ValueError):
        Order(
            symbol="005930",
            side=OrderSide.BUY,
            order_type=OrderType.LIMIT,
            quantity=10,
            price=None
        )
    
    # 스탑 주문에 스탑 가격이 없는 경우
    with pytest.raises(ValueError):
        Order(
            symbol="005930",
            side=OrderSide.SELL,
            order_type=OrderType.STOP,
            quantity=10,
            price=67000,
            stop_price=None
        )
    
    # 주문 수량이 0 이하인 경우
    with pytest.raises(ValueError):
        Order(
            symbol="005930",
            side=OrderSide.BUY,
            order_type=OrderType.MARKET,
            quantity=0
        )


def test_order_update_status():
    """주문 상태 업데이트 테스트."""
    order = Order(
        symbol="005930",
        side=OrderSide.BUY,
        order_type=OrderType.MARKET,
        quantity=10
    )
    
    # 초기 상태
    assert order.status == OrderStatus.PENDING
    
    # 접수 상태로 변경
    order.update_status(OrderStatus.ACCEPTED)
    assert order.status == OrderStatus.ACCEPTED
    
    # 일부 체결로 변경
    order.update_status(OrderStatus.PARTIALLY_FILLED, filled_quantity=5.0, filled_price=67000.0)
    assert order.status == OrderStatus.PARTIALLY_FILLED
    assert order.filled_quantity == 5.0
    assert order.filled_price == 67000.0
    
    # 전체 체결로 변경
    filled_at = datetime.now()
    order.update_status(OrderStatus.FILLED, filled_at=filled_at, filled_quantity=10.0)
    assert order.status == OrderStatus.FILLED
    assert order.filled_at == filled_at
    assert order.filled_quantity == 10.0


def test_order_add_fill():
    """주문 체결 내역 추가 테스트."""
    order = Order(
        symbol="005930",
        side=OrderSide.BUY,
        order_type=OrderType.LIMIT,
        quantity=10,
        price=67000
    )
    
    # 첫 번째 체결 추가
    order.add_fill(5, 67000)
    assert order.filled_quantity == 5
    assert order.filled_price == 67000
    assert len(order.fills) == 1
    assert order.status == OrderStatus.PARTIALLY_FILLED
    
    # 두 번째 체결 추가
    order.add_fill(5, 67100)
    assert order.filled_quantity == 10
    assert order.filled_price == 67050  # (67000*5 + 67100*5) / 10
    assert len(order.fills) == 2
    assert order.status == OrderStatus.FILLED
    assert order.filled_at is not None


def test_order_to_dict():
    """주문 정보 딕셔너리 변환 테스트."""
    order = Order(
        symbol="005930",
        side=OrderSide.BUY,
        order_type=OrderType.LIMIT,
        quantity=10,
        price=67000,
        strategy_id="test_strategy",
        client_order_id="test1234"
    )
    
    order_dict = order.to_dict()
    assert order_dict["client_order_id"] == "test1234"
    assert order_dict["symbol"] == "005930"
    assert order_dict["side"] == "buy"
    assert order_dict["order_type"] == "limit"
    assert order_dict["quantity"] == 10
    assert order_dict["price"] == 67000
    assert order_dict["strategy_id"] == "test_strategy"
    assert order_dict["status"] == "pending"


def test_orderbook_add_order():
    """주문대장 주문 추가 테스트."""
    order_book = OrderBook()
    
    # 첫 번째 주문 추가
    order1 = Order(
        symbol="005930",
        side=OrderSide.BUY,
        order_type=OrderType.LIMIT,
        quantity=10,
        price=67000,
        strategy_id="strategy1",
        client_order_id="order1"
    )
    
    order_book.add_order(order1)
    assert "order1" in order_book.orders
    assert "005930" in order_book.symbol_orders
    assert "strategy1" in order_book.strategy_orders
    assert "order1" in order_book.active_orders
    
    # 두 번째 주문 추가
    order2 = Order(
        symbol="005930",
        side=OrderSide.SELL,
        order_type=OrderType.MARKET,
        quantity=5,
        strategy_id="strategy2",
        client_order_id="order2"
    )
    
    order_book.add_order(order2)
    assert "order2" in order_book.orders
    assert len(order_book.symbol_orders["005930"]) == 2
    assert "strategy2" in order_book.strategy_orders
    assert "order2" in order_book.active_orders


def test_orderbook_get_order():
    """주문대장 주문 조회 테스트."""
    order_book = OrderBook()
    
    order = Order(
        symbol="005930",
        side=OrderSide.BUY,
        order_type=OrderType.LIMIT,
        quantity=10,
        price=67000,
        client_order_id="test_order"
    )
    
    order_book.add_order(order)
    
    # 클라이언트 ID로 조회
    retrieved_order = order_book.get_order("test_order")
    assert retrieved_order == order
    
    # 없는 주문 ID 조회
    not_found_order = order_book.get_order("not_exists")
    assert not_found_order is None


def test_orderbook_update_order():
    """주문대장 주문 업데이트 테스트."""
    order_book = OrderBook()
    
    order = Order(
        symbol="005930",
        side=OrderSide.BUY,
        order_type=OrderType.LIMIT,
        quantity=10,
        price=67000,
        client_order_id="test_order"
    )
    
    order_book.add_order(order)
    
    # 주문 상태 업데이트
    order_book.update_order("test_order", status=OrderStatus.ACCEPTED, broker_order_id="broker123")
    
    updated_order = order_book.get_order("test_order")
    assert updated_order.status == OrderStatus.ACCEPTED
    assert updated_order.broker_order_id == "broker123"
    
    # 브로커 ID로 조회 테스트
    by_broker_id = order_book.get_order_by_broker_id("broker123")
    assert by_broker_id == updated_order
    
    # 주문 취소 처리
    order_book.update_order("test_order", status=OrderStatus.CANCELLED)
    
    cancelled_order = order_book.get_order("test_order")
    assert cancelled_order.status == OrderStatus.CANCELLED
    assert "test_order" not in order_book.active_orders


def test_orderbook_get_orders_by_symbol():
    """심볼별 주문 조회 테스트."""
    order_book = OrderBook()
    
    # 삼성전자 주문 추가
    order1 = Order(
        symbol="005930",
        side=OrderSide.BUY,
        order_type=OrderType.LIMIT,
        quantity=10,
        price=67000,
        client_order_id="samsung1"
    )
    
    order2 = Order(
        symbol="005930",
        side=OrderSide.SELL,
        order_type=OrderType.LIMIT,
        quantity=5,
        price=68000,
        client_order_id="samsung2"
    )
    
    # SK하이닉스 주문 추가
    order3 = Order(
        symbol="000660",
        side=OrderSide.BUY,
        order_type=OrderType.MARKET,
        quantity=20,
        client_order_id="skhynix1"
    )
    
    order_book.add_order(order1)
    order_book.add_order(order2)
    order_book.add_order(order3)
    
    # 삼성전자 주문 조회
    samsung_orders = order_book.get_orders_by_symbol("005930")
    assert len(samsung_orders) == 2
    assert {order.client_order_id for order in samsung_orders} == {"samsung1", "samsung2"}
    
    # SK하이닉스 주문 조회
    skhynix_orders = order_book.get_orders_by_symbol("000660")
    assert len(skhynix_orders) == 1
    assert skhynix_orders[0].client_order_id == "skhynix1"


def test_orderbook_get_active_orders():
    """활성 주문 조회 테스트."""
    order_book = OrderBook()
    
    # 주문 추가
    order1 = Order(
        symbol="005930",
        side=OrderSide.BUY,
        order_type=OrderType.LIMIT,
        quantity=10,
        price=67000,
        client_order_id="order1"
    )
    
    order2 = Order(
        symbol="000660",
        side=OrderSide.BUY,
        order_type=OrderType.MARKET,
        quantity=20,
        client_order_id="order2"
    )
    
    order_book.add_order(order1)
    order_book.add_order(order2)
    
    # 초기 활성 주문 조회
    active_orders = order_book.get_active_orders()
    assert len(active_orders) == 2
    
    # 첫 번째 주문 체결 처리
    order_book.update_order("order1", status=OrderStatus.FILLED)
    
    # 활성 주문 재조회
    active_orders = order_book.get_active_orders()
    assert len(active_orders) == 1
    assert active_orders[0].client_order_id == "order2"
    
    # 특정 심볼의 활성 주문 조회
    active_skhynix = order_book.get_active_orders_by_symbol("000660")
    assert len(active_skhynix) == 1
    assert active_skhynix[0].client_order_id == "order2"
    
    # 삼성전자의 활성 주문은 없음
    active_samsung = order_book.get_active_orders_by_symbol("005930")
    assert len(active_samsung) == 0 