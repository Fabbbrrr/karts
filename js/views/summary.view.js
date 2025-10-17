// Karting Live Timer - Summary View
// Session summary with charts and final results

import { formatTime } from '../utils/time-formatter.js';
import { filterStaleDrivers, TIMESTAMP_THRESHOLDS } from '../utils/timestamp-filter.js';
import * as SessionHistoryService from '../services/session-history.service.js';

/**
 * Update summary view with session results
 * @param {Object} elements - DOM elements
 * @param {Object} sessionData - Current session data
 * @param {Object} state - Application state
 */
export function updateSummaryView(elements, sessionData, state) {
    console.log('📈 updateSummaryView called:', { 
        sessionData: !!sessionData, 
        runs: sessionData?.runs?.length 
    });
    
    // Populate session selector
    populateSessionSelector('summary');
    
    if (!sessionData || !sessionData.runs || sessionData.runs.length === 0) {
        console.warn('⚠️ No session data for summary');
        const noData = document.getElementById('summary-no-data');
        const content = document.getElementById('summary-content');
        if (noData) noData.classList.remove('hidden');
        if (content) content.classList.add('hidden');
        return;
    }
    
    // Show content, hide placeholder
    const noData = document.getElementById('summary-no-data');
    const content = document.getElementById('summary-content');
    if (noData) noData.classList.add('hidden');
    if (content) content.classList.remove('hidden');
    
    // Update final positions
    updateFinalPositions(elements, sessionData, state);
    
    // Update fastest lap
    updateFastestLap(elements, state.sessionBest);
    
    // Update position chart if available
    if (elements.positionChart && Object.keys(state.positionHistory).length > 0) {
        updatePositionChart(elements, sessionData, state.positionHistory);
    }
    
    console.log('✅ Summary view updated');
}

/**
 * Update final positions table
 * @param {Object} elements - DOM elements
 * @param {Object} sessionData - Current session data
 * @param {Object} state - Application state
 */
function updateFinalPositions(elements, sessionData, state) {
    if (!elements.summaryPositionsList) return;
    
    // Filter out stale drivers from final positions
    const activeRuns = filterStaleDrivers(sessionData.runs, TIMESTAMP_THRESHOLDS.SUMMARY_DISPLAY, false);
    const runs = [...activeRuns].sort((a, b) => a.pos - b.pos);
    
    elements.summaryPositionsList.innerHTML = runs.map(run => {
        const posClass = run.pos <= 3 ? `p${run.pos}` : '';
        const isMainDriver = state.settings.mainDriver === run.kart_number;
        
        return `
            <div class="summary-position-item ${isMainDriver ? 'main-driver' : ''}">
                <div class="summary-pos ${posClass}">P${run.pos}</div>
                <div class="summary-driver">
                    <div class="summary-kart">Kart ${run.kart_number}</div>
                    <div class="summary-name">${run.name}</div>
                </div>
                <div class="summary-best-time">${run.best_time}</div>
                <div class="summary-laps">${run.total_laps} laps</div>
            </div>
        `;
    }).join('');
}

/**
 * Update fastest lap display
 * @param {Object} elements - DOM elements
 * @param {Object} sessionBest - Session best lap
 */
function updateFastestLap(elements, sessionBest) {
    const fastestLapEl = elements.summaryFastestLap;
    if (!fastestLapEl || !sessionBest) return;
    
    fastestLapEl.innerHTML = `
        <div class="summary-fastest-lap">
            <div class="fastest-lap-label">Fastest Lap</div>
            <div class="fastest-lap-time">${sessionBest.time}</div>
            <div class="fastest-lap-driver">Kart ${sessionBest.kartNumber} - ${sessionBest.name}</div>
        </div>
    `;
}

/**
 * Update position chart visualization
 * @param {Object} elements - DOM elements
 * @param {Object} sessionData - Current session data
 * @param {Object} positionHistory - Position history for all drivers
 */
function updatePositionChart(elements, sessionData, positionHistory) {
    // This would contain chart rendering logic
    // For now, just a placeholder
    console.log('Position chart update', positionHistory);
}

/**
 * Populate session selector dropdown with saved sessions
 * 
 * PURPOSE: Fill dropdown with available historical sessions
 * WHY: Let users select past sessions to view
 * HOW: Load from SessionHistoryService and create options
 * FEATURE: Session History
 * 
 * @param {string} tab - Which tab's selector to populate ("results" or "summary")
 * @returns {void}
 */
function populateSessionSelector(tab) {
    const selector = document.getElementById(`${tab}-session-select`);
    if (!selector) return;
    
    // Check if already populated (avoid re-populating on every update)
    if (selector.dataset.populated === 'true') return;
    
    // Get saved sessions
    const sessions = SessionHistoryService.getSessionHistory();
    
    // Clear existing options except "Live"
    selector.innerHTML = '<option value="live">🔴 Live Session (Current)</option>';
    
    if (sessions.length > 0) {
        // Add separator
        const separator = document.createElement('option');
        separator.disabled = true;
        separator.textContent = '─────────────';
        selector.appendChild(separator);
        
        // Add session options
        sessions.forEach(session => {
            const option = document.createElement('option');
            option.value = session.sessionId;
            option.textContent = SessionHistoryService.getSessionLabel(session);
            selector.appendChild(option);
        });
        
        console.log(`📂 Populated ${tab} selector with ${sessions.length} sessions`);
    }
    
    // Mark as populated
    selector.dataset.populated = 'true';
}

