# 🏢 Backend-Controlled Mode

## What is Backend Mode?

Backend Mode is the **recommended** architecture for RaceFacer UI. Instead of your browser connecting directly to RaceFacer, it connects to your local Analysis Server, which acts as a central hub.

## Architecture Comparison

### Old: Direct Connection
```
[Browser] ─WebSocket─> [RaceFacer Live]

Problems:
❌ Browser must stay open
❌ Each device connects separately  
❌ No session replay
❌ Data lost when browser closes
❌ Can't view from multiple devices
```

### New: Backend-Controlled (Recommended)
```
[Browser 1] ───┐
[Browser 2] ───┼─SSE─> [Analysis Server] ─WebSocket─> [RaceFacer Live]
[Phone]     ───┘              ↓
                    [Persistent Storage]

Benefits:
✅ 24/7 data collection
✅ Multiple devices in perfect sync
✅ Session replay (last 10 sessions)
✅ Never lose data
✅ View races you missed
```

## Quick Start

### 1. Start the Backend Server

```bash
cd server
npm install
npm start
```

Server will start on `http://localhost:3001` and connect to RaceFacer.

**Expected output:**
```
🚀 Server started on port 3001
📊 Storage initialized at ./storage
🔌 Connecting to RaceFacer...
✅ Connected to RaceFacer timing system
📡 Joined channel: lemansentertainment
```

### 2. Open the UI

Open `http://localhost:8000` in your browser (or multiple browsers!)

**Expected output in browser console:**
```
🏢 Backend mode enabled - connecting via backend server
✅ SSE Connected: {clientId: "client-1-..."}
Connected with client ID: client-1-1730311234567
```

### 3. Verify Multi-Device Sync

Open `http://localhost:8000` in:
- Chrome on your laptop
- Safari on your iPhone
- Edge on another laptop

All devices will show **identical data** in perfect sync!

## Configuration

### Enable/Disable Backend Mode

**Frontend** (`js/core/config.js`):
```javascript
export const CONFIG = {
    // Set to true for backend mode (recommended)
    BACKEND_MODE: true,
    SERVER_URL: 'http://localhost:3001'
};
```

### Server Configuration

**Backend** (`server/.env`):
```bash
# Server settings
PORT=3001
HOST=0.0.0.0

# RaceFacer connection
WS_PROTOCOL=https
WS_HOST=live.racefacer.com
WS_PORT=3123
WS_CHANNEL=lemansentertainment

# Storage
STORAGE_PATH=./storage
MAX_SESSIONS=10
MAX_LAPS_PER_SESSION=500
```

## How It Works

### 1. Server-Sent Events (SSE)

The UI connects to the backend using SSE (not WebSocket). SSE is simpler and more reliable for one-way communication (server → client).

**Connection**:
```javascript
GET http://localhost:3001/api/stream

Headers:
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Events Received**:
- `connected` - Initial connection established
- `session` - Live timing data updates
- `lap` - Individual lap completions
- `heartbeat` - Connection keepalive (every 30s)

### 2. Multi-Client Broadcast

When the backend receives data from RaceFacer, it broadcasts to **all** connected clients simultaneously.

**Backend Flow**:
```
[RaceFacer] → [WebSocket Handler] → [Process & Store] → [Broadcast to ALL Clients]
                                              ↓
                                      [Storage System]
```

**Result**: All devices see updates within milliseconds of each other.

### 3. Automatic Reconnection

If connection drops, both backend and frontend automatically reconnect:

**Backend**:
- Reconnects to RaceFacer (exponential backoff)
- Clients stay connected
- No data loss

**Frontend**:
- Reconnects to backend (max 10 attempts)
- Shows reconnection status
- Automatically resumes

## API Endpoints

### Live Data

- **`GET /api/stream`** - SSE stream (keep connection open)
- **`GET /api/current`** - Current session snapshot (one-time)
- **`GET /api/clients`** - Connected clients statistics

### Session Replay

- **`GET /api/replay/sessions`** - List replayable sessions
- **`GET /api/replay/:sessionId`** - Get full replay data
- **`GET /api/replay/:sessionId/metadata`** - Session info

### Historical Data

- **`GET /api/sessions`** - List all sessions
- **`GET /api/sessions/:sessionId`** - Session details
- **`GET /api/sessions/:sessionId/export`** - Export as JSON

## Monitoring

### Check Server Status

**Health Check**:
```bash
curl http://localhost:3001/health
```

**Response**:
```json
{
  "status": "OK",
  "timestamp": "2025-10-30T12:34:56.789Z",
  "websocket": {
    "connected": true
  },
  "uptime": 3847
}
```

### Check Connected Clients

```bash
curl http://localhost:3001/api/clients
```

**Response**:
```json
{
  "totalClients": 3,
  "activeClients": 3,
  "clients": [
    {
      "id": "client-1-...",
      "connectedAt": "2025-10-30T12:30:00Z",
      "durationSeconds": 296,
      "userAgent": "Mozilla/5.0..."
    }
  ]
}
```

### Server Logs

Logs are written to:
- `server/logs/server.log` - All logs
- `server/logs/server.error.log` - Errors only

**View logs**:
```bash
# Follow all logs
tail -f server/logs/server.log

# Follow errors only
tail -f server/logs/server.error.log
```

## Troubleshooting

### "Cannot connect to backend"

**Symptoms**: Browser console shows SSE connection errors

**Solutions**:
1. Verify server is running: `curl http://localhost:3001/health`
2. Check server logs: `tail -f server/logs/server.log`
3. Verify `SERVER_URL` in `js/core/config.js`

### "No data showing"

**Symptoms**: Connected but no race data

**Solutions**:
1. Check server connected to RaceFacer: Look for `✅ Connected` in logs
2. Verify channel name: Check `WS_CHANNEL` in `server/.env`
3. Check if race is actually running on RaceFacer

### "Multiple clients not syncing"

**Symptoms**: Different devices show different data

**Solutions**:
1. Hard refresh all browsers: `Ctrl+Shift+R` or `Cmd+Shift+R`
2. Check all devices point to same server
3. Verify server is actually broadcasting: Check `/api/clients`

### "Server keeps disconnecting from RaceFacer"

**Symptoms**: Frequent reconnections in server logs

**Solutions**:
1. Check internet connection
2. Verify RaceFacer service is up: `https://live.racefacer.com:3123`
3. Check firewall isn't blocking WebSocket
4. Try different network

## Performance

### Resource Usage

**Backend Server**:
- Memory: ~50-100 MB
- CPU: <5% (idle), ~10-15% (active race)
- Disk: ~1-5 MB per session
- Network: ~1-5 KB/s per connected client

**Frontend (per device)**:
- Memory: Similar to direct mode
- CPU: Similar to direct mode
- Network: Reduced (no WebSocket overhead)

### Scalability

Tested with:
- ✅ 10 simultaneous clients
- ✅ 100+ lap race session
- ✅ 12+ hour continuous operation
- ✅ Multiple sessions in one day

### Data Storage

With default settings:
- Last 10 sessions kept
- ~1-5 MB per session
- Automatic cleanup
- Total: ~10-50 MB

**Customize**:
```bash
# server/.env
MAX_SESSIONS=20        # Keep more sessions
MAX_LAPS_PER_SESSION=1000  # Support longer races
```

## Advantages Over Direct Mode

| Feature | Direct Mode | Backend Mode |
|---------|-------------|--------------|
| **24/7 Collection** | ❌ No | ✅ Yes |
| **Multi-Device Sync** | ❌ No | ✅ Perfect |
| **Session Replay** | ❌ No | ✅ Last 10 |
| **Data Loss Risk** | ⚠️ High | ✅ None |
| **Battery Usage** | ⚠️ High | ✅ Low |
| **Server Required** | ✅ No | ⚠️ Yes |
| **Setup Complexity** | ✅ Simple | ⚠️ Medium |

## When to Use Direct Mode

Backend mode is recommended for most users, but consider direct mode if:

1. **No server available**: Can't run Node.js server
2. **Single device only**: Don't need multi-device
3. **Temporary usage**: Just checking quick data
4. **Testing**: Debugging connection issues

**Switch to Direct Mode**:
```javascript
// js/core/config.js
export const CONFIG = {
    BACKEND_MODE: false,  // Disable backend
    SOCKET_URL: 'https://live.racefacer.com:3123'
};
```

## Next Steps

- [Session Replay Guide](../features/session-replay.md)
- [Backend-Enabled Features](../features/backend-enabled-features.md)
- [Deployment to Cloud](../deployment/aws.md)
- [API Documentation](../api/endpoints.md)

---

**Recommended**: Always use Backend Mode for the best experience!


