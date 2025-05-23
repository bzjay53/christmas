# Christmas 프로젝트 로컬 실행 스크립트 (Docker 없이)
param(
    [string]$Action = "start",
    [switch]$Dev = $false
)

Write-Host "Christmas Project Local Runner" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

function Test-Python {
    Write-Host "Python 환경 확인 중..." -ForegroundColor Yellow
    
    try {
        $pythonVersion = python --version
        Write-Host "✓ $pythonVersion 설치됨" -ForegroundColor Green
    } catch {
        Write-Host "✗ Python이 설치되지 않음" -ForegroundColor Red
        exit 1
    }
    
    # 가상환경 확인
    if (Test-Path ".venv") {
        Write-Host "✓ 가상환경 .venv 존재" -ForegroundColor Green
    } else {
        Write-Host "⚠ 가상환경을 생성합니다..." -ForegroundColor Yellow
        python -m venv .venv
        Write-Host "✓ 가상환경 생성 완료" -ForegroundColor Green
    }
}

function Install-Dependencies {
    Write-Host "의존성 패키지 설치 중..." -ForegroundColor Yellow
    
    # 가상환경 활성화
    & ".\.venv\Scripts\Activate.ps1"
    
    # 의존성 설치
    try {
        pip install -r requirements.txt
        Write-Host "✓ 의존성 설치 완료" -ForegroundColor Green
    } catch {
        Write-Host "⚠ requirements.txt에서 설치 실패, 개별 패키지 설치 시도..." -ForegroundColor Yellow
        
        # 핵심 패키지들 설치
        $packages = @(
            "fastapi",
            "uvicorn[standard]",
            "supabase",
            "python-telegram-bot",
            "requests",
            "python-dotenv",
            "pydantic",
            "asyncio"
        )
        
        foreach ($package in $packages) {
            try {
                pip install $package
                Write-Host "✓ $package 설치됨" -ForegroundColor Green
            } catch {
                Write-Host "⚠ $package 설치 실패" -ForegroundColor Yellow
            }
        }
    }
}

function Start-WebServer {
    Write-Host "웹 서버 시작 중..." -ForegroundColor Yellow
    
    # 가상환경 활성화
    & ".\.venv\Scripts\Activate.ps1"
    
    # 환경 변수 설정
    $env:CHRISTMAS_ENV = "local"
    $env:CHRISTMAS_DEBUG = "true"
    
    # 포트 확인
    $port = 8000
    $existingProcess = netstat -ano | findstr ":$port"
    if ($existingProcess) {
        Write-Host "⚠ 포트 $port 이 사용 중입니다. 다른 포트를 사용합니다." -ForegroundColor Yellow
        $port = 8001
    }
    
    try {
        # FastAPI 서버 시작
        if (Test-Path "app/api/main.py") {
            Write-Host "FastAPI 서버를 포트 $port 에서 시작합니다..." -ForegroundColor Cyan
            uvicorn app.api.main:app --host 0.0.0.0 --port $port --reload
        } elseif (Test-Path "index.py") {
            Write-Host "index.py 서버를 포트 $port 에서 시작합니다..." -ForegroundColor Cyan
            uvicorn index:app --host 0.0.0.0 --port $port --reload
        } else {
            Write-Host "메인 애플리케이션 파일을 찾을 수 없습니다." -ForegroundColor Red
            Write-Host "다음 파일 중 하나가 필요합니다: app/api/main.py, index.py" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ 서버 시작 실패: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Start-SimpleServer {
    Write-Host "간단한 HTTP 서버 시작 중..." -ForegroundColor Yellow
    
    # 가상환경 활성화
    & ".\.venv\Scripts\Activate.ps1"
    
    # 간단한 웹 서버 파일 생성
    $simpleServerCode = @"
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import os

app = FastAPI(title="Christmas Project", version="1.0.0")

# 정적 파일 서빙
if os.path.exists("app/web/static"):
    app.mount("/static", StaticFiles(directory="app/web/static"), name="static")
elif os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return {"message": "Christmas Project is running!", "status": "ok", "environment": "local"}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "christmas-api", "environment": "local"}

@app.get("/api/status")
async def api_status():
    return {
        "status": "running",
        "version": "1.0.0",
        "environment": "local",
        "features": ["api", "web", "monitoring"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
"@

    $simpleServerCode | Out-File -FilePath "simple_server.py" -Encoding UTF8
    
    try {
        python simple_server.py
    } catch {
        Write-Host "✗ 간단한 서버 시작 실패: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Show-LocalStatus {
    Write-Host "로컬 서비스 상태 확인..." -ForegroundColor Yellow
    
    # 포트 사용 확인
    $ports = @(8000, 8001, 3000, 9090)
    foreach ($port in $ports) {
        $process = netstat -ano | findstr ":$port"
        if ($process) {
            Write-Host "✓ 포트 $port 사용 중" -ForegroundColor Green
        } else {
            Write-Host "- 포트 $port 비어있음" -ForegroundColor Gray
        }
    }
    
    # 웹 서비스 접근 테스트
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000" -TimeoutSec 5 -UseBasicParsing
        Write-Host "✓ 웹 서비스 접근 가능: http://localhost:8000" -ForegroundColor Green
    } catch {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8001" -TimeoutSec 5 -UseBasicParsing
            Write-Host "✓ 웹 서비스 접근 가능: http://localhost:8001" -ForegroundColor Green
        } catch {
            Write-Host "⚠ 웹 서비스에 접근할 수 없습니다" -ForegroundColor Yellow
        }
    }
}

function Stop-LocalServices {
    Write-Host "로컬 서비스 중지 중..." -ForegroundColor Yellow
    
    # Python 프로세스 찾기 및 종료
    $pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
    foreach ($process in $pythonProcesses) {
        if ($process.ProcessName -eq "python") {
            try {
                Stop-Process -Id $process.Id -Force
                Write-Host "✓ Python 프로세스 (PID: $($process.Id)) 종료됨" -ForegroundColor Green
            } catch {
                Write-Host "⚠ Python 프로세스 종료 실패: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    }
    
    # 포트 사용 프로세스 종료
    $ports = @(8000, 8001)
    foreach ($port in $ports) {
        $netstatOutput = netstat -ano | findstr ":$port"
        if ($netstatOutput) {
            $pid = ($netstatOutput -split '\s+')[-1]
            try {
                taskkill /PID $pid /F
                Write-Host "✓ 포트 $port 사용 프로세스 (PID: $pid) 종료됨" -ForegroundColor Green
            } catch {
                Write-Host "⚠ 포트 $port 프로세스 종료 실패" -ForegroundColor Yellow
            }
        }
    }
}

# 메인 실행
switch ($Action.ToLower()) {
    "setup" {
        Test-Python
        Install-Dependencies
    }
    "start" {
        Test-Python
        Install-Dependencies
        Start-WebServer
    }
    "simple" {
        Test-Python
        Install-Dependencies
        Start-SimpleServer
    }
    "status" {
        Show-LocalStatus
    }
    "stop" {
        Stop-LocalServices
    }
    default {
        Write-Host "사용법: .\scripts\run_local.ps1 -Action <command>" -ForegroundColor Yellow
        Write-Host "가능한 명령어:" -ForegroundColor Yellow
        Write-Host "  setup  - Python 환경 설정 및 의존성 설치" -ForegroundColor White
        Write-Host "  start  - 메인 웹 서버 시작" -ForegroundColor White
        Write-Host "  simple - 간단한 웹 서버 시작" -ForegroundColor White
        Write-Host "  status - 서비스 상태 확인" -ForegroundColor White
        Write-Host "  stop   - 모든 로컬 서비스 중지" -ForegroundColor White
    }
} 