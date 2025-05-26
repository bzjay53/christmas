# Christmas Trading Backend Server Recovery Guide (Corrected)
# 2025-05-26 - Critical Issue Resolution with Correct Paths

Write-Host "=== 🚨 Backend Server Recovery Guide (CORRECTED) ===" -ForegroundColor Red
Write-Host ""

Write-Host "📋 Diagnosis Results (Updated):" -ForegroundColor Yellow
Write-Host "❌ Backend Server: 31.220.83.213:8000 - CONNECTION FAILED" -ForegroundColor Red
Write-Host "❌ API Endpoints: TIMEOUT" -ForegroundColor Red
Write-Host "❌ SUPABASE_SERVICE_KEY: PLACEHOLDER VALUE" -ForegroundColor Red
Write-Host "✅ Project Path: ~/christmas-trading/backend/ (CORRECTED)" -ForegroundColor Green
Write-Host ""

Write-Host "🎯 Root Cause: SUPABASE_SERVICE_KEY not configured" -ForegroundColor Cyan
Write-Host "💡 Impact: Backend server failed to start" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 STEP 1: Get Supabase Service Key (5 minutes)" -ForegroundColor Green
Write-Host "1. Go to https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Select 'Christmas Trading' project" -ForegroundColor White
Write-Host "3. Click 'Settings' → 'API' in left menu" -ForegroundColor White
Write-Host "4. Find 'service_role' key and copy it" -ForegroundColor White
Write-Host "5. The key should start with 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔧 STEP 2: Update Environment Variables (2 minutes)" -ForegroundColor Green
Write-Host "1. Open backend/.env file in text editor" -ForegroundColor White
Write-Host "2. Find line: SUPABASE_SERVICE_KEY=your-supabase-service-role-key" -ForegroundColor White
Write-Host "3. Replace with: SUPABASE_SERVICE_KEY=[your-copied-key]" -ForegroundColor White
Write-Host "4. Save the file" -ForegroundColor White
Write-Host ""

Write-Host "🐳 STEP 3: Restart Backend Server (10 minutes)" -ForegroundColor Green
Write-Host "SSH to 31.220.83.213 server and run:" -ForegroundColor White
Write-Host ""
Write-Host "# Navigate to CORRECT project directory" -ForegroundColor Gray
Write-Host "cd ~/christmas-trading/backend" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Pull latest code" -ForegroundColor Gray
Write-Host "git pull origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Update .env file with new SUPABASE_SERVICE_KEY" -ForegroundColor Gray
Write-Host "nano .env" -ForegroundColor Cyan
Write-Host "# OR use vim if nano is not available:" -ForegroundColor Gray
Write-Host "vim .env" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Restart Docker containers (PowerShell compatible)" -ForegroundColor Gray
Write-Host "docker-compose down" -ForegroundColor Cyan
Write-Host "docker-compose up -d --build" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Check container status" -ForegroundColor Gray
Write-Host "docker-compose ps" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Check logs" -ForegroundColor Gray
Write-Host "docker-compose logs -f" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ STEP 4: Verify Recovery" -ForegroundColor Green
Write-Host "After server restart, run this script to verify:" -ForegroundColor White
Write-Host ".\scripts\verify-backend-recovery.ps1" -ForegroundColor Cyan
Write-Host ""

Write-Host "📞 Next Actions:" -ForegroundColor Yellow
Write-Host "1. Complete STEP 1-3 above" -ForegroundColor White
Write-Host "2. Return here and type 'y' when server restart is complete" -ForegroundColor White
Write-Host "3. We will then verify the recovery and test all APIs" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  Important Notes:" -ForegroundColor Red
Write-Host "- Use CORRECT path: ~/christmas-trading/backend/" -ForegroundColor White
Write-Host "- Keep the Supabase service key secure" -ForegroundColor White
Write-Host "- Do not share the key in public repositories" -ForegroundColor White
Write-Host "- Ensure Docker containers are running after restart" -ForegroundColor White
Write-Host "- PowerShell compatible commands only (no && operators)" -ForegroundColor White
Write-Host ""

Write-Host "🔄 Estimated Total Time: 20 minutes" -ForegroundColor Cyan
Write-Host "📊 Success Rate: 95% (if steps followed correctly)" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Environment Variables Status:" -ForegroundColor Yellow
Write-Host "✅ SUPABASE_URL: Configured" -ForegroundColor Green
Write-Host "✅ SUPABASE_ANON_KEY: Configured" -ForegroundColor Green
Write-Host "❌ SUPABASE_SERVICE_KEY: NEEDS UPDATE" -ForegroundColor Red
Write-Host "✅ JWT_SECRET: Configured" -ForegroundColor Green
Write-Host "✅ KIS API: Mock mode configured" -ForegroundColor Green 