# Christmas 프로젝트 환경 변수 설정 스크립트

Write-Host "Christmas 프로젝트 환경 변수를 설정합니다..." -ForegroundColor Green

# Supabase 환경 변수
$env:SUPABASE_URL = "https://your-supabase-url.supabase.co"
$env:SUPABASE_KEY = "your-supabase-key"

# 텔레그램 봇 환경 변수
$env:TELEGRAM_BOT_TOKEN = "your-telegram-bot-token"
$env:TELEGRAM_CHAT_ID = "your-telegram-chat-id"

# 테스트 모드 활성화 (실제 연결 없이 테스트)
$env:TEST_MODE = "true"

Write-Host "환경 변수가 설정되었습니다." -ForegroundColor Green
Write-Host ""
Write-Host "테스트 준비가 완료되었습니다. 다음 명령어로 테스트를 실행하세요:" -ForegroundColor Yellow
Write-Host "python test_simple.py" -ForegroundColor Cyan
Write-Host "python test_supabase_order_service.py" -ForegroundColor Cyan
Write-Host ""
Write-Host "환경 변수 설정 상태:" -ForegroundColor Yellow
Write-Host "SUPABASE_URL: $env:SUPABASE_URL"
Write-Host "SUPABASE_KEY: $($env:SUPABASE_KEY.Substring(0, 5))..." -ForegroundColor DarkGray
Write-Host "TELEGRAM_BOT_TOKEN: $($env:TELEGRAM_BOT_TOKEN.Substring(0, 5))..." -ForegroundColor DarkGray
Write-Host "TELEGRAM_CHAT_ID: $env:TELEGRAM_CHAT_ID"
Write-Host "TEST_MODE: $env:TEST_MODE" 