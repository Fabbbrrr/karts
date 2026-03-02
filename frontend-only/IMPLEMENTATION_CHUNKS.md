# Frontend-Only Implementation Chunks

## Chunk 1: WebSocket Service Verification ✅
**Status**: Already implemented

Verify the WebSocket service connects correctly:
```javascript
// Check js/websocket-service.js exists and has:
- Connection to wss://live.racefacer.com:3123
- Event handlers (onopen, onmessage, onclose)
- Reconnection logic
```

**Test**: Open browser console - should see "Connected" message.

---

## Chunk 2: Settings Panel UI
**Status**: Partially implemented in index.html

Add settings toggle button:
```html
<!-- In index.html navigation -->
<button id="settings-toggle" class="btn-settings">⚙️</button>
```

**File to modify**: `frontend-only/index.html` (add settings button)

---

## Chunk 3: Settings View Logic
**Status**: Needs implementation

Create `frontend-only/js/settings-view.js`:
```javascript
export function initSettings() {
    // Load saved preferences
    // Save new preferences on change
    // Update theme based on selection
}
```

**Test**: Change settings and verify they persist after page refresh.

---

## Chunk 4: Mobile Tab Navigation
**Status**: Partially implemented in index.html

Complete tab switching logic:
```javascript
// In js/main.js or app.main.js
function switchTab(tabId) {
    // Hide all tabs
    // Show selected tab
    // Update navigation state
}
```

**Test**: Navigate between Race, Compare, History, Settings tabs.

---

## Chunk 5: State Management Enhancement
**Status**: Partially implemented in core/state.js

Add automatic session saving:
```javascript
// In core/state.js
export function autoSaveSession() {
    // Save current session to IndexedDB
    // Run every X laps or on lap completion
}
```

**Test**: Complete a race session and verify it saves to storage.

---

## Chunk 6: HUD Component Enhancement
**Status**: Partially implemented in index.html

Add mobile-optimized HUD:
```html
<!-- Simplified HUD for steering wheel mounting -->
<div class="hud-mobile-mode">
    <div class="hud-primary-metrics">Lap Time | Gap | Position</div>
</div>
```

**Test**: View on mobile device in portrait orientation.

---

## Chunk 7: Export/Import Functionality
**Status**: Storage service has the logic

Add UI buttons:
```html
<button id="export-btn">Export Data (JSON)</button>
<input type="file" id="import-input" accept=".json">
```

**Test**: Export data, delete session, import backup.

---

## Chunk 8: Mobile CSS Optimization
**Status**: Needs implementation

Add `frontend-only/css/mobile-optimized.css`:
```css
/* For steering wheel mounting (portrait mode) */
@media screen and (orientation: portrait) {
    .race-grid { grid-template-columns: 1fr; }
    .metric { font-size: 2rem; }
}
```

**Test**: View on mobile device - metrics should be large and readable.

---

## Chunk 9: GitHub Pages Deployment Files
**Status**: Needs implementation

Create required files:
- `.nojekyll` (disable Jekyll)
- `manifest.json` (for PWA functionality)
- `sw.js` (service worker for offline mode - optional)

---

## Chunk 10: Testing & Validation
**Status**: Needs implementation

Test checklist:
- [ ] WebSocket connection works
- [ ] Settings persist across reloads
- [ ] Tab navigation smooth
- [ ] Data saves to IndexedDB
- [ ] Mobile layout works on portrait mode
- [ ] Export/import functions work

---

## Implementation Priority Order

1. **Chunk 1**: Verify WebSocket (already done) ✅
2. **Chunk 3**: Settings View Logic
3. **Chunk 4**: Tab Navigation
4. **Chunk 5**: State Management Enhancement
5. **Chunk 6**: HUD Mobile Optimization
6. **Chunk 7**: Export/Import UI
7. **Chunk 8**: Mobile CSS
8. **Chunk 9**: GitHub Pages Files
9. **Chunk 10**: Testing

---

## How to Test Each Chunk

### WebSocket (Chunk 1)
```javascript
// Open browser console, should see:
"WebSocket connected to wss://live.racefacer.com:3123"
```

### Settings (Chunks 2-3)
```javascript
// Change settings → reload page → verify settings persist
```

### Mobile Layout (Chunk 8)
```bash
# Test in Chrome DevTools:
F12 → Toggle Device Toolbar → Select iPhone/Mobile device
Rotate to portrait mode
```

---

## Estimated File Changes per Chunk

| Chunk | Files Modified | Lines Changed |
|-------|---------------|---------------|
| 1     | Verify only   | N/A           |
| 2     | index.html    | ~20 lines     |
| 3     | settings-view.js (new) | ~50 lines |
| 4     | app.main.js   | ~30 lines     |
| 5     | core/state.js | ~40 lines     |
| 6     | index.html    | ~25 lines     |
| 7     | index.html + storage.service.js | ~30 lines |
| 8     | mobile.css (new) | ~100 lines |
| 9     | .nojekyll, manifest.json | ~30 lines |
| 10    | Test files    | N/A           |

---

## Next Action Items

**Immediate**: Start with Chunk 2 - Settings Panel UI
1. Add settings toggle button to navigation
2. Create basic settings modal
3. Connect to existing storage service

**Small, manageable chunks ensure you can test each piece independently before deploying to GitHub Pages!