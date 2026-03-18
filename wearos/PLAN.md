# RaceFacer Wear OS — Full Build Plan

> Branch: `feat/wearos`
> Target devices: Samsung Galaxy Watch 4 (Wear OS 3+) and Watch 6 (Wear OS 4+)
> Distribution: ADB sideload (no Play Store required)

---

## Goals

1. **Live HUD** — last lap time as the dominant element (not position)
2. **Kart picker** — select your own kart + a mate's kart, both from the watch
3. **Live comparison** — both karts' last laps, best laps, and gap updating in real-time
4. **Standalone connection** — watch connects directly via Socket.IO over WiFi; no phone dependency
5. **Clean, glove-friendly UI** — large tap targets, high contrast, minimal chrome

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Language | Kotlin | Standard for Wear OS |
| UI | Compose for Wear OS | Native, Wear-specific components (ScalingLazyColumn, etc.) |
| WebSocket | `socket.io-client-java` 2.x | Same protocol as the web app, well-tested |
| State | ViewModel + StateFlow | Reactive, lifecycle-aware |
| Persistence | DataStore (Preferences) | Lightweight, async; stores kart selections + channel |
| DI | Hilt | Standard, removes boilerplate |
| Background | Foreground Service | Holds Socket.IO connection during active race |
| Build | Gradle (Kotlin DSL) | Standard |
| Min SDK | 30 (Wear OS 3) | Watch 4 and 6 both supported |
| Target SDK | 35 | Latest stable |

---

## Project Structure

```
wearos/
  app/
    src/main/
      AndroidManifest.xml
      java/com/raceface/wear/
        MainActivity.kt                  ← single Activity, hosts NavController
        di/
          AppModule.kt                   ← Hilt modules
          NetworkModule.kt
        data/
          remote/
            SocketIOClient.kt            ← wraps socket.io-client-java
            RaceDataMapper.kt            ← raw JSON → domain models
          repository/
            RaceRepository.kt            ← exposes StateFlows of session data
          local/
            DataStoreManager.kt          ← persists kart selections + channel
        domain/
          model/
            SessionData.kt
            DriverRun.kt
            LapComparison.kt             ← my kart vs mate's kart
          usecase/
            CalculateConsistencyUseCase.kt
            DetectIncidentsUseCase.kt
            BuildLapComparisonUseCase.kt
        service/
          RaceConnectionService.kt       ← ForegroundService, holds Socket.IO
        presentation/
          theme/
            Theme.kt                     ← colors, typography, shapes
            Color.kt
          navigation/
            NavGraph.kt                  ← SwipeDismissableNavHost
          screens/
            picker/
              KartPickerScreen.kt        ← select my kart + mate's kart
              KartPickerViewModel.kt
            hud/
              HudScreen.kt               ← main live timing view
              HudViewModel.kt
            laps/
              LapHistoryScreen.kt        ← recent laps, rotary scroll
              LapHistoryViewModel.kt
            compare/
              CompareScreen.kt           ← side-by-side comparison
              CompareViewModel.kt
            settings/
              SettingsScreen.kt          ← channel, kart re-select
              SettingsViewModel.kt
      res/
        values/
          strings.xml
          colors.xml
        drawable/
          ic_flag.xml
          ic_kart.xml
  build.gradle.kts
  settings.gradle.kts
  gradle/
    libs.versions.toml                   ← version catalog
```

---

## Navigation Graph

```
SwipeDismissableNavHost (root)
  │
  ├── KartPickerScreen          ← launches on first run OR manual re-pick
  │     ↓ (both karts selected)
  ├── HudScreen (start dest)    ← primary view while racing
  │     swipe ↓ (rotary press / swipe)
  ├── LapHistoryScreen          ← last 10 laps for MY kart, rotary scroll
  │     swipe ↓
  ├── CompareScreen             ← side-by-side my kart vs mate
  │     swipe ↓
  └── SettingsScreen            ← channel input, re-pick karts, connection status
```

Swiping right on any screen → SwipeDismissableNavHost dismisses back to previous.
From HUD, long-press the crown → open kart picker (re-select).

---

## Data Architecture

### WebSocket Flow

```
RaceConnectionService (ForegroundService)
  │  socket.io connect → channel "lemansentertainment"
  │  on("lemansentertainment") → RaceDataMapper.parse(rawJson)
  │                                       ↓
  │                              SessionData (domain model)
  │                                       ↓
  └──────────────────────→ RaceRepository._sessionData (MutableStateFlow)


RaceRepository
  ├── sessionDataFlow: StateFlow<SessionData?>   ← every ~2s
  ├── connectionStateFlow: StateFlow<ConnectionState>
  └── fun getDriverRun(kartNumber: String): DriverRun?


HudViewModel / CompareViewModel
  └── collects sessionDataFlow → derives HudUiState / CompareUiState
```

### Domain Models

```kotlin
data class SessionData(
    val runs: List<DriverRun>,
    val eventName: String,
    val sessionName: String,
    val currentLap: Int,
    val totalLaps: Int,
    val timeRemaining: String   // parsed from server if available
)

data class DriverRun(
    val kartNumber: String,
    val driverName: String,
    val position: Int,
    val laps: Int,
    val lastTimeRaw: Long,          // ms
    val lastTimeFormatted: String,  // "M:SS.mmm"
    val bestTimeRaw: Long,
    val bestTimeFormatted: String,
    val avgLap: Long,
    val lapTimes: List<Long>,       // all lap times in ms
    val gap: String,
    val interval: String,
    val consistency: Int,           // 0-100
    val incidents: Int
)

data class LapComparison(
    val myKart: DriverRun,
    val mateKart: DriverRun,
    val lastLapDelta: Long,         // myLast - mateLast (ms), negative = I'm faster
    val bestLapDelta: Long,
    val positionDelta: Int          // myPos - matePos, negative = I'm ahead
)
```

### Business Logic (ported from JS utils)

```kotlin
object RaceMath {
    const val LAP_THRESHOLD_MS = 60_000L          // exclude laps > 60s
    const val INCIDENT_MULTIPLIER = 1.30           // 30% slower than avg
    const val SEVERE_INCIDENT_MULTIPLIER = 1.50

    fun consistency(lapTimes: List<Long>): Int {
        val valid = lapTimes.filter { it < LAP_THRESHOLD_MS }
        if (valid.size < 2) return 0
        val avg = valid.average()
        val stdDev = kotlin.math.sqrt(valid.sumOf { (it - avg).pow(2) } / valid.size)
        return (100 - (stdDev / avg * 100)).toInt().coerceIn(0, 100)
    }

    fun formatLapTime(ms: Long): String {
        val mins = ms / 60_000
        val secs = (ms % 60_000) / 1000.0
        return if (mins > 0) "%d:%06.3f".format(mins, secs) else "%06.3f".format(secs)
    }

    fun formatDelta(ms: Long): String = if (ms >= 0) "+%.3f".format(ms / 1000.0)
                                        else "%.3f".format(ms / 1000.0)
}
```

---

## Screen Designs

### Screen 1: Kart Picker

**Purpose**: Select my kart + mate's kart at the start of a session (or re-select mid-session).

**Layout** (two-phase flow):

```
Phase A — Pick MY kart
┌──────────────────────────┐
│  MY KART                 │  ← 10sp, muted, uppercase
│                          │
│  [E05] [E12] [E08]      │  ← ScalingLazyColumn grid
│  [E03] [14 ] [07 ]      │     3-column, each button 52dp tall
│  [22 ] [09 ]            │     rounded chip, border accent on select
│                          │
│  ───────────────         │
│  Tap to select           │  ← hint text
└──────────────────────────┘

Phase B — Pick MATE's kart (after mine is selected)
┌──────────────────────────┐
│  ← E12 selected          │  ← back chip, green border
│  COMPARE WITH            │  ← 10sp, muted
│                          │
│  [E05] [E08] [E03]      │  ← same grid, MY kart greyed out
│  [14 ] [07 ] [22 ]      │
│  [09 ] NONE              │  ← "NONE" option (no compare)
└──────────────────────────┘
```

- Kart list comes from the live `sessionData.runs` sorted by position
- Chip shows: kart number (bold) + driver name (small, below) + position badge (corner)
- Selected chip: `background = primaryContainer`, border `2dp accent`
- Confirm button at bottom (or auto-advance after mate picked)
- Persisted to DataStore immediately on selection

---

### Screen 2: HUD (Primary)

**Key change from mockup: LAST LAP is the hero element. Position is a small badge.**

```
┌──────────────────────────┐
│ ●  Le Mans Cup    9:41   │  ← 10sp status bar
│ [P2] KART E12    06:43  │  ← position badge (small, 16sp) + timer (14sp mono)
│                          │
│  LAST LAP                │  ← 9sp label
│  26.916                  │  ← 52sp bold mono, accent GREEN (new PB) / AMBER (normal)
│  −0.388                  │  ← 16sp delta vs best, green/red
│                          │
│  ┌──────────┐ ┌────────┐ │
│  │ BEST LAP │ │ GAP P1 │ │  ← 2-col cards, 36sp values
│  │ 27.304   │ │ +4.195 │ │
│  └──────────┘ └────────┘ │
│                          │
│  MATE  E05               │  ← mate section (if set)
│  27.103   −0.187         │  ← mate's last lap + delta vs mine
└──────────────────────────┘
```

**Color semantics:**
- Last lap = session best → `#00ff88` (green)
- Last lap = personal best → `#b06bd6` (purple)
- Last lap = normal (within 1%) → `#ffaa00` (amber)
- Last lap = slow/incident → `#ff4444` (red)
- Delta vs mate: green if I'm faster, red if mate is faster

**Rotary input**: Scrolling the crown scrolls to CompareScreen (or scrolls a mini lap list inline).

**Crown button (long press)**: Opens KartPickerScreen to re-select karts.

---

### Screen 3: Lap History (My Kart)

```
┌──────────────────────────┐
│  LAP HISTORY  E12        │  ← header
│                          │
│  L14  26.916   −0.388   │  ← green (session best)
│  L13  27.552   +0.248   │  ← amber
│  L12  28.010   +0.706   │  ← amber
│  L11  27.890   +0.586   │  ← amber
│  L10  27.304   ±0.000   │  ← purple (personal best)
│  L9   27.680   +0.376   │  ← amber
│  L8   27.992   +0.688   │
│  L7   28.244   +0.940   │
│  L6   33.501   +6.197   │  ← red (incident)
│  L5   28.112   +0.808   │
└──────────────────────────┘
```

- `ScalingLazyColumn` — items naturally scale at edges (Wear OS built-in)
- Rotary crown scrolls the list
- Each row is a `WearChip` (rounded, full-width)
- Row background: green=session best, purple=PB, red=incident, transparent=normal
- Delta is vs best lap (always shows ±)

---

### Screen 4: Compare (My Kart vs Mate)

```
┌──────────────────────────┐
│  E12 ◀─── VS ───▶ E05   │  ← header with kart numbers
│                          │
│  26.916 │ LAST  │ 27.103 │  ← I'm faster → my col green, mate col red
│  27.304 │ BEST  │ 26.521 │  ← mate faster → my col red, mate col green
│  28.1s  │ AVG   │ 27.8s  │  ← mate faster
│  91%    │ CONS. │ 94%    │  ← mate better
│  P2     │ POS.  │ P1     │  ← mate ahead
│                          │
│  GAP: +4.195s            │  ← my gap to mate (red = behind)
│  ▽ closing 0.2s/lap      │  ← trend
└──────────────────────────┘
```

- Two-column layout using `Row` with a center divider
- Winner column gets `primaryContainer` tint
- `ScalingLazyColumn` to allow future rows to be added
- Tap either kart header → back to KartPickerScreen to re-pick

---

### Screen 5: Settings

```
┌──────────────────────────┐
│  SETTINGS                │
│                          │
│  Channel                 │
│  lemansentertainment     │  ← tappable → opens text input (Horologist keyboard)
│                          │
│  My Kart    E12 ▸        │  ← tappable → goes to KartPicker (my kart phase)
│  Compare    E05 ▸        │  ← tappable → goes to KartPicker (mate phase)
│                          │
│  Connection              │
│  🟢 Connected            │
│                          │
│  Reconnect               │  ← WearChip button
└──────────────────────────┘
```

---

## Theme & Design System

```kotlin
// Color.kt
val RaceFacerGreen  = Color(0xFF00FF88)
val RaceFacerAmber  = Color(0xFFFFAA00)
val RaceFacerRed    = Color(0xFFFF4444)
val RaceFacerPurple = Color(0xFFB06BD6)
val GoldP1          = Color(0xFFFFD700)
val SilverP2        = Color(0xFFC0C0C0)
val BronzeP3        = Color(0xFFCD7F32)
val BackgroundBlack = Color(0xFF000000)
val SurfaceDark     = Color(0xFF1A1A1A)
val TextMuted       = Color(0xFF555555)

val WearColorScheme = darkColorScheme(
    primary           = RaceFacerGreen,
    onPrimary         = Color.Black,
    primaryContainer  = Color(0xFF003D1F),
    background        = BackgroundBlack,
    surface           = SurfaceDark,
    error             = RaceFacerRed,
    onBackground      = Color.White,
    onSurface         = Color.White,
)

// Typography.kt — JetBrains Mono for all timing values
val WearTypography = Typography(
    displayLarge  = TextStyle(fontFamily = JetBrainsMono, fontSize = 52.sp, fontWeight = Bold),
    displayMedium = TextStyle(fontFamily = JetBrainsMono, fontSize = 36.sp, fontWeight = Bold),
    displaySmall  = TextStyle(fontFamily = JetBrainsMono, fontSize = 24.sp, fontWeight = Bold),
    bodyLarge     = TextStyle(fontFamily = FontFamily.Default, fontSize = 15.sp),
    labelSmall    = TextStyle(fontFamily = JetBrainsMono, fontSize = 11.sp),
)
```

**Touch targets**: All interactive elements minimum `48.dp` tall (Wear HIG requirement).

---

## WebSocket Connection Strategy

The watch connects **standalone** via Socket.IO. This means:
- Watch must be on the same WiFi network as `live.racefacer.com` (or phone hotspot)
- No dependency on a paired phone app
- Battery: ~4–6 hours estimated with persistent Socket.IO and screen-on during race

```kotlin
// RaceConnectionService.kt
class RaceConnectionService : Service() {
    private lateinit var socket: Socket

    override fun onCreate() {
        startForeground(NOTIF_ID, buildNotification())  // required for background
        connect()
    }

    private fun connect() {
        socket = IO.socket("https://live.racefacer.com:3123")
        socket.on(Socket.EVENT_CONNECT) {
            socket.emit("join", channel)
        }
        socket.on(channel) { args ->
            val raw = args[0]
            val sessionData = RaceDataMapper.parse(raw)
            raceRepository.emit(sessionData)
        }
        socket.connect()
    }
}
```

Reconnect logic: exponential backoff starting at 2s, max 30s (same as web app).

---

## Kart Picker — Detailed UX

The picker is the entry point. It runs:
1. On first install (no persisted kart)
2. When both karts are cleared from Settings
3. On long-press of crown from HUD

**Flow:**

```
App launch
    ↓
DataStore: myKart set?
    ├── YES → HudScreen (use persisted kart)
    └── NO  → KartPickerScreen (Phase A)
                    ↓ (tap my kart chip)
             Phase B (mate selection)
                    ↓ (tap mate chip or "Skip")
             HudScreen
```

**During kart picking while session is live:**
- The picker shows real driver names from the live `sessionData.runs`
- Each chip: `[E12]` (big) + `"Arnav Singh"` (small) + `P2` corner badge
- If no session data yet → show placeholder chips with kart numbers only (common at race start)
- Chips sorted by current position

**Persisted to DataStore:**
```kotlin
object PreferencesKeys {
    val MY_KART   = stringPreferencesKey("my_kart")
    val MATE_KART = stringPreferencesKey("mate_kart")
    val CHANNEL   = stringPreferencesKey("channel")
}
```

---

## Implementation Phases

### Phase 1 — Android Project Scaffold (Day 1)
- [ ] Create Android Studio project in `wearos/` with Wear OS template
- [ ] Configure `libs.versions.toml` with all dependencies
- [ ] Set up Hilt modules
- [ ] `RaceFacerTheme.kt` + JetBrains Mono font asset
- [ ] `NavGraph.kt` with all 5 destinations (empty composables)
- [ ] `MainActivity.kt` → hosts `WearApp()` composable

### Phase 2 — Data Layer (Day 1-2)
- [ ] `SocketIOClient.kt` — connect, join channel, emit data
- [ ] `RaceDataMapper.kt` — parse raw JSON to `SessionData`
- [ ] `RaceRepository.kt` — StateFlow, reconnect logic
- [ ] `RaceConnectionService.kt` — ForegroundService
- [ ] `DataStoreManager.kt` — persist my_kart, mate_kart, channel
- [ ] Hilt provides all of the above

### Phase 3 — Kart Picker (Day 2)
- [ ] `KartPickerViewModel.kt` — exposes driver list from repo
- [ ] `KartPickerScreen.kt` — Phase A (my kart) and Phase B (mate)
- [ ] Chip grid with `ScalingLazyColumn`, 3-column `LazyVerticalGrid`
- [ ] Selection state, visual feedback
- [ ] Save to DataStore, navigate to HUD

### Phase 4 — HUD Screen (Day 2-3) ← MOST IMPORTANT
- [ ] `HudViewModel.kt` — combine my driver + mate driver + session
- [ ] `HudScreen.kt`:
  - Status bar (connection dot + event name + time)
  - Position badge + kart number + session timer
  - **LAST LAP hero** (52sp, color-coded)
  - Delta sub-value (16sp)
  - 2-column mini cards: Best Lap + Gap to P1
  - Mate section: mate's last lap + delta vs mine
- [ ] Color logic: green/purple/amber/red for last lap
- [ ] Crown long-press → KartPicker

### Phase 5 — Lap History (Day 3)
- [ ] `LapHistoryViewModel.kt` — exposes last 20 laps for my kart
- [ ] `LapHistoryScreen.kt` — `ScalingLazyColumn` with `RotaryScrollConnection`
- [ ] Row colors per lap (best/PB/incident/normal)
- [ ] Incident detection (port `DetectIncidentsUseCase`)

### Phase 6 — Compare Screen (Day 3-4)
- [ ] `BuildLapComparisonUseCase.kt`
- [ ] `CompareScreen.kt` — two-column with winner highlighting
- [ ] Gap trend (closing/opening calculation, port from JS)
- [ ] Handle no mate selected gracefully (show prompt to pick)

### Phase 7 — Settings + Polish (Day 4)
- [ ] `SettingsScreen.kt`
- [ ] Channel text input (Horologist's `CompactChip` + `PickerGroup` or system keyboard)
- [ ] Re-pick kart navigation flow
- [ ] Connection status display
- [ ] Ambient mode: strip colours, show only position + last lap (white text on black)
- [ ] Foreground service notification (tap → opens HUD)

### Phase 8 — Build & Sideload (Day 4-5)
- [ ] `build.gradle.kts` — signing config (debug keystore, auto-generated)
- [ ] ADB install script: `scripts/install-watch.sh`
- [ ] Test on Watch 4 emulator + physical Watch 6
- [ ] README in `wearos/` with setup instructions

---

## Dependencies (libs.versions.toml)

```toml
[versions]
compose-wear       = "1.3.1"
wear-compose-nav   = "1.3.0"
horologist         = "0.6.17"
socket-io          = "2.1.0"
hilt               = "2.51"
datastore          = "1.1.1"
lifecycle          = "2.8.3"
coroutines         = "1.8.1"
jetbrains-mono     = (font asset, not a dependency)

[libraries]
wear-compose-material    = { module = "androidx.wear.compose:compose-material",   version.ref = "compose-wear" }
wear-compose-foundation  = { module = "androidx.wear.compose:compose-foundation", version.ref = "compose-wear" }
wear-compose-navigation  = { module = "androidx.wear.compose:compose-navigation", version.ref = "wear-compose-nav" }
horologist-composables   = { module = "com.google.android.horologist:horologist-composables", version.ref = "horologist" }
horologist-compose-layout= { module = "com.google.android.horologist:horologist-compose-layout", version.ref = "horologist" }
socketio-client          = { module = "io.socket:socket.io-client",               version.ref = "socket-io" }
hilt-android             = { module = "com.google.dagger:hilt-android",           version.ref = "hilt" }
hilt-compiler            = { module = "com.google.dagger:hilt-android-compiler",  version.ref = "hilt" }
datastore-preferences    = { module = "androidx.datastore:datastore-preferences", version.ref = "datastore" }
lifecycle-viewmodel      = { module = "androidx.lifecycle:lifecycle-viewmodel-compose", version.ref = "lifecycle" }
coroutines-android       = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-android", version.ref = "coroutines" }
```

---

## ADB Install Script

```bash
#!/bin/bash
# scripts/install-watch.sh
# Usage: ./install-watch.sh <watch-ip> <watch-port>
# Example: ./install-watch.sh 192.168.1.42 41619

IP=$1
PORT=${2:-5555}
APK="app/build/outputs/apk/debug/app-debug.apk"

echo "Connecting to watch at $IP:$PORT..."
adb connect "$IP:$PORT"
sleep 1

echo "Installing APK..."
adb -s "$IP:$PORT" install -r "$APK"

echo "Done! App installed."
```

---

## Key Design Decisions

| Decision | Choice | Why |
|---|---|---|
| Last lap as hero | 52sp, full width | User feedback: size > position during racing |
| Position display | Small badge (16sp) in top bar | Still visible but not dominant |
| Standalone WebSocket | Watch connects directly | No phone dependency while racing |
| Kart picker on watch | 2-phase flow | Simple, glove-friendly, works with live data |
| Mate comparison | Bottom section of HUD + full Compare screen | Quick glance + detail available |
| DataStore | Not SharedPrefs | Async, no StrictMode issues on Wear OS |
| ScalingLazyColumn | Used for all lists | Wear OS standard, handles round screen edge gracefully |
| Horologist | UI library complement | Google's own Wear OS UI patterns (pickers, scroll indicators) |
| No phone relay | Standalone only | Simpler, fewer failure points, watch + WiFi works at any track |

---

## Updated Mockup Reference

The mockup at `mockups/wearable-mockup.html` should be updated:
- W1 (HUD screen): swap last lap (52sp) to hero, position to small badge in status bar
- W4 (Compare): show 2-column comparison matching CompareScreen design

These changes are cosmetic to the plan; implementation follows the spec above.

---

## Out of Scope (for this phase)

- Complications / Tiles (can be added in v2)
- Ambient mode watch face
- TTS on watch
- Session history / replay
- Phone companion app relay (standalone only for now)
