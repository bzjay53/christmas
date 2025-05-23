# Christmas 프로젝트 프로덕션 배포 스크립트
# ============================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "deploy",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBackup = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false,
    
    [Parameter(Mandatory=$false)]
    [string]$Version = "latest"
)

# 색상 출력 함수
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    } else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success { Write-ColorOutput Green $args }
function Write-Warning { Write-ColorOutput Yellow $args }
function Write-Error { Write-ColorOutput Red $args }
function Write-Info { Write-ColorOutput Cyan $args }

# 로고 출력
function Show-Logo {
    Write-Info "╔═══════════════════════════════════════════════════════════╗"
    Write-Info "║                    Christmas Project                      ║"
    Write-Info "║                 Production Deployment                     ║"
    Write-Info "╚═══════════════════════════════════════════════════════════╝"
}

# 사전 검사
function Test-Prerequisites {
    Write-Info "🔍 사전 요구사항 검사 중..."
    
    $prerequisites = @(
        @{ Name = "Docker"; Command = "docker --version" },
        @{ Name = "Docker Compose"; Command = "docker-compose --version" },
        @{ Name = "Git"; Command = "git --version" }
    )
    
    $missing = @()
    
    foreach ($prereq in $prerequisites) {
        try {
            Invoke-Expression $prereq.Command | Out-Null
            Write-Success "✅ $($prereq.Name) 설치됨"
        } catch {
            Write-Error "❌ $($prereq.Name) 누락"
            $missing += $prereq.Name
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Error "누락된 요구사항: $($missing -join ', ')"
        exit 1
    }
    
    # 환경 변수 파일 확인
    if (-not (Test-Path ".env.production")) {
        Write-Warning "⚠️  .env.production 파일이 없습니다."
        Write-Info "config/production.env.template을 .env.production으로 복사하고 값을 설정하세요."
        
        if (-not $Force) {
            $response = Read-Host "계속하시겠습니까? (y/N)"
            if ($response -ne "y" -and $response -ne "Y") {
                exit 1
            }
        }
    }
    
    # Docker 상태 확인
    try {
        docker info | Out-Null
        Write-Success "✅ Docker 데몬 실행 중"
    } catch {
        Write-Error "❌ Docker 데몬이 실행되지 않음"
        exit 1
    }
}

# 백업 생성
function New-Backup {
    if ($SkipBackup) {
        Write-Warning "⚠️  백업 건너뛰기"
        return
    }
    
    Write-Info "💾 백업 생성 중..."
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupDir = "backups/production_$timestamp"
    
    New-Item -ItemType Directory -Force -Path $backupDir
    
    # 설정 파일 백업
    if (Test-Path ".env.production") {
        Copy-Item ".env.production" "$backupDir/.env.production.bak"
    }
    
    # 로그 백업
    if (Test-Path "logs") {
        Copy-Item -Recurse "logs" "$backupDir/logs"
    }
    
    # Docker 볼륨 백업 (필요 시)
    Write-Info "🗃️  데이터베이스 백업 중..."
    try {
        docker-compose -f docker-compose.prod.yml exec -T timescaledb pg_dump -U christmas_prod christmas_prod > "$backupDir/database_backup.sql"
        Write-Success "✅ 데이터베이스 백업 완료"
    } catch {
        Write-Warning "⚠️  데이터베이스 백업 실패: $($_.Exception.Message)"
    }
    
    Write-Success "✅ 백업 완료: $backupDir"
}

# 서비스 중지
function Stop-Services {
    Write-Info "🛑 기존 서비스 중지 중..."
    
    try {
        docker-compose -f docker-compose.prod.yml down --timeout 30
        Write-Success "✅ 서비스 중지 완료"
    } catch {
        Write-Warning "⚠️  서비스 중지 중 일부 오류 발생: $($_.Exception.Message)"
    }
}

# 이미지 빌드
function Build-Images {
    Write-Info "🔨 Docker 이미지 빌드 중..."
    
    if ($DryRun) {
        Write-Info "🔍 [DRY RUN] 이미지 빌드 시뮬레이션"
        return
    }
    
    try {
        docker-compose -f docker-compose.prod.yml build --no-cache
        Write-Success "✅ 이미지 빌드 완료"
    } catch {
        Write-Error "❌ 이미지 빌드 실패: $($_.Exception.Message)"
        exit 1
    }
}

# 서비스 시작
function Start-Services {
    Write-Info "🚀 서비스 시작 중..."
    
    if ($DryRun) {
        Write-Info "🔍 [DRY RUN] 서비스 시작 시뮬레이션"
        return
    }
    
    try {
        docker-compose -f docker-compose.prod.yml up -d
        Write-Success "✅ 서비스 시작 완료"
    } catch {
        Write-Error "❌ 서비스 시작 실패: $($_.Exception.Message)"
        exit 1
    }
}

# 헬스 체크
function Test-Health {
    Write-Info "🏥 서비스 헬스 체크 중..."
    
    if ($DryRun) {
        Write-Info "🔍 [DRY RUN] 헬스 체크 시뮬레이션"
        return
    }
    
    $services = @("api", "timescaledb", "redis", "prometheus", "grafana")
    $maxRetries = 30
    $retryCount = 0
    
    while ($retryCount -lt $maxRetries) {
        $healthyServices = 0
        
        foreach ($service in $services) {
            try {
                $status = docker-compose -f docker-compose.prod.yml ps -q $service | ForEach-Object { docker inspect $_ --format='{{.State.Health.Status}}' }
                if ($status -eq "healthy" -or $service -eq "api") {
                    $healthyServices++
                }
            } catch {
                # 서비스가 헬스체크를 지원하지 않는 경우
                $healthyServices++
            }
        }
        
        if ($healthyServices -eq $services.Count) {
            Write-Success "✅ 모든 서비스가 정상 상태입니다"
            return
        }
        
        Write-Info "⏳ 서비스 준비 중... ($($retryCount + 1)/$maxRetries)"
        Start-Sleep -Seconds 10
        $retryCount++
    }
    
    Write-Warning "⚠️  일부 서비스가 아직 준비되지 않았습니다"
}

# 배포 후 검증
function Test-Deployment {
    Write-Info "🧪 배포 검증 중..."
    
    if ($DryRun) {
        Write-Info "🔍 [DRY RUN] 배포 검증 시뮬레이션"
        return
    }
    
    # API 엔드포인트 테스트
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 10
        if ($response.status -eq "ok") {
            Write-Success "✅ API 서비스 정상"
        } else {
            Write-Warning "⚠️  API 서비스 응답 이상: $($response.status)"
        }
    } catch {
        Write-Warning "⚠️  API 서비스 접근 실패: $($_.Exception.Message)"
    }
    
    # Prometheus 테스트
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:9090/-/healthy" -TimeoutSec 10
        Write-Success "✅ Prometheus 서비스 정상"
    } catch {
        Write-Warning "⚠️  Prometheus 서비스 접근 실패: $($_.Exception.Message)"
    }
    
    # Grafana 테스트
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "✅ Grafana 서비스 정상"
        }
    } catch {
        Write-Warning "⚠️  Grafana 서비스 접근 실패: $($_.Exception.Message)"
    }
}

# 로그 표시
function Show-Logs {
    Write-Info "📋 최근 로그 표시 중..."
    
    if ($DryRun) {
        Write-Info "🔍 [DRY RUN] 로그 표시 시뮬레이션"
        return
    }
    
    try {
        docker-compose -f docker-compose.prod.yml logs --tail=50
    } catch {
        Write-Warning "⚠️  로그 표시 중 오류: $($_.Exception.Message)"
    }
}

# 상태 표시
function Show-Status {
    Write-Info "📊 서비스 상태 표시 중..."
    
    try {
        docker-compose -f docker-compose.prod.yml ps
    } catch {
        Write-Warning "⚠️  상태 표시 중 오류: $($_.Exception.Message)"
    }
}

# 메인 실행 로직
function Main {
    Show-Logo
    
    switch ($Action.ToLower()) {
        "deploy" {
            Test-Prerequisites
            New-Backup
            Stop-Services
            Build-Images
            Start-Services
            Test-Health
            Test-Deployment
            Show-Status
            
            Write-Success ""
            Write-Success "🎉 배포 완료!"
            Write-Success ""
            Write-Success "서비스 접근 정보:"
            Write-Success "  API: http://localhost:8000"
            Write-Success "  Grafana: http://localhost:3000 (admin/admin)"
            Write-Success "  Prometheus: http://localhost:9090"
            Write-Success ""
            Write-Success "다음 명령어로 상태를 확인할 수 있습니다:"
            Write-Success "  .\scripts\production_deploy.ps1 -Action status"
            Write-Success "  .\scripts\production_deploy.ps1 -Action logs"
        }
        
        "stop" {
            Stop-Services
            Write-Success "✅ 서비스 중지 완료"
        }
        
        "start" {
            Start-Services
            Test-Health
            Write-Success "✅ 서비스 시작 완료"
        }
        
        "restart" {
            Stop-Services
            Start-Services
            Test-Health
            Write-Success "✅ 서비스 재시작 완료"
        }
        
        "status" {
            Show-Status
        }
        
        "logs" {
            Show-Logs
        }
        
        "health" {
            Test-Health
        }
        
        "backup" {
            New-Backup
        }
        
        default {
            Write-Error "지원하지 않는 액션: $Action"
            Write-Info "사용 가능한 액션: deploy, stop, start, restart, status, logs, health, backup"
            exit 1
        }
    }
}

# 스크립트 실행
try {
    Main
} catch {
    Write-Error "스크립트 실행 중 오류: $($_.Exception.Message)"
    exit 1
} 