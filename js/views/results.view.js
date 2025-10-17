/**
 * Karting Live Timer - Results View (Complete Redesign)
 * 
 * Modern, feature-rich results screen with:
 * - Multiple scoring methods
 * - Dynamic podium with animations
 * - Full results table with search & sort
 * - Session insights & achievements
 * - Award badges system
 * - Live calculation
 * - Export functionality
 */

import { formatTime } from '../utils/time-formatter.js';
import { calculateConsistency, calculateAverageLapTime } from '../utils/calculations.js';
import { filterStaleDrivers, TIMESTAMP_THRESHOLDS } from '../utils/timestamp-filter.js';
import * as SessionHistoryService from '../services/session-history.service.js';

const LAP_TIME_THRESHOLD = 60000; // 60 seconds

let currentMethod = 'fastest-lap';
let currentResults = [];
let searchQuery = '';

/**
 * Main update function - orchestrates entire results view
 */
export function updateResultsView(elements, sessionData, state) {
    console.log('🏁 Results View Update:', { hasData: !!sessionData, runs: sessionData?.runs?.length });
    
    // Populate session selector
    populateSessionSelector('results');
    
    // Check for data
    if (!sessionData || !sessionData.runs || sessionData.runs.length === 0) {
        showNoData(true);
        return;
    }
    
    showNoData(false);
    
    // Update session overview stats
    updateSessionOverview(sessionData, state);
    
    // Calculate results based on current method
    const results = calculateResults(sessionData.runs, currentMethod);
    currentResults = results;
    
    // Update all sections
    updateMethodDescription(currentMethod);
    updatePodium(results);
    updateResultsTable(results, searchQuery);
    updateInsights(sessionData, results);
    
    console.log('✅ Results view updated successfully');
}

/**
 * Show/hide no data placeholder
 */
function showNoData(show) {
    const noData = document.getElementById('results-no-data');
    const content = document.getElementById('results-content');
    
    if (noData && content) {
        if (show) {
            noData.classList.remove('hidden');
            content.style.display = 'none';
        } else {
            noData.classList.add('hidden');
            content.style.display = 'block';
        }
    }
}

/**
 * Update session overview stats
 */
function updateSessionOverview(sessionData, state) {
    // Driver count
    const driversEl = document.getElementById('results-drivers-count');
    if (driversEl) {
        driversEl.textContent = sessionData.runs.length;
    }
    
    // Total laps
    const lapsEl = document.getElementById('results-laps-count');
    if (lapsEl) {
        const totalLaps = sessionData.runs.reduce((sum, run) => sum + (run.total_laps || 0), 0);
        lapsEl.textContent = totalLaps;
    }
    
    // Fastest lap
    const fastestEl = document.getElementById('results-fastest-time');
    if (fastestEl) {
        const validLaps = sessionData.runs
            .filter(r => r.best_time_raw && r.best_time_raw <= LAP_TIME_THRESHOLD)
            .map(r => r.best_time_raw);
        
        if (validLaps.length > 0) {
            const fastest = Math.min(...validLaps);
            fastestEl.textContent = formatTime(fastest);
        } else {
            fastestEl.textContent = '--.-';
        }
    }
    
    // Average lap
    const avgEl = document.getElementById('results-avg-time');
    if (avgEl) {
        const allLaps = [];
        sessionData.runs.forEach(run => {
            if (run.lap_times) {
                const validLaps = run.lap_times
                    .filter(lap => lap && lap.lapTimeRaw && lap.lapTimeRaw <= LAP_TIME_THRESHOLD)
                    .map(lap => lap.lapTimeRaw);
                allLaps.push(...validLaps);
            }
        });
        
        if (allLaps.length > 0) {
            const avg = allLaps.reduce((a, b) => a + b, 0) / allLaps.length;
            avgEl.textContent = formatTime(avg);
        } else {
            avgEl.textContent = '--.-';
        }
    }
    
    // Update subtitle
    const subtitle = document.getElementById('results-subtitle');
    if (subtitle && sessionData.event_name) {
        subtitle.textContent = sessionData.event_name;
    }
}

/**
 * Calculate results based on scoring method
 */
function calculateResults(runs, method) {
    // Filter stale drivers
    const activeRuns = filterStaleDrivers(runs, TIMESTAMP_THRESHOLDS.RESULTS_DISPLAY, false);
    
    const results = activeRuns
        .filter(run => run.kart_number && run.total_laps > 0)
        .map(run => {
            let score = null;
            let scoreDisplay = '-';
            let rawScore = Infinity;
            
            // Get valid lap times
            const lapTimes = (run.lap_times || [])
                .filter(lap => lap && lap.lapTimeRaw && lap.lapTimeRaw <= LAP_TIME_THRESHOLD)
                .map(lap => lap.lapTimeRaw);
            
            switch (method) {
                case 'fastest-lap':
                    if (run.best_time_raw && run.best_time_raw <= LAP_TIME_THRESHOLD) {
                        rawScore = run.best_time_raw;
                        scoreDisplay = run.best_time || formatTime(rawScore);
                        score = rawScore;
                    }
                    break;
                    
                case 'total-time':
                    if (lapTimes.length > 0) {
                        rawScore = lapTimes.reduce((sum, time) => sum + time, 0);
                        scoreDisplay = formatTime(rawScore);
                        score = rawScore;
                    }
                    break;
                    
                case 'average-lap':
                    if (lapTimes.length > 0) {
                        rawScore = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
                        scoreDisplay = formatTime(rawScore);
                        score = rawScore;
                    }
                    break;
                    
                case 'best-3-avg':
                    if (lapTimes.length >= 3) {
                        const best3 = [...lapTimes].sort((a, b) => a - b).slice(0, 3);
                        rawScore = best3.reduce((sum, time) => sum + time, 0) / 3;
                        scoreDisplay = formatTime(rawScore);
                        score = rawScore;
                    } else if (lapTimes.length > 0) {
                        rawScore = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
                        scoreDisplay = formatTime(rawScore);
                        score = rawScore;
                    }
                    break;
                    
                case 'consistency':
                    if (lapTimes.length >= 3) {
                        const consistency = calculateConsistency(lapTimes.map(time => ({ lapTimeRaw: time })));
                        if (consistency !== null) {
                            rawScore = consistency;
                            scoreDisplay = `${consistency.toFixed(3)}s`;
                            score = consistency;
                        }
                    }
                    break;
            }
            
            // Calculate awards/badges
            const awards = [];
            if (run.best_time_raw === Math.min(...activeRuns.filter(r => r.best_time_raw).map(r => r.best_time_raw))) {
                awards.push({ icon: '⚡', label: 'Fastest Lap' });
            }
            if (lapTimes.length > 0) {
                const consistency = calculateConsistency(lapTimes.map(t => ({ lapTimeRaw: t })));
                if (consistency !== null && consistency < 1.0) {
                    awards.push({ icon: '🎯', label: 'Consistent' });
                }
            }
            
            return {
                ...run,
                score,
                scoreDisplay,
                rawScore,
                validLaps: lapTimes.length,
                awards,
                bestLapDisplay: run.best_time || '-'
            };
        })
        .filter(result => result.score !== null && result.score !== Infinity)
        .sort((a, b) => a.rawScore - b.rawScore);
    
    // Assign positions and gaps
    results.forEach((result, index) => {
        result.position = index + 1;
        
        if (index === 0) {
            result.gap = '-';
            result.gapRaw = 0;
        } else {
            const gapValue = result.rawScore - results[0].rawScore;
            result.gapRaw = gapValue;
            
            if (method === 'consistency') {
                result.gap = `+${gapValue.toFixed(3)}s`;
            } else {
                const gapSeconds = gapValue / 1000;
                if (gapSeconds < 60) {
                    result.gap = `+${gapSeconds.toFixed(3)}s`;
                } else {
                    const minutes = Math.floor(gapSeconds / 60);
                    const seconds = (gapSeconds % 60).toFixed(3);
                    result.gap = `+${minutes}:${seconds.padStart(6, '0')}`;
                }
            }
        }
    });
    
    return results;
}

/**
 * Update method description
 */
function updateMethodDescription(method) {
    const descriptions = {
        'fastest-lap': 'Winner determined by the single fastest lap time recorded.',
        'total-time': 'Winner has the lowest cumulative time (endurance format).',
        'average-lap': 'Winner has the best average lap time.',
        'best-3-avg': 'Winner has the best average of their 3 fastest laps.',
        'consistency': 'Winner has the most consistent lap times (lowest variance).'
    };
    
    const descEl = document.getElementById('results-method-description');
    if (descEl) {
        descEl.textContent = descriptions[method] || '';
    }
}

/**
 * Update podium display
 */
function updatePodium(results) {
    const positions = [1, 2, 3];
    
    positions.forEach(pos => {
        const result = results[pos - 1];
        const kartEl = document.getElementById(`podium-p${pos}-kart`);
        const nameEl = document.getElementById(`podium-p${pos}-name`);
        const timeEl = document.getElementById(`podium-p${pos}-time`);
        const gapEl = document.getElementById(`podium-p${pos}-gap`);
        
        if (result) {
            if (kartEl) kartEl.textContent = `#${result.kart_number}`;
            if (nameEl) nameEl.textContent = result.name || 'Unknown';
            if (timeEl) timeEl.textContent = result.scoreDisplay;
            if (gapEl) gapEl.textContent = result.gap;
        } else {
            if (kartEl) kartEl.textContent = '#-';
            if (nameEl) nameEl.textContent = '-';
            if (timeEl) timeEl.textContent = '--.-';
            if (gapEl && gapEl) gapEl.textContent = '-';
        }
    });
}

/**
 * Update results table
 */
function updateResultsTable(results, searchQuery) {
    const tbody = document.getElementById('results-table-body-modern');
    if (!tbody) return;
    
    // Filter by search
    let filteredResults = results;
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredResults = results.filter(r => 
            r.name.toLowerCase().includes(query) ||
            r.kart_number.toLowerCase().includes(query)
        );
    }
    
    tbody.innerHTML = filteredResults.map(result => {
        const podiumClass = result.position <= 3 ? `podium-${result.position}` : '';
        const awardsHtml = result.awards.map(a => 
            `<span class="award-badge" title="${a.label}">${a.icon}</span>`
        ).join('');
        
        return `
            <tr class="${podiumClass}">
                <td class="pos-cell">
                    ${result.position <= 3 ? ['🥇', '🥈', '🥉'][result.position - 1] : ''} 
                    ${result.position}
                </td>
                <td class="kart-cell">#${result.kart_number}</td>
                <td class="name-cell">${result.name || 'Unknown'}</td>
                <td class="score-cell">${result.scoreDisplay}</td>
                <td class="gap-cell">${result.gap}</td>
                <td class="best-cell">${result.bestLapDisplay}</td>
                <td class="laps-cell">${result.validLaps}</td>
                <td class="awards-cell">${awardsHtml || '-'}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Update session insights
 */
function updateInsights(sessionData, results) {
    // Fastest lap
    const fastestDriver = results.find(r => r.awards.some(a => a.icon === '⚡'));
    const fastestEl = document.getElementById('insight-fastest');
    const fastestTimeEl = document.getElementById('insight-fastest-time');
    if (fastestEl && fastestDriver) {
        fastestEl.textContent = fastestDriver.name;
        if (fastestTimeEl) fastestTimeEl.textContent = fastestDriver.bestLapDisplay;
    }
    
    // Most consistent
    const consistentResults = results.map(r => {
        const laps = (r.lap_times || [])
            .filter(lap => lap && lap.lapTimeRaw && lap.lapTimeRaw <= LAP_TIME_THRESHOLD)
            .map(lap => lap.lapTimeRaw);
        if (laps.length >= 3) {
            const consistency = calculateConsistency(laps.map(t => ({ lapTimeRaw: t })));
            return { ...r, consistencyScore: consistency };
        }
        return null;
    }).filter(r => r && r.consistencyScore !== null);
    
    const mostConsistent = consistentResults.sort((a, b) => a.consistencyScore - b.consistencyScore)[0];
    const consistentEl = document.getElementById('insight-consistent');
    const consistentScoreEl = document.getElementById('insight-consistent-score');
    if (consistentEl && mostConsistent) {
        consistentEl.textContent = mostConsistent.name;
        if (consistentScoreEl) consistentScoreEl.textContent = `${mostConsistent.consistencyScore.toFixed(3)}s σ`;
    }
    
    // Most improved (position gain)
    const improved = results
        .filter(r => r.pos && r.pos !== r.position)
        .map(r => ({ ...r, gain: r.pos - r.position }))
        .sort((a, b) => b.gain - a.gain)[0];
    const improvedEl = document.getElementById('insight-improved');
    const improvedGainEl = document.getElementById('insight-improved-gain');
    if (improvedEl && improved) {
        improvedEl.textContent = improved.name;
        if (improvedGainEl) improvedGainEl.textContent = `+${improved.gain} positions`;
    }
    
    // Completion rate
    const completionEl = document.getElementById('insight-completion');
    const completionRateEl = document.getElementById('insight-completion-rate');
    if (completionEl && results.length > 0) {
        const finishers = results.filter(r => r.run_status !== 'dnf').length;
        const rate = (finishers / results.length * 100).toFixed(0);
        completionEl.textContent = `${finishers}/${results.length}`;
        if (completionRateEl) completionRateEl.textContent = `${rate}%`;
    }
}

/**
 * Setup event listeners
 */
export function setupResultsEventListeners() {
    // Method buttons
    const methodButtons = document.querySelectorAll('.method-btn-modern');
    methodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            methodButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update method and recalculate
            currentMethod = btn.dataset.method;
            
            // Trigger update through main app
            if (window.kartingApp && window.kartingApp.updateResultsView) {
                window.kartingApp.updateResultsView();
            }
        });
    });
    
    // Search
    const searchInput = document.getElementById('results-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            updateResultsTable(currentResults, searchQuery);
        });
    }
    
    // Export button
    const exportBtn = document.getElementById('results-export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportResults(currentResults, currentMethod);
        });
    }
}

/**
 * Export results
 */
function exportResults(results, method) {
    const exportData = {
        timestamp: new Date().toISOString(),
        scoringMethod: method,
        results: results.map(r => ({
            position: r.position,
            kartNumber: r.kart_number,
            driver: r.name,
            score: r.scoreDisplay,
            gap: r.gap,
            bestLap: r.bestLapDisplay,
            laps: r.validLaps,
            awards: r.awards.map(a => a.label)
        }))
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const fileName = `results-${new Date().toISOString().split('T')[0]}.json`;
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', fileName);
    link.click();
    
    console.log('📥 Results exported:', fileName);
}

/**
 * Populate session selector
 */
function populateSessionSelector(tab) {
    const selector = document.getElementById(`${tab}-session-select`);
    if (!selector) return;
    
    if (selector.dataset.populated === 'true') return;
    
    const sessions = SessionHistoryService.getSessionHistory();
    selector.innerHTML = '<option value="live">🔴 Live</option>';
    
    if (sessions.length > 0) {
        sessions.forEach(session => {
            const option = document.createElement('option');
            option.value = session.sessionId;
            option.textContent = SessionHistoryService.getSessionLabel(session);
            selector.appendChild(option);
        });
    }
    
    selector.dataset.populated = 'true';
}

