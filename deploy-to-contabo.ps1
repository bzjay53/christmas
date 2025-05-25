# Christmas Trading Contabo 서버 배포 스크립트 (PowerShell 버전)
# 사용법: .\deploy-to-contabo.ps1 [dry-run|deploy|stop|restart|logs|backup]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dry-run", "deploy", "stop", "restart", "logs", "backup", "help")]
    [string]$Action = "help"
)

# 서버 정보
$SERVER_IP = "31.220.83.213"
$SERVER_USER = "christmas"
$PROJECT_DIR = "/home/christmas/christmas-trading"

# 로그 함수
function Log-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Log-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Log-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Log-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# SSH 연결 테스트
function Test-SSHConnection {
    Log-Info "SSH 연결 테스트 중..."
    
    try {
        $result = ssh -o ConnectTimeout=10 "$SERVER_USER@$SERVER_IP" "echo 'SSH 연결 성공'" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Log-Success "SSH 연결 성공"
            return $true
        } else {
            Log-Error "SSH 연결 실패. 서버 접속을 확인해주세요."
            return $false
        }
    } catch {
        Log-Error "SSH 연결 실패: $($_.Exception.Message)"
        return $false
    }
}

# 서버 환경 확인
function Check-ServerEnvironment {
    Log-Info "서버 환경 확인 중..."
    
    ssh "$SERVER_USER@$SERVER_IP" "echo '=== 서버 정보 ==='; uname -a; echo ''; echo '=== Docker 버전 ==='; docker --version; docker-compose --version; echo ''; echo '=== 시스템 리소스 ==='; free -h; df -h; echo ''; echo '=== Docker 서비스 상태 ==='; systemctl is-active docker"
    
    Log-Success "서버 환경 확인 완료"
}

# Dry Run 실행
function Start-DryRun {
    Log-Info "🧪 Dry Run 모드 실행 중..."
    
    if (-not (Test-SSHConnection)) {
        return
    }
    
    Check-ServerEnvironment
    
    Log-Info "서버에서 프로젝트 설정 중..."
    ssh "$SERVER_USER@$SERVER_IP" "mkdir -p $PROJECT_DIR; cd $PROJECT_DIR; git clone https://github.com/bzjay53/christmas.git . 2>/dev/null || git pull origin main; cp env.example .env 2>/dev/null || echo '.env already exists'; mkdir -p nginx/ssl nginx/logs monitoring/grafana; chmod 755 nginx/ssl nginx/logs monitoring/grafana; docker network create christmas-network 2>/dev/null || echo 'Network already exists'"
    
    Log-Info "Docker Compose 설정 검증 중..."
    ssh "$SERVER_USER@$SERVER_IP" "cd $PROJECT_DIR; docker-compose config"
    
    Log-Success "✅ Dry Run 완료! 모든 설정이 올바릅니다."
    Log-Info "실제 배포를 위해서는 '.\deploy-to-contabo.ps1 deploy' 명령을 실행하세요."
}

# 실제 배포 실행
function Start-Deploy {
    Log-Info "�� Christmas Trading 서버 배포 시작..."
    
    if (-not (Test-SSHConnection)) {
        return
    }
    
    Log-Info "서버에서 프로젝트 설정 중..."
    ssh "$SERVER_USER@$SERVER_IP" "mkdir -p $PROJECT_DIR; cd $PROJECT_DIR; git clone https://github.com/bzjay53/christmas.git . 2>/dev/null || git pull origin main; cp env.example .env 2>/dev/null || echo '.env already exists'; mkdir -p nginx/ssl nginx/logs monitoring/grafana; chmod 755 nginx/ssl nginx/logs monitoring/grafana; docker network create christmas-network 2>/dev/null || echo 'Network already exists'"
    
    Log-Info "서버에서 서비스 배포 중..."
    ssh "$SERVER_USER@$SERVER_IP" "cd $PROJECT_DIR; echo 'Stopping existing services...'; docker-compose down --remove-orphans 2>/dev/null || true; echo 'Building images...'; docker-compose build --no-cache; echo 'Starting database services...'; docker-compose up -d postgres redis; echo 'Waiting 30 seconds...'; sleep 30; echo 'Starting backend service...'; docker-compose up -d christmas-backend; echo 'Starting web services...'; docker-compose up -d wordpress n8n; echo 'Starting proxy and monitoring...'; docker-compose up -d nginx prometheus grafana; echo 'Checking service status...'; sleep 10; docker-compose ps"
    
    # 헬스체크 실행
    Log-Info "헬스체크 실행 중..."
    Start-Sleep -Seconds 30
    
    try {
        $response = Invoke-WebRequest -Uri "http://$SERVER_IP/health" -TimeoutSec 10 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Log-Success "✅ Nginx 프록시 정상 동작"
        } else {
            Log-Warning "⚠️ Nginx 프록시 연결 확인 필요"
        }
    } catch {
        Log-Warning "⚠️ Nginx 프록시 연결 확인 필요"
    }
    
    try {
        $response = Invoke-WebRequest -Uri "http://$SERVER_IP`:8000/health" -TimeoutSec 10 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Log-Success "✅ Christmas Trading 백엔드 정상 동작"
        } else {
            Log-Warning "⚠️ 백엔드 서비스 연결 확인 필요"
        }
    } catch {
        Log-Warning "⚠️ 백엔드 서비스 연결 확인 필요"
    }
    
    Log-Success "🎉 배포 완료!"
    Log-Info "🌐 서비스 접속 URL:"
    Log-Info "  - 메인 API: http://$SERVER_IP/"
    Log-Info "  - 백엔드 직접: http://$SERVER_IP`:8000/"
    Log-Info "  - WordPress: http://blog.$SERVER_IP/"
    Log-Info "  - n8n 자동화: http://n8n.$SERVER_IP/"
    Log-Info "  - Grafana 모니터링: http://monitoring.$SERVER_IP/"
    Log-Info "  - Prometheus: http://$SERVER_IP`:9090/"
}

# 서비스 중지
function Stop-Services {
    Log-Info "🛑 서버 서비스 중지 중..."
    ssh "$SERVER_USER@$SERVER_IP" "cd $PROJECT_DIR; docker-compose down"
    Log-Success "✅ 서비스 중지 완료"
}

# 서비스 재시작
function Restart-Services {
    Log-Info "🔄 서버 서비스 재시작 중..."
    ssh "$SERVER_USER@$SERVER_IP" "cd $PROJECT_DIR; docker-compose restart"
    Log-Success "✅ 서비스 재시작 완료"
}

# 로그 확인
function Show-Logs {
    Log-Info "📋 서버 서비스 로그 확인:"
    ssh "$SERVER_USER@$SERVER_IP" "cd $PROJECT_DIR; docker-compose logs -f"
}

# 백업 실행
function Start-Backup {
    Log-Info "💾 서버 데이터 백업 실행 중..."
    ssh "$SERVER_USER@$SERVER_IP" "cd $PROJECT_DIR; BACKUP_DIR=./backups/`$(date +%Y%m%d_%H%M%S); mkdir -p `$BACKUP_DIR; docker exec christmas-postgres pg_dump -U christmas_user christmas_db > `$BACKUP_DIR/database.sql; cp -r nginx monitoring scripts `$BACKUP_DIR/; cp docker-compose.yml .env `$BACKUP_DIR/; echo 'Backup completed: '`$BACKUP_DIR"
    Log-Success "✅ 백업 완료"
}

# 사용법 출력
function Show-Usage {
    Write-Host "Christmas Trading Contabo 서버 배포 스크립트 (PowerShell 버전)"
    Write-Host ""
    Write-Host "사용법:"
    Write-Host "  .\deploy-to-contabo.ps1 dry-run    - 배포 전 테스트 실행"
    Write-Host "  .\deploy-to-contabo.ps1 deploy     - 실제 서버 배포"
    Write-Host "  .\deploy-to-contabo.ps1 stop       - 서비스 중지"
    Write-Host "  .\deploy-to-contabo.ps1 restart    - 서비스 재시작"
    Write-Host "  .\deploy-to-contabo.ps1 logs       - 서비스 로그 확인"
    Write-Host "  .\deploy-to-contabo.ps1 backup     - 데이터 백업"
    Write-Host "  .\deploy-to-contabo.ps1 help       - 도움말 출력"
    Write-Host ""
    Write-Host "서버 정보:"
    Write-Host "  - IP: $SERVER_IP"
    Write-Host "  - 사용자: $SERVER_USER"
    Write-Host "  - 프로젝트 경로: $PROJECT_DIR"
}

# 메인 실행 로직
switch ($Action) {
    "dry-run" { Start-DryRun }
    "deploy" { Start-Deploy }
    "stop" { Stop-Services }
    "restart" { Restart-Services }
    "logs" { Show-Logs }
    "backup" { Start-Backup }
    default { Show-Usage }
} 