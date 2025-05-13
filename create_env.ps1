$envContent = @"
# Christmas Alpha Test Environment Configuration
# Created: 2025-05-11

# Environment Identifier
CHRISTMAS_ENV=alpha
CHRISTMAS_VERSION=0.1.0-alpha.1

# Service Port Settings
API_PORT=7000
WEB_PORT=4000
NGINX_PORT=7080
PROMETHEUS_PORT=7090
GRAFANA_PORT=7030
TIMESCALEDB_PORT=5532
REDIS_PORT=6479
WEAVIATE_PORT=7800

# Database Settings
DB_USER=christmas_alpha
DB_PASSWORD=alpha_password
DB_NAME=christmas_alpha

# Logging Settings
LOG_LEVEL=DEBUG
"@

# Check if directory exists and create if not
if (-not (Test-Path -Path "environments/alpha")) {
    New-Item -Path "environments/alpha" -ItemType Directory -Force
}

# PowerShell 5.1 호환 방식으로 UTF-8 인코딩 (BOM 없이)
[System.IO.File]::WriteAllText("environments/alpha/.env", $envContent)
Write-Host "Environment variable file created: environments/alpha/.env" 