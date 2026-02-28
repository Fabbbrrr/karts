#!/bin/bash
# Quick diagnostic script to check SSE connection

echo "🔍 RaceFacer SSE Diagnostic"
echo "=========================="
echo ""

# Check backend is running
echo "1️⃣ Checking backend health..."
HEALTH=$(curl -s http://localhost:3001/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Backend is running"
    echo "$HEALTH" | grep -q '"connected":true' && echo "✅ Connected to RaceFacer" || echo "❌ NOT connected to RaceFacer"
else
    echo "❌ Backend not running or not accessible"
    echo "   Start with: cd server && npm start"
    exit 1
fi

echo ""
echo "2️⃣ Checking current session..."
CURRENT=$(curl -s http://localhost:3001/api/current 2>/dev/null)
if echo "$CURRENT" | grep -q '"runs"'; then
    KART_COUNT=$(echo "$CURRENT" | grep -o '"runs":\[' | wc -l)
    echo "✅ Session data available"
    echo "   Checking for karts..."
else
    echo "⚠️  No current session data"
    echo "   This is normal if no race is active"
fi

echo ""
echo "3️⃣ Checking connected clients..."
CLIENTS=$(curl -s http://localhost:3001/api/clients 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Client stats available"
    echo "$CLIENTS"
else
    echo "❌ Cannot get client stats"
fi

echo ""
echo "4️⃣ Testing SSE stream (5 seconds)..."
echo "   Connecting to /api/stream..."
timeout 5 curl -N http://localhost:3001/api/stream 2>/dev/null || true

echo ""
echo ""
echo "📊 Summary:"
echo "=========="
echo "✅ = Working"
echo "⚠️  = No active race (normal)"
echo "❌ = Problem detected"
echo ""
echo "Next steps:"
echo "1. Make sure backend is running: cd server && npm start"
echo "2. Check backend logs for connection to RaceFacer"
echo "3. Verify there's an active race on RaceFacer"
echo "4. Open UI and check browser console (F12)"


