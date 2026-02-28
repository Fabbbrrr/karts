# Data Capture & Analysis

## Quick Start

Run the capture script to collect real WebSocket data:

```bash
cd server
node data-capture.js 30  # Capture for 30 minutes (default)
```

Or run it in the background:

```bash
node data-capture.js 60 > capture.log 2>&1 &
```

## What It Does

The script:
1. **Connects** to RaceFacer WebSocket
2. **Logs** all incoming data with timestamps
3. **Detects**:
   - Event name changes (session boundaries)
   - Track configuration changes (parallel tracks)
   - Kart appearances/disappearances
   - Update frequency and patterns
4. **Saves**:
   - `data-capture-[timestamp].json` - Raw data
   - `analysis-[timestamp].txt` - Analysis report

## Output Location

```
server/storage/capture/
├── data-capture-2024-11-01T14-30-00.json
└── analysis-2024-11-01T14-30-00.txt
```

## What to Look For

### Session Boundaries
- When does `event_name` change?
- When does `track_configuration_id` change?
- Are they synchronized?

### Parallel Sessions
- Do multiple `track_configuration_id` values appear?
- Do they alternate or run simultaneously?

### Kart Lifecycle
- When do karts first appear?
- When do they disappear?
- Do they reappear later?

### Data Patterns
- How frequently do updates arrive?
- What data is present/missing?
- Are there time gaps indicating session ends?

## Next Steps

After capturing data:

1. **Review the analysis report** in `analysis-[timestamp].txt`
2. **Examine the raw JSON** to see actual data structure
3. **Identify patterns** for:
   - Session detection
   - Track separation
   - Kart tracking
4. **Reimplement** `server/websocket.js` based on findings

## Example Analysis Output

```
═══════════════════════════════════════════════════════════
📊 DATA CAPTURE ANALYSIS
═══════════════════════════════════════════════════════════

⏱️  TIMING
   Duration: 1800s (30.00 minutes)
   Total Updates: 360
   Update Frequency: 0.20 updates/sec
   Avg Gap Between Updates: 5000ms

🏁 EVENTS & TRACKS
   Unique Event Names: 2
      - Session 1
      - Session 2
   
   Unique Track Configs: 2
      - 123
      - 456

🔄 EVENT NAME CHANGES
   1. Update #180 at 2024-11-01T15:00:00.000Z
      "Session 1" → "Session 2"

💡 RECOMMENDATIONS

⚠️  MULTIPLE TRACK CONFIGS DETECTED
   → Sessions MUST be separated by track_configuration_id
   → Each track config should have its own session store
   → Kart analysis should filter by track config
```

## Tips

- Run during **peak hours** to capture parallel sessions
- Run for **at least 30 minutes** to see full session cycles
- **Stop/start** multiple times to capture different scenarios
- Look for **patterns** in the raw JSON data


