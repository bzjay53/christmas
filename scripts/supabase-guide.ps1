# Christmas Trading Supabase 테이블 생성 가이드
# 2025-05-26

Write-Host "=== 🎯 Step 1: Supabase 테이블 생성 가이드 ===" -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 현재 상황:" -ForegroundColor Cyan
Write-Host "- 백엔드 서버: 31.220.83.213:8000 응답 없음 (타임아웃)" -ForegroundColor Red
Write-Host "- 원인 추정: Supabase 테이블 미생성으로 인한 API 오류" -ForegroundColor Red
Write-Host "- 해결 방법: Supabase 대시보드에서 테이블 생성 후 서버 재시작" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Supabase 테이블 생성 절차:" -ForegroundColor Yellow
Write-Host "1. https://supabase.com/dashboard 접속" -ForegroundColor White
Write-Host "2. Christmas Trading 프로젝트 선택" -ForegroundColor White
Write-Host "3. 좌측 메뉴에서 'SQL Editor' 클릭" -ForegroundColor White
Write-Host "4. scripts/create-supabase-tables.sql 파일 내용 복사하여 실행" -ForegroundColor White
Write-Host ""

Write-Host "📁 실행할 SQL 스크립트 파일:" -ForegroundColor Cyan
if (Test-Path "scripts/create-supabase-tables.sql") {
    Write-Host "✅ scripts/create-supabase-tables.sql 파일 존재" -ForegroundColor Green
    $fileSize = (Get-Item "scripts/create-supabase-tables.sql").Length
    Write-Host "📊 파일 크기: $fileSize bytes" -ForegroundColor White
} else {
    Write-Host "❌ scripts/create-supabase-tables.sql 파일 없음" -ForegroundColor Red
}
Write-Host ""

Write-Host "📋 생성될 테이블 목록:" -ForegroundColor Cyan
Write-Host "1. users - 사용자 정보 및 인증" -ForegroundColor White
Write-Host "2. coupons - 쿠폰 시스템" -ForegroundColor White
Write-Host "3. coupon_usage - 쿠폰 사용 내역" -ForegroundColor White
Write-Host "4. referral_codes - 리퍼럴 코드" -ForegroundColor White
Write-Host "5. referral_rewards - 리퍼럴 보상" -ForegroundColor White
Write-Host "6. trading_orders - 거래 주문" -ForegroundColor White
Write-Host "7. user_sessions - 사용자 세션" -ForegroundColor White
Write-Host ""

Write-Host "⚠️ 주의사항:" -ForegroundColor Yellow
Write-Host "- 순서 중요: 외래키 관계로 인해 테이블 생성 순서를 지켜야 함" -ForegroundColor Red
Write-Host "- 권한 확인: Supabase 프로젝트의 소유자 권한 필요" -ForegroundColor Red
Write-Host "- 백업: 기존 데이터가 있다면 백업 후 진행" -ForegroundColor Red
Write-Host ""

Write-Host "🔄 다음 단계:" -ForegroundColor Green
Write-Host "테이블 생성 완료 후:" -ForegroundColor White
Write-Host "1. 31.220.83.213 서버 Docker 컨테이너 재시작" -ForegroundColor White
Write-Host "2. Health Check API 테스트" -ForegroundColor White
Write-Host "3. Signup API 테스트" -ForegroundColor White
Write-Host "4. 전체 시스템 검증" -ForegroundColor White
Write-Host ""

Write-Host "📞 완료 후 알려주세요:" -ForegroundColor Cyan
Write-Host "테이블 생성이 완료되면 'y'를 입력하여 다음 단계로 진행합니다." -ForegroundColor White 