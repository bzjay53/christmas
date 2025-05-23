# Christmas 프로젝트 의존성 패키지 설치 스크립트

Write-Host "Christmas 프로젝트 의존성 패키지를 설치합니다..." -ForegroundColor Green

# 기본 패키지 설치
Write-Host "기본 패키지 설치 중..." -ForegroundColor Yellow
python -m pip install -U pip
python -m pip install python-dotenv

# Supabase 관련 패키지 설치
Write-Host "Supabase 관련 패키지 설치 중..." -ForegroundColor Yellow
python -m pip install supabase

# 텔레그램 봇 관련 패키지 설치
Write-Host "텔레그램 봇 관련 패키지 설치 중..." -ForegroundColor Yellow
python -m pip install aiohttp

# 비동기 관련 패키지 설치
Write-Host "비동기 관련 패키지 설치 중..." -ForegroundColor Yellow
python -m pip install asyncio

Write-Host "모든 의존성 패키지가 설치되었습니다." -ForegroundColor Green
Write-Host ""
Write-Host "다음 명령어로 환경 변수를 설정하세요:" -ForegroundColor Yellow
Write-Host ".\setup_env.ps1" -ForegroundColor Cyan 