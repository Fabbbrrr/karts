# 📊 Kart Analysis Data - Storage Analysis

## Data Structure Breakdown

### 1. Per Lap Record (~200 bytes each)
```javascript
{
    timestamp: 1735689000000,        // ~15 bytes
    sessionId: "2025-01-01-...",    // ~30 bytes  
    kartNumber: "12",                // ~6 bytes
    driverName: "John Doe",          // ~15 bytes avg
    lapTime: "26.123",               // ~10 bytes
    lapTimeRaw: 26123,               // ~8 bytes
    position: 5,                     // ~4 bytes
    lapNum: 10                       // ~5 bytes
}
// JSON overhead (property names, quotes, braces, commas): ~107 bytes
// Total per lap record: ~200 bytes
```

### 2. Kart Aggregation Data (per kart)
- Base metadata: ~150 bytes
- drivers[] array: ~10 bytes per driver
- driverHistory{}: ~20 bytes per driver
- lapTimes[] array: ~6 bytes per lap
- **For 500 laps on 1 kart: ~3,150 bytes**

### 3. Driver Aggregation Data (per driver)
- Base metadata: ~150 bytes
- karts[] array: ~5 bytes per kart
- kartHistory{}: ~15 bytes per kart
- lapTimes[] array: ~6 bytes per lap
- **For 500 laps by 1 driver: ~3,150 bytes**

## Storage Calculations

### Assumptions for Real-World Usage:
- **15 karts** used over time
- **30 unique drivers** over time
- Each driver averages 1.5 karts
- Each kart used by 3 drivers on average

### Storage Formula:
```
Total Size = (Laps × 200 bytes)                    [Laps Array]
           + (Laps × 6 bytes)                      [Kart lapTimes duplication]
           + (Laps × 6 bytes)                      [Driver lapTimes duplication]
           + (Karts × 200 bytes)                   [Kart metadata]
           + (Drivers × 250 bytes)                 [Driver metadata]

Total ≈ (Laps × 212) + (Karts × 200) + (Drivers × 250)
```

## Storage Requirements by Lap Count

| Laps      | Laps Array | Kart Data | Driver Data | Sessions | **TOTAL**    |
|-----------|------------|-----------|-------------|----------|--------------|
| 100       | 20 KB      | 6 KB      | 8 KB        | 1 KB     | **35 KB**    |
| 500       | 100 KB     | 18 KB     | 18 KB       | 1 KB     | **137 KB**   |
| 1,000     | 200 KB     | 33 KB     | 33 KB       | 1 KB     | **267 KB**   |
| 2,500     | 500 KB     | 78 KB     | 78 KB       | 2 KB     | **658 KB**   |
| 5,000     | 1.0 MB     | 153 KB    | 153 KB      | 2 KB     | **1.3 MB**   |
| 7,500     | 1.5 MB     | 228 KB    | 228 KB      | 2 KB     | **2.0 MB**   |
| 10,000    | 2.0 MB     | 303 KB    | 303 KB      | 2 KB     | **2.6 MB**   |
| **15,000**| **3.0 MB** | **453 KB**| **453 KB**  | **3 KB** | **3.9 MB**   |
| 20,000    | 4.0 MB     | 603 KB    | 603 KB      | 3 KB     | **5.2 MB**   |
| 25,000    | 5.0 MB     | 753 KB    | 753 KB      | 3 KB     | **6.5 MB**   |
| 30,000    | 6.0 MB     | 903 KB    | 903 KB      | 3 KB     | **7.8 MB**   |

## Browser LocalStorage Limits

| Browser        | Limit per Origin | Notes                          |
|----------------|------------------|--------------------------------|
| Chrome/Edge    | ~10 MB           | May vary slightly              |
| Firefox        | ~10 MB           | Can request more via API       |
| Safari Desktop | ~5 MB            | More restrictive               |
| Safari iOS     | ~5 MB            | Even more restrictive          |
| Private Mode   | ~5 MB            | Reduced across all browsers    |

## 🚨 Critical Thresholds

### Current Storage (15,000 laps): **~3.9 MB**
- ✅ **Safe** on all browsers
- ⚠️ Uses **78%** of Safari's limit
- ⚠️ Uses **39%** of Chrome/Firefox limit

### Recommended Limits:

#### 🟢 **GREEN ZONE: 0 - 7,500 laps** (0 - 2 MB)
- **Action:** None
- **Status:** Optimal performance, plenty of headroom
- **% of Safari limit:** 0-40%

#### 🟡 **YELLOW ZONE: 7,500 - 12,500 laps** (2 - 3.3 MB)
- **Action:** Show warning
- **Message:** "You have X laps stored (Y MB). Consider exporting data for backup."
- **% of Safari limit:** 40-66%
- **User Action:** Export button in warning

#### 🟠 **ORANGE ZONE: 12,500 - 17,500 laps** (3.3 - 4.6 MB)
- **Action:** Strong warning + offer auto-cleanup
- **Message:** "Storage is 75% full. Export data now or enable auto-cleanup?"
- **Options:**
  - Export current data
  - Enable auto-delete (delete oldest sessions beyond 12,500 laps)
  - Continue anyway (not recommended)
- **% of Safari limit:** 66-92%

#### 🔴 **RED ZONE: 17,500+ laps** (4.6+ MB)
- **Action:** Mandatory intervention
- **Message:** "Storage limit reached! You must export or delete old data to continue."
- **Options:**
  - Export all data (required before continuing)
  - Delete data older than 6 months
  - Delete data older than 3 months
  - Reset all analysis data
- **% of Safari limit:** 92%+
- **Risk:** May fail on Safari/iOS, private mode

## 💡 Recommended Implementation

### 1. Storage Monitor
Add to storage.service.js:
```javascript
export function getStorageStatus() {
    const data = loadKartAnalysisData();
    const lapCount = data.laps.length;
    const estimatedSize = (lapCount * 212) + 10000; // bytes
    const estimatedMB = (estimatedSize / (1024 * 1024)).toFixed(2);
    
    let zone = 'green';
    if (lapCount > 17500) zone = 'red';
    else if (lapCount > 12500) zone = 'orange';
    else if (lapCount > 7500) zone = 'yellow';
    
    return {
        lapCount,
        estimatedSize,
        estimatedMB,
        zone,
        percentOfLimit: ((estimatedSize / (5 * 1024 * 1024)) * 100).toFixed(1) // % of 5MB (Safari limit)
    };
}
```

### 2. Auto-Cleanup Strategy

**Option A: Session-Based Deletion (Recommended)**
- Keep last N sessions (e.g., 50 sessions)
- Delete oldest sessions when limit exceeded
- Preserves recent data, removes old
- **Pros:** Fair, predictable, preserves variety
- **Cons:** Uneven lap counts per session

**Option B: Time-Based Deletion**
- Keep last 6 months of data
- Delete anything older
- **Pros:** Clear retention policy
- **Cons:** Requires timestamp tracking

**Option C: FIFO Lap Deletion**
- Keep last 12,500 laps
- Delete oldest laps when exceeded
- **Pros:** Simple, predictable size
- **Cons:** May break session integrity

**Recommended:** **Option A** (Session-Based)

### 3. Warning UI
Add to settings:
```html
<div id="storage-warning" class="alert alert-warning">
    ⚠️ Storage: 3.2 MB used (64% of limit). 
    <button onclick="exportAnalysisData()">Export Data</button>
</div>
```

### 4. Cleanup Function
```javascript
function cleanupOldSessions(maxLaps = 12500) {
    const data = state.kartAnalysisData;
    
    if (data.laps.length <= maxLaps) return;
    
    // Sort laps by timestamp
    data.laps.sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate how many to delete
    const toDelete = data.laps.length - maxLaps;
    const deletedLaps = data.laps.splice(0, toDelete);
    
    // Rebuild kart and driver aggregations
    rebuildAggregations(data);
    
    StorageService.saveKartAnalysisData(data);
    
    return { deleted: toDelete, remaining: data.laps.length };
}
```

## 📋 Immediate Recommendations

### For Current 15,000 Lap Target:
1. ✅ **Acceptable** but approaching limits
2. ⚠️ Add storage monitoring UI immediately
3. ⚠️ Show warning at 12,500 laps
4. 🔧 Implement auto-cleanup option
5. 📤 Make export more prominent

### Safe Operating Limits:
- **Conservative (All browsers):** 12,500 laps (3.3 MB)
- **Moderate (Modern browsers):** 17,500 laps (4.6 MB)
- **Aggressive (Desktop only):** 22,500 laps (5.9 MB)

### Critical Safeguards:
1. Detect QuotaExceededError and force export
2. Implement automatic export before hitting limits
3. Warn users on iOS/Safari more aggressively
4. Consider IndexedDB for larger storage needs (25MB+ limit)

## 🎯 Answer to Your Question

**15,000 laps = ~3.9 MB**

- ✅ Safe on all browsers
- ⚠️ Should start warning at **7,500 laps** (2 MB)
- 🛑 Should require export/cleanup at **17,500 laps** (4.6 MB)
- 🔴 Absolute max: **20,000 laps** (5.2 MB) - will fail on Safari

**Recommended Thresholds:**
- **Soft warning:** 7,500 laps (show export reminder)
- **Hard warning:** 12,500 laps (suggest cleanup)
- **Forced action:** 17,500 laps (must export or delete)
- **Absolute max:** 20,000 laps (stop collecting)

