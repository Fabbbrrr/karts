# RaceFacer Frontend-Only — Features

## Done

### Core
- [x] Direct Socket.IO connection to `live.racefacer.com:3123`, channel `lemansentertainment`
- [x] Auto-reconnect on disconnect
- [x] 5-second loading screen fallback (shows app even if no data arrives)
- [x] Connection indicator (green/red dot)
- [x] Session change detection (resets lap history when a new session starts)
- [x] Auto-save previous session to localStorage on session change

### Views
- [x] **Race tab** — live timing table, click driver → opens HUD for that driver
- [x] **HUD tab** — single-driver focus: last/best/avg lap, gap, interval, consistency, lap history list, notes
- [x] **Results tab** — full leaderboard with lap stats; session selector (live or past sessions)
- [x] **Compare tab** — side-by-side two-driver stat comparison
- [x] **Summary tab** — session overview, position chart, fastest lap, awards; session selector
- [x] **Settings tab** — driver select, display toggles, HUD card toggles, audio, TTS, export/import

### Tracking & Stats
- [x] Lap history per driver (up to 100 laps)
- [x] Position history tracking
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
- [x] Session history (save/load past sessions)
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

## TODO / Known Issues

### Bugs to verify with live data
- [ ] Confirm socket payload format — added `console.log('📦 Raw socket payload keys:')` in `websocket.service.js:111`, remove once confirmed
- [ ] Verify driver dropdown populates in Compare tab when data arrives
- [ ] Verify session selector (Results/Summary) loads saved sessions correctly
- [ ] Verify lap flash animation triggers on HUD when main driver completes a lap

### Missing assets
- [ ] `icon-192.png` and `icon-512.png` — referenced in `manifest.json` but not created; causes SW install warning (non-fatal)

### Features not yet implemented
- [ ] **Proximity alert** — `enableProximityAlert` setting exists but feature is disabled (`CONFIG.ENABLE_KART_ANALYSIS: false`); should warn when gap to another driver closes within threshold
- [ ] **Kart analysis tab** — disabled in config; was in original app, not ported
- [ ] **Channel switching at runtime** — channel is hardcoded to `lemansentertainment`; Settings has a channel input field but it's not wired to reconnect the socket
- [ ] **Driver notes UI** — notes are stored but the HUD notes list has no way to add/edit notes from the frontend-only UI
- [ ] **Position chart rendering** — `#position-chart` element exists in Summary but chart drawing code needs verification

### UX / polish
- [ ] `__BUILD_INFO__` shows as literal text on `localhost` (by design — only replaced by CI); could show "dev" instead
- [ ] Loading screen shows "Connecting to RaceFacer..." indefinitely if connection fails — could show a retry button after timeout
- [ ] No empty-state message in Race tab when connected but no karts in session
