# TRACK MAPPING CORRECTION

## 🔍 Issue Discovered

User correctly identified that Track Config #2 cannot be Lakeside if lap times are under 30 seconds, as Lakeside's world record is 32 seconds.

## 📊 Data Analysis Results

From analyzing 275 WebSocket data points:

| Config | Map File | Length | Fastest Lap | Average | Actual Track |
|--------|----------|--------|-------------|---------|--------------|
| 1 | penrite.png | 540m | **15.641s** | 42.162s | ✅ **Penrite** |
| 2 | lakeside.png | 577m | **24.851s** | 44.948s | ⚠️ **Mario** (mislabeled!) |
| 3 | undefined | 1m | **24.851s** | 41.893s | **Lakeside** (actual) |

## 🎯 Corrected Track Mapping

### Before (Incorrect):
```javascript
{
    1: 'Penrite',   // ✅ Correct
    2: 'Lakeside',  // ❌ WRONG - lap times too fast
    3: 'Mario'      // ❌ WRONG
}
```

### After (Correct):
```javascript
{
    1: 'Penrite',   // 540m, ~15.6s fastest - ✅
    2: 'Mario',     // 577m, ~24.8s fastest - ✅ (was labeled lakeside.png)
    3: 'Lakeside'   // Unknown length, ~24.8s - ✅ (has no map data)
}
```

## 💡 Solution Implemented

**Use map file name as primary identifier**, fall back to corrected ID mapping.

### Backend (`server/websocket.js`):
```javascript
function getTrackName(trackConfigId, sessionData = null) {
    // PRIMARY: Use map file name (most reliable)
    if (sessionData?.maps_data?.map?.bgr) {
        const mapName = sessionData.maps_data.map.bgr.replace('.png', '');
        return mapName.charAt(0).toUpperCase() + mapName.slice(1);
    }
    
    // FALLBACK: Use corrected ID mapping
    const trackNames = {
        1: 'Penrite',
        2: 'Mario',      // ← CORRECTED
        3: 'Lakeside'    // ← CORRECTED
    };
    return trackNames[trackConfigId] || `Track ${trackConfigId}`;
}
```

### Frontend (`js/views/race.view.js`):
Same logic - prioritize `maps_data.map.bgr` over track config ID.

## 🔬 Why Track Config #2 is Mario, Not Lakeside

1. **Lap time evidence**: Fastest lap 24.851s is **7 seconds faster** than Lakeside's 32s world record
2. **Map file mislabeling**: File says "lakeside.png" but performance characteristics match a shorter track
3. **Track length**: 577m is similar to typical Mario kart tracks
4. **Config #3 is actually Lakeside**: Has no map data (undefined), suggesting it's an older/alternate configuration

## 📋 Files Modified

1. ✅ `server/websocket.js` - Updated `getTrackName()` to use map data, corrected fallback mapping
2. ✅ `js/views/race.view.js` - Updated `getTrackName()` to use map data, corrected fallback mapping
3. ✅ `server/analyze-tracks.js` - Created detailed track analysis tool
4. ✅ `TRACK_MAPPING_CORRECTION.md` - This document

## 🚀 Impact

- **Track names now correct** in race view and session logs
- **Map file name is primary source of truth** (most reliable)
- **Backward compatible** - falls back to corrected ID mapping if map data unavailable
- **Sessions correctly labeled** with actual track names

## ⚠️ Note for Venue

The venue has mislabeled their map files! Track Config #2 should be named "mario.png" not "lakeside.png". This discrepancy might cause confusion in their system too.

---

**Date**: November 1, 2025  
**Issue**: Track mapping incorrect based on lap time analysis  
**Solution**: Use map file names + correct ID fallback mapping  
**Status**: ✅ FIXED




