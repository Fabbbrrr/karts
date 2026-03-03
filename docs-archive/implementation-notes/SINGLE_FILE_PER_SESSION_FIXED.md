# ✅ Single File Per Session - FIXED

## Problem

Sessions were still creating multiple files:
```
session-Session_61_R_1761883800.json  ← 14:30:00
session-Session_61_R_1761883860.json  ← 14:31:00
session-Session_61_R_1761883920.json  ← 14:32:00
```

**Root Cause**: `generateSessionId()` was adding `Date.now()` timestamp, creating a NEW ID every time.

## Solution

### Fixed generateSessionId()

**Before** (❌ Created new ID every call):
```javascript
function generateSessionId(eventName) {
    const sanitized = eventName.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = Date.now();  // ❌ NEW timestamp every call!
    return `${sanitized}_${timestamp}`;
}
```

**After** (✅ Returns same ID for same session):
```javascript
function generateSessionId(eventName, trackConfig) {
    const sanitized = eventName.replace(/[^a-zA-Z0-9]/g, '_');
    // NO timestamp - same event+track = same ID!
    return `${sanitized}_track${trackConfig || 0}`;
}
```

### Session Identification

Sessions are now uniquely identified by:
1. **Event Name** (Session #61 R, Session #62, etc.)
2. **Track Configuration** (Track 1, Track 2, etc.)

Examples:
- `Session_61_R_track1.json` - Session #61 R on track 1
- `Session_61_R_track2.json` - Session #61 R on track 2 (different track = different session)
- `Session_62_track1.json` - Session #62 on track 1

### Track Config Detection

Added track configuration to session detection:
```javascript
const isNewSession = !previousEventName || 
                    (previousEventName !== newEventName) ||
                    (currentTrackConfig !== null && currentTrackConfig !== newTrackConfig);
```

New session triggers when:
- ✅ Event name changes (Session #61 → Session #62)
- ✅ Track config changes (Track 1 → Track 2)

## How It Works Now

### During a Race:

```
Update #1: Create session-Session_61_R_track1.json
         ├─ Save initial data (2 karts, 5 laps)

Update #5: Update session-Session_61_R_track1.json  ← SAME FILE
         ├─ Add more data (4 karts, 23 laps)

Update #10: Update session-Session_61_R_track1.json  ← SAME FILE
          ├─ Add more data (6 karts, 54 laps)

Update #15: Update session-Session_61_R_track1.json  ← SAME FILE
          ├─ Add more data (8 karts, 89 laps)

Session #62 starts:
          ├─ Mark session-Session_61_R_track1.json as complete
          └─ Create session-Session_62_track1.json  ← NEW FILE (new session)
```

### File Naming:
```
session-Session_61_R_track1.json      ← One file per session!
session-Session_62_track1.json
session-Session_63_track2.json
```

## Expected Logs

### During Race:
```
📡 Update #5: 8 karts active
📝 Updated session: 8 karts, 45 total laps
📡 Update #10: 10 karts active
📝 Updated session: 10 karts, 98 total laps
```

### When Session Changes:
```
🔄 Session change detected: "Session #61 R" (track 1) → "Session #62" (track 1)
📋 Previous session had 12 total karts
🏁 Session complete: 12 karts, 145 total laps, 12m34s
✅ Session marked complete: Session_61_R_track1
🏁 New session started: "Session #62"
```

### When Track Config Changes:
```
🔄 Session change detected: "Session #61" (track 1) → "Session #61" (track 2)
📋 Previous session had 8 total karts
🏁 Session complete: 8 karts, 67 total laps, 8m12s
✅ Session marked complete: Session_61_track1
🏁 New session started: "Session #61" (track 2)
```

## Files Modified

- ✅ `server/websocket.js`:
  - Removed timestamp from `generateSessionId()`
  - Added track config parameter
  - Track config detection for session changes
  - Store track config in session data

## Cleanup Old Files

After restarting, clean up duplicate session files:

```bash
cd server
node cleanup-sessions.js
```

This will:
- Keep sessions with ≥2 karts and ≥10 laps
- Remove old duplicate/incomplete sessions
- Show what was kept vs removed

## Testing

### 1. Restart Backend
```bash
# In WSL
cd server
npm start
```

### 2. Watch Files During Race
```bash
# In another terminal
watch -n 1 ls -lh server/storage/sessions/
```

Should see:
- ✅ ONE file being updated (size grows)
- ❌ NOT multiple new files every minute

### 3. Check File Count
```bash
# Before cleanup
ls server/storage/sessions/ | wc -l
# Shows: 49 files

# After one complete race
ls server/storage/sessions/ | wc -l
# Shows: 1 file (or number of complete sessions)
```

### 4. Verify Session ID
```bash
# Check that IDs don't have timestamps
ls server/storage/sessions/
# Should show:
# session-Session_61_R_track1.json
# session-Session_62_track1.json
# 
# NOT:
# session-Session_61_R_1761883800.json
# session-Session_61_R_1761883860.json
```

## Result

- ✅ **ONE file** per session (event_name + track_config)
- ✅ File **continuously updated** during race
- ✅ **Marked complete** when session ends
- ✅ Track config changes = new session
- ✅ No more duplicate files

---

**Status**: ✅ FIXED  
**Action**: Restart backend server  
**Result**: One file per complete session


