from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Union
import logging
import time

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