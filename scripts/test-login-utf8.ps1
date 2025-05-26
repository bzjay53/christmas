# UTF-8 인코딩 설정
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Christmas Trading 로그인 테스트 스크립트
Write-Host "🎄 Christmas Trading 로그인 테스트 시작" -ForegroundColor Green
Write-Host "서버: http://31.220.83.213" -ForegroundColor Cyan
Write-Host "시간: $(Get-Date -Format 'MM/dd/yyyy HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# 테스트 계정 정보
$testAccounts = @(
    @{
        name = "관리자 계정 (사용자 지정)"
        email = "lvninety9@gmail.com"
        password = "password123"
    },
    @{
        name = "관리자 계정 (기본)"
        email = "admin@christmas.com"
        password = "password123"
    },
    @{
        name = "일반 사용자 계정"
        email = "user@christmas.com"
        password = "password"
    }
)

$successCount = 0
$totalTests = $testAccounts.Count

foreach ($account in $testAccounts) {
    Write-Host "🔐 테스트: $($account.name)" -ForegroundColor Yellow
    Write-Host "   이메일: $($account.email)" -ForegroundColor White
    
    try {
        # 로그인 요청 데이터
        $loginData = @{
            email = $account.email
            password = $account.password
        } | ConvertTo-Json -Depth 2
        
        # API 요청
        $response = Invoke-RestMethod -Uri "http://31.220.83.213/api/auth/login" `
                                    -Method POST `
                                    -ContentType "application/json" `
                                    -Body $loginData `
                                    -TimeoutSec 30
        
        if ($response.token) {
            Write-Host "   ✅ 로그인 성공!" -ForegroundColor Green
            Write-Host "   📋 사용자 정보: $($response.user.firstName) $($response.user.lastName)" -ForegroundColor Cyan
            Write-Host "   🎫 토큰: $($response.token.Substring(0, 20))..." -ForegroundColor Gray
            Write-Host "   👑 회원등급: $($response.user.membershipType)" -ForegroundColor Magenta
            $successCount++
        } else {
            Write-Host "   ❌ 로그인 실패: 토큰이 반환되지 않음" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "   ❌ 오류 발생: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   📊 상태 코드: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

# 결과 요약
Write-Host "📊 테스트 결과 요약" -ForegroundColor Cyan
Write-Host "성공: $successCount / $totalTests" -ForegroundColor $(if ($successCount -eq $totalTests) { "Green" } else { "Yellow" })

if ($successCount -eq 0) {
    Write-Host "❌ 모든 테스트가 실패" -ForegroundColor Red
    Write-Host "🔍 Supabase 테이블 설정을 확인해주세요" -ForegroundColor Yellow
} elseif ($successCount -eq $totalTests) {
    Write-Host "🎉 모든 테스트가 성공!" -ForegroundColor Green
    Write-Host "✅ 로그인 시스템이 정상 작동합니다" -ForegroundColor Green
} else {
    Write-Host "⚠️ 일부 테스트가 실패" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔄 다음 단계:" -ForegroundColor Cyan
Write-Host "1. 프론트엔드 연동 테스트" -ForegroundColor Gray
Write-Host "2. 비즈니스 로직 복원" -ForegroundColor Gray
Write-Host "3. 전체 시스템 통합 테스트" -ForegroundColor Gray 