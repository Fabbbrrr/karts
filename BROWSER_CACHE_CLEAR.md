# 🔄 Clear Browser Cache - Fix "process is not defined"

## The Problem

Your browser has cached the old version of `server-api.service.js` that had the error. The file is already fixed, but the browser is still using the cached version.

## Solution: Hard Refresh

### Option 1: Keyboard Shortcut (Fastest)

**Windows/Linux:**
- Press `Ctrl + Shift + R`
- Or `Ctrl + F5`

**Mac:**
- Press `Cmd + Shift + R`
- Or `Cmd + Option + R`

### Option 2: Developer Tools Method

1. Open Developer Tools: `F12` or `Ctrl+Shift+I`
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Option 3: Clear Cache Manually

**Chrome/Edge:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh the page

**Firefox:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cache"
3. Click "Clear Now"
4. Refresh the page

### Option 4: Disable Cache (Development)

**Keep Developer Tools open:**
1. Press `F12` to open DevTools
2. Go to Network tab
3. Check "Disable cache"
4. Keep DevTools open while developing

### Option 5: Private/Incognito Window

1. Open new incognito window: `Ctrl + Shift + N`
2. Navigate to `http://localhost:8000`
3. Should work without cached files

## Verify the Fix

After hard refresh, open browser console (F12) and you should see:

```
✅ Good output:
🏎️ Initializing Karting Live Timer v2.0...
ℹ️ Server integration disabled (using local storage only)
🔌 Connecting to https://live.racefacer.com:3123...
```

```
❌ If you still see this, cache not cleared:
Uncaught ReferenceError: process is not defined
```

## Alternative: Stop the Server and Restart

Sometimes the HTTP server caches files:

```bash
# 1. Stop your server (Ctrl+C)

# 2. Restart it
python -m http.server 8000
# or
npx http-server -p 8000

# 3. Hard refresh browser (Ctrl+Shift+R)
```

## Nuclear Option: Clear Everything

If nothing else works:

1. **Close browser completely**
2. **Clear all cache**:
   - Chrome: `chrome://settings/clearBrowserData`
   - Firefox: `about:preferences#privacy`
3. **Restart browser**
4. **Navigate to app again**

## Prevention: Disable Cache During Development

Add this to your HTTP server:

```bash
# Python with no-cache headers
python -m http.server 8000 --no-cache

# Or use npx http-server with cache disabled
npx http-server -p 8000 -c-1
```

## Check File Contents

To verify the file is actually fixed, check in DevTools:

1. Open DevTools (F12)
2. Go to Sources tab
3. Navigate to `js/services/server-api.service.js`
4. Look at line 13-14, should say:
```javascript
// Uses CONFIG.SERVER_URL if available, otherwise defaults to localhost
let SERVER_URL = CONFIG.SERVER_URL || 'http://localhost:3001';
```

If it shows `process.env.SERVER_URL`, the cache is still old!

## Success Checklist

- [ ] Hard refresh done (Ctrl+Shift+R)
- [ ] No "process is not defined" error
- [ ] Console shows initialization messages
- [ ] App connects to RaceFacer successfully
- [ ] No JavaScript errors in console

## Still Having Issues?

If hard refresh doesn't work:

```bash
# 1. Check the actual file on disk
cat js/services/server-api.service.js | grep -n "process"
# Should return nothing

# 2. Check what browser is loading
# In browser DevTools > Sources > server-api.service.js
# Manually check line 13

# 3. Try different browser (to rule out cache issues)
# Edge, Firefox, Chrome - try another one
```

## Quick Test

Run this in browser console to see what's loaded:

```javascript
// This will show the actual code the browser loaded
fetch('/js/services/server-api.service.js')
  .then(r => r.text())
  .then(code => {
    if (code.includes('process.env')) {
      console.error('❌ OLD VERSION - Cache not cleared!');
    } else {
      console.log('✅ NEW VERSION - Cache cleared successfully!');
    }
  });
```

---

**TL;DR**: Press `Ctrl + Shift + R` to hard refresh! The file is fixed, your browser just needs to reload it. 🔄


