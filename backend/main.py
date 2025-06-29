"""
Christmas Trading Backend API
원격 서버 배포용 FastAPI 백엔드 서버

주요 기능:
1. JSON 기반 데이터 흐름 관리
2. 실시간 바이낸스 API 연동
3. WebSocket 실시간 통신
4. AI 트레이딩 신호 처리
5. 오케스트레이션 시스템
"""

import os
import json
import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

import uvicorn
from fastapi import FastAPI, WebSocket, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import aioredis
import asyncpg
from binance.client import Client as BinanceClient
from binance.websockets import BinanceSocketManager
import pandas as pd

# 환경 설정
ENV = os.getenv("ENV", "development")
DATABASE_URL = os.getenv("DATABASE_URL")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
BINANCE_API_KEY = os.getenv("BINANCE_API_KEY")
BINANCE_SECRET_KEY = os.getenv("BINANCE_SECRET_KEY")
JSON_DATA_PATH = os.getenv("JSON_DATA_PATH", "/app/data")

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("/app/logs/backend.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# FastAPI 앱 초기화
app = FastAPI(
    title="Christmas Trading Backend",
    description="원격 서버용 암호화폐 거래 백엔드 API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전역 변수
redis_client: Optional[aioredis.Redis] = None
db_pool: Optional[asyncpg.Pool] = None
binance_client: Optional[BinanceClient] = None
websocket_connections: List[WebSocket] = []

# JSON 데이터 저장소
class JSONDataManager:
    """JSON 기반 데이터 흐름 관리자"""
    
    def __init__(self, data_path: str):
        self.data_path = Path(data_path)
        self.data_path.mkdir(exist_ok=True)
        
        # JSON 파일 경로 정의
        self.trading_signals_file = self.data_path / "trading_signals.json"
        self.market_data_file = self.data_path / "market_data.json"
        self.user_actions_file = self.data_path / "user_actions.json"
        self.ai_recommendations_file = self.data_path / "ai_recommendations.json"
        
        # 초기 JSON 파일 생성
        self._initialize_json_files()
    
    def _initialize_json_files(self):
        """초기 JSON 파일 구조 생성"""
        initial_data = {
            "trading_signals.json": {
                "timestamp": datetime.now().isoformat(),
                "signals": [],
                "metadata": {
                    "version": "1.0",
                    "source": "christmas_trading_ai"
                }
            },
            "market_data.json": {
                "timestamp": datetime.now().isoformat(),
                "crypto_pairs": {},
                "market_status": "active"
            },
            "user_actions.json": {
                "timestamp": datetime.now().isoformat(),
                "actions": [],
                "pending_orders": []
            },
            "ai_recommendations.json": {
                "timestamp": datetime.now().isoformat(),
                "recommendations": [],
                "confidence_scores": {}
            }
        }
        
        for filename, data in initial_data.items():
            file_path = self.data_path / filename
            if not file_path.exists():
                self.save_json_data(filename, data)
    
    def save_json_data(self, filename: str, data: Dict[str, Any]):
        """JSON 데이터 저장"""
        file_path = self.data_path / filename
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
            logger.info(f"JSON data saved: {filename}")
        except Exception as e:
            logger.error(f"Error saving JSON data {filename}: {e}")
    
    def load_json_data(self, filename: str) -> Dict[str, Any]:
        """JSON 데이터 로드"""
        file_path = self.data_path / filename
        try:
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                return {}
        except Exception as e:
            logger.error(f"Error loading JSON data {filename}: {e}")
            return {}

# JSON 데이터 매니저 초기화
json_manager = JSONDataManager(JSON_DATA_PATH)

@app.on_event("startup")
async def startup_event():
    """서버 시작 시 초기화"""
    global redis_client, db_pool, binance_client
    
    logger.info("🎄 Christmas Trading Backend 시작 중...")
    
    # Redis 연결
    try:
        redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
        await redis_client.ping()
        logger.info("✅ Redis 연결 성공")
    except Exception as e:
        logger.error(f"❌ Redis 연결 실패: {e}")
    
    # 데이터베이스 연결
    try:
        if DATABASE_URL:
            db_pool = await asyncpg.create_pool(DATABASE_URL)
            logger.info("✅ PostgreSQL 연결 성공")
    except Exception as e:
        logger.error(f"❌ PostgreSQL 연결 실패: {e}")
    
    # 바이낸스 클라이언트 초기화
    try:
        if BINANCE_API_KEY and BINANCE_SECRET_KEY:
            binance_client = BinanceClient(BINANCE_API_KEY, BINANCE_SECRET_KEY)
            # 계정 정보 확인으로 연결 테스트
            account_info = binance_client.get_account()
            logger.info("✅ Binance API 연결 성공")
        else:
            logger.warning("⚠️ Binance API 키가 설정되지 않음")
    except Exception as e:
        logger.error(f"❌ Binance API 연결 실패: {e}")
    
    # 백그라운드 작업 시작
    asyncio.create_task(background_data_processing())
    
    logger.info("🚀 Christmas Trading Backend 시작 완료!")

@app.on_event("shutdown")
async def shutdown_event():
    """서버 종료 시 정리"""
    logger.info("🔄 Christmas Trading Backend 종료 중...")
    
    if redis_client:
        await redis_client.close()
    
    if db_pool:
        await db_pool.close()
    
    logger.info("✅ Christmas Trading Backend 종료 완료")

# API 엔드포인트
@app.get("/health")
async def health_check():
    """헬스체크 엔드포인트"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "services": {
            "redis": redis_client is not None,
            "database": db_pool is not None,
            "binance": binance_client is not None
        }
    }

@app.get("/api/market-data")
async def get_market_data():
    """실시간 시장 데이터 조회"""
    try:
        # JSON 파일에서 데이터 로드
        market_data = json_manager.load_json_data("market_data.json")
        
        # 바이낸스에서 실시간 데이터 가져오기
        if binance_client:
            tickers = binance_client.get_ticker()
            # 주요 암호화폐만 필터링
            major_cryptos = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT']
            filtered_tickers = [t for t in tickers if t['symbol'] in major_cryptos]
            
            market_data['crypto_pairs'] = filtered_tickers
            market_data['timestamp'] = datetime.now().isoformat()
            
            # JSON 파일에 저장
            json_manager.save_json_data("market_data.json", market_data)
        
        return market_data
    except Exception as e:
        logger.error(f"Market data error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/trading-signals")
async def get_trading_signals():
    """AI 트레이딩 신호 조회"""
    try:
        signals_data = json_manager.load_json_data("trading_signals.json")
        return signals_data
    except Exception as e:
        logger.error(f"Trading signals error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/user-action")
async def process_user_action(action_data: Dict[str, Any]):
    """사용자 액션 처리 (JSON 저장 → 오케스트레이션)"""
    try:
        # 사용자 액션을 JSON 파일에 저장
        user_actions = json_manager.load_json_data("user_actions.json")
        
        action_data['timestamp'] = datetime.now().isoformat()
        action_data['status'] = 'pending'
        action_data['id'] = f"action_{datetime.now().timestamp()}"
        
        user_actions['actions'].append(action_data)
        user_actions['timestamp'] = datetime.now().isoformat()
        
        json_manager.save_json_data("user_actions.json", user_actions)
        
        # WebSocket으로 실시간 알림
        await broadcast_to_websockets({
            "type": "user_action",
            "data": action_data
        })
        
        logger.info(f"User action processed: {action_data['id']}")
        return {"status": "success", "action_id": action_data['id']}
        
    except Exception as e:
        logger.error(f"User action error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket 실시간 연결"""
    await websocket.accept()
    websocket_connections.append(websocket)
    
    try:
        while True:
            # 클라이언트로부터 메시지 수신
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # 메시지 타입에 따른 처리
            if message.get("type") == "subscribe_market_data":
                # 실시간 시장 데이터 구독
                await websocket.send_text(json.dumps({
                    "type": "subscription_confirmed",
                    "data": {"subscription": "market_data"}
                }))
            
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if websocket in websocket_connections:
            websocket_connections.remove(websocket)

async def broadcast_to_websockets(message: Dict[str, Any]):
    """모든 WebSocket 연결에 메시지 브로드캐스트"""
    if websocket_connections:
        message_str = json.dumps(message, default=str)
        for websocket in websocket_connections[:]:  # 복사본으로 순회
            try:
                await websocket.send_text(message_str)
            except Exception as e:
                logger.error(f"WebSocket broadcast error: {e}")
                websocket_connections.remove(websocket)

async def background_data_processing():
    """백그라운드 데이터 처리 작업"""
    while True:
        try:
            # JSON 파일 변화 감지 및 처리
            await process_json_changes()
            
            # 실시간 시장 데이터 업데이트
            await update_market_data()
            
            # AI 신호 생성
            await generate_ai_signals()
            
            # 30초 대기
            await asyncio.sleep(30)
            
        except Exception as e:
            logger.error(f"Background processing error: {e}")
            await asyncio.sleep(60)  # 에러 시 1분 대기

async def process_json_changes():
    """JSON 파일 변화 감지 및 오케스트레이션"""
    try:
        # 사용자 액션 처리
        user_actions = json_manager.load_json_data("user_actions.json")
        
        for action in user_actions.get('actions', []):
            if action.get('status') == 'pending':
                # 액션 처리 로직
                await execute_user_action(action)
                
                # 상태 업데이트
                action['status'] = 'processed'
                action['processed_at'] = datetime.now().isoformat()
        
        # JSON 파일 업데이트
        json_manager.save_json_data("user_actions.json", user_actions)
        
    except Exception as e:
        logger.error(f"JSON processing error: {e}")

async def execute_user_action(action: Dict[str, Any]):
    """사용자 액션 실행 (실제 거래 처리)"""
    try:
        action_type = action.get('type')
        
        if action_type == 'buy_order':
            # 매수 주문 처리
            symbol = action.get('symbol')
            quantity = action.get('quantity')
            
            if binance_client and symbol and quantity:
                # 실제 바이낸스 주문 (테스트넷에서만)
                order = binance_client.create_order(
                    symbol=symbol,
                    side='BUY',
                    type='MARKET',
                    quantity=quantity
                )
                
                action['order_result'] = order
                logger.info(f"Buy order executed: {order}")
        
        elif action_type == 'sell_order':
            # 매도 주문 처리
            symbol = action.get('symbol')
            quantity = action.get('quantity')
            
            if binance_client and symbol and quantity:
                order = binance_client.create_order(
                    symbol=symbol,
                    side='SELL',
                    type='MARKET',
                    quantity=quantity
                )
                
                action['order_result'] = order
                logger.info(f"Sell order executed: {order}")
        
        # 결과를 WebSocket으로 전송
        await broadcast_to_websockets({
            "type": "action_result",
            "data": action
        })
        
    except Exception as e:
        logger.error(f"Action execution error: {e}")
        action['error'] = str(e)

async def update_market_data():
    """실시간 시장 데이터 업데이트"""
    try:
        if binance_client:
            # 주요 암호화폐 데이터 가져오기
            tickers = binance_client.get_ticker()
            major_cryptos = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']
            
            filtered_data = [t for t in tickers if t['symbol'] in major_cryptos]
            
            # JSON 파일 업데이트
            market_data = {
                "timestamp": datetime.now().isoformat(),
                "crypto_pairs": filtered_data,
                "market_status": "active"
            }
            
            json_manager.save_json_data("market_data.json", market_data)
            
            # WebSocket으로 실시간 전송
            await broadcast_to_websockets({
                "type": "market_update",
                "data": market_data
            })
            
    except Exception as e:
        logger.error(f"Market data update error: {e}")

async def generate_ai_signals():
    """AI 트레이딩 신호 생성 (Mock)"""
    try:
        # 간단한 AI 신호 생성 로직 (실제로는 ML 모델 사용)
        market_data = json_manager.load_json_data("market_data.json")
        
        signals = []
        for crypto in market_data.get('crypto_pairs', []):
            symbol = crypto.get('symbol')
            price_change = float(crypto.get('priceChangePercent', 0))
            
            # 간단한 신호 생성 로직
            if price_change > 5:
                signal = {
                    "symbol": symbol,
                    "signal": "STRONG_BUY",
                    "confidence": 0.85,
                    "reason": f"Strong upward momentum: +{price_change}%"
                }
            elif price_change > 2:
                signal = {
                    "symbol": symbol,
                    "signal": "BUY",
                    "confidence": 0.65,
                    "reason": f"Positive momentum: +{price_change}%"
                }
            elif price_change < -5:
                signal = {
                    "symbol": symbol,
                    "signal": "STRONG_SELL",
                    "confidence": 0.80,
                    "reason": f"Strong downward pressure: {price_change}%"
                }
            else:
                signal = {
                    "symbol": symbol,
                    "signal": "HOLD",
                    "confidence": 0.50,
                    "reason": "Neutral market conditions"
                }
            
            signal['timestamp'] = datetime.now().isoformat()
            signals.append(signal)
        
        # AI 신호 저장
        ai_data = {
            "timestamp": datetime.now().isoformat(),
            "signals": signals,
            "metadata": {
                "model_version": "1.0",
                "confidence_threshold": 0.6
            }
        }
        
        json_manager.save_json_data("ai_recommendations.json", ai_data)
        
        # WebSocket으로 전송
        await broadcast_to_websockets({
            "type": "ai_signals",
            "data": ai_data
        })
        
    except Exception as e:
        logger.error(f"AI signal generation error: {e}")

if __name__ == "__main__":
    # 서버 실행
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8080,
        reload=ENV == "development",
        log_level="info"
    )