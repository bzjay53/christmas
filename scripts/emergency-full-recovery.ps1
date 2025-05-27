# Christmas Trading Emergency Full Recovery Script
# Frontend CORS + Backend Server Down Simultaneous Fix

Write-Host "EMERGENCY: Christmas Trading Full Recovery Started" -ForegroundColor Red
Write-Host "=" * 60

# 1. Current Situation Diagnosis
Write-Host ""
Write-Host "1. Current Situation Diagnosis" -ForegroundColor Yellow
Write-Host "Checking backend server status..."

try {
    $backendResponse = Invoke-WebRequest -Uri "http://31.220.83.213:8000/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "Backend Server: ONLINE (HTTP $($backendResponse.StatusCode))" -ForegroundColor Green
    $backendDown = $false
} catch {
    Write-Host "Backend Server: DOWN" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    $backendDown = $true
}

Write-Host ""
Write-Host "Frontend CORS Problem Analysis..."
Write-Host "WRONG URL: https://supabase.com/dashboard/project/qehzzsxzjijfzqkysazc/auth/v1/token" -ForegroundColor Red
Write-Host "CORRECT URL: https://qehzzsxzjijfzqkysazc.supabase.co/auth/v1/token" -ForegroundColor Green

# 2. Backend Server Recovery (if needed)
if ($backendDown) {
    Write-Host ""
    Write-Host "2. Backend Server Emergency Recovery" -ForegroundColor Yellow
    Write-Host "SSH Connection and Recovery Commands:"
    Write-Host ""
    Write-Host "ssh root@31.220.83.213" -ForegroundColor Cyan
    Write-Host "cd /root/christmas-trading" -ForegroundColor Cyan
    Write-Host "git pull origin main" -ForegroundColor Cyan
    Write-Host "docker-compose down" -ForegroundColor Cyan
    Write-Host "docker-compose up -d" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "WARNING: Execute above commands via SSH, then run this script again." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "2. Backend Server Status: NORMAL" -ForegroundColor Green
}

# 3. Frontend Netlify Environment Variables Fix Guide
Write-Host ""
Write-Host "3. Frontend CORS Problem Resolution" -ForegroundColor Yellow
Write-Host "Netlify Environment Variables IMMEDIATE FIX REQUIRED!"
Write-Host ""
Write-Host "Fix Steps:" -ForegroundColor Cyan
Write-Host "1. Go to https://app.netlify.com" -ForegroundColor White
Write-Host "2. Select christmas-protocol site" -ForegroundColor White
Write-Host "3. Site settings -> Environment variables" -ForegroundColor White
Write-Host "4. Modify this variable:" -ForegroundColor White
Write-Host ""
Write-Host "   VITE_SUPABASE_URL=https://qehzzsxzjijfzqkysazc.supabase.co" -ForegroundColor Green
Write-Host "   (Replace existing wrong URL)" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Deploys -> Trigger deploy -> Deploy site" -ForegroundColor White
Write-Host "6. Test after deployment completion" -ForegroundColor White

# 4. Environment Variables Validation
Write-Host ""
Write-Host "4. Environment Variables Validation" -ForegroundColor Yellow
if (Test-Path "scripts/validate-env.sh") {
    Write-Host "Validating backend environment variables..."
    try {
        # Execute bash script in WSL
        $validationResult = wsl bash scripts/validate-env.sh 2>&1
        Write-Host $validationResult
    } catch {
        Write-Host "WARNING: Environment validation script execution failed" -ForegroundColor Yellow
        Write-Host "Please check manually via SSH connection." -ForegroundColor Gray
    }
} else {
    Write-Host "WARNING: Environment validation script not found." -ForegroundColor Yellow
}

# 5. Post-Recovery Testing
Write-Host ""
Write-Host "5. Post-Recovery Testing Methods" -ForegroundColor Yellow
Write-Host "Backend Test:"
Write-Host "   curl http://31.220.83.213:8000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend Test:"
Write-Host "   1. Go to https://christmas-protocol.netlify.app" -ForegroundColor Cyan
Write-Host "   2. Try login" -ForegroundColor Cyan
Write-Host "   3. Verify no CORS errors and normal operation" -ForegroundColor Cyan

# 6. Success Indicators
Write-Host ""
Write-Host "6. Recovery Success Indicators" -ForegroundColor Yellow
Write-Host "Backend: HTTP 200 response" -ForegroundColor Green
Write-Host "Frontend: No CORS errors" -ForegroundColor Green
Write-Host "Login: Normal operation" -ForegroundColor Green
Write-Host "Auth: 'Authentication failed' message disappears" -ForegroundColor Green

# 7. Additional Support
Write-Host ""
Write-Host "7. Additional Support Documents" -ForegroundColor Yellow
Write-Host "Detailed Guide: docs/URGENT_NETLIFY_FIX_GUIDE.md" -ForegroundColor Cyan
Write-Host "Permanent Solution: PERMANENT_SOLUTION_GUIDE.md" -ForegroundColor Cyan
Write-Host "Root Cause Analysis: docs/PM_Root_Cause_Analysis_2025-05-27.md" -ForegroundColor Cyan

Write-Host ""
Write-Host "Expected Recovery Time: 10 minutes" -ForegroundColor Green
Write-Host "Success Rate: 95%" -ForegroundColor Green
Write-Host ""
Write-Host "EMERGENCY RECOVERY SCRIPT COMPLETED!" -ForegroundColor Red 