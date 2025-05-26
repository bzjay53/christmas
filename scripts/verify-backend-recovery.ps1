# Christmas Trading Backend Recovery Verification
# 2025-05-26

Write-Host "=== 🔍 Backend Recovery Verification ===" -ForegroundColor Green
Write-Host ""

Write-Host "Testing backend server recovery..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Network Connection
Write-Host "1. Network Connection Test" -ForegroundColor Yellow
$networkTest = Test-NetConnection -ComputerName 31.220.83.213 -Port 8000 -InformationLevel Quiet
if ($networkTest) {
    Write-Host "✅ Network Connection: SUCCESS" -ForegroundColor Green
} else {
    Write-Host "❌ Network Connection: FAILED" -ForegroundColor Red
    Write-Host "   Server may still be starting up. Wait 2-3 minutes and try again." -ForegroundColor Yellow
}
Write-Host ""

# Test 2: Health Check API
Write-Host "2. Health Check API Test" -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://31.220.83.213:8000/api/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Health Check API: SUCCESS" -ForegroundColor Green
    Write-Host "   Status: $($healthResponse.status)" -ForegroundColor White
    Write-Host "   Database: $($healthResponse.database)" -ForegroundColor White
    Write-Host "   Uptime: $($healthResponse.uptime) seconds" -ForegroundColor White
} catch {
    Write-Host "❌ Health Check API: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Database Status API
Write-Host "3. Database Status API Test" -ForegroundColor Yellow
try {
    $dbResponse = Invoke-RestMethod -Uri "http://31.220.83.213:8000/api/database-status" -Method GET -TimeoutSec 10
    Write-Host "✅ Database Status API: SUCCESS" -ForegroundColor Green
    Write-Host "   Connection: $($dbResponse.connected)" -ForegroundColor White
} catch {
    Write-Host "❌ Database Status API: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   This may indicate Supabase tables are not created yet." -ForegroundColor Yellow
}
Write-Host ""

# Test 4: Auth Endpoints
Write-Host "4. Authentication Endpoints Test" -ForegroundColor Yellow
try {
    # Test signup endpoint (should return method not allowed or validation error, not timeout)
    $signupTest = Invoke-RestMethod -Uri "http://31.220.83.213:8000/api/auth/signup" -Method GET -TimeoutSec 5
    Write-Host "✅ Auth Endpoints: ACCESSIBLE" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*405*" -or $_.Exception.Message -like "*Method*") {
        Write-Host "✅ Auth Endpoints: ACCESSIBLE (Method not allowed is expected)" -ForegroundColor Green
    } elseif ($_.Exception.Message -like "*timeout*" -or $_.Exception.Message -like "*시간*") {
        Write-Host "❌ Auth Endpoints: TIMEOUT" -ForegroundColor Red
    } else {
        Write-Host "⚠️  Auth Endpoints: PARTIAL (Server responding but may have issues)" -ForegroundColor Yellow
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
}
Write-Host ""

# Summary
Write-Host "📊 Recovery Status Summary:" -ForegroundColor Cyan
if ($networkTest) {
    Write-Host "✅ Server is online and accessible" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔄 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Test frontend login at https://christmas-protocol.netlify.app/" -ForegroundColor White
    Write-Host "2. If login still fails, check Supabase tables creation" -ForegroundColor White
    Write-Host "3. Run: .\scripts\supabase-guide-en.ps1 for table creation guide" -ForegroundColor White
} else {
    Write-Host "❌ Server is still down or starting up" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check Docker container status on 31.220.83.213" -ForegroundColor White
    Write-Host "2. Verify .env file has correct SUPABASE_SERVICE_KEY" -ForegroundColor White
    Write-Host "3. Check server logs: docker-compose logs -f" -ForegroundColor White
}
Write-Host ""

Write-Host "📞 Report Status:" -ForegroundColor Cyan
Write-Host "Please report the test results above to continue with next steps." -ForegroundColor White 