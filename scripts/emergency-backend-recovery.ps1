# Christmas Trading Backend Emergency Recovery Script
# 2025-05-27 - PM AI Assistant

Write-Host "🚨 Christmas Trading Backend Emergency Recovery Started" -ForegroundColor Red
Write-Host "=" * 60

# 1. 현재 상황 확인
Write-Host "`n1. Current Status Check" -ForegroundColor Yellow
$currentDir = Get-Location
Write-Host "Current Directory: $currentDir"

# 필수 파일 존재 확인
$requiredFiles = @(
    "backend/env.txt",
    "backend/package.json", 
    "backend/server.js",
    "docker-compose.yml"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
        exit 1
    }
}

# 2. 환경변수 상태 확인
Write-Host "`n2. Environment Variables Check" -ForegroundColor Yellow
$envContent = Get-Content "backend/env.txt" -Raw

# 중요 환경변수 확인
$envVars = @{
    "SUPABASE_URL" = $envContent -match "SUPABASE_URL=(.+)"
    "SUPABASE_ANON_KEY" = $envContent -match "SUPABASE_ANON_KEY=(.+)"
    "SUPABASE_SERVICE_KEY" = $envContent -match "SUPABASE_SERVICE_KEY=(.+)"
    "JWT_SECRET" = $envContent -match "JWT_SECRET=(.+)"
    "PORT" = $envContent -match "PORT=(.+)"
}

foreach ($var in $envVars.GetEnumerator()) {
    if ($var.Value) {
        $value = ($envContent | Select-String $var.Key).Line.Split('=')[1]
        if ($value -eq "your-supabase-service-role-key" -or $value -eq "placeholder") {
            Write-Host "⚠️ $($var.Key): Placeholder value detected" -ForegroundColor Yellow
        } else {
            Write-Host "✅ $($var.Key): Configured" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ $($var.Key): Missing" -ForegroundColor Red
    }
}

# 3. 백엔드 서버 연결 테스트
Write-Host "`n3. Backend Server Connection Test" -ForegroundColor Yellow
Write-Host "Testing backend server connection..."

try {
    $response = Invoke-WebRequest -Uri "http://31.220.83.213:8000/health" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Backend server responding: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend server no response: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. 복구 액션 가이드
Write-Host "`n4. Recovery Action Guide" -ForegroundColor Yellow
Write-Host "🔧 Required Actions:" -ForegroundColor Cyan

Write-Host "`nStep 1: SSH Connection to Server"
Write-Host "Command: ssh root@31.220.83.213" -ForegroundColor White

Write-Host "`nStep 2: Navigate to Project Directory"
Write-Host "Command: cd /root/christmas-trading" -ForegroundColor White

Write-Host "`nStep 3: Check Current Status"
Write-Host "Commands:" -ForegroundColor White
Write-Host "  docker-compose ps" -ForegroundColor Gray
Write-Host "  docker-compose logs backend" -ForegroundColor Gray

Write-Host "`nStep 4: Update Environment Variables"
Write-Host "Commands:" -ForegroundColor White
Write-Host "  cp .env .env.backup" -ForegroundColor Gray
Write-Host "  nano .env" -ForegroundColor Gray
Write-Host "  # Update SUPABASE_SERVICE_KEY with real value" -ForegroundColor Gray

Write-Host "`nStep 5: Restart Docker Services"
Write-Host "Commands:" -ForegroundColor White
Write-Host "  docker-compose down" -ForegroundColor Gray
Write-Host "  docker-compose up -d --build" -ForegroundColor Gray
Write-Host "  docker-compose logs -f backend" -ForegroundColor Gray

Write-Host "`nStep 6: Verify Recovery"
Write-Host "Commands:" -ForegroundColor White
Write-Host "  curl http://localhost:8000/health" -ForegroundColor Gray
Write-Host "  curl http://31.220.83.213:8000/health" -ForegroundColor Gray

# 5. 자동 복구 시도 (로컬에서 가능한 부분)
Write-Host "`n5. Local Recovery Preparation" -ForegroundColor Yellow

# Git 상태 확인
Write-Host "Git status check..."
try {
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "⚠️ Uncommitted changes exist:" -ForegroundColor Yellow
        git status --short
    } else {
        Write-Host "✅ Git status clean" -ForegroundColor Green
    }
    
    $currentBranch = git branch --show-current
    $lastCommit = git log -1 --oneline
    Write-Host "Current branch: $currentBranch"
    Write-Host "Last commit: $lastCommit"
} catch {
    Write-Host "❌ Git command failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. 모니터링 스크립트 생성
Write-Host "`n6. Creating Monitoring Script" -ForegroundColor Yellow

$monitoringScript = @"
#!/bin/bash
# Auto-generated monitoring script for Christmas Trading Backend

echo "🔍 Christmas Trading Backend Health Monitor"
echo "Starting continuous monitoring..."

while true; do
    timestamp=`$(date '+%Y-%m-%d %H:%M:%S')`
    
    # Health check
    response=`$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null)`
    
    if [ "`$response" = "200" ]; then
        echo "`$timestamp - ✅ Backend healthy (HTTP 200)"
    else
        echo "`$timestamp - ❌ Backend unhealthy (HTTP `$response)"
        
        # Attempt restart
        echo "`$timestamp - 🔄 Attempting automatic restart..."
        docker-compose restart backend
        sleep 30
        
        # Verify restart
        response=`$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null)`
        if [ "`$response" = "200" ]; then
            echo "`$timestamp - ✅ Restart successful"
        else
            echo "`$timestamp - ❌ Restart failed - Manual intervention required"
        fi
    fi
    
    sleep 300  # Check every 5 minutes
done
"@

$monitoringScript | Out-File -FilePath "scripts/backend-monitor.sh" -Encoding UTF8
Write-Host "✅ Monitoring script created: scripts/backend-monitor.sh" -ForegroundColor Green

# 7. 환경변수 검증 스크립트 생성
Write-Host "`n7. Creating Environment Validation Script" -ForegroundColor Yellow

$envValidationScript = @"
// Auto-generated environment validation for Christmas Trading Backend
// 2025-05-27 - PM AI Assistant

const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_KEY',
    'JWT_SECRET',
    'PORT'
];

const placeholderValues = [
    'your-supabase-service-role-key',
    'your-jwt-secret',
    'placeholder',
    'change-me',
    'example'
];

const validateEnvironment = () => {
    console.log('🔍 Validating environment variables...');
    
    // Check for missing variables
    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:', missing);
        process.exit(1);
    }
    
    // Check for placeholder values
    for (const envVar of requiredEnvVars) {
        const value = process.env[envVar];
        if (placeholderValues.some(placeholder => value.includes(placeholder))) {
            console.error(`❌ Environment variable `${envVar}` contains placeholder value: `${value}`);
            process.exit(1);
        }
    }
    
    console.log('✅ All environment variables validated successfully');
    return true;
};

// Export for use in main application
module.exports = { validateEnvironment };

// Run validation if called directly
if (require.main === module) {
    validateEnvironment();
}
"@

$envValidationScript | Out-File -FilePath "backend/config/validateEnv.js" -Encoding UTF8
Write-Host "✅ Environment validation script created: backend/config/validateEnv.js" -ForegroundColor Green

# 8. 복구 요약
Write-Host "`n8. Recovery Summary" -ForegroundColor Yellow
Write-Host "📋 Recovery Work Plan:" -ForegroundColor Cyan

Write-Host "`n1. Critical Issues to Fix:"
Write-Host "   - SUPABASE_SERVICE_KEY needs real value"
Write-Host "   - Backend server Docker container restart"
Write-Host "   - Database strategy_type column addition"

Write-Host "`n2. Estimated Work Time:"
Write-Host "   - Server recovery: 30 minutes"
Write-Host "   - Database modification: 20 minutes"
Write-Host "   - Frontend environment variables: 30 minutes"
Write-Host "   - Testing and verification: 40 minutes"

Write-Host "`n3. Success Criteria:"
Write-Host "   - Backend server 200 OK response"
Write-Host "   - Frontend login success"
Write-Host "   - Dashboard data loading"
Write-Host "   - API connection stability"

Write-Host "`n🚨 Emergency Recovery Script Completed!" -ForegroundColor Red
Write-Host "Next step: Execute server recovery commands manually via SSH" -ForegroundColor Yellow
Write-Host "=" * 60 