# 🔧 Technical Documentation

**For developers and advanced users**

---

## 📋 Table of Contents

1. [Architecture](#architecture)
2. [File Structure](#file-structure)
3. [Setup & Deployment](#setup--deployment)
4. [Configuration](#configuration)
5. [Browser Compatibility](#browser-compatibility)
6. [API & WebSocket](#api--websocket)
7. [Performance](#performance)
8. [Customization](#customization)

---

## Architecture

### Tech Stack
- **HTML5** - Semantic structure
- **CSS3** - Flexbox/Grid layouts, media queries
- **Vanilla JavaScript** - No framework dependencies
- **Socket.IO Client** - WebSocket connection (CDN v4.5.4)
- **Service Worker** - PWA offline capabilities
- **Web APIs:**
  - Wake Lock API (always-on display)
  - Web Audio API (sound alerts)
  - Vibration API (haptic feedback)
  - Local Storage API (data persistence)

### State Management
```javascript
const state = {
    socket: null,              // Socket.IO instance
    sessionData: null,         // Current race data
    isConnected: false,        // Connection status
    currentTab: 'race',        // Active tab
    settings: {...},           // User preferences
    lapHistory: {},            // Per-kart lap tracking
    startingPositions: {},     // Initial race positions
    gapHistory: {},            // Gap trend data
    sessionBest: null,         // Fastest lap overall
    personalRecords: null,     // All-time bests
    lastBestLap: {},           // For celebration detection
    lastGap: {},               // For delta calculation
    currentSessionId: null,    // Session change detection
    audioContext: null,        // Web Audio instance
    lastPosition: {}           // Position change tracking
};
```

---

## File Structure

```
karting-pwa/
├── index.html          # Main app structure, tabs, DOM
├── styles.css          # All styling, responsive design
├── app.js              # Core logic (WebSocket, UI, analytics)
├── manifest.json       # PWA configuration
├── service-worker.js   # Offline caching strategy
├── icon-192.png        # App icon (192x192)
├── icon-512.png        # App icon (512x512)
├── README.md           # User-facing documentation
├── TECHNICAL.md        # This file
└── FUTURE_FEATURES.md  # Roadmap
```

### File Sizes
- `app.js`: ~70KB (unminified)
- `styles.css`: ~20KB
- `index.html`: ~15KB
- Total (no icons): **~105KB**

---

## Setup & Deployment

### Local Development

**Requirements:**
- Any HTTP server (PWAs require HTTP/HTTPS, not `file://`)
- Modern browser

**Quick Start:**
```bash
cd karting-pwa

# Python 3
python -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

**Access:**
- Desktop: `http://localhost:8000`
- Mobile: `http://YOUR_LOCAL_IP:8000`

### Production Deployment

#### GitHub Pages (Recommended)

**Setup:**
```bash
cd karting-pwa
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

**Enable Pages:**
1. Repo Settings → Pages
2. Source: Deploy from branch → `main` → `/root`
3. Save

**URL:** `https://USERNAME.github.io/REPO/`

**Updates:**
```bash
git add .
git commit -m "Update"
git push
# Live in ~60 seconds
```

#### Other Hosting Options

| Platform | Command | Cost |
|----------|---------|------|
| **Cloudflare Pages** | `wrangler pages publish .` | Free |
| **Netlify** | `netlify deploy --prod` | Free |
| **Vercel** | `vercel --prod` | Free |
| **AWS S3** | `aws s3 sync . s3://bucket --acl public-read` | ~$0.50/mo |

---

## Configuration

### Venue/Channel

Edit `app.js` line 5-10:
```javascript
const CONFIG = {
    SOCKET_URL: 'https://live.racefacer.com:3123',
    CHANNEL: 'lemansentertainment',  // ← Change this
    RECONNECT_DELAY: 2000,
    UPDATE_INTERVAL: 50  // 50ms = 20 FPS
};
```

**Finding Your Channel:**
1. Visit `https://live.racefacer.com/YOUR_VENUE_NAME`
2. Open DevTools Network tab
3. Look for WebSocket connection
4. Channel name is in the `join` message

### Feature Toggles

Default settings in `app.js` line 13-36:
```javascript
const DEFAULT_SETTINGS = {
    mainDriver: null,
    // Display toggles
    showIntervals: true,
    showGaps: true,
    showConsistency: true,
    showAvgLap: true,
    showLastLap: true,
    // Feature toggles
    showPaceTrend: true,
    showPercentageOffBest: true,
    showGapTrend: true,
    showPositionChanges: true,
    enableBestLapCelebration: true,
    // HUD visibility
    hudShowLastLap: true,
    hudShowBestLap: true,
    hudShowAvgLap: true,
    hudShowGap: true,
    hudShowInterval: true,
    hudShowConsistency: true,
    hudShowLapHistory: true,
    hudShowStats: true
};
```

### Visual Customization

**Font Sizes** (`styles.css`):
```css
/* HUD position */
.hud-position { font-size: 12rem; }  /* Adjust as needed */

/* Lap times */
.hud-time-display { font-size: 4rem; }

/* Race list */
.race-position { font-size: 2.5rem; }
```

**Colors** (`styles.css`):
```css
:root {
    --primary: #00ff88;    /* Green - positive/improving */
    --secondary: #ffaa00;  /* Orange - neutral */
    --danger: #ff6b6b;     /* Red - negative/declining */
    --purple: #a855f7;     /* Purple - personal best */
    --gold: #FFD700;       /* Gold - records */
}
```

**Themes:**
Replace CSS variables or add theme classes.

---

## Browser Compatibility

### Fully Supported
- ✅ Chrome 80+ (Android/Desktop/ChromeOS)
- ✅ Edge 80+ (Windows/macOS/Android)
- ✅ Safari 13+ (iOS 13+/macOS)
- ✅ Samsung Internet 13+
- ✅ Firefox 75+ (some APIs limited)

### Feature Support Matrix

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| PWA Install | ✅ | ✅ | ⚠️ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Wake Lock API | ✅ | ❌ | ❌ | ✅ |
| Vibration API | ✅ | ❌ | ❌ | ✅ |
| Web Audio API | ✅ | ✅ | ✅ | ✅ |
| Socket.IO | ✅ | ✅ | ✅ | ✅ |

**Note:** Core functionality works everywhere. Advanced features (Wake Lock, Vibration) gracefully degrade.

---

## API & WebSocket

### RaceFacer Socket.IO Protocol

**Connection:**
```javascript
const socket = io('https://live.racefacer.com:3123', {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 2000
});
```

**Join Channel:**
```javascript
socket.emit('join', 'CHANNEL_NAME');
```

**Receive Data:**
```javascript
socket.on('CHANNEL_NAME', (data) => {
    // data.data contains race information
});
```

### Data Structure

```javascript
{
    data: {
        event_name: "Practice Session",
        session_name: "Qualifying",
        current_lap: 10,
        total_laps: 20,
        time_left: "5:23",
        runs: [
            {
                pos: 1,
                kart_number: "29",
                driver_name: "John Doe",
                last_time: "26.123",
                last_time_raw: 26123,  // milliseconds
                best_time: "25.987",
                best_time_raw: 25987,
                avg_time: "26.456",
                avg_time_raw: 26456,
                laps: 8,
                gap: "+0.456",
                interval: "+0.123",
                consistency: "0.234"
            },
            // ... more drivers
        ]
    }
}
```

### Session Detection Logic

**New session if:**
- `event_name` or `session_name` changes
- `current_lap` drops from 3+ back to 0-2 (restart)

**On session change, reset:**
- Lap history
- Starting positions
- Gap history
- Session best
- Delta tracking

---

## Performance

### Metrics
- **Initial Load:** < 1 second
- **Time to Interactive:** < 2 seconds
- **Update Frequency:** 50ms (20 FPS)
- **Data Usage:** ~1KB/sec active, ~0 offline
- **Memory:** ~10-15MB

### Optimizations

**DOM Updates:**
- Efficient element reuse (no `innerHTML` churn)
- `dataset.kartNumber` for tracking
- `replaceChild` instead of recreation
- Event delegation on parent elements

**Data Processing:**
- Lap history capped per kart
- Gap history limited to last 10 entries
- Trend calculations only for visible driver
- Debounced localStorage writes

**Network:**
- Service Worker caches static assets
- Socket.IO binary protocol
- Automatic reconnection
- Offline fallback

---

## Customization

### Adding New Metrics

**1. Update State:**
```javascript
// app.js - Add to state
state.myNewMetric = {};
```

**2. Calculate Data:**
```javascript
function calculateMyMetric(kartNumber, run) {
    // Your calculation logic
    return result;
}
```

**3. Update UI:**
```javascript
function updateHUDView() {
    // ... existing code ...
    const metric = calculateMyMetric(mainDriver, run);
    document.getElementById('my-metric').textContent = metric;
}
```

**4. Add HTML:**
```html
<div class="hud-card">
    <div class="hud-card-label">My Metric</div>
    <div id="my-metric" class="hud-card-value">--</div>
</div>
```

**5. Style It:**
```css
#my-metric {
    font-size: 3rem;
    color: var(--primary);
}
```

### Creating Themes

```css
/* Add to styles.css */

/* Dark theme (default) */
body {
    --bg: #000;
    --text: #fff;
    --primary: #00ff88;
}

/* Light theme */
body.light-theme {
    --bg: #fff;
    --text: #000;
    --primary: #00aa00;
}
```

Toggle via JavaScript:
```javascript
document.body.classList.toggle('light-theme');
```

---

## localStorage Keys

| Key | Content | Size |
|-----|---------|------|
| `kartingTimerSettings` | User preferences | ~500B |
| `kartingLapHistory` | Session lap data | ~5-20KB |
| `kartingPersonalRecords` | All-time bests per kart | ~1KB |
| `kartingStartingPositions` | Session start positions | ~500B |

**Export Format:**
```json
{
    "settings": {...},
    "lapHistory": {...},
    "personalRecords": {...},
    "startingPositions": {...},
    "exportDate": "2025-10-09T...",
    "version": "2.0"
}
```

---

## Advanced Features

### Wake Lock (Always-On Display)

```javascript
async function enableAlwaysOn() {
    if ('wakeLock' in navigator) {
        const wakeLock = await navigator.wakeLock.request('screen');
        console.log('Screen will stay on');
    }
}
```

**Browser Support:** Chrome, Edge (desktop/Android)

### Web Audio (Sound Alerts)

```javascript
const audioContext = new AudioContext();

function playBeep(freq, duration) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    
    oscillator.frequency.value = freq;
    gain.gain.exponentialRampToValueAtTime(
        0.01, 
        audioContext.currentTime + duration
    );
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}
```

### Haptic Feedback

```javascript
if (navigator.vibrate) {
    // Single vibration
    navigator.vibrate(200);
    
    // Pattern: vibrate, pause, vibrate
    navigator.vibrate([200, 100, 200]);
}
```

---

## Debugging

### Enable Logging

Open browser console (F12) and look for:
- `🔌 WebSocket connected`
- `🔄 New session detected`
- `🔆 Always-on display enabled`
- `🔊 Audio context initialized`

### Common Issues

**WebSocket not connecting:**
```javascript
// Check in console:
state.socket.connected  // Should be true
```

**Data not updating:**
```javascript
// Check in console:
state.sessionData  // Should have runs array
```

**Performance issues:**
- Disable all HUD components except what you need
- Close other tabs
- Clear browser cache
- Check Network tab for slow requests

---

## Build & Minification

**Optional:** Minify for production

```bash
# Install tools
npm install -g uglify-js clean-css-cli html-minifier

# Minify JS
uglifyjs app.js -o app.min.js -c -m

# Minify CSS
cleancss styles.css -o styles.min.css

# Minify HTML
html-minifier index.html -o index.min.html --collapse-whitespace
```

**Result:** ~40% size reduction

---

## Security

### Current Implementation
- ✅ Read-only WebSocket connection
- ✅ No user data sent to servers
- ✅ HTTPS required for PWA features
- ✅ No external API calls (except Socket.IO CDN)
- ✅ Client-side only (no backend)

### Recommendations
- Host on HTTPS (GitHub Pages has it automatically)
- Don't modify Socket.IO CDN URL
- Validate all data from WebSocket before display
- Don't store sensitive info in localStorage

---

## Testing

### Manual Test Checklist

- [ ] App loads and connects
- [ ] Driver selection works (click on Race tab)
- [ ] HUD tab shows selected driver data
- [ ] All tabs navigate correctly
- [ ] Settings save and persist
- [ ] Lap history tracks correctly
- [ ] F1 colors apply to laps
- [ ] Personal best celebration triggers
- [ ] Position change sounds play
- [ ] Export/import works
- [ ] Screen stays awake (if supported)
- [ ] Portrait and landscape both work
- [ ] Session reset on new race

### Browser Testing

Test in:
- Chrome (Android)
- Safari (iOS)  
- Edge (Desktop)
- Firefox (Desktop)

---

## Contributing

### Code Style
- ES6+ JavaScript
- Functional programming preferred
- Clear variable names
- Comments for complex logic
- Mobile-first CSS

### Pull Requests
- Test on mobile device
- Check console for errors
- Verify all tabs work
- Test session changes
- Update documentation

---

## License & Credits

**Built for educational purposes**

**Technologies:**
- Socket.IO by Automattic
- Icons by (customize with your own)
- Timing data via RaceFacer

**Compliance:**
- Ensure RaceFacer ToS compliance
- Check venue permissions
- Read-only access only

---

## Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Wake_Lock_API)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Need help? Check browser console logs first!**

