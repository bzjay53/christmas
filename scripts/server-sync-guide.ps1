# Christmas Trading Server Sync and Recovery Guide
# 2025-05-26 PM AI Assistant

Write-Host "🎄 Christmas Trading Server Sync and Recovery Guide" -ForegroundColor Green
Write-Host "📅 실행 시간: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan

# 1. 현재 상황 분석
Write-Host "`n🔍 1단계: 현재 상황 분석" -ForegroundColor Yellow
Write-Host "=" * 60

Write-Host "📡 백엔드 서버: 31.220.83.213" -ForegroundColor Cyan
Write-Host "📁 서버 작업 경로: /root/christmas-trading" -ForegroundColor Cyan
Write-Host "🐳 문제: Docker 컨테이너 이름 충돌" -ForegroundColor Red
Write-Host "📦 문제: 로컬 스크립트가 서버에 없음" -ForegroundColor Red
Write-Host "⚠️  환경변수: SUPABASE_SERVICE_KEY 플레이스홀더 값" -ForegroundColor Red

# 2. 해결 방안 요약
Write-Host "`n🎯 2단계: 해결 방안 요약" -ForegroundColor Yellow
Write-Host "=" * 60

$solutions = @(
    "1. 서버에서 Git 동기화 (git pull)",
    "2. Docker 복구 스크립트 실행 권한 설정",
    "3. 환경변수 수정 (SUPABASE_SERVICE_KEY)",
    "4. Docker 컨테이너 재시작",
    "5. 서비스 검증 및 테스트"
)

foreach ($solution in $solutions) {
    Write-Host "  ✅ $solution" -ForegroundColor White
}

# 3. 서버 SSH 접속 가이드
Write-Host "`n🔐 3단계: 서버 SSH 접속 가이드" -ForegroundColor Yellow
Write-Host "=" * 60

Write-Host "SSH 접속 명령어:" -ForegroundColor Cyan
Write-Host "ssh root@31.220.83.213" -ForegroundColor White

Write-Host "`n접속 후 작업 디렉토리로 이동:" -ForegroundColor Cyan
Write-Host "cd /root/christmas-trading" -ForegroundColor White

# 4. Git 동기화 단계
Write-Host "`n📦 4단계: Git 동기화 실행" -ForegroundColor Yellow
Write-Host "=" * 60

$gitCommands = @(
    "# 현재 Git 상태 확인",
    "git status",
    "",
    "# 최신 변경사항 가져오기",
    "git pull origin main",
    "",
    "# 스크립트 파일 존재 확인",
    "ls -la scripts/docker-recovery.sh",
    "",
    "# 스크립트 실행 권한 설정",
    "chmod +x scripts/docker-recovery.sh"
)

Write-Host "📋 실행할 Git 명령어들:" -ForegroundColor Cyan
foreach ($cmd in $gitCommands) {
    if ($cmd -like "#*" -or $cmd -eq "") {
        Write-Host $cmd -ForegroundColor Gray
    } else {
        Write-Host "  $cmd" -ForegroundColor White
    }
}

# 5. 환경변수 수정 가이드
Write-Host "`n🔧 5단계: 환경변수 수정 가이드" -ForegroundColor Yellow
Write-Host "=" * 60

Write-Host "🔑 Supabase Service Role Key 확인 필요:" -ForegroundColor Red

Write-Host "`n1️⃣ Supabase Dashboard 접속:" -ForegroundColor White
Write-Host "   - URL: https://supabase.com/dashboard" -ForegroundColor Cyan
Write-Host "   - 프로젝트: Christmas Trading 선택" -ForegroundColor Cyan
Write-Host "   - 메뉴: Settings → API" -ForegroundColor Cyan
Write-Host "   - 복사: Service Role Key (secret 키)" -ForegroundColor Cyan

Write-Host "`n2️⃣ 서버에서 환경변수 파일 수정:" -ForegroundColor White
Write-Host "   - 파일 열기: nano backend/.env" -ForegroundColor Cyan
Write-Host "   - 찾기: SUPABASE_SERVICE_KEY=your-supabase-service-role-key" -ForegroundColor Cyan
Write-Host "   - 수정: SUPABASE_SERVICE_KEY=실제_복사한_키_값" -ForegroundColor Cyan
Write-Host "   - 저장: Ctrl+X → Y → Enter" -ForegroundColor Cyan

# 6. Docker 복구 실행
Write-Host "`n🐳 6단계: Docker 복구 실행" -ForegroundColor Yellow
Write-Host "=" * 60

Write-Host "Docker 복구 스크립트 실행:" -ForegroundColor Cyan
Write-Host "./scripts/docker-recovery.sh" -ForegroundColor White

Write-Host "`n스크립트가 수행하는 작업:" -ForegroundColor Cyan
$dockerTasks = @(
    "• 현재 Docker 상태 진단",
    "• 충돌 컨테이너 강제 제거",
    "• 환경변수 확인",
    "• Docker Compose 재시작 (강제 재생성)",
    "• 서비스 검증 및 Health Check",
    "• 외부 접근 테스트"
)

foreach ($task in $dockerTasks) {
    Write-Host "  $task" -ForegroundColor White
}

# 7. 검증 단계
Write-Host "`n✅ 7단계: 서비스 검증" -ForegroundColor Yellow
Write-Host "=" * 60

$verificationSteps = @(
    "1. Docker 컨테이너 상태 확인: docker ps",
    "2. 백엔드 Health Check: curl http://localhost:8000/health",
    "3. 외부 접근 테스트: curl http://31.220.83.213:8000/health",
    "4. 프론트엔드 연결 테스트: https://christmas-protocol.netlify.app"
)

foreach ($step in $verificationSteps) {
    Write-Host "  📋 $step" -ForegroundColor White
}

# 8. 예상 소요 시간
Write-Host "`n⏰ 8단계: 예상 소요 시간" -ForegroundColor Yellow
Write-Host "=" * 60

Write-Host "  📅 SSH 접속 및 Git 동기화: 5분" -ForegroundColor White
Write-Host "  📅 환경변수 수정: 5분" -ForegroundColor White
Write-Host "  📅 Docker 복구 실행: 10분" -ForegroundColor White
Write-Host "  📅 서비스 검증: 5분" -ForegroundColor White
Write-Host "  📅 총 예상 시간: 25분" -ForegroundColor Green

# 9. 성공 지표
Write-Host "`n🎯 9단계: 성공 지표" -ForegroundColor Yellow
Write-Host "=" * 60

$successCriteria = @(
    "✅ Git pull 성공 및 스크립트 파일 존재",
    "✅ Docker 컨테이너 정상 실행",
    "✅ 백엔드 Health Check 응답 성공",
    "✅ 프론트엔드 '백엔드 연결됨' 상태",
    "✅ 환경변수 올바른 설정 완료"
)

foreach ($criteria in $successCriteria) {
    Write-Host "  $criteria" -ForegroundColor Green
}

# 10. 문제 해결 가이드
Write-Host "`n🔧 10단계: 문제 해결 가이드" -ForegroundColor Yellow
Write-Host "=" * 60

Write-Host "만약 문제가 발생하면:" -ForegroundColor Red

$troubleshooting = @{
    "Git pull 실패" = "git reset --hard HEAD; git pull origin main"
    "스크립트 권한 오류" = "chmod +x scripts/*.sh; chmod +x scripts/*.ps1"
    "Docker 컨테이너 시작 실패" = "docker-compose down; docker system prune -f; docker-compose up -d --build"
    "환경변수 읽기 실패" = "cat backend/.env | grep SUPABASE_SERVICE_KEY"
    "포트 충돌" = "netstat -tulpn | grep :8000; kill -9 <PID>"
}

foreach ($problem in $troubleshooting.GetEnumerator()) {
    Write-Host "  🔸 $($problem.Key):" -ForegroundColor Yellow
    Write-Host "    $($problem.Value)" -ForegroundColor Cyan
}

# 11. 완료 메시지
Write-Host "`n🎉 서버 동기화 및 복구 가이드 완료!" -ForegroundColor Green
Write-Host "📋 다음: SSH 접속 → Git 동기화 → 환경변수 수정 → Docker 복구 → 검증" -ForegroundColor Cyan
Write-Host "📞 완료 후 PM에게 결과 보고해주세요." -ForegroundColor Yellow

Write-Host "`n🚀 지금 바로 시작하세요!" -ForegroundColor Magenta
Write-Host "ssh root@31.220.83.213" -ForegroundColor White 