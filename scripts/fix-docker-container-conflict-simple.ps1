# Christmas Trading Docker 컨테이너 충돌 해결 가이드
# 2025-05-26 PM AI Assistant

Write-Host "🎄 Christmas Trading Docker 컨테이너 충돌 해결 가이드" -ForegroundColor Green
Write-Host "📅 실행 시간: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan

# 1. 현재 상황 분석
Write-Host "`n🔍 1단계: 현재 상황 분석" -ForegroundColor Yellow
Write-Host "=" * 50

Write-Host "📡 백엔드 서버: 31.220.83.213" -ForegroundColor Cyan
Write-Host "📁 작업 경로: /root/christmas-trading/backend" -ForegroundColor Cyan
Write-Host "🐳 문제: Docker 컨테이너 이름 충돌" -ForegroundColor Red
Write-Host "⚠️  환경변수: SUPABASE_SERVICE_KEY 플레이스홀더 값" -ForegroundColor Red

# 2. 해결 방안 요약
Write-Host "`n🎯 2단계: 해결 방안 요약" -ForegroundColor Yellow
Write-Host "=" * 50

$solutions = @(
    "1. 충돌 컨테이너 강제 제거",
    "2. 환경변수 수정 (SUPABASE_SERVICE_KEY)",
    "3. Docker 서비스 재시작",
    "4. 서비스 검증 및 테스트"
)

foreach ($solution in $solutions) {
    Write-Host "  ✅ $solution" -ForegroundColor White
}

# 3. 사용자 액션 가이드
Write-Host "`n👤 3단계: 사용자 액션 가이드" -ForegroundColor Yellow
Write-Host "=" * 50

Write-Host "🔑 필수 사용자 액션:" -ForegroundColor Red

Write-Host "`n1️⃣ Supabase Service Role Key 확인:" -ForegroundColor White
Write-Host "   - URL: https://supabase.com/dashboard" -ForegroundColor Cyan
Write-Host "   - 경로: Christmas Trading 프로젝트 → Settings → API" -ForegroundColor Cyan
Write-Host "   - 복사: Service Role Key (secret 키)" -ForegroundColor Cyan

Write-Host "`n2️⃣ 31.220.83.213 서버 SSH 접속:" -ForegroundColor White
Write-Host "   - 접속: ssh root@31.220.83.213" -ForegroundColor Cyan
Write-Host "   - 이동: cd /root/christmas-trading/backend" -ForegroundColor Cyan
Write-Host "   - 수정: nano .env" -ForegroundColor Cyan
Write-Host "   - 변경: SUPABASE_SERVICE_KEY=실제_키_값" -ForegroundColor Cyan

Write-Host "`n3️⃣ Docker 복구 스크립트 실행:" -ForegroundColor White
Write-Host "   - 권한: chmod +x scripts/docker-recovery.sh" -ForegroundColor Cyan
Write-Host "   - 실행: ./scripts/docker-recovery.sh" -ForegroundColor Cyan

# 4. 스크립트 파일 확인
Write-Host "`n📝 4단계: 생성된 스크립트 파일 확인" -ForegroundColor Yellow
Write-Host "=" * 50

$scriptPath = "scripts/docker-recovery.sh"
if (Test-Path $scriptPath) {
    Write-Host "✅ Docker 복구 스크립트 생성 완료: $scriptPath" -ForegroundColor Green
    $fileSize = (Get-Item $scriptPath).Length
    Write-Host "📊 파일 크기: $fileSize bytes" -ForegroundColor Cyan
} else {
    Write-Host "❌ Docker 복구 스크립트 파일이 없습니다." -ForegroundColor Red
}

# 5. 예상 소요 시간
Write-Host "`n⏰ 5단계: 예상 소요 시간" -ForegroundColor Yellow
Write-Host "=" * 50

$timeEstimates = @{
    "Supabase 키 확인" = "5분"
    "환경변수 수정" = "5분"
    "Docker 복구 실행" = "10분"
    "서비스 검증" = "5분"
    "총 예상 시간" = "25분"
}

foreach ($task in $timeEstimates.GetEnumerator()) {
    Write-Host "  📅 $($task.Key): $($task.Value)" -ForegroundColor White
}

# 6. 성공 지표
Write-Host "`n✅ 6단계: 성공 지표" -ForegroundColor Yellow
Write-Host "=" * 50

$successCriteria = @(
    "Docker 컨테이너 정상 실행",
    "백엔드 Health Check 응답 성공",
    "프론트엔드 '백엔드 연결됨' 상태",
    "환경변수 올바른 설정 완료"
)

foreach ($criteria in $successCriteria) {
    Write-Host "  🎯 $criteria" -ForegroundColor Green
}

# 7. 다음 단계 예고
Write-Host "`n📞 7단계: 다음 단계 예고" -ForegroundColor Yellow
Write-Host "=" * 50

Write-Host "🔄 Phase 3: 데이터베이스 스키마 수정" -ForegroundColor Cyan
Write-Host "  - Supabase SQL 실행: fix-supabase-schema.sql" -ForegroundColor White
Write-Host "  - strategy_type 컬럼 추가" -ForegroundColor White
Write-Host "  - 전체 시스템 테스트" -ForegroundColor White

Write-Host "`n🔄 Phase 4: 비즈니스 로직 복원" -ForegroundColor Cyan
Write-Host "  - 쿠폰 시스템 복원" -ForegroundColor White
Write-Host "  - 리퍼럴 시스템 복원" -ForegroundColor White
Write-Host "  - 회원 등급 시스템 복원" -ForegroundColor White

# 8. 완료 메시지
Write-Host "`n🎉 Docker 컨테이너 충돌 해결 가이드 완료!" -ForegroundColor Green
Write-Host "📋 다음: 사용자 액션 → 스크립트 실행 → 검증 → PM 보고" -ForegroundColor Cyan
Write-Host "📞 문의사항이 있으면 PM에게 연락하세요." -ForegroundColor Yellow 