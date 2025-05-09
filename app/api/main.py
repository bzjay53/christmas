from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Union, Optional, Any
from datetime import datetime
import logging
import time
import uuid

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# FastAPI 앱 초기화
app = FastAPI(
    title="Christmas API",
    description="초단타 자동 매매 플랫폼 API",
    version="0.1.0",
)

# CORS 미들웨어 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 배포 시 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 키 검증 dependency
from app.auth.api_key import get_api_key_manager

async def verify_api_key(x_api_key: Optional[str] = Header(None)):
    if x_api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API 키가 필요합니다",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    api_key_manager = get_api_key_manager()
    result = api_key_manager.validate_key(x_api_key)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 API 키입니다",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    return result

# 상태 체크용 엔드포인트
@app.get("/", tags=["Health"])
async def root() -> Dict[str, str]:
    return {"message": "Christmas API 서버가 정상 작동 중입니다"}

@app.get("/health", tags=["Health"])
async def health_check() -> Dict[str, Union[str, float]]:
    return {
        "status": "ok",
        "timestamp": time.time(),
        "version": "0.1.0",
    }

# 테스트용 보호된 리소스 엔드포인트
@app.get("/api/protected-resource", tags=["Test"])
async def protected_resource(api_key_info: Dict = Depends(verify_api_key)) -> Dict[str, Any]:
    return {
        "message": "보호된 리소스에 접근했습니다",
        "user_id": api_key_info["user_id"],
        "scope": api_key_info["scope"],
        "timestamp": datetime.now().isoformat()
    }

# 테스트용 데이터 수집 엔드포인트
@app.post("/api/v1/ingest/market-data", tags=["Test"])
async def ingest_market_data(
    data: Dict[str, Any],
    api_key_info: Dict = Depends(verify_api_key)
) -> Dict[str, Any]:
    return {
        "success": True,
        "message": "시장 데이터가 성공적으로 수집되었습니다",
        "data_id": str(uuid.uuid4())
    }

# 테스트용 시그널 엔드포인트
@app.post("/api/v1/signals", tags=["Test"])
async def create_signal(
    signal: Dict[str, Any],
    api_key_info: Dict = Depends(verify_api_key)
) -> Dict[str, Any]:
    return {
        "success": True,
        "message": "시그널이 성공적으로 생성되었습니다",
        "signal_id": str(uuid.uuid4()),
        "created_at": datetime.now().isoformat()
    }

@app.get("/api/v1/signals", tags=["Test"])
async def get_signals(
    symbol: Optional[str] = None,
    limit: int = 10,
    api_key_info: Dict = Depends(verify_api_key)
) -> List[Dict[str, Any]]:
    # 테스트용 더미 데이터 생성
    signals = []
    for i in range(min(limit, 5)):  # 최대 5개의 시그널
        signals.append({
            "id": str(uuid.uuid4()),
            "symbol": symbol or "BTC/USDT",
            "strategy": "test_strategy",
            "signal_type": "buy" if i % 2 == 0 else "sell",
            "confidence": 0.75 + (i * 0.05),
            "price": 50000.0 - (i * 100),
            "timestamp": datetime.now().isoformat()
        })
    return signals

# 테스트용 주문 엔드포인트
@app.get("/api/v1/orders", tags=["Test"])
async def get_orders(
    signal_id: Optional[str] = None,
    api_key_info: Dict = Depends(verify_api_key)
) -> List[Dict[str, Any]]:
    # 테스트용 더미 데이터 생성
    orders = []
    for i in range(1):  # 주어진 signal_id에 대해 하나의 주문만 생성
        orders.append({
            "id": str(uuid.uuid4()),
            "symbol": "ETH/USDT",
            "order_type": "market",
            "side": "buy",
            "price": 3000.0,
            "quantity": 0.1,
            "status": "filled",
            "signal_id": signal_id or str(uuid.uuid4()),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        })
    return orders

# API 라우터 등록
from app.auth.router import router as auth_router
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])

# 추가 라우터 (향후 확장)
# from .routes import market, strategy, execution
# app.include_router(market.router, prefix="/market", tags=["Market Data"])
# app.include_router(strategy.router, prefix="/strategy", tags=["Trading Strategy"])
# app.include_router(execution.router, prefix="/execution", tags=["Trade Execution"])

# 시작 이벤트
@app.on_event("startup")
async def startup_event():
    logger.info("Christmas API 서버가 시작되었습니다")

# 종료 이벤트
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Christmas API 서버가 종료됩니다")

# 메인 실행 부분
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 