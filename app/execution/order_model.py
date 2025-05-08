"""주문 모델 및 관련 클래스 정의."""
from enum import Enum, auto
from typing import Dict, Any, Optional, List
from datetime import datetime
import uuid
import pandas as pd


class OrderType(Enum):
    """주문 유형을 정의하는 열거형."""
    MARKET = "market"         # 시장가 주문
    LIMIT = "limit"           # 지정가 주문
    STOP = "stop"             # 스탑 주문
    STOP_LIMIT = "stop_limit" # 스탑 리밋 주문


class OrderSide(Enum):
    """주문 방향을 정의하는 열거형."""
    BUY = "buy"               # 매수
    SELL = "sell"             # 매도


class OrderStatus(Enum):
    """주문 상태를 정의하는 열거형."""
    PENDING = "pending"       # 대기 중
    ACCEPTED = "accepted"     # 접수됨
    PARTIALLY_FILLED = "partially_filled"  # 일부 체결
    FILLED = "filled"         # 전체 체결
    CANCELLED = "cancelled"   # 취소됨
    REJECTED = "rejected"     # 거부됨
    EXPIRED = "expired"       # 만료됨


class OrderTimeInForce(Enum):
    """주문 유효 기간을 정의하는 열거형."""
    GTC = "gtc"               # Good Till Cancelled (취소할 때까지 유효)
    IOC = "ioc"               # Immediate or Cancel (즉시 체결 또는 취소)
    FOK = "fok"               # Fill or Kill (전체 체결 또는 취소)
    DAY = "day"               # Day Order (당일 유효)


class Order:
    """주문 정보를 나타내는 클래스."""
    
    def __init__(
        self,
        symbol: str,
        side: OrderSide,
        order_type: OrderType,
        quantity: float,
        price: Optional[float] = None,
        stop_price: Optional[float] = None,
        time_in_force: OrderTimeInForce = OrderTimeInForce.GTC,
        strategy_id: Optional[str] = None,
        broker_id: Optional[str] = None,
        client_order_id: Optional[str] = None,
        parent_order_id: Optional[str] = None,
        meta: Optional[Dict[str, Any]] = None
    ):
        """
        주문 객체를 초기화합니다.
        
        Args:
            symbol: 매매 대상 종목의 심볼
            side: 매수/매도 방향
            order_type: 주문 유형 (시장가, 지정가 등)
            quantity: 주문 수량
            price: 주문 가격 (지정가 주문 시 필수)
            stop_price: 스탑 가격 (스탑 주문 시 필수)
            time_in_force: 주문 유효 기간
            strategy_id: 이 주문을 생성한 전략 ID
            broker_id: 증권사 ID
            client_order_id: 클라이언트 주문 ID (지정하지 않으면 자동 생성)
            parent_order_id: 부모 주문 ID (OCO, Bracket 주문 등에서 사용)
            meta: 추가 메타데이터
        """
        self.symbol = symbol
        self.side = side
        self.order_type = order_type
        self.quantity = quantity
        self.price = price
        self.stop_price = stop_price
        self.time_in_force = time_in_force
        self.strategy_id = strategy_id
        self.broker_id = broker_id
        self.client_order_id = client_order_id or str(uuid.uuid4())
        self.parent_order_id = parent_order_id
        self.meta = meta or {}
        
        # 주문 상태 정보
        self.status = OrderStatus.PENDING
        self.created_at = datetime.now()
        self.updated_at = self.created_at
        self.filled_quantity = 0.0
        self.filled_price = 0.0
        self.filled_at = None
        self.cancelled_at = None
        self.rejected_reason = None
        self.broker_order_id = None
        self.fills = []  # 체결 내역
        
        # 유효성 검사
        self._validate()
    
    def _validate(self) -> None:
        """주문의 유효성을 검사합니다."""
        if self.order_type in [OrderType.LIMIT, OrderType.STOP_LIMIT] and self.price is None:
            raise ValueError(f"{self.order_type.value} 주문에는 가격이 필요합니다.")
        
        if self.order_type in [OrderType.STOP, OrderType.STOP_LIMIT] and self.stop_price is None:
            raise ValueError(f"{self.order_type.value} 주문에는 스탑 가격이 필요합니다.")
        
        if self.quantity <= 0:
            raise ValueError("주문 수량은 0보다 커야 합니다.")
        
        if self.price is not None and self.price <= 0:
            raise ValueError("주문 가격은 0보다 커야 합니다.")
        
        if self.stop_price is not None and self.stop_price <= 0:
            raise ValueError("스탑 가격은 0보다 커야 합니다.")
    
    def update_status(self, status: OrderStatus, **kwargs) -> None:
        """
        주문 상태를 업데이트합니다.
        
        Args:
            status: 새로운 주문 상태
            **kwargs: 업데이트할 추가 속성
        """
        self.status = status
        self.updated_at = datetime.now()
        
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def add_fill(self, quantity: float, price: float, timestamp: Optional[datetime] = None) -> None:
        """
        체결 내역을 추가합니다.
        
        Args:
            quantity: 체결 수량
            price: 체결 가격
            timestamp: 체결 시각 (None이면 현재 시각)
        """
        fill_time = timestamp or datetime.now()
        
        fill = {
            "quantity": quantity,
            "price": price,
            "timestamp": fill_time,
            "fill_id": str(uuid.uuid4())
        }
        
        self.fills.append(fill)
        
        # 체결 수량과 평균 가격 업데이트
        self.filled_quantity += quantity
        
        # 평균 체결 가격 재계산
        total_value = sum(f["quantity"] * f["price"] for f in self.fills)
        self.filled_price = total_value / self.filled_quantity if self.filled_quantity > 0 else 0
        
        # 완전 체결 여부 확인
        if abs(self.filled_quantity - self.quantity) < 1e-6:  # 부동소수점 비교
            self.update_status(OrderStatus.FILLED, filled_at=fill_time)
        elif self.filled_quantity > 0:
            self.update_status(OrderStatus.PARTIALLY_FILLED)
    
    def to_dict(self) -> Dict[str, Any]:
        """주문 정보를 사전 형태로 변환합니다."""
        return {
            "client_order_id": self.client_order_id,
            "broker_order_id": self.broker_order_id,
            "parent_order_id": self.parent_order_id,
            "symbol": self.symbol,
            "side": self.side.value,
            "order_type": self.order_type.value,
            "quantity": self.quantity,
            "price": self.price,
            "stop_price": self.stop_price,
            "time_in_force": self.time_in_force.value,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "filled_quantity": self.filled_quantity,
            "filled_price": self.filled_price,
            "filled_at": self.filled_at.isoformat() if self.filled_at else None,
            "cancelled_at": self.cancelled_at.isoformat() if self.cancelled_at else None,
            "rejected_reason": self.rejected_reason,
            "strategy_id": self.strategy_id,
            "broker_id": self.broker_id,
            "fills": self.fills,
            "meta": self.meta
        }
    
    def __str__(self) -> str:
        status_str = self.status.value
        if self.status == OrderStatus.PARTIALLY_FILLED:
            status_str += f" ({self.filled_quantity}/{self.quantity})"
        
        price_str = f"@{self.price}" if self.price else ""
        if self.stop_price:
            price_str += f" stop@{self.stop_price}"
        
        return f"Order({self.client_order_id[:8]}, {self.symbol}, {self.side.value}, {self.quantity} {price_str}, {status_str})"


class OrderBook:
    """주문 관리 및 추적을 위한 주문대장 클래스."""
    
    def __init__(self):
        """주문대장을 초기화합니다."""
        self.orders: Dict[str, Order] = {}  # client_order_id -> Order
        self.broker_orders: Dict[str, str] = {}  # broker_order_id -> client_order_id
        self.symbol_orders: Dict[str, List[str]] = {}  # symbol -> [client_order_id, ...]
        self.strategy_orders: Dict[str, List[str]] = {}  # strategy_id -> [client_order_id, ...]
        self.active_orders: List[str] = []  # 활성 주문 IDs
    
    def add_order(self, order: Order) -> None:
        """
        주문을 추가합니다.
        
        Args:
            order: 추가할 주문 객체
        """
        # 주문 등록
        self.orders[order.client_order_id] = order
        
        # 브로커 ID가 있는 경우 매핑
        if order.broker_order_id:
            self.broker_orders[order.broker_order_id] = order.client_order_id
        
        # 심볼별 주문 추적
        if order.symbol not in self.symbol_orders:
            self.symbol_orders[order.symbol] = []
        self.symbol_orders[order.symbol].append(order.client_order_id)
        
        # 전략별 주문 추적
        if order.strategy_id:
            if order.strategy_id not in self.strategy_orders:
                self.strategy_orders[order.strategy_id] = []
            self.strategy_orders[order.strategy_id].append(order.client_order_id)
        
        # 활성 주문 추적
        if order.status in [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PARTIALLY_FILLED]:
            self.active_orders.append(order.client_order_id)
    
    def get_order(self, client_order_id: str) -> Optional[Order]:
        """
        클라이언트 ID로 주문을 조회합니다.
        
        Args:
            client_order_id: 조회할 주문의 클라이언트 ID
            
        Returns:
            Optional[Order]: 찾은 주문 객체 또는 None
        """
        return self.orders.get(client_order_id)
    
    def get_order_by_broker_id(self, broker_order_id: str) -> Optional[Order]:
        """
        브로커 ID로 주문을 조회합니다.
        
        Args:
            broker_order_id: 조회할 주문의 브로커 ID
            
        Returns:
            Optional[Order]: 찾은 주문 객체 또는 None
        """
        client_id = self.broker_orders.get(broker_order_id)
        if client_id:
            return self.orders.get(client_id)
        return None
    
    def update_order(self, client_order_id: str, **kwargs) -> Optional[Order]:
        """
        주문 정보를 업데이트합니다.
        
        Args:
            client_order_id: 업데이트할 주문의 클라이언트 ID
            **kwargs: 업데이트할 속성 및 값
            
        Returns:
            Optional[Order]: 업데이트된 주문 객체 또는 None
        """
        order = self.orders.get(client_order_id)
        if not order:
            return None
        
        # 주문 상태 변경
        if "status" in kwargs:
            order.update_status(kwargs.pop("status"), **kwargs)
        else:
            # 상태 변경 없이 속성만 업데이트
            for key, value in kwargs.items():
                if hasattr(order, key):
                    setattr(order, key, value)
            order.updated_at = datetime.now()
        
        # 상태에 따라 활성 주문 목록 업데이트
        if order.status in [OrderStatus.FILLED, OrderStatus.CANCELLED, OrderStatus.REJECTED, OrderStatus.EXPIRED]:
            if client_order_id in self.active_orders:
                self.active_orders.remove(client_order_id)
        
        # 브로커 ID가 추가된 경우 맵에 추가
        if order.broker_order_id and order.broker_order_id not in self.broker_orders:
            self.broker_orders[order.broker_order_id] = client_order_id
        
        return order
    
    def get_orders_by_symbol(self, symbol: str) -> List[Order]:
        """
        특정 심볼의 모든 주문을 조회합니다.
        
        Args:
            symbol: 조회할 심볼
            
        Returns:
            List[Order]: 해당 심볼의 주문 목록
        """
        order_ids = self.symbol_orders.get(symbol, [])
        return [self.orders[oid] for oid in order_ids if oid in self.orders]
    
    def get_orders_by_strategy(self, strategy_id: str) -> List[Order]:
        """
        특정 전략의 모든 주문을 조회합니다.
        
        Args:
            strategy_id: 조회할 전략 ID
            
        Returns:
            List[Order]: 해당 전략의 주문 목록
        """
        order_ids = self.strategy_orders.get(strategy_id, [])
        return [self.orders[oid] for oid in order_ids if oid in self.orders]
    
    def get_active_orders(self) -> List[Order]:
        """
        모든 활성 주문을 조회합니다.
        
        Returns:
            List[Order]: 활성 주문 목록
        """
        return [self.orders[oid] for oid in self.active_orders if oid in self.orders]
    
    def get_active_orders_by_symbol(self, symbol: str) -> List[Order]:
        """
        특정 심볼의 모든 활성 주문을 조회합니다.
        
        Args:
            symbol: 조회할 심볼
            
        Returns:
            List[Order]: 해당 심볼의 활성 주문 목록
        """
        return [order for order in self.get_active_orders() if order.symbol == symbol]
    
    def get_order_history(self) -> pd.DataFrame:
        """
        모든 주문 내역을 데이터프레임으로 반환합니다.
        
        Returns:
            pd.DataFrame: 주문 내역 데이터프레임
        """
        if not self.orders:
            return pd.DataFrame()
        
        orders_data = [order.to_dict() for order in self.orders.values()]
        df = pd.DataFrame(orders_data)
        
        # 날짜 타입 변환
        for col in ['created_at', 'updated_at', 'filled_at', 'cancelled_at']:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col])
        
        return df 