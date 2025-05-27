# Christmas Trading Frontend Supabase Configuration Verification
# 2025-05-26 - PM Frontend Diagnostic Script

Write-Host "=== Frontend Supabase Configuration Verification ===" -ForegroundColor Cyan
Write-Host ""

# 1. 프론트엔드 파일 존재 확인
Write-Host "1. Frontend Files Check" -ForegroundColor Yellow
$frontendFiles = @(
    "web-dashboard/src/lib/supabase.js",
    "web-dashboard/env.example",
    "web-dashboard/netlify.toml"
)

foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file - EXISTS" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file - NOT FOUND" -ForegroundColor Red
    }
}

Write-Host ""

# 2. Supabase.js 설정 확인
Write-Host "2. Supabase.js Configuration Check" -ForegroundColor Yellow
if (Test-Path "web-dashboard/src/lib/supabase.js") {
    $supabaseContent = Get-Content "web-dashboard/src/lib/supabase.js" -Raw
    
    # URL 확인
    if ($supabaseContent -match "https://qehzzsxzjijfzqkysazc\.supabase\.co") {
        Write-Host "   ✅ Supabase URL: CORRECT (qehzzsxzjijfzqkysazc.supabase.co)" -ForegroundColor Green
    } elseif ($supabaseContent -match "https://demo-supabase-url\.co") {
        Write-Host "   ❌ Supabase URL: DEMO VALUE (needs update)" -ForegroundColor Red
    } else {
        Write-Host "   ⚠️ Supabase URL: UNKNOWN FORMAT" -ForegroundColor Yellow
    }
    
    # Anon Key 확인
    if ($supabaseContent -match "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSI") {
        Write-Host "   ✅ Anon Key: CONFIGURED" -ForegroundColor Green
    } elseif ($supabaseContent -match "demo-anon-key") {
        Write-Host "   ❌ Anon Key: DEMO VALUE (needs update)" -ForegroundColor Red
    } else {
        Write-Host "   ⚠️ Anon Key: UNKNOWN FORMAT" -ForegroundColor Yellow
    }
    
    # 환경변수 체크 로직 확인
    if ($supabaseContent -match "import\.meta\.env\.VITE_SUPABASE_URL") {
        Write-Host "   ✅ Environment Variable Support: ENABLED" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Environment Variable Support: MISSING" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ supabase.js file not found" -ForegroundColor Red
}

Write-Host ""

# 3. 환경변수 예제 파일 확인
Write-Host "3. Environment Example File Check" -ForegroundColor Yellow
if (Test-Path "web-dashboard/env.example") {
    $envExampleContent = Get-Content "web-dashboard/env.example" -Raw
    
    if ($envExampleContent -match "VITE_SUPABASE_URL=https://qehzzsxzjijfzqkysazc\.supabase\.co") {
        Write-Host "   ✅ Example URL: CORRECT" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Example URL: NEEDS UPDATE" -ForegroundColor Red
    }
    
    if ($envExampleContent -match "VITE_SUPABASE_ANON_KEY=eyJ") {
        Write-Host "   ✅ Example Anon Key: CONFIGURED" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Example Anon Key: NEEDS UPDATE" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ env.example file not found" -ForegroundColor Red
}

Write-Host ""

# 4. Netlify 설정 확인
Write-Host "4. Netlify Configuration Check" -ForegroundColor Yellow
if (Test-Path "web-dashboard/netlify.toml") {
    Write-Host "   ✅ netlify.toml: EXISTS" -ForegroundColor Green
    
    $netlifyContent = Get-Content "web-dashboard/netlify.toml" -Raw
    if ($netlifyContent -match "VITE_SUPABASE_URL") {
        Write-Host "   ✅ Environment Variables: DOCUMENTED" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Environment Variables: NOT DOCUMENTED" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ netlify.toml: NOT FOUND" -ForegroundColor Red
}

Write-Host ""

# 5. 프론트엔드 URL 테스트 (시뮬레이션)
Write-Host "5. Frontend URL Test Simulation" -ForegroundColor Yellow
$correctUrl = "https://qehzzsxzjijfzqkysazc.supabase.co"
$wrongUrl = "https://supabase.com/dashboard/project/qehzzsxzjijfzqkysazc"

Write-Host "   ✅ Correct URL: $correctUrl" -ForegroundColor Green
Write-Host "   ❌ Wrong URL: $wrongUrl" -ForegroundColor Red
Write-Host "   📝 Auth Endpoint: $correctUrl/auth/v1/token" -ForegroundColor White

Write-Host ""

# 6. 결과 요약
Write-Host "=== SUMMARY ===" -ForegroundColor Yellow
Write-Host "Frontend Supabase Configuration Status:" -ForegroundColor White

if (Test-Path "web-dashboard/src/lib/supabase.js") {
    $content = Get-Content "web-dashboard/src/lib/supabase.js" -Raw
    if ($content -match "https://qehzzsxzjijfzqkysazc\.supabase\.co" -and $content -match "eyJhbGciOiJIUzI1NiI") {
        Write-Host "✅ Configuration: CORRECT" -ForegroundColor Green
        Write-Host "✅ Ready for deployment" -ForegroundColor Green
    } else {
        Write-Host "❌ Configuration: NEEDS UPDATE" -ForegroundColor Red
        Write-Host "❌ Not ready for deployment" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Configuration: FILE MISSING" -ForegroundColor Red
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Verify frontend code changes" -ForegroundColor White
Write-Host "2. Set Netlify environment variables" -ForegroundColor White
Write-Host "3. Deploy to production" -ForegroundColor White
Write-Host "4. Test login functionality" -ForegroundColor White

Write-Host ""
Write-Host "Estimated Fix Time: 10 minutes" -ForegroundColor Cyan 