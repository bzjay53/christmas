"""
Christmas Trading MVP - Main FastAPI Application
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.routes import api_router
from app.services.trading_service import TradingService
from app.services.ai_service import AIService
from app.services.telegram_service import TelegramService

# Setup logging
logger = setup_logging()

# Global services
trading_service = None
ai_service = None
telegram_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan management
    """
    global trading_service, ai_service, telegram_service
    
    logger.info("🚀 Starting Christmas Trading MVP...")
    
    # Initialize services
    trading_service = TradingService()
    ai_service = AIService()
    telegram_service = TelegramService()
    
    # Start background tasks
    await trading_service.initialize()
    await ai_service.initialize()
    await telegram_service.initialize()
    
    # Start background workers
    asyncio.create_task(trading_service.run_trading_queue())
    asyncio.create_task(ai_service.run_learning_cycle())
    asyncio.create_task(telegram_service.run_notification_service())
    
    logger.info("✅ All services initialized successfully")
    
    yield
    
    # Cleanup
    logger.info("🛑 Shutting down Christmas Trading MVP...")
    await trading_service.cleanup()
    await ai_service.cleanup()
    await telegram_service.cleanup()
    logger.info("✅ Cleanup completed")

# Create FastAPI application
app = FastAPI(
    title="Christmas Trading MVP",
    description="AI-powered automated trading system",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)

@app.get("/")
async def root():
    """
    Root endpoint
    """
    return {
        "message": "Christmas Trading MVP API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs" if settings.DEBUG else "disabled"
    }

@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    try:
        # Check service health
        services_status = {
            "trading": await trading_service.health_check() if trading_service else False,
            "ai": await ai_service.health_check() if ai_service else False,
            "telegram": await telegram_service.health_check() if telegram_service else False,
        }
        
        all_healthy = all(services_status.values())
        
        return {
            "status": "healthy" if all_healthy else "degraded",
            "services": services_status,
            "timestamp": "2025-06-10T00:00:00Z"
        }
    
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unavailable")

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    Global exception handler
    """
    logger.error(f"Unhandled exception: {exc}")
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if settings.DEBUG else "Something went wrong"
        }
    )

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8080,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )