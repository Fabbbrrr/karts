#!/bin/bash
# Restart backend and cleanup invalid sessions
# Run this in WSL: bash restart-and-cleanup.sh

echo "🔄 Stopping backend server..."
pkill -f "node.*server" || echo "No running server found"

echo ""
echo "🧹 Cleaning up invalid sessions..."
cd server
node cleanup-sessions.js

echo ""
echo "🚀 Starting backend server..."
nohup npm start > /tmp/racefacer-server.log 2>&1 &

echo ""
echo "⏳ Waiting for server to start..."
sleep 3

echo ""
echo "✅ Server restarted!"
echo ""
echo "📊 Current sessions:"
curl -s http://localhost:3001/api/sessions | jq '.sessions[] | {eventName, karts, laps, timestamp}' 2>/dev/null || curl -s http://localhost:3001/api/sessions

echo ""
echo "📝 To view logs: tail -f /tmp/racefacer-server.log"


