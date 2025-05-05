import asyncio
import logging
import os
import redis.asyncio as redis
import json
import signal
from typing import Dict, Any, List, Set
from datetime import datetime

from .market_api import MarketAPIClient
from .websocket_client import WebSocketClient

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# 환경 변수에서 설정 로드 (실제로는 config 모듈 사용)
API_APP_KEY = os.getenv("CHRISTMAS_API_APP_KEY", "demo_app_key")
API_APP_SECRET = os.getenv("CHRISTMAS_API_APP_SECRET", "demo_app_secret")
API_BASE_URL = os.getenv("CHRISTMAS_API_BASE_URL", "https://openapi.koreainvestment.com:9443")
WS_URL = os.getenv("CHRISTMAS_WS_URL", "wss://openapi.koreainvestment.com:9443/ws")
REDIS_HOST = os.getenv("CHRISTMAS_REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("CHRISTMAS_REDIS_PORT", "6379"))

# 감시할 종목 리스트
WATCH_SYMBOLS = ["005930", "035720", "000660"]  # 삼성전자, 카카오, SK하이닉스

class IngestionService:
    """
    시장 데이터 수집 서비스.
    REST API 및 WebSocket을 통해 데이터를 수집하고 Redis에 저장합니다.
    """
    
    def __init__(self):
        self.redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
        self.market_api = None
        self.ws_client = None
        self.access_token = None
        self.running = False
        self.subscribed_symbols: Set[str] = set()
        
    async def initialize(self):
        """서비스 초기화"""
        # Redis 연결 확인
        try:
            await self.redis_client.ping()
            logger.info("Redis 서버에 연결되었습니다")
        except Exception as e:
            logger.error(f"Redis 연결 실패: {e}")
            raise
            
        # 시장 API 클라이언트 초기화
        self.market_api = MarketAPIClient(
            app_key=API_APP_KEY,
            app_secret=API_APP_SECRET,
            base_url=API_BASE_URL
        )
        
        # 액세스 토큰 발급
        self.access_token = await self.market_api.ensure_token()
        logger.info("액세스 토큰 발급 완료")
        
        # WebSocket 클라이언트 초기화
        self.ws_client = WebSocketClient(
            ws_url=WS_URL,
            app_key=API_APP_KEY,
            access_token=self.access_token,
            on_tick=self.handle_tick
        )
        
        # 종료 시그널 핸들러 등록
        for sig in (signal.SIGINT, signal.SIGTERM):
            signal.signal(sig, self.handle_shutdown)
            
        self.running = True
    
    def handle_shutdown(self, signum, frame):
        """종료 시그널 처리"""
        logger.info(f"종료 시그널 {signum} 수신")
        self.running = False
    
    async def start(self):
        """서비스 시작"""
        await self.initialize()
        
        # WebSocket 연결
        await self.ws_client.connect()
        
        # 감시 종목 구독
        for symbol in WATCH_SYMBOLS:
            await self.subscribe_symbol(symbol)
        
        # 주기적 현재가 수집 (REST API)
        price_collector_task = asyncio.create_task(self.collect_prices())
        
        # WebSocket 메시지 수신
        ws_listener_task = asyncio.create_task(self.ws_client.listen())
        
        try:
            # 모든 작업이 완료될 때까지 대기
            await asyncio.gather(price_collector_task, ws_listener_task)
        except asyncio.CancelledError:
            logger.info("작업이 취소되었습니다")
        finally:
            await self.shutdown()
    
    async def shutdown(self):
        """서비스 종료"""
        self.running = False
        
        # WebSocket 연결 종료
        if self.ws_client:
            await self.ws_client.close()
            
        # 시장 API 클라이언트 종료
        if self.market_api:
            await self.market_api.close()
            
        # Redis 연결 종료
        await self.redis_client.close()
        
        logger.info("서비스가 종료되었습니다")
    
    async def subscribe_symbol(self, symbol: str):
        """종목 구독"""
        if symbol in self.subscribed_symbols:
            logger.warning(f"이미 구독 중인 종목입니다: {symbol}")
            return
            
        try:
            # WebSocket으로 실시간 체결가 구독
            await self.ws_client.subscribe_tick(symbol)
            
            # 현재가 정보 가져오기 (초기 데이터)
            current_price = await self.market_api.fetch_current_price(symbol)
            await self.save_tick_to_redis(current_price)
            
            self.subscribed_symbols.add(symbol)
            logger.info(f"종목 구독 완료: {symbol}")
        except Exception as e:
            logger.error(f"종목 구독 실패: {symbol}, 오류: {e}")
    
    async def unsubscribe_symbol(self, symbol: str):
        """종목 구독 해제"""
        if symbol not in self.subscribed_symbols:
            logger.warning(f"구독하지 않은 종목입니다: {symbol}")
            return
            
        try:
            await self.ws_client.unsubscribe_tick(symbol)
            self.subscribed_symbols.remove(symbol)
            logger.info(f"종목 구독 해제 완료: {symbol}")
        except Exception as e:
            logger.error(f"종목 구독 해제 실패: {symbol}, 오류: {e}")
    
    async def collect_prices(self):
        """주기적으로 REST API로 현재가 수집"""
        try:
            while self.running:
                for symbol in WATCH_SYMBOLS:
                    try:
                        # 현재가 정보 가져오기
                        current_price = await self.market_api.fetch_current_price(symbol)
                        
                        # Redis에 저장
                        await self.save_tick_to_redis(current_price)
                        
                        logger.debug(f"현재가 수집 완료: {symbol}, 가격: {current_price['price']}")
                    except Exception as e:
                        logger.error(f"현재가 수집 실패: {symbol}, 오류: {e}")
                        
                # 1분마다 수집
                await asyncio.sleep(60)
        except asyncio.CancelledError:
            logger.info("현재가 수집 작업이 취소되었습니다")
            raise
    
    async def handle_tick(self, tick_data: Dict[str, Any]):
        """틱 데이터 처리 콜백"""
        try:
            # Redis에 저장
            await self.save_tick_to_redis(tick_data)
            
            logger.debug(f"틱 데이터 처리: {tick_data}")
        except Exception as e:
            logger.error(f"틱 데이터 처리 실패: {e}")
    
    async def save_tick_to_redis(self, tick_data: Dict[str, Any]):
        """
        틱 데이터를 Redis에 저장
        
        - 최신 틱은 단일 키에 저장 (캐싱)
        - 시계열 데이터는 Sorted Set에 저장
        """
        try:
            symbol = tick_data["symbol"]
            timestamp = tick_data.get("timestamp", datetime.now().isoformat())
            timestamp_ms = int(datetime.fromisoformat(timestamp).timestamp() * 1000)
            
            # 최신 틱 데이터 캐싱 (해시)
            await self.redis_client.hset(
                f"tick:{symbol}:latest",
                mapping={
                    "price": str(tick_data["price"]),
                    "volume": str(tick_data.get("volume", 0)),
                    "timestamp": timestamp,
                }
            )
            
            # 시계열 데이터 저장 (Sorted Set)
            score = timestamp_ms
            value = json.dumps({
                "price": tick_data["price"],
                "volume": tick_data.get("volume", 0),
                "timestamp": timestamp,
            })
            
            await self.redis_client.zadd(f"ticks:{symbol}", {value: score})
            
            # 오래된 데이터 정리 (최근 10000개만 유지)
            await self.redis_client.zremrangebyrank(f"ticks:{symbol}", 0, -10001)
            
            # 새 틱 데이터 발행 (Pub/Sub)
            await self.redis_client.publish(
                f"tick_updates:{symbol}",
                json.dumps(tick_data)
            )
            
            logger.debug(f"Redis에 저장 완료: {symbol}, 가격: {tick_data['price']}")
        except Exception as e:
            logger.error(f"Redis 저장 실패: {e}")
            raise


async def main():
    """메인 함수"""
    service = IngestionService()
    try:
        await service.start()
    except Exception as e:
        logger.error(f"서비스 실행 중 오류 발생: {e}")
    finally:
        await service.shutdown()


if __name__ == "__main__":
    asyncio.run(main()) 