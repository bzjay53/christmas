from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import os
import datetime

app = FastAPI(title="Christmas Project", version="1.0.0")

# 정적 파일 서빙
if os.path.exists("app/web/static"):
    app.mount("/static", StaticFiles(directory="app/web/static"), name="static")
elif os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return {
        "message": "🎄 Christmas Project is running!", 
        "status": "ok", 
        "environment": "local",
        "timestamp": datetime.datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    return {
        "status": "ok", 
        "service": "christmas-api", 
        "environment": "local",
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/status")
async def api_status():
    return {
        "status": "running",
        "version": "1.0.0",
        "environment": "local",
        "features": ["api", "web", "monitoring"],
        "services": {
            "api": "running",
            "web": "running", 
            "database": "simulated",
            "monitoring": "simulated"
        },
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/demo")
async def demo():
    return {
        "message": "Christmas Project Demo API",
        "data": {
            "trading_pairs": ["BTC/USD", "ETH/USD", "BNB/USD"],
            "strategies": ["momentum", "mean_reversion", "arbitrage"],
            "status": "simulation_mode"
        },
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/docs")
async def get_docs():
    return {"message": "API documentation available at /docs"}

if __name__ == "__main__":
    import uvicorn
    print("🎄 Starting Christmas Project Server...")
    print("📡 Server will be available at: http://localhost:8000")
    print("📚 API documentation at: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True) 