# Christmas Trading Backend Recovery Verification (DRY RUN)
# 2025-05-26 - PM Recovery Verification Script

Write-Host "=== Backend Recovery Verification (DRY RUN) ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "현재 상황 분석:" -ForegroundColor Yellow
Write-Host "백엔드 서버: 31.220.83.213:8000 - 응답 없음" -ForegroundColor Red
Write-Host "SUPABASE_SERVICE_KEY: 플레이스홀더 값" -ForegroundColor Red
Write-Host "사용자 액션 대기: Supabase Service Key 설정" -ForegroundColor Yellow
Write-Host ""

Write-Host "DRY RUN 테스트 시작..." -ForegroundColor Green
Write-Host ""

# 1. 네트워크 연결 테스트
Write-Host "1. 네트워크 연결 테스트" -ForegroundColor Cyan
Write-Host "테스트 명령: Test-NetConnection -ComputerName 31.220.83.213 -Port 8000" -ForegroundColor Gray

try {
    $networkTest = Test-NetConnection -ComputerName 31.220.83.213 -Port 8000 -WarningAction SilentlyContinue
    
    if ($networkTest.TcpTestSucceeded) {
        Write-Host "TCP 연결: 성공" -ForegroundColor Green
        $serverOnline = $true
    } else {
        Write-Host "TCP 연결: 실패 (서버 다운)" -ForegroundColor Red
        $serverOnline = $false
    }
    
    Write-Host "Ping 결과: $($networkTest.PingSucceeded)" -ForegroundColor White
    if ($networkTest.PingReplyDetails) {
        Write-Host "응답 시간: $($networkTest.PingReplyDetails.RoundtripTime)ms" -ForegroundColor White
    }
} catch {
    Write-Host "네트워크 테스트 실패: $($_.Exception.Message)" -ForegroundColor Red
    $serverOnline = $false
}

Write-Host ""

# 2. API Health Check 테스트
Write-Host "2. API Health Check 테스트" -ForegroundColor Cyan
Write-Host "테스트 URL: http://31.220.83.213:8000/health" -ForegroundColor Gray

if ($serverOnline) {
    try {
        $healthResponse = Invoke-RestMethod -Uri "http://31.220.83.213:8000/health" -Method GET -TimeoutSec 10
        Write-Host "Health Check: 성공" -ForegroundColor Green
        Write-Host "서버 상태: $($healthResponse.status)" -ForegroundColor White
        Write-Host "데이터베이스: $($healthResponse.database)" -ForegroundColor White
    } catch {
        Write-Host "Health Check: 실패 - $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "Health Check: 건너뜀 (서버 오프라인)" -ForegroundColor Yellow
}

Write-Host ""

# 3. 환경변수 상태 분석
Write-Host "3. 환경변수 상태 분석" -ForegroundColor Cyan
Write-Host "참조 파일: backend/env.txt" -ForegroundColor Gray

if (Test-Path "backend/env.txt") {
    Write-Host "env.txt 파일: 존재" -ForegroundColor Green
    
    $envContent = Get-Content "backend/env.txt" -Raw
    
    if ($envContent -match "SUPABASE_SERVICE_KEY=your-supabase-service-role-key") {
        Write-Host "SUPABASE_SERVICE_KEY: 플레이스홀더 값 (수정 필요)" -ForegroundColor Red
    } else {
        Write-Host "SUPABASE_SERVICE_KEY: 설정됨" -ForegroundColor Green
    }
    
    if ($envContent -match "SUPABASE_URL=https://") {
        Write-Host "SUPABASE_URL: 설정됨" -ForegroundColor Green
    } else {
        Write-Host "SUPABASE_URL: 미설정" -ForegroundColor Red
    }
    
    if ($envContent -match "JWT_SECRET=") {
        Write-Host "JWT_SECRET: 설정됨" -ForegroundColor Green
    } else {
        Write-Host "JWT_SECRET: 미설정" -ForegroundColor Red
    }
} else {
    Write-Host "env.txt 파일: 없음" -ForegroundColor Red
}

Write-Host ""

# 4. 결과 요약
Write-Host "DRY RUN 결과 요약" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

if ($serverOnline) {
    Write-Host "서버 상태: 온라인 (복구 완료)" -ForegroundColor Green
    Write-Host ""
    Write-Host "다음 단계: Phase 2 (Supabase 테이블 생성) 진행 가능" -ForegroundColor Green
    Write-Host "실행 명령: .\scripts\create-supabase-tables.ps1" -ForegroundColor Cyan
} else {
    Write-Host "서버 상태: 오프라인 (복구 필요)" -ForegroundColor Red
    Write-Host ""
    Write-Host "필요한 액션:" -ForegroundColor Yellow
    Write-Host "1. Supabase Service Key 확인 및 설정" -ForegroundColor White
    Write-Host "2. 31.220.83.213 서버 SSH 접속" -ForegroundColor White
    Write-Host "3. cd ~/christmas-trading/backend" -ForegroundColor White
    Write-Host "4. .env 파일 업데이트" -ForegroundColor White
    Write-Host "5. docker-compose down" -ForegroundColor White
    Write-Host "6. docker-compose up -d --build" -ForegroundColor White
}

Write-Host ""
Write-Host "예상 복구 시간: 20분 (사용자 액션 완료 시)" -ForegroundColor Cyan
Write-Host "PM 상태: 사용자 액션 대기 중" -ForegroundColor Yellow
Write-Host ""
Write-Host "다시 테스트하려면 이 스크립트를 재실행하세요." -ForegroundColor Gray 