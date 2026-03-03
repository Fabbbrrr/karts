# 🔧 Empty Session Storage Fix

## Problem
Backend was saving empty sessions (with no karts/drivers) which were replacing valid sessions with actual race data.

## Root Cause
The `saveSessionData()` and `saveReplayData()` functions didn't validate that sessions contained actual kart data before saving. This meant:
- Empty updates between races would get saved
- These would overwrite or replace valid session files
- Results tab would show empty sessions

## Solution

### 1. Added Validation to `saveSessionData()`
```javascript
// ONLY save sessions with actual karts/drivers
const hasKarts = sessionData?.runs?.length > 0;
const hasLaps = analysis?.summary?.totalLaps > 0;

if (!hasKarts || !hasLaps) {
  logger.debug(`Skipping save - empty session`);
  return; // Don't save
}
```

**Checks**:
- ✅ Session has `runs` array with karts
- ✅ Analysis shows `totalLaps > 0`
- ❌ If either check fails → Skip saving

### 2. Added Validation to `saveReplayData()`
```javascript
// ONLY save replay data if session has karts
const hasKarts = dataPoint?.data?.runs?.length > 0;

if (!hasKarts) {
  return; // Silently skip
}
```

**Checks**:
- ✅ Data point contains `runs` array with karts
- ❌ If no karts → Skip saving replay snapshot

## What This Prevents

### Before Fix ❌
```
Race 1: 10 karts, 50 laps → Saved ✅
Empty data between races → Saved ❌ (overwrites Race 1)
Race 2: 8 karts, 40 laps → Saved ✅
Empty data → Saved ❌ (overwrites Race 2)

Results dropdown:
- Empty session (0 karts)
- Empty session (0 karts)
- Empty session (0 karts)
```

### After Fix ✅
```
Race 1: 10 karts, 50 laps → Saved ✅
Empty data between races → Skipped ✓
Race 2: 8 karts, 40 laps → Saved ✅
Empty data → Skipped ✓

Results dropdown:
- Race 2 (8 karts, 40 laps)
- Race 1 (10 karts, 50 laps)
```

## Files Modified

### `server/storage.js`

**Function: `saveSessionData()`**
- Added kart validation
- Added lap validation
- Debug log for skipped saves
- Enhanced success log with counts

**Function: `saveReplayData()`**
- Added kart validation
- Silently skips empty data
- Only saves meaningful snapshots

## Behavior

### During Active Race
```
Update #1: 5 karts → Broadcast ✅, Replay saved ✅
Update #2: 5 karts → Broadcast ✅, Replay saved ✅
...
Analysis trigger: 5 karts, 20 laps → Session saved ✅
```

### Between Races (No Karts)
```
Update #1: 0 karts → Broadcast ✅, Replay skipped ✓
Update #2: 0 karts → Broadcast ✅, Replay skipped ✓
...
Analysis trigger: 0 karts → Session save skipped ✓
```

**Note**: Empty data is still **broadcast to UI** (clients see accurate "no active race" state), but **not saved to disk** (prevents polluting session history).

## Logs

### Old Logs (Before Fix)
```
Session data saved: 1730401234567
Session data saved: 1730401234600
Session data saved: 1730401234650  <- Empty sessions saved!
```

### New Logs (After Fix)
```
Session data saved: 1730401234567 (5 karts, 20 laps)
Skipping save - empty session (0 karts, 0 laps)
Skipping save - empty session (0 karts, 0 laps)
Session data saved: 1730401235000 (8 karts, 35 laps)
```

Much clearer what's being saved! 📊

## Testing

### Test 1: Active Race
1. Start backend
2. Race with multiple karts
3. Check `server/storage/sessions/`
4. ✅ Should see session files with kart data

### Test 2: No Active Race
1. Backend running
2. No race happening
3. Check `server/storage/sessions/`
4. ✅ Should NOT see new empty session files
5. ✅ Old valid sessions should remain

### Test 3: Results Tab
1. Complete a race
2. Wait for race to end (no karts)
3. Go to Results tab
4. Open session dropdown
5. ✅ Should only see sessions with actual race data
6. ❌ Should NOT see empty sessions

## Benefits

✅ **No more empty sessions in storage**  
✅ **Last 10 sessions are always valid races**  
✅ **Results dropdown shows only real data**  
✅ **Disk space not wasted on empty files**  
✅ **Cleaner logs with meaningful info**  

## Rollout

To apply the fix:
```bash
# Restart backend server
cd server
# Ctrl+C to stop
npm start
```

That's it! The validation is now active.

## Optional: Clean Up Old Empty Sessions

If you have existing empty sessions, you can remove them:

```bash
# List session files
ls -lh server/storage/sessions/

# Check for empty ones
grep -l '"runs":\[\]' server/storage/sessions/*.json

# Remove them (be careful!)
# Check first, then delete if confirmed empty
```

Or they'll naturally be cleaned up as the "last 10 sessions" cleanup runs.

---

**Status**: ✅ Fixed  
**Priority**: High (prevents data pollution)  
**Version**: 2.0.2  
**Date**: October 30, 2025


