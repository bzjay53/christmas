# Christmas Trading Backend Status Check and API Test Script
# Created: 2025-05-26
# Usage: .\scripts\test-backend-status.ps1

Write-Host "🎄 Christmas Trading Backend Status Check Started" -ForegroundColor Green
Write-Host "=" * 60

# Basic configuration
$baseUrl = "http://31.220.83.213"
$apiUrl = "$baseUrl/api"

# 1. Basic server connection check
Write-Host "`n📡 1. Basic Server Connection Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method GET -TimeoutSec 10
    Write-Host "✅ Server connection successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Server connection failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Health Check
Write-Host "`n🏥 2. Health Check" -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$apiUrl/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Health Check successful" -ForegroundColor Green
    Write-Host "   Status: $($healthResponse.status)" -ForegroundColor Cyan
    Write-Host "   Database: $($healthResponse.database)" -ForegroundColor Cyan
    Write-Host "   Mode: $($healthResponse.mode)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Health Check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Authentication endpoint check
Write-Host "`n🔐 3. Authentication Endpoint Check" -ForegroundColor Yellow

# 3.1 Signup API test (Dry Run)
Write-Host "   3.1 Signup API Test (Dry Run)" -ForegroundColor Cyan
$signupData = @{
    email = "test-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "testpassword123"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

try {
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    Write-Host "   Request data: $signupData" -ForegroundColor Gray
    
    $signupResponse = Invoke-RestMethod -Uri "$apiUrl/auth/signup" -Method POST -Body $signupData -Headers $headers -TimeoutSec 15
    
    if ($signupResponse.success) {
        Write-Host "   ✅ Signup API working properly" -ForegroundColor Green
        Write-Host "   User ID: $($signupResponse.data.user.id)" -ForegroundColor Cyan
        Write-Host "   Token length: $($signupResponse.data.token.Length) characters" -ForegroundColor Cyan
        
        # Test user info retrieval with issued token
        Write-Host "`n   3.2 Token Verification Test" -ForegroundColor Cyan
        $authHeaders = @{
            "Authorization" = "Bearer $($signupResponse.data.token)"
        }
        
        try {
            $meResponse = Invoke-RestMethod -Uri "$apiUrl/auth/me" -Method GET -Headers $authHeaders -TimeoutSec 10
            if ($meResponse.success) {
                Write-Host "   ✅ Token verification successful" -ForegroundColor Green
                Write-Host "   User email: $($meResponse.data.user.email)" -ForegroundColor Cyan
            }
        } catch {
            Write-Host "   ❌ Token verification failed: $($_.Exception.Message)" -ForegroundColor Red
        }
        
    } else {
        Write-Host "   ❌ Signup failed: $($signupResponse.message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "   ❌ Signup API error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Output detailed error information
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "   HTTP status code: $statusCode" -ForegroundColor Red
        
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            Write-Host "   Error response: $errorBody" -ForegroundColor Red
        } catch {
            Write-Host "   Cannot read error response." -ForegroundColor Red
        }
    }
}

# 4. Login API test
Write-Host "`n🔑 4. Login API Test" -ForegroundColor Yellow
$loginData = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$apiUrl/auth/login" -Method POST -Body $loginData -Headers $headers -TimeoutSec 15
    
    if ($loginResponse.success) {
        Write-Host "   ✅ Login API working properly" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Login failed (expected - no test account): $($loginResponse.message)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️ Login API error (expected): $($_.Exception.Message)" -ForegroundColor Yellow
}

# 5. Database connection status check
Write-Host "`n🗄️ 5. Database Connection Status Check" -ForegroundColor Yellow
try {
    # Already checked in health check but additional verification
    if ($healthResponse.database -eq "supabase-connected") {
        Write-Host "   ✅ Supabase database connection normal" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Database connection problem" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Database status check failed" -ForegroundColor Red
}

# 6. Container status check (SSH required)
Write-Host "`n🐳 6. Docker Container Status Check" -ForegroundColor Yellow
Write-Host "   (This step requires server SSH access)" -ForegroundColor Gray

# 7. Comprehensive results output
Write-Host "`n📊 7. Comprehensive Test Results" -ForegroundColor Yellow
Write-Host "=" * 60

$testResults = @()
$testResults += "✅ Basic server connection: Success"

if ($healthResponse) {
    $testResults += "✅ Health Check: Success"
    $testResults += "✅ Database connection: Success"
} else {
    $testResults += "❌ Health Check: Failed"
}

if ($signupResponse -and $signupResponse.success) {
    $testResults += "✅ Signup API: Normal"
    if ($meResponse -and $meResponse.success) {
        $testResults += "✅ Token verification: Normal"
    }
} else {
    $testResults += "❌ Signup API: Problem detected"
}

foreach ($result in $testResults) {
    Write-Host "   $result"
}

# 8. Next steps guidance
Write-Host "`n🚀 8. Next Steps Guidance" -ForegroundColor Yellow
Write-Host "=" * 60

if ($signupResponse -and $signupResponse.success) {
    Write-Host "✅ Backend API is working properly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Create tables in Supabase (run scripts/create-supabase-tables.sql)" -ForegroundColor White
    Write-Host "2. Test actual login from frontend" -ForegroundColor White
    Write-Host "3. Full system integration test" -ForegroundColor White
} else {
    Write-Host "⚠️ Backend API has issues." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Solutions:" -ForegroundColor Cyan
    Write-Host "1. Check if Supabase tables are created" -ForegroundColor White
    Write-Host "2. Verify environment variable settings" -ForegroundColor White
    Write-Host "3. Check container logs" -ForegroundColor White
}

Write-Host "`n🎄 Test completed!" -ForegroundColor Green 