# Incident Detection System

> **Status**: ✅ Implemented  
> **Version**: 1.0  
> **Last Updated**: 2025-10-22

## Overview

The Incident Detection System automatically identifies crashes, spins, and other on-track incidents by analyzing lap time anomalies. This feature adds competitive insight and entertainment value to race analysis.

## 🎯 Key Features

### Real-Time Detection
- **Live monitoring** of all drivers during sessions
- **Incident count display** in race view alongside other stats
- **Visual indicators** with emoji-based severity icons (🎯🟡🟠🔴)
- **Tooltip details** showing major vs minor incidents

### Results Analysis
- **"Crasher of the Day" award** in session insights
- **Incident breakdown** showing total, major, and minor incidents
- **Time added calculation** quantifying total time lost to incidents
- **Historical tracking** across all laps (excluding first lap)

### Smart Algorithm
- **Statistical analysis** using trimmed mean for accurate baselines
- **False positive reduction** via recovery lap confirmation
- **Severity classification** from minor (avoiding others) to major crashes
- **Configurable thresholds** for fine-tuning detection sensitivity

---

## 📊 Detection Algorithm

### How It Works

The incident detector uses **statistical outlier detection** on lap times:

1. **Baseline Calculation**
   - Calculates driver's average lap time using **trimmed mean**
   - Excludes statistical outliers (top/bottom 10%)
   - Ignores first lap (always slower)
   
2. **Anomaly Detection**
   - Identifies laps **>30% slower** than baseline (configurable)
   - Confirms with **recovery lap check** (next lap returns to normal)
   - Classifies severity based on how much slower

3. **Incident Classification**
   ```
   Severity 1: 30-40% slower (Minor - avoiding others)
   Severity 2: 40-50% slower (Moderate incident)
   Severity 3: 50-70% slower (Significant incident)
   Severity 4: 70-100% slower (Severe spin)
   Severity 5: 100%+ slower (Major crash)
   ```

### Configuration

Default thresholds in `js/utils/incident-detector.js`:

```javascript
const INCIDENT_CONFIG = {
    MIN_LAPS_FOR_DETECTION: 3,           // Need at least 3 laps
    INCIDENT_THRESHOLD_MULTIPLIER: 1.30,  // 30% slower triggers detection
    SEVERE_INCIDENT_MULTIPLIER: 1.50,     // 50% slower = major incident
    MAX_VALID_LAP_TIME: 60000,            // 60s max (filters DNF/DNS)
    MIN_INCIDENT_LAP_TIME: 15000,         // 15s min (filters false positives)
    RECOVERY_THRESHOLD: 1.15              // Next lap within 15% confirms incident
};
```

### What Gets Excluded

- **First lap** (always slower due to standing start)
- **Pit stops** (if lap time > 60 seconds)
- **Invalid times** (< 15 seconds)
- **Inconsistent recovery** (if driver continues slowly, may be intentional)

---

## 💡 Use Cases

### 1. Race View - Real-Time Monitoring

**Display**: Incident count appears in driver detail card

```
Kart #12 - John Smith
Last: 32.145  Avg: 31.892  ±0.234
🔴 3        ← Incident indicator
```

**Tooltip**: Hover shows breakdown
```
2 major, 1 minor
```

### 2. Results View - Session Insights

**"Most Incidents" Card**:
```
┌──────────────────────┐
│    💥              │
│  Most Incidents      │
│  John Smith          │
│  3 (2 major)         │
└──────────────────────┘
```

If no incidents detected:
```
┌──────────────────────┐
│    💥              │
│  Most Incidents      │
│  Clean session! 🎯   │
│  No incidents        │
└──────────────────────┘
```

### 3. Export & Analysis

Incident data is available for:
- **CSV exports** with per-driver incident counts
- **Historical analysis** across multiple sessions
- **Driver safety metrics** and improvement tracking

---

## 🔧 Technical Implementation

### Files Modified

1. **`js/utils/incident-detector.js`** (NEW)
   - Core detection algorithm
   - Statistical analysis functions
   - Configuration management

2. **`js/views/race.view.js`**
   - Added incident count display to race items
   - Real-time detection per driver
   - Emoji indicators with tooltips

3. **`js/views/results.view.js`**
   - "Most Incidents" insight card
   - Batch incident detection for all drivers
   - Summary statistics

4. **`index.html`**
   - Added insight card HTML for incident display

5. **`js/app.main.js`**
   - Pass full state to race view for lap history access

### API

#### `detectIncidents(lapHistory, options)`

Analyzes lap history for a single driver.

**Parameters:**
- `lapHistory`: Array of lap objects `{lapNum, timeRaw, time}`
- `options`: Optional config overrides

**Returns:**
```javascript
{
    totalIncidents: 3,
    severeIncidents: 1,
    minorIncidents: 2,
    incidents: [
        {
            lapNumber: 5,
            lapTime: 45123,
            lapTimeFormatted: "45.123",
            baselineAverage: 31892,
            delta: 13231,
            deltaPercent: "41.5",
            severity: 3,
            isSevere: false,
            timeAdded: 13231,
            recoveryLap: 6,
            recoveryTime: 32145
        },
        // ... more incidents
    ],
    incidentRate: "15.0",  // Percentage of laps with incidents
    totalTimeAdded: 23456,
    totalTimeAddedFormatted: "23.456s",
    baselineAverage: 31892,
    lapsAnalyzed: 20
}
```

#### `detectAllIncidents(lapHistory, sessionData)`

Batch detection for all drivers.

**Parameters:**
- `lapHistory`: Object keyed by kart number
- `sessionData`: Session data with runs

**Returns:**
```javascript
{
    "12": { /* incident analysis */ },
    "23": { /* incident analysis */ },
    // ... for all karts
}
```

#### `findMostIncidents(incidentsByDriver, sessionData)`

Finds driver with most incidents.

**Returns:**
```javascript
{
    kartNumber: "12",
    name: "John Smith",
    totalIncidents: 3,
    severeIncidents: 1,
    incidentRate: "15.0",
    analysis: { /* full incident analysis */ }
}
```

#### `getIncidentEmoji(count)`

Returns visual indicator based on count.

**Returns:**
- `🎯` - Clean (0 incidents)
- `🟡` - One incident
- `🟠` - Two incidents  
- `🔴` - Multiple incidents (3+)

---

## 🎮 User Experience

### Visual Design

**Race View Indicator**:
```css
.race-detail-value.incidents {
    font-weight: bold;
    color: #ff4444;  /* Red for incidents */
}
```

**Emoji Severity Scale**:
- 🎯 Clean driving (aspirational)
- 🟡 Learning curve (one mistake)
- 🟠 Challenging day (needs practice)
- 🔴 Crash-fest (entertaining to watch!)

### Fun Factor

The "Crasher of the Day" award adds **entertainment value**:
- Friendly competition element
- Conversation starter at track
- Motivation to improve driving
- Highlights exciting/dramatic races

---

## 📈 Future Enhancements

### Potential Improvements

1. **Incident Details View**
   - Click incident count to see timeline
   - Show exact lap numbers and times
   - Visual chart of incidents during race

2. **Pattern Recognition**
   - Identify incident-prone corners
   - Track-specific incident analysis
   - Weather correlation (if data available)

3. **Driver Profiles**
   - Incident rate over time
   - Improvement tracking
   - Safety score/rating

4. **Notifications**
   - TTS announcement for major incidents
   - Audio alert for main driver incidents
   - Push notifications (if enabled)

5. **Advanced Statistics**
   - Average time lost per incident
   - Recovery time analysis
   - Correlation with position changes

6. **Export & Reporting**
   - Incident heatmap by lap/driver
   - PDF report generation
   - Share-worthy incident statistics

### Configuration Options

Add to settings panel:
- Enable/disable incident detection
- Adjust sensitivity thresholds
- Show/hide in race view
- Color scheme preferences

---

## 🔍 Validation & Testing

### Test Scenarios

1. **Clean Session**
   - All drivers maintain consistent pace
   - Result: No incidents detected
   - Display: "Clean session! 🎯"

2. **Single Spin**
   - Driver has one slow lap, recovers next lap
   - Result: 1 incident detected
   - Display: "🟡 1"

3. **Major Crash**
   - Driver has lap 2x slower than average
   - Result: 1 severe incident
   - Display: "🔴 1 major"

4. **Multiple Incidents**
   - Driver has 3-4 slow laps throughout race
   - Result: Multiple incidents with breakdown
   - Display: "🔴 3 (1 major, 2 minor)"

5. **Slow Driving (Not Incident)**
   - Driver consistently slow but no anomalies
   - Result: No incidents detected
   - Reason: No statistical outliers

### Edge Cases

- **First lap excluded**: Never counted as incident
- **Short sessions** (< 3 laps): No detection
- **DNF/DNS**: Filtered by max lap time
- **Pit stops**: Excluded if > 60 seconds
- **Recovery validation**: Confirms true incidents

---

## 📝 Data Privacy & Ethics

### Considerations

- **Non-judgmental**: Presented as fun statistic, not criticism
- **Context-aware**: Beginners expected to have more incidents
- **Opt-out ready**: Easy to disable in future settings
- **No personal data**: Only uses timing data, no personal info

### Positive Framing

- Focus on **improvement over time**
- Celebrate **clean sessions** equally
- Use **humor and entertainment** value
- Avoid **shaming or negative connotations**

---

## 🐛 Known Limitations

1. **Traffic Avoidance**
   - Slowing to avoid others may count as incident
   - Mitigation: Requires significant slowdown (30%+)

2. **Yellow Flags**
   - Track-wide caution slows all drivers
   - Mitigation: Only flags individual anomalies

3. **Mechanical Issues**
   - Engine problems may appear as incidents
   - Mitigation: Recovery lap check helps distinguish

4. **Track Conditions**
   - Rain/oil may cause multiple false positives
   - Mitigation: Baseline adjusts to overall session pace

5. **Intentional Slowing**
   - Cooling down lap may trigger false positive
   - Mitigation: Recovery threshold filters most cases

---

## 🚀 Getting Started

### For Developers

1. **Import the utilities**:
   ```javascript
   import { detectIncidents, getIncidentEmoji } from '../utils/incident-detector.js';
   ```

2. **Detect incidents**:
   ```javascript
   const analysis = detectIncidents(state.lapHistory[kartNumber]);
   console.log(`Driver has ${analysis.totalIncidents} incidents`);
   ```

3. **Display in UI**:
   ```javascript
   const emoji = getIncidentEmoji(analysis.totalIncidents);
   element.innerHTML = `${emoji} ${analysis.totalIncidents}`;
   ```

### For Users

1. **Race View**: Look for emoji indicators next to driver stats
2. **Results View**: Check "Most Incidents" card in insights section
3. **Tooltip**: Hover over incident count for details

---

## 📚 Related Documentation

- [Race View Features](./core-features.md#race-view)
- [Results View Features](./core-features.md#results-view)
- [Statistical Calculations](../architecture/calculations.md)
- [Lap History Tracking](../architecture/lap-tracking.md)

---

## 📞 Support

**Questions or suggestions?**
- Open an issue on GitHub
- Contribute improvements via PR
- Discuss in community forums

**Found a bug?**
- Check incident detection thresholds
- Verify lap history data quality
- Report with sample session data

---

## 🎉 Credits

**Concept**: Inspired by motorsport telemetry systems  
**Implementation**: RaceFacer UI development team  
**Testing**: Community feedback and real-world race data

---

*Making karting analysis fun, one spin at a time!* 💥🏁

