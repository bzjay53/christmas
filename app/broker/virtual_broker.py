"""
모의투자 시스템 모듈
실제 API 연동 없이 로컬에서 시뮬레이션하는 가상 브로커
"""

import datetime
import uuid
import logging
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

@dataclass
class VirtualPosition:
    """가상 포지션 정보"""
    symbol: str  # 종목코드
    quantity: int  # 수량
    avg_price: float  # 평균 매수가
    current_price: float = 0  # 현재가
    
    @property
    def total_value(self) -> float:
        """포지션 총 가치"""
        return self.quantity * self.current_price
    
    @property
    def profit_loss(self) -> float:
        """손익"""
        return (self.current_price - self.avg_price) * self.quantity
    
    @property
    def profit_loss_percent(self) -> float:
        """손익률"""
        if self.avg_price == 0:
            return 0
        return ((self.current_price / self.avg_price) - 1) * 100

@dataclass
class VirtualOrder:
    """가상 주문 정보"""
    order_id: str  # 주문 ID
    symbol: str  # 종목코드
    order_type: str  # 주문 타입 (buy 또는 sell)
    price: float  # 주문 가격
    quantity: int  # 주문 수량
    status: str = "pending"  # 주문 상태 (pending, filled, canceled)
    filled_quantity: int = 0  # 체결된 수량
    order_time: datetime.datetime = field(default_factory=datetime.datetime.now)
    filled_time: Optional[datetime.datetime] = None
    
    @property
    def is_complete(self) -> bool:
        """주문이 완료되었는지 여부"""
        return self.status in ["filled", "canceled"]
    
    @property
    def remaining_quantity(self) -> int:
        """남은 수량"""
        return self.quantity - self.filled_quantity

@dataclass
class VirtualAccount:
    """가상 계좌 정보"""
    account_id: str  # 계좌 ID
    cash_balance: float  # 현금 잔고
    positions: Dict[str, VirtualPosition] = field(default_factory=dict)  # 보유 포지션
    orders: List[VirtualOrder] = field(default_factory=list)  # 주문 내역
    
    @property
    def total_position_value(self) -> float:
        """총 포지션 가치"""
        return sum(pos.total_value for pos in self.positions.values())
    
    @property
    def total_equity(self) -> float:
        """총 자산 가치 (현금 + 포지션)"""
        return self.cash_balance + self.total_position_value
    
    @property
    def active_orders(self) -> List[VirtualOrder]:
        """활성 주문 목록"""
        return [order for order in self.orders if not order.is_complete]


class VirtualBroker:
    """가상 브로커 (모의투자 시스템)"""
    
    def __init__(self, initial_balance: float = 10000000.0):
        """
        가상 브로커 초기화
        
        Args:
            initial_balance: 초기 현금 잔고 (기본값: 1000만원)
        """
        self.account = VirtualAccount(
            account_id=str(uuid.uuid4()),
            cash_balance=initial_balance
        )
        self.price_cache: Dict[str, float] = {}  # 종목별 현재가 캐싱
        self.price_history: Dict[str, List[Dict[str, Any]]] = {}  # 가격 이력 저장
        
        # 매매 수수료 및 세금 설정
        self.buy_fee_rate = 0.00015  # 매수 수수료 (0.015%)
        self.sell_fee_rate = 0.00015  # 매도 수수료 (0.015%)
        self.tax_rate = 0.0023  # 매도 시 세금 (0.23%)
    
    def update_price(self, symbol: str, price: float, timestamp: Optional[datetime.datetime] = None) -> None:
        """
        종목의 가격 업데이트
        
        Args:
            symbol: 종목코드
            price: 업데이트할 가격
            timestamp: 시간 정보 (None인 경우 현재 시간 사용)
        """
        if timestamp is None:
            timestamp = datetime.datetime.now()
        
        # 가격 캐싱 업데이트
        self.price_cache[symbol] = price
        
        # 가격 이력 저장
        if symbol not in self.price_history:
            self.price_history[symbol] = []
        
        self.price_history[symbol].append({
            "timestamp": timestamp,
            "price": price
        })
        
        # 최대 이력 크기 제한 (메모리 관리)
        max_history_size = 1000
        if len(self.price_history[symbol]) > max_history_size:
            self.price_history[symbol] = self.price_history[symbol][-max_history_size:]
        
        # 포지션 현재가 업데이트
        if symbol in self.account.positions:
            self.account.positions[symbol].current_price = price
            logger.debug(f"가격 업데이트: {symbol} = {price}원, 손익: {self.account.positions[symbol].profit_loss}원")
    
    def get_price(self, symbol: str) -> float:
        """
        종목의 현재가 조회
        
        Args:
            symbol: 종목코드
            
        Returns:
            현재가 (캐시에 없는 경우 0 반환)
        """
        return self.price_cache.get(symbol, 0.0)
    
    def place_order(self, symbol: str, order_type: str, price: float, quantity: int) -> str:
        """
        주문 실행
        
        Args:
            symbol: 종목코드
            order_type: 주문 타입 ("buy" 또는 "sell")
            price: 주문 가격
            quantity: 주문 수량
            
        Returns:
            주문 ID
        
        Raises:
            ValueError: 주문 유형이 잘못된 경우
            RuntimeError: 잔고 부족 등 주문 실패 시
        """
        order_type = order_type.lower()
        
        if order_type not in ["buy", "sell"]:
            raise ValueError("order_type은 'buy' 또는 'sell'이어야 합니다.")
        
        # 매수 주문 시 잔고 확인
        if order_type == "buy":
            total_cost = price * quantity * (1 + self.buy_fee_rate)
            if total_cost > self.account.cash_balance:
                raise RuntimeError(f"잔고 부족: 필요 금액 {total_cost}원, 현재 잔고 {self.account.cash_balance}원")
        
        # 매도 주문 시 보유량 확인
        elif order_type == "sell":
            if symbol not in self.account.positions:
                raise RuntimeError(f"보유하지 않은 종목: {symbol}")
            
            position = self.account.positions[symbol]
            if position.quantity < quantity:
                raise RuntimeError(f"보유량 부족: 요청 수량 {quantity}, 보유 수량 {position.quantity}")
        
        # 주문 생성
        order_id = str(uuid.uuid4())
        order = VirtualOrder(
            order_id=order_id,
            symbol=symbol,
            order_type=order_type,
            price=price,
            quantity=quantity
        )
        
        self.account.orders.append(order)
        logger.info(f"주문 생성: {order_type} {symbol} {quantity}주 @ {price}원 (ID: {order_id})")
        
        # 즉시 체결 시도 (지정가가 현재가보다 유리한 경우)
        current_price = self.get_price(symbol)
        if current_price > 0:
            if (order_type == "buy" and price >= current_price) or \
               (order_type == "sell" and price <= current_price):
                self._execute_order(order, current_price)
        
        return order_id
    
    def _execute_order(self, order: VirtualOrder, execution_price: float) -> None:
        """
        주문 체결 처리
        
        Args:
            order: 체결할 주문 객체
            execution_price: 체결 가격
        """
        if order.is_complete:
            return
        
        # 체결 처리
        order.filled_quantity = order.quantity
        order.status = "filled"
        order.filled_time = datetime.datetime.now()
        
        symbol = order.symbol
        quantity = order.quantity
        
        # 매수 체결
        if order.order_type == "buy":
            # 수수료 계산
            fee = execution_price * quantity * self.buy_fee_rate
            total_cost = execution_price * quantity + fee
            
            # 현금 차감
            self.account.cash_balance -= total_cost
            
            # 포지션 추가/업데이트
            if symbol in self.account.positions:
                position = self.account.positions[symbol]
                total_quantity = position.quantity + quantity
                # 평균 매수가 계산
                position.avg_price = ((position.quantity * position.avg_price) + (quantity * execution_price)) / total_quantity
                position.quantity = total_quantity
            else:
                self.account.positions[symbol] = VirtualPosition(
                    symbol=symbol,
                    quantity=quantity,
                    avg_price=execution_price,
                    current_price=execution_price
                )
            
            logger.info(f"매수 체결: {symbol} {quantity}주 @ {execution_price}원, 수수료: {fee}원")
        
        # 매도 체결
        elif order.order_type == "sell":
            # 수수료 및 세금 계산
            fee = execution_price * quantity * self.sell_fee_rate
            tax = execution_price * quantity * self.tax_rate
            total_proceeds = execution_price * quantity - fee - tax
            
            # 현금 증가
            self.account.cash_balance += total_proceeds
            
            # 포지션 감소
            position = self.account.positions[symbol]
            position.quantity -= quantity
            
            # 모두 매도한 경우 포지션 제거
            if position.quantity == 0:
                del self.account.positions[symbol]
            
            logger.info(f"매도 체결: {symbol} {quantity}주 @ {execution_price}원, 수수료: {fee}원, 세금: {tax}원")
    
    def cancel_order(self, order_id: str) -> bool:
        """
        주문 취소
        
        Args:
            order_id: 취소할 주문 ID
            
        Returns:
            취소 성공 여부
        """
        for order in self.account.orders:
            if order.order_id == order_id:
                if order.is_complete:
                    logger.warning(f"이미 체결되거나 취소된 주문: {order_id}")
                    return False
                
                order.status = "canceled"
                logger.info(f"주문 취소: {order_id}")
                return True
        
        logger.warning(f"주문을 찾을 수 없음: {order_id}")
        return False
    
    def process_pending_orders(self) -> None:
        """보류 중인 주문 처리 (시장가 변동에 따른 체결 처리)"""
        for order in self.account.active_orders:
            current_price = self.get_price(order.symbol)
            
            if current_price <= 0:
                continue
            
            # 매수 주문이 현재가 이상이면 체결
            if order.order_type == "buy" and order.price >= current_price:
                self._execute_order(order, current_price)
            
            # 매도 주문이 현재가 이하이면 체결
            elif order.order_type == "sell" and order.price <= current_price:
                self._execute_order(order, current_price)
    
    def get_account_balance(self) -> Dict[str, Any]:
        """
        계좌 잔고 정보 조회
        
        Returns:
            계좌 잔고 정보
        """
        positions = []
        for symbol, position in self.account.positions.items():
            positions.append({
                "symbol": symbol,
                "quantity": position.quantity,
                "avg_price": position.avg_price,
                "current_price": position.current_price,
                "total_value": position.total_value,
                "profit_loss": position.profit_loss,
                "profit_loss_percent": position.profit_loss_percent
            })
        
        return {
            "account_id": self.account.account_id,
            "cash_balance": self.account.cash_balance,
            "positions": positions,
            "total_position_value": self.account.total_position_value,
            "total_equity": self.account.total_equity
        }
    
    def get_order_history(self) -> List[Dict[str, Any]]:
        """
        주문 내역 조회
        
        Returns:
            주문 내역 리스트
        """
        order_history = []
        for order in self.account.orders:
            order_history.append({
                "order_id": order.order_id,
                "symbol": order.symbol,
                "order_type": order.order_type,
                "price": order.price,
                "quantity": order.quantity,
                "status": order.status,
                "filled_quantity": order.filled_quantity,
                "order_time": order.order_time.isoformat(),
                "filled_time": order.filled_time.isoformat() if order.filled_time else None
            })
        
        return order_history 