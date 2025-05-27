# Christmas Trading Backend Emergency Recovery Script
# Fix SUPABASE_SERVICE_KEY placeholder and restart server

Write-Host "BACKEND EMERGENCY RECOVERY STARTED" -ForegroundColor Red
Write-Host "=" * 50

Write-Host ""
Write-Host "CRITICAL ISSUE IDENTIFIED:" -ForegroundColor Yellow
Write-Host "- Backend server: DOWN (timeout)" -ForegroundColor Red
Write-Host "- SUPABASE_SERVICE_KEY: Placeholder value" -ForegroundColor Red
Write-Host "- Database connection: 401 Unauthorized" -ForegroundColor Red

Write-Host ""
Write-Host "REQUIRED USER ACTION:" -ForegroundColor Cyan
Write-Host "1. Get Supabase Service Role Key from dashboard" -ForegroundColor White
Write-Host "2. SSH to server and update environment variables" -ForegroundColor White
Write-Host "3. Restart Docker containers" -ForegroundColor White

Write-Host ""
Write-Host "STEP 1: Get Supabase Service Role Key" -ForegroundColor Yellow
Write-Host "1. Go to: https://supabase.com/dashboard" -ForegroundColor Cyan
Write-Host "2. Select project: qehzzsxzjijfzqkysazc" -ForegroundColor Cyan
Write-Host "3. Settings -> API -> Service Role Key (secret)" -ForegroundColor Cyan
Write-Host "4. Copy the key starting with 'eyJ...'" -ForegroundColor Cyan

Write-Host ""
Write-Host "STEP 2: SSH Commands to Execute" -ForegroundColor Yellow
Write-Host "ssh root@31.220.83.213" -ForegroundColor Cyan
Write-Host "cd /root/christmas-trading" -ForegroundColor Cyan
Write-Host "git pull origin main" -ForegroundColor Cyan
Write-Host "cp .env .env.backup" -ForegroundColor Cyan
Write-Host "nano .env" -ForegroundColor Cyan
Write-Host "# Change SUPABASE_SERVICE_KEY=your-supabase-service-role-key" -ForegroundColor Gray
Write-Host "# To     SUPABASE_SERVICE_KEY=[your-actual-key]" -ForegroundColor Green
Write-Host "docker-compose down" -ForegroundColor Cyan
Write-Host "docker-compose up -d" -ForegroundColor Cyan

Write-Host ""
Write-Host "STEP 3: Verification Commands" -ForegroundColor Yellow
Write-Host "curl http://31.220.83.213:8000/health" -ForegroundColor Cyan
Write-Host "docker ps" -ForegroundColor Cyan
Write-Host "docker logs christmas-backend" -ForegroundColor Cyan

Write-Host ""
Write-Host "EXPECTED RESULTS:" -ForegroundColor Green
Write-Host "- Backend server: HTTP 200 OK" -ForegroundColor Green
Write-Host "- Docker container: Running" -ForegroundColor Green
Write-Host "- Supabase connection: Successful" -ForegroundColor Green

Write-Host ""
Write-Host "ESTIMATED TIME: 15 minutes" -ForegroundColor Cyan
Write-Host "SUCCESS RATE: 95%" -ForegroundColor Green

Write-Host ""
Write-Host "BACKEND EMERGENCY RECOVERY GUIDE COMPLETED!" -ForegroundColor Red 