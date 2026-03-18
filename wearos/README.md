# RaceFacer Wear OS

Standalone Wear OS app for Samsung Galaxy Watch 4 and 6. Connects directly to `live.racefacer.com:3123` via Socket.IO — no phone app required.

## Screens

| Screen | Description |
|--------|-------------|
| **Kart Picker** | 2-phase: select your kart, then optionally a mate's kart to compare |
| **HUD** | Last lap (52sp, hero) · position badge · best lap · gap to P1 · mate strip |
| **Lap History** | Last 20 laps with colour coding · rotary crown scrolls |
| **Compare** | Side-by-side metrics vs mate · closing speed trend |
| **Settings** | Channel, re-pick karts, connection status, reconnect |

## Build & Install

### Prerequisites

- Android Studio Hedgehog (2023.1.1) or newer
- Android SDK with Wear OS system image
- `adb` in PATH (Android Platform Tools)

### Build

```bash
cd wearos
./gradlew assembleDebug
```

APK output: `app/build/outputs/apk/debug/app-debug.apk`

### Install via ADB (no Play Store needed)

**One-time watch setup:**
1. Settings → About Watch → tap **Software version** 7 times (enables Developer Options)
2. Developer Options → enable **ADB Debugging** + **Wireless Debugging**
3. Note the IP address shown in Wireless Debugging

**Install:**
```bash
./scripts/install-watch.sh <watch-ip>
# Example:
./scripts/install-watch.sh 192.168.1.42
```

Or manually:
```bash
adb connect 192.168.1.42:5555
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Configuration

All settings live on the watch:
- **Settings → Channel**: change the Socket.IO channel (default: `lemansentertainment`)
- **Settings → My Kart / Compare**: re-pick karts at any time
- Selections persist across restarts via DataStore

## Architecture

```
SocketIOClient (io.socket:socket.io-client:2.1.0)
    ↓ SharedFlow<SessionData>
RaceRepository (Hilt Singleton)
    ↓ StateFlow per ViewModel
HudViewModel / CompareViewModel / etc.
    ↓ collectAsStateWithLifecycle()
Compose UI (Wear Compose Material)
```

`RaceConnectionService` (ForegroundService) keeps the Socket.IO connection alive when the watch display turns off. It starts automatically on app launch and restarts if killed.

## Compatibility

| Device | Wear OS | Min API | Status |
|--------|---------|---------|--------|
| Galaxy Watch 4 | Wear OS 3+ | 30 | ✅ Supported |
| Galaxy Watch 5 | Wear OS 3.5 | 30 | ✅ Supported |
| Galaxy Watch 6 | Wear OS 4+ | 30 | ✅ Supported |
| Other Wear OS 3+ watches | Wear OS 3+ | 30 | ✅ Should work |
