# 🔄 Restart Instructions

## Critical Changes Made

### ❌ OLD BEHAVIOR (Before Fix):
```
16:08:02 [info]: 📊 Running analysis and saving session...
16:08:02 [info]: ✅ Session saved: 3 karts, 44 laps total
16:08:19 [info]: 📊 Running analysis and saving session...
16:08:19 [info]: ✅ Session saved: 3 karts, 45 laps total
```
**Problem**: Saving every 15-17 seconds during a race!

### ✅ NEW BEHAVIOR (After Fix):
```
📡 Update #10: 8 karts active
📡 Update #20: 10 karts active
🔄 Session change detected: "Session #67" → "Session #68"
💾 Saving completed session: 12 karts, 145 laps, 12m34s
✅ Session saved: "Session #67" (ID: 1761890000)
🏁 New session started: "Session #68"
```
**Fixed**: Saves ONLY when session ends!

## What Was Removed

### Deleted from `server/websocket.js`:
```javascript
// ❌ REMOVED: Periodic analysis triggers
let lastAnalysisTime = 0;
let lastTotalLaps = 0;
const ANALYSIS_INTERVAL = 15000;
const LAP_CHANGE_THRESHOLD = 5;

function shouldRunAnalysis(sessionData) {
  // This was causing saves every 15 seconds!
}
```

### Changed Logic:
- **Before**: Save every 15 seconds or 5 laps during race
- **After**: Save only when `event_name` changes (session ends)

## How to Restart

### Option 1: Manual (WSL Terminal)

1. **Stop current server**:
   ```bash
   pkill -f "node.*server"
   ```

2. **Clean up invalid sessions**:
   ```bash
   cd server
   node cleanup-sessions.js
   ```

3. **Restart server**:
   ```bash
   cd server
   npm start
   ```

### Option 2: Automated Script

From WSL:
```bash
bash restart-and-cleanup.sh
```

This will:
- ✅ Stop the old server
- ✅ Clean up invalid sessions
- ✅ Restart with new code
- ✅ Show current sessions

## Verify Fix is Working

### 1. Check Initial Logs
After restart, you should see:
```
✅ RaceFacer Analysis Server running on port 3001
🔌 Attempting to connect to WebSocket...
✅ Connected to RaceFacer WebSocket
```

### 2. During a Race
You should see:
```
📡 Update #10: 8 karts active
📡 Update #20: 10 karts active
📡 Update #30: 12 karts active
```

**NOT**:
```
❌ 📊 Running analysis and saving session...  (This should NOT appear!)
❌ ✅ Session saved: X karts, Y laps total   (This should NOT appear during race!)
```

### 3. When Session Changes
You should see:
```
🔄 Session change detected: "Session #X" → "Session #Y"
📋 Previous session had Z total karts
💾 Saving completed session: Z karts, N laps, Xm Ys duration
✅ Session saved: "Session #X" (ID: timestamp)
🏁 New session started: "Session #Y"
```

### 4. Check API
```bash
curl http://localhost:3001/api/sessions
```

Should show:
- Only **complete sessions** (not partial snapshots)
- Each with ≥2 karts and ≥10 laps
- Proper event names (Session #61, Session #62, etc.)

## Cleanup Results

The cleanup script will show:
```
✅ Keeping: session-1761884132.json - "Session #61 R" (12 karts, 159 laps)
❌ Removing: session-1761887039.json - "Session #66" (1 karts, 20 laps)
❌ Removing: session-1761887019.json - "Session #66" (1 karts, 19 laps)
...

✅ Cleanup complete: 5 sessions kept, 44 sessions removed
```

## After Restart

1. **Hard refresh browser**: `Ctrl+Shift+R`
2. **Go to Results tab**
3. **Click session dropdown**
4. Should now show:
   - 🔴 Live
   - ☁️ Oct 31 - 14:15 - Marco Turpeinen (#59) - 41.117s
   - ☁️ Oct 31 - 13:45 - Andrea Biasucci (#41) - 41.091s
   - ☁️ Oct 31 - 13:30 - Jackson Laurie (#72) - 39.738s

## Troubleshooting

### If you still see periodic saves:
```bash
# Check if old process is still running
ps aux | grep node

# Kill all node processes (nuclear option)
pkill -9 node

# Verify the code was updated
cd server
grep -n "ANALYSIS_INTERVAL" websocket.js
# Should return: (nothing - this variable was removed)

# Restart
npm start
```

### If sessions still not showing:
```bash
# Check what's in storage
ls -la server/storage/sessions/

# Check API response
curl http://localhost:3001/api/sessions | jq

# Check server logs
tail -f /tmp/racefacer-server.log
```

---

**Status**: ✅ CODE FIXED - NEEDS SERVER RESTART  
**Action**: Restart backend server in WSL  
**Expected**: No more periodic saves, sessions saved only on completion


