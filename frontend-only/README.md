# RaceFacer — Frontend-Only

A fully browser-based karting live timing app. No server required. Connects directly to RaceFacer's timing system via Socket.IO. Runs on any device with a modern browser — designed for mobile use strapped to a kart steering wheel.

## Live App

**[https://fabbbrrr.github.io/karts/](https://fabbbrrr.github.io/karts/)**

---

## Quick Start (Local)

```bash
cd racefacerUI/frontend-only
python -m http.server 8000
# Or: npx http-server -p 8000
```

Open `http://localhost:8000` in Chrome or Safari.

---

## Tabs

| Tab | What it does |
|-----|-------------|
| **Race** | Live leaderboard — all karts grouped by track (Lakeside / Penrite / Mushroom / Rimo), sorted by best lap. Tap a driver to open their HUD. |
| **HUD** | Full-screen personal driver dashboard — position, last/best/avg lap, gap, interval, consistency, lap history. Drag cards to reorder. |
| **Results** | Session standings with selectable scoring method (Fastest Lap, Total Time, Average, Best 3, Consistency). |
| **Compare** | Side-by-side two-driver stat comparison. |
| **Summary** | Main driver stats, position chart, lap history, personal records. Per-track filter. |
| **Settings** | Driver selection, display toggles, HUD card visibility, audio/TTS, data export/import. |

---

## Architecture

```
Browser
├── Socket.IO (CDN)  ──────────►  live.racefacer.com:3123
│                                  channel: lemansentertainment
│                                  event payload: { data: {session}, ... }
├── js/app.main.js               Main coordinator
├── js/core/
│   ├── config.js                Constants + DEFAULT_SETTINGS
│   └── state.js                 Application state
├── js/services/
│   ├── websocket.service.js     Socket.IO connection + payload extraction
│   ├── storage.service.js       localStorage persistence
│   ├── lap-tracker.service.js   Lap detection, history, session change detection
│   ├── driver-selection.service.js  Driver picker logic
│   └── session-history.service.js   Session save/load
├── js/utils/
│   ├── time-formatter.js        Lap time formatting
│   ├── calculations.js          Gap/interval/consistency math
│   ├── audio.js                 Web Audio API alerts
│   ├── tts.js                   Text-to-speech announcements
│   ├── incident-detector.js     Lap anomaly detection
│   ├── timestamp-filter.js      Stale driver filtering
│   └── track-config.js          Track configuration helpers
├── js/views/
│   ├── race.view.js             Leaderboard — multi-track grouped, collapsible
│   ├── hud.view.js              Driver HUD — drag & drop card reordering
│   ├── results.view.js          Results table with scoring modes
│   ├── compare.view.js          Two-driver comparison
│   ├── summary.view.js          Driver stats + position chart
│   └── settings.view.js         Settings panel
└── css/styles.css               All styles
```

**No backend. No build step. No npm.**
**Storage:** localStorage — settings, personal records, session history (last 50), driver notes.

---

## Deployment

GitHub Actions deploys `frontend-only/` to GitHub Pages on every push to `main`.

```bash
git push origin main   # triggers deploy automatically
```

The workflow injects a build stamp (`2025-01-01 12:00 UTC · abc1234`) into the bottom-right corner of the app at build time.

### Enable GitHub Pages (first time)
1. Repository → **Settings → Pages**
2. Source: **GitHub Actions**
3. Save — the next push to `main` will deploy

---

## Configuration

Edit [js/core/config.js](js/core/config.js) to change the venue:

```javascript
export const CONFIG = {
    SOCKET_URL: 'https://live.racefacer.com:3123',
    CHANNEL: 'lemansentertainment',   // change to your venue slug
    RECONNECT_DELAY: 2000
};
```

All display settings are configurable in the **Settings tab** and persisted to localStorage.

---

## Mobile Use (Kart Steering Wheel)

1. Open the live app URL, connect to Wi-Fi at the venue
2. In **Race** tab — tap a driver row to select them as your main driver
3. App switches to **HUD** tab automatically
4. HUD shows: position, last/best/avg lap, gap, interval, consistency, lap history
5. Enable **TTS** for hands-free voice announcements
6. **Wake Lock** activates automatically — screen stays on

**Add to Home Screen** (iOS: Share → Add to Home Screen; Android: browser menu → Add to Home Screen) for a full-screen PWA experience.

---

## Data Storage

All data is browser-local:

| Data | Key | Notes |
|------|-----|-------|
| Settings | `karting_settings` | Display prefs, driver selection |
| Personal records | `karting_personal_records` | Best lap per driver name |
| Session history | `karting_sessions` | Up to 50 sessions |
| Driver notes | `karting_driver_notes` | Per-driver text notes |

**Backup:** Settings → Export All Data → saves a JSON file.
**Restore:** Settings → Import All Data → select the JSON file.

---

## Browser Support

- Chrome (Android / iOS / Desktop)
- Safari (iOS 14+)
- Firefox (Desktop)
- Edge

Requires: ES6 modules, WebSocket, localStorage.
