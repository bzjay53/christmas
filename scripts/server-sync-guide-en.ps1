# Christmas Trading Server Sync and Recovery Guide (English)
# 2025-05-26 PM AI Assistant

Write-Host "Christmas Trading Server Sync and Recovery Guide" -ForegroundColor Green
Write-Host "Execution Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan

# 1. Current Situation Analysis
Write-Host "`n1. Current Situation Analysis" -ForegroundColor Yellow
Write-Host "=" * 60

Write-Host "Backend Server: 31.220.83.213" -ForegroundColor Cyan
Write-Host "Server Working Path: /root/christmas-trading" -ForegroundColor Cyan
Write-Host "Issue: Docker container name conflict" -ForegroundColor Red
Write-Host "Issue: Local scripts not available on server" -ForegroundColor Red
Write-Host "Issue: SUPABASE_SERVICE_KEY placeholder value" -ForegroundColor Red

# 2. Solution Summary
Write-Host "`n2. Solution Summary" -ForegroundColor Yellow
Write-Host "=" * 60

$solutions = @(
    "1. Git sync on server (git pull)",
    "2. Set Docker recovery script permissions",
    "3. Update environment variables (SUPABASE_SERVICE_KEY)",
    "4. Restart Docker containers",
    "5. Verify and test services"
)

foreach ($solution in $solutions) {
    Write-Host "  $solution" -ForegroundColor White
}

# 3. Server SSH Connection Guide
Write-Host "`n3. Server SSH Connection Guide" -ForegroundColor Yellow
Write-Host "=" * 60

Write-Host "SSH Connection Command:" -ForegroundColor Cyan
Write-Host "ssh root@31.220.83.213" -ForegroundColor White

Write-Host "`nNavigate to working directory:" -ForegroundColor Cyan
Write-Host "cd /root/christmas-trading" -ForegroundColor White

# 4. Git Sync Steps
Write-Host "`n4. Git Sync Execution" -ForegroundColor Yellow
Write-Host "=" * 60

$gitCommands = @(
    "# Check current Git status",
    "git status",
    "",
    "# Pull latest changes",
    "git pull origin main",
    "",
    "# Verify script file exists",
    "ls -la scripts/docker-recovery.sh",
    "",
    "# Set script execution permissions",
    "chmod +x scripts/docker-recovery.sh"
)

Write-Host "Git Commands to Execute:" -ForegroundColor Cyan
foreach ($cmd in $gitCommands) {
    if ($cmd -like "#*" -or $cmd -eq "") {
        Write-Host $cmd -ForegroundColor Gray
    } else {
        Write-Host "  $cmd" -ForegroundColor White
    }
}

# 5. Environment Variable Update Guide
Write-Host "`n5. Environment Variable Update Guide" -ForegroundColor Yellow
Write-Host "=" * 60

Write-Host "Supabase Service Role Key Required:" -ForegroundColor Red

Write-Host "`nStep 1: Access Supabase Dashboard:" -ForegroundColor White
Write-Host "   - URL: https://supabase.com/dashboard" -ForegroundColor Cyan
Write-Host "   - Project: Select Christmas Trading" -ForegroundColor Cyan
Write-Host "   - Menu: Settings -> API" -ForegroundColor Cyan
Write-Host "   - Copy: Service Role Key (secret key)" -ForegroundColor Cyan

Write-Host "`nStep 2: Update environment file on server:" -ForegroundColor White
Write-Host "   - Open file: nano backend/.env" -ForegroundColor Cyan
Write-Host "   - Find: SUPABASE_SERVICE_KEY=your-supabase-service-role-key" -ForegroundColor Cyan
Write-Host "   - Replace: SUPABASE_SERVICE_KEY=actual_copied_key_value" -ForegroundColor Cyan
Write-Host "   - Save: Ctrl+X -> Y -> Enter" -ForegroundColor Cyan

# 6. Docker Recovery Execution
Write-Host "`n6. Docker Recovery Execution" -ForegroundColor Yellow
Write-Host "=" * 60

Write-Host "Execute Docker Recovery Script:" -ForegroundColor Cyan
Write-Host "./scripts/docker-recovery.sh" -ForegroundColor White

Write-Host "`nScript performs these tasks:" -ForegroundColor Cyan
$dockerTasks = @(
    "• Diagnose current Docker status",
    "• Force remove conflicting containers",
    "• Verify environment variables",
    "• Restart Docker Compose (force recreate)",
    "• Service verification and Health Check",
    "• External access testing"
)

foreach ($task in $dockerTasks) {
    Write-Host "  $task" -ForegroundColor White
}

# 7. Verification Steps
Write-Host "`n7. Service Verification" -ForegroundColor Yellow
Write-Host "=" * 60

$verificationSteps = @(
    "1. Check Docker container status: docker ps",
    "2. Backend Health Check: curl http://localhost:8000/health",
    "3. External access test: curl http://31.220.83.213:8000/health",
    "4. Frontend connection test: https://christmas-protocol.netlify.app"
)

foreach ($step in $verificationSteps) {
    Write-Host "  $step" -ForegroundColor White
}

# 8. Estimated Time
Write-Host "`n8. Estimated Time" -ForegroundColor Yellow
Write-Host "=" * 60

Write-Host "  SSH connection and Git sync: 5 minutes" -ForegroundColor White
Write-Host "  Environment variable update: 5 minutes" -ForegroundColor White
Write-Host "  Docker recovery execution: 10 minutes" -ForegroundColor White
Write-Host "  Service verification: 5 minutes" -ForegroundColor White
Write-Host "  Total estimated time: 25 minutes" -ForegroundColor Green

# 9. Success Criteria
Write-Host "`n9. Success Criteria" -ForegroundColor Yellow
Write-Host "=" * 60

$successCriteria = @(
    "Git pull success and script file exists",
    "Docker containers running normally",
    "Backend Health Check response success",
    "Frontend shows 'Backend Connected' status",
    "Environment variables properly configured"
)

foreach ($criteria in $successCriteria) {
    Write-Host "  $criteria" -ForegroundColor Green
}

# 10. Troubleshooting Guide
Write-Host "`n10. Troubleshooting Guide" -ForegroundColor Yellow
Write-Host "=" * 60

Write-Host "If problems occur:" -ForegroundColor Red

$troubleshooting = @{
    "Git pull fails" = "git reset --hard HEAD; git pull origin main"
    "Script permission error" = "chmod +x scripts/*.sh; chmod +x scripts/*.ps1"
    "Docker container start fails" = "docker-compose down; docker system prune -f; docker-compose up -d --build"
    "Environment variable read fails" = "cat backend/.env | grep SUPABASE_SERVICE_KEY"
    "Port conflict" = "netstat -tulpn | grep :8000; kill -9 <PID>"
}

foreach ($problem in $troubleshooting.GetEnumerator()) {
    Write-Host "  $($problem.Key):" -ForegroundColor Yellow
    Write-Host "    $($problem.Value)" -ForegroundColor Cyan
}

# 11. Completion Message
Write-Host "`nServer Sync and Recovery Guide Complete!" -ForegroundColor Green
Write-Host "Next: SSH -> Git Sync -> Environment Update -> Docker Recovery -> Verification" -ForegroundColor Cyan
Write-Host "Please report results to PM after completion." -ForegroundColor Yellow

Write-Host "`nStart now!" -ForegroundColor Magenta
Write-Host "ssh root@31.220.83.213" -ForegroundColor White 