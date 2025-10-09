# ⚡ Quick Start - 3 Minutes to Running App

## Step 1: Create Icons (30 seconds)

You need two icon files. **Easiest method:**

### Windows (PowerShell)
```powershell
cd C:\Users\oicir\Documents\workspace\racefacerUI\karting-pwa

# Download placeholder icons
curl "https://via.placeholder.com/192/000000/00ff88.png?text=🏎️" -o icon-192.png
curl "https://via.placeholder.com/512/000000/00ff88.png?text=🏎️" -o icon-512.png
```

**Alternative:** Create any 192x192 and 512x512 PNG images and name them `icon-192.png` and `icon-512.png`

---

## Step 2: Test Locally (1 minute)

### Option A: Python (Recommended)
```powershell
cd C:\Users\oicir\Documents\workspace\racefacerUI\karting-pwa

# Python 3
python -m http.server 8000

# OR Python 2
python -m SimpleHTTPServer 8000
```

### Option B: Node.js
```powershell
npx http-server -p 8000
```

### Option C: PHP
```powershell
php -S localhost:8000
```

**Then open:** http://localhost:8000

**Test on phone:**
1. Find your PC IP: `ipconfig` (look for IPv4 Address like 192.168.1.x)
2. On phone: http://YOUR_IP:8000

---

## Step 3: Deploy to GitHub Pages (2 minutes)

### Quick Deploy (Web Interface)

1. **Create repo:** https://github.com/new
   - Name: `karting-timer`
   - Public ✅
   - Create

2. **Upload files:**
   - Click "uploading an existing file"
   - Drag ALL files from `karting-pwa` folder
   - Commit

3. **Enable Pages:**
   - Settings → Pages
   - Branch: main, folder: / (root)
   - Save

4. **Access:** https://YOUR_USERNAME.github.io/karting-timer/

---

## Install on Phone

### Android (Chrome)
1. Open your GitHub Pages URL
2. Menu (⋮) → "Add to Home screen"
3. Open from home screen

### iOS (Safari)
1. Open your GitHub Pages URL
2. Share → "Add to Home Screen"
3. Open from home screen

---

## That's It! 🎉

Your karting timer is now:
- ✅ Running on GitHub Pages (free forever)
- ✅ Installable on any device
- ✅ Auto-updating when you push changes
- ✅ Works offline (PWA caching)

**Next:** Mount phone on kart and enjoy real-time data! 🏎️💨

---

## Customize

**Change venue:**
```javascript
// Edit app.js line 8:
CHANNEL: 'your-venue-name'
```

**Make numbers bigger:**
```css
/* Edit styles.css */
.driver-position { font-size: 8rem; }
```

**Full docs:** See README.md and DEPLOYMENT.md

