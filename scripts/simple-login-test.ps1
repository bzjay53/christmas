# Christmas Trading Login Test
Write-Host "Christmas Trading Login Test" -ForegroundColor Green
Write-Host "Server: http://31.220.83.213" -ForegroundColor Cyan
Write-Host ""

# Test data
$loginData = @{
    email = "lvninety9@gmail.com"
    password = "password123"
} | ConvertTo-Json

Write-Host "Sending login request..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://31.220.83.213/api/auth/login" `
                                -Method POST `
                                -ContentType "application/json" `
                                -Body $loginData `
                                -TimeoutSec 30
    
    Write-Host "Success! Response received:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3 | Write-Host
}
catch {
    Write-Host "Error occurred:" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Yellow
    
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            Write-Host "Error Body: $errorBody" -ForegroundColor Red
        }
        catch {
            Write-Host "Cannot read error body" -ForegroundColor Red
        }
    }
} 