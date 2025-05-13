$envContent = @"
# Christmas Beta Test Environment Configuration
# Created: 2025-05-25

# Environment Identifier
CHRISTMAS_ENV=beta
CHRISTMAS_VERSION=0.2.0-beta.1

# Service Port Settings
API_PORT=7001
WEB_PORT=4001
NGINX_PORT=7081
PROMETHEUS_PORT=7091
GRAFANA_PORT=7031
TIMESCALEDB_PORT=5533
REDIS_PORT=6480
WEAVIATE_PORT=7801
ELASTICSEARCH_PORT=9200
KIBANA_PORT=5601
MATOMO_PORT=8080
JAEGER_UI_PORT=16686
JAEGER_COLLECTOR_PORT=14268

# Database Settings
DB_USER=christmas_beta
DB_PASSWORD=beta_password
DB_NAME=christmas_beta

# Logging Settings
LOG_LEVEL=INFO

# Monitoring Settings
ENABLE_PROFILING=true
ENABLE_USAGE_TRACKING=true
ENABLE_TRACING=true
SENTRY_DSN=https://example@sentry.io/beta

# Telegram Bot Settings
TELEGRAM_BOT_TOKEN=beta_test_token

# Korea Investment API Settings
KIS_MOCK_APP_KEY=your_mock_app_key
KIS_MOCK_APP_SECRET=your_mock_app_secret
KIS_MOCK_ACCOUNT=your_mock_account
KIS_REAL_APP_KEY=your_real_app_key
KIS_REAL_APP_SECRET=your_real_app_secret
KIS_REAL_ACCOUNT=your_real_account

# Security Settings
FLASK_SECRET_KEY=beta_secret_key
"@

# Check if directory exists and create if not
if (-not (Test-Path -Path "environments/beta")) {
    New-Item -Path "environments/beta" -ItemType Directory -Force
}

# PowerShell 5.1 compatible UTF-8 encoding (without BOM)
[System.IO.File]::WriteAllText("environments/beta/.env", $envContent)
Write-Host "Beta environment variable file created: environments/beta/.env"

# Important instructions
Write-Host "Important: Please enter actual API keys in the generated .env file."
Write-Host "  - Korea Investment Securities mock/real API keys"
Write-Host "  - Telegram bot token" 