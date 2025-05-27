# Christmas Trading Docker 컨테이너 충돌 해결 스크립트
# 2025-05-26 PM AI Assistant

Write-Host "🎄 Christmas Trading Docker 컨테이너 충돌 해결 시작..." -ForegroundColor Green
Write-Host "📅 실행 시간: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan

# 1. 현재 상황 진단
Write-Host "`n🔍 1단계: 현재 Docker 상태 진단" -ForegroundColor Yellow
Write-Host "=" * 50

# SSH 연결 정보
$serverIP = "31.220.83.213"
$backendPath = "/root/christmas-trading/backend"

Write-Host "📡 백엔드 서버: $serverIP" -ForegroundColor Cyan
Write-Host "📁 작업 경로: $backendPath" -ForegroundColor Cyan

# 2. 원격 서버 Docker 상태 확인
Write-Host "`n🔍 2단계: 원격 서버 Docker 컨테이너 상태 확인" -ForegroundColor Yellow
Write-Host "=" * 50

$dockerCommands = @(
    "# 모든 컨테이너 상태 확인",
    "docker ps -a",
    "",
    "# Christmas 관련 컨테이너 필터링",
    "docker ps -a | grep christmas",
    "",
    "# 실행 중인 컨테이너 확인",
    "docker ps",
    "",
    "# Docker 이미지 확인",
    "docker images | grep christmas"
)

Write-Host "📋 실행할 Docker 진단 명령어들:" -ForegroundColor Cyan
foreach ($cmd in $dockerCommands) {
    if ($cmd -like "#*" -or $cmd -eq "") {
        Write-Host $cmd -ForegroundColor Gray
    } else {
        Write-Host "  $cmd" -ForegroundColor White
    }
}

# 3. 컨테이너 정리 명령어 생성
Write-Host "`n🧹 3단계: 컨테이너 정리 명령어 생성" -ForegroundColor Yellow
Write-Host "=" * 50

$cleanupCommands = @(
    "# 1. 충돌 컨테이너 강제 제거",
    "docker rm -f christmas-backend",
    "",
    "# 2. 모든 Christmas 관련 컨테이너 정리",
    "docker rm -f `$(docker ps -aq --filter `"name=christmas`")",
    "",
    "# 3. 중지된 컨테이너 정리",
    "docker container prune -f",
    "",
    "# 4. 사용하지 않는 이미지 정리",
    "docker image prune -f",
    "",
    "# 5. 네트워크 정리",
    "docker network prune -f",
    "",
    "# 6. 볼륨 확인 (데이터 보존)",
    "docker volume ls | grep christmas"
)

Write-Host "📋 실행할 정리 명령어들:" -ForegroundColor Cyan
foreach ($cmd in $cleanupCommands) {
    if ($cmd -like "#*" -or $cmd -eq "") {
        Write-Host $cmd -ForegroundColor Gray
    } else {
        Write-Host "  $cmd" -ForegroundColor White
    }
}

# 4. 환경변수 검증 명령어
Write-Host "`n🔧 4단계: 환경변수 검증 명령어" -ForegroundColor Yellow
Write-Host "=" * 50

$envCommands = @(
    "# 1. .env 파일 존재 확인",
    "ls -la .env",
    "",
    "# 2. 중요 환경변수 확인 (민감정보 제외)",
    "grep -E '^(NODE_ENV|PORT|SUPABASE_URL)=' .env",
    "",
    "# 3. 누락된 환경변수 확인",
    "echo '=== 확인 필요한 환경변수 ==='",
    "echo 'SUPABASE_SERVICE_KEY (현재: placeholder 값)'",
    "echo 'KIS_API_KEY (docker-compose에서 요구)'",
    "echo 'KIS_API_SECRET (docker-compose에서 요구)'",
    "echo 'OPENAI_API_KEY (docker-compose에서 요구)'"
)

Write-Host "📋 환경변수 검증 명령어들:" -ForegroundColor Cyan
foreach ($cmd in $envCommands) {
    if ($cmd -like "#*" -or $cmd -eq "") {
        Write-Host $cmd -ForegroundColor Gray
    } else {
        Write-Host "  $cmd" -ForegroundColor White
    }
}

# 5. 재시작 명령어
Write-Host "`n🚀 5단계: 안전한 재시작 명령어" -ForegroundColor Yellow
Write-Host "=" * 50

$restartCommands = @(
    "# 1. 현재 디렉토리 확인",
    "pwd",
    "",
    "# 2. docker-compose.yml 파일 확인",
    "ls -la docker-compose.yml",
    "",
    "# 3. 새로운 빌드 및 시작 (강제 재생성)",
    "docker-compose up -d --build --force-recreate",
    "",
    "# 4. 컨테이너 상태 확인",
    "docker ps",
    "",
    "# 5. 로그 확인",
    "docker-compose logs --tail=20"
)

Write-Host "📋 재시작 명령어들:" -ForegroundColor Cyan
foreach ($cmd in $restartCommands) {
    if ($cmd -like "#*" -or $cmd -eq "") {
        Write-Host $cmd -ForegroundColor Gray
    } else {
        Write-Host "  $cmd" -ForegroundColor White
    }
}

# 6. 검증 명령어
Write-Host "`n✅ 6단계: 서비스 검증 명령어" -ForegroundColor Yellow
Write-Host "=" * 50

$verifyCommands = @(
    "# 1. 백엔드 Health Check",
    "curl -f http://localhost:8000/health || echo 'Health check failed'",
    "",
    "# 2. 컨테이너 상태 재확인",
    "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'",
    "",
    "# 3. 백엔드 로그 확인",
    "docker logs christmas-backend --tail=10",
    "",
    "# 4. 외부 접근 테스트",
    "curl -f http://31.220.83.213:8000/health || echo 'External access failed'"
)

Write-Host "📋 검증 명령어들:" -ForegroundColor Cyan
foreach ($cmd in $verifyCommands) {
    if ($cmd -like "#*" -or $cmd -eq "") {
        Write-Host $cmd -ForegroundColor Gray
    } else {
        Write-Host "  $cmd" -ForegroundColor White
    }
}

# 7. 전체 스크립트 생성
Write-Host "`n📝 7단계: 실행 스크립트 파일 생성" -ForegroundColor Yellow
Write-Host "=" * 50

$fullScript = @"
#!/bin/bash
# Christmas Trading Docker 복구 스크립트
# 2025-05-26 PM AI Assistant

echo "🎄 Christmas Trading Docker 복구 시작..."
echo "📅 실행 시간: `$(date)"

# 작업 디렉토리로 이동
cd $backendPath

echo ""
echo "🔍 1단계: 현재 상태 진단"
echo "=" * 50
docker ps -a | grep christmas

echo ""
echo "🧹 2단계: 컨테이너 정리"
echo "=" * 50
docker rm -f christmas-backend
docker rm -f `$(docker ps -aq --filter "name=christmas")
docker container prune -f
docker image prune -f
docker network prune -f

echo ""
echo "🔧 3단계: 환경변수 확인"
echo "=" * 50
ls -la .env
echo "=== 중요: 다음 환경변수들을 수동으로 확인하세요 ==="
echo "SUPABASE_SERVICE_KEY (현재 placeholder 값)"
echo "KIS_API_KEY, KIS_API_SECRET, OPENAI_API_KEY"

echo ""
echo "🚀 4단계: 서비스 재시작"
echo "=" * 50
docker-compose up -d --build --force-recreate

echo ""
echo "⏳ 5초 대기 (서비스 시작 시간)..."
sleep 5

echo ""
echo "✅ 5단계: 서비스 검증"
echo "=" * 50
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
curl -f http://localhost:8000/health || echo "❌ Health check 실패"

echo ""
echo "🎉 Docker 복구 스크립트 완료!"
echo "📊 다음 단계: 환경변수 수정 후 재시작 필요"
"@

# 스크립트 파일 저장
$scriptPath = "scripts/docker-recovery.sh"
$fullScript | Out-File -FilePath $scriptPath -Encoding UTF8
Write-Host "✅ 복구 스크립트 생성 완료: $scriptPath" -ForegroundColor Green

# 8. 사용자 액션 가이드
Write-Host "`n👤 8단계: 사용자 액션 가이드" -ForegroundColor Yellow
Write-Host "=" * 50

Write-Host "🔑 필수 사용자 액션:" -ForegroundColor Red
Write-Host "1. Supabase Dashboard에서 Service Role Key 복사" -ForegroundColor White
Write-Host "   URL: https://supabase.com/dashboard" -ForegroundColor Cyan
Write-Host "   경로: Christmas Trading 프로젝트 → Settings → API" -ForegroundColor Cyan

Write-Host "`n2. 31.220.83.213 서버 SSH 접속 후 환경변수 수정:" -ForegroundColor White
Write-Host "   cd /root/christmas-trading/backend" -ForegroundColor Cyan
Write-Host "   nano .env" -ForegroundColor Cyan
Write-Host "   # SUPABASE_SERVICE_KEY=실제_키_값으로_수정" -ForegroundColor Cyan

Write-Host "`n3. 복구 스크립트 실행:" -ForegroundColor White
Write-Host "   chmod +x scripts/docker-recovery.sh" -ForegroundColor Cyan
Write-Host "   ./scripts/docker-recovery.sh" -ForegroundColor Cyan

Write-Host "`n🎯 예상 소요 시간: 15-20분" -ForegroundColor Green
Write-Host "📞 완료 후 PM에게 결과 보고 요청" -ForegroundColor Yellow

Write-Host "`n✅ Docker 컨테이너 충돌 해결 가이드 완료!" -ForegroundColor Green
Write-Host "📋 다음: 환경변수 수정 → 스크립트 실행 → 검증" -ForegroundColor Cyan 