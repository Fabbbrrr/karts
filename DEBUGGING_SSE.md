# 🔧 Debugging: No Live Session Data Showing

## Problem
UI connects to backend via `/api/stream` but receives empty response. No live session data appears.

## Quick Checks

### 1. Check Backend is Connected to RaceFacer

```bash
# View backend logs
cd server
npm start

# Should see:
# ✅ Connected to RaceFacer timing system
# 📡 Joined channel: lemansentertainment
```

**If you DON'T see this:**
- Backend is not connected to RaceFacer
- Check channel name matches your track
- Check RaceFacer is actually broadcasting

### 2. Check UI is in Backend Mode

Open browser console (`F12`):
```javascript
// Should show:
🏢 Backend mode enabled - connecting via backend server
✅ SSE Connected: {clientId: "client-..."}

// Or with polling fallback:
🔄 Starting polling fallback (every 1s)
```

**If you see direct WebSocket connection:**
- UI is trying to connect directly to RaceFacer
- Backend mode not enabled properly

### 3. Check SSE Stream

Browser Network tab:
1. Open DevTools (`F12`)
2. Network tab
3. Look for `/api/stream` request
4. Should show: **Status 200**, Type: **`eventsource`**
5. Click on it → Preview tab → Should see events

**If empty:**
- SSE connected but no data
- Backend not broadcasting
- No active race on RaceFacer

## Step-by-Step Debugging

### Step 1: Verify Backend is Running

```bash
# Test health endpoint
curl http://localhost:3001/health

# Should return:
{
  "status": "OK",
  "websocket": {"connected": true},
  ...
}
```

**If websocket.connected is false:**
- Backend not connected to RaceFacer
- See "Fix Backend Connection" below

### Step 2: Check Backend Logs

```bash
cd server
npm start

# Watch for these logs:
```

**Good logs:**
```
✅ Connected to RaceFacer timing system
📡 Joined channel: lemansentertainment
📱 SSE client connected: client-1-...
📤 Sending current session to client client-1-...
📡 Update #10: 5 karts active
```

**Bad logs:**
```
❌ Connection error: ...
❌ Max reconnection attempts reached
⚠️ No current session available
```

### Step 3: Test SSE Directly

```bash
# Test SSE endpoint (leave running)
curl -N http://localhost:3001/api/stream

# Should see:
event: connected
data: {"clientId":"...","message":"Connected to RaceFacer Analysis Server","serverTime":...}

event: session
data: {"runs":[...],"timestamp":...}

# Data keeps coming...
```

**If you see only `connected` event:**
- SSE works but no session data
- Check backend is receiving from RaceFacer

**If nothing:**
- SSE endpoint not working
- Check backend is running on correct port

### Step 4: Check Current Session API

```bash
# Get current session
curl http://localhost:3001/api/current

# Should return session data or 404
```

**If 404:**
- No current session stored
- Backend hasn't received data yet
- Wait for race to start

**If empty `{}`:**
- Session exists but no data
- Backend receiving empty updates

## Common Issues & Fixes

### Issue 1: Backend Not Connecting to RaceFacer

**Symptoms:**
- Backend logs show connection errors
- `websocket.connected: false` in health check
- No data flowing

**Fix:**

1. **Check channel name** (`server/config.js` or `.env`):
```bash
# server/.env
WS_CHANNEL=lemansentertainment  # Change to your actual channel
```

2. **Restart backend:**
```bash
cd server
# Stop with Ctrl+C
npm start
```

3. **Verify RaceFacer URL:**
```bash
# Should be:
WS_PROTOCOL=https
WS_HOST=live.racefacer.com
WS_PORT=3123
```

### Issue 2: UI Not Using Backend Mode

**Symptoms:**
- Browser console shows direct WebSocket connection
- No SSE connection shown
- `/api/stream` not called

**Fix:**

Edit `js/core/config.js`:
```javascript
export const CONFIG = {
    // Must be true!
    BACKEND_MODE: true,
    SERVER_URL: 'http://localhost:3001'
};
```

**Hard refresh browser:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Issue 3: Wrong Backend URL

**Symptoms:**
- Browser console shows connection errors
- `/api/stream` returns 404 or connection refused

**Fix:**

1. **Check backend is on port 3001:**
```bash
# Backend logs should show:
🚀 Server started on port 3001
```

2. **Update UI config** (`js/core/config.js`):
```javascript
SERVER_URL: 'http://localhost:3001'  // Must match backend port
```

3. **Hard refresh browser**

### Issue 4: No Active Race

**Symptoms:**
- Backend connected ✅
- SSE connected ✅
- But no data shows

**Explanation:**
- Backend is working correctly
- RaceFacer is not broadcasting (no active race)
- UI correctly shows "no active session"

**Verify:**
```bash
# Check if backend is receiving data
tail -f server/logs/server.log

# Should see updates when race is active:
📡 Update #10: 5 karts active
```

**If no updates:**
- No race happening on RaceFacer
- Try connecting directly to RaceFacer to verify
- Check channel name is correct

### Issue 5: Firewall/CORS Issues

**Symptoms:**
- Browser console shows CORS errors
- `/api/stream` blocked

**Fix:**

Backend already has CORS enabled, but check:
```bash
# Test from command line first
curl http://localhost:3001/api/stream

# If this works but browser doesn't:
# - Clear browser cache
# - Try incognito mode
# - Check browser extensions (ad blockers)
```

## Test With Mock Mode

If you want to test the UI without RaceFacer:

1. **Open UI** (`http://localhost:8000`)
2. **Go to Settings tab**
3. **Enable "Mock Mode"**
4. **Select session type and click "Start"**

Mock data will flow through the same backend → UI pipeline.

## Diagnostic Commands

### Check Everything
```bash
# 1. Backend health
curl http://localhost:3001/health

# 2. Current session
curl http://localhost:3001/api/current

# 3. Client stats
curl http://localhost:3001/api/clients

# 4. SSE stream (live)
curl -N http://localhost:3001/api/stream
```

### Check Backend Logs
```bash
# Real-time logs
cd server
npm start

# Or if already running:
tail -f server/logs/server.log | grep -E "(Connected|Update|client|Sending)"
```

### Check Browser
1. Open DevTools (`F12`)
2. Console tab - Look for connection messages
3. Network tab - Look for `/api/stream`
4. Application tab → Service Workers → Unregister (if cached)

## Still Not Working?

### Enable Debug Logging

**Backend** (`server/.env`):
```bash
LOG_LEVEL=debug
```

**Restart backend and watch logs:**
```bash
cd server
npm start

# Should see much more detailed logs
```

### Test Direct Connection (Bypass Backend)

**Temporarily disable backend mode** (`js/core/config.js`):
```javascript
BACKEND_MODE: false,  // Temporarily false
SOCKET_URL: 'https://live.racefacer.com:3123',
CHANNEL: 'lemansentertainment'  // Your channel
```

**Hard refresh browser**

**If data shows now:**
- RaceFacer connection works
- Problem is backend → RaceFacer connection
- Check backend channel name

**If still no data:**
- No active race on RaceFacer
- Or channel name is wrong

## Expected Flow

### When Everything Works

**Backend logs:**
```
🚀 Server started on port 3001
📊 Storage initialized
🔌 Connecting to RaceFacer timing system
✅ Connected to RaceFacer timing system
📡 Joined channel: lemansentertainment
📱 SSE client connected: client-1-...
📤 Sending current session to client client-1-...
📡 Update #10: 5 karts active
📊 Running analysis and saving session...
✅ Session saved: 5 karts, 23 laps total
```

**Browser console:**
```
🏢 Backend mode enabled - connecting via backend server
✅ SSE Connected: {clientId: "client-1-..."}
📊 SSE data received: 5 runs
```

**UI:**
- Shows live timing data
- Karts appear
- Lap times update
- Everything works! 🎉

---

**Still stuck?** Check:
1. Is RaceFacer actually broadcasting? (try their website)
2. Is your channel name correct?
3. Is there an active race happening?


