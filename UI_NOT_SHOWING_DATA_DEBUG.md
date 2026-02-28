# 🔧 Debug: UI Not Showing Live Data

## Issue
Backend shows "📡 Update #20: 7 karts active" but UI shows "⚠️ No session, replay, or history data available for view update"

## Investigation

### ✅ Backend is receiving data
```bash
curl http://172.26.51.66:3001/api/current
# Returns: Full session data with 7 karts in runs array
```

### ❓ UI not receiving data
Possible causes:
1. **SSE not connecting** (expected - we saw this earlier)
2. **Polling not active** or not calling callback
3. **Browser cache** - old code still running
4. **Data not being set** to `state.sessionData`

## Fix Applied

Added debug logging to polling to see what's happening:

```javascript
// js/services/sse.service.js - startPolling()
console.debug(`📊 Polling: Received data with ${data.sessionData.runs?.length || 0} karts`);
```

## To Debug

### 1. Hard Refresh Browser (CRITICAL!)
```
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

**Then open Console (F12) and check for:**

### 2. Check for Polling Activity
Should see every second:
```
📊 Polling: Received data with 7 karts
```

If you DON'T see this, polling isn't active or callback isn't set.

### 3. Check for Data Reception
Should also see:
```
📥 [2:56:30 pm] Session data received: {runCount: 7, ...}
🔄 Updating view: race
```

If you see polling but NOT this, the callback isn't wired correctly.

### 4. Common Issues

#### Issue A: Browser Cache
**Symptom**: Console shows old code or different line numbers  
**Fix**: Hard refresh multiple times, or clear browser cache completely

#### Issue B: Polling Not Starting  
**Symptom**: No "🔄 Starting polling fallback" message  
**Check**: Is SSE trying to connect? Should see error then polling starts

#### Issue C: Wrong Callback
**Symptom**: Polling logs show data received but UI doesn't update  
**Check**: `onDataCallback` should be set when connecting

## Quick Test

Open browser console and run:
```javascript
fetch('http://172.26.51.66:3001/api/current')
  .then(r => r.json())
  .then(data => {
    console.log('Karts:', data.sessionData.runs.length);
    console.log('Data:', data.sessionData);
  });
```

Should show:
```
Karts: 7
Data: {runs: Array(7), event_name: "Session #56", ...}
```

If this works but UI still doesn't show data, it's a frontend issue (likely cache).

---

**Most Likely Fix**: Hard refresh browser to load new code with polling debug logs.


