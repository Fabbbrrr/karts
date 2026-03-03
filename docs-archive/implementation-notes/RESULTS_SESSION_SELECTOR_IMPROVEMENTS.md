# ✅ Results Page Session Selector Improved

## Changes Made

### 1. ✅ Backend Storage Filtering (`server/storage.js`)
**Only save sessions with >1 kart and ≥10 laps**

```javascript
// ONLY save sessions with meaningful data (>1 kart, >10 laps)
const kartCount = sessionData?.runs?.length || 0;
const totalLaps = analysis?.summary?.totalLaps || 0;

if (kartCount <= 1 || totalLaps < 10) {
  logger.debug(`Skipping save - insufficient data (${kartCount} karts, ${totalLaps} laps) - need >1 kart and >=10 laps`);
  return;
}
```

### 2. ✅ Winner Calculation (`server/analysis.js`)
**Added winner determination to analysis results**

```javascript
// Determine winner (driver with best lap time)
const winner = analysesWithIndex.length > 0
  ? {
      name: analysesWithIndex[0].driverName,
      kartNumber: analysesWithIndex[0].kartNumber,
      bestLap: analysesWithIndex[0].bestLapFormatted,
      bestLapRaw: analysesWithIndex[0].bestLap
    }
  : null;

// Added to summary and return value
summary: {
  ...
  winner: winner
}
```

### 3. ✅ Session Formatting (`js/services/server-api.service.js`)
**Transform backend sessions with date and winner info**

```javascript
return sessions.map(session => {
    const timestamp = new Date(session.timestamp);
    return {
        sessionId: session.sessionId,
        timestamp: timestamp.getTime(),
        date: timestamp.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        }),
        startTime: timestamp.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        }),
        eventName: session.sessionData?.event_name || session.analysis?.summary?.eventName || 'Race',
        kartCount: session.analysis?.summary?.totalKarts || 0,
        totalLaps: session.analysis?.summary?.totalLaps || 0,
        winner: session.analysis?.winner || null,
        sessionData: session.sessionData,
        analysis: session.analysis,
        lapHistory: session.lapHistory,
        source: 'server' // Mark as server-sourced
    };
}).sort((a, b) => b.timestamp - a.timestamp);
```

### 4. ✅ Session Label Display (`js/services/session-history.service.js`)
**Already implemented - shows date, time, and winner**

```javascript
export function getSessionLabel(session) {
    const winner = session.winner?.name && session.winner.name !== 'No Winner' && session.winner.name !== 'Unknown'
        ? `${session.winner.name} (#${session.winner.kartNumber}) - ${session.winner.bestLap}`
        : session.eventName;
    
    const sourceIcon = session.source === 'server' ? '☁️' : '📅';
    return `${sourceIcon} ${session.date} - ${session.startTime} - ${winner}`;
}
```

## Expected Behavior

### Session Selector Dropdown

**Before:**
```
🔴 Live
```

**After:**
```
🔴 Live
☁️ Oct 31, 2025 - 13:45 - John Doe (#12) - 45.234s
☁️ Oct 31, 2025 - 13:30 - Jane Smith (#5) - 44.891s
☁️ Oct 31, 2025 - 13:15 - Bob Wilson (#8) - 46.123s
```

### Features

- ✅ **Only meaningful sessions saved** (>1 kart, ≥10 laps)
- ✅ **Winner identified** (fastest lap time)
- ✅ **Formatted display** (date, time, winner name, kart, best lap)
- ✅ **Cloud icon** (☁️) indicates server-sourced sessions
- ✅ **Sorted** by timestamp (most recent first)
- ✅ **Selectable** - clicking loads full session data for analysis

## Testing Steps

### 1. Restart Backend Server
```bash
cd server
npm start
```

### 2. Hard Refresh Browser
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### 3. Wait for Active Race
- Backend will collect data during races
- Sessions with >1 kart and ≥10 laps will be saved automatically

### 4. Check Results Tab
- Click on **Results** tab
- Session selector should now show past sessions
- Format: `☁️ Date - Time - Winner Name (#Kart) - Best Lap`

### 5. Select Previous Session
- Click dropdown
- Select a previous session
- UI should load and display that session's complete results

## Validation

### Backend Logs
Should show when sessions are saved:
```
📊 Running analysis and saving session...
Analyzed 8 karts
Analysis complete: 8 karts, 42 laps
✅ Session saved: 8 karts, 42 laps total
```

Should skip sessions that don't meet criteria:
```
Skipping save - insufficient data (1 karts, 5 laps) - need >1 kart and >=10 laps
```

### Browser Console
Should show sessions being fetched:
```
📡 Fetching sessions from backend...
✅ Loaded 5 sessions from backend
```

### API Check
```powershell
curl http://172.26.51.66:3001/api/sessions
```

Should return array of sessions with:
- `sessionId`
- `timestamp`
- `sessionData` (with `runs` array)
- `analysis` (with `winner` object)
- `lapHistory`

## Files Modified

1. `server/storage.js` - Updated session save validation
2. `server/analysis.js` - Added winner calculation
3. `js/services/server-api.service.js` - Enhanced session formatting
4. `js/services/session-history.service.js` - Already had proper label formatting

## Notes

- **No changes needed to Results view** - it already uses the correct services
- **Winner = fastest lap** - not by position (practice sessions don't have final positions)
- **Cloud icon (☁️)** - distinguishes server sessions from local browser cache
- **Automatic cleanup** - old sessions are automatically removed based on `MAX_SESSIONS` config

---

**Status**: ✅ COMPLETE  
**Action Required**: Restart backend + hard refresh browser


