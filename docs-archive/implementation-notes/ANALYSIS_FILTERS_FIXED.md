# ✅ Analysis Screen Filters Fixed

## Changes Made

### 1. ✅ Filter Out Mock Data from Kart Analysis

**File**: `js/app.main.js` - `collectKartAnalysisLap()` function

**Problem**: Mock/test data was being added to long-term kart performance analysis, contaminating real kart statistics.

**Solution**: Added filter to exclude mock data before it's added to analysis:

```javascript
// FILTER: Exclude mock/test data from kart analysis
// WHY: Mock data is for development/testing and shouldn't contaminate real kart performance data
if (state.sessionData?.isMock) {
    console.log(`🎭 Excluding mock data lap from analysis: ${run.name}`);
    return; // Don't add mock data to kart analysis
}
```

**Result**: Mock data sessions (used for testing) will now show in live view but won't be saved to the kart analysis database.

### 2. ✅ Fixed Track Configuration Filter

**File**: `js/views/analysis.view.js`

**Problem**: Track configuration filter dropdown wasn't properly filtering the data due to type comparison issues (string vs number).

**Solution**: Added explicit string conversion and debug logging:

```javascript
// Convert to string for comparison (track config IDs are stored as strings)
const trackConfigId = selectedTrackConfig === 'all' ? null : String(selectedTrackConfig);

console.log('🔍 Analysis Filter:', { selectedTrackConfig, trackConfigId });
```

And in the filter function:

```javascript
// Ensure both values are strings for comparison
const trackConfigStr = String(trackConfigId);
filteredData = {
    ...kartAnalysisData,
    laps: kartAnalysisData.laps.filter(lap => String(lap.trackConfigId) === trackConfigStr)
};
console.log(`🔍 Filtered laps for track ${trackConfigStr}: ${filteredData.laps.length} / ${kartAnalysisData.laps.length}`);
```

**Result**: Track configuration filter now works correctly, showing only karts/laps from the selected track layout.

## How It Works

### Mock Data Filtering

```
┌─────────────────────────┐
│  Mock Session Running   │
│  (isMock = true)        │
└──────────┬──────────────┘
           │
           ↓
    ┌──────────────┐
    │  New Lap     │
    └──────┬───────┘
           │
           ↓
    ┌────────────────────────┐
    │ collectKartAnalysisLap │ ← Checks if isMock
    └─────────┬──────────────┘
              │
       ┌──────┴──────┐
       │             │
     YES            NO
  (isMock=true)  (real data)
       │             │
       ↓             ↓
   Skip/Return   Add to Analysis
   
   ✅ Live view: Shows lap
   ❌ Analysis:  Not saved
```

### Track Configuration Filter

```
Analysis Tab
├── Track Config Dropdown
│   ├── All Track Configurations (null)
│   ├── Track 1 (Short Circuit)
│   └── Track 2 (Long Circuit)
│
└── Filter Applied
    ├── If "All": Show all laps
    └── If "Track 1": 
        └── Filter: lap.trackConfigId === "1"
            ├── Kart #5 (Track 1) ✅ Show
            ├── Kart #5 (Track 2) ❌ Hide
            ├── Kart #12 (Track 1) ✅ Show
            └── Kart #23 (Track 2) ❌ Hide
```

## Testing

### To Test:

1. **Hard refresh browser**: `Ctrl+Shift+R`

2. **Test Mock Data Filtering**:
   - Enable mock mode from Settings
   - Let it run a session
   - Go to Analysis tab
   - Mock karts should NOT appear in the analysis

3. **Test Track Configuration Filter**:
   - Go to Analysis tab
   - If multiple track configs exist, dropdown will show
   - Select a specific track configuration
   - Console should show:
     ```
     🔍 Analysis Filter: {selectedTrackConfig: "2", trackConfigId: "2"}
     🔍 Filtered laps for track 2: 45 / 120
     ```
   - Rankings table should update to show only karts from that track

## Benefits

### ✅ Clean Analysis Data
- **Before**: Mock data mixed with real data, skewing statistics
- **After**: Only real race data in long-term analysis

### ✅ Accurate Track Comparison
- **Before**: Track filter might not work due to type mismatch
- **After**: Reliably filters by track configuration

### ✅ Better Insights
- Separate analysis for different track layouts
- No contamination from test/development sessions
- More accurate kart performance metrics

## Debug Console Logs

When filtering is active, you'll see:

```
🔍 Analysis Filter: {selectedTrackConfig: "2", trackConfigId: "2"}
🔍 Filtered laps for track 2: 45 / 120
```

This helps verify:
- Which track config is selected
- How many laps match the filter
- If the filter is working correctly

## Existing Filters (Still Active)

The analysis already had these filters, which continue to work:

1. **60-Second Lap Filter**
   - Excludes laps >60 seconds
   - Prevents incidents/errors from affecting analysis

2. **Stale Driver Filter**
   - Excludes laps from drivers not seen in 5+ minutes
   - Prevents old session data contamination

3. **NEW: Mock Data Filter**
   - Excludes mock/test session data
   - Keeps analysis clean for real-world use

---

**Status**: ✅ COMPLETE  
**Action Required**: Hard refresh browser  
**Result**: Clean analysis data, working track config filter


