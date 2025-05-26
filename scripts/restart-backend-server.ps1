# Christmas Trading Backend Server Restart Script
# 31.220.83.213 Server Docker Container Management

Write-Host "Christmas Trading Backend Server Restart Starting..." -ForegroundColor Yellow

# Server Information
$SERVER_IP = "31.220.83.213"
$CONTAINER_NAME = "christmas-backend-production"
$IMAGE_NAME = "christmas-backend-production"

Write-Host "Checking Current Server Status..." -ForegroundColor Cyan

# 1. Check Current Container Status
Write-Host "1. Container Status Check" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://$SERVER_IP:8000/" -Method GET -TimeoutSec 5
    Write-Host "Server Response: OK" -ForegroundColor Green
    Write-Host "Current Status: $($response.status)" -ForegroundColor White
} catch {
    Write-Host "Server Response: FAILED - Restart Required" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. SSH Connection and Docker Commands Guide
Write-Host ""
Write-Host "2. Server Restart Commands" -ForegroundColor Green
Write-Host "Execute the following commands on 31.220.83.213 server:" -ForegroundColor Yellow

Write-Host "# 1. Stop current container" -ForegroundColor White
Write-Host "docker stop $CONTAINER_NAME" -ForegroundColor Cyan

Write-Host "# 2. Remove container" -ForegroundColor White
Write-Host "docker rm $CONTAINER_NAME" -ForegroundColor Cyan

Write-Host "# 3. Run new container" -ForegroundColor White
Write-Host "docker run -d --name $CONTAINER_NAME -p 8000:8000 --env-file /root/christmas-trading/.env.docker --restart unless-stopped $IMAGE_NAME" -ForegroundColor Cyan

Write-Host "# 4. Check container logs" -ForegroundColor White
Write-Host "docker logs -f $CONTAINER_NAME" -ForegroundColor Cyan

# 3. Server Status Check Function
function Test-ServerStatus {
    Write-Host ""
    Write-Host "3. Server Status Recheck" -ForegroundColor Green
    
    $maxAttempts = 10
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        Write-Host "Attempt $attempt/$maxAttempts..." -ForegroundColor Cyan
        
        try {
            $response = Invoke-RestMethod -Uri "http://$SERVER_IP:8000/api/health" -Method GET -TimeoutSec 5
            Write-Host "Health Check: SUCCESS!" -ForegroundColor Green
            Write-Host "Status: $($response.status)" -ForegroundColor White
            Write-Host "Database: $($response.database)" -ForegroundColor White
            Write-Host "Uptime: $($response.uptime) seconds" -ForegroundColor White
            return $true
        } catch {
            Write-Host "Attempt $attempt failed: $($_.Exception.Message)" -ForegroundColor Red
            Start-Sleep -Seconds 10
            $attempt++
        }
    }
    
    Write-Host "Server restart failed - Manual check required" -ForegroundColor Red
    return $false
}

# 4. API Endpoints Test
function Test-ApiEndpoints {
    Write-Host ""
    Write-Host "4. API Endpoints Test" -ForegroundColor Green
    
    $endpoints = @(
        @{ Name = "Root"; Url = "http://$SERVER_IP:8000/" },
        @{ Name = "Health Check"; Url = "http://$SERVER_IP:8000/api/health" },
        @{ Name = "Database Status"; Url = "http://$SERVER_IP:8000/api/database-status" }
    )
    
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-RestMethod -Uri $endpoint.Url -Method GET -TimeoutSec 5
            Write-Host "$($endpoint.Name): SUCCESS" -ForegroundColor Green
        } catch {
            Write-Host "$($endpoint.Name): FAILED" -ForegroundColor Red
        }
    }
}

# 5. Wait for User Input
Write-Host ""
Write-Host "After server restart completion, enter 'y' to start status check..." -ForegroundColor Yellow
$userInput = Read-Host "Is restart completed? (y/n)"

if ($userInput -eq 'y' -or $userInput -eq 'Y') {
    $serverStatus = Test-ServerStatus
    
    if ($serverStatus) {
        Test-ApiEndpoints
        Write-Host ""
        Write-Host "Backend Server Restart Complete!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Server Restart Failed - Log Check Required" -ForegroundColor Red
    }
} else {
    Write-Host "Please run again after completing the restart." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Verify Supabase table creation" -ForegroundColor White
Write-Host "2. Test signup API" -ForegroundColor White
Write-Host "3. Test login API" -ForegroundColor White
Write-Host "4. Test frontend integration" -ForegroundColor White 