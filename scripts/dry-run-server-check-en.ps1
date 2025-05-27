# Christmas Trading Server Recovery Dry Run Test
# Environment verification script before actual recovery

Write-Host "Christmas Trading Server Recovery Dry Run Test Started" -ForegroundColor Cyan
Write-Host "=" * 60

# 1. Local Environment Verification
Write-Host "`n1. Local Environment Verification" -ForegroundColor Yellow

$currentDir = Get-Location
Write-Host "Current Directory: $currentDir"

# Check required files
$requiredFiles = @(
    "backend/env.txt",
    "backend/package.json", 
    "backend/server.js",
    "docker-compose.yml",
    "scripts/fix-strategy-type-column.sql"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "OK $file exists" -ForegroundColor Green
    } else {
        Write-Host "MISSING $file" -ForegroundColor Red
    }
}

# 2. Environment Variables Verification
Write-Host "`n2. Environment Variables Verification" -ForegroundColor Yellow

if (Test-Path "backend/env.txt") {
    $envContent = Get-Content "backend/env.txt"
    
    $criticalVars = @(
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY", 
        "SUPABASE_SERVICE_KEY",
        "PORT",
        "JWT_SECRET"
    )
    
    foreach ($var in $criticalVars) {
        $found = $envContent | Where-Object { $_ -like "$var=*" }
        if ($found) {
            $value = ($found -split "=", 2)[1]
            if ($value -like "*your-*" -or $value -like "*placeholder*") {
                Write-Host "WARNING ${var}: Placeholder value detected" -ForegroundColor Yellow
            } else {
                Write-Host "OK ${var}: Configured" -ForegroundColor Green
            }
        } else {
            Write-Host "MISSING ${var}: Not found" -ForegroundColor Red
        }
    }
}

# 3. Network Connection Test
Write-Host "`n3. Network Connection Test" -ForegroundColor Yellow

Write-Host "Testing backend server connection..."
try {
    $response = Invoke-WebRequest -Uri "http://31.220.83.213:8000/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "OK Backend server response: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "FAILED Backend server no response: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Testing Supabase connection..."
try {
    $supabaseUrl = "https://qehzzsxzjijfzqkysazc.supabase.co"
    $response = Invoke-WebRequest -Uri "$supabaseUrl/rest/v1/" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "OK Supabase connection success: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "FAILED Supabase connection failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Git Status Check
Write-Host "`n4. Git Status Check" -ForegroundColor Yellow

try {
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "WARNING Uncommitted changes exist:" -ForegroundColor Yellow
        $gitStatus | ForEach-Object { Write-Host "   $_" }
    } else {
        Write-Host "OK Git status clean" -ForegroundColor Green
    }
    
    $currentBranch = git branch --show-current
    Write-Host "Current branch: $currentBranch"
    
    $lastCommit = git log -1 --oneline
    Write-Host "Last commit: $lastCommit"
} catch {
    Write-Host "FAILED Git status check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Recovery Plan Summary
Write-Host "`n5. Recovery Plan Summary" -ForegroundColor Yellow

Write-Host "Recovery Work Plan:" -ForegroundColor White
Write-Host ""
Write-Host "1. Critical Issues to Fix:"
Write-Host "   - SUPABASE_SERVICE_KEY needs real value"
Write-Host "   - Backend server Docker container restart"
Write-Host "   - Database strategy_type column addition"
Write-Host ""
Write-Host "2. Estimated Work Time:"
Write-Host "   - Server recovery: 30 minutes"
Write-Host "   - Database modification: 20 minutes"
Write-Host "   - Frontend environment variables: 30 minutes"
Write-Host "   - Testing and verification: 40 minutes"
Write-Host ""
Write-Host "3. Success Criteria:"
Write-Host "   - Backend server 200 OK response"
Write-Host "   - Frontend login success"
Write-Host "   - Dashboard data loading"
Write-Host "   - API connection stability"

Write-Host "`nDry Run Test Completed!" -ForegroundColor Cyan
Write-Host "Ready to proceed with actual recovery work." -ForegroundColor Green 