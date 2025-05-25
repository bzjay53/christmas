# Christmas Trading Contabo Server Deployment Script (Simple Version)
param([string]$Action = "help")

$SERVER_IP = "31.220.83.213"
$SERVER_USER = "root"

function Log-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Blue }
function Log-Success($msg) { Write-Host "[SUCCESS] $msg" -ForegroundColor Green }
function Log-Error($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

if ($Action -eq "dry-run") {
    Log-Info "Starting Dry Run mode..."
    
    # SSH connection test
    Log-Info "Testing SSH connection..."
    $result = ssh -o ConnectTimeout=10 "$SERVER_USER@$SERVER_IP" "echo 'SSH connection successful'"
    if ($LASTEXITCODE -eq 0) {
        Log-Success "SSH connection successful"
    } else {
        Log-Error "SSH connection failed"
        exit 1
    }
    
    # Check server environment
    Log-Info "Checking server environment..."
    ssh "$SERVER_USER@$SERVER_IP" "uname -a; docker --version; docker-compose --version"
    
    # Setup project
    Log-Info "Setting up project..."
    ssh "$SERVER_USER@$SERVER_IP" "mkdir -p /root/christmas-trading; cd /root/christmas-trading; git clone https://github.com/bzjay53/christmas.git . || git pull origin main"
    
    # Validate Docker Compose
    Log-Info "Validating Docker Compose configuration..."
    ssh "$SERVER_USER@$SERVER_IP" "cd /root/christmas-trading; docker-compose config"
    
    Log-Success "Dry Run completed successfully!"
}
elseif ($Action -eq "deploy") {
    Log-Info "Starting actual deployment..."
    
    # SSH connection test
    $result = ssh -o ConnectTimeout=10 "$SERVER_USER@$SERVER_IP" "echo 'SSH connection successful'"
    if ($LASTEXITCODE -ne 0) {
        Log-Error "SSH connection failed"
        exit 1
    }
    
    # Setup project
    Log-Info "Setting up project..."
    ssh "$SERVER_USER@$SERVER_IP" "mkdir -p /root/christmas-trading; cd /root/christmas-trading; git clone https://github.com/bzjay53/christmas.git . || git pull origin main; mkdir -p nginx/ssl nginx/logs monitoring/grafana"
    
    # Deploy Docker services
    Log-Info "Deploying Docker services..."
    ssh "$SERVER_USER@$SERVER_IP" "cd /root/christmas-trading; docker-compose down; docker-compose build; docker-compose up -d"
    
    # Health check
    Log-Info "Running health check..."
    Start-Sleep -Seconds 30
    
    try {
        $response = Invoke-WebRequest -Uri "http://$SERVER_IP/health" -TimeoutSec 10 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Log-Success "Service is running normally"
        }
    } catch {
        Log-Error "Service connection needs verification"
    }
    
    Log-Success "Deployment completed!"
    Log-Info "Service URL: http://$SERVER_IP/"
}
else {
    Write-Host "Usage:"
    Write-Host "  .\deploy-simple.ps1 dry-run  - Test deployment"
    Write-Host "  .\deploy-simple.ps1 deploy   - Actual deployment"
} 