# RaceFacer Frontend-Only — Features

## Implemented

### Core
- [x] Direct Socket.IO connection to `live.racefacer.com:3123`, channel `lemansentertainment`
- [x] Socket payload verified: event `lemansentertainment` → `{ data: {session}, ... }` → `data.data` extracted as session object
- [x] Auto-reconnect on disconnect
- [x] 5-second loading screen fallback (shows app even if no data arrives)
- [x] Connection indicator (green/red dot)
- [x] Session change detection via `event_name + track_configuration_id` composite key — resets lap history on new session
- [x] Auto-save previous session to localStorage on session change

### Race Tab
- [x] Live leaderboard for all active karts
- [x] Multi-track grouping — kart prefix determines track: `M*` → Mushroom, `P*` → Penrite, `E*` → Rimo, numeric → Lakeside
- [x] Per-track position recalculated by best lap time (not server position)
- [x] Collapsible track sections (state persists across updates)
- [x] Track selector dropdown (All / individual track)
- [x] Incident detection — anomaly emoji shown when lap time irregularities detected
- [x] Touch-safe click handling — distinguishes scroll from tap on mobile (10px / 300ms threshold)
- [x] Tap driver → selects as main driver and switches to HUD tab

### HUD Tab
- [x] Full-screen single-driver focus
- [x] Position (P1/P2/P3 colour-coded), kart number, lap count
- [x] Last lap, best lap, avg lap, gap to leader, interval, consistency
- [x] Gap to best lap shown under last lap time (+Xs or "BEST LAP")
- [x] Header stat badges (live metrics)
- [x] Lap history list (last 20 laps, colour-coded by speed vs best)
- [x] Session timer
- [x] TTS toggle button
- [x] Drag & drop card reordering (desktop + touch)

### Results Tab
- [x] Full leaderboard with lap stats
- [x] Multiple scoring methods: Fastest Lap, Total Time, Average Lap, Best 3 Average, Consistency Score
- [x] Session selector — switch between live data and saved past sessions

### Compare Tab
- [x] Side-by-side two-driver stat comparison
- [x] Driver dropdowns populated from live session data

### Summary Tab
- [x] Main driver stats: best lap, avg lap, total laps, consistency, final position, position change
- [x] Lap history for main driver
- [x] Position chart (canvas) — race position over laps for all drivers
- [x] Personal records display
- [x] Track filter — view summary per track or all tracks
- [x] Session selector — switch between live data and saved past sessions

### Settings Tab
- [x] Main driver selection (persisted)
- [x] Display toggles: intervals, gaps, consistency, avg lap, last lap
- [x] HUD card show/hide toggles
- [x] Best lap celebration toggle
- [x] TTS enable + announcement options
- [x] Storage usage display
- [x] Export current session JSON
- [x] Export all app data (backup)
- [x] Import all app data (restore)

### Tracking & Stats
- [x] Lap history per driver (up to 20 laps in HUD history, 100 in tracker)
- [x] Position history tracking per driver
- [x] Session best lap tracking
- [x] Personal record tracking (persisted in localStorage)
- [x] New PB detection with audio celebration + vibration
- [x] Overall session best lap celebration (audio)

### Audio / TTS
- [x] Best lap audio celebration (Web Audio API)
- [x] TTS lap announcements: lap time, position, gap to best, gap to PB, gap to P1
- [x] TTS toggle button in HUD
- [x] Vibration on new PB (mobile)

### Storage (localStorage)
- [x] Settings persistence
- [x] Personal records persistence
- [x] Driver notes persistence
- [x] Session history (save/load past sessions, max 50)
- [x] Export session JSON
- [x] Export all app data (backup)
- [x] Import all app data (restore)
- [x] Storage usage display in Settings

### PWA
- [x] Service worker (`sw.js`) — cache-first for static assets, network-first for socket/CDN
- [x] Web App Manifest (`manifest.json`)
- [x] Wake Lock (keeps screen on during race)
- [x] `nomodule` fallback warning for old browsers

### Deployment
- [x] GitHub Actions workflow deploying `frontend-only/` to GitHub Pages on push to `main`
- [x] Build info stamp (UTC date + short commit SHA) injected into bottom-right corner by CI
- [x] `.nojekyll` to prevent Jekyll processing

---

## Known Issues / TODO

### Missing assets
- [ ] `icon-192.png` and `icon-512.png` — referenced in `manifest.json` but not present; causes SW install warning (non-fatal)

### Features not yet implemented
- [ ] **Channel switching at runtime** — channel hardcoded to `lemansentertainment`; Settings has a channel input but it does not reconnect the socket
- [ ] **Driver notes UI** — notes stored in localStorage but no add/edit UI in the HUD notes list
- [ ] **Proximity alert** — `enableProximityAlert` setting exists, but feature not implemented (`ENABLE_KART_ANALYSIS: false`)

### UX / polish
- [ ] `__BUILD_INFO__` shows as literal text on `localhost` — only replaced by CI; could default to `"dev"` locally
- [ ] Loading screen shows "Connecting..." indefinitely on connection failure — could add retry button after timeout
- [ ] No empty-state message in Race tab when connected but no karts present
- [ ] Debug `console.log('📦 Raw socket payload keys:')` in `websocket.service.js:111` — safe to remove once confirmed in production
