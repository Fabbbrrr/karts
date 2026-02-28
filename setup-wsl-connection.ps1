# PowerShell script to automatically detect WSL IP and update frontend config

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "WSL Backend Connection Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Try to get WSL IP from backend logs
$logFile = "server\logs\server.log"
if (Test-Path $logFile) {
    Write-Host "Backend server logs found" -ForegroundColor Green
} else {
    Write-Host "Backend server not running or no logs found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Getting WSL IP address..." -ForegroundColor Cyan

# Try WSL command
try {
    $wslIP = wsl hostname -I 2>$null | ForEach-Object { ($_ -split ' ')[0].Trim() }
    
    if ($wslIP -and $wslIP -match '^\d+\.\d+\.\d+\.\d+$') {
        Write-Host "Found WSL IP: $wslIP" -ForegroundColor Green
        Write-Host ""
        
        # Test connectivity
        Write-Host "Testing connectivity to backend..." -ForegroundColor Cyan
        try {
            $response = Invoke-WebRequest -Uri "http://${wslIP}:3001/health" -TimeoutSec 3 -ErrorAction Stop
            Write-Host "Backend is reachable at http://${wslIP}:3001" -ForegroundColor Green
            Write-Host ""
            
            # Update config file
            Write-Host "Updating frontend configuration..." -ForegroundColor Cyan
            $configFile = "js\core\config.js"
            
            if (Test-Path $configFile) {
                $content = Get-Content $configFile -Raw
                $newContent = $content -replace "SERVER_URL: 'http://localhost:3001'", "SERVER_URL: 'http://${wslIP}:3001'"
                
                if ($content -ne $newContent) {
                    $newContent | Set-Content $configFile -NoNewline
                    Write-Host "Config updated successfully!" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "   File: js\core\config.js" -ForegroundColor Gray
                    Write-Host "   SERVER_URL: 'http://${wslIP}:3001'" -ForegroundColor Gray
                    Write-Host ""
                    Write-Host "Next step: Hard refresh your browser (Ctrl+Shift+R)" -ForegroundColor Yellow
                } else {
                    Write-Host "Config already uses: http://${wslIP}:3001" -ForegroundColor Cyan
                }
            } else {
                Write-Host "Config file not found: $configFile" -ForegroundColor Red
            }
            
        } catch {
            Write-Host "Cannot reach backend at http://${wslIP}:3001" -ForegroundColor Red
            Write-Host "Make sure the server is running in WSL" -ForegroundColor Yellow
            Write-Host "Command: cd server; npm start" -ForegroundColor Yellow
        }
        
    } else {
        throw "Invalid IP format"
    }
    
} catch {
    Write-Host "Could not detect WSL IP automatically" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. In WSL terminal, run:" -ForegroundColor White
    Write-Host '   hostname -I' -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Update js\core\config.js manually:" -ForegroundColor White
    Write-Host "   SERVER_URL: 'http://<YOUR_WSL_IP>:3001'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Hard refresh browser: Ctrl+Shift+R" -ForegroundColor White
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "For more info, see: WSL_NETWORK_FIX.md" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
