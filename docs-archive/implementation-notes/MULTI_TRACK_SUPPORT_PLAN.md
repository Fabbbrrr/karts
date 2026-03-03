# 🏁 Multi-Track Support Implementation Plan

## Overview
Allow the same venue to run multiple tracks simultaneously by filtering sessions and race views by track configuration.

## Key Changes Needed

### 1. State Management (`js/core/state.js`)
✅ **DONE**: Added multi-track support:
```javascript
currentTrackConfig: null,
trackSessions: {} // Separate sessions per track: { trackId: { sessionData, lapHistory } }
```

### 2. Backend (`server/websocket.js`)
✅ **DONE**: Already implemented:
- Session ID includes track config: `Session_61_R_track1`
- Detects track config changes as new sessions
- Stores separate files per track

### 3. Race View Filter (`js/views/race.view.js`)

**TODO**: Add track filter functionality:
```javascript
// Populate track config dropdown
function populateTrackConfigFilter(sessionData) {
    const trackConfigs = new Set();
    
    if (sessionData && sessionData.runs) {
        sessionData.runs.forEach(run => {
            const trackConfig = run.track_configuration_id || 0;
            trackConfigs.add(trackConfig);
        });
    }
    
    const filter = document.getElementById('race-track-config-filter');
    filter.innerHTML = '<option value="all">All Tracks</option>';
    
    trackConfigs.forEach(config => {
        const option = document.createElement('option');
        option.value = config;
        option.textContent = `Track ${config}`;
        filter.appendChild(option);
    });
    
    // Show/hide filter based on track count
    const filterSection = document.getElementById('race-filter-section');
    filterSection.style.display = trackConfigs.size > 1 ? 'block' : 'none';
}

// Filter runs by track config
function filterRunsByTrack(runs, trackConfigId) {
    if (trackConfigId === 'all') return runs;
    return runs.filter(run => run.track_configuration_id === parseInt(trackConfigId));
}
```

### 4. Session History (`js/services/session-history.service.js`)

**TODO**: Add track config to session labels:
```javascript
function getSessionLabel(session) {
    const date = session.date || 'Unknown Date';
    const winner = session.winner?.name || 'No Winner';
    const kartNumber = session.winner?.kartNumber || '';
    const bestLap = session.winner?.bestLapFormatted || '';
    const trackConfig = session.trackConfig || 0;
    
    return `☁️ ${date} - Track ${trackConfig} - ${winner} (#${kartNumber}) - ${bestLap}`;
}
```

### 5. Results View (`js/views/results.view.js`)

**TODO**: Filter sessions by track:
```javascript
// Add track filter dropdown to results
<select id="results-track-filter">
    <option value="all">All Tracks</option>
    <option value="1">Track 1</option>
    <option value="2">Track 2</option>
</select>

// Filter sessions
function filterSessionsByTrack(sessions, trackId) {
    if (trackId === 'all') return sessions;
    return sessions.filter(s => s.trackConfig === parseInt(trackId));
}
```

## Implementation Steps

### Step 1: Race View Track Filter ✅ (HTML exists)
- HTML already has track filter dropdown
- Need to populate it dynamically
- Filter displayed runs by selected track

### Step 2: Track Config in Session Data
- Ensure track_configuration_id flows from backend → frontend
- Store in session history
- Display in session labels

### Step 3: Multi-Track Session Management
- Keep separate lap history per track
- Allow switching between tracks in live view
- Preserve data for each track independently

### Step 4: Results/Summary Track Filter
- Add track filter to Results tab
- Add track filter to Summary tab  
- Show only sessions for selected track

## Expected Behavior

### Scenario: Two Tracks Running Simultaneously

**Track 1**: Session #61, 8 karts racing
**Track 2**: Session #62, 6 karts racing

### Race View:
```
[Track Filter: All Tracks ▼]
├─ Track 1: 8 karts
└─ Track 2: 6 karts

[Track Filter: Track 1 ▼]
└─ Track 1: 8 karts only

[Track Filter: Track 2 ▼]
└─ Track 2: 6 karts only
```

### Results View:
```
[Track Filter: All Tracks ▼]
├─ Oct 31 - Track 1 - John (#12) - 41.234s
├─ Oct 31 - Track 2 - Jane (#5) - 43.567s
└─ Oct 30 - Track 1 - Bob (#8) - 42.123s

[Track Filter: Track 1 ▼]
├─ Oct 31 - Track 1 - John (#12) - 41.234s
└─ Oct 30 - Track 1 - Bob (#8) - 42.123s
```

### Session Files:
```
server/storage/sessions/
├─ session-Session_61_track1.json  ← Track 1 session
├─ session-Session_62_track2.json  ← Track 2 session (same time, different track)
└─ session-Session_63_track1.json  ← Next Track 1 session
```

## Benefits

✅ **Separate Sessions**: Each track's data is isolated
✅ **Clear Identification**: Session labels show track number
✅ **Easy Filtering**: Quick switch between tracks
✅ **Historical Tracking**: View past sessions per track
✅ **Simultaneous Racing**: Monitor multiple tracks at once

## Files to Modify

1. ✅ `js/core/state.js` - Add trackSessions
2. ⏳ `js/views/race.view.js` - Add track filtering
3. ⏳ `js/services/session-history.service.js` - Track config in labels
4. ⏳ `js/views/results.view.js` - Track filter dropdown
5. ⏳ `js/views/summary.view.js` - Track filter dropdown
6. ⏳ `js/app.main.js` - Wire up track filter events

## Next Steps

Would you like me to:
1. **Implement race view track filtering** (populate dropdown, filter runs)
2. **Add track labels to session history**
3. **Add track filters to Results/Summary tabs**
4. **All of the above**

The backend is already ready - it separates sessions by track config!


