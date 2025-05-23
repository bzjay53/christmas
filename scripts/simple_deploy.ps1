# Christmas Project Simple Production Deploy Script
# ==================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "deploy",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false
)

function Write-Info {
    param($Message)
    Write-Host $Message -ForegroundColor Cyan
}

function Write-Success {
    param($Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host $Message -ForegroundColor Yellow
}

function Write-ErrorMsg {
    param($Message)
    Write-Host $Message -ForegroundColor Red
}

function Show-Banner {
    Write-Info "======================================================"
    Write-Info "          Christmas Project Deployment"
    Write-Info "======================================================"
}

function Test-Requirements {
    Write-Info "Checking prerequisites..."
    
    # Check Docker
    try {
        $dockerVersion = docker --version
        Write-Success "Docker is installed: $dockerVersion"
    } catch {
        Write-ErrorMsg "Docker is not installed or not accessible"
        return $false
    }
    
    # Check Docker Compose
    try {
        $composeVersion = docker-compose --version
        Write-Success "Docker Compose is installed: $composeVersion"
    } catch {
        Write-ErrorMsg "Docker Compose is not installed or not accessible"
        return $false
    }
    
    # Check Docker daemon
    try {
        docker info | Out-Null
        Write-Success "Docker daemon is running"
    } catch {
        Write-ErrorMsg "Docker daemon is not running"
        return $false
    }
    
    return $true
}

function Stop-AllServices {
    Write-Info "Stopping existing services..."
    
    if ($DryRun) {
        Write-Info "[DRY RUN] Would stop services"
        return
    }
    
    try {
        docker-compose down --timeout 30
        Write-Success "Services stopped successfully"
    } catch {
        Write-Warning "Some services may not have stopped cleanly"
    }
}

function Build-AllImages {
    Write-Info "Building Docker images..."
    
    if ($DryRun) {
        Write-Info "[DRY RUN] Would build images"
        return
    }
    
    try {
        docker-compose build --no-cache
        Write-Success "Images built successfully"
    } catch {
        Write-ErrorMsg "Failed to build images"
        throw
    }
}

function Start-AllServices {
    Write-Info "Starting services..."
    
    if ($DryRun) {
        Write-Info "[DRY RUN] Would start services"
        return
    }
    
    try {
        docker-compose up -d
        Write-Success "Services started successfully"
    } catch {
        Write-ErrorMsg "Failed to start services"
        throw
    }
}

function Test-ServiceHealth {
    Write-Info "Checking service health..."
    
    if ($DryRun) {
        Write-Info "[DRY RUN] Would check service health"
        return
    }
    
    Start-Sleep -Seconds 10
    
    try {
        $containers = docker-compose ps -q
        if ($containers) {
            Write-Success "Containers are running"
        } else {
            Write-Warning "No containers found"
        }
    } catch {
        Write-Warning "Health check failed"
    }
}

function Show-ServiceStatus {
    Write-Info "Service status:"
    
    try {
        docker-compose ps
    } catch {
        Write-Warning "Could not get service status"
    }
}

function Deploy-Production {
    Write-Info "Starting production deployment..."
    
    if (-not (Test-Requirements)) {
        Write-ErrorMsg "Prerequisites not met. Exiting."
        exit 1
    }
    
    Stop-AllServices
    Build-AllImages
    Start-AllServices
    Test-ServiceHealth
    Show-ServiceStatus
    
    Write-Success ""
    Write-Success "Deployment completed!"
    Write-Success ""
    Write-Success "Services are available at:"
    Write-Success "  API: http://localhost:8000"
    Write-Success "  Grafana: http://localhost:3000"
    Write-Success "  Prometheus: http://localhost:9090"
    Write-Success ""
}

# Main execution
Show-Banner

switch ($Action.ToLower()) {
    "deploy" {
        Deploy-Production
    }
    
    "stop" {
        Stop-AllServices
        Write-Success "Services stopped"
    }
    
    "start" {
        Start-AllServices
        Test-ServiceHealth
        Write-Success "Services started"
    }
    
    "status" {
        Show-ServiceStatus
    }
    
    default {
        Write-ErrorMsg "Unknown action: $Action"
        Write-Info "Available actions: deploy, stop, start, status"
        exit 1
    }
} 