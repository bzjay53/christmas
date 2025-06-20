"""
API Routes for Christmas Trading MVP
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
import asyncio
from datetime import datetime

from app.core.config import settings
from app.services.kis_api_service import KISAPIService
from app.services.ai_service import AIService
from app.services.telegram_service import TelegramService
from app.services.trading_service import TradingService

api_router = APIRouter()

# Initialize services
kis_service = KISAPIService()
ai_service = AIService()
telegram_service = TelegramService()
trading_service = TradingService()

@api_router.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@api_router.get("/api/status")
async def get_system_status():
    """
    Get overall system status
    """
    try:
        # Check KIS API
        kis_healthy = await kis_service.health_check()
        
        return {
            "status": "operational",
            "services": {
                "kis_api": "healthy" if kis_healthy else "unhealthy",
                "ai_service": "healthy",
                "telegram_bot": "healthy",
                "trading_service": "healthy"
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

@api_router.get("/api/portfolio")
async def get_portfolio():
    """
    Get current portfolio status
    """
    try:
        balance = await kis_service.get_account_balance()
        return {
            "status": "success",
            "data": balance,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portfolio fetch failed: {str(e)}")

@api_router.get("/api/stocks/{stock_code}/price")
async def get_stock_price(stock_code: str):
    """
    Get current stock price
    """
    try:
        price_data = await kis_service.get_current_price(stock_code)
        return {
            "status": "success",
            "data": price_data,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Price fetch failed: {str(e)}")

@api_router.post("/api/analyze")
async def analyze_market():
    """
    Trigger AI market analysis
    """
    try:
        # Get market data for analysis
        stocks_to_analyze = ["005930", "000660", "035420"]  # Samsung, SK, NAVER
        
        analysis_results = []
        for stock_code in stocks_to_analyze:
            price_data = await kis_service.get_current_price(stock_code)
            analysis = await ai_service.analyze_stock(stock_code, price_data)
            analysis_results.append(analysis)
        
        return {
            "status": "success",
            "data": {
                "analysis": analysis_results,
                "summary": "Market analysis completed"
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@api_router.post("/api/trading/start")
async def start_trading():
    """
    Start automated trading
    """
    try:
        result = await trading_service.start_trading()
        
        # Send notification
        await telegram_service.send_message("🤖 자동매매 시작됨")
        
        return {
            "status": "success",
            "data": result,
            "message": "Trading started successfully",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trading start failed: {str(e)}")

@api_router.post("/api/trading/stop")
async def stop_trading():
    """
    Stop automated trading
    """
    try:
        result = await trading_service.stop_trading()
        
        # Send notification
        await telegram_service.send_message("🛑 자동매매 중지됨")
        
        return {
            "status": "success",
            "data": result,
            "message": "Trading stopped successfully",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trading stop failed: {str(e)}")

@api_router.get("/api/trading/history")
async def get_trading_history(limit: int = 50):
    """
    Get trading history
    """
    try:
        history = await trading_service.get_trading_history(limit)
        return {
            "status": "success",
            "data": history,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"History fetch failed: {str(e)}")

@api_router.post("/api/telegram/test")
async def test_telegram():
    """
    Test Telegram bot connectivity
    """
    try:
        result = await telegram_service.send_message("🧪 테스트 메시지 - Christmas Trading Bot 연결 확인")
        return {
            "status": "success",
            "data": result,
            "message": "Telegram test message sent",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Telegram test failed: {str(e)}")