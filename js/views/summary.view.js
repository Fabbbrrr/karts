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
        runs: sessionData?.runs?.length,
        mainDriver: state?.settings?.mainDriver 
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
    
    // Get main driver's data
    const mainDriverKart = state?.settings?.mainDriver;
    const mainDriverData = sessionData.runs.find(r => r.kart_number === mainDriverKart);
    
    // Update driver statistics
    updateDriverStats(elements, mainDriverData, state);
    
    // Update lap history for driver
    updateLapHistory(elements, mainDriverData, state);
    
    // Update position chart if available
    if (elements.positionChart && state.positionHistory && Object.keys(state.positionHistory).length > 0) {
        updatePositionChart(elements, sessionData, state.positionHistory);
    }
    
    // Update personal records if any
    updatePersonalRecords(elements, state);
    
    console.log('✅ Summary view updated');
}

/**
 * Update driver statistics cards
 * @param {Object} elements - DOM elements
 * @param {Object} driverData - Main driver's run data
 * @param {Object} state - Application state
 */
function updateDriverStats(elements, driverData, state) {
    // Update driver name
    const driverNameEl = document.getElementById('summary-driver-name');
    if (driverNameEl && driverData) {
        driverNameEl.textContent = `${driverData.name || 'Driver'} - Kart ${driverData.kart_number}`;
    }
    
    if (!driverData) {
        // Clear stats if no driver data
        document.getElementById('summary-best-lap').textContent = '--.-';
        document.getElementById('summary-avg-lap').textContent = '--.-';
        document.getElementById('summary-total-laps').textContent = '0';
        document.getElementById('summary-consistency').textContent = '-';
        document.getElementById('summary-final-pos').textContent = '-';
        document.getElementById('summary-pos-change').textContent = '-';
        return;
    }
    
    // Best lap
    const bestLapEl = document.getElementById('summary-best-lap');
    if (bestLapEl) {
        bestLapEl.textContent = driverData.best_time || '--.-';
    }
    
    // Average lap
    const avgLapEl = document.getElementById('summary-avg-lap');
    if (avgLapEl) {
        avgLapEl.textContent = driverData.avg_lap || '--.-';
    }
    
    // Total laps
    const totalLapsEl = document.getElementById('summary-total-laps');
    if (totalLapsEl) {
        totalLapsEl.textContent = driverData.total_laps || '0';
    }
    
    // Consistency
    const consistencyEl = document.getElementById('summary-consistency');
    if (consistencyEl) {
        if (driverData.consistency_lap_raw) {
            const consistency = (driverData.consistency_lap_raw / 1000).toFixed(3);
            consistencyEl.textContent = `${consistency}s σ`;
        } else {
            consistencyEl.textContent = driverData.consistency_lap || '-';
        }
    }
    
    // Final position
    const finalPosEl = document.getElementById('summary-final-pos');
    if (finalPosEl) {
        finalPosEl.textContent = `P${driverData.pos || '-'}`;
        finalPosEl.className = 'summary-stat-value';
        if (driverData.pos <= 3) {
            finalPosEl.classList.add(`p${driverData.pos}`);
        }
    }
    
    // Position change
    const posChangeEl = document.getElementById('summary-pos-change');
    if (posChangeEl && driverData.pos && state.startingPositions && state.startingPositions[driverData.kart_number]) {
        const startPos = state.startingPositions[driverData.kart_number];
        const posChange = startPos - driverData.pos;
        
        if (posChange > 0) {
            posChangeEl.textContent = `▲ ${posChange}`;
            posChangeEl.style.color = '#00ff88';
        } else if (posChange < 0) {
            posChangeEl.textContent = `▼ ${Math.abs(posChange)}`;
            posChangeEl.style.color = '#ff4444';
        } else {
            posChangeEl.textContent = '—';
            posChangeEl.style.color = '#888';
        }
    } else if (posChangeEl) {
        posChangeEl.textContent = '-';
        posChangeEl.style.color = '#888';
    }
}

/**
 * Update lap history list
 * @param {Object} elements - DOM elements
 * @param {Object} driverData - Main driver's run data
 * @param {Object} state - Application state
 */
function updateLapHistory(elements, driverData, state) {
    const lapListEl = document.getElementById('summary-lap-list');
    if (!lapListEl) return;
    
    if (!driverData || !state.lapHistory || !state.lapHistory[driverData.kart_number]) {
        lapListEl.innerHTML = '<p style="text-align: center; color: #888;">No lap data available</p>';
        return;
    }
    
    const laps = state.lapHistory[driverData.kart_number] || [];
    
    if (laps.length === 0) {
        lapListEl.innerHTML = '<p style="text-align: center; color: #888;">No laps completed yet</p>';
        return;
    }
    
    lapListEl.innerHTML = laps.map((lap, index) => {
        const deltaClass = lap.delta < 0 ? 'delta-faster' : lap.delta > 0 ? 'delta-slower' : 'delta-same';
        const deltaText = lap.delta === 0 ? '—' : (lap.delta > 0 ? '+' : '') + (lap.delta / 1000).toFixed(3);
        
        return `
            <div class="summary-lap-item">
                <div class="lap-number">Lap ${lap.lapNum}</div>
                <div class="lap-time">${lap.time}</div>
                <div class="lap-delta ${deltaClass}">${deltaText}s</div>
                <div class="lap-pos">P${lap.position}</div>
            </div>
        `;
    }).join('');
}

/**
 * Update personal records section
 * @param {Object} elements - DOM elements
 * @param {Object} state - Application state
 */
function updatePersonalRecords(elements, state) {
    const recordsEl = document.getElementById('summary-records');
    const recordsListEl = document.getElementById('summary-records-list');
    
    if (!recordsEl || !recordsListEl) return;
    
    // Check if there are new PBs in this session
    // This would need to be tracked during the session
    // For now, hide the records section
    recordsEl.classList.add('hidden');
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

