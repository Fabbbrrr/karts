// Karting Live Timer - Summary View
// Session summary with charts and final results

import { formatTime } from '../utils/time-formatter.js';
import { filterStaleDrivers, TIMESTAMP_THRESHOLDS } from '../utils/timestamp-filter.js';

/**
 * Update summary view with session results
 * @param {Object} elements - DOM elements
 * @param {Object} sessionData - Current session data
 * @param {Object} state - Application state
 */
export function updateSummaryView(elements, sessionData, state) {
    if (!sessionData) return;
    
    // Update final positions
    updateFinalPositions(elements, sessionData, state);
    
    // Update fastest lap
    updateFastestLap(elements, state.sessionBest);
    
    // Update position chart if available
    if (elements.positionChart && Object.keys(state.positionHistory).length > 0) {
        updatePositionChart(elements, sessionData, state.positionHistory);
    }
}

/**
 * Update final positions table
 * @param {Object} elements - DOM elements
 * @param {Object} sessionData - Current session data
 * @param {Object} state - Application state
 */
function updateFinalPositions(elements, sessionData, state) {
    if (!elements.summaryPositionsList) return;
    
    const runs = [...sessionData.runs].sort((a, b) => a.pos - b.pos);
    
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

