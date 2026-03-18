#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# RaceFacer Watch — ADB install script
#
# Usage:
#   ./scripts/install-watch.sh <watch-ip> [port]
#
# Example (Watch 6 on WiFi):
#   ./scripts/install-watch.sh 192.168.1.42 5555
#
# Prerequisites:
#   1. Enable Developer Options on watch:
#      Settings → About → tap Software Version 7 times
#   2. Enable ADB Debugging + Wireless Debugging in Developer Options
#   3. Note the IP address shown in Wireless Debugging settings
#   4. Android SDK Platform Tools installed (adb in PATH)
# ─────────────────────────────────────────────────────────────────────────────

set -e

IP=${1:?"Usage: $0 <watch-ip> [port]"}
PORT=${2:-5555}
APK="app/build/outputs/apk/debug/app-debug.apk"

if [ ! -f "$APK" ]; then
  echo "APK not found at $APK"
  echo "Run: ./gradlew assembleDebug"
  exit 1
fi

echo "→ Connecting to watch at $IP:$PORT …"
adb connect "$IP:$PORT"
sleep 1

echo "→ Installing $(basename $APK) …"
adb -s "$IP:$PORT" install -r "$APK"

echo ""
echo "✓ Installed! Launch RaceFacer on your watch."
echo "  First run: select your kart → (optionally) select a mate's kart"
