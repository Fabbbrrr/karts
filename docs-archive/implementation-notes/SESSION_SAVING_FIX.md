# ✅ Session Saving Fixed

## Problem

The backend was saving **session snapshots every minute** instead of complete sessions. This resulted in:
- 49+ session files for what should be a few complete races
- Sessions being overwritten constantly
- No way to view historical race results

## Root Cause

The `shouldRunAnalysis()` function was triggering every 15 seconds or 5 laps, causing `saveSessionData()` to be called repeatedly during a single session.

## Solution

### 1. Session Boundary Detection

Changed from time-based detection to **event name-based detection**:

```javascript
// OLD: Detected "new session" based on time gaps
const isNewSession = !currentSessionId || 
                    (currentEventName && newEventName !== currentEventName) ||
                    timeSinceLastUpdate > 3600000;

// NEW: Detect based on event_name change (Session #61, Session #62, etc.)
const isNewSession = !previousEventName || (previousEventName !== newEventName);
```

### 2. Save Only When Session Ends

```javascript
if (isNewSession && currentSessionId) {
    // Save the PREVIOUS session when a new one starts
    savePreviousSession();
    
    // Reset for new session
    lapHistory = {};
    allSessionKarts = {};
}

// REMOVED: Periodic saving during session
// if (shouldAnalyze) { saveSessionData(...) }
```

### 3. Enhanced Validation

Sessions are now saved only if they meet ALL criteria:

```javascript
function savePreviousSession() {
    // Must have:
    // ✅ At least 2 karts
    // ✅ At least 5 minutes duration OR 10+ total laps
    
    if (kartCount < 2) {
        logger.info(`❌ Session not saved: only ${kartCount} kart (need ≥2)`);
        return;
    }
    
    if (sessionDuration < 300 && totalLaps < 10) {
        logger.info(`❌ Session not saved: ${duration}, ${totalLaps} laps`);
        return;
    }
    
    // Save complete session
    logger.info(`💾 Saving completed session: ${kartCount} karts, ${totalLaps} laps, ${duration}`);
}
```

## Files Changed

### `server/websocket.js`
- Added `sessionStartTime` tracking
- Added `previousEventName` for change detection
- Modified `processAndStoreData()` to detect session boundaries by event name
- Added `savePreviousSession()` function
- Removed periodic analysis/saving during active sessions
- Added session duration and lap count validation

### `server/storage.js`
- Updated validation to require `≥2 karts` (changed from `>1`)
- Clearer validation messages

### `server/controllers.js`
- Fixed filter to use `session.karts` instead of `session.analysis.summary.totalKarts`

## Cleanup Script

Created `server/cleanup-sessions.js` to remove invalid sessions:

```bash
cd server
node cleanup-sessions.js
```

This will:
- Keep sessions with ≥2 karts AND ≥10 laps
- Remove sessions that don't meet criteria
- Show summary of what was kept/removed

## Expected Behavior After Restart

### During a Race:
```
🏁 New session started: "Session #67" (ID: 1761890000)
📡 Update #10: 8 karts active
📡 Update #20: 10 karts active
📡 Update #30: 12 karts active
```

### When Next Race Starts:
```
🔄 Session change detected: "Session #67" → "Session #68"
📋 Previous session had 12 total karts
💾 Saving completed session: 12 karts, 145 total laps, 12m34s duration
✅ Session saved: "Session #67" (ID: 1761890000)
🏁 New session started: "Session #68" (ID: 1761892000)
```

### When Session Doesn't Meet Criteria:
```
🔄 Session change detected: "Test Session" → "Session #69"
📋 Previous session had 1 total karts
❌ Session not saved: only 1 kart (need ≥2)
🏁 New session started: "Session #69"
```

## Testing

1. **Restart backend** in WSL
2. **Run cleanup script**:
   ```bash
   cd server
   node cleanup-sessions.js
   ```
3. **Let a complete race happen**
4. **Check after race ends** (when new session starts):
   ```bash
   curl http://172.26.51.66:3001/api/sessions
   ```

## Results Selector

After cleanup and with proper session saving:
- Results dropdown will show complete race sessions only
- Each session represents a full race from start to finish
- Sessions tagged with date, time, winner, and best lap
- No duplicate/partial sessions

---

**Status**: ✅ READY TO TEST  
**Action Required**: 
1. Restart backend server in WSL
2. Run cleanup script
3. Hard refresh browser


