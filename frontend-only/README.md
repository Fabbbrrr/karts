# RaceFacer — Frontend-Only

A fully browser-based karting live timing app. No server required. Connects directly to RaceFacer's timing system via WebSocket. Runs on any device with a modern browser — designed for mobile use strapped to a kart steering wheel.

## Live App

Host on GitHub Pages: `https://yourusername.github.io/racefacerUI/frontend-only/`

---

## Quick Start (Local)

```bash
cd racefacerUI/frontend-only
python -m http.server 8000
# Or: npx http-server -p 8000
```

Then open `http://localhost:8000` in Chrome/Safari.

---

## Features

| Tab | Description |
|-----|-------------|
| **Race** | Live leaderboard — all karts, real-time |
| **HUD** | Full-screen personal driver dashboard (position, lap times, gap, interval, consistency) |
| **Results** | Session standings with scoring methods (Fastest Lap, Total Time, Average, Best 3, Consistency) |
| **Compare** | Side-by-side driver comparison across scoring methods |
| **Summary** | Session overview — podium, fastest lap, stats |
| **Settings** | Driver selection, display toggles, HUD customisation, data export/import |

---

## Architecture

```
Browser
├── Socket.IO (CDN)  ──────────►  live.racefacer.com:3123
│                                  (channel: lemansentertainment)
├── js/app.main.js               Main coordinator
├── js/core/
│   ├── config.js                Constants + DEFAULT_SETTINGS
│   └── state.js                 Application state (AppState)
├── js/services/
│   ├── websocket.service.js     Direct Socket.IO connection
│   ├── storage.service.js       localStorage persistence
│   ├── lap-tracker.service.js   Lap detection + history
│   ├── driver-selection.service.js  Driver picker logic
│   └── session-history.service.js   Session save/load
├── js/utils/
│   ├── time-formatter.js        Lap time formatting
│   ├── calculations.js          Gap/interval/consistency math
│   ├── audio.js                 Web Audio API alerts
│   ├── tts.js                   Text-to-speech announcements
│   ├── incident-detector.js     Anomaly detection
│   └── timestamp-filter.js      Stale driver filtering
├── js/views/
│   ├── race.view.js             Leaderboard renderer
│   ├── hud.view.js              Driver HUD renderer
│   ├── results.view.js          Results table renderer
│   ├── compare.view.js          Compare mode renderer
│   ├── summary.view.js          Summary stats renderer
│   └── settings.view.js         Settings panel renderer
└── css/styles.css               All styles
```

**Storage:** localStorage — settings, personal records, session history, driver notes.
**No backend. No build step. No npm.**

---

## GitHub Pages Deployment

### Step 1 — Push to GitHub
```bash
git add frontend-only/
git commit -m "feat: complete frontend-only app"
git push origin main
```

### Step 2 — Enable GitHub Pages
1. Repository → **Settings → Pages**
2. Source: `main` branch, folder: `/ (root)`
3. Save

### Step 3 — Access
```
https://yourusername.github.io/racefacerUI/frontend-only/
```

Bookmark on your phone and use **Add to Home Screen** for a full-screen PWA experience.

---

## Configuration

Edit [js/core/config.js](js/core/config.js) to change the venue:

```javascript
export const CONFIG = {
    SOCKET_URL: 'wss://live.racefacer.com:3123',
    CHANNEL: 'lemansentertainment',   // change venue here
    RECONNECT_DELAY: 2000
};
```

All other settings are configurable in the **Settings tab** and persisted to localStorage.

---

## Mobile Use (Kart Steering Wheel)

1. Open the app on your phone, connect to live race
2. Tap a driver in **Race** tab → opens their **HUD**
3. HUD shows: position, last lap, best lap, avg, gap, interval, consistency, lap history
4. Enable **TTS** for voice lap announcements (hands-free)
5. **Wake Lock** is enabled automatically — screen stays on

---

## Data Storage

All data is browser-local:

| Data | Storage |
|------|---------|
| Settings | localStorage |
| Personal records | localStorage |
| Session history (last 20) | localStorage |
| Driver notes | localStorage |

Export from **Settings → Export All Data** to back up across devices.

---

## Browser Support

- Chrome (Android / iOS / Desktop)
- Safari (iOS 14+)
- Firefox (Desktop)
- Edge

Minimum: ES6 Modules + WebSocket + localStorage

---

## Implementation Chunks

| Chunk | Status | Description |
|-------|--------|-------------|
| 1 | Done | Core infrastructure (config, state, websocket, storage) |
| 2 | Done | Utility files (time-formatter, calculations, audio, tts) |
| 3 | Done | Service layer (lap-tracker, driver-selection, session-history) |
| 4 | Done | View files (race, hud, results, compare, summary, settings) |
| 5 | Done | app.main.js — full coordinator, no server dependencies |
| 6 | Done | index.html + CSS sync |
| 7 | Done | GitHub Pages files (.nojekyll, manifest.json, sw.js) |
| 8 | Done | Documentation |
