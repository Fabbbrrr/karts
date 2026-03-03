# TRACK FIXES & COLLAPSIBLE VIEW - COMPLETE

## 🔍 Issues Fixed

### 1. Position Calculation Was Wrong
**Problem**: Karts with better lap times showed higher position numbers (P5, P6 instead of P1, P2)

**Root Cause**: Position calculation was using overall `pos` from WebSocket instead of recalculating per-track based on lap times

**Solution**: 
- Sort by `best_time_raw` (ascending = fastest first)
- Assign `trackPosition` 1, 2, 3... based on sorted order
- Lower lap time → Lower position number (P1 is fastest)

### 2. Track Names Were Wrong
**Problem**: Using "Mario" instead of proper track names based on user's venue analysis

**Corrected Mapping**:
- **Lakeside** (Super Karts) - Numeric/no prefix (11, 29, 37) - 32s record - **FASTEST**
- **Penrite** (Sprint Karts) - P prefix (P51, P70, P44) - 32s record
- **Mushroom** (Mini Karts) - M prefix (M7, M10, M2) - **Kids track, slow**
- **Rimo** (Rookie) - E prefix (E02, E09)

### 3. Track Display Order
**Problem**: Tracks displayed in random order

**Solution**: Fixed display order with Lakeside first (as default/top track):
1. Lakeside (Super Karts - fastest, default expanded)
2. Penrite (Sprint Karts)
3. Mushroom (Mini Karts - kids)
4. Rimo (Rookie)

### 4. No Collapsible Tracks
**Problem**: All tracks always visible, cluttered UI

**Solution**: 
- Each track has a clickable header with ▼/▶ toggle
- Click to expand/collapse
- Lakeside expanded by default
- Visual feedback: "Click to expand/collapse" hint

## ✅ Implementation Details

### Frontend (`js/views/race.view.js`)

**1. Track Detection**:
```javascript
function getTrackFromKart(run) {
    const kartName = run.kart || '';
    const firstChar = String(kartName).charAt(0).toUpperCase();
    
    if (firstChar === 'M') return 'Mushroom';  // Kids track
    if (firstChar === 'P') return 'Penrite';   // Sprint karts
    if (firstChar === 'E') return 'Rimo';      // Rookie
    return 'Lakeside';                          // Super Karts (fastest)
}
```

**2. Position Calculation**:
```javascript
// Sort by best lap time (ascending = faster first)
group.sort((a, b) => {
    const timeA = a.best_time_raw || 999999999;
    const timeB = b.best_time_raw || 999999999;
    return timeA - timeB; // Ascending: fastest (lowest time) first
});

// Assign positions: 1 = fastest, 2 = second fastest, etc.
group.forEach((run, index) => {
    run.trackPosition = index + 1;
});
```

**3. Collapsible Headers**:
```javascript
// Each track has a toggle button
<span id="track-toggle-${trackId}">▼</span>

// Click handler to expand/collapse
header.addEventListener('click', () => {
    if (container.style.display === 'none') {
        container.style.display = 'block';
        toggle.textContent = '▼';
    } else {
        container.style.display = 'none';
        toggle.textContent = '▶';
    }
});
```

**4. Track Display**:
- Lakeside expanded by default: `container.style.display = 'block'`
- Others can be expanded/collapsed
- Border color matches track pill color
- Visual hierarchy with icons

### Backend (`server/websocket.js`)

**1. Track Detection** (matching frontend):
```javascript
function getTrackFromKart(kartName) {
    const firstChar = String(kartName).charAt(0).toUpperCase();
    if (firstChar === 'M') return 'Mushroom';
    if (firstChar === 'P') return 'Penrite';
    if (firstChar === 'E') return 'Rimo';
    return 'Lakeside';
}
```

**2. Position Recalculation**:
```javascript
// Sort by best lap time
const sortedRuns = [...runs].sort((a, b) => {
    const timeA = a.best_time_raw || 999999;
    const timeB = b.best_time_raw || 999999;
    return timeA - timeB;
});

// Assign track positions
sortedRuns.forEach((run, index) => {
    run.trackPosition = index + 1;
});

// Override pos field with track-specific position
track.karts[kartKey] = {
    ...track.karts[kartKey],
    ...run,
    pos: run.trackPosition,
    position: run.trackPosition,
    lastSeen: Date.now()
};
```

## 📊 Before & After

### Before:
- ❌ Kart with 32.5s lap time → P6 (wrong!)
- ❌ Kart with 34.2s lap time → P2 (wrong!)
- ❌ Using "Mario" instead of "Mushroom"
- ❌ All tracks always visible
- ❌ Random track order

### After:
- ✅ Kart with 32.5s lap time → P1 (fastest!)
- ✅ Kart with 34.2s lap time → P6 (correct)
- ✅ Proper track names (Lakeside, Penrite, Mushroom, Rimo)
- ✅ Collapsible tracks with toggle buttons
- ✅ Lakeside first (default expanded)
- ✅ Positions calculated per track, sorted by lap time

## 🎨 UI Features

### Track Headers:
```
▼ 🏁 Lakeside Track (12 karts)     Click to expand/collapse
```

### Colors:
- Lakeside: #ffffff (white) - Super Karts
- Penrite: #808080 (grey) - Sprint Karts
- Mushroom: #ff0000 (red) - Mini Karts (kids)
- Rimo: #ffaa00 (orange) - Rookie

### Track Pills on Each Kart:
- Colored badge showing track name
- White text on dark backgrounds, black text on white (Lakeside)

## 📋 Files Modified

1. ✅ `js/views/race.view.js` - Frontend display logic
   - `getTrackFromKart()` - Updated track detection
   - `getTrackColor()` - Updated colors
   - `getTrackOrder()` - NEW function for display order
   - `updateRaceView()` - Position calculation by lap time
   - `updateTrackSelector()` - Tracks in correct order
   - `renderTrackGroup()` - Collapsible headers

2. ✅ `server/websocket.js` - Backend session management
   - `getTrackFromKart()` - Updated track detection
   - `processTrackSession()` - Position recalculation per track
   - Track groups changed to: Mushroom, Penrite, Lakeside, Rimo

3. ✅ `server/cleanup-sessions.js` - Cleaned up 50 old sessions

## 🚀 Testing Results

### Cleanup:
```
✅ Cleanup complete! Deleted 50 session files.
   Ready for fresh session tracking.
```

### Expected Behavior:
1. **Lakeside Track** (Super Karts):
   - Expanded by default
   - Fastest karts (32-33s lap times)
   - Positions: P1 (fastest) → P15

2. **Penrite Track** (Sprint Karts):
   - Collapsed by default (click to expand)
   - Similar speed to Lakeside (32-33s)
   - Positions: P1 (fastest) → P15

3. **Mushroom Track** (Kids):
   - Collapsed by default
   - Slowest karts (longer lap times)
   - Positions: P1 (fastest of mini karts) → P15

4. **Rimo Track** (Rookie):
   - Collapsed by default
   - E-prefix karts
   - Positions: P1 → P15

## 🎯 Success Criteria

- [x] Positions sorted by lap time (fastest = P1)
- [x] Track names corrected (Mushroom, not Mario)
- [x] Lakeside first in display order
- [x] Tracks collapsible with toggle buttons
- [x] Lakeside expanded by default
- [x] Track-specific colors maintained
- [x] Old sessions cleaned up
- [ ] **TEST**: Verify positions in live race
- [ ] **TEST**: Verify track collapse/expand works
- [ ] **TEST**: Verify Lakeside shows first

## 📝 Notes

### Track Speed Comparison:
- **Lakeside** (Super Karts): ~32s (world record)
- **Penrite** (Sprint Karts): ~32s (similar speed)
- **Mushroom** (Mini Karts): Slower (kids track)
- **Rimo** (Rookie): Unknown, likely slower

### Position Logic:
```
P1 = Fastest lap time on this track
P2 = Second fastest
P3 = Third fastest
...
P15 = 15th fastest (display limit)
```

### Collapse/Expand:
- Click anywhere on track header to toggle
- ▼ = Expanded
- ▶ = Collapsed
- State not saved (resets on page refresh)

---

**Date**: November 1, 2025  
**Issues**: Wrong positions, wrong track names, no collapsible view  
**Solution**: Lap time-based positions, correct track mapping, collapsible headers  
**Status**: ✅ IMPLEMENTED - Ready for testing

**Next Step**: Restart server and refresh browser to see changes!




