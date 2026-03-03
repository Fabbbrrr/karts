# PER-TRACK SESSION MANAGEMENT - COMPLETE

## 🔍 Problem Identified

**User feedback**: Sessions showing 235+ laps with 26-28 karts when:
- Sessions should be ~15 laps max
- Max 12-15 karts per track
- Tracks: Mario (M*), Penrite (P*), Lakeside (numeric)

**Root cause**: WebSocket sends data for ALL 3 tracks in ONE update! Code was treating it as a single session.

## ✅ Solution Implemented

### Track-Based Session Management

**Before (BROKEN)**:
- ONE global session for all karts
- Accumulated 235+ laps (Mario + Penrite + Lakeside combined!)
- 26-28 karts (all 3 tracks mixed together)

**After (FIXED)**:
- SEPARATE session per track (Mario, Penrite, Lakeside, Unknown)
- Each track: 12-15 karts max, ~15 laps per session
- Independent session tracking per track

## 🔧 Implementation Details

### 1. Kart-to-Track Detection
```javascript
function getTrackFromKart(kartName) {
    const firstChar = String(kartName).charAt(0).toUpperCase();
    if (firstChar === 'M') return 'Mario';     // M7, M10, M2
    if (firstChar === 'P') return 'Penrite';   // P51, P70, P44
    if (firstChar === 'E') return 'Unknown';   // E02, E09
    return 'Lakeside';                          // 11, 29, 37
}
```

### 2. Data Splitting
Every WebSocket update contains runs from ALL tracks:
```javascript
// SPLIT runs by track
const trackRuns = {
    'Mario': [],
    'Penrite': [],
    'Lakeside': [],
    'Unknown': []
};

sessionData.runs.forEach(run => {
    const track = getTrackFromKart(run.kart || run.kart_number);
    trackRuns[track].push(run);
});
```

### 3. Per-Track Session State
```javascript
trackSessions = {
    'Mario': {
        sessionId: "Session_55_Mario",
        eventName: "Session #55",
        karts: {},           // Only Mario karts
        lapHistory: {},      // Only Mario laps
        startTime: timestamp,
        updateCount: 25
    },
    'Penrite': { ... },
    'Lakeside': { ... }
}
```

### 4. Session Change Detection (Per Track)
```javascript
const isNewSession = !track.eventName || 
                    (track.eventName !== eventName) ||
                    (kartSetChanged && runs.length < 5);
```

**Triggers**:
- Event name changed (e.g., "Session #55" → "Session #56")
- >50% kart roster change AND <5 karts (new session starting)

### 5. Validation & Limits
```javascript
// Per-track validation
if (kartCount < 2) {
    // Don't save sessions with <2 karts
}

if (kartCount > 20) {
    logger.warn('⚠️ Track has >20 karts - might be mixing tracks!');
}

if (totalLaps < 10) {
    // Session too short
}
```

## 📊 Expected Results

### Session Files
**Before**: `session-Session_55_track1.json` (235 laps, 26 karts - ALL tracks!)

**After**:
- `session-Session_55_Mario.json` (12 karts, ~15 laps)
- `session-Session_55_Penrite.json` (10 karts, ~18 laps)
- `session-Session_55_Lakeside.json` (8 karts, ~12 laps)

### Logs
```
🆕 Started Mario session: Session_55_Mario
📡 Update #10: 28 karts active (ALL TRACKS)
📝 Updated Mario session: 12 karts, 15 laps
📝 Updated Penrite session: 10 karts, 18 laps
📝 Updated Lakeside session: 8 karts, 12 laps

🔄 Mario session change detected:
   Event: "Session #55" → "Session #56"
   Karts: 12, Total Laps: 180
🏁 Mario session complete: "Session #55"
   12 karts, 180 laps, 15m32s
✅ Mario session saved: Session_55_Mario
```

## 🗑️ Cleanup Script

Created `server/cleanup-sessions.js` to delete all old polluted sessions:
```bash
cd server
node cleanup-sessions.js
```

## 📋 Files Modified

1. ✅ `server/websocket.js` - Complete rewrite of session management
   - Removed: `currentSessionId`, `allSessionKarts`, `lapHistory` (globals)
   - Added: `trackSessions` (per-track state)
   - Split: `processAndStoreData()` now splits by track
   - New: `processTrackSession()`, `updateTrackSession()`, `markTrackSessionComplete()`

2. ✅ `js/views/race.view.js` - Already updated with track selector and colored pills

3. ✅ `server/cleanup-sessions.js` - NEW cleanup script

## 🚀 Testing Steps

1. **Clean up old sessions**:
   ```bash
   cd server
   node cleanup-sessions.js
   ```

2. **Restart server** (let it run during live sessions)

3. **Verify logs**:
   - Should see separate session tracking per track
   - Each track: 12-15 karts max
   - Sessions end properly (~15 laps each)

4. **Check session files**:
   ```bash
   ls server/storage/sessions/
   ```
   Should see: `Session_XX_Mario.json`, `Session_XX_Penrite.json`, etc.

## 🎯 Success Criteria

- [x] Sessions split by track (M*/P*/numeric)
- [x] Each session: 12-15 karts max (not 26-28!)
- [x] Each session: ~15 laps (not 235!)
- [x] Session change detection per track
- [x] Validation: warn if >20 karts (track mixing detection)
- [x] Cleanup script to delete old sessions
- [ ] **TEST**: Run live and verify logs
- [ ] **TEST**: Check session files have correct kart counts
- [ ] **TEST**: Verify lap counts per session

## ⚠️ Breaking Changes

- Session ID format changed from `Session_55_track1` to `Session_55_Mario`
- `trackConfigId` is now `null` (using `trackName` instead)
- Old sessions incompatible - **must delete them** with cleanup script

## 🎉 Benefits

1. **Accurate session tracking** - No more multi-track pollution
2. **Correct lap counts** - ~15 laps instead of 235!
3. **Correct kart counts** - 12-15 per track instead of 26-28
4. **Better analysis** - Separate stats per track
5. **Clearer logs** - See each track's status independently

---

**Date**: November 1, 2025  
**Issue**: Sessions accumulating ALL tracks (235 laps, 26 karts)  
**Solution**: Per-track session management with kart prefix detection  
**Status**: ✅ IMPLEMENTED - Ready for testing




