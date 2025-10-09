# 🏎️ Karting Live Timer - PWA

A Progressive Web App that displays real-time go-karting session data from [RaceFacer](https://live.racefacer.com/lemansentertainment). Works on any device, no app store required!

## ✨ Features

- 📱 **Install to Home Screen** - Acts like a native app
- 🔄 **Real-time Updates** - WebSocket connection via Socket.IO
- 🎯 **Large Numbers** - Optimized for viewing while racing
- 🌐 **Cross-platform** - Android, iOS, desktop
- 📴 **Offline Ready** - Service worker caching
- 🌙 **Dark Theme** - High contrast for outdoor visibility
- 🔄 **Auto-reconnect** - Handles network interruptions

## 🚀 Quick Start

### Option 1: Test Locally (2 minutes)

1. **Open in browser:**
   ```bash
   # Navigate to folder
   cd karting-pwa
   
   # Serve files (any method works):
   # Python 3:
   python -m http.server 8000
   
   # Python 2:
   python -m SimpleHTTPServer 8000
   
   # Node.js (install http-server globally first):
   npx http-server -p 8000
   
   # PHP:
   php -S localhost:8000
   ```

2. **Open browser:**
   - Desktop: http://localhost:8000
   - Mobile: http://YOUR_IP:8000 (find IP with `ipconfig` on Windows)

3. **Install on mobile:**
   - Chrome: Menu → "Add to Home screen"
   - Safari: Share → "Add to Home Screen"

### Option 2: Deploy to GitHub Pages (5 minutes)

#### Step 1: Create Repository

1. Go to https://github.com/new
2. Repository name: `karting-timer`
3. Visibility: **Public**
4. Click **Create repository**

#### Step 2: Upload Files

**Method A: GitHub Web Interface**
```bash
# In the karting-pwa folder:
# 1. Click "uploading an existing file"
# 2. Drag all files from karting-pwa folder
# 3. Click "Commit changes"
```

**Method B: Git Command Line**
```bash
# Initialize git in karting-pwa folder
cd karting-pwa
git init
git add .
git commit -m "Initial commit: Karting Live Timer PWA"

# Push to GitHub
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/karting-timer.git
git push -u origin main
```

#### Step 3: Enable GitHub Pages

1. Go to repository **Settings**
2. Scroll to **Pages** (left sidebar)
3. Source: **Deploy from a branch**
4. Branch: **main** → folder: **/ (root)** → Save
5. Wait 1-2 minutes

#### Step 4: Access Your App

Your app is live at:
```
https://YOUR_USERNAME.github.io/karting-timer/
```

Example: `https://oicir.github.io/karting-timer/`

### Option 3: Deploy to AWS S3 (Free Tier)

```bash
# Install AWS CLI
# Configure: aws configure

# Create S3 bucket
aws s3 mb s3://karting-timer

# Upload files
cd karting-pwa
aws s3 sync . s3://karting-timer --acl public-read

# Enable static website hosting
aws s3 website s3://karting-timer --index-document index.html

# Access at: http://karting-timer.s3-website-us-east-1.amazonaws.com
```

## 📱 Installation on Mobile

### Android (Chrome)
1. Open the URL in Chrome
2. Tap **Menu (⋮)** → **"Add to Home screen"**
3. Tap **"Add"**
4. App appears on home screen with icon

### iOS (Safari)
1. Open the URL in Safari
2. Tap **Share button** (square with arrow)
3. Scroll down, tap **"Add to Home Screen"**
4. Tap **"Add"**
5. App appears on home screen

### Desktop (Chrome/Edge)
1. Look for **install icon** in address bar (⊕)
2. Click it and select **"Install"**
3. App opens in standalone window

## 🎮 Usage

1. **Launch app** - Opens to loading screen
2. **Connection** - Green indicator (top-right) = connected
3. **Select kart** - Tap your kart number from list
4. **View stats** - Full-screen display with:
   - Position (P1, P2, etc.)
   - Last lap time (orange)
   - Best lap time (green)
   - Average lap, gap, consistency
   - Session time remaining
5. **Back button** - Return to kart selection

## ⚙️ Customization

### Change Venue/Track

Edit `app.js`:
```javascript
const CONFIG = {
    SOCKET_URL: 'https://live.racefacer.com:3123',
    CHANNEL: 'lemansentertainment', // ← Change this
    RECONNECT_DELAY: 2000
};
```

### Adjust Font Sizes

Edit `styles.css`:
```css
.driver-position {
    font-size: 8rem; /* Make bigger */
}

.timing-value {
    font-size: 5rem; /* Make bigger */
}
```

### Change Colors

Edit `styles.css`:
```css
/* Primary green */
color: #00ff88; /* Change to your color */

/* Secondary orange */
color: #ffaa00; /* Change to your color */
```

## 🔧 Technical Details

### Architecture
- **HTML5** - Structure
- **CSS3** - Styling with flexbox/grid
- **Vanilla JavaScript** - No framework needed
- **Socket.IO Client** - WebSocket connection (CDN)
- **Service Worker** - Offline caching

### File Structure
```
karting-pwa/
├── index.html          # Main app structure
├── styles.css          # All styling
├── app.js             # WebSocket + UI logic
├── manifest.json      # PWA configuration
├── service-worker.js  # Offline support
├── icon-192.png       # App icon (192x192)
├── icon-512.png       # App icon (512x512)
└── README.md          # This file
```

### Browser Compatibility
- ✅ Chrome 80+ (Android/Desktop)
- ✅ Edge 80+
- ✅ Safari 13+ (iOS/macOS)
- ✅ Firefox 75+
- ✅ Samsung Internet 13+

### Network Requirements
- Internet connection for WebSocket
- ~1KB/sec data usage during session
- Works on 3G/4G/5G/WiFi

## 🖼️ Creating App Icons

You need two icon files: `icon-192.png` and `icon-512.png`

### Method 1: Free Online Tool
1. Go to https://realfavicongenerator.net/
2. Upload any image (logo, kart photo, etc.)
3. Download generated icons
4. Rename to `icon-192.png` and `icon-512.png`
5. Place in `karting-pwa` folder

### Method 2: Simple Colored Squares
Use any image editor (Paint, Photoshop, GIMP):
1. Create 192x192 black square with "🏎️" emoji
2. Save as `icon-192.png`
3. Create 512x512 version
4. Save as `icon-512.png`

### Method 3: Use Placeholders (Temporary)
Download from placeholder service:
```bash
# 192x192
curl "https://via.placeholder.com/192/000000/00ff88?text=KART" -o icon-192.png

# 512x512
curl "https://via.placeholder.com/512/000000/00ff88?text=KART" -o icon-512.png
```

## 🐛 Troubleshooting

### WebSocket Not Connecting
- Check browser console (F12)
- Verify internet connection
- Test https://live.racefacer.com directly
- Try different network (mobile data vs WiFi)

### No Data Showing
- Ensure session is active on RaceFacer
- Check channel name in `app.js` matches your venue
- Look for errors in browser console

### App Won't Install
- HTTPS required (GitHub Pages has HTTPS automatically)
- Manifest.json must be valid
- Icons must exist and be correct size
- Try in Chrome/Edge (best PWA support)

### Landscape Mode Not Working
- Add to home screen first (PWA mode)
- Some browsers ignore orientation in browser mode
- Works best when installed as PWA

## 📊 GitHub Pages Tips

### Custom Domain
1. Buy domain (e.g., karting.yourdomain.com)
2. Add CNAME record pointing to `YOUR_USERNAME.github.io`
3. In repo settings → Pages → Custom domain → Enter domain
4. Wait for DNS propagation (~1 hour)

### Force HTTPS
- Settings → Pages → "Enforce HTTPS" (enabled by default)

### Update App
Just push changes to GitHub:
```bash
git add .
git commit -m "Update app"
git push
```
Changes appear in 1-2 minutes.

## 💰 Cost Breakdown

| Hosting Option | Cost | Limits |
|----------------|------|--------|
| **GitHub Pages** | **$0/month** | 100GB bandwidth/month |
| **AWS S3** | $0.023/GB | Free tier: 5GB storage, 20K requests |
| **Cloudflare Pages** | $0/month | Unlimited bandwidth |
| **Netlify** | $0/month | 100GB bandwidth/month |
| **Vercel** | $0/month | 100GB bandwidth/month |

**Recommendation:** GitHub Pages (simplest, completely free forever)

## 🔒 Security Notes

- Read-only data access
- No user data stored
- HTTPS encrypted connection
- No server-side code (pure client-side)

## 📈 Performance

- **Load time:** <1 second
- **App size:** ~50KB (without icons)
- **Data usage:** ~1KB/sec during active session
- **Offline:** Cached version works without internet

## 🚧 Future Enhancements

- [ ] Historical lap time charts
- [ ] Sector time display (S1-S4)
- [ ] Multiple driver comparison
- [ ] Session recording/replay
- [ ] Voice announcements
- [ ] Vibration alerts on best lap
- [ ] Dark/light theme toggle
- [ ] Tablet split-screen view

## 📄 License

This is an educational project. Ensure compliance with RaceFacer's terms of service.

## 🆘 Support

- **RaceFacer Issues:** Contact https://racefacer.com
- **PWA Issues:** Check browser console (F12)
- **GitHub Pages Help:** https://docs.github.com/pages

---

**Built for karting enthusiasts who want real-time data at their fingertips! 🏁**

