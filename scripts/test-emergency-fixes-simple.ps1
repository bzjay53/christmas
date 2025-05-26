# Christmas Trading 긴급 수정사항 간단 테스트

param([switch]$DryRun = $false)

Write-Host "🎄 Christmas Trading 긴급 수정사항 테스트" -ForegroundColor Green

if ($DryRun) {
    Write-Host "🧪 DRY RUN 모드" -ForegroundColor Yellow
}

# 1. 환경 확인
Write-Host "`n📋 환경 확인" -ForegroundColor Cyan

$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js 없음" -ForegroundColor Red
    exit 1
}

# 2. 디렉토리 확인
if (Test-Path "web-dashboard") {
    Write-Host "✅ 프론트엔드 디렉토리 존재" -ForegroundColor Green
} else {
    Write-Host "❌ web-dashboard 없음" -ForegroundColor Red
    exit 1
}

if (Test-Path "backend") {
    Write-Host "✅ 백엔드 디렉토리 존재" -ForegroundColor Green
} else {
    Write-Host "❌ backend 없음" -ForegroundColor Red
    exit 1
}

# 3. 백엔드 구문 검사
Write-Host "`n🔧 백엔드 구문 검사" -ForegroundColor Cyan

$backendFiles = @("backend/server.js", "backend/services/supabaseAuth.js")

foreach ($file in $backendFiles) {
    if (Test-Path $file) {
        Write-Host "📄 $file 검사 중..." -ForegroundColor Yellow
        if (-not $DryRun) {
            node --check $file
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ $file 구문 검사 통과" -ForegroundColor Green
            } else {
                Write-Host "❌ $file 구문 오류" -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "🧪 DRY RUN: $file 검사 시뮬레이션" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ $file 없음" -ForegroundColor Yellow
    }
}

# 4. 스키마 파일 확인
Write-Host "`n📊 스키마 파일 확인" -ForegroundColor Cyan

if (Test-Path "scripts/fix-supabase-schema.sql") {
    Write-Host "✅ Supabase 스키마 수정 스크립트 존재" -ForegroundColor Green
} else {
    Write-Host "❌ 스키마 스크립트 없음" -ForegroundColor Red
}

# 5. 백엔드 서버 연결 테스트
Write-Host "`n🌐 백엔드 서버 테스트" -ForegroundColor Cyan

$backendUrl = "http://31.220.83.213:8000"

if (-not $DryRun) {
    try {
        $response = Invoke-RestMethod -Uri "$backendUrl/" -Method GET -TimeoutSec 10
        if ($response) {
            Write-Host "✅ 백엔드 서버 연결 성공" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ 백엔드 서버 연결 실패" -ForegroundColor Red
    }

    try {
        $healthResponse = Invoke-RestMethod -Uri "$backendUrl/api/health" -Method GET -TimeoutSec 10
        if ($healthResponse -and $healthResponse.status -eq "healthy") {
            Write-Host "✅ Health Check API 정상" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Health Check API 응답 이상" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Health Check API 실패" -ForegroundColor Red
    }
} else {
    Write-Host "🧪 DRY RUN: 서버 연결 테스트 시뮬레이션" -ForegroundColor Yellow
}

Write-Host "`n✅ 테스트 완료!" -ForegroundColor Green 