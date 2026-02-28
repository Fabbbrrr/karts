# 🎭 Mock Mode - Simulated Racing Data

## Overview

Mock Mode generates realistic simulated race data for testing, development, and demonstration purposes when no live races are available.

## ✨ Features

- **Realistic Data Generation**: Simulates lap times, positions, gaps, and race progression
- **Configurable Sessions**: Control session type, duration, lap count, and number of karts
- **Full Feature Compatibility**: Works with all app features just like live data
- **No Data Persistence**: Mock data is never saved to history or analysis
- **Easy Toggle**: Enable/disable from Settings with one click
- **Visual Indicator**: Prominent banner shows when mock mode is active

## 🎯 Use Cases

### Development & Testing
- Test new features without waiting for live races
- Debug UI components with controlled data
- Performance testing with multiple scenarios

### Demonstrations
- Show app features to potential users
- Create training materials
- Present at events without live data dependency

### Learning
- Understand app functionality
- Explore different racing scenarios
- Practice using analysis tools

## 🚀 How to Use

### Enabling Mock Mode

1. **Open Settings Tab** (⚙️ icon at bottom)
2. **Find "Mock Mode (Testing)" section** (near the top)
3. **Check "Enable Mock Mode"** checkbox
4. **Configure settings** (optional):
   - Session Type: Race, Practice, or Qualifying
   - Maximum Laps: 5-50 laps
   - Duration: 1-30 minutes
   - Number of Karts: 4-20 karts
5. **Mock session starts immediately**

### Visual Indicators

When mock mode is active, you'll see:
- **Green banner at top**: "🎭 MOCK MODE ACTIVE - Simulated Data (Not Saved)"
- **Console message**: "🎭 Mock mode activated"
- **Connection status**: Shows as connected

### Disabling Mock Mode

**Option 1: Settings**
- Go to Settings
- Uncheck "Enable Mock Mode"

**Option 2: Banner**
- Click "✕ Exit Mock Mode" button in the banner

**Option 3: Auto-Disable**
- Mock session ends automatically after:
  - Maximum laps completed, OR
  - Duration time expires

## ⚙️ Configuration Options

### Session Type
- **Race**: Competitive session with position changes
- **Practice**: More relaxed, focus on lap times
- **Qualifying**: Single-lap focused simulation

**Default**: Race

### Maximum Laps
Controls how many laps before session ends.

**Range**: 5-50 laps  
**Default**: 10 laps  
**Recommendation**: 
- Quick test: 5-10 laps
- Full session: 20-30 laps

### Duration (Minutes)
Maximum time for the session.

**Range**: 1-30 minutes  
**Default**: 5 minutes  
**Note**: Session ends when EITHER max laps or duration is reached (whichever comes first)

### Number of Karts
How many simulated karts/drivers in the session.

**Range**: 4-20 karts  
**Default**: 12 karts  
**Recommendation**:
- Testing: 8-12 karts
- Performance test: 16-20 karts

## 🎲 How Mock Data Works

### Realistic Simulation

Mock mode generates data that closely mimics real racing:

**Lap Times**:
- Base pace: 24-35 seconds per lap
- Variance: ±500ms lap-to-lap
- Improvement: Drivers get slightly faster over time (tire warm-up)
- Incidents: 5% chance of slow lap (simulates mistakes/traffic)

**Driver Names**:
- Pool of 20 realistic names
- Randomly assigned to karts
- Consistent throughout session

**Positions**:
- Sorted by total time (realistic)
- 15% chance of position change per lap (overtakes)
- Updates dynamically as race progresses

**Gaps & Intervals**:
- Calculated from actual lap times
- Shows realistic racing gaps
- Updates in real-time

### Data Updates

- **Frequency**: Every 3 seconds
- **Karts Updated**: 1-3 per update (realistic progression)
- **Position Changes**: Dynamic based on performance
- **Session End**: Automatic when limits reached

## 🔒 Data Safety

### What Gets Saved
**NOTHING** - Mock data is completely isolated

### What Doesn't Get Saved
- ❌ Session history
- ❌ Personal bests
- ❌ Kart analysis
- ❌ Driver statistics
- ❌ Lap history

### How It's Protected

**1. Flag System**:
```javascript
sessionData.isMock = true  // All mock data is flagged
```

**2. Storage Protection**:
- Session history service checks `isMock` flag
- Automatically skips save if true

**3. Console Logging**:
```
🎭 Skipping save of mock session data
```

**4. Visual Warning**:
- Banner shows "Not Saved"
- Settings show warning message

## 💡 Tips & Best Practices

### For Development

```javascript
// Quickly test a feature
1. Enable mock mode
2. Set short duration (1-2 min)
3. Set few karts (4-6)
4. Focus on your feature
5. Disable when done
```

### For Demonstrations

```javascript
// Impressive demo
1. Set to "Race" type
2. 10 laps, 5 minutes
3. 12-16 karts (good action)
4. Let run to completion
5. Show results/analysis tabs
```

### For Testing Edge Cases

```javascript
// Stress test
1. Set 20 karts (maximum)
2. 30 minutes duration
3. 50 laps maximum
4. Watch for performance issues
```

## 🔄 Restarting Sessions

**During Active Session**:
1. Go to Settings
2. Adjust configuration if desired
3. Click "🔄 Restart Mock Session"
4. New session starts immediately with new settings

**Between Sessions**:
1. Session ends automatically
2. Stays in mock mode
3. Check "Enable Mock Mode" again to start new session

## 🐛 Troubleshooting

### Mock Mode Won't Enable

**Check**:
- Settings tab is open
- Checkbox is checked
- Console for errors
- Browser refresh

**Solution**:
```bash
# Hard refresh browser
Ctrl + Shift + R
```

### Banner Doesn't Show

**Check**:
- Mock mode is actually enabled
- Banner not hidden by CSS
- Console shows "Mock mode activated"

**Solution**:
```javascript
// In browser console
document.getElementById('mock-mode-banner').classList.remove('hidden');
```

### Data Looks Unrealistic

**Cause**: Normal behavior - mock data is randomized

**Adjust**:
- Increase lap count for more stable data
- Use more karts for better averages
- Restart session for different random seed

### Performance Issues

**With 20 karts**:
- Expected on slower devices
- Reduce to 12-16 karts
- Shorter sessions

**Solution**:
```javascript
// Optimal settings
- 12 karts
- 10 laps
- 5 minutes
```

## 📊 Comparison: Mock vs Live

| Feature | Mock Data | Live Data |
|---------|-----------|-----------|
| **Connection** | Simulated | Real WebSocket |
| **Lap Times** | Randomized | Actual timing |
| **Drivers** | Generated | Real drivers |
| **Updates** | Every 3s | Real-time |
| **Saved** | ❌ Never | ✅ Always |
| **Reliability** | 100% | Depends on connection |
| **Use Case** | Testing/Demo | Real racing |

## 🎓 Advanced Usage

### Custom Mock Data

For developers who want to customize:

```javascript
// js/services/mock-data.service.js
const MOCK_CONFIG = {
    MIN_LAP_TIME: 24000,      // Adjust min lap time
    MAX_LAP_TIME: 35000,      // Adjust max lap time
    LAP_VARIANCE: 500,        // Change consistency
    INCIDENT_CHANCE: 0.05,    // Change incident rate
    UPDATE_INTERVAL: 3000     // Change update speed
};
```

### Programmatic Control

```javascript
import * as WebSocketService from './services/websocket.service.js';

// Enable with custom options
WebSocketService.enableMockMode({
    sessionType: 'qualifying',
    maxLaps: 20,
    durationMinutes: 10,
    kartCount: 15
});

// Check if in mock mode
const isMock = WebSocketService.isMockMode();

// Disable
WebSocketService.disableMockMode();
```

## 🔍 Technical Details

### Architecture

```
┌─────────────────────────────────┐
│  Mock Data Service              │
│  - Generates lap times          │
│  - Manages positions            │
│  - Simulates progression        │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  WebSocket Service              │
│  - Intercepts live connection   │
│  - Injects mock data            │
│  - Simulates callbacks          │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  App Views                      │
│  - Process data normally        │
│  - No difference from live      │
│  - All features work            │
└─────────────────────────────────┘
```

### Data Flow

1. **User enables mock mode**
2. **Real WebSocket disconnects** (if connected)
3. **Mock service initializes** with configuration
4. **Generates initial race state**
5. **Updates every 3 seconds**:
   - Random karts complete laps
   - Positions recalculated
   - Data formatted as RaceFacer format
6. **Callbacks trigger** UI updates
7. **Session ends** when limits reached
8. **Auto-stops** mock service

### File Structure

```
js/services/
├── mock-data.service.js      # Mock data generation
├── websocket.service.js       # Mock mode integration
└── session-history.service.js # Save protection

Settings UI:
├── index.html                 # Mock mode controls
└── styles.css                 # Mock banner styling

Event Handlers:
└── app.main.js               # Mock mode events
```

## ✅ Best Practices Summary

**DO**:
- ✅ Use for development and testing
- ✅ Demonstrate features safely
- ✅ Adjust settings for your needs
- ✅ Disable when not needed
- ✅ Check console for confirmation

**DON'T**:
- ❌ Rely on mock data for real analysis
- ❌ Mix mock and live sessions
- ❌ Try to save mock data manually
- ❌ Use for actual race timing
- ❌ Leave enabled unintentionally

## 🆘 Support

If you encounter issues:
1. Check console for errors
2. Try disabling and re-enabling
3. Refresh browser
4. Check this documentation
5. Report bugs with console logs

## 🎉 Summary

Mock Mode is a powerful testing tool that:
- Generates realistic racing data on demand
- Works with all app features
- Never interferes with real data
- Easy to use and configure
- Perfect for development and demos

**Start testing now!** Enable mock mode in Settings → Mock Mode (Testing) 🎭

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-30  
**Status**: ✅ Production Ready


