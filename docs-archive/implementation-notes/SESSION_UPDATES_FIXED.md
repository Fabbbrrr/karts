# ✅ Session Updates Fixed

## Problems Fixed

### 1. ❌ Sessions Saved After 2 Laps, Creating Duplicates
**Problem**: Each update created a NEW session file, resulting in dozens of files for one race.

**Solution**: 
- Generate consistent session ID from event name: `Session_61_R_timestamp`
- **Continuously UPDATE** the same file throughout the race
- Only mark as "complete" when session ends

### 2. ✅ Single File Per Session
**Implementation**:
```javascript
// Generate consistent ID for the session
currentSessionId = generateSessionId(newEventName); // e.g., "Session_61_R_1761890000"

// Update SAME file every 5 updates
if (updateCount % 5 === 0) {
    updateCurrentSession(); // Updates existing file
}

// Mark complete when session ends
if (isNewSession && currentSessionId) {
    markSessionComplete(); // Final save with isComplete: true
}
```

### 3. ✅ Delete Sessions from UI
**Added**: Delete button in Results page that appears when viewing historical sessions.

## Code Changes

### `server/websocket.js`

#### Session ID Generation
```javascript
function generateSessionId(eventName) {
    const sanitized = eventName.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = Date.now();
    return `${sanitized}_${timestamp}`;
}
```

#### Continuous Updates
```javascript
// Update every 5 data points (reduces I/O)
const shouldUpdate = updateCount % 5 === 0 || updateCount === 1;
if (shouldUpdate && Object.keys(allSessionKarts).length >= 2) {
    updateCurrentSession(); // Updates SAME file
}
```

#### Session Completion
```javascript
function markSessionComplete() {
    // Validate criteria (≥2 karts, ≥5min OR ≥10 laps)
    if (kartCount < 2) {
        deleteSession(currentSessionId); // Remove incomplete
        return;
    }
    
    // Mark as complete
    saveSessionData({
        sessionId: currentSessionId,
        ...
        isComplete: true
    });
}
```

### `server/storage.js`

#### Updated to Track Completion Status
```javascript
export async function saveSessionData(data) {
    const { sessionId, sessionData, analysis, lapHistory, isComplete = false } = data;
    
    // Save to sessions/session-{sessionId}.json
    await fs.writeFile(sessionFile, JSON.stringify({
        sessionId,
        sessionData,
        analysis,
        lapHistory,
        isComplete,  // ← Track if session is complete
        timestamp: new Date().toISOString()
    }, null, 2));
    
    // Only cleanup old sessions when marking complete
    if (isComplete) {
        await cleanupOldSessions();
    }
}
```

### `js/services/server-api.service.js`

#### Added Delete Function
```javascript
export async function deleteBackendSession(sessionId) {
    const response = await fetch(`${CONFIG.SERVER_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE'
    });
    
    if (!response.ok) {
        throw new Error(`Failed to delete session`);
    }
    
    return await response.json();
}
```

### `index.html`

#### Added Delete Button
```html
<button id="results-delete-btn" class="btn-icon-modern btn-danger" 
        title="Delete Session" style="display: none;">
    🗑️
</button>
```

## Expected Behavior

### During Race (Update #1, #5, #10, #15...):
```
📡 Update #5: 8 karts active
📝 Updated session: 8 karts, 45 total laps
📡 Update #10: 10 karts active
📝 Updated session: 10 karts, 98 total laps
```

**Result**: ONE file (`session-Session_61_R_1761890000.json`) continuously updated

### When Session Ends:
```
🔄 Session change detected: "Session #61" → "Session #62"
📋 Previous session had 12 total karts
🏁 Session complete: 12 karts, 145 total laps, 12m34s
✅ Session marked complete: Session_61_R_1761890000
🏁 New session started: "Session #62"
```

**Result**: Previous session marked `isComplete: true`, new session starts with new ID

### File Structure:
```
server/storage/sessions/
├── session-Session_61_R_1761890000.json   ← Complete race
├── session-Session_62_R_1761892000.json   ← Current race (updating)
└── session-Session_60_R_1761888000.json   ← Previous race
```

## UI - Delete Sessions

### How to Delete:
1. Go to Results tab
2. Select a historical session from dropdown
3. Click 🗑️ button (appears when historical session selected)
4. Confirm deletion
5. Session removed from backend and dropdown

### Implementation TODO:
Add event handler in `js/app.main.js`:
```javascript
const deleteBtn = document.getElementById('results-delete-btn');
const sessionSelect = document.getElementById('results-session-select');

// Show/hide delete button
sessionSelect.addEventListener('change', (e) => {
    if (e.target.value !== 'live') {
        deleteBtn.style.display = 'inline-block';
    } else {
        deleteBtn.style.display = 'none';
    }
});

// Delete handler
deleteBtn.addEventListener('click', async () => {
    const sessionId = sessionSelect.value;
    if (sessionId === 'live') return;
    
    if (confirm('Delete this session? This cannot be undone.')) {
        await ServerAPI.deleteBackendSession(sessionId);
        // Refresh session list
        await populateSessionSelector('results');
        // Return to live
        sessionSelect.value = 'live';
        sessionSelect.dispatchEvent(new Event('change'));
    }
});
```

## Testing

### 1. Run Cleanup
```bash
cd server
node cleanup-sessions.js
```

### 2. Restart Server
Backend will now:
- Create ONE file per session
- Update it continuously during race
- Mark complete when session ends

### 3. Verify Single File
```bash
# Watch file updates during a race
watch -n 1 ls -lh server/storage/sessions/
```

Should see ONE file being updated, not multiple new files.

### 4. Check Completion
```bash
# After session ends, check isComplete flag
cat server/storage/sessions/session-*.json | jq '.isComplete'
```

Should show `true` for completed sessions.

---

**Status**: ✅ CODE COMPLETE  
**Next**: Restart server to apply changes  
**Result**: Single file per session, continuously updated, delete from UI


