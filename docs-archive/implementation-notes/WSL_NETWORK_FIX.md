# 🔧 WSL Network Configuration Fix

## Issue
Frontend (running on Windows at `http://localhost:8000`) cannot connect to backend (running in WSL at `http://localhost:3001`) due to WSL network isolation.

## Solution Options

### Option 1: Find and Use WSL IP Address (Recommended)

#### Step 1: Get WSL IP Address
In your **WSL terminal**, run:
```bash
hostname -I | awk '{print $1}'
```
Or:
```bash
ip addr show eth0 | grep "inet\b" | awk '{print $2}' | cut -d/ -f1
```

You'll get something like: `172.18.224.45` (your IP will be different)

#### Step 2: Update Frontend Config
Edit `js/core/config.js` and change line 52:

**Before:**
```javascript
SERVER_URL: 'http://localhost:3001',
```

**After:**
```javascript
SERVER_URL: 'http://172.18.224.45:3001',  // Use YOUR WSL IP
```

#### Step 3: Hard Refresh Browser
Press `Ctrl+Shift+R` to reload with the new config.

---

### Option 2: Windows Port Forwarding (Alternative)

In **Windows PowerShell (as Administrator)**, run:
```powershell
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=<WSL_IP>
```

Replace `<WSL_IP>` with your WSL IP from Step 1 above.

To verify:
```powershell
netsh interface portproxy show all
```

To remove later:
```powershell
netsh interface portproxy delete v4tov4 listenport=3001 listenaddress=0.0.0.0
```

---

### Option 3: Run Server on Windows (Simplest)

Instead of running in WSL, run the server in **Windows PowerShell**:

```powershell
cd server
npm start
```

This avoids all network routing issues since both frontend and backend run on the same localhost.

---

## Quick Test

After applying any solution, test the connection:

### From Windows PowerShell:
```powershell
# Test with WSL IP (use YOUR IP)
curl http://172.18.224.45:3001/health

# Or if using port forwarding:
curl http://localhost:3001/health
```

Should return:
```json
{"status":"OK","websocket":{"connected":true},"timestamp":"..."}
```

### From Browser Console (after hard refresh):
```javascript
fetch('http://172.18.224.45:3001/health')  // Use YOUR WSL IP
  .then(r => r.json())
  .then(console.log)
```

---

## 🎯 Recommended Approach

**For Development:** Use **Option 1** (WSL IP) - just update the config once
**For Production:** Backend and frontend should be on same domain/server (no CORS issues)

---

## WSL IP Notes

⚠️ **WSL IP can change** when you restart Windows or WSL. If connection breaks after restart:
1. Get new WSL IP with `hostname -I`
2. Update `js/core/config.js`
3. Hard refresh browser

💡 **Pro Tip:** Add this to your WSL `.bashrc` to always show IP:
```bash
echo "WSL IP: $(hostname -I | awk '{print $1}')"
```

---

## Current Status

✅ Code fixes applied:
- CONFIG import added to sse.service.js
- Data validation in handleSessionData
- CORS headers fixed in backend

⏳ **Action needed:** Apply one of the network solutions above to connect Windows frontend to WSL backend.


