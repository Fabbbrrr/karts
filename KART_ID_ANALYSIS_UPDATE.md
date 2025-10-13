# Kart Analysis: Using kart_id for Proper Uniqueness

## Problem Statement

The Analysis tab needs to track the **physical kart** as uniquely as possible, not just the display number. 

**Why?**
- `kart_number` (e.g., "14", "05") can be changed/reassigned
- A physical kart might be renumbered but is still the same kart
- Analysis should track actual kart performance, not arbitrary numbers

## Solution

Updated the kart analysis system to use `kart_id` as the primary unique identifier.

### Data Structure

From `data-example.json`:
```json
{
  "kart_id": 154,          // Database ID - unique per physical kart
  "kart_number": "14",     // Display number - can be changed
  "kart": "E14"            // Full name/label
}
```

## Implementation Changes

### 1. Lap Collection (`js/app.main.js`)

**Before:** Tracked by `kart_number`
```javascript
kartNumber: run.kart_number
```

**After:** Tracks by `kart_id`
```javascript
kartId: run.kart_id ? String(run.kart_id) : run.kart_number,  // Unique ID
kartNumber: run.kart_number,  // Display number for UI
kartName: run.kart           // Full name (e.g., "E14")
```

### 2. Data Storage Structure

```javascript
// Karts keyed by kart_id
state.kartAnalysisData.karts = {
  "154": {
    kartId: "154",
    kartNumber: "14",      // Current display number
    kartName: "E14",       // Current name
    totalLaps: 50,
    bestLap: 26521,
    // ... stats
  },
  "137": {
    kartId: "137",
    kartNumber: "05",
    kartName: "E05",
    // ... stats
  }
}

// Laps array stores both
state.kartAnalysisData.laps = [
  {
    kartId: "154",         // For unique tracking
    kartNumber: "14",      // For display/reference
    kartName: "E14",
    // ... lap data
  }
]
```

### 3. Analysis Service (`js/services/analysis.service.js`)

Updated all functions to use `kartId`:

```javascript
// Before
export function calculateNormalizedIndex(kartNumber, analysisData)
export function getKartStats(kartNumber, analysisData)
export function calculateConfidence(kartNumber, analysisData)

// After
export function calculateNormalizedIndex(kartId, analysisData)
export function getKartStats(kartId, analysisData)
export function calculateConfidence(kartId, analysisData)
```

**Backward Compatibility:** Filter checks both for old data:
```javascript
const kartLaps = analysisData.laps.filter(lap => 
    lap.kartId === kartId || lap.kartNumber === kartId
);
```

### 4. Analysis View (`js/views/analysis.view.js`)

- Internal tracking: Uses `kartId`
- Display: Shows `kartNumber` to users
- Details modal: Shows `kartNumber` in title

```javascript
return {
    kartId: kartId,                          // Internal tracking
    kartNumber: kart.kartNumber || kartId,  // Display to user
    kartName: kart.kartName || kartId,
    // ... analysis data
};
```

### 5. Migration Support

Handles old data automatically:
```javascript
// Add kartId if missing (migration for old data)
if (!kart.kartId) {
    kart.kartId = kartKey;
}
// Add kartNumber if missing (for display)
if (!kart.kartNumber) {
    kart.kartNumber = kartKey;
}
```

## Benefits

### 1. **Accurate Kart Tracking**
- Same physical kart always has same `kart_id`
- Analysis persists even if kart is renumbered
- True long-term performance tracking

### 2. **Renumbering Resilience**
If track staff renumber karts:
- Old data: Kart ID 154, Number "14"
- After renumber: Kart ID 154, Number "22"
- **Analysis continues on same physical kart ✅**

### 3. **Cross-Driver Analysis**
Properly identifies when multiple drivers used the **same physical kart**:
```
Driver A used Kart ID 154 (displayed as #14)
Driver B used Kart ID 154 (displayed as #22 after renumber)
✅ System correctly identifies same kart
```

### 4. **Backward Compatibility**
- Works with old data (uses `kartNumber` as fallback)
- No data migration required
- Gradual transition as new laps are recorded

## Use Cases Comparison

| Scenario | Old (kartNumber) | New (kartId) |
|----------|-----------------|-------------|
| **Kart renumbered** | ❌ Creates duplicate entries | ✅ Continues same entry |
| **Track different karts** | ✅ Works if numbers stay same | ✅ Always works |
| **Long-term analysis** | ❌ Unreliable if renumbered | ✅ Always accurate |
| **Cross-session tracking** | ⚠️ Depends on consistency | ✅ Guaranteed unique |

## Display vs Tracking

The system now has clear separation:

**Tracking (Internal):**
- `kart_id`: Used for all analysis
- Keys in `karts` object: `"154"`, `"137"`, etc.

**Display (User-Facing):**
- `kart_number`: Shown in UI
- Table shows: `"#14"`, `"#05"`, etc.
- Updates automatically if kart is renumbered

## Summary

**Personal Records** (from previous update):
- Tracked by **driver name**
- Follows the person across any kart

**Kart Analysis** (this update):
- Tracked by **kart_id**
- Follows the physical kart regardless of renumbering

Both systems now use the most appropriate unique identifier for their purpose! 🎯

