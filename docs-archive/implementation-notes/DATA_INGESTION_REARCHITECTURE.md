# DATA INGESTION REARCHITECTURE COMPLETE

## 🔍 Problem Discovered

Analysis of 275 WebSocket updates revealed that **kart name prefixes DO NOT indicate separate physical tracks**. The same karts (P51, P70, etc.) appear across multiple `track_configuration_id` values.

## ✅ Solution Implemented

### 1. Track Identification (RACE VIEW - ✅ COMPLETE)
**Before**: Tried to detect track from kart name prefixes (M*, P*, E*)  
**After**: Use `track_configuration_id` from session data

**Track Mapping**:
- Config #1 → Penrite Track (540m)
- Config #2 → Lakeside Track (577m)  
- Config #3 → Mario Track

### 2. Session Splitting Strategy (BACKEND - 🔨 NEEDS IMPLEMENTATION)
**Session Key**: `${event_name}_${track_configuration_id}`

Example sessions found in captured data:
- `Session #55_1` - Penrite (28 karts, 0.97 min)
- `Session #55_2` - Lakeside (25 karts, 1.81 min)
- `Session #56_2` - Lakeside (22 karts, 3.65 min)
- `Session #56_3` - Mario (39 karts, 7.36 min)

**Backend Changes Needed**:
```javascript
// In server/websocket.js - generateSessionId()
function generateSessionId(sessionData) {
    const eventNumber = extractSessionNumber(sessionData.event_name); // e.g., "55" from "Session #55"
    const trackConfig = sessionData.track_configuration_id || 0;
    return `Session_${eventNumber}_track${trackConfig}`;
}

// Session change detection
const isNewSession = !previousEventName || 
                     (previousEventName !== newEventName) ||
                     (currentTrackConfig !== newTrackConfig);
```

### 3. Kart Analysis Strategy (🔨 NEEDS IMPLEMENTATION)
**Critical**: Never mix lap times from different track configurations!

**Storage Structure**:
```javascript
kartAnalysisData = {
    "P51_track1": {  // Kart ID + track config
        kart: "P51",
        trackConfigId: 1,
        trackName: "Penrite",
        laps: [...],
        bestLap: 15641,
        avgLap: 17832
    },
    "P51_track2": {  // Same kart, different track
        kart: "P51",
        trackConfigId: 2,
        trackName: "Lakeside",
        laps: [...],
        bestLap: 18200,
        avgLap: 19500
    }
}
```

**Backend Changes Needed**:
```javascript
// In server/websocket.js - collectKartAnalysisLap()
function collectKartAnalysisLap(run, sessionData) {
    const kartId = run.kart || run.kart_number;
    const trackConfig = sessionData.track_configuration_id;
    const analysisKey = `${kartId}_track${trackConfig}`; // Unique per kart+track
    
    if (!kartAnalysisData[analysisKey]) {
        kartAnalysisData[analysisKey] = {
            kart: kartId,
            trackConfigId: trackConfig,
            trackName: getTrackName(trackConfig),
            laps: []
        };
    }
    
    kartAnalysisData[analysisKey].laps.push({
        lapTime: run.last_time_raw,
        timestamp: Date.now()
    });
}
```

### 4. Results Display (🔨 NEEDS IMPLEMENTATION)
**Session Label Format**:
```
Session #55 - Penrite - Nov 1, 2:23 PM - 28 karts - Winner: John Doe
Session #55 - Lakeside - Nov 1, 2:24 PM - 25 karts - Winner: Jane Smith
```

**Grouping**: Group sessions by track configuration with visual separator

**Backend Changes Needed**:
```javascript
// In server/storage.js - saveSessionData()
{
    sessionId: "Session_55_track1",
    eventName: "Session #55",
    trackConfigId: 1,
    trackName: "Penrite",
    trackLength: 540,
    date: "2025-11-01T02:23:04.137Z",
    karts: 28,
    laps: 450,
    duration: 582000, // milliseconds
    winner: { name: "John Doe", kart: "P51", time: "15.641" },
    runs: [...]
}
```

## 📊 Data Analysis Results

From `data-capture-2025-11-01T02-23-02.json`:
- **Duration**: 10.29 minutes
- **Updates**: 275 (0.45 updates/sec)
- **Tracks**: 3 configurations detected
- **Sessions**: 4 unique sessions
- **Karts**: 45 total (34 appeared in multiple tracks!)

### Track Configuration Details:
| Config | Name | Length | Kart Prefixes | Sessions |
|--------|------|--------|---------------|----------|
| 1 | Penrite | 540m | M, P, numeric | Session #55 |
| 2 | Lakeside | 577m | E, P, numeric | Session #55, #56 |
| 3 | Mario | Unknown | E, P, 9, numeric | Session #56 |

## 🚀 Next Steps

1. ✅ **Race View** - Fixed to use `track_configuration_id`
2. 🔨 **Backend Session Splitting** - Update `server/websocket.js`
3. 🔨 **Kart Analysis** - Add track config to analysis keys
4. 🔨 **Results View** - Show track-aware session labels
5. 🔨 **Testing** - Verify no cross-track contamination

## 📝 Files Modified

- ✅ `js/views/race.view.js` - Using track_configuration_id, removed kart prefix detection
- 📄 `server/analyze-capture.js` - Created analysis tool
- 📄 `server/storage/capture/data-capture-2025-11-01T02-23-02-analysis.txt` - Analysis report

## Files Requiring Changes

- 🔨 `server/websocket.js` - Session ID generation, kart analysis
- 🔨 `server/storage.js` - Session metadata structure
- 🔨 `js/views/results.view.js` - Session labels with track names
- 🔨 `js/views/analysis.view.js` - Filter by track config properly

## 🎯 Success Criteria

- [ ] Sessions split correctly by event + track config
- [ ] No duplicate sessions in results
- [ ] Kart analysis shows separate stats per track
- [ ] Results page shows track name in session labels
- [ ] Can filter results by track configuration
- [ ] Lap times never mixed between tracks




