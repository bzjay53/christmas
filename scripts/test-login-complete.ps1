# Christmas Trading 로그인 테스트 스크립트
# PowerShell 스크립트

Write-Host "🎄 Christmas Trading 로그인 테스트 시작..." -ForegroundColor Green

# 테스트 설정
$baseUrl = "http://31.220.83.213"
$frontendUrl = "https://christmas-protocol.netlify.app"

# 테스트 계정
$testAccounts = @(
    @{
        email = "admin@christmas.com"
        password = "admin123"
        name = "Admin Account"
    },
    @{
        email = "user@christmas.com"
        password = "user123"
        name = "User Account"
    },
    @{
        email = "lvninety9@gmail.com"
        password = "test123"
        name = "Developer Account"
    }
)

# 1. 서버 상태 확인 (Dry Run)
Write-Host "📋 Dry Run: 서버 상태 확인..." -ForegroundColor Yellow

function Test-ServerStatus {
    Write-Host "🏥 백엔드 서버 헬스 체크..." -ForegroundColor Cyan
    
    try {
        $healthResponse = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -TimeoutSec 10
        Write-Host "✅ 백엔드 서버 정상: $($healthResponse.status)" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ 백엔드 서버 연결 실패: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-ApiEndpoints {
    Write-Host "🔍 API 엔드포인트 확인..." -ForegroundColor Cyan
    
    $endpoints = @(
        "/",
        "/health",
        "/api/auth/login"
    )
    
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-WebRequest -Uri "$baseUrl$endpoint" -Method GET -TimeoutSec 5
            Write-Host "✅ $endpoint : $($response.StatusCode)" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ $endpoint : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

function Test-Login {
    param(
        [string]$email,
        [string]$password,
        [string]$accountName
    )
    
    Write-Host "🔐 로그인 테스트: $accountName ($email)" -ForegroundColor Cyan
    
    $loginData = @{
        email = $email
        password = $password
    } | ConvertTo-Json
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
            "Accept" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginData -Headers $headers -TimeoutSec 10
        
        if ($response.token) {
            Write-Host "✅ 로그인 성공: $accountName" -ForegroundColor Green
            Write-Host "   토큰: $($response.token.Substring(0, 20))..." -ForegroundColor Gray
            Write-Host "   사용자: $($response.user.email)" -ForegroundColor Gray
            return $response.token
        } else {
            Write-Host "❌ 로그인 실패: 토큰이 없습니다" -ForegroundColor Red
            return $null
        }
    }
    catch {
        Write-Host "❌ 로그인 실패: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode
            Write-Host "   상태 코드: $statusCode" -ForegroundColor Red
        }
        return $null
    }
}

function Test-AuthenticatedRequest {
    param(
        [string]$token,
        [string]$accountName
    )
    
    Write-Host "🔒 인증된 요청 테스트: $accountName" -ForegroundColor Cyan
    
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/users/profile" -Method GET -Headers $headers -TimeoutSec 10
        Write-Host "✅ 인증된 요청 성공: $accountName" -ForegroundColor Green
        Write-Host "   사용자 ID: $($response.user.id)" -ForegroundColor Gray
        return $true
    }
    catch {
        Write-Host "❌ 인증된 요청 실패: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-FrontendConnection {
    Write-Host "🌐 프론트엔드 연결 테스트..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri $frontendUrl -Method GET -TimeoutSec 10
        Write-Host "✅ 프론트엔드 정상: $($response.StatusCode)" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ 프론트엔드 연결 실패: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Dry Run 실행
Write-Host "`n📋 === DRY RUN 시작 ===" -ForegroundColor Yellow

$serverOk = Test-ServerStatus
if (-not $serverOk) {
    Write-Host "❌ 서버가 응답하지 않습니다. 배포를 먼저 완료해주세요." -ForegroundColor Red
    exit 1
}

Test-ApiEndpoints
Test-FrontendConnection

Write-Host "`n📋 === DRY RUN 완료 ===" -ForegroundColor Yellow

# 실제 테스트 실행 여부 확인
$confirm = Read-Host "`nDry Run 결과를 확인했습니다. 실제 로그인 테스트를 진행하시겠습니까? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ 테스트가 취소되었습니다." -ForegroundColor Red
    exit 0
}

# 실제 로그인 테스트 실행
Write-Host "`n🚀 === 실제 로그인 테스트 시작 ===" -ForegroundColor Green

$successCount = 0
$totalCount = $testAccounts.Count

foreach ($account in $testAccounts) {
    Write-Host "`n" + "="*50 -ForegroundColor Gray
    
    $token = Test-Login -email $account.email -password $account.password -accountName $account.name
    
    if ($token) {
        $authOk = Test-AuthenticatedRequest -token $token -accountName $account.name
        if ($authOk) {
            $successCount++
        }
    }
    
    Start-Sleep -Seconds 2
}

# 결과 요약
Write-Host "`n" + "="*50 -ForegroundColor Gray
Write-Host "📊 테스트 결과 요약" -ForegroundColor Green
Write-Host "성공: $successCount / $totalCount" -ForegroundColor $(if ($successCount -eq $totalCount) { "Green" } else { "Yellow" })

if ($successCount -eq $totalCount) {
    Write-Host "🎉 모든 로그인 테스트 성공!" -ForegroundColor Green
    Write-Host "✅ Christmas Trading 시스템이 정상적으로 작동합니다." -ForegroundColor Green
} elseif ($successCount -gt 0) {
    Write-Host "⚠️ 일부 계정에서 문제가 발생했습니다." -ForegroundColor Yellow
    Write-Host "🔧 Supabase 테이블 생성이 필요할 수 있습니다." -ForegroundColor Yellow
} else {
    Write-Host "❌ 모든 로그인 테스트 실패!" -ForegroundColor Red
    Write-Host "🔧 백엔드 설정 및 Supabase 연결을 확인해주세요." -ForegroundColor Red
}

Write-Host "`n🎄 Christmas Trading 로그인 테스트 완료!" -ForegroundColor Green 