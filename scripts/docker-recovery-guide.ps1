# Christmas Trading Docker Recovery Guide
# 2025-05-26 PM AI Assistant

Write-Host "Christmas Trading Docker Recovery Guide" -ForegroundColor Green
Write-Host "Execution Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan

# 1. Current Situation Analysis
Write-Host "`n1. Current Situation Analysis" -ForegroundColor Yellow
Write-Host "=" * 50

Write-Host "Backend Server: 31.220.83.213" -ForegroundColor Cyan
Write-Host "Working Path: /root/christmas-trading/backend" -ForegroundColor Cyan
Write-Host "Issue: Docker container name conflict" -ForegroundColor Red
Write-Host "Environment: SUPABASE_SERVICE_KEY placeholder value" -ForegroundColor Red

# 2. Solution Summary
Write-Host "`n2. Solution Summary" -ForegroundColor Yellow
Write-Host "=" * 50

$solutions = @(
    "1. Force remove conflicting containers",
    "2. Update environment variables (SUPABASE_SERVICE_KEY)",
    "3. Restart Docker services",
    "4. Verify and test services"
)

foreach ($solution in $solutions) {
    Write-Host "  $solution" -ForegroundColor White
}

# 3. User Action Guide
Write-Host "`n3. User Action Guide" -ForegroundColor Yellow
Write-Host "=" * 50

Write-Host "Required User Actions:" -ForegroundColor Red

Write-Host "`nStep 1: Get Supabase Service Role Key:" -ForegroundColor White
Write-Host "   - URL: https://supabase.com/dashboard" -ForegroundColor Cyan
Write-Host "   - Path: Christmas Trading project -> Settings -> API" -ForegroundColor Cyan
Write-Host "   - Copy: Service Role Key (secret key)" -ForegroundColor Cyan

Write-Host "`nStep 2: SSH to 31.220.83.213 server:" -ForegroundColor White
Write-Host "   - Connect: ssh root@31.220.83.213" -ForegroundColor Cyan
Write-Host "   - Navigate: cd /root/christmas-trading/backend" -ForegroundColor Cyan
Write-Host "   - Edit: nano .env" -ForegroundColor Cyan
Write-Host "   - Change: SUPABASE_SERVICE_KEY=actual_key_value" -ForegroundColor Cyan

Write-Host "`nStep 3: Run Docker recovery script:" -ForegroundColor White
Write-Host "   - Permission: chmod +x scripts/docker-recovery.sh" -ForegroundColor Cyan
Write-Host "   - Execute: ./scripts/docker-recovery.sh" -ForegroundColor Cyan

# 4. Script File Check
Write-Host "`n4. Generated Script File Check" -ForegroundColor Yellow
Write-Host "=" * 50

$scriptPath = "scripts/docker-recovery.sh"
if (Test-Path $scriptPath) {
    Write-Host "Docker recovery script created: $scriptPath" -ForegroundColor Green
    $fileSize = (Get-Item $scriptPath).Length
    Write-Host "File size: $fileSize bytes" -ForegroundColor Cyan
} else {
    Write-Host "Docker recovery script file not found." -ForegroundColor Red
}

# 5. Time Estimates
Write-Host "`n5. Time Estimates" -ForegroundColor Yellow
Write-Host "=" * 50

Write-Host "  Supabase key check: 5 minutes" -ForegroundColor White
Write-Host "  Environment update: 5 minutes" -ForegroundColor White
Write-Host "  Docker recovery: 10 minutes" -ForegroundColor White
Write-Host "  Service verification: 5 minutes" -ForegroundColor White
Write-Host "  Total estimated time: 25 minutes" -ForegroundColor Green

# 6. Success Criteria
Write-Host "`n6. Success Criteria" -ForegroundColor Yellow
Write-Host "=" * 50

$successCriteria = @(
    "Docker containers running normally",
    "Backend Health Check response success",
    "Frontend shows 'Backend Connected' status",
    "Environment variables properly configured"
)

foreach ($criteria in $successCriteria) {
    Write-Host "  $criteria" -ForegroundColor Green
}

# 7. Next Steps Preview
Write-Host "`n7. Next Steps Preview" -ForegroundColor Yellow
Write-Host "=" * 50

Write-Host "Phase 3: Database Schema Update" -ForegroundColor Cyan
Write-Host "  - Execute Supabase SQL: fix-supabase-schema.sql" -ForegroundColor White
Write-Host "  - Add strategy_type columns" -ForegroundColor White
Write-Host "  - Full system testing" -ForegroundColor White

Write-Host "`nPhase 4: Business Logic Restoration" -ForegroundColor Cyan
Write-Host "  - Restore coupon system" -ForegroundColor White
Write-Host "  - Restore referral system" -ForegroundColor White
Write-Host "  - Restore membership tier system" -ForegroundColor White

# 8. Completion Message
Write-Host "`nDocker Container Conflict Resolution Guide Complete!" -ForegroundColor Green
Write-Host "Next: User Action -> Script Execution -> Verification -> PM Report" -ForegroundColor Cyan
Write-Host "Contact PM if you have any questions." -ForegroundColor Yellow 