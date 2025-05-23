"""
주문 데이터 리포지토리 모듈

이 모듈은 주문 데이터를 Supabase 데이터베이스에 저장하고 조회하는 기능을 제공합니다.
OrderService와 데이터베이스 사이의 어댑터 역할을 합니다.
"""

import logging
import json
import uuid
from typing import Dict, List, Optional, Any, Union
from datetime import datetime

from app.execution.order_model import Order, OrderStatus, OrderSide, OrderType
from app.db.supabase_client import SupabaseClient

# 로깅 설정
logger = logging.getLogger(__name__)

class OrderRepository:
    """
    주문 데이터 리포지토리
    주문 데이터를 Supabase 데이터베이스에 저장하고 조회하는 메서드를 제공합니다.
    """
    
    def __init__(self, supabase_client: Optional[SupabaseClient] = None):
        """
        OrderRepository 초기화
        
        Args:
            supabase_client: Supabase 클라이언트 인스턴스 (None이면 기본 인스턴스 사용)
        """
        self.supabase = supabase_client or SupabaseClient.get_instance()
        self.table_name = 'orders'
    
    async def save_order(self, order: Order) -> bool:
        """
        주문 정보를 데이터베이스에 저장합니다.
        신규 주문이면 INSERT, 기존 주문이면 UPDATE를 수행합니다.
        
        Args:
            order: 저장할 주문 객체
            
        Returns:
            저장 성공 여부
        """
        try:
            # 주문 데이터 변환
            order_data = self._convert_order_to_dict(order)
            
            if self.supabase.is_test_mode:
                logger.info(f"테스트 모드: 주문 저장 처리 (ID: {order.client_order_id})")
                return True
            
            # 기존 주문 조회
            existing_order = await self._get_order_by_client_id(order.client_order_id)
            
            if existing_order:
                # 기존 주문 업데이트
                response = await self.supabase.client.table(self.table_name).update(
                    order_data
                ).eq('client_order_id', order.client_order_id).execute()
            else:
                # 신규 주문 생성
                response = await self.supabase.client.table(self.table_name).insert(
                    order_data
                ).execute()
            
            logger.debug(f"주문 저장 성공: {order.client_order_id}")
            return True
        except Exception as e:
            logger.error(f"주문 저장 실패: {e}")
            return False
    
    async def get_order_by_id(self, order_id: str) -> Optional[Order]:
        """
        주문 ID로 주문 정보를 조회합니다.
        
        Args:
            order_id: 주문 ID
            
        Returns:
            조회된 주문 객체 또는 None (조회 실패시)
        """
        try:
            if self.supabase.is_test_mode:
                # 테스트 모드에서는 더미 데이터 반환
                logger.info(f"테스트 모드: 주문 조회 처리 (ID: {order_id})")
                return Order(
                    client_order_id=order_id,
                    symbol="BTC/USDT",
                    side=OrderSide.BUY,
                    order_type=OrderType.LIMIT,
                    quantity=0.01,
                    price=60000.0,
                    status=OrderStatus.FILLED,
                    strategy_id="test_strategy"
                )
            
            response = await self.supabase.client.table(self.table_name).select('*').eq('id', order_id).execute()
            
            if response.data and len(response.data) > 0:
                return self._convert_dict_to_order(response.data[0])
            return None
        except Exception as e:
            logger.error(f"주문 조회 실패: {e}")
            return None
    
    async def get_orders_by_user(self, user_id: str, status: Optional[OrderStatus] = None) -> List[Order]:
        """
        사용자 ID로 주문 목록을 조회합니다.
        
        Args:
            user_id: 사용자 ID
            status: 주문 상태 (None이면 모든 상태)
            
        Returns:
            주문 객체 리스트
        """
        try:
            if self.supabase.is_test_mode:
                # 테스트 모드에서는 더미 데이터 반환
                logger.info(f"테스트 모드: 사용자 주문 목록 조회 처리 (사용자 ID: {user_id})")
                return [
                    Order(
                        client_order_id=f"order_{i}",
                        symbol="BTC/USDT",
                        side=OrderSide.BUY if i % 2 == 0 else OrderSide.SELL,
                        order_type=OrderType.LIMIT,
                        quantity=0.01,
                        price=60000.0 + (i * 100),
                        status=OrderStatus.FILLED if i % 3 == 0 else (
                            OrderStatus.PENDING if i % 3 == 1 else OrderStatus.CANCELLED
                        ),
                        strategy_id="test_strategy"
                    ) for i in range(5)
                ]
            
            query = self.supabase.client.table(self.table_name).select('*').eq('user_id', user_id)
            
            if status:
                query = query.eq('status', status.value)
                
            response = await query.execute()
            
            if response.data:
                return [self._convert_dict_to_order(item) for item in response.data]
            return []
        except Exception as e:
            logger.error(f"사용자 주문 목록 조회 실패: {e}")
            return []
    
    async def get_orders_by_symbol(self, symbol: str, status: Optional[OrderStatus] = None) -> List[Order]:
        """
        종목 코드로 주문 목록을 조회합니다.
        
        Args:
            symbol: 종목 코드
            status: 주문 상태 (None이면 모든 상태)
            
        Returns:
            주문 객체 리스트
        """
        try:
            if self.supabase.is_test_mode:
                # 테스트 모드에서는 더미 데이터 반환
                logger.info(f"테스트 모드: 종목 주문 목록 조회 처리 (종목: {symbol})")
                return [
                    Order(
                        client_order_id=f"order_{i}",
                        symbol=symbol,
                        side=OrderSide.BUY if i % 2 == 0 else OrderSide.SELL,
                        order_type=OrderType.LIMIT,
                        quantity=0.01,
                        price=60000.0 + (i * 100),
                        status=OrderStatus.FILLED if i % 3 == 0 else (
                            OrderStatus.PENDING if i % 3 == 1 else OrderStatus.CANCELLED
                        ),
                        strategy_id="test_strategy"
                    ) for i in range(3)
                ]
            
            query = self.supabase.client.table(self.table_name).select('*').eq('symbol', symbol)
            
            if status:
                query = query.eq('status', status.value)
                
            response = await query.execute()
            
            if response.data:
                return [self._convert_dict_to_order(item) for item in response.data]
            return []
        except Exception as e:
            logger.error(f"종목 주문 목록 조회 실패: {e}")
            return []
    
    async def get_orders_by_strategy(self, strategy_id: str, status: Optional[OrderStatus] = None) -> List[Order]:
        """
        전략 ID로 주문 목록을 조회합니다.
        
        Args:
            strategy_id: 전략 ID
            status: 주문 상태 (None이면 모든 상태)
            
        Returns:
            주문 객체 리스트
        """
        try:
            if self.supabase.is_test_mode:
                # 테스트 모드에서는 더미 데이터 반환
                logger.info(f"테스트 모드: 전략 주문 목록 조회 처리 (전략 ID: {strategy_id})")
                return [
                    Order(
                        client_order_id=f"order_{i}",
                        symbol=f"BTC/USDT" if i % 2 == 0 else "ETH/USDT",
                        side=OrderSide.BUY if i % 2 == 0 else OrderSide.SELL,
                        order_type=OrderType.LIMIT,
                        quantity=0.01,
                        price=60000.0 + (i * 100),
                        status=OrderStatus.FILLED if i % 3 == 0 else (
                            OrderStatus.PENDING if i % 3 == 1 else OrderStatus.CANCELLED
                        ),
                        strategy_id=strategy_id
                    ) for i in range(4)
                ]
            
            query = self.supabase.client.table(self.table_name).select('*').eq('strategy_id', strategy_id)
            
            if status:
                query = query.eq('status', status.value)
                
            response = await query.execute()
            
            if response.data:
                return [self._convert_dict_to_order(item) for item in response.data]
            return []
        except Exception as e:
            logger.error(f"전략 주문 목록 조회 실패: {e}")
            return []
    
    async def delete_order(self, order_id: str) -> bool:
        """
        주문을 삭제합니다.
        
        Args:
            order_id: 주문 ID
            
        Returns:
            삭제 성공 여부
        """
        try:
            if self.supabase.is_test_mode:
                logger.info(f"테스트 모드: 주문 삭제 처리 (ID: {order_id})")
                return True
            
            await self.supabase.client.table(self.table_name).delete().eq('id', order_id).execute()
            logger.debug(f"주문 삭제 성공: {order_id}")
            return True
        except Exception as e:
            logger.error(f"주문 삭제 실패: {e}")
            return False
    
    async def _get_order_by_client_id(self, client_order_id: str) -> Optional[Dict[str, Any]]:
        """
        클라이언트 주문 ID로 주문 정보를 조회합니다.
        
        Args:
            client_order_id: 클라이언트 주문 ID
            
        Returns:
            조회된 주문 데이터 또는 None (조회 실패시)
        """
        try:
            if self.supabase.is_test_mode:
                return None
            
            response = await self.supabase.client.table(self.table_name).select('*').eq('client_order_id', client_order_id).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"클라이언트 주문 ID로 주문 조회 실패: {e}")
            return None
    
    def _convert_order_to_dict(self, order: Order) -> Dict[str, Any]:
        """
        Order 객체를 데이터베이스 저장용 딕셔너리로 변환합니다.
        
        Args:
            order: 변환할 주문 객체
            
        Returns:
            변환된 딕셔너리
        """
        return {
            'id': getattr(order, 'id', str(uuid.uuid4())),
            'user_id': getattr(order, 'user_id', 'default_user'),  # 추후 실제 사용자 ID로 교체
            'client_order_id': order.client_order_id,
            'broker_order_id': order.broker_order_id,
            'symbol': order.symbol,
            'side': order.side.value if isinstance(order.side, OrderSide) else order.side,
            'order_type': order.order_type.value if isinstance(order.order_type, OrderType) else order.order_type,
            'quantity': float(order.quantity),
            'price': float(order.price) if order.price is not None else None,
            'status': order.status.value if isinstance(order.status, OrderStatus) else order.status,
            'filled_quantity': float(order.filled_quantity) if order.filled_quantity is not None else 0,
            'filled_price': float(order.filled_price) if order.filled_price is not None else None,
            'strategy_id': order.strategy_id,
            'created_at': order.created_at.isoformat() if hasattr(order, 'created_at') and order.created_at else datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'filled_at': order.filled_at.isoformat() if hasattr(order, 'filled_at') and order.filled_at else None,
            'cancelled_at': order.cancelled_at.isoformat() if hasattr(order, 'cancelled_at') and order.cancelled_at else None,
            'rejected_reason': order.rejected_reason if hasattr(order, 'rejected_reason') else None,
            'meta': json.dumps(order.meta) if hasattr(order, 'meta') and order.meta else None
        }
    
    def _convert_dict_to_order(self, data: Dict[str, Any]) -> Order:
        """
        데이터베이스 조회 결과를 Order 객체로 변환합니다.
        
        Args:
            data: 변환할 딕셔너리 데이터
            
        Returns:
            변환된 주문 객체
        """
        # 기본 주문 객체 생성
        order = Order(
            client_order_id=data.get('client_order_id'),
            symbol=data.get('symbol'),
            side=OrderSide(data.get('side')) if data.get('side') else OrderSide.BUY,
            order_type=OrderType(data.get('order_type')) if data.get('order_type') else OrderType.MARKET,
            quantity=float(data.get('quantity', 0)),
            price=float(data.get('price')) if data.get('price') is not None else None,
            strategy_id=data.get('strategy_id')
        )
        
        # 추가 속성 설정
        order.id = data.get('id')
        order.broker_order_id = data.get('broker_order_id')
        order.status = OrderStatus(data.get('status')) if data.get('status') else OrderStatus.PENDING
        order.filled_quantity = float(data.get('filled_quantity', 0))
        order.filled_price = float(data.get('filled_price')) if data.get('filled_price') is not None else None
        
        # 시간 정보 설정
        if data.get('created_at'):
            order.created_at = datetime.fromisoformat(data.get('created_at').replace('Z', '+00:00'))
        if data.get('filled_at'):
            order.filled_at = datetime.fromisoformat(data.get('filled_at').replace('Z', '+00:00'))
        if data.get('cancelled_at'):
            order.cancelled_at = datetime.fromisoformat(data.get('cancelled_at').replace('Z', '+00:00'))
        
        # 기타 정보 설정
        order.rejected_reason = data.get('rejected_reason')
        if data.get('meta'):
            try:
                order.meta = json.loads(data.get('meta'))
            except:
                order.meta = {}
        
        return order 