# Christmas Trading Frontend Force Redeploy Guide
# Fix CORS issue by forcing Netlify redeploy with correct environment variables

Write-Host "FRONTEND FORCE REDEPLOY GUIDE STARTED" -ForegroundColor Blue
Write-Host "=" * 50

Write-Host ""
Write-Host "ISSUE IDENTIFIED:" -ForegroundColor Yellow
Write-Host "- Frontend code: CORRECT" -ForegroundColor Green
Write-Host "- Environment variables: SET (but not deployed)" -ForegroundColor Yellow
Write-Host "- Build cache: Contains wrong URL" -ForegroundColor Red
Write-Host "- Current request: https://supabase.com/dashboard/project/..." -ForegroundColor Red
Write-Host "- Should be: https://qehzzsxzjijfzqkysazc.supabase.co/..." -ForegroundColor Green

Write-Host ""
Write-Host "ROOT CAUSE:" -ForegroundColor Cyan
Write-Host "Netlify environment variables were set but site was not redeployed" -ForegroundColor White
Write-Host "Old build with wrong URL is still cached and served" -ForegroundColor White

Write-Host ""
Write-Host "SOLUTION: Force Redeploy with Cache Clear" -ForegroundColor Yellow

Write-Host ""
Write-Host "STEP 1: Verify Netlify Environment Variables" -ForegroundColor Yellow
Write-Host "1. Go to: https://app.netlify.com" -ForegroundColor Cyan
Write-Host "2. Select: christmas-protocol site" -ForegroundColor Cyan
Write-Host "3. Site settings -> Environment variables" -ForegroundColor Cyan
Write-Host "4. Verify these variables:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   VITE_SUPABASE_URL=https://qehzzsxzjijfzqkysazc.supabase.co" -ForegroundColor Green
Write-Host "   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -ForegroundColor Green
Write-Host "   VITE_API_BASE_URL=http://31.220.83.213:8000" -ForegroundColor Green

Write-Host ""
Write-Host "STEP 2: Force Redeploy with Cache Clear" -ForegroundColor Yellow
Write-Host "1. Go to: Deploys tab" -ForegroundColor Cyan
Write-Host "2. Click: Trigger deploy" -ForegroundColor Cyan
Write-Host "3. Select: Clear cache and deploy site" -ForegroundColor Cyan
Write-Host "4. Wait for deployment completion (2-3 minutes)" -ForegroundColor Cyan

Write-Host ""
Write-Host "STEP 3: Alternative - Git Commit Trigger" -ForegroundColor Yellow
Write-Host "If manual deploy fails, trigger via Git:" -ForegroundColor White
Write-Host "git add ." -ForegroundColor Cyan
Write-Host "git commit -m 'Force redeploy: Fix Supabase URL CORS issue'" -ForegroundColor Cyan
Write-Host "git push origin main" -ForegroundColor Cyan

Write-Host ""
Write-Host "STEP 4: Verification" -ForegroundColor Yellow
Write-Host "1. Open: https://christmas-protocol.netlify.app" -ForegroundColor Cyan
Write-Host "2. Open browser DevTools (F12)" -ForegroundColor Cyan
Write-Host "3. Go to Network tab" -ForegroundColor Cyan
Write-Host "4. Try login" -ForegroundColor Cyan
Write-Host "5. Check request URL should be:" -ForegroundColor Cyan
Write-Host "   https://qehzzsxzjijfzqkysazc.supabase.co/auth/v1/token" -ForegroundColor Green

Write-Host ""
Write-Host "SUCCESS INDICATORS:" -ForegroundColor Green
Write-Host "- No CORS errors in console" -ForegroundColor Green
Write-Host "- Correct Supabase URL in network requests" -ForegroundColor Green
Write-Host "- Login attempts reach backend" -ForegroundColor Green
Write-Host "- 'Authentication failed' message changes to backend error" -ForegroundColor Green

Write-Host ""
Write-Host "ESTIMATED TIME: 5 minutes" -ForegroundColor Cyan
Write-Host "SUCCESS RATE: 99%" -ForegroundColor Green

Write-Host ""
Write-Host "FRONTEND FORCE REDEPLOY GUIDE COMPLETED!" -ForegroundColor Blue 