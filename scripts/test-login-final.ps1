# Christmas Trading 로그인 테스트 스크립트 (최종)
# 2025-05-26

Write-Host "=== Christmas Trading 로그인 테스트 시작 ===" -ForegroundColor Green

# 1. 서버 상태 확인
Write-Host "1. 서버 상태 확인 중..." -ForegroundColor Yellow
$healthResponse = ssh root@31.220.83.213 "curl -s -o /dev/null -w '%{http_code}' http://localhost/api/health"
Write-Host "Health Check Response: $healthResponse" -ForegroundColor Cyan

if ($healthResponse -eq "200") {
    Write-Host "✅ 백엔드 서버 정상 작동" -ForegroundColor Green
} else {
    Write-Host "❌ 백엔드 서버 응답 없음" -ForegroundColor Red
    exit 1
}

# 2. 회원가입 테스트
Write-Host "2. 회원가입 테스트 중..." -ForegroundColor Yellow
$signupData = @{
    email = "lvninety9@gmail.com"
    password = "test123456"
    username = "testuser"
} | ConvertTo-Json

$signupResponse = ssh root@31.220.83.213 "curl -s -X POST -H 'Content-Type: application/json' -d '$signupData' http://localhost/api/auth/signup"
Write-Host "Signup Response: $signupResponse" -ForegroundColor Cyan

# 3. 로그인 테스트
Write-Host "3. 로그인 테스트 중..." -ForegroundColor Yellow
$loginData = @{
    email = "lvninety9@gmail.com"
    password = "test123456"
} | ConvertTo-Json

$loginResponse = ssh root@31.220.83.213 "curl -s -X POST -H 'Content-Type: application/json' -d '$loginData' http://localhost/api/auth/login"
Write-Host "Login Response: $loginResponse" -ForegroundColor Cyan

# 4. 프론트엔드에서 백엔드 연결 테스트
Write-Host "4. 프론트엔드에서 백엔드 연결 테스트 중..." -ForegroundColor Yellow
$frontendTest = Invoke-RestMethod -Uri "https://christmas-protocol.netlify.app/" -Method Get -ErrorAction SilentlyContinue
if ($frontendTest) {
    Write-Host "✅ 프론트엔드 정상 작동" -ForegroundColor Green
} else {
    Write-Host "❌ 프론트엔드 연결 실패" -ForegroundColor Red
}

# 5. 전체 시스템 상태 요약
Write-Host "5. 전체 시스템 상태 요약..." -ForegroundColor Yellow
ssh root@31.220.83.213 "echo '=== Docker 컨테이너 상태 ===' ; docker ps | grep christmas ; echo '=== nginx 로그 (최근 5줄) ===' ; docker logs christmas-nginx --tail 5 ; echo '=== 백엔드 로그 (최근 5줄) ===' ; docker logs christmas-backend-production --tail 5"

Write-Host "=== 로그인 테스트 완료 ===" -ForegroundColor Green
Write-Host "프론트엔드: https://christmas-protocol.netlify.app/" -ForegroundColor Cyan
Write-Host "백엔드: http://31.220.83.213/api/" -ForegroundColor Cyan 