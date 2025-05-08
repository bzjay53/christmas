"""주문 실행 서비스 구현 모듈."""

import logging
from typing import Dict, List, Optional, Any, Union, Callable, Awaitable
from datetime import datetime
import asyncio

from app.execution.order_model import Order, OrderBook, OrderStatus, OrderType, OrderSide
from app.ingestion.market_api import MarketAPIClient

# 로깅 설정
logger = logging.getLogger(__name__)

class OrderExecutor:
    """
    주문 실행 서비스.
    주문을 실제 증권사 API를 통해 제출하고 결과를 관리합니다.
    """
    
    def __init__(
        self,
        api_client: MarketAPIClient,
        order_book: OrderBook,
        account_number: str,
        account_code: str = "01"  # 보통 '01'은 위탁계좌를 의미
    ):
        """
        주문 실행기를 초기화합니다.
        
        Args:
            api_client: 증권사 API 클라이언트
            order_book: 주문대장 객체
            account_number: 증권계좌번호
            account_code: 계좌상품코드
        """
        self.api_client = api_client
        self.order_book = order_book
        self.account_number = account_number
        self.account_code = account_code
        
        # 주문 콜백 함수
        self.on_order_submit: Optional[Callable[[Order], Awaitable[None]]] = None
        self.on_order_update: Optional[Callable[[Order], Awaitable[None]]] = None
        
        # 백그라운드 작업
        self.running = False
        self.tasks: List[asyncio.Task] = []
    
    async def start(self) -> None:
        """
        주문 실행기를 시작합니다.
        
        주문 상태 갱신 작업을 백그라운드로 실행합니다.
        """
        if self.running:
            return
        
        self.running = True
        self.tasks.append(asyncio.create_task(self._monitor_orders()))
        logger.info("주문 실행기가 시작되었습니다.")
    
    async def stop(self) -> None:
        """
        주문 실행기를 중지합니다.
        """
        self.running = False
        for task in self.tasks:
            task.cancel()
        self.tasks = []
        logger.info("주문 실행기가 종료되었습니다.")
    
    async def submit_order(self, order: Order) -> Order:
        """
        주문을 증권사 API에 제출합니다.
        
        Args:
            order: 제출할 주문 객체
            
        Returns:
            제출된 주문 객체 (업데이트된 상태)
        """
        logger.info(f"주문 제출: {order}")
        
        try:
            # 주문 유형에 따른 API 파라미터 구성
            order_params = self._prepare_order_params(order)
            
            # 증권사 API 호출
            response = await self._call_order_api(order.side, order_params)
            
            # 응답 처리
            broker_order_id = response.get("output", {}).get("ord_no")
            if broker_order_id:
                # 주문이 정상적으로 접수됨
                order.broker_order_id = broker_order_id
                order.update_status(OrderStatus.ACCEPTED)
                self.order_book.update_order(order.client_order_id, broker_order_id=broker_order_id)
            else:
                # 주문 접수 실패
                error_message = response.get("msg", "주문 접수 실패")
                order.update_status(OrderStatus.REJECTED, rejected_reason=error_message)
            
            # 주문대장에 주문 추가
            if order.client_order_id not in self.order_book.orders:
                self.order_book.add_order(order)
            
            # 콜백 함수 호출
            if self.on_order_submit:
                await self.on_order_submit(order)
            
            return order
        except Exception as e:
            # 예외 발생 시 주문 상태 업데이트
            logger.error(f"주문 제출 중 오류 발생: {e}")
            order.update_status(OrderStatus.REJECTED, rejected_reason=str(e))
            
            # 주문대장에 주문 추가 (오류 상태로)
            if order.client_order_id not in self.order_book.orders:
                self.order_book.add_order(order)
            
            # 콜백 함수 호출
            if self.on_order_submit:
                await self.on_order_submit(order)
            
            return order
    
    async def cancel_order(self, order: Order) -> Order:
        """
        제출된 주문을 취소합니다.
        
        Args:
            order: 취소할 주문 객체
            
        Returns:
            취소된 주문 객체 (업데이트된 상태)
        """
        logger.info(f"주문 취소: {order}")
        
        # 취소 가능한 상태인지 확인
        if order.status not in [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PARTIALLY_FILLED]:
            logger.warning(f"취소할 수 없는 주문 상태: {order.status}")
            return order
        
        # 브로커 주문 ID가 없으면 취소 불가
        if not order.broker_order_id:
            logger.warning("브로커 주문 ID가 없어 취소할 수 없습니다.")
            return order
        
        try:
            # 취소 주문 파라미터 구성
            cancel_params = {
                "CANO": self.account_number,            # 계좌번호
                "ACNT_PRDT_CD": self.account_code,      # 계좌상품코드
                "KRX_FWDG_ORD_ORGNO": "",              # 한국거래소주문조직번호
                "ORGN_ODNO": order.broker_order_id,     # 원주문번호
                "ORD_DVSN": "00",                      # 주문구분 (00: 전량취소)
                "CTS_ODNO": "",                         # 연속주문번호
            }
            
            # 취소 API 호출
            response = await self.api_client.client.post(
                "/uapi/domestic-stock/v1/trading/order-rvsecncl",
                headers={
                    "authorization": f"Bearer {await self.api_client.ensure_token()}",
                    "appkey": self.api_client.app_key,
                    "appsecret": self.api_client.app_secret,
                    "tr_id": "TTTC0803U",  # 주식 취소 TR ID
                },
                json=cancel_params
            )
            response.raise_for_status()
            data = response.json()
            
            # 응답 처리
            if data.get("rt_cd") == "0":  # 0은 성공
                # 취소 접수됨
                order.update_status(OrderStatus.CANCELLED, cancelled_at=datetime.now())
                self.order_book.update_order(order.client_order_id, status=OrderStatus.CANCELLED)
            else:
                # 취소 실패
                error_message = data.get("msg1", "취소 실패")
                logger.error(f"주문 취소 실패: {error_message}")
            
            # 콜백 함수 호출
            if self.on_order_update:
                await self.on_order_update(order)
            
            return order
        except Exception as e:
            logger.error(f"주문 취소 중 오류 발생: {e}")
            return order
    
    async def check_order_status(self, order: Order) -> Order:
        """
        주문 상태를 확인합니다.
        
        Args:
            order: 상태를 확인할 주문 객체
            
        Returns:
            업데이트된 주문 객체
        """
        # 브로커 주문 ID가 없으면 상태 확인 불가
        if not order.broker_order_id:
            return order
        
        try:
            # 주문 상태 조회 파라미터
            params = {
                "CANO": self.account_number,         # 계좌번호
                "ACNT_PRDT_CD": self.account_code,   # 계좌상품코드
                "ODNO": order.broker_order_id,       # 주문번호
                "CTX_AREA_FK100": "",               # 연속조회검색조건
                "CTX_AREA_NK100": ""                # 연속조회키
            }
            
            # 주문 상태 조회 API 호출
            response = await self.api_client.client.get(
                "/uapi/domestic-stock/v1/trading/inquire-order",
                params=params,
                headers={
                    "authorization": f"Bearer {await self.api_client.ensure_token()}",
                    "appkey": self.api_client.app_key,
                    "appsecret": self.api_client.app_secret,
                    "tr_id": "TTTC8001R",  # 주식 주문 상세 조회 TR ID
                }
            )
            response.raise_for_status()
            data = response.json()
            
            # 응답 데이터 처리
            order_info = data.get("output", [{}])[0] if data.get("output") else {}
            
            # 주문 상태 매핑
            status_mapping = {
                "00": OrderStatus.PENDING,        # 접수 대기
                "01": OrderStatus.ACCEPTED,       # 접수
                "02": OrderStatus.PARTIALLY_FILLED,  # 체결 일부
                "03": OrderStatus.FILLED,         # 체결 전부
                "04": OrderStatus.CANCELLED,      # 취소
                "05": OrderStatus.REJECTED        # 거부
            }
            
            order_status_code = order_info.get("ord_stat_cd", "")
            order_status = status_mapping.get(order_status_code, OrderStatus.PENDING)
            
            # 주문 수량 및 체결 정보
            ord_qty = float(order_info.get("ord_qty", "0"))  # 주문 수량
            filled_qty = float(order_info.get("tot_exec_qty", "0"))  # 총 체결 수량
            avg_price = float(order_info.get("avg_prvs", "0"))  # 평균 체결가
            
            # 주문 상태 업데이트
            if order.status != order_status:
                if order_status == OrderStatus.PARTIALLY_FILLED:
                    # 체결 내역 추가
                    if order.filled_quantity < filled_qty:
                        new_fill_qty = filled_qty - order.filled_quantity
                        order.add_fill(new_fill_qty, avg_price)
                
                elif order_status == OrderStatus.FILLED:
                    # 전량 체결
                    if order.filled_quantity < filled_qty:
                        new_fill_qty = filled_qty - order.filled_quantity
                        order.add_fill(new_fill_qty, avg_price)
                
                elif order_status == OrderStatus.CANCELLED:
                    order.update_status(OrderStatus.CANCELLED, cancelled_at=datetime.now())
                
                elif order_status == OrderStatus.REJECTED:
                    order.update_status(OrderStatus.REJECTED, rejected_reason=order_info.get("rejt_cd", ""))
                
                # 주문대장 업데이트
                self.order_book.update_order(order.client_order_id, status=order_status)
                
                # 콜백 함수 호출
                if self.on_order_update:
                    await self.on_order_update(order)
            
            return order
        except Exception as e:
            logger.error(f"주문 상태 확인 중 오류 발생: {e}")
            return order
    
    async def _monitor_orders(self) -> None:
        """
        활성 주문 상태를 주기적으로 확인하는 백그라운드 작업
        """
        while self.running:
            try:
                # 모든 활성 주문 가져오기
                active_orders = self.order_book.get_active_orders()
                
                # 각 주문 상태 확인
                for order in active_orders:
                    await self.check_order_status(order)
                
                # 10초 대기
                await asyncio.sleep(10)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"주문 모니터링 중 오류 발생: {e}")
                await asyncio.sleep(10)
    
    def _prepare_order_params(self, order: Order) -> Dict[str, Any]:
        """
        주문 파라미터를 준비합니다.
        
        Args:
            order: 주문 객체
            
        Returns:
            증권사 API 호출용 파라미터
        """
        # 주문 구분 코드 매핑
        order_dvsn_mapping = {
            # 시장가 주문
            (OrderType.MARKET, OrderSide.BUY): "01",   # 시장가 매수
            (OrderType.MARKET, OrderSide.SELL): "01",  # 시장가 매도
            
            # 지정가 주문
            (OrderType.LIMIT, OrderSide.BUY): "00",    # 지정가 매수
            (OrderType.LIMIT, OrderSide.SELL): "00",   # 지정가 매도
            
            # 기타 주문 유형은 필요에 따라 추가
        }
        
        # 주문 구분 코드 결정
        order_dvsn = order_dvsn_mapping.get((order.order_type, order.side), "00")
        
        # 매매구분 결정
        trade_type = "2" if order.side == OrderSide.BUY else "1"  # 1: 매도, 2: 매수
        
        # API 파라미터 구성
        params = {
            "CANO": self.account_number,        # 계좌번호
            "ACNT_PRDT_CD": self.account_code,  # 계좌상품코드
            "PDNO": order.symbol,               # 종목코드
            "ORD_DVSN": order_dvsn,             # 주문구분
            "ORD_QTY": str(int(order.quantity)),  # 주문수량
            "ORD_UNPR": "0" if order.order_type == OrderType.MARKET else str(int(order.price)),  # 주문단가
            "ALGO_NO": "",                      # 알고리즘 번호
            "SLL_BUY_DVSN_CD": trade_type,      # 매매구분코드
        }
        
        return params
    
    async def _call_order_api(self, side: OrderSide, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        증권사 주문 API를 호출합니다.
        
        Args:
            side: 매수/매도 방향
            params: API 호출 파라미터
            
        Returns:
            API 응답 데이터
        """
        # TR ID 설정 (매수/매도에 따라 다름)
        tr_id = "TTTC0802U" if side == OrderSide.BUY else "TTTC0801U"  # 매수/매도 TR ID
        
        # API 호출
        response = await self.api_client.client.post(
            "/uapi/domestic-stock/v1/trading/order-cash",
            headers={
                "authorization": f"Bearer {await self.api_client.ensure_token()}",
                "appkey": self.api_client.app_key,
                "appsecret": self.api_client.app_secret,
                "tr_id": tr_id,
            },
            json=params
        )
        response.raise_for_status()
        return response.json() 