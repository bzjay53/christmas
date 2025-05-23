"""
Supabase와 연동된 OrderService 확장 모듈.

이 모듈은 기존 OrderService를 확장하여 Supabase 데이터베이스와 연동합니다.
주문 정보를 데이터베이스에 저장하고, 텔레그램 봇을 통해 알림을 전송합니다.
"""

import logging
import asyncio
from typing import Dict, List, Optional, Any, Union

from app.execution.order_service import OrderService
from app.execution.order_model import Order, OrderStatus
from app.ingestion.market_api import MarketAPIClient
from app.db.order_repository import OrderRepository
try:
    from app.notification.telegram_bot import TelegramBot
    TELEGRAM_AVAILABLE = True
except ImportError:
    TELEGRAM_AVAILABLE = False
    logging.warning("텔레그램 봇 모듈을 가져올 수 없습니다. 알림 기능이 비활성화됩니다.")

# 로깅 설정
logger = logging.getLogger(__name__)

class SupabaseOrderService(OrderService):
    """
    Supabase와 연동된 주문 서비스 클래스.
    기존 OrderService를 확장하여 Supabase 데이터베이스에 주문 정보를 저장합니다.
    """
    
    def __init__(
        self,
        api_client: MarketAPIClient,
        account_number: str,
        account_code: str = "01",
        risk_limit_per_order: float = 0.01,
        position_limit_per_symbol: float = 0.05,
        telegram_enabled: bool = True
    ):
        """
        Supabase와 연동된 주문 서비스를 초기화합니다.
        
        Args:
            api_client: 증권사 API 클라이언트
            account_number: 증권계좌번호
            account_code: 계좌상품코드
            risk_limit_per_order: 1회 주문당 최대 위험 비율 (자본금 대비)
            position_limit_per_symbol: 종목당 최대 포지션 비율 (자본금 대비)
            telegram_enabled: 텔레그램 알림 활성화 여부
        """
        super().__init__(
            api_client=api_client,
            account_number=account_number,
            account_code=account_code,
            risk_limit_per_order=risk_limit_per_order,
            position_limit_per_symbol=position_limit_per_symbol
        )
        
        # 주문 리포지토리 초기화
        self.order_repository = OrderRepository()
        
        # 텔레그램 봇 초기화
        self.telegram_enabled = telegram_enabled and TELEGRAM_AVAILABLE
        if self.telegram_enabled:
            self.telegram_bot = TelegramBot.get_instance()
            logger.info("텔레그램 알림이 활성화되었습니다.")
        else:
            self.telegram_bot = None
            logger.info("텔레그램 알림이 비활성화되었습니다.")
        
        # 콜백 함수 등록
        self.on_order_submitted = self._on_order_submitted
        self.on_order_updated = self._on_order_updated
    
    async def start(self) -> None:
        """
        주문 서비스를 시작합니다.
        """
        await super().start()
        logger.info("Supabase 연동 주문 서비스가 시작되었습니다.")
    
    async def process_signal(self, signal: Dict[str, Any]) -> Optional[Order]:
        """
        매매 신호를 처리하여 주문을 생성하고 제출합니다.
        Supabase 데이터베이스에 주문 정보를 저장합니다.
        
        Args:
            signal: 매매 신호 정보
            
        Returns:
            생성된 주문 객체 또는 None (주문 생성 실패시)
        """
        order = await super().process_signal(signal)
        
        if order:
            # 주문 정보를 데이터베이스에 저장
            await self.order_repository.save_order(order)
            
            # 텔레그램 알림 전송
            if self.telegram_enabled and self.telegram_bot:
                await self.telegram_bot.send_order_notification(order, "created")
                
        return order
    
    async def _on_order_submitted(self, order: Order) -> None:
        """
        주문 제출 콜백 함수
        
        Args:
            order: 제출된 주문 객체
        """
        # 주문 정보를 데이터베이스에 저장
        await self.order_repository.save_order(order)
        
        # 텔레그램 알림 전송
        if self.telegram_enabled and self.telegram_bot:
            await self.telegram_bot.send_order_notification(order, "updated")
    
    async def _on_order_updated(self, order: Order) -> None:
        """
        주문 상태 업데이트 콜백 함수
        
        Args:
            order: 업데이트된 주문 객체
        """
        # 주문 정보를 데이터베이스에 저장
        await self.order_repository.save_order(order)
        
        # 텔레그램 알림 전송
        if self.telegram_enabled and self.telegram_bot:
            event_type = "updated"
            
            # 주문 상태에 따른 이벤트 유형 결정
            if order.status == OrderStatus.FILLED:
                event_type = "filled"
            elif order.status == OrderStatus.CANCELLED:
                event_type = "cancelled"
            elif order.status == OrderStatus.REJECTED:
                event_type = "rejected"
                
            await self.telegram_bot.send_order_notification(order, event_type)
        
        # 주문이 체결된 경우 포지션 정보 업데이트
        if order.status in [OrderStatus.FILLED, OrderStatus.PARTIALLY_FILLED]:
            await self._update_positions()
            
            # 포지션 업데이트 콜백 호출
            if self.on_position_updated and order.symbol in self.positions:
                await self.on_position_updated(self.positions[order.symbol]) 