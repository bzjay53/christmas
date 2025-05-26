# Christmas Trading 로그인 테스트 스크립트
# PowerShell 환경에서 실행

Write-Host "🎄 Christmas Trading 로그인 테스트 시작" -ForegroundColor Green
Write-Host "서버: http://31.220.83.213" -ForegroundColor Cyan
Write-Host "시간: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

# 테스트 계정 정보
$testAccounts = @(
    @{
        name = "관리자 계정 (사용자 지정)"
        email = "lvninety9@gmail.com"
        password = "admin123"
        expected = "lifetime"
    },
    @{
        name = "관리자 계정 (기본)"
        email = "admin@christmas.com"
        password = "admin123"
        expected = "lifetime"
    },
    @{
        name = "일반 사용자 계정"
        email = "user@christmas.com"
        password = "password"
        expected = "premium"
    }
)

$baseUrl = "http://31.220.83.213"
$successCount = 0
$totalTests = $testAccounts.Count

foreach ($account in $testAccounts) {
    Write-Host "📧 테스트: $($account.name)" -ForegroundColor Yellow
    Write-Host "   이메일: $($account.email)" -ForegroundColor Gray
    
    try {
        # 로그인 요청 데이터
        $loginData = @{
            email = $account.email
            password = $account.password
        } | ConvertTo-Json
        
        # 로그인 API 호출
        $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
        
        if ($response.token) {
            Write-Host "   ✅ 로그인 성공" -ForegroundColor Green
            Write-Host "   🔑 토큰: $($response.token.Substring(0, 20))..." -ForegroundColor Gray
            Write-Host "   👤 사용자: $($response.user.first_name) $($response.user.last_name)" -ForegroundColor Gray
            Write-Host "   💎 등급: $($response.user.membership_type)" -ForegroundColor Gray
            
            # 토큰으로 사용자 정보 조회 테스트
            $headers = @{
                "Authorization" = "Bearer $($response.token)"
                "Content-Type" = "application/json"
            }
            
            $userInfo = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method GET -Headers $headers
            
            if ($userInfo.user) {
                Write-Host "   ✅ 사용자 정보 조회 성공" -ForegroundColor Green
                Write-Host "   📧 이메일: $($userInfo.user.email)" -ForegroundColor Gray
                Write-Host "   🆔 ID: $($userInfo.user.id)" -ForegroundColor Gray
                $successCount++
            } else {
                Write-Host "   ❌ 사용자 정보 조회 실패" -ForegroundColor Red
            }
        } else {
            Write-Host "   ❌ 로그인 실패: 토큰 없음" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "   ❌ 오류 발생: $($_.Exception.Message)" -ForegroundColor Red
        
        # 상세 오류 정보
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode
            Write-Host "   📊 상태 코드: $statusCode" -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

# 테스트 결과 요약
Write-Host "📊 테스트 결과 요약" -ForegroundColor Cyan
Write-Host "성공: $successCount / $totalTests" -ForegroundColor $(if ($successCount -eq $totalTests) { "Green" } else { "Yellow" })

if ($successCount -eq $totalTests) {
    Write-Host "🎉 모든 로그인 테스트 성공!" -ForegroundColor Green
    Write-Host "✅ Supabase 인증 시스템 정상 작동" -ForegroundColor Green
} else {
    Write-Host "⚠️  일부 테스트 실패" -ForegroundColor Yellow
    Write-Host "🔍 Supabase 테이블 설정을 확인해주세요" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔗 다음 단계:" -ForegroundColor Cyan
Write-Host "1. 프론트엔드 연동 테스트" -ForegroundColor Gray
Write-Host "2. 비즈니스 로직 복원" -ForegroundColor Gray
Write-Host "3. 전체 시스템 통합 테스트" -ForegroundColor Gray 