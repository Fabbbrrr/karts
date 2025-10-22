# Configuration Guide

Complete guide to configuring RaceFacer UI for your needs.

## 🎯 Basic Configuration

### Track/Venue Setup

**Configure your racing venue:**

1. Open **Settings** tab
2. Find **Track Configuration** section
3. Enter your venue information:
   - **Venue Name**: e.g., "Le Mans Entertainment"
   - **Channel Name**: Your venue's websocket channel
   - **Track Name**: Display name for track

**Finding Your Channel:**
- Visit: `live.racefacer.com/YOUR_VENUE_NAME`
- The URL path is your channel name
- Or ask your track operator

**Example:**
```
Venue: Le Mans Entertainment
Channel: lemansentertainment
URL: live.racefacer.com/lemansentertainment
```

### Driver Selection

**Method 1 - Quick Select (Recommended):**
1. Go to Race tab
2. Tap your driver name in the list
3. Auto-switches to HUD view

**Method 2 - HUD Dropdown:**
1. Go to HUD tab
2. Use dropdown selector at top
3. Select your kart number

**Persistence:**
- Last selected driver saved
- Auto-restored on app restart

## 🎨 Display Settings

### Color Themes

Four pre-built themes available:
- 🌙 **Dark** (default) - Easy on eyes, battery-friendly
- ☀️ **Light** - Bright and clear
- 🏎️ **F1 Red** - Racing heritage
- 🏁 **Racing Green** - Classic motorsport

**To Change Theme:**
1. Settings → Display
2. Select color theme
3. Changes apply immediately

### HUD Component Visibility

**Show/Hide Components:**

**Method 1 - Mini Toggles (Quick):**
- Each HUD card has (➖) toggle
- Tap to hide
- Settings → "Show All" to restore

**Method 2 - Settings Checkboxes:**
1. Settings → HUD Components
2. Check/uncheck components:
   - Position & Gaps
   - Best Lap
   - Last Lap
   - Personal Best
   - Gap to PB
   - Session Stats
   - Lap History

**Tips:**
- Hide unused components during racing
- Restore all for analysis sessions
- Preferences persist across sessions

### Font & Size

**Adjust for visibility:**
- Normal (default)
- Large (better readability)
- Extra Large (racing at speed)

Location: Settings → Display → Font Size

## 🔊 Audio Configuration

### Text-to-Speech (TTS)

**Quick Toggle:**
- HUD header → TTS button (📢)
- Green = enabled, Gray = disabled

**Granular Controls:**
Settings → Audio → TTS Settings

**Always Announced:**
- ✅ Lap time (cannot disable)
- ✅ Current position (cannot disable)
- ✅ Gap to session best (cannot disable)

**Optional Announcements:**
- ⚙️ Gap to leader (toggle)
- ⚙️ Gap to personal best (toggle)

**Test Announcements:**
Six test scenarios available in settings:
1. Fast lap (green)
2. Personal best (purple)
3. Average lap (yellow)
4. Slow lap (red)
5. Position gain
6. Position loss

### Sound Effects

**Enable/Disable:**
- Personal Best chime
- Position gain beep
- Position loss tone
- Proximity alert

**Volume:**
- Controlled by device volume
- No separate app volume

## 📊 Data Management

### Session History

**Auto-Save Settings:**
- **Enabled by default**
- Saves last 20 sessions
- Triggers on session change
- Includes full timing data

**Manual Management:**
1. Settings → Data Management
2. View saved sessions
3. Delete individual sessions
4. Clear all history

### Export/Import

**Export Data:**
1. Settings → Export Data
2. Choose what to export:
   - Session history
   - Personal bests
   - Kart analysis
   - All data
3. Downloads JSON file

**Import Data:**
1. Settings → Import Data
2. Select JSON file
3. Confirms before importing
4. Merges with existing data

**Backup Strategy:**
- Export weekly
- Store backups safely
- Test imports occasionally

### Storage Limits

**Browser Limits:**
- ~5-10MB localStorage (varies by browser)
- Auto-cleanup of old data
- Configurable retention

**Recommended:**
- Keep last 20 sessions (default)
- Export older sessions
- Clear kart analysis monthly

## 🏁 Racing Configuration

### Proximity Alerts

**Configure distance threshold:**
1. Settings → Racing
2. Proximity Alert Distance
3. Options: 0.5s, 1.0s, 1.5s, 2.0s, Off
4. Default: 1.0 second

**When Triggered:**
- Another driver within threshold
- Audio alert (if enabled)
- Visual indicator

### Lap Time Thresholds

**Configure valid lap times:**
1. Settings → Advanced
2. Maximum Lap Time
3. Default: 60 seconds
4. Filters outliers/pit times

**Why Configure:**
- Different track lengths
- Practice vs racing
- Filter invalid data

## 🔧 Advanced Settings

### WebSocket Configuration

**For custom deployments:**

```javascript
// js/core/config.js
export const config = {
  websocket: {
    host: 'yourvenue.com',
    port: 8131,
    secure: false
  }
};
```

**Parameters:**
- `host`: WebSocket server address
- `port`: WebSocket port (default: 8131)
- `secure`: Use WSS (true) or WS (false)

### Session Detection

**Fine-tune session change detection:**
1. Settings → Advanced → Session Detection
2. Adjust sensitivity:
   - **High**: Detects minor changes
   - **Medium**: Balanced (default)
   - **Low**: Only major changes

**Triggers:**
- Lap count reset
- Long inactivity
- Timestamp jump
- Manual reset

### Data Refresh Rate

**For performance tuning:**
- Real-time: Every update (default)
- High: Every 500ms
- Medium: Every 1 second
- Low: Every 2 seconds

Location: Settings → Performance

## 📱 PWA Settings

### Installation

**Settings → About → Install App:**
- Shows install button
- Platform-specific instructions
- One-tap installation

### Display Mode

**When installed:**
- Standalone (default)
- Fullscreen
- Minimal UI
- Browser

Location: Manifest configuration

### Update Behavior

**PWA Auto-Update:**
- Checks on launch
- Downloads in background
- Prompts on next restart
- Manual refresh available

## 🔒 Privacy Settings

### Data Collection

**What's Stored Locally:**
- Personal bests
- Session history
- Driver preferences
- Kart analysis

**What's NOT Collected:**
- No analytics
- No tracking
- No personal info
- No cloud sync

### Clear All Data

**Complete reset:**
1. Settings → Privacy
2. "Clear All Data"
3. Confirm action
4. Reloads app

**Warning:** This cannot be undone!

## 💾 Backup & Restore

### Backup Strategy

**Recommended Schedule:**
- **Weekly**: Export all data
- **Before major races**: Full backup
- **Monthly**: Clean old data

**What to Backup:**
1. Personal bests (most important)
2. Session history (last 5-10 sessions)
3. Kart analysis (if collected)
4. Settings (optional)

### Restore Process

**From Backup:**
1. Settings → Import Data
2. Select backup file
3. Review import preview
4. Confirm import
5. Verify data restored

**Merge vs Replace:**
- **Merge**: Combines with existing
- **Replace**: Overwrites everything

## 🎯 Configuration Presets

### Racing Mode
- HUD optimized for visibility
- Large fonts
- Essential cards only
- Audio alerts enabled
- TTS enabled

### Analysis Mode
- All components visible
- Detailed statistics
- Charts expanded
- TTS disabled
- Export ready

### Practice Mode
- Personal best focus
- Gap tracking
- Lap history visible
- Minimal distractions

**To Apply:**
Settings → Presets → Select Mode

## 🔍 Troubleshooting

### Configuration Issues

**Settings Not Saving:**
1. Check browser localStorage enabled
2. Clear cache and reload
3. Try different browser
4. Check storage limits

**Connection Problems:**
1. Verify venue configuration
2. Check WebSocket URL
3. Test with default settings
4. Check network connection

### Reset to Defaults

**Complete Reset:**
1. Settings → Advanced
2. "Reset to Defaults"
3. Confirm
4. App reloads

**Preserves:**
- Personal bests
- Session history
- Kart analysis

**Resets:**
- Display settings
- Audio settings
- Preferences

## 📚 Configuration Files

### For Developers

**Key Configuration Files:**
```
js/core/config.js       - Main config
js/core/state.js        - State management
js/services/*.js        - Service configs
manifest.json           - PWA config
service-worker.js       - Cache config
```

**Modify Before Deployment:**
1. Default WebSocket URL
2. Track configuration
3. PWA manifest
4. Cache strategy

## 💡 Pro Tips

**Performance:**
- Use Dark theme for battery
- Disable unused audio alerts
- Limit session history to 10
- Clear kart analysis monthly

**Reliability:**
- Export data weekly
- Test backup/restore
- Keep browser updated
- Monitor storage usage

**Racing:**
- Configure before session
- Test audio levels
- Set proximity threshold
- Choose optimal theme

---

**Next Steps:**
- [Quick Start Guide](quick-start.md)
- [Features Overview](../features/core-features.md)
- [Troubleshooting](../development/debugging.md)

