# ✅ Session Saving Fix - COMPLETE

## Summary

Fixed the backend to save **complete race sessions** instead of **minute-by-minute snapshots**.

## The Problem

Your WSL logs showed:
```
16:08:02 [info]: ✅ Session saved: 3 karts, 44 laps total
16:08:19 [info]: ✅ Session saved: 3 karts, 45 laps total
```

This created **49+ session files** for what should be **~5 complete races**.

## Root Cause

```javascript
// ❌ OLD CODE: Triggered every 15 seconds or 5 laps
const ANALYSIS_INTERVAL = 15000;
const LAP_CHANGE_THRESHOLD = 5;

function shouldRunAnalysis(sessionData) {
  // Returned true every 15 seconds!
}

if (shouldAnalyze) {
  saveSessionData(...); // Saved constantly!
}
```

## The Fix

### 1. Removed Periodic Saving
- ❌ Deleted `shouldRunAnalysis()` function
- ❌ Deleted `ANALYSIS_INTERVAL` and `LAP_CHANGE_THRESHOLD`
- ❌ Removed all periodic `saveSessionData()` calls during races

### 2. Session Boundary Detection
```javascript
// ✅ NEW: Detect by event_name change
const isNewSession = !previousEventName || (previousEventName !== newEventName);

if (isNewSession && currentSessionId) {
    // Save PREVIOUS session when new one starts
    savePreviousSession();
}
```

### 3. Enhanced Validation
```javascript
function savePreviousSession() {
    // Only save if:
    // ✅ At least 2 karts
    // ✅ At least 5 minutes OR 10+ total laps
    
    if (kartCount < 2) return; // Skip
    if (duration < 300 && totalLaps < 10) return; // Skip
    
    // Save complete session with all karts
    saveSessionData({...});
}
```

## Files Modified

| File | Change |
|------|--------|
| `server/websocket.js` | Removed periodic analysis, added session-end saving |
| `server/storage.js` | Updated validation (≥2 karts, ≥10 laps) |
| `server/controllers.js` | Fixed API filter property mismatch |
| `js/views/results.view.js` | Fixed session selector refresh |
| `js/views/summary.view.js` | Fixed session selector + lap history |

## New Files Created

| File | Purpose |
|------|---------|
| `server/cleanup-sessions.js` | Remove invalid sessions |
| `restart-and-cleanup.sh` | Automated restart script |
| `SESSION_FIX_COMPLETE.md` | This document |
| `RESTART_INSTRUCTIONS.md` | Detailed restart guide |

## How to Apply

### In WSL Terminal:

```bash
# Option 1: Automated
bash restart-and-cleanup.sh

# Option 2: Manual
pkill -f "node.*server"
cd server
node cleanup-sessions.js
npm start
```

### Then in Browser:
```
Hard Refresh: Ctrl+Shift+R
```

## Expected Behavior

### ✅ During Race (Every 10 updates):
```
📡 Update #10: 8 karts active
📡 Update #20: 10 karts active
📡 Update #30: 12 karts active
```

### ✅ When Race Ends (Session changes):
```
🔄 Session change detected: "Session #67" → "Session #68"
📋 Previous session had 12 total karts
💾 Saving completed session: 12 karts, 145 laps, 12m34s duration
✅ Session saved: "Session #67" (ID: 1761890000)
🏁 New session started: "Session #68"
```

### ❌ Should NOT See (During Race):
```
❌ 📊 Running analysis and saving session...
❌ ✅ Session saved: X karts, Y laps total
```

## Results Page

After fix, the Results dropdown will show:
```
🔴 Live
☁️ Oct 31 - 14:45 - Marco Turpeinen (#59) - 41.117s
☁️ Oct 31 - 14:30 - Andrea Biasucci (#41) - 41.091s
☁️ Oct 31 - 14:15 - Jackson Laurie (#72) - 39.738s
```

Each represents a **complete race**, not a snapshot!

## Validation

### Check Cleanup Results:
```bash
cd server
node cleanup-sessions.js
```

Should show:
```
✅ Keeping: session-X.json - "Session #61" (12 karts, 159 laps)
❌ Removing: session-Y.json - "Session #66" (1 kart, 20 laps)
...
✅ Cleanup complete: 5 kept, 44 removed
```

### Check API:
```bash
curl http://localhost:3001/api/sessions
```

Should return:
```json
{
  "total": 5,
  "sessions": [
    {
      "sessionId": "1761884132",
      "eventName": "Session #61 R",
      "timestamp": "2025-10-31T04:15:32.000Z",
      "karts": 12,
      "laps": 159
    },
    ...
  ]
}
```

### Monitor New Race:
```bash
tail -f /tmp/racefacer-server.log
```

Watch for:
- ✅ Updates every ~10 data points
- ✅ Save ONLY when session changes
- ❌ NO periodic "Running analysis" messages

## Success Criteria

- [x] Code removes all periodic analysis
- [x] Sessions saved only when event_name changes
- [x] Validation requires ≥2 karts, ≥5 minutes OR ≥10 laps
- [x] Cleanup script removes invalid sessions
- [x] API filter fixed to use correct properties
- [x] Results selector refreshes and shows historical sessions
- [x] Lap numbers correct per session

**Next Action**: Restart backend server in WSL using one of the methods above!

---

**Status**: ✅ CODE COMPLETE - AWAITING RESTART  
**Files**: All changes saved and ready  
**Test**: Let a complete race happen after restart


