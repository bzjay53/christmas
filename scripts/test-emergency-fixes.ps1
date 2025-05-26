# Christmas Trading 긴급 수정사항 테스트 스크립트
# 실제 배포 전 로컬에서 테스트를 수행합니다.

param(
    [switch]$DryRun = $false,
    [switch]$SkipBuild = $false,
    [switch]$Verbose = $false
)

Write-Host "🎄 Christmas Trading 긴급 수정사항 테스트" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

if ($DryRun) {
    Write-Host "🧪 DRY RUN 모드: 실제 변경 없이 테스트만 수행합니다." -ForegroundColor Yellow
}

# 1. 환경 확인
Write-Host "`n📋 1단계: 환경 확인" -ForegroundColor Cyan

# Node.js 버전 확인
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js가 설치되지 않았습니다." -ForegroundColor Red
    exit 1
}

# npm 버전 확인
$npmVersion = npm --version 2>$null
if ($npmVersion) {
    Write-Host "✅ npm: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ npm이 설치되지 않았습니다." -ForegroundColor Red
    exit 1
}

# 프로젝트 디렉토리 확인
if (Test-Path "web-dashboard") {
    Write-Host "✅ 프론트엔드 디렉토리 존재" -ForegroundColor Green
} else {
    Write-Host "❌ web-dashboard 디렉토리를 찾을 수 없습니다." -ForegroundColor Red
    exit 1
}

if (Test-Path "backend") {
    Write-Host "✅ 백엔드 디렉토리 존재" -ForegroundColor Green
} else {
    Write-Host "❌ backend 디렉토리를 찾을 수 없습니다." -ForegroundColor Red
    exit 1
}

# 2. 프론트엔드 빌드 테스트
Write-Host "`n🎨 2단계: 프론트엔드 빌드 테스트" -ForegroundColor Cyan

if (-not $SkipBuild) {
    Set-Location "web-dashboard"
    
    # 의존성 설치
    Write-Host "📦 의존성 설치 중..." -ForegroundColor Yellow
    if ($DryRun) {
        Write-Host "🧪 DRY RUN: npm ci 실행 시뮬레이션" -ForegroundColor Yellow
    } else {
        npm ci
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ 의존성 설치 실패" -ForegroundColor Red
            Set-Location ..
            exit 1
        }
    }
    
    # 빌드 테스트
    Write-Host "🔨 빌드 테스트 중..." -ForegroundColor Yellow
    if ($DryRun) {
        Write-Host "🧪 DRY RUN: npm run build 실행 시뮬레이션" -ForegroundColor Yellow
    } else {
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ 빌드 실패" -ForegroundColor Red
            Set-Location ..
            exit 1
        }
        Write-Host "✅ 프론트엔드 빌드 성공" -ForegroundColor Green
    }
    
    Set-Location ..
} else {
    Write-Host "⏭️ 빌드 테스트 건너뛰기" -ForegroundColor Yellow
}

# 3. 백엔드 구문 검사
Write-Host "`n🔧 3단계: 백엔드 구문 검사" -ForegroundColor Cyan

Set-Location "backend"

# package.json 확인
if (Test-Path "package.json") {
    Write-Host "✅ package.json 존재" -ForegroundColor Green
} else {
    Write-Host "❌ package.json을 찾을 수 없습니다." -ForegroundColor Red
    Set-Location ..
    exit 1
}

# 주요 파일들 구문 검사
$backendFiles = @(
    "server.js",
    "services/supabaseAuth.js",
    "routes/auth.js",
    "middleware/auth.js"
)

foreach ($file in $backendFiles) {
    if (Test-Path $file) {
        Write-Host "📄 $file 구문 검사 중..." -ForegroundColor Yellow
        if ($DryRun) {
            Write-Host "🧪 DRY RUN: node --check $file 시뮬레이션" -ForegroundColor Yellow
        } else {
            node --check $file
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ $file 구문 검사 통과" -ForegroundColor Green
            } else {
                Write-Host "❌ $file 구문 오류 발견" -ForegroundColor Red
                Set-Location ..
                exit 1
            }
        }
    } else {
        Write-Host "⚠️ $file 파일이 없습니다." -ForegroundColor Yellow
    }
}

Set-Location ..

# 4. Supabase 스키마 검증
Write-Host "`n📊 4단계: Supabase 스키마 검증" -ForegroundColor Cyan

if (Test-Path "scripts/fix-supabase-schema.sql") {
    Write-Host "✅ Supabase 스키마 수정 스크립트 존재" -ForegroundColor Green
    
    # SQL 구문 기본 검사
    $sqlContent = Get-Content "scripts/fix-supabase-schema.sql" -Raw
    if ($sqlContent -match "CREATE TABLE|ALTER TABLE|CREATE INDEX") {
        Write-Host "✅ SQL 스크립트에 필요한 명령어 포함" -ForegroundColor Green
    } else {
        Write-Host "⚠️ SQL 스크립트 내용 확인 필요" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Supabase 스키마 수정 스크립트를 찾을 수 없습니다." -ForegroundColor Red
}

# 5. 환경변수 검증
Write-Host "`n🔐 5단계: 환경변수 검증" -ForegroundColor Cyan

$envFiles = @(
    "backend/env.txt",
    "web-dashboard/env.txt"
)

foreach ($envFile in $envFiles) {
    if (Test-Path $envFile) {
        Write-Host "✅ $envFile 존재" -ForegroundColor Green
        
        # 필수 환경변수 확인
        $envContent = Get-Content $envFile -Raw
        $requiredVars = @("SUPABASE_URL", "SUPABASE_ANON_KEY", "JWT_SECRET")
        
        foreach ($var in $requiredVars) {
            if ($envContent -match $var) {
                Write-Host "  ✅ $var 설정됨" -ForegroundColor Green
            } else {
                Write-Host "  ❌ $var 누락" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "⚠️ $envFile 파일이 없습니다." -ForegroundColor Yellow
    }
}

# 6. 백엔드 서버 연결 테스트
Write-Host "`n🌐 6단계: 백엔드 서버 연결 테스트" -ForegroundColor Cyan

$backendUrl = "http://31.220.83.213:8000"

try {
    Write-Host "📡 백엔드 서버 연결 테스트 중..." -ForegroundColor Yellow
    
    if ($DryRun) {
        Write-Host "🧪 DRY RUN: 서버 연결 테스트 시뮬레이션" -ForegroundColor Yellow
    } else {
        $response = Invoke-RestMethod -Uri "$backendUrl/" -Method GET -TimeoutSec 10
        if ($response) {
            Write-Host "✅ 백엔드 서버 연결 성공" -ForegroundColor Green
            if ($Verbose) {
                Write-Host "서버 응답: $($response.message)" -ForegroundColor Gray
            }
        }
    }
} catch {
    Write-Host "❌ 백엔드 서버 연결 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# Health Check API 테스트
try {
    Write-Host "🏥 Health Check API 테스트 중..." -ForegroundColor Yellow
    
    if ($DryRun) {
        Write-Host "🧪 DRY RUN: Health Check API 테스트 시뮬레이션" -ForegroundColor Yellow
    } else {
        $healthResponse = Invoke-RestMethod -Uri "$backendUrl/api/health" -Method GET -TimeoutSec 10
        if ($healthResponse -and $healthResponse.status -eq "healthy") {
            Write-Host "✅ Health Check API 정상" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Health Check API 응답 이상" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Health Check API 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. 테스트 결과 요약
Write-Host "`n📋 테스트 결과 요약" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "🧪 DRY RUN 모드로 실행되었습니다." -ForegroundColor Yellow
    Write-Host "실제 변경사항은 적용되지 않았습니다." -ForegroundColor Yellow
} else {
    Write-Host "✅ 모든 테스트가 완료되었습니다." -ForegroundColor Green
}

Write-Host "`n다음 단계:" -ForegroundColor White
Write-Host "1. Supabase SQL Editor에서 fix-supabase-schema.sql 실행" -ForegroundColor White
Write-Host "2. 백엔드 서버에 수정된 코드 배포" -ForegroundColor White
Write-Host "3. 프론트엔드 Netlify 재배포" -ForegroundColor White
Write-Host "4. 통합 테스트 실행" -ForegroundColor White

Write-Host "`n🎄 테스트 완료!" -ForegroundColor Green 