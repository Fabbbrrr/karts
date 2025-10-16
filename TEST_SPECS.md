# 🧪 Karting Live Timer - Test Specifications

## Overview
Comprehensive test cases and specifications for all features of the Karting Live Timer application.

---

## 1. WebSocket Connection & Live Data

### Test Case 1.1: Initial Connection
**Scenario:** User opens the application for the first time
- **Given:** Application is loaded
- **When:** App initializes
- **Then:** 
  - Connection indicator shows "connecting"
  - Console logs: "🔌 Connecting to https://live.racefacer.com:3123..."
  - Console logs: "📡 Joined channel: lemansentertainment"
  - Connection indicator turns green
  - Loading screen shows "Connected! Waiting for data..."

**Use Case:** Track administrator opens timing display at race start

### Test Case 1.2: Live Data Reception
**Scenario:** Live timing data is received from server
- **Given:** WebSocket is connected
- **When:** Session data arrives
- **Then:**
  - Console logs: "📥 [timestamp] Session data received: {...}"
  - Console logs: "🔄 Updating view: race"
  - Loading screen automatically hides after 5 seconds or first data
  - Race view displays driver list

**Use Case:** Display updates automatically every few seconds during active race

### Test Case 1.3: Disconnection & Reconnection
**Scenario:** Network connection is lost
- **Given:** App is connected and displaying data
- **When:** Network drops
- **Then:**
  - Console logs: "❌ Disconnected from RaceFacer - reconnecting..."
  - Connection indicator turns red
  - App automatically attempts reconnection
  - Data freezes at last received state

**Use Case:** WiFi drops briefly during race, app recovers automatically

---

## 2. 60-Second Lap Filter

### Test Case 2.1: Normal Lap Recording
**Scenario:** Driver completes a normal lap
- **Given:** Driver is actively racing
- **When:** Lap time is under 60 seconds (e.g., 28.5s)
- **Then:**
  - Lap is recorded in analysis data
  - Lap appears in lap history
  - Lap included in averages and statistics
  - Personal best can be updated

**Use Case:** Regular race lap is properly tracked

### Test Case 2.2: Long Lap Exclusion (Incident)
**Scenario:** Driver has an incident causing a long lap
- **Given:** Driver crashes or has mechanical issue
- **When:** Lap time exceeds 60 seconds (e.g., 92.3s)
- **Then:**
  - Console logs: "⚠️ Excluding long lap from analysis: [name] - [time]"
  - Lap NOT added to kartAnalysisData.laps array
  - Lap NOT included in kart performance calculations
  - Lap NOT included in driver averages
  - Lap NOT eligible for personal best
  - Lap STILL visible in session data for winner determination

**Use Case:** Driver spins out, lap is 75 seconds - excluded from analysis but counted for race results

### Test Case 2.3: System Error Lap Exclusion
**Scenario:** Venue forgets to remove driver from previous session
- **Given:** Driver from previous session still in system
- **When:** "Ghost" driver shows lap time of 300+ seconds
- **Then:**
  - Lap excluded from all analysis
  - No impact on kart performance rankings
  - Console warning logged

**Use Case:** Previous session driver appears with 5-minute "lap" - automatically filtered

### Test Case 2.4: Rebuild Aggregations with Filter
**Scenario:** App rebuilds kart statistics from stored data
- **Given:** kartAnalysisData contains mix of normal and long laps
- **When:** rebuildAggregations() is called
- **Then:**
  - Only laps ≤60s processed
  - Console logs: "⚠️ Excluded [X] laps > 60s from aggregations"
  - Kart statistics accurate without anomalies

**Use Case:** User refreshes app, stored data is reprocessed correctly

---

## 3. Race View - Driver List

### Test Case 3.1: Display All Active Drivers
**Scenario:** Multiple drivers are racing
- **Given:** Session has 8 active drivers
- **When:** Race view is displayed
- **Then:**
  - All 8 drivers shown in position order
  - Each shows: Position, Kart #, Name, Best Time, Gap
  - Optional data (based on settings): Last lap, Avg, Consistency, Interval
  - Main driver highlighted if selected

**Use Case:** Competition with 8 drivers, all visible at once

### Test Case 3.2: Click Driver to View HUD
**Scenario:** User wants to focus on specific driver
- **Given:** Race view shows multiple drivers
- **When:** User clicks on Kart 12
- **Then:**
  - Console logs: "🏎️ Selecting driver and switching to HUD: 12"
  - state.settings.mainDriver set to "12"
  - All dropdowns (main, HUD, HUD quick) updated to Kart 12
  - App switches to HUD tab
  - HUD displays Kart 12's data

**Use Case:** Parent wants to watch their child racing in Kart 12

### Test Case 3.3: Cursor Changes on Hover
**Scenario:** User hovers over driver entries
- **Given:** Race view displayed
- **When:** Mouse hovers over any driver
- **Then:**
  - Cursor changes to pointer
  - Visual feedback (if any hover effects)

**Use Case:** User discovers clickable drivers

### Test Case 3.4: Real-time Updates
**Scenario:** Race is in progress
- **Given:** Live data streaming
- **When:** Drivers complete laps and positions change
- **Then:**
  - List updates without full re-render (no flicker)
  - Positions re-order smoothly
  - Times update live
  - No unnecessary element recreation

**Use Case:** Watching live race with frequent position changes

---

## 4. HUD View - Single Driver Focus

### Test Case 4.1: Driver Selection via Dropdown (No Driver Screen)
**Scenario:** User arrives at HUD without selecting driver
- **Given:** HUD view active, no driver selected
- **When:** User sees "Select Your Driver" screen
- **Then:**
  - Dropdown populated with all active drivers
  - User selects Kart 5 from dropdown
  - Console logs: "🏎️ HUD driver selector changed: 5"
  - HUD content appears
  - "No driver" screen hides

**Use Case:** First time user navigates directly to HUD tab

### Test Case 4.2: Driver Selection via Quick Selector
**Scenario:** User wants to switch drivers while viewing HUD
- **Given:** HUD showing Kart 12
- **When:** User selects Kart 7 from quick selector in header
- **Then:**
  - Console logs: "🏎️ HUD quick selector changed: 7"
  - HUD updates to show Kart 7
  - All dropdowns sync to Kart 7
  - No screen flash, just data update

**Use Case:** Coach monitoring multiple drivers, switching between them

### Test Case 4.3: HUD Data Display
**Scenario:** Driver is actively racing
- **Given:** Kart 3 selected, live data streaming
- **When:** HUD view displayed
- **Then:**
  - Shows: Position, Kart number, Event name, Lap info
  - Shows: Last lap, Best lap, Average lap, Gap, Interval, Consistency
  - Shows: Personal Best and Gap to PB (if available)
  - Shows: Session timer counting down
  - Shows: Lap history (last ~20 laps) with color coding
  - Shows: Position change from start (↑/↓)

**Use Case:** Driver in Kart 3 wants full detailed view of performance

### Test Case 4.4: Empty HUD Debug
**Scenario:** HUD shows empty screen after selection
- **Given:** Driver selected
- **When:** HUD appears empty
- **Then:**
  - Check console for:
    - "🎯 updateHUDView called {hasSessionData: false...}" → No data
    - "⚠️ No main driver selected" → Selection failed
    - "⚠️ Driver not found in session data: X" → Wrong kart number
    - "✅ HUD displaying driver: X [name]" → Working correctly

**Use Case:** Troubleshooting HUD display issues

---

## 5. Lap Flash Animation

### Test Case 5.1: Flash on Lap Completion
**Scenario:** Selected driver completes a lap
- **Given:** HUD view active, watching Kart 8
- **When:** Kart 8 crosses finish line
- **Then:**
  - Screen flashes green (inset glow effect)
  - Animation: 0s (no glow) → 15% (80px glow @ 0.8 opacity) → 40% (60px @ 0.5) → 100% (fade out)
  - Duration: 0.6 seconds
  - Lap history updates with new lap
  - Audio celebration (if best lap)

**Use Case:** Driver wants immediate visual feedback when lap completes

### Test Case 5.2: No Flash on Other Drivers
**Scenario:** Different driver completes lap
- **Given:** HUD showing Kart 8, Kart 3 completes lap
- **When:** Kart 3 crosses finish line
- **Then:**
  - No flash animation
  - Data still updates in background

**Use Case:** Multi-driver session, only focused driver triggers flash

### Test Case 5.3: No Flash on Other Tabs
**Scenario:** User viewing race tab while selected driver laps
- **Given:** Kart 8 selected, user on Race tab
- **When:** Kart 8 completes lap
- **Then:**
  - No flash animation (not on HUD tab)
  - Data updates normally

**Use Case:** User browsing other tabs, not distracted by flashes

---

## 6. Personal Best Tracking

### Test Case 6.1: First Lap for Driver
**Scenario:** New driver completes their first lap
- **Given:** Driver "John Doe" has no previous records
- **When:** Completes lap in 29.5s
- **Then:**
  - Personal best set to 29.5s
  - Stored in localStorage
  - Shows in HUD and Race view
  - Console logs: "🏆 New Personal Best for John Doe: 29.5s"

**Use Case:** First timer at the track sets initial benchmark

### Test Case 6.2: Breaking Personal Best
**Scenario:** Driver improves their time
- **Given:** John's PB is 29.5s
- **When:** Completes lap in 28.2s
- **Then:**
  - PB updated to 28.2s
  - Celebration sound plays (if enabled)
  - Vibration haptic (if enabled)
  - Console logs new PB
  - Gap to PB resets to 0.000

**Use Case:** Driver improves over multiple sessions at same venue

### Test Case 6.3: Gap to Personal Best Display
**Scenario:** Driver's current lap compared to PB
- **Given:** PB is 28.2s, current lap is 29.1s
- **When:** Lap displays
- **Then:**
  - Shows "+0.900" in red (slower than PB)
  - Clear visual indication of being off pace

**Use Case:** Driver tracking consistency against personal best

### Test Case 6.4: Long Lap Not Eligible for PB
**Scenario:** Driver has incident, long lap time
- **Given:** PB is 28.2s
- **When:** Completes lap in 75.3s (incident)
- **Then:**
  - Lap NOT considered for PB
  - PB remains 28.2s
  - No celebration

**Use Case:** Spin-out doesn't corrupt personal best record

---

## 7. Kart Analysis

### Test Case 7.1: Data Collection Across Sessions
**Scenario:** System tracks kart performance over time
- **Given:** Multiple sessions with different drivers
- **When:** Data accumulates
- **Then:**
  - Each lap stored with: timestamp, session, kartId, driver, lapTime
  - Laps >60s excluded
  - Maximum 140 sessions stored (~30k laps)
  - Old sessions auto-deleted when limit reached

**Use Case:** Track owner analyzing kart performance over weeks

### Test Case 7.2: Kart Rankings Display
**Scenario:** View which karts are fastest
- **Given:** Analysis data exists
- **When:** Analysis tab opened
- **Then:**
  - Karts sorted by average lap time
  - Shows: Rank, Kart ID, Kart #, Avg Lap, Best Lap
  - Shows: Normalized index, % faster/slower than average
  - Shows: Total laps, driver count, confidence level
  - Color coding: Top 3 (gold/silver/bronze)

**Use Case:** Mechanic identifies consistently slow kart needing maintenance

### Test Case 7.3: Driver-Normalized Performance
**Scenario:** Account for driver skill differences
- **Given:** Same driver used Karts 5 and 12
- **When:** Analysis calculated
- **Then:**
  - Compares lap times relative to driver's average
  - Higher weight on cross-kart drivers
  - Confidence score increases with more data
  - Neutralizes "good driver on bad kart" scenarios

**Use Case:** Professional vs beginner drove same kart, analysis accounts for skill

### Test Case 7.4: Kart Details Modal
**Scenario:** Deep dive into specific kart
- **Given:** Analysis view displayed
- **When:** User clicks "Details" on Kart 8
- **Then:**
  - Modal opens with comprehensive stats
  - Shows all drivers who used this kart
  - Lap time distribution
  - Session-by-session breakdown
  - Confidence factors

**Use Case:** Investigating why Kart 8 is 2% slower than average

---

## 8. Compare View

### Test Case 8.1: Select Two Drivers
**Scenario:** Compare two competitors
- **Given:** Active race with multiple drivers
- **When:** User selects Kart 3 and Kart 7
- **Then:**
  - Side-by-side comparison displays
  - Shows: Position, Best lap, Last lap, Avg, Consistency, Laps, Gap
  - Better values highlighted in green

**Use Case:** Two friends racing, comparing performance

### Test Case 8.2: Preserve Selections on Update
**Scenario:** Selections maintained during live updates
- **Given:** Comparing Kart 3 vs Kart 7
- **When:** New lap data arrives (every few seconds)
- **Then:**
  - Dropdowns remain on Kart 3 and 7
  - Data updates without clearing selections
  - No need to re-select drivers

**Use Case:** Watching ongoing battle between two drivers

### Test Case 8.3: Empty State
**Scenario:** No drivers selected
- **Given:** Compare view opened
- **When:** No selections made
- **Then:**
  - Shows "Select two drivers to compare"
  - Both dropdowns available
  - No comparison table shown

**Use Case:** User exploring compare feature

---

## 9. Results View

### Test Case 9.1: Multiple Scoring Methods
**Scenario:** Different competition formats
- **Given:** Session completed
- **When:** User selects scoring method
- **Then:**
  - "Fastest Lap" → Sorted by best lap time (default)
  - "Total Time" → Sum of all laps (endurance)
  - "Average Lap" → Mean lap time
  - "Best 3 Avg" → Average of 3 best laps
  - "Consistency" → Lowest standard deviation

**Use Case:** Venue runs different event types, each needs appropriate scoring

### Test Case 9.2: Podium Display
**Scenario:** Top 3 finishers celebrated
- **Given:** Race results calculated
- **When:** Results view shown
- **Then:**
  - Podium visualization: 2nd (left), 1st (center, tallest), 3rd (right)
  - Shows kart number, driver name, winning time
  - Visual prominence on winner

**Use Case:** Award ceremony display at end of race

---

## 10. Settings & Configuration

### Test Case 10.1: Channel Configuration
**Scenario:** Connect to different venue
- **Given:** Default channel is "lemansentertainment"
- **When:** User changes to "raceway_london"
- **Then:**
  - Disconnects from old channel
  - Connects to new channel
  - Settings saved to localStorage
  - Persists across sessions

**Use Case:** Same app used at different tracks

### Test Case 10.2: Display Toggles
**Scenario:** Customize visible information
- **Given:** Default shows all stats
- **When:** User unchecks "Show Intervals"
- **Then:**
  - Interval column hidden in race view
  - Settings saved
  - Applied immediately

**Use Case:** Simplify display for younger drivers

### Test Case 10.3: Theme Selection
**Scenario:** User preference for colors
- **Given:** Default dark theme
- **When:** User selects "F1 Red" theme
- **Then:**
  - Color scheme changes to red accents
  - Theme saved to localStorage
  - Applied to all views

**Use Case:** Personal preference or venue branding

---

## 11. Data Export & Import

### Test Case 11.1: Export Analysis Data
**Scenario:** Backup kart analysis for records
- **Given:** Months of kart analysis collected
- **When:** User clicks "Export Kart Analysis Data"
- **Then:**
  - JSON file downloads
  - Filename: `kart-analysis-YYYY-MM-DD-HHmmss.json`
  - Contains: laps array, karts object, drivers object, sessions

**Use Case:** Archive data before venue updates to new system

### Test Case 11.2: Import Analysis Data
**Scenario:** Restore or merge data from backup
- **Given:** Previous export file
- **When:** User imports file
- **Then:**
  - Prompts: Replace, Merge, or Cancel
  - Merge: Combines with existing data
  - Replace: Overwrites current data
  - Updates analysis view immediately

**Use Case:** Restore data after browser cache cleared

### Test Case 11.3: Export All Data
**Scenario:** Complete backup including personal records
- **Given:** User has personal bests and settings
- **When:** "Export All Data" clicked
- **Then:**
  - Includes: kart analysis, personal records, settings
  - Single JSON file with all data

**Use Case:** Driver changing devices, wants to transfer all data

---

## 12. Session Replay

### Test Case 12.1: Record Live Session
**Scenario:** Automatic session recording
- **Given:** Live data streaming
- **When:** Session progresses
- **Then:**
  - Session snapshots saved to localStorage
  - Session identified by: event name + session name + timestamp
  - Maximum sessions stored (to prevent overflow)

**Use Case:** Review race after completion

### Test Case 12.2: Load Replay
**Scenario:** View past session
- **Given:** Completed session exists
- **When:** User selects session from dropdown
- **Then:**
  - App enters replay mode
  - Console logs: "📼 Loading replay session..."
  - Data frozen at final state
  - "Go Live" button appears
  - No new live data processed

**Use Case:** Analyze yesterday's race for coaching

### Test Case 12.3: Return to Live
**Scenario:** Exit replay mode
- **Given:** Replay session active
- **When:** User clicks "Return to Live Data"
- **Then:**
  - Replay mode disabled
  - Clears current session data
  - Resumes live data processing
  - Dropdown resets to "Live Data"

**Use Case:** Finish review, return to monitoring current race

---

## 13. Storage Management

### Test Case 13.1: Auto Cleanup
**Scenario:** Prevent localStorage overflow
- **Given:** 140 sessions stored (capacity)
- **When:** New session starts
- **Then:**
  - Oldest session automatically deleted
  - Console logs cleanup operation
  - Aggregations rebuilt without old data
  - App continues functioning

**Use Case:** Long-running venue with continuous races

### Test Case 13.2: Storage Status Display
**Scenario:** Monitor storage usage
- **Given:** Settings tab open
- **When:** Storage status section visible
- **Then:**
  - Shows: Total laps, karts tracked, drivers, sessions
  - Shows: Approximate storage size
  - Shows: Last cleanup info
  - Refresh button updates display

**Use Case:** Track administrator monitoring data health

### Test Case 13.3: Manual Reset
**Scenario:** Clear all analysis data
- **Given:** User wants fresh start
- **When:** Clicks "Reset All Analysis Data"
- **Then:**
  - Confirmation prompt appears
  - If confirmed: All data deleted
  - Console cleared
  - localStorage cleared
  - Analysis view shows "No data yet"

**Use Case:** New season begins, archive old data and start fresh

---

## 14. PWA Features

### Test Case 14.1: Install Prompt
**Scenario:** User can install as app
- **Given:** Browser supports PWA
- **When:** User visits site
- **Then:**
  - Install prompt appears (if not previously dismissed)
  - User can install to home screen
  - App runs in standalone mode

**Use Case:** Track display on tablet mounted at track

### Test Case 14.2: Offline Functionality
**Scenario:** Limited offline capability
- **Given:** App installed
- **When:** Network disconnected
- **Then:**
  - App shell loads
  - Shows last cached data
  - Cannot receive new live data (expected)
  - Reconnects when network returns

**Use Case:** Brief WiFi interruption, app recovers gracefully

### Test Case 14.3: Wake Lock
**Scenario:** Prevent screen sleep during race
- **Given:** Device supports wake lock
- **When:** App is active
- **Then:**
  - Screen stays on
  - No manual interaction needed
  - Released when app closed

**Use Case:** Unmanned display monitor for spectators

---

## 15. Error Handling & Edge Cases

### Test Case 15.1: No Active Drivers
**Scenario:** Session not started yet
- **Given:** Connected but no data
- **When:** Race view loads
- **Then:**
  - Empty state message
  - No crashes or errors
  - Graceful handling

**Use Case:** Open app before race starts

### Test Case 15.2: Driver Disconnects Mid-Race
**Scenario:** Kart goes off track and stops transmitting
- **Given:** Driver actively racing
- **When:** No more lap data received
- **Then:**
  - Last known data displayed
  - No errors in console
  - Re-appears if reconnects

**Use Case:** Technical issue with timing transponder

### Test Case 15.3: Malformed Data
**Scenario:** Server sends unexpected data format
- **Given:** Live connection active
- **When:** Corrupted packet arrives
- **Then:**
  - Console logs error
  - App doesn't crash
  - Continues processing next valid data

**Use Case:** Timing system glitch sends bad data

### Test Case 15.4: LocalStorage Full
**Scenario:** Browser storage quota exceeded
- **Given:** Storage at capacity
- **When:** Trying to save more data
- **Then:**
  - Error caught and logged
  - Auto-cleanup triggered
  - User notified to export data
  - App continues functioning

**Use Case:** Very long-running installation with extensive history

---

## Acceptance Criteria Summary

### Critical (Must Work)
- ✅ WebSocket connects and receives data
- ✅ Live race data displays in real-time
- ✅ Driver selection works via all methods
- ✅ HUD displays selected driver data
- ✅ Laps >60s excluded from analysis
- ✅ Personal bests track correctly
- ✅ Kart analysis calculates performance

### High Priority (Should Work)
- ✅ Lap flash animation on completion
- ✅ Compare view preserves selections
- ✅ Multiple scoring methods in results
- ✅ Data export/import functions
- ✅ Session replay capability
- ✅ Dropdown synchronization

### Medium Priority (Nice to Have)
- ✅ Position change indicators
- ✅ Pace trend indicators
- ✅ Theme customization
- ✅ Storage management tools
- ✅ PWA install capability

### Low Priority (Future Enhancement)
- ⏳ Chart visualizations
- ⏳ Statistical analysis tools
- ⏳ Multi-session comparisons
- ⏳ Driver profile management

---

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Required Features
- ES6 Modules
- WebSocket support
- localStorage (5MB+)
- CSS Grid & Flexbox
- Optional: Wake Lock API, Vibration API

---

## Performance Benchmarks

### Response Times
- Initial load: < 2 seconds
- Data update: < 100ms
- Tab switch: < 50ms
- View render: < 200ms

### Resource Usage
- Memory: < 100MB typical
- Storage: ~5MB per 30k laps
- Network: ~1KB per data update (every 2-5s)

### Capacity Limits
- Max concurrent drivers: 50
- Max stored laps: ~30,000
- Max sessions: 140
- Update frequency: 2-5 seconds

---

## Testing Checklist

- [ ] WebSocket connection and reconnection
- [ ] Live data updates without flicker
- [ ] 60-second lap filter working
- [ ] Click driver to HUD works
- [ ] HUD dropdowns populate and select
- [ ] Lap flash animation triggers
- [ ] Personal bests save and update
- [ ] Kart analysis rankings accurate
- [ ] Compare view preserves selections
- [ ] Results calculate correctly
- [ ] Settings persist across sessions
- [ ] Data export/import functional
- [ ] Session replay works
- [ ] Storage cleanup operates
- [ ] PWA install available
- [ ] Mobile responsive
- [ ] Console errors clean
- [ ] Performance acceptable

---

**Last Updated:** 2025-01-06
**Version:** 2.0
**Test Coverage:** Core features documented

