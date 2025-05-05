import asyncio
import json
import logging
from typing import Dict, List, Any, Optional, Callable, Awaitable
import websockets
from datetime import datetime
import time

# 로깅 설정
logger = logging.getLogger(__name__)

class WebSocketClient:
    """
    증권사 WebSocket API 클라이언트.
    실시간 체결가 등의 데이터를 구독합니다.
    """
    
    def __init__(
        self, 
        ws_url: str, 
        app_key: str, 
        access_token: str,
        on_tick: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None,
        reconnect_interval: int = 5
    ):
        """
        WebSocket 클라이언트 초기화
        
        Args:
            ws_url: WebSocket 서버 URL
            app_key: API 앱 키
            access_token: Bearer 토큰 (auth_service에서 발급받은 것)
            on_tick: 틱 데이터 수신 시 실행할 콜백 함수
            reconnect_interval: 연결 종료 시 재연결 시도 간격 (초)
        """
        self.ws_url = ws_url
        self.app_key = app_key
        self.access_token = access_token
        self.on_tick = on_tick
        self.reconnect_interval = reconnect_interval
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self.subscriptions: List[Dict[str, Any]] = []
        self.running = False
        self.heartbeat_task = None
        
    async def connect(self) -> None:
        """WebSocket 서버에 연결"""
        try:
            self.ws = await websockets.connect(self.ws_url)
            logger.info("WebSocket 서버에 연결되었습니다")
            self.running = True
            
            # 성공적으로 연결되면 하트비트 작업 시작
            self.heartbeat_task = asyncio.create_task(self._send_heartbeat())
            
            # 이전 구독 정보가 있으면 재구독
            for subscription in self.subscriptions:
                await self.send_message(subscription)
                
        except Exception as e:
            logger.error(f"WebSocket 연결 실패: {e}")
            self.running = False
            # 재연결 시도
            await asyncio.sleep(self.reconnect_interval)
            await self.connect()
    
    async def _send_heartbeat(self) -> None:
        """
        주기적으로 하트비트 메시지를 보내 연결 유지
        """
        try:
            while self.running and self.ws and not self.ws.closed:
                await asyncio.sleep(30)  # 30초마다 하트비트 전송
                if self.ws and not self.ws.closed:
                    await self.ws.send(json.dumps({"header": {"type": "heartbeat"}}))
                    logger.debug("하트비트 메시지 전송")
        except Exception as e:
            logger.error(f"하트비트 전송 실패: {e}")
            self.running = False
            # 연결이 끊어진 경우 재연결
            if self.ws and self.ws.closed:
                await self.connect()
    
    async def send_message(self, message: Dict[str, Any]) -> None:
        """
        WebSocket 서버에 메시지 전송
        
        Args:
            message: 전송할 메시지 (JSON 형식)
        """
        if not self.ws or self.ws.closed:
            logger.warning("WebSocket이 연결되어 있지 않습니다. 재연결 시도...")
            await self.connect()
            
        try:
            await self.ws.send(json.dumps(message))
            logger.debug(f"메시지 전송: {message}")
        except Exception as e:
            logger.error(f"메시지 전송 실패: {e}")
            self.running = False
            await self.connect()
    
    async def subscribe_tick(self, symbol: str) -> None:
        """
        특정 종목의 실시간 체결가 구독
        
        Args:
            symbol: 종목 코드 (예: "005930" - 삼성전자)
        """
        subscription = {
            "header": {
                "appKey": self.app_key,
                "token": f"Bearer {self.access_token}",
                "tr_type": "1",  # 실시간 구독
            },
            "body": {
                "tr_id": "FHKST01010100",  # 국내주식 실시간 체결 조회
                "input": {
                    "pdno": symbol,  # 종목코드
                }
            }
        }
        
        # 구독 메시지 저장
        self.subscriptions.append(subscription)
        
        # 구독 메시지 전송
        await self.send_message(subscription)
        logger.info(f"종목 '{symbol}' 실시간 체결가 구독")
    
    async def unsubscribe_tick(self, symbol: str) -> None:
        """
        특정 종목의 실시간 체결가 구독 해제
        
        Args:
            symbol: 종목 코드
        """
        unsubscription = {
            "header": {
                "appKey": self.app_key,
                "token": f"Bearer {self.access_token}",
                "tr_type": "2",  # 실시간 구독 해제
            },
            "body": {
                "tr_id": "FHKST01010100",
                "input": {
                    "pdno": symbol,
                }
            }
        }
        
        # 구독 목록에서 제거
        self.subscriptions = [s for s in self.subscriptions if s["body"]["input"]["pdno"] != symbol]
        
        # 구독 해제 메시지 전송
        await self.send_message(unsubscription)
        logger.info(f"종목 '{symbol}' 실시간 체결가 구독 해제")
    
    async def listen(self) -> None:
        """
        WebSocket 메시지 수신 및 처리
        """
        if not self.ws:
            logger.warning("WebSocket이 연결되어 있지 않습니다. 연결 시도...")
            await self.connect()
            
        try:
            async for message in self.ws:
                try:
                    data = json.loads(message)
                    await self._process_message(data)
                except json.JSONDecodeError:
                    logger.error(f"JSON 파싱 실패: {message}")
        except Exception as e:
            logger.error(f"WebSocket 메시지 수신 실패: {e}")
            self.running = False
            # 연결이 끊어지면 재연결 시도
            await asyncio.sleep(self.reconnect_interval)
            await self.connect()
            await self.listen()
    
    async def _process_message(self, data: Dict[str, Any]) -> None:
        """
        수신한 메시지 처리
        
        Args:
            data: 수신한 메시지 (JSON 파싱 완료)
        """
        # 하트비트 응답인 경우 무시
        if "header" in data and data["header"].get("type") == "heartbeat":
            logger.debug("하트비트 응답 수신")
            return
            
        # TR 호출 응답 처리
        if "header" in data and "body" in data:
            # 실시간 체결 데이터인 경우
            if data["header"].get("tr_id") == "FHKST01010100":
                tick_data = {
                    "symbol": data["body"]["output"]["pdno"],
                    "price": float(data["body"]["output"]["stck_prpr"]),
                    "volume": int(data["body"]["output"]["cntg_vol"]),
                    "timestamp": datetime.now().isoformat(),
                }
                
                logger.debug(f"실시간 체결 데이터 수신: {tick_data}")
                
                # 콜백 함수가 있으면 호출
                if self.on_tick:
                    await self.on_tick(tick_data)
    
    async def close(self) -> None:
        """
        WebSocket 연결 종료
        """
        self.running = False
        
        # 하트비트 작업 취소
        if self.heartbeat_task:
            self.heartbeat_task.cancel()
            
        # 모든 구독 해제
        for subscription in self.subscriptions:
            symbol = subscription["body"]["input"]["pdno"]
            await self.unsubscribe_tick(symbol)
            
        # WebSocket 연결 종료
        if self.ws:
            await self.ws.close()
            logger.info("WebSocket 연결이 종료되었습니다") 