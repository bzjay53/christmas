# Christmas Trading 환경변수 검증 스크립트
# 작성일: 2025-05-26
# 목적: Supabase 및 기타 필수 환경변수 설정 상태 확인

param(
    [switch]$DryRun
)

Write-Host "Christmas Trading Environment Validation" -ForegroundColor Green
if ($DryRun) {
    Write-Host "DRY RUN Mode" -ForegroundColor Yellow
}
Write-Host ""

# 환경변수 파일 경로
$envFile = "backend/env.txt"
$actualEnvFile = "backend/.env"

Write-Host "Environment File Check" -ForegroundColor Cyan

# env.txt 파일 존재 확인
if (Test-Path $envFile) {
    Write-Host "✅ env.txt file exists" -ForegroundColor Green
} else {
    Write-Host "❌ env.txt file not found" -ForegroundColor Red
    exit 1
}

# .env 파일 존재 확인
if (Test-Path $actualEnvFile) {
    Write-Host "✅ .env file exists" -ForegroundColor Green
} else {
    Write-Host "⚠️ .env file not found (will use env.txt for reference)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Critical Environment Variables Check" -ForegroundColor Cyan

# env.txt 파일 읽기
$envContent = Get-Content $envFile

# Critical environment variables list
$criticalVars = @{
    "SUPABASE_URL" = "Supabase Project URL"
    "SUPABASE_ANON_KEY" = "Supabase Anonymous Key"
    "SUPABASE_SERVICE_KEY" = "Supabase Service Key (Critical)"
    "JWT_SECRET" = "JWT Token Secret"
    "NODE_ENV" = "Node.js Environment"
    "PORT" = "Server Port"
}

$issues = @()

foreach ($var in $criticalVars.Keys) {
    $description = $criticalVars[$var]
    $line = $envContent | Where-Object { $_ -match "^$var=" }
    
    if ($line) {
        $value = ($line -split "=", 2)[1]
        
        # 플레이스홀더 값 체크
        $isPlaceholder = $false
        $placeholderPatterns = @(
            "your-.*",
            "DEMO-.*",
            "test_.*",
            ".*-your-.*",
            ".*placeholder.*"
        )
        
        foreach ($pattern in $placeholderPatterns) {
            if ($value -match $pattern) {
                $isPlaceholder = $true
                break
            }
        }
        
        if ($isPlaceholder) {
            Write-Host "⚠️ $var = $value" -ForegroundColor Yellow
            Write-Host "   → $description (플레이스홀더 감지)" -ForegroundColor Yellow
            $issues += "$var has placeholder value"
        } elseif ($value -eq "" -or $value -eq $null) {
            Write-Host "❌ $var = (empty)" -ForegroundColor Red
            Write-Host "   → $description (값 없음)" -ForegroundColor Red
            $issues += "$var is empty"
        } else {
            $maskedValue = if ($value.Length -gt 10) { 
                $value.Substring(0, 10) + "..." 
            } else { 
                $value 
            }
            Write-Host "✅ $var = $maskedValue" -ForegroundColor Green
            Write-Host "   → $description" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ $var = (not found)" -ForegroundColor Red
        Write-Host "   → $description (설정되지 않음)" -ForegroundColor Red
        $issues += "$var not found"
    }
}

Write-Host ""
Write-Host "Supabase Configuration Analysis" -ForegroundColor Cyan

# Supabase URL 형식 검증
$supabaseUrl = ($envContent | Where-Object { $_ -match "^SUPABASE_URL=" }) -replace "SUPABASE_URL=", ""
if ($supabaseUrl -match "https://[a-z]+\.supabase\.co") {
    Write-Host "✅ Supabase URL format is valid" -ForegroundColor Green
} else {
    Write-Host "❌ Supabase URL format is invalid" -ForegroundColor Red
    $issues += "Invalid Supabase URL format"
}

# Supabase 키 길이 검증
$supabaseAnonKey = ($envContent | Where-Object { $_ -match "^SUPABASE_ANON_KEY=" }) -replace "SUPABASE_ANON_KEY=", ""
if ($supabaseAnonKey.Length -gt 100) {
    Write-Host "✅ Supabase Anon Key length is valid" -ForegroundColor Green
} else {
    Write-Host "⚠️ Supabase Anon Key might be invalid (too short)" -ForegroundColor Yellow
}

$supabaseServiceKey = ($envContent | Where-Object { $_ -match "^SUPABASE_SERVICE_KEY=" }) -replace "SUPABASE_SERVICE_KEY=", ""
if ($supabaseServiceKey -match "your-.*") {
    Write-Host "❌ Supabase Service Key is placeholder value" -ForegroundColor Red
    $issues += "Supabase Service Key is placeholder"
} elseif ($supabaseServiceKey.Length -gt 100) {
    Write-Host "✅ Supabase Service Key length is valid" -ForegroundColor Green
} else {
    Write-Host "❌ Supabase Service Key is invalid or missing" -ForegroundColor Red
    $issues += "Invalid Supabase Service Key"
}

Write-Host ""
Write-Host "Backend Server Test" -ForegroundColor Cyan

if (-not $DryRun) {
    try {
        $response = Invoke-WebRequest -Uri "http://31.220.83.213:8000/api/health" -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend server is responding" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Backend server responded with status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Backend server connection failed" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        $issues += "Backend server not accessible"
    }
} else {
    Write-Host "DRY RUN: Backend server test simulation" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Summary" -ForegroundColor Cyan

if ($issues.Count -eq 0) {
    Write-Host "🎉 All environment variables are properly configured!" -ForegroundColor Green
    Write-Host "✅ Ready for deployment" -ForegroundColor Green
} else {
    Write-Host "⚠️ Found $($issues.Count) issue(s):" -ForegroundColor Yellow
    foreach ($issue in $issues) {
        Write-Host "   • $issue" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "🔧 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Fix the issues listed above" -ForegroundColor White
    Write-Host "2. Update backend/.env file with correct values" -ForegroundColor White
    Write-Host "3. Restart backend server" -ForegroundColor White
    Write-Host "4. Run this script again to verify" -ForegroundColor White
}

Write-Host ""
Write-Host "Validation completed!" -ForegroundColor Green 