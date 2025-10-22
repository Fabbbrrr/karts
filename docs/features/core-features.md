# Core Features

Complete guide to all RaceFacer UI features.

## 🏁 Live Timing Display

### Race Tab
Real-time race leaderboard showing:
- Driver name and kart number
- Current position
- Last lap time with color coding
- Gap to leader
- Sector times
- Number of laps completed
- Position changes

**Features:**
- Tap driver name to switch to their HUD view
- Color-coded lap times (purple=PB, green=improvement, yellow=good, red=slow)
- Live position updates
- Automatic session detection

### HUD (Heads-Up Display)
Full-screen dashboard for racing with large, glanceable data:
- Current lap time (live)
- Last lap time
- Best lap time
- Gap to leader
- Current position
- Gap to session best
- Lap counter
- Personal best tracking

**Customization:**
- Hide any card with mini toggle (➖)
- Driver selector dropdown
- Touch-optimized controls
- Always-on display (PWA mode)

## 🏆 Multiple Scoring Methods

Revolutionary 5-way results system - see winners by different metrics:

### 1. 🏁 Fastest Lap (Default)
- **Winner**: Driver with single fastest lap
- **Best for**: Sprint races, qualifying
- **Rewards**: Raw speed, perfect laps

### 2. ⏱️ Total Time
- **Winner**: Lowest cumulative time (all laps)
- **Best for**: Endurance races
- **Rewards**: Consistency + completing laps

### 3. 📈 Average Lap Time
- **Winner**: Best average across all laps
- **Best for**: Fair comparison across lap counts
- **Rewards**: Overall consistency

### 4. ⭐ Best 3 Average
- **Winner**: Best average of top 3 laps
- **Best for**: Eliminating outliers (traffic, mistakes)
- **Rewards**: Peak performance potential
- **Requires**: Minimum 3 completed laps

### 5. 🎯 Consistency Score
- **Winner**: Most consistent lap times
- **Best for**: Smooth, predictable driving
- **Rewards**: Low variance driving
- **Calculation**: Based on standard deviation

**Each method includes:**
- Animated podium (gold/silver/bronze)
- Full standings table
- Color-coded bar chart
- Detailed statistics
- Instant switching between methods

## 📊 Advanced Analytics

### Kart Performance Analysis
Scientific analysis to determine which karts are fastest:
- **Driver-Normalized Index**: Accounts for skill differences
- **Percentile Rankings**: Performance across sessions
- **Cross-Kart Detection**: Most valuable data (drivers who used multiple karts)
- **Confidence Scoring**: Data quality indicators (🟢 🟡 🔴)
- **Automatic Collection**: Passive data gathering

**How it works:**
1. Leave app running during sessions
2. Tracks every lap with driver/kart/time
3. Normalizes for driver skill differences
4. Prioritizes cross-kart driver data (70% weight)
5. Displays rankings with confidence metrics

### Lap Analysis
Every lap includes:
- Lap time with color coding
- Delta to session best
- Delta to personal best
- Position at lap completion
- Sector times (if available)

**Color System:**
- 🟣 Purple: Personal best lap
- 🟢 Green: Faster than session average
- 🟡 Yellow: Good lap (within 105% of best)
- 🔴 Red: Slow lap (over 105% of best)

### Gap Tracking
Real-time gap monitoring:
- Gap to leader (if not P1)
- Gap to car ahead
- Gap to car behind
- Trend indicators (closing/opening)
- Historical gap progression

## 💾 Session Management

### Auto-Save Feature
- **Automatic**: Sessions saved when new session starts
- **Storage**: Last 20 sessions preserved
- **Location**: Browser localStorage
- **Data included**: Full timing, positions, laps, notes

### Session Replay
- Select from saved sessions dropdown
- View complete historical data
- Switch between sessions instantly
- Orange banner shows historical mode
- "Go Live" button returns to current session

### Session Info
Each session includes:
- Date and time
- Event name
- Winner information (name, kart, time)
- Total laps completed
- Number of drivers
- Session duration

## 🏅 Personal Best Tracking

Automatic tracking of driver records:

**Features:**
- Tracks by driver name (persistent across karts)
- All-time best lap for each driver
- Real-time PB comparison
- Celebration animations for new PBs
- Stored indefinitely

**Display:**
- Race table: PB column with gap
- HUD: Dedicated PB cards
- Lap history: PB delta on each lap
- Summary: PB achievements

## 🎤 Text-to-Speech Alerts

Audio notifications for key events:

**Always Announced:**
- Lap time completion
- Current position
- Gap to session best

**Optional (Configurable):**
- Gap to leader
- Gap to personal best
- Position changes
- Proximity alerts

**Controls:**
- Quick toggle in HUD header (📢)
- Granular settings in Settings tab
- Test buttons for each announcement
- Volume control through device

**Example Announcement:**
> "30.5 seconds, First place, plus 0.5 seconds, to leader plus 1.5 seconds, PB minus 0.3 seconds"

## 📈 Position Visualization

### Position Change Chart
F1-style line chart showing:
- Every driver's position over time
- Color-coded lines per driver
- Exact lap where positions changed
- Zoom and pan capabilities
- Highlight selected driver

**Interactions:**
- Click legend to show/hide drivers
- Hover for exact data points
- Tap driver in legend to focus

## ⚖️ Driver Comparison

Side-by-side statistics for any two drivers:

**Compared Data:**
- Best lap time
- Average lap time
- Last lap time
- Position
- Total laps
- Gap to leader
- Consistency score

**Features:**
- Color-coded better/worse indicators
- Real-time updates
- Quick driver switching
- Clear visual comparison

## 📝 Driver Notes

Timestamped note-taking system:

**Features:**
- Add notes during or after racing
- Timestamp with lap number
- Editable and deletable
- Persisted with session data
- Export with session

**Use Cases:**
- Track setup changes
- Note track conditions
- Record incidents
- Document strategy

## 🎨 Customization

### Visual Themes
Four color schemes:
- 🌙 **Dark** (default)
- ☀️ **Light**
- 🏎️ **F1 Red**
- 🏁 **Racing Green**

### Component Visibility
- Mini toggles (➖) on every HUD card
- Settings checkboxes for each feature
- "Show All" button to restore
- Persistent preferences

### HUD Layout
Configure displayed components:
- Position and gaps
- Timing information
- Personal best tracking
- Session statistics
- Lap history

## 📱 Progressive Web App

### Installation Benefits
- Standalone app experience
- Home screen icon
- Splash screen
- No browser UI
- Faster loading
- Offline capability

### Always-On Display
- Screen stays awake during races
- No manual unlocking needed
- Battery-efficient
- Automatic on PWA install

## 🔄 Data Management

### Export
Export complete session data as JSON:
- All lap times
- Position history
- Driver statistics
- Notes
- Kart analysis data
- Timing data

### Import
Restore from backup:
- Session history
- Personal bests
- Kart analysis
- Preferences
- Notes

### Storage
- Browser localStorage
- Automatic cleanup
- Configurable retention
- No cloud dependency

## 🔊 Audio Alerts

Pre-defined sounds for events:
- 🎶 **Personal Best**: Ascending chime
- 🔺 **Position Gain**: Double beep
- 🔻 **Position Loss**: Warning tone
- ⚠️ **Opponent Close**: Alert beep

**Features:**
- Device volume control
- Enable/disable per event
- Haptic feedback option
- No annoying repetition

## ⚡ Real-Time Updates

### WebSocket Connection
- Instant data updates
- Sub-second latency
- Automatic reconnection
- Connection status indicator
- Fallback support

### Update Frequency
- Lap times: Instant
- Positions: Every second
- Gaps: Every second
- Charts: Every 5 seconds

## 📊 Summary Tab

Post-race comprehensive analysis:
- Complete lap-by-lap history
- **Position battle chart** - Visual timeline of position changes
- Statistical overview
- New personal records
- Session achievements
- Export functionality

**Includes:**
- Fastest lap per driver
- Average lap time
- Total laps completed
- Session duration
- Winner information
- Gap analysis

### Position Battle Chart

**Visual Race Story:**
- **Animated line chart** showing every position change
- **Color-coded traces** - Each kart gets unique vibrant color
- **Position markers** - Larger dots highlight position changes
- **Interactive legend** - Kart numbers with driver names
- **Lap-by-lap view** - See exact lap when passes occurred

**Features:**
- Grid lines for easy position reading (P1, P2, P3, etc.)
- Lap markers on X-axis (L1, L5, L10, etc.)
- Glowing effect on kart lines for visibility
- Scales automatically to any number of drivers/laps
- Canvas-based rendering for smooth performance

**What It Shows:**
- Who led early vs. late
- Position swap battles
- Consistent vs. erratic driving
- Overtake frequency per driver
- Starting grid order vs. finishing order

## 🔧 Settings

Comprehensive configuration:

### Track Configuration
- Venue selection
- Track name
- WebSocket URL
- Session parameters

### Display Settings
- Color theme
- Component visibility
- Font sizes
- Chart preferences

### Audio Settings
- TTS enable/disable
- Sound effects
- Volume levels
- Announcement preferences

### Data Management
- Export/import
- Clear storage
- Session retention
- Kart analysis data

## 💡 Pro Tips

**Performance:**
- Install as PWA for best experience
- Keep screen brightness reasonable
- Close other tabs for performance

**Data Collection:**
- Leave app running for kart analysis
- Multiple sessions improve data quality
- Cross-kart driver data most valuable

**Racing:**
- Use HUD tab while driving
- Enable audio alerts
- Add notes immediately after laps
- Check all 5 scoring methods

**Analysis:**
- Export data after important sessions
- Compare drivers frequently
- Review lap history for improvements
- Track personal best progression

---

**Next Steps:**
- [Personal Best Feature](personal-best.md)
- [Text-to-Speech](text-to-speech.md)
- [Session History](session-history.md)

