# Christmas Trading Supabase Tables Creation Guide
# 2025-05-26

Write-Host "=== Step 1: Supabase Tables Creation Guide ===" -ForegroundColor Yellow
Write-Host ""

Write-Host "Current Status:" -ForegroundColor Cyan
Write-Host "- Backend Server: 31.220.83.213:8000 No Response (Timeout)" -ForegroundColor Red
Write-Host "- Root Cause: Supabase tables not created causing API errors" -ForegroundColor Red
Write-Host "- Solution: Create tables in Supabase dashboard then restart server" -ForegroundColor Green
Write-Host ""

Write-Host "Supabase Tables Creation Steps:" -ForegroundColor Yellow
Write-Host "1. Go to https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Select Christmas Trading project" -ForegroundColor White
Write-Host "3. Click 'SQL Editor' in left menu" -ForegroundColor White
Write-Host "4. Copy and execute scripts/create-supabase-tables.sql content" -ForegroundColor White
Write-Host ""

Write-Host "SQL Script File Check:" -ForegroundColor Cyan
if (Test-Path "scripts/create-supabase-tables.sql") {
    Write-Host "✅ scripts/create-supabase-tables.sql file exists" -ForegroundColor Green
    $fileSize = (Get-Item "scripts/create-supabase-tables.sql").Length
    Write-Host "File Size: $fileSize bytes" -ForegroundColor White
} else {
    Write-Host "❌ scripts/create-supabase-tables.sql file not found" -ForegroundColor Red
}
Write-Host ""

Write-Host "Tables to be Created:" -ForegroundColor Cyan
Write-Host "1. users - User information and authentication" -ForegroundColor White
Write-Host "2. coupons - Coupon system" -ForegroundColor White
Write-Host "3. coupon_usage - Coupon usage history" -ForegroundColor White
Write-Host "4. referral_codes - Referral codes" -ForegroundColor White
Write-Host "5. referral_rewards - Referral rewards" -ForegroundColor White
Write-Host "6. trading_orders - Trading orders" -ForegroundColor White
Write-Host "7. user_sessions - User sessions" -ForegroundColor White
Write-Host ""

Write-Host "Important Notes:" -ForegroundColor Yellow
Write-Host "- Order matters: Foreign key relationships require specific order" -ForegroundColor Red
Write-Host "- Permissions: Supabase project owner permissions required" -ForegroundColor Red
Write-Host "- Backup: Backup existing data if any before proceeding" -ForegroundColor Red
Write-Host ""

Write-Host "Next Steps After Table Creation:" -ForegroundColor Green
Write-Host "1. Restart Docker container on 31.220.83.213 server" -ForegroundColor White
Write-Host "2. Test Health Check API" -ForegroundColor White
Write-Host "3. Test Signup API" -ForegroundColor White
Write-Host "4. Verify entire system" -ForegroundColor White
Write-Host ""

Write-Host "Please notify when completed:" -ForegroundColor Cyan
Write-Host "Enter 'y' when table creation is completed to proceed to next step." -ForegroundColor White 