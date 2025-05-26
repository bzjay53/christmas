# Christmas Trading Backend Recovery Verification
# 2025-05-26 - Simple Version

Write-Host "=== Backend Recovery Verification ===" -ForegroundColor Cyan
Write-Host ""

# Test network connection
Write-Host "1. Testing network connection..." -ForegroundColor Yellow
try {
    $networkTest = Test-NetConnection -ComputerName 31.220.83.213 -Port 8000 -WarningAction SilentlyContinue
    
    if ($networkTest.TcpTestSucceeded) {
        Write-Host "   TCP Connection: SUCCESS" -ForegroundColor Green
        $serverOnline = $true
    } else {
        Write-Host "   TCP Connection: FAILED (Server Down)" -ForegroundColor Red
        $serverOnline = $false
    }
    
    Write-Host "   Ping: $($networkTest.PingSucceeded)" -ForegroundColor White
    if ($networkTest.PingReplyDetails) {
        Write-Host "   Response Time: $($networkTest.PingReplyDetails.RoundtripTime)ms" -ForegroundColor White
    }
} catch {
    Write-Host "   Network Test Failed: $($_.Exception.Message)" -ForegroundColor Red
    $serverOnline = $false
}

Write-Host ""

# Test API Health Check
Write-Host "2. Testing API Health Check..." -ForegroundColor Yellow
if ($serverOnline) {
    try {
        $healthResponse = Invoke-RestMethod -Uri "http://31.220.83.213:8000/health" -Method GET -TimeoutSec 10
        Write-Host "   Health Check: SUCCESS" -ForegroundColor Green
        Write-Host "   Server Status: $($healthResponse.status)" -ForegroundColor White
    } catch {
        Write-Host "   Health Check: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "   Health Check: SKIPPED (Server Offline)" -ForegroundColor Yellow
}

Write-Host ""

# Check environment variables
Write-Host "3. Checking environment variables..." -ForegroundColor Yellow
if (Test-Path "backend/env.txt") {
    Write-Host "   env.txt file: EXISTS" -ForegroundColor Green
    
    $envContent = Get-Content "backend/env.txt" -Raw
    
    if ($envContent -match "SUPABASE_SERVICE_KEY=your-supabase-service-role-key") {
        Write-Host "   SUPABASE_SERVICE_KEY: PLACEHOLDER (NEEDS UPDATE)" -ForegroundColor Red
    } else {
        Write-Host "   SUPABASE_SERVICE_KEY: CONFIGURED" -ForegroundColor Green
    }
} else {
    Write-Host "   env.txt file: NOT FOUND" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "=== SUMMARY ===" -ForegroundColor Yellow
if ($serverOnline) {
    Write-Host "Server Status: ONLINE (Recovery Complete)" -ForegroundColor Green
    Write-Host "Next Step: Phase 2 (Supabase Tables)" -ForegroundColor Green
} else {
    Write-Host "Server Status: OFFLINE (Recovery Needed)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Required Actions:" -ForegroundColor Yellow
    Write-Host "1. Get Supabase Service Key from dashboard" -ForegroundColor White
    Write-Host "2. SSH to 31.220.83.213" -ForegroundColor White
    Write-Host "3. Update .env file" -ForegroundColor White
    Write-Host "4. Restart Docker containers" -ForegroundColor White
}

Write-Host ""
Write-Host "Estimated Recovery Time: 20 minutes" -ForegroundColor Cyan 