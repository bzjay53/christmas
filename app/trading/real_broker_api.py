"""
실전 증권사 API 연동 시스템
한국투자증권, 키움증권 등 실제 브로커 API 지원
"""
import asyncio
import logging
import aiohttp
import json
import hashlib
import hmac
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import pytz

logger = logging.getLogger(__name__)

class BrokerType(Enum):
    """지원 브로커 타입"""
    KIS = "한국투자증권"  # Korea Investment & Securities
    KIWOOM = "키움증권"
    EBEST = "이베스트투자증권"
    NH = "NH투자증권"
    MOCK = "모의투자"

class OrderSide(Enum):
    """주문 구분"""
    BUY = "01"   # 매수
    SELL = "02"  # 매도

class OrderType(Enum):
    """주문 유형"""
    LIMIT = "00"    # 지정가
    MARKET = "01"   # 시장가
    CONDITION = "03" # 조건부

@dataclass
class TradingHours:
    """거래 시간 정보"""
    market_open: str = "09:00"      # 장 시작
    market_close: str = "15:30"     # 장 마감
    pre_market_start: str = "08:00" # 동시호가 시작
    pre_market_end: str = "09:00"   # 동시호가 종료
    after_market_start: str = "15:30" # 시간외 거래 시작
    after_market_end: str = "18:00"   # 시간외 거래 종료

@dataclass
class RealOrder:
    """실제 주문 정보"""
    order_id: str
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: int
    price: float
    status: str
    filled_quantity: int = 0
    filled_price: float = 0.0
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()

class KISBrokerAPI:
    """한국투자증권 API 클래스"""
    
    def __init__(self, app_key: str, app_secret: str, account_no: str, is_mock: bool = True):
        self.app_key = app_key
        self.app_secret = app_secret  
        self.account_no = account_no
        self.is_mock = is_mock
        
        # API URL (모의투자 vs 실전투자)
        if is_mock:
            self.base_url = "https://openapivts.koreainvestment.com:29443"
        else:
            self.base_url = "https://openapi.koreainvestment.com:9443"
            
        self.access_token = None
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def start(self):
        """API 연결 시작"""
        self.session = aiohttp.ClientSession()
        await self._get_access_token()
        logger.info(f"KIS API 연결 완료 ({'모의투자' if self.is_mock else '실전투자'})")
        
    async def stop(self):
        """API 연결 종료"""
        if self.session:
            await self.session.close()
            
    async def _get_access_token(self):
        """접근 토큰 발급"""
        url = f"{self.base_url}/oauth2/tokenP"
        data = {
            "grant_type": "client_credentials",
            "appkey": self.app_key,
            "appsecret": self.app_secret
        }
        
        async with self.session.post(url, json=data) as response:
            if response.status == 200:
                result = await response.json()
                self.access_token = result.get('access_token')
                logger.info("KIS 접근 토큰 발급 성공")
            else:
                raise Exception(f"토큰 발급 실패: {response.status}")
    
    def _get_headers(self, tr_id: str) -> Dict[str, str]:
        """API 헤더 생성"""
        return {
            "Content-Type": "application/json",
            "authorization": f"Bearer {self.access_token}",
            "appkey": self.app_key,
            "appsecret": self.app_secret,
            "tr_id": tr_id
        }
    
    async def get_account_balance(self) -> Dict[str, Any]:
        """계좌 잔고 조회"""
        tr_id = "VTTC8434R" if self.is_mock else "TTTC8434R"
        url = f"{self.base_url}/uapi/domestic-stock/v1/trading/inquire-balance"
        
        params = {
            "CANO": self.account_no[:8],
            "ACNT_PRDT_CD": self.account_no[8:],
            "AFHR_FLPR_YN": "N",
            "OFL_YN": "",
            "INQR_DVSN": "02",
            "UNPR_DVSN": "01",
            "FUND_STTL_ICLD_YN": "N",
            "FNCG_AMT_AUTO_RDPT_YN": "N",
            "PRCS_DVSN": "01",
            "CTX_AREA_FK100": "",
            "CTX_AREA_NK100": ""
        }
        
        headers = self._get_headers(tr_id)
        
        async with self.session.get(url, params=params, headers=headers) as response:
            if response.status == 200:
                return await response.json()
            else:
                raise Exception(f"잔고 조회 실패: {response.status}")
    
    async def get_current_price(self, symbol: str) -> float:
        """현재가 조회"""
        tr_id = "FHKST01010100"
        url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/inquire-price"
        
        params = {
            "FID_COND_MRKT_DIV_CODE": "J",
            "FID_INPUT_ISCD": symbol
        }
        
        headers = self._get_headers(tr_id)
        
        async with self.session.get(url, params=params, headers=headers) as response:
            if response.status == 200:
                result = await response.json()
                return float(result['output']['stck_prpr'])
            else:
                raise Exception(f"현재가 조회 실패: {response.status}")
    
    async def place_order(self, symbol: str, side: OrderSide, quantity: int, 
                         price: float = 0, order_type: OrderType = OrderType.MARKET) -> RealOrder:
        """주문 실행"""
        # 매수/매도에 따른 TR ID
        if side == OrderSide.BUY:
            tr_id = "VTTC0802U" if self.is_mock else "TTTC0802U"
        else:
            tr_id = "VTTC0801U" if self.is_mock else "TTTC0801U"
            
        url = f"{self.base_url}/uapi/domestic-stock/v1/trading/order-cash"
        
        data = {
            "CANO": self.account_no[:8],
            "ACNT_PRDT_CD": self.account_no[8:],
            "PDNO": symbol,
            "ORD_DVSN": order_type.value,
            "ORD_QTY": str(quantity),
            "ORD_UNPR": str(int(price)) if order_type == OrderType.LIMIT else "0"
        }
        
        headers = self._get_headers(tr_id)
        
        async with self.session.post(url, json=data, headers=headers) as response:
            if response.status == 200:
                result = await response.json()
                order_id = result['output']['KRX_FWDG_ORD_ORGNO'] + result['output']['ODNO']
                
                return RealOrder(
                    order_id=order_id,
                    symbol=symbol,
                    side=side,
                    order_type=order_type,
                    quantity=quantity,
                    price=price,
                    status="접수"
                )
            else:
                raise Exception(f"주문 실패: {response.status}")

class MarketScheduler:
    """장 시간 관리 및 스케줄러"""
    
    def __init__(self):
        self.korea_tz = pytz.timezone('Asia/Seoul')
        self.trading_hours = TradingHours()
        self.trading_callbacks = []
        
    def get_korea_time(self) -> datetime:
        """한국 시간 반환"""
        return datetime.now(self.korea_tz)
    
    def is_trading_hours(self) -> bool:
        """현재 거래 시간인지 확인"""
        now = self.get_korea_time()
        current_time = now.strftime("%H:%M")
        
        # 주말 제외
        if now.weekday() >= 5:  # 토요일(5), 일요일(6)
            return False
            
        # 정규 거래시간 확인
        return self.trading_hours.market_open <= current_time <= self.trading_hours.market_close
    
    def is_pre_market(self) -> bool:
        """동시호가 시간인지 확인"""
        now = self.get_korea_time()
        current_time = now.strftime("%H:%M")
        
        if now.weekday() >= 5:
            return False
            
        return self.trading_hours.pre_market_start <= current_time < self.trading_hours.pre_market_end
    
    def is_after_market(self) -> bool:
        """시간외 거래 시간인지 확인"""
        now = self.get_korea_time()
        current_time = now.strftime("%H:%M")
        
        if now.weekday() >= 5:
            return False
            
        return self.trading_hours.after_market_start <= current_time <= self.trading_hours.after_market_end
    
    def get_market_status(self) -> str:
        """현재 장 상태 반환"""
        if self.is_pre_market():
            return "동시호가"
        elif self.is_trading_hours():
            return "정규거래"
        elif self.is_after_market():
            return "시간외거래"
        else:
            return "장마감"
    
    def time_until_market_open(self) -> timedelta:
        """장 시작까지 남은 시간"""
        now = self.get_korea_time()
        
        # 오늘 장 시작 시간
        market_open_today = now.replace(
            hour=int(self.trading_hours.market_open.split(':')[0]),
            minute=int(self.trading_hours.market_open.split(':')[1]),
            second=0,
            microsecond=0
        )
        
        # 이미 장이 시작되었거나 주말이면 다음 거래일
        if now >= market_open_today or now.weekday() >= 5:
            # 다음 거래일 찾기
            days_ahead = 1
            if now.weekday() == 4:  # 금요일
                days_ahead = 3  # 다음 월요일
            elif now.weekday() == 5:  # 토요일
                days_ahead = 2  # 다음 월요일
                
            market_open_today += timedelta(days=days_ahead)
            
        return market_open_today - now
    
    async def wait_for_market_open(self):
        """장 시작까지 대기"""
        time_left = self.time_until_market_open()
        if time_left.total_seconds() > 0:
            logger.info(f"장 시작까지 {time_left} 대기 중...")
            await asyncio.sleep(time_left.total_seconds())

class RealTradingEngine:
    """실전 거래 엔진"""
    
    def __init__(self, broker_api, telegram_service=None):
        self.broker_api = broker_api
        self.telegram_service = telegram_service
        self.scheduler = MarketScheduler()
        self.active_orders: Dict[str, RealOrder] = {}
        self.positions: Dict[str, int] = {}  # 종목별 보유수량
        self.is_running = False
        
    async def start(self):
        """거래 엔진 시작"""
        await self.broker_api.start()
        self.is_running = True
        logger.info("실전 거래 엔진 시작")
        
        # 텔레그램 알림
        if self.telegram_service:
            await self.telegram_service.send_system_message(
                f"🚀 실전 거래 시스템 시작\n"
                f"📊 장 상태: {self.scheduler.get_market_status()}\n"
                f"⏰ 현재 시간: {self.scheduler.get_korea_time().strftime('%Y-%m-%d %H:%M:%S')}"
            )
    
    async def stop(self):
        """거래 엔진 중지"""
        self.is_running = False
        await self.broker_api.stop()
        logger.info("실전 거래 엔진 중지")
        
        if self.telegram_service:
            await self.telegram_service.send_system_message("🛑 실전 거래 시스템 종료")
    
    async def buy_stock(self, symbol: str, quantity: int, price: float = 0, 
                       order_type: OrderType = OrderType.MARKET) -> bool:
        """주식 매수"""
        try:
            # 거래 시간 확인
            if not (self.scheduler.is_trading_hours() or self.scheduler.is_pre_market()):
                logger.warning(f"거래 시간이 아닙니다. 현재: {self.scheduler.get_market_status()}")
                return False
            
            # 주문 실행
            order = await self.broker_api.place_order(symbol, OrderSide.BUY, quantity, price, order_type)
            self.active_orders[order.order_id] = order
            
            # 텔레그램 알림
            if self.telegram_service:
                await self.telegram_service.send_order_notification({
                    'symbol': symbol,
                    'side': 'buy',
                    'quantity': quantity,
                    'price': price if price > 0 else '시장가',
                    'status': 'created',
                    'order_id': order.order_id
                })
            
            logger.info(f"매수 주문 접수: {symbol} {quantity}주")
            return True
            
        except Exception as e:
            logger.error(f"매수 주문 실패: {e}")
            return False
    
    async def sell_stock(self, symbol: str, quantity: int, price: float = 0,
                        order_type: OrderType = OrderType.MARKET) -> bool:
        """주식 매도"""
        try:
            # 거래 시간 확인
            if not (self.scheduler.is_trading_hours() or self.scheduler.is_pre_market()):
                logger.warning(f"거래 시간이 아닙니다. 현재: {self.scheduler.get_market_status()}")
                return False
            
            # 보유 수량 확인
            if self.positions.get(symbol, 0) < quantity:
                logger.warning(f"보유 수량 부족: {symbol} (요청: {quantity}, 보유: {self.positions.get(symbol, 0)})")
                return False
            
            # 주문 실행
            order = await self.broker_api.place_order(symbol, OrderSide.SELL, quantity, price, order_type)
            self.active_orders[order.order_id] = order
            
            # 텔레그램 알림
            if self.telegram_service:
                await self.telegram_service.send_order_notification({
                    'symbol': symbol,
                    'side': 'sell',
                    'quantity': quantity,
                    'price': price if price > 0 else '시장가',
                    'status': 'created',
                    'order_id': order.order_id
                })
            
            logger.info(f"매도 주문 접수: {symbol} {quantity}주")
            return True
            
        except Exception as e:
            logger.error(f"매도 주문 실패: {e}")
            return False
    
    async def get_account_summary(self) -> Dict[str, Any]:
        """계좌 요약 정보"""
        try:
            balance = await self.broker_api.get_account_balance()
            return {
                'account_no': self.broker_api.account_no,
                'broker': self.broker_api.__class__.__name__,
                'is_mock': self.broker_api.is_mock,
                'market_status': self.scheduler.get_market_status(),
                'balance': balance,
                'active_orders': len(self.active_orders),
                'positions': self.positions
            }
        except Exception as e:
            logger.error(f"계좌 조회 실패: {e}")
            return {}
    
    async def monitor_orders(self):
        """주문 모니터링 루프"""
        while self.is_running:
            try:
                # 주문 상태 확인 및 업데이트
                # (실제로는 웹소켓이나 API로 실시간 모니터링)
                await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"주문 모니터링 오류: {e}")
                await asyncio.sleep(1)

# 전역 거래 엔진
_trading_engine: Optional[RealTradingEngine] = None

async def initialize_real_trading(app_key: str, app_secret: str, account_no: str, 
                                is_mock: bool = True, telegram_service=None):
    """실전 거래 시스템 초기화"""
    global _trading_engine
    
    # KIS API 초기화
    broker_api = KISBrokerAPI(app_key, app_secret, account_no, is_mock)
    _trading_engine = RealTradingEngine(broker_api, telegram_service)
    
    await _trading_engine.start()
    
    # 주문 모니터링 시작
    asyncio.create_task(_trading_engine.monitor_orders())
    
    return _trading_engine

def get_trading_engine() -> Optional[RealTradingEngine]:
    """거래 엔진 인스턴스 반환"""
    return _trading_engine

async def stop_real_trading():
    """실전 거래 시스템 종료"""
    global _trading_engine
    if _trading_engine:
        await _trading_engine.stop()
        _trading_engine = None 