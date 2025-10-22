# Analysis Page: Display Kart ID and Number

## Update Summary

Added both `kart_id` and `kart_number` columns to the Analysis page table to help identify duplicates and verify proper kart tracking.

## Changes Made

### 1. Table Header (`index.html`)

**Before:**
```html
<th>Rank</th>
<th>Kart #</th>
<th>Avg Lap</th>
...
```

**After:**
```html
<th>Rank</th>
<th>Kart ID</th>    <!-- NEW: Shows kart_id -->
<th>Kart #</th>     <!-- Display number -->
<th>Avg Lap</th>
...
```

### 2. Table Row Rendering (`js/views/analysis.view.js`)

Now displays both values:
```javascript
<td class="kart-id ${renumberedClass}">${kart.kartId}</td>
<td class="kart-number">#${kart.kartNumber}</td>
```

**Special highlighting:** If `kartId !== kartNumber`, adds yellow warning indicator to show kart was renumbered.

### 3. Details Modal

Modal header now shows both when different:
```
Kart #14 (ID: 154)  // If renumbered
Kart #14            // If same
```

### 4. Visual Styling (`styles.css`)

Added styles for kart ID column:
```css
.kart-id {
    font-family: monospace;
    font-size: 0.9rem;
    color: #888;
}

/* Highlight renumbered karts */
.kart-id.renumbered {
    color: #ffaa00 !important;
    font-weight: bold;
}

.kart-id.renumbered::after {
    content: '⚠';
    margin-left: 4px;
}
```

## How to Identify Duplicates

### Scenario 1: Same Physical Kart (Correct)
```
Kart ID  | Kart #  | Result
---------|---------|--------
154      | 14      | ✅ Normal
154      | 14      | ✅ Same kart tracked correctly
```

### Scenario 2: Renumbered Kart (Correct - Will Show Warning)
```
Kart ID  | Kart #  | Result
---------|---------|--------
154⚠     | 22      | ⚠️ Renumbered (yellow highlight)
```
- Yellow text + warning icon means kart ID ≠ display number
- This is **correct behavior** - same physical kart, new number
- System tracks it as one kart under ID 154

### Scenario 3: Duplicate Entry (ERROR - Should Not Happen)
```
Kart ID  | Kart #  | Result
---------|---------|--------
154      | 14      | ❌ DUPLICATE!
154      | 14      | ❌ Same entry twice
```
If you see identical IDs listed separately, this indicates a bug in the tracking system.

### Scenario 4: Different Karts with Same Number (Possible)
```
Kart ID  | Kart #  | Result
---------|---------|--------
154      | 14      | ✅ Physical kart A
140      | 14      | ⚠️ Physical kart B with same number
```
- Both showing #14 but different IDs
- Indicates two different physical karts assigned the same display number
- This shouldn't happen in normal operation but system handles it correctly

## Benefits

1. **Verify System Works**: Easily see if karts are tracked by ID correctly
2. **Spot Duplicates**: Identical IDs appearing multiple times = bug
3. **Track Renumbering**: Warning icon shows when karts get new numbers
4. **Audit Trail**: Full visibility into kart identification

## Visual Guide

```
┌──────┬──────────┬─────────┬──────────┐
│ Rank │ Kart ID  │ Kart #  │ Avg Lap  │
├──────┼──────────┼─────────┼──────────┤
│  1   │ 154      │ #14     │ 26.521   │  ← Normal
│  2   │ 137      │ #05     │ 27.839   │  ← Normal
│  3   │ 154⚠     │ #22     │ 26.521   │  ← Renumbered (yellow)
└──────┴──────────┴─────────┴──────────┘
```

The third row shows a renumbered kart - same physical kart (ID 154) now displayed as #22.

## Testing

To verify everything works:

1. **Check Normal Karts**: Most rows should have matching ID and number (e.g., ID=154, #=14)
2. **Check for Duplicates**: Look for duplicate IDs - there should be **zero**
3. **Check Renumbered**: If track renumbers karts, you'll see warning ⚠️ indicators
4. **Click Details**: Modal shows full ID/number info for verification

## Notes

- Kart ID is stored internally for all new laps
- Display number updates automatically if kart is renumbered
- System maintains single entry per physical kart (by ID)
- Old data without kart_id falls back to kart_number for compatibility



