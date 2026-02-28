# PowerShell diagnostic script for Windows
# Quick diagnostic to check SSE connection

Write-Host "🔍 RaceFacer SSE Diagnostic" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Check backend is running
Write-Host "1️⃣ Checking backend health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 3
    Write-Host "✅ Backend is running" -ForegroundColor Green
    if ($health.websocket.connected) {
        Write-Host "✅ Connected to RaceFacer" -ForegroundColor Green
    } else {
        Write-Host "❌ NOT connected to RaceFacer" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend not running or not accessible" -ForegroundColor Red
    Write-Host "   Start with: cd server; npm start" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "2️⃣ Checking current session..." -ForegroundColor Yellow
try {
    $current = Invoke-RestMethod -Uri "http://localhost:3001/api/current" -TimeoutSec 3
    if ($current.sessionData.runs) {
        $kartCount = $current.sessionData.runs.Count
        Write-Host "✅ Session data available: $kartCount karts" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Session exists but no karts" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  No current session data" -ForegroundColor Yellow
    Write-Host "   This is normal if no race is active" -ForegroundColor Gray
}

Write-Host ""
Write-Host "3️⃣ Checking connected clients..." -ForegroundColor Yellow
try {
    $clients = Invoke-RestMethod -Uri "http://localhost:3001/api/clients" -TimeoutSec 3
    Write-Host "✅ Client stats available" -ForegroundColor Green
    Write-Host "   Total clients: $($clients.totalClients)" -ForegroundColor Gray
    Write-Host "   Active clients: $($clients.activeClients)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Cannot get client stats" -ForegroundColor Red
}

Write-Host ""
Write-Host "4️⃣ Testing SSE stream..." -ForegroundColor Yellow
Write-Host "   Open in browser: http://localhost:3001/api/stream" -ForegroundColor Gray
Write-Host "   Or test with: curl -N http://localhost:3001/api/stream" -ForegroundColor Gray

Write-Host ""
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan
Write-Host "✅ = Working" -ForegroundColor Green
Write-Host "⚠️  = No active race (normal)" -ForegroundColor Yellow
Write-Host "❌ = Problem detected" -ForegroundColor Red
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure backend is running: cd server; npm start"
Write-Host "2. Check backend logs for connection to RaceFacer"
Write-Host "3. Verify there's an active race on RaceFacer"
Write-Host "4. Open UI (http://localhost:8000) and check browser console (F12)"
Write-Host ""
Write-Host "For detailed debugging, see: DEBUGGING_SSE.md" -ForegroundColor Cyan


