# Christmas Trading Emergency Fixes Test Script

param([switch]$DryRun = $false)

Write-Host "Christmas Trading Emergency Fixes Test" -ForegroundColor Green

if ($DryRun) {
    Write-Host "DRY RUN Mode" -ForegroundColor Yellow
}

# 1. Environment Check
Write-Host "`nEnvironment Check" -ForegroundColor Cyan

$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "Node.js not found" -ForegroundColor Red
    exit 1
}

# 2. Directory Check
if (Test-Path "web-dashboard") {
    Write-Host "Frontend directory exists" -ForegroundColor Green
} else {
    Write-Host "web-dashboard not found" -ForegroundColor Red
    exit 1
}

if (Test-Path "backend") {
    Write-Host "Backend directory exists" -ForegroundColor Green
} else {
    Write-Host "backend not found" -ForegroundColor Red
    exit 1
}

# 3. Backend Syntax Check
Write-Host "`nBackend Syntax Check" -ForegroundColor Cyan

$backendFiles = @("backend/server.js", "backend/services/supabaseAuth.js")

foreach ($file in $backendFiles) {
    if (Test-Path $file) {
        Write-Host "Checking $file..." -ForegroundColor Yellow
        if (-not $DryRun) {
            node --check $file
            if ($LASTEXITCODE -eq 0) {
                Write-Host "$file syntax OK" -ForegroundColor Green
            } else {
                Write-Host "$file syntax error" -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "DRY RUN: $file check simulation" -ForegroundColor Yellow
        }
    } else {
        Write-Host "$file not found" -ForegroundColor Yellow
    }
}

# 4. Schema File Check
Write-Host "`nSchema File Check" -ForegroundColor Cyan

if (Test-Path "scripts/fix-supabase-schema.sql") {
    Write-Host "Supabase schema fix script exists" -ForegroundColor Green
} else {
    Write-Host "Schema script not found" -ForegroundColor Red
}

# 5. Backend Server Test
Write-Host "`nBackend Server Test" -ForegroundColor Cyan

$backendUrl = "http://31.220.83.213:8000"

if (-not $DryRun) {
    try {
        $response = Invoke-RestMethod -Uri "$backendUrl/" -Method GET -TimeoutSec 10
        if ($response) {
            Write-Host "Backend server connection OK" -ForegroundColor Green
        }
    } catch {
        Write-Host "Backend server connection failed" -ForegroundColor Red
    }

    try {
        $healthResponse = Invoke-RestMethod -Uri "$backendUrl/api/health" -Method GET -TimeoutSec 10
        if ($healthResponse -and $healthResponse.status -eq "healthy") {
            Write-Host "Health Check API OK" -ForegroundColor Green
        } else {
            Write-Host "Health Check API response abnormal" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Health Check API failed" -ForegroundColor Red
    }
} else {
    Write-Host "DRY RUN: Server connection test simulation" -ForegroundColor Yellow
}

Write-Host "`nTest completed!" -ForegroundColor Green 