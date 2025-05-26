# Check Actual .env File Script
# Purpose: Verify if SUPABASE_SERVICE_KEY has been updated in the actual .env file

Write-Host "Checking Actual .env File Status" -ForegroundColor Green
Write-Host ""

$envFile = "backend/.env"

if (Test-Path $envFile) {
    Write-Host "✅ .env file found" -ForegroundColor Green
    
    # Read the actual .env file
    $envContent = Get-Content $envFile -ErrorAction SilentlyContinue
    
    if ($envContent) {
        Write-Host "✅ .env file readable" -ForegroundColor Green
        
        # Check SUPABASE_SERVICE_KEY
        $serviceKeyLine = $envContent | Where-Object { $_ -match "^SUPABASE_SERVICE_KEY=" }
        
        if ($serviceKeyLine) {
            $serviceKey = ($serviceKeyLine -split "=", 2)[1]
            
            if ($serviceKey -match "your-.*") {
                Write-Host "❌ SUPABASE_SERVICE_KEY still has placeholder value" -ForegroundColor Red
                Write-Host "   Current value: $serviceKey" -ForegroundColor Yellow
            } elseif ($serviceKey.Length -gt 100) {
                Write-Host "✅ SUPABASE_SERVICE_KEY appears to be updated" -ForegroundColor Green
                $maskedKey = $serviceKey.Substring(0, 20) + "..."
                Write-Host "   Value: $maskedKey" -ForegroundColor Gray
            } else {
                Write-Host "⚠️ SUPABASE_SERVICE_KEY might be invalid (too short)" -ForegroundColor Yellow
                Write-Host "   Length: $($serviceKey.Length) characters" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ SUPABASE_SERVICE_KEY not found in .env file" -ForegroundColor Red
        }
        
        # Check other critical variables
        $criticalVars = @("SUPABASE_URL", "SUPABASE_ANON_KEY", "JWT_SECRET", "NODE_ENV", "PORT")
        
        Write-Host ""
        Write-Host "Other Critical Variables:" -ForegroundColor Cyan
        
        foreach ($var in $criticalVars) {
            $line = $envContent | Where-Object { $_ -match "^$var=" }
            if ($line) {
                $value = ($line -split "=", 2)[1]
                $maskedValue = if ($value.Length -gt 10) { 
                    $value.Substring(0, 10) + "..." 
                } else { 
                    $value 
                }
                Write-Host "✅ $var = $maskedValue" -ForegroundColor Green
            } else {
                Write-Host "❌ $var not found" -ForegroundColor Red
            }
        }
        
    } else {
        Write-Host "❌ .env file exists but cannot be read" -ForegroundColor Red
    }
    
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "   Expected location: $envFile" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Check completed!" -ForegroundColor Green 