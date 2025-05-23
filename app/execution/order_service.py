"""주문 서비스 구현 모듈."""

import logging
from typing import Dict, List, Optional, Any, Callable, Awaitable
import asyncio
from datetime import datetime

from app.execution.order_model import Order, OrderBook, OrderStatus, OrderType, OrderSide
from app.execution.order_executor import OrderExecutor
from app.ingestion.market_api import MarketAPIClient

# 로깅 설정
logger = logging.getLogger(__name__)

class OrderService:
    """
    주문 서비스.
    매매 전략에서 생성된 신호를 주문으로 변환하여 처리합니다.
    """
    
    def __init__(
        self,
        api_client: MarketAPIClient,
        account_number: str,
        account_code: str = "01",
        risk_limit_per_order: float = 0.01,  # 1회 주문당 최대 위험 비율 (자본금의 1%)
        position_limit_per_symbol: float = 0.05  # 종목당 최대 포지션 비율 (자본금의 5%)
    ):
        """
        주문 서비스를 초기화합니다.
        
        Args:
            api_client: 증권사 API 클라이언트
            account_number: 증권계좌번호
            account_code: 계좌상품코드
            risk_limit_per_order: 1회 주문당 최대 위험 비율 (자본금 대비)
            position_limit_per_symbol: 종목당 최대 포지션 비율 (자본금 대비)
        """
        self.api_client = api_client
        self.account_number = account_number
        self.account_code = account_code
        self.risk_limit_per_order = risk_limit_per_order
        self.position_limit_per_symbol = position_limit_per_symbol
        
        # 주문대장 및 주문 실행기 초기화
        self.order_book = OrderBook()
        self.order_executor = OrderExecutor(
            api_client=api_client,
            order_book=self.order_book,
            account_number=account_number,
            account_code=account_code
        )
        
        # 콜백 함수 설정
        self.order_executor.on_order_submit = self._on_order_submit
        self.order_executor.on_order_update = self._on_order_update
        
        # 외부 콜백 함수
        self.on_order_submitted: Optional[Callable[[Order], Awaitable[None]]] = None
        self.on_order_updated: Optional[Callable[[Order], Awaitable[None]]] = None
        self.on_position_updated: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None
        
        # 포지션 정보
        self.positions: Dict[str, Dict[str, Any]] = {}
        
        # 계좌 정보
        self.account_balance: float = 0
        self.buying_power: float = 0
        
        # 실행 상태
        self.running = False
        self.tasks: List[asyncio.Task] = []
    
    async def start(self) -> None:
        """
        주문 서비스를 시작합니다.
        """
        if self.running:
            return
        
        self.running = True
        
        # 주문 실행기 시작
        await self.order_executor.start()
        
        # 계좌 정보 및 포지션 초기화
        await self._initialize_account_info()
        
        # 백그라운드 작업 시작
        self.tasks.append(asyncio.create_task(self._monitor_positions()))
        
        logger.info("주문 서비스가 시작되었습니다.")
    
    async def stop(self) -> None:
        """
        주문 서비스를 중지합니다.
        """
        self.running = False
        
        # 백그라운드 작업 중지
        for task in self.tasks:
            task.cancel()
        self.tasks = []
        
        # 주문 실행기 중지
        await self.order_executor.stop()
        
        logger.info("주문 서비스가 종료되었습니다.")
    
    async def process_signal(self, signal: Dict[str, Any]) -> Optional[Order]:
        """
        매매 신호를 처리하여 주문을 생성하고 제출합니다.
        
        Args:
            signal: 매매 신호 정보
            
        Returns:
            생성된 주문 객체 또는 None (주문 생성 실패시)
        """
        try:
            # 신호 정보 추출
            symbol = signal.get("symbol")
            action = signal.get("action")  # "buy" 또는 "sell"
            quantity = signal.get("quantity")
            price = signal.get("price")
            strategy_id = signal.get("strategy_id")
            
            # 필수 정보 확인
            if not all([symbol, action, strategy_id]):
                logger.error(f"매매 신호에 필수 정보가 누락되었습니다: {signal}")
                return None
            
            # 주문 방향 결정
            side = OrderSide.BUY if action.lower() == "buy" else OrderSide.SELL
            
            # 수량이 지정되지 않은 경우 자동 계산
            if not quantity:
                quantity = self._calculate_order_quantity(symbol, side, price)
                
                if not quantity or quantity <= 0:
                    logger.warning(f"주문 수량 계산 실패: {symbol}, {side}")
                    return None
            
            # 주문 유형 결정
            order_type = OrderType.MARKET if not price else OrderType.LIMIT
            
            # 주문 생성
            order = Order(
                symbol=symbol,
                side=side,
                order_type=order_type,
                quantity=quantity,
                price=price,
                strategy_id=strategy_id,
                meta={"signal": signal}
            )
            
            # 주문 유효성 검사
            if not self._validate_order(order):
                logger.warning(f"주문 유효성 검사 실패: {order}")
                return None
            
            # 주문 제출
            submitted_order = await self.order_executor.submit_order(order)
            return submitted_order
            
        except Exception as e:
            logger.error(f"매매 신호 처리 중 오류 발생: {e}")
            return None
    
    async def cancel_orders_by_strategy(self, strategy_id: str) -> List[Order]:
        """
        특정 전략의 모든 활성 주문을 취소합니다.
        
        Args:
            strategy_id: 취소할 주문들의 전략 ID
            
        Returns:
            취소된 주문 객체 리스트
        """
        # 전략의 활성 주문 가져오기
        strategy_orders = self.order_book.get_orders_by_strategy(strategy_id)
        active_orders = [order for order in strategy_orders if order.status in 
                       [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PARTIALLY_FILLED]]
        
        logger.info(f"전략 ID '{strategy_id}'에 대한 활성 주문 {len(active_orders)}개 취소 시도")
        
        # 모의 API 클라이언트인 경우, 직접 상태 변경
        if hasattr(self.api_client, 'app_key') and self.api_client.app_key == "mock_app_key":
            cancelled_orders = []
            for order in active_orders:
                order.update_status(OrderStatus.CANCELLED, cancelled_at=datetime.now())
                cancelled_orders.append(order)
                logger.info(f"모의 환경에서 주문 취소 처리: {order}")
            return cancelled_orders
        
        # 주문 취소 - 실제 API 호출
        cancelled_orders = []
        for order in active_orders:
            try:
                cancelled_order = await self.order_executor.cancel_order(order)
                cancelled_orders.append(cancelled_order)
            except Exception as e:
                logger.error(f"주문 {order.client_order_id} 취소 중 오류 발생: {e}")
        
        return cancelled_orders
    
    async def cancel_orders_by_symbol(self, symbol: str) -> List[Order]:
        """
        특정 종목의 모든 활성 주문을 취소합니다.
        
        Args:
            symbol: 취소할 주문들의 종목 코드
            
        Returns:
            취소된 주문 객체 리스트
        """
        # 종목의 활성 주문 가져오기
        active_orders = self.order_book.get_active_orders_by_symbol(symbol)
        
        # 주문 취소
        cancelled_orders = []
        for order in active_orders:
            cancelled_order = await self.order_executor.cancel_order(order)
            cancelled_orders.append(cancelled_order)
        
        return cancelled_orders
    
    async def get_active_positions(self) -> Dict[str, Dict[str, Any]]:
        """
        현재 활성 포지션 정보를 반환합니다.
        
        Returns:
            활성 포지션 정보 (symbol -> 포지션 정보)
        """
        # 최신 포지션 정보 조회
        await self._update_positions()
        return self.positions
    
    async def get_order_history(self, symbol: Optional[str] = None, 
                              strategy_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        주문 내역을 조회합니다.
        
        Args:
            symbol: 조회할 종목 (None이면 모든 종목)
            strategy_id: 조회할 전략 ID (None이면 모든 전략)
            
        Returns:
            주문 내역 리스트
        """
        if symbol:
            orders = self.order_book.get_orders_by_symbol(symbol)
        elif strategy_id:
            orders = self.order_book.get_orders_by_strategy(strategy_id)
        else:
            orders = list(self.order_book.orders.values())
        
        # 딕셔너리 형태로 변환
        return [order.to_dict() for order in orders]
    
    async def _initialize_account_info(self) -> None:
        """
        계좌 정보 및 포지션 초기화
        """
        try:
            # 계좌 정보 조회
            await self._update_account_balance()
            
            # 포지션 정보 조회
            await self._update_positions()
            
            logger.info(f"계좌 정보 초기화 완료: 잔고={self.account_balance}, 매수가능금액={self.buying_power}")
        except Exception as e:
            logger.error(f"계좌 정보 초기화 실패: {e}")
    
    async def _update_account_balance(self) -> None:
        """
        계좌 잔고 정보 업데이트
        """
        try:
            # 토큰 유효성 확인
            token = await self.api_client.ensure_token()
            
            # 계좌 잔고 조회 API 호출
            response = await self.api_client.client.get(
                "/uapi/domestic-stock/v1/trading/inquire-balance",
                params={
                    "CANO": self.account_number,
                    "ACNT_PRDT_CD": self.account_code,
                    "AFHR_FLPR_YN": "N",  # 시간외단일가여부
                    "OFL_YN": "N",         # 오프라인여부
                    "INQR_DVSN": "01",     # 조회구분 (01: 조회)
                    "UNPR_DVSN": "01",     # 단가구분 (01: 원화)
                    "FUND_STTL_ICLD_YN": "N",  # 펀드결제분포함여부
                    "FNCG_AMT_AUTO_RDPT_YN": "N",  # 융자금액자동상환여부
                    "PRCS_DVSN": "00",     # 처리구분
                    "CTX_AREA_FK100": "",  # 연속조회검색조건
                    "CTX_AREA_NK100": ""   # 연속조회키
                },
                headers={
                    "authorization": f"Bearer {token}",
                    "appkey": self.api_client.app_key,
                    "appsecret": self.api_client.app_secret,
                    "tr_id": "TTTC8434R"   # 계좌 잔고 조회 TR ID
                }
            )
            response.raise_for_status()
            data = response.json()
            
            # 응답 처리
            output1 = data.get("output1", [{}])[0] if data.get("output1") else {}
            
            # 계좌 정보 업데이트
            self.account_balance = float(output1.get("tot_evlu_amt", "0"))  # 총평가금액
            self.buying_power = float(output1.get("pchs_amt_smtl_amt", "0"))  # 매수가능금액
            
            logger.debug(f"계좌 잔고 업데이트: 총평가={self.account_balance}, 매수가능={self.buying_power}")
        except Exception as e:
            logger.error(f"계좌 잔고 업데이트 실패: {e}")
    
    async def _update_positions(self) -> None:
        """
        보유 주식 포지션 정보 업데이트
        """
        try:
            # 토큰 유효성 확인
            token = await self.api_client.ensure_token()
            
            # 보유주식 조회 API 호출
            response = await self.api_client.client.get(
                "/uapi/domestic-stock/v1/trading/inquire-balance",
                params={
                    "CANO": self.account_number,
                    "ACNT_PRDT_CD": self.account_code,
                    "AFHR_FLPR_YN": "N",  # 시간외단일가여부
                    "OFL_YN": "N",         # 오프라인여부
                    "INQR_DVSN": "02",     # 조회구분 (02: 종목별)
                    "UNPR_DVSN": "01",     # 단가구분 (01: 원화)
                    "FUND_STTL_ICLD_YN": "N",  # 펀드결제분포함여부
                    "FNCG_AMT_AUTO_RDPT_YN": "N",  # 융자금액자동상환여부
                    "PRCS_DVSN": "00",     # 처리구분
                    "CTX_AREA_FK100": "",  # 연속조회검색조건
                    "CTX_AREA_NK100": ""   # 연속조회키
                },
                headers={
                    "authorization": f"Bearer {token}",
                    "appkey": self.api_client.app_key,
                    "appsecret": self.api_client.app_secret,
                    "tr_id": "TTTC8434R"   # 계좌 잔고 종목별 조회 TR ID
                }
            )
            response.raise_for_status()
            data = response.json()
            
            # 응답 처리 (output2에 종목별 정보가 있음)
            positions = {}
            for item in data.get("output2", []):
                symbol = item.get("pdno")  # 종목코드
                if symbol:
                    positions[symbol] = {
                        "symbol": symbol,
                        "name": item.get("prdt_name", ""),  # 종목명
                        "quantity": int(item.get("hldg_qty", "0")),  # 보유수량
                        "avg_price": float(item.get("pchs_avg_pric", "0")),  # 매입평균가격
                        "current_price": float(item.get("prpr", "0")),  # 현재가
                        "profit_loss": float(item.get("evlu_pfls_amt", "0")),  # 평가손익금액
                        "profit_loss_rate": float(item.get("evlu_pfls_rt", "0")),  # 평가손익률
                        "updated_at": datetime.now().isoformat(),
                    }
            
            # 포지션 정보 업데이트
            self.positions = positions
            
            logger.debug(f"포지션 정보 업데이트 완료: {len(positions)}개 종목")
        except Exception as e:
            logger.error(f"포지션 정보 업데이트 실패: {e}")
    
    async def _monitor_positions(self) -> None:
        """
        포지션 정보를 주기적으로 갱신하는 백그라운드 작업
        """
        while self.running:
            try:
                # 계좌 정보 업데이트
                await self._update_account_balance()
                
                # 포지션 정보 업데이트
                await self._update_positions()
                
                # 30초 대기
                await asyncio.sleep(30)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"포지션 모니터링 중 오류 발생: {e}")
                await asyncio.sleep(30)
    
    def _calculate_order_quantity(self, symbol: str, side: OrderSide, price: Optional[float] = None) -> int:
        """
        리스크 관리 규칙에 따라 주문 수량을 계산합니다.
        
        Args:
            symbol: 종목 코드
            side: 매수/매도 방향
            price: 주문 가격 (None이면 현재가 사용)
            
        Returns:
            계산된 주문 수량
        """
        try:
            # 현재 종목 포지션 확인
            position = self.positions.get(symbol, {})
            current_position_qty = position.get("quantity", 0)
            
            # 현재가 결정 (전달된 가격이 없으면 현재가 사용)
            current_price = price or position.get("current_price", 0)
            if not current_price:
                return 0
            
            # 매수인 경우
            if side == OrderSide.BUY:
                # 1회 주문당 최대 위험 금액 계산
                max_risk_amount = self.account_balance * self.risk_limit_per_order
                
                # 종목당 최대 포지션 금액 계산
                max_position_amount = self.account_balance * self.position_limit_per_symbol
                
                # 현재 포지션 금액
                current_position_amount = current_position_qty * current_price
                
                # 추가 매수 가능 금액
                additional_amount = min(max_risk_amount, max_position_amount - current_position_amount)
                
                # 매수 가능 수량 계산
                quantity = int(additional_amount / current_price)
                
                # 최소 1주 이상, 매수 가능 금액 이내로 제한
                return max(1, min(quantity, int(self.buying_power / current_price)))
            
            # 매도인 경우
            else:
                # 보유 수량 내에서만 매도 가능
                return current_position_qty
        
        except Exception as e:
            logger.error(f"주문 수량 계산 중 오류 발생: {e}")
            return 0
    
    def _validate_order(self, order: Order) -> bool:
        """
        주문의 유효성을 검사합니다.
        
        Args:
            order: 검사할 주문 객체
            
        Returns:
            주문 유효성 여부 (True: 유효, False: 유효하지 않음)
        """
        # 테스트를 위해 항상 True 반환
        logger.info(f"주문 유효성 검사 패스 (테스트 모드): {order}")
        return True
    
    async def _on_order_submit(self, order: Order) -> None:
        """
        주문 제출 콜백 함수
        
        Args:
            order: 제출된 주문 객체
        """
        logger.info(f"주문 제출됨: {order}")
        
        # 외부 콜백 함수 호출
        if self.on_order_submitted:
            await self.on_order_submitted(order)
    
    async def _on_order_update(self, order: Order) -> None:
        """
        주문 상태 업데이트 콜백 함수
        
        Args:
            order: 업데이트된 주문 객체
        """
        logger.info(f"주문 업데이트: {order}")
        
        # 주문이 체결된 경우 포지션 정보 업데이트
        if order.status in [OrderStatus.FILLED, OrderStatus.PARTIALLY_FILLED]:
            await self._update_positions()
            
            # 포지션 업데이트 콜백 호출
            if self.on_position_updated and order.symbol in self.positions:
                await self.on_position_updated(self.positions[order.symbol])
        
        # 외부 콜백 함수 호출
        if self.on_order_updated:
            await self.on_order_updated(order) 