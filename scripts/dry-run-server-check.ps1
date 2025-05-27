# 🧪 Christmas Trading 서버 복구 Dry Run 테스트
# 실제 복구 작업 전 환경 검증 스크립트

Write-Host "🧪 Christmas Trading 서버 복구 Dry Run 테스트 시작" -ForegroundColor Cyan
Write-Host "=" * 60

# 1. 로컬 환경 검증
Write-Host "`n📋 1단계: 로컬 환경 검증" -ForegroundColor Yellow

# 현재 디렉토리 확인
$currentDir = Get-Location
Write-Host "현재 디렉토리: $currentDir"

# 필수 파일 존재 확인
$requiredFiles = @(
    "backend/env.txt",
    "backend/package.json",
    "backend/server.js",
    "docker-compose.yml",
    "scripts/fix-strategy-type-column.sql"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file 존재" -ForegroundColor Green
    } else {
        Write-Host "❌ $file 누락" -ForegroundColor Red
    }
}

# 2. 환경변수 검증
Write-Host "`n📋 2단계: 환경변수 검증" -ForegroundColor Yellow

# env.txt 파일 읽기
if (Test-Path "backend/env.txt") {
    $envContent = Get-Content "backend/env.txt"
    
    # 중요 환경변수 확인
    $criticalVars = @(
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY", 
        "SUPABASE_SERVICE_KEY",
        "PORT",
        "JWT_SECRET"
    )
    
    foreach ($var in $criticalVars) {
        $found = $envContent | Where-Object { $_ -like "$var=*" }
        if ($found) {
            $value = ($found -split "=", 2)[1]
            if ($value -like "*your-*" -or $value -like "*placeholder*") {
                Write-Host "⚠️  $var: 플레이스홀더 값 발견" -ForegroundColor Yellow
            } else {
                Write-Host "✅ $var: 설정됨" -ForegroundColor Green
            }
        } else {
            Write-Host "❌ $var: 누락" -ForegroundColor Red
        }
    }
}

# 3. 네트워크 연결 테스트
Write-Host "`n📋 3단계: 네트워크 연결 테스트" -ForegroundColor Yellow

# 백엔드 서버 연결 테스트
Write-Host "백엔드 서버 연결 테스트 중..."
try {
    $response = Invoke-WebRequest -Uri "http://31.220.83.213:8000/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ 백엔드 서버 응답: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ 백엔드 서버 무응답: $($_.Exception.Message)" -ForegroundColor Red
}

# Supabase 연결 테스트
Write-Host "Supabase 연결 테스트 중..."
try {
    $supabaseUrl = "https://qehzzsxzjijfzqkysazc.supabase.co"
    $response = Invoke-WebRequest -Uri "$supabaseUrl/rest/v1/" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Supabase 연결 성공: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase 연결 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Git 상태 확인
Write-Host "`n📋 4단계: Git 상태 확인" -ForegroundColor Yellow

try {
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "⚠️  커밋되지 않은 변경사항 존재:" -ForegroundColor Yellow
        $gitStatus | ForEach-Object { Write-Host "   $_" }
    } else {
        Write-Host "✅ Git 상태 깨끗함" -ForegroundColor Green
    }
    
    $currentBranch = git branch --show-current
    Write-Host "현재 브랜치: $currentBranch"
    
    $lastCommit = git log -1 --oneline
    Write-Host "마지막 커밋: $lastCommit"
} catch {
    Write-Host "❌ Git 상태 확인 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. 복구 계획 요약
Write-Host "`n📋 5단계: 복구 계획 요약" -ForegroundColor Yellow

Write-Host @"
🎯 복구 작업 계획:

1. 긴급 수정 사항:
   - SUPABASE_SERVICE_KEY 실제 값으로 교체 필요
   - 백엔드 서버 Docker 컨테이너 재시작
   - 데이터베이스 strategy_type 컬럼 추가

2. 예상 작업 시간:
   - 서버 복구: 30분
   - 데이터베이스 수정: 20분
   - 프론트엔드 환경변수 수정: 30분
   - 테스트 및 검증: 40분

3. 성공 기준:
   - 백엔드 서버 200 OK 응답
   - 프론트엔드 로그인 성공
   - 대시보드 데이터 로딩
   - API 연결 안정성 확인
"@

Write-Host "`n🧪 Dry Run 테스트 완료!" -ForegroundColor Cyan
Write-Host "실제 복구 작업을 진행하시겠습니까? (Y/N)" -ForegroundColor Yellow

# 사용자 입력 대기 (스크립트 실행 시)
# $userInput = Read-Host
# if ($userInput -eq "Y" -or $userInput -eq "y") {
#     Write-Host "✅ 실제 복구 작업을 시작합니다..." -ForegroundColor Green
# } else {
#     Write-Host "❌ 복구 작업이 취소되었습니다." -ForegroundColor Red
# } 