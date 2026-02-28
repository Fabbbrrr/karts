# Advanced Kart Performance Analysis

## Overview

The Advanced Kart Performance Analysis is a sophisticated racing analytics system that helps identify underperforming karts across multiple sessions, drivers, and tracks. It uses racing industry best practices to provide actionable insights into kart performance.

## Key Features

### 1. **Track-Specific Baselines**
- Calculates performance baselines for each track (Lakeside, Penrite, Mushroom, Rimo)
- Uses percentile-based metrics (resistant to outliers)
- Tracks: fastest, median, p10, p25, p75, p90, mean, standard deviation

### 2. **Performance Index**
- Compares each kart's median lap time to track baseline
- **< 1.0** = Faster than median (good)
- **> 1.0** = Slower than median (underperforming)
- Normalized for fair comparison across different track layouts

### 3. **Consistency Rating**
- Uses Coefficient of Variation (CV) = (stdDev / mean) × 100
- **Excellent**: < 2% variation
- **Good**: 2-4% variation
- **Average**: 4-6% variation
- **Poor**: 6-10% variation
- **Very Poor**: > 10% variation

### 4. **Overall Rating (A+ to F)**
Combines three factors:
- **Performance** (0-60 points): Speed compared to baseline
- **Consistency** (0-30 points): Lap time variation
- **Sample Size** (0-10 points): Confidence based on lap count

### 5. **Issue Flagging**
Automatically identifies:
- **Severely Underperforming**: Median > p90 (slower than 90% of karts)
- **Underperforming**: Median > p75 (bottom 25%)
- **Very Inconsistent**: CV > 10% (possible mechanical issues)
- **Inconsistent**: CV > 6%
- **Low Sample Size**: < 5 laps (insufficient data)

### 6. **Cross-Driver Analysis**
- Compares same kart with different drivers
- Isolates kart performance from driver skill
- Identifies karts with high performance variation
- **Consistent Kart**: < 2% variation between drivers
- **Normal Variation**: 2-5% variation
- **High Variation**: > 5% (check kart)

## How It Works

### Data Flow

```
kartAnalysisData (app format)
  {
    laps: [{kartId, lapTimeRaw, driverName, ...}],
    karts: {kartId: {drivers, totalLaps, ...}}
  }
            ↓
transformKartDataForAdvancedAnalysis()
            ↓
  {
    kartId: {
      laps: [{timeRaw, driver, timestamp}],
      kartNumber, trackName, drivers
    }
  }
            ↓
analyzeKartPerformance()
            ↓
  {
    kartPerformance: [...],
    trackBaselines: {...},
    underperformers: [...],
    topPerformers: [...],
    crossDriverComparison: [...]
  }
```

### Analysis Steps

1. **Group Laps by Track**
   - Split all laps by track (Lakeside, Penrite, Mushroom, Rimo)
   - Track detection based on kart name prefix

2. **Calculate Track Baselines**
   - Requires minimum 10 laps per track
   - Calculates percentiles, mean, standard deviation
   - Creates performance benchmarks

3. **Analyze Each Kart**
   - Minimum 3 laps required
   - Calculates median, mean, best, worst
   - Compares to track baseline
   - Assigns performance index and ratings

4. **Identify Outliers**
   - Top 10 underperformers (performance index > 1.03)
   - Top 10 top performers (performance index < 0.97)
   - Excludes low-confidence results

5. **Cross-Driver Comparison**
   - Groups sessions by kart number and track
   - Calculates variation between drivers
   - Flags high-variation karts

## Usage

### Accessing the Analysis

1. Navigate to the **Analysis** tab
2. Click the **🔬 Run Advanced Analysis** button
3. Wait for analysis to complete (typically 1-2 seconds)

### Reading the Report

The terminal-style report includes:

#### Summary Section
```
📊 SUMMARY
────────────────────────────────────────────────────────────────
Total Karts Analyzed: 45
Total Laps Collected: 1,234
Tracks Analyzed: 4
Underperforming Karts: 8
Top Performing Karts: 7
```

#### Underperforming Karts
```
🚨 UNDERPERFORMING KARTS (Require Attention)
────────────────────────────────────────────────────────────────
1. Kart P63 (Penrite)
   Rating: D | Performance Index: 1.058
   🔴 Underperforming
   ⚠️ Inconsistent Performance
   Consistency: Poor (7.3%)
   Laps: 24 | Confidence: High
```

#### Top Performers
```
🏆 TOP PERFORMING KARTS
────────────────────────────────────────────────────────────────
1. Kart 16 (Lakeside)
   Rating: A+ | Performance Index: 0.952
   Consistency: Excellent (1.8%)
   Best Lap: 31.245s | Median: 31.567s
```

#### Cross-Driver Analysis
```
🔄 CROSS-DRIVER ANALYSIS (Same Kart, Different Drivers)
────────────────────────────────────────────────────────────────
Kart P44 (Penrite) - High Variation - Check Kart
   3 sessions by 3 drivers
   Variation: 6.2% (2.134s)
   Fastest: John Smith (32.456s)
   Slowest: Jane Doe (34.590s)
```

## Interpreting Results

### Performance Index
- **0.95-0.97**: Exceptional kart, slightly faster than average
- **0.97-0.99**: Excellent kart
- **0.99-1.01**: Good kart, within normal range
- **1.01-1.03**: Average, slightly slower
- **1.03-1.05**: Below average, monitor
- **> 1.05**: Poor, requires attention

### Consistency (Coefficient of Variation)
- **< 2%**: Kart is very consistent, likely mechanically sound
- **2-4%**: Normal variation, good condition
- **4-6%**: Acceptable but monitor
- **6-10%**: High variation, possible issues (tire pressure, alignment, engine)
- **> 10%**: Very high variation, likely mechanical problems

### Confidence Levels
- **Very High**: 30+ laps (highly reliable)
- **High**: 20-29 laps (reliable)
- **Medium**: 10-19 laps (moderate confidence)
- **Low**: 5-9 laps (limited confidence)
- **Very Low**: < 5 laps (insufficient data)

## Maintenance Actions

### For Underperforming Karts (Performance Index > 1.03)
1. Check tire pressure and tread wear
2. Inspect brake system (dragging brakes slow karts)
3. Check wheel alignment
4. Verify engine tuning and carburetor settings
5. Inspect for loose or damaged components
6. Check fuel quality

### For Inconsistent Karts (CV > 6%)
1. Check tire pressure (most common cause)
2. Inspect suspension components
3. Check for loose seat or steering column
4. Verify chain tension
5. Check brake consistency
6. Inspect engine mounts

### For High Cross-Driver Variation (> 5%)
1. First verify driver skill levels are comparable
2. If variation persists with skilled drivers, check:
   - Steering responsiveness
   - Brake pedal feel and consistency
   - Throttle response
   - Seat comfort and position

## Technical Details

### Track Detection
Based on kart name prefix:
- **M** prefix (e.g., M01) → Mushroom (Mini karts)
- **P** prefix (e.g., P63) → Penrite (Sprint karts)
- **E** prefix (e.g., E09) → Rimo (Rookie kids)
- **Numeric** (e.g., 16) → Lakeside (Super karts)

### Statistical Methods
- **Percentile Calculation**: Linear interpolation between data points
- **Standard Deviation**: Population standard deviation (not sample)
- **Median**: 50th percentile (resistant to outliers)
- **Mean**: Simple arithmetic mean
- **Coefficient of Variation**: (stdDev / mean) × 100

### Minimum Requirements
- **Track Baseline**: 10+ laps per track
- **Kart Analysis**: 3+ laps per kart
- **Outlier Detection**: Medium confidence or higher
- **Cross-Driver**: 2+ sessions by different drivers

## Data Persistence

The analysis uses the existing `kartAnalysisData` structure:
- Stored in browser localStorage
- Accumulates across multiple sessions
- Can be exported/imported via Analysis tab
- Automatically excludes laps > 60 seconds
- Filters out mock/test data

## Report Features

### Interactive Controls
- **📺 Fullscreen**: View report in fullscreen mode
- **📋 Copy Report**: Copy entire report to clipboard
- **Collapsible**: Report can be scrolled independently

### Report Styling
- Terminal-style green text on black background
- Monospace font for data alignment
- Color-coded severity indicators:
  - 🔴 Critical issues
  - ⚠️ Warnings
  - ✅ Good/High confidence
  - 🏆 Top performers
  - 🚨 Underperformers

## Future Enhancements (Potential)

1. **Trend Analysis**: Track kart performance over time
2. **Predictive Maintenance**: Predict failures before they occur
3. **Driver Skill Normalization**: More sophisticated driver skill adjustment
4. **Track Condition Adjustment**: Account for weather, temperature
5. **Lap-by-Lap Degradation**: Identify tire wear patterns
6. **Comparative Reports**: Compare performance across date ranges
7. **Export to PDF/CSV**: Generate professional reports
8. **Alert System**: Automatic notifications for critical issues

## Troubleshooting

### "No data to analyze"
- Ensure you have collected at least 10 laps across multiple karts
- Check that lap times are reasonable (< 60 seconds)
- Verify data is not filtered out as mock data

### "Low confidence" warnings
- More laps needed for reliable analysis
- Aim for 20+ laps per kart for high confidence

### Inconsistent results
- Ensure multiple drivers have driven each kart for cross-driver analysis
- Verify track conditions were consistent across sessions
- Check that time synchronization is accurate

## Best Practices

1. **Collect Sufficient Data**: Aim for 20+ laps per kart
2. **Regular Analysis**: Run weekly to catch issues early
3. **Track Maintenance**: Document actions taken on flagged karts
4. **Driver Feedback**: Cross-reference with driver complaints
5. **Baseline Updates**: Re-run after major track changes
6. **Compare Periods**: Export reports to track improvements

## Credits

Analysis methodology based on:
- Motorsport lap time analysis standards
- Statistical process control (SPC) principles
- Racing industry best practices for kart fleet management

---

**Note**: This analysis is a tool to assist maintenance decisions. Always combine data insights with physical inspection and mechanic expertise.




