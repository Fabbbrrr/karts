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
    const canvas = document.getElementById('position-chart');
    if (!canvas) {
        console.warn('Position chart canvas not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Check if we have data
    if (!positionHistory || Object.keys(positionHistory).length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No position data available yet', width / 2, height / 2);
        return;
    }
    
    // Prepare data: convert position history to chartable format
    const kartNumbers = Object.keys(positionHistory).sort();
    const maxLaps = Math.max(...kartNumbers.map(k => positionHistory[k].length));
    
    if (maxLaps === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Not enough lap data yet', width / 2, height / 2);
        return;
    }
    
    // Chart dimensions
    const padding = { top: 40, right: 100, bottom: 50, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const maxPosition = Math.max(...kartNumbers.map(k => 
        Math.max(...positionHistory[k].map(p => p.position || 0))
    ));
    
    // Calculate scales
    const xScale = chartWidth / Math.max(1, maxLaps - 1);
    const yScale = chartHeight / Math.max(1, maxPosition);
    
    // Color palette for karts (vibrant colors)
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
        '#FF8FAB', '#00D9FF', '#FFB347', '#7FCDCD', '#EA8685'
    ];
    
    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    for (let i = 0; i <= maxPosition; i++) {
        const y = padding.top + i * yScale;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();
        
        // Position labels (P1, P2, etc.)
        ctx.fillStyle = '#999';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`P${i + 1}`, padding.left - 10, y + 4);
    }
    
    // Draw lap labels on x-axis
    ctx.fillStyle = '#999';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    for (let lap = 1; lap <= maxLaps; lap++) {
        const x = padding.left + (lap - 1) * xScale;
        if (lap === 1 || lap === maxLaps || lap % 5 === 0) {
            ctx.fillText(`L${lap}`, x, height - padding.bottom + 20);
        }
    }
    
    // Reset line dash
    ctx.setLineDash([]);
    
    // Draw position lines for each kart
    kartNumbers.forEach((kartNumber, index) => {
        const positions = positionHistory[kartNumber];
        if (positions.length === 0) return;
        
        const color = colors[index % colors.length];
        
        // Draw line
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowColor = color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        
        positions.forEach((pos, lapIndex) => {
            const x = padding.left + lapIndex * xScale;
            const y = padding.top + (pos.position - 1) * yScale;
            
            if (lapIndex === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Draw dots at each position change
        positions.forEach((pos, lapIndex) => {
            const x = padding.left + lapIndex * xScale;
            const y = padding.top + (pos.position - 1) * yScale;
            
            // Check if position changed from previous lap
            const posChanged = lapIndex > 0 && positions[lapIndex - 1].position !== pos.position;
            
            if (posChanged || lapIndex === 0 || lapIndex === positions.length - 1) {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, posChanged ? 6 : 4, 0, Math.PI * 2);
                ctx.fill();
                
                // Add white border for visibility
                ctx.strokeStyle = '#1a1a1a';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
        
        // Draw kart label at the end
        const lastPos = positions[positions.length - 1];
        const lastX = padding.left + (positions.length - 1) * xScale;
        const lastY = padding.top + (lastPos.position - 1) * yScale;
        
        ctx.fillStyle = color;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`#${kartNumber}`, lastX + 10, lastY + 4);
    });
    
    // Draw title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Position Battle Throughout Session', width / 2, 25);
    
    // Update legend
    updatePositionChartLegend(kartNumbers, colors, sessionData);
}

/**
 * Update position chart legend with driver info
 * @param {Array} kartNumbers - Array of kart numbers
 * @param {Array} colors - Array of colors for each kart
 * @param {Object} sessionData - Session data with driver names
 */
function updatePositionChartLegend(kartNumbers, colors, sessionData) {
    const legendEl = document.getElementById('position-chart-legend');
    if (!legendEl) return;
    
    legendEl.innerHTML = kartNumbers.map((kartNumber, index) => {
        const driverData = sessionData.runs.find(r => r.kart_number === kartNumber);
        const driverName = driverData ? driverData.name : 'Unknown';
        const color = colors[index % colors.length];
        
        return `
            <div class="legend-item" style="display: inline-flex; align-items: center; margin: 8px 12px;">
                <div style="width: 20px; height: 3px; background: ${color}; margin-right: 6px; box-shadow: 0 0 5px ${color};"></div>
                <span style="color: ${color}; font-weight: bold;">#${kartNumber}</span>
                <span style="color: #999; margin-left: 4px; font-size: 0.9rem;">${driverName}</span>
            </div>
        `;
    }).join('');
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

