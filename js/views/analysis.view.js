// Karting Live Timer - Analysis View
// Kart performance analysis with rankings and statistics

import { formatTime } from '../utils/time-formatter.js';
import * as AnalysisService from '../services/analysis.service.js';

/**
 * Update the analysis view with kart rankings
 * @param {Object} elements - DOM elements
 * @param {Object} kartAnalysisData - Kart analysis data
 */
export function updateAnalysisView(elements, kartAnalysisData) {
    if (!elements.analysisScreen) return;
    
    const totalLaps = kartAnalysisData.laps?.length || 0;
    const kartCount = Object.keys(kartAnalysisData.karts || {}).length;
    
    console.log('📊 Analysis View Update:', {
        totalLaps,
        kartCount,
        driverCount: Object.keys(kartAnalysisData.drivers || {}).length,
        sessionCount: Object.keys(kartAnalysisData.sessions || {}).length
    });
    
    // Show/hide no-data message
    if (totalLaps === 0 || kartCount === 0) {
        console.warn('⚠️ No data to display in analysis');
        if (elements.analysisNoData) elements.analysisNoData.classList.remove('hidden');
        if (elements.analysisContent) elements.analysisContent.classList.add('hidden');
        return;
    }
    
    if (elements.analysisNoData) elements.analysisNoData.classList.add('hidden');
    if (elements.analysisContent) elements.analysisContent.classList.remove('hidden');
    
    // Update summary stats
    updateAnalysisSummaryStats(elements, kartAnalysisData);
    
    // Update rankings table
    updateAnalysisRankingsTable(elements, kartAnalysisData);
}

/**
 * Update analysis summary statistics
 * @param {Object} elements - DOM elements
 * @param {Object} kartAnalysisData - Kart analysis data
 */
function updateAnalysisSummaryStats(elements, kartAnalysisData) {
    const stats = AnalysisService.getSummaryStats(kartAnalysisData);
    
    if (elements.analysisStats) {
        elements.analysisStats.innerHTML = `
            <div class="analysis-stat-card">
                <div class="analysis-stat-value">${stats.totalLaps}</div>
                <div class="analysis-stat-label">Total Laps</div>
            </div>
            <div class="analysis-stat-card">
                <div class="analysis-stat-value">${stats.totalKarts}</div>
                <div class="analysis-stat-label">Karts Tested</div>
            </div>
            <div class="analysis-stat-card">
                <div class="analysis-stat-value">${stats.totalDrivers}</div>
                <div class="analysis-stat-label">Drivers</div>
            </div>
            <div class="analysis-stat-card">
                <div class="analysis-stat-value">${Object.keys(stats.crossKartDrivers).length}</div>
                <div class="analysis-stat-label">Cross-Kart Drivers</div>
            </div>
        `;
    }
}

/**
 * Update rankings table with sorted karts
 * @param {Object} elements - DOM elements
 * @param {Object} kartAnalysisData - Kart analysis data
 */
function updateAnalysisRankingsTable(elements, kartAnalysisData) {
    if (!elements.analysisTableBody) return;
    
    // Analyze all karts
    const kartAnalysis = AnalysisService.analyzeAllKarts(kartAnalysisData);
    
    console.log('🔍 Analysis View Debug:', {
        hasTableBody: !!elements.analysisTableBody,
        kartCount: Object.keys(kartAnalysisData.karts || {}).length,
        lapCount: (kartAnalysisData.laps || []).length,
        analysisResults: kartAnalysis.length
    });
    
    // Generate table rows
    elements.analysisTableBody.innerHTML = '';
    
    if (kartAnalysis.length === 0) {
        console.warn('⚠️ No kart analysis results to display');
        return;
    }
    
    kartAnalysis.forEach((kart, index) => {
        const row = document.createElement('tr');
        
        // Rank styling
        const rank = index + 1;
        let rankClass = '';
        if (rank === 1) rankClass = 'rank-gold';
        else if (rank === 2) rankClass = 'rank-silver';
        else if (rank === 3) rankClass = 'rank-bronze';
        
        // Performance difference
        const pctFaster = kart.normalized.percentageFaster;
        let perfClass = 'perf-neutral';
        let perfIcon = '−';
        if (pctFaster > 0.5) {
            perfClass = 'perf-faster';
            perfIcon = '↑';
        } else if (pctFaster < -0.5) {
            perfClass = 'perf-slower';
            perfIcon = '↓';
        }
        
        // Confidence styling
        const confLevel = kart.confidence.level;
        let confClass = 'conf-low';
        let confIcon = '⚠️';
        if (confLevel === 'High') {
            confClass = 'conf-high';
            confIcon = '✅';
        } else if (confLevel === 'Medium') {
            confClass = 'conf-medium';
            confIcon = '⚡';
        }
        
        // Format lap times
        const avgLapFormatted = formatTime(kart.stats.avgLapTime);
        const bestLapFormatted = formatTime(kart.stats.bestLapTime);
        
        // Highlight if kartId and kartNumber are different (kart was renumbered)
        const renumberedClass = kart.kartId !== kart.kartNumber ? 'renumbered' : '';
        
        row.innerHTML = `
            <td class="rank ${rankClass}">${rank}</td>
            <td class="kart-id ${renumberedClass}" style="color: #888; font-family: monospace; font-size: 0.9rem;">${kart.kartId}</td>
            <td class="kart-number">#${kart.kartNumber}</td>
            <td class="avg-lap" style="font-weight: bold; color: #00ff88;">${avgLapFormatted}</td>
            <td class="best-lap">${bestLapFormatted}</td>
            <td class="norm-index">${kart.normalized.index.toFixed(3)}</td>
            <td class="perf-diff ${perfClass}">${perfIcon} ${Math.abs(pctFaster).toFixed(1)}%</td>
            <td class="lap-count">${kart.stats.totalLaps}</td>
            <td class="driver-count">${kart.stats.uniqueDriverCount}</td>
            <td class="confidence ${confClass}">${confIcon} ${confLevel}</td>
            <td class="details-btn-cell">
                <button class="details-btn" onclick="window.kartingApp.showKartDetails('${kart.kartId}')">
                    Details
                </button>
            </td>
        `;
        
        elements.analysisTableBody.appendChild(row);
    });
}

/**
 * Show detailed statistics modal for a kart
 * @param {string} kartId - Kart ID
 * @param {Object} elements - DOM elements
 * @param {Object} kartAnalysisData - Kart analysis data
 */
export function showKartDetails(kartId, elements, kartAnalysisData) {
    console.log('🔍 showKartDetails in analysis.view.js', { kartId, hasElements: !!elements, hasData: !!kartAnalysisData });
    
    const kart = kartAnalysisData.karts[kartId];
    const displayNumber = kart ? (kart.kartNumber || kartId) : kartId;
    
    const normalized = AnalysisService.calculateNormalizedIndex(kartId, kartAnalysisData);
    const percentile = AnalysisService.calculatePercentileRanking(kartId, kartAnalysisData);
    const stats = AnalysisService.getKartStats(kartId, kartAnalysisData);
    const confidence = AnalysisService.calculateConfidence(kartId, kartAnalysisData);
    const { crossKartDrivers } = AnalysisService.findCrossKartDrivers(kartAnalysisData);
    
    console.log('🔍 Analysis results:', { normalized, percentile, stats, confidence });
    
    if (!normalized || !stats) {
        alert('No data available for this kart');
        return;
    }
    
    // Build cross-kart driver info
    let crossKartInfo = '';
    if (normalized.crossKartDriverCount > 0) {
        const driversForThisKart = stats.drivers.filter(driverName => 
            crossKartDrivers[driverName]
        );
        
        crossKartInfo = `
            <div class="cross-kart-info">
                <h4>Cross-Kart Drivers (${normalized.crossKartDriverCount})</h4>
                <div class="driver-list">
                    ${driversForThisKart.map(driverName => {
                        const driverInfo = crossKartDrivers[driverName];
                        return `
                            <div class="driver-item">
                                <span class="driver-name">${driverName}</span>
                                <span class="cross-kart-badge">Used ${driverInfo.kartsUsed.length} karts</span>
                                <span class="driver-stats">${driverInfo.totalLaps} laps</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    // Build warnings
    const warnings = [];
    if (confidence.level === 'Low') {
        warnings.push('⚠️ Low confidence - need more data for reliable analysis');
    }
    if (stats.totalLaps < 20) {
        warnings.push('⚠️ Limited lap count - results may not be representative');
    }
    if (stats.uniqueDriverCount < 3) {
        warnings.push('⚠️ Few drivers tested this kart');
    }
    
    const warningsHtml = warnings.length > 0 ? `
        <div class="warnings-section">
            ${warnings.map(w => `<div class="warning-item">${w}</div>`).join('')}
        </div>
    ` : '';
    
    // Populate modal
    const modal = elements.analysisDetails;
    if (!modal) {
        console.error('❌ Modal element not found');
        return;
    }
    
    // Performance indicator
    const pctFaster = normalized.percentageFaster;
    let perfText = 'Average';
    let perfClass = 'neutral';
    if (pctFaster > 1) {
        perfText = `${pctFaster.toFixed(1)}% Faster`;
        perfClass = 'positive';
    } else if (pctFaster < -1) {
        perfText = `${Math.abs(pctFaster).toFixed(1)}% Slower`;
        perfClass = 'negative';
    }
    
    // Show ID and number together
    const idNumberDisplay = kartId !== displayNumber 
        ? `#${displayNumber} <span style="color: #888; font-size: 0.85rem;">(ID: ${kartId})</span>`
        : `#${displayNumber}`;
    
    // Set the entire modal content (not just a child element)
    modal.innerHTML = `
        <div class="kart-details-modal">
            <div class="kart-details-header">
                <h2>Kart ${idNumberDisplay} Analysis</h2>
                <button class="close-btn" onclick="window.kartingApp.closeKartDetails()">✕</button>
            </div>
            
            <div class="kart-details-content">
                <div class="details-section">
                    <h3>Performance Summary</h3>
                    <div class="metrics-grid">
                        <div class="metric">
                            <div class="metric-label">Normalized Index</div>
                            <div class="metric-value">${normalized.index.toFixed(3)}</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Performance</div>
                            <div class="metric-value ${perfClass}">${perfText}</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Avg Percentile</div>
                            <div class="metric-value">${percentile ? percentile.avgPercentile.toFixed(1) : 'N/A'}</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Confidence</div>
                            <div class="metric-value">${confidence.level} (${confidence.score}/100)</div>
                        </div>
                    </div>
                </div>
                
                <div class="details-section">
                    <h3>Lap Statistics</h3>
                    <div class="metrics-grid">
                        <div class="metric">
                            <div class="metric-label">Total Laps</div>
                            <div class="metric-value">${stats.totalLaps}</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Best Lap</div>
                            <div class="metric-value">${formatTime(stats.bestLapTime)}</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Average Lap</div>
                            <div class="metric-value">${formatTime(stats.avgLapTime)}</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Consistency</div>
                            <div class="metric-value">${stats.consistency.toFixed(1)}%</div>
                        </div>
                    </div>
                </div>
                
                <div class="details-section">
                    <h3>Driver Data</h3>
                    <div class="metrics-grid">
                        <div class="metric">
                            <div class="metric-label">Unique Drivers</div>
                            <div class="metric-value">${stats.uniqueDriverCount}</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Cross-Kart Drivers</div>
                            <div class="metric-value">${normalized.crossKartDriverCount}</div>
                        </div>
                    </div>
                    ${crossKartInfo}
                </div>
                
                ${warningsHtml}
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    console.log('✅ Modal populated and shown');
}

/**
 * Close kart details modal
 * @param {Object} elements - DOM elements
 */
export function closeKartDetails(elements) {
    if (elements.analysisDetails) {
        elements.analysisDetails.classList.add('hidden');
    }
}

