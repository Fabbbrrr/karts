/**
 * Karting Live Timer - Results View
 * 
 * PURPOSE: Display race results with multiple scoring methods and podium
 * WHY: Different venues use different winning formats (fastest lap, total time, etc.)
 * FEATURE: Results Display, Podium, Scoring Methods, Visual Rankings
 */

import { formatTime } from '../utils/time-formatter.js';
import { calculateConsistency, calculateAverageLapTime } from '../utils/calculations.js';

/**
 * Calculate results based on selected scoring method
 * 
 * @param {Array} runs - Session runs data
 * @param {string} method - Scoring method (fastest-lap, total-time, average-lap, best-3-avg, consistency)
 * @returns {Array} Sorted results with scores
 */
function calculateResults(runs, method) {
    const LAP_TIME_THRESHOLD = 60000; // 60 seconds in milliseconds
    
    const results = runs
        .filter(run => run.kart_number && run.laps > 0)
        .map(run => {
            let score = null;
            let scoreDisplay = '-';
            let rawScore = Infinity;
            
            // Get valid lap times (under 60 seconds)
            const lapTimes = (run.lap_times || [])
                .filter(lap => lap && lap.lapTimeRaw && lap.lapTimeRaw <= LAP_TIME_THRESHOLD)
                .map(lap => lap.lapTimeRaw);
            
            switch (method) {
                case 'fastest-lap':
                    // Winner: Fastest single lap
                    if (run.best_time_raw && run.best_time_raw <= LAP_TIME_THRESHOLD) {
                        rawScore = run.best_time_raw;
                        scoreDisplay = run.best_time || formatTime(rawScore);
                        score = rawScore;
                    }
                    break;
                    
                case 'total-time':
                    // Winner: Lowest total time (endurance format)
                    if (lapTimes.length > 0) {
                        rawScore = lapTimes.reduce((sum, time) => sum + time, 0);
                        scoreDisplay = formatTime(rawScore);
                        score = rawScore;
                    }
                    break;
                    
                case 'average-lap':
                    // Winner: Best average lap time
                    if (lapTimes.length > 0) {
                        rawScore = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
                        scoreDisplay = formatTime(rawScore);
                        score = rawScore;
                    }
                    break;
                    
                case 'best-3-avg':
                    // Winner: Average of 3 best laps
                    if (lapTimes.length >= 3) {
                        const best3 = [...lapTimes].sort((a, b) => a - b).slice(0, 3);
                        rawScore = best3.reduce((sum, time) => sum + time, 0) / 3;
                        scoreDisplay = formatTime(rawScore);
                        score = rawScore;
                    } else if (lapTimes.length > 0) {
                        // If less than 3 laps, use average of available laps
                        rawScore = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
                        scoreDisplay = formatTime(rawScore);
                        score = rawScore;
                    }
                    break;
                    
                case 'consistency':
                    // Winner: Most consistent (lowest standard deviation)
                    if (lapTimes.length >= 3) {
                        const consistency = calculateConsistency(lapTimes.map(time => ({ lapTimeRaw: time })));
                        if (consistency !== null) {
                            rawScore = consistency; // Lower is better
                            scoreDisplay = `${consistency.toFixed(3)}s σ`;
                            score = consistency;
                        }
                    }
                    break;
            }
            
            return {
                ...run,
                score,
                scoreDisplay,
                rawScore,
                validLaps: lapTimes.length
            };
        })
        .filter(result => result.score !== null && result.score !== Infinity)
        .sort((a, b) => a.rawScore - b.rawScore); // Lower is better for all methods
    
    // Assign positions and calculate gaps
    results.forEach((result, index) => {
        result.position = index + 1;
        
        if (index === 0) {
            result.gap = '-';
            result.gapRaw = 0;
        } else {
            const gapValue = result.rawScore - results[0].rawScore;
            result.gapRaw = gapValue;
            
            // Format gap based on method
            if (method === 'consistency') {
                result.gap = `+${gapValue.toFixed(3)}s`;
            } else {
                // Time-based methods
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
 * Get method description
 */
function getMethodDescription(method) {
    const descriptions = {
        'fastest-lap': 'Winner determined by the single fastest lap time recorded during the session.',
        'total-time': 'Winner has the lowest cumulative time across all completed laps (endurance format).',
        'average-lap': 'Winner has the best average lap time across all completed laps.',
        'best-3-avg': 'Winner has the best average of their 3 fastest laps (rewards consistency + speed).',
        'consistency': 'Winner has the most consistent lap times (lowest standard deviation).'
    };
    return descriptions[method] || '';
}

/**
 * Update podium display
 */
function updatePodium(results) {
    const podiumP1 = document.getElementById('podium-p1');
    const podiumP2 = document.getElementById('podium-p2');
    const podiumP3 = document.getElementById('podium-p3');
    
    if (!podiumP1 || !podiumP2 || !podiumP3) return;
    
    // Helper to create podium HTML
    const createPodiumHTML = (result, position) => {
        if (!result) {
            return `
                <div class="podium-position">${position === 1 ? '🥇 1st' : position === 2 ? '2nd' : '3rd'}</div>
                <div class="podium-kart">-</div>
                <div class="podium-name">-</div>
                <div class="podium-time">-</div>
            `;
        }
        
        const emoji = position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉';
        const posText = position === 1 ? '1st' : position === 2 ? '2nd' : '3rd';
        
        return `
            <div class="podium-position">${emoji} ${posText}</div>
            <div class="podium-kart">#${result.kart_number}</div>
            <div class="podium-name">${result.name}</div>
            <div class="podium-time">${result.scoreDisplay}</div>
            <div class="podium-laps">${result.validLaps} laps</div>
        `;
    };
    
    // Update podium positions
    podiumP1.innerHTML = createPodiumHTML(results[0], 1);
    podiumP2.innerHTML = createPodiumHTML(results[1], 2);
    podiumP3.innerHTML = createPodiumHTML(results[2], 3);
    
    // Add celebration animations for podium
    if (results[0]) podiumP1.classList.add('podium-winner');
    if (results[1]) podiumP2.classList.add('podium-second');
    if (results[2]) podiumP3.classList.add('podium-third');
}

/**
 * Update results table
 */
function updateResultsTable(results) {
    const tableBody = document.getElementById('results-table-body');
    if (!tableBody) return;
    
    if (results.length === 0) {
        tableBody.innerHTML = '<div class="no-results">No valid results to display</div>';
        return;
    }
    
    tableBody.innerHTML = results.map(result => {
        let rowClass = 'results-table-row';
        let medal = '';
        
        if (result.position === 1) {
            rowClass += ' podium-1';
            medal = '🥇';
        } else if (result.position === 2) {
            rowClass += ' podium-2';
            medal = '🥈';
        } else if (result.position === 3) {
            rowClass += ' podium-3';
            medal = '🥉';
        }
        
        return `
            <div class="${rowClass}">
                <div class="results-col-pos">${medal} ${result.position}</div>
                <div class="results-col-kart">#${result.kart_number}</div>
                <div class="results-col-name">${result.name}</div>
                <div class="results-col-score">${result.scoreDisplay}</div>
                <div class="results-col-gap">${result.gap}</div>
                <div class="results-col-laps">${result.validLaps}</div>
            </div>
        `;
    }).join('');
}

/**
 * Update statistics display
 */
function updateStatistics(results, method) {
    const statsGrid = document.getElementById('results-stats-grid');
    if (!statsGrid || results.length === 0) return;
    
    const winner = results[0];
    const avgScore = results.reduce((sum, r) => sum + r.rawScore, 0) / results.length;
    
    let stats = '';
    
    if (method === 'consistency') {
        stats = `
            <div class="stat-card">
                <div class="stat-label">Most Consistent</div>
                <div class="stat-value">${winner.scoreDisplay}</div>
                <div class="stat-subtitle">${winner.name}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Average Consistency</div>
                <div class="stat-value">${(avgScore).toFixed(3)}s σ</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Participants</div>
                <div class="stat-value">${results.length}</div>
            </div>
        `;
    } else {
        stats = `
            <div class="stat-card stat-winner">
                <div class="stat-label">🏆 Winning Time</div>
                <div class="stat-value">${winner.scoreDisplay}</div>
                <div class="stat-subtitle">${winner.name}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Average</div>
                <div class="stat-value">${formatTime(avgScore)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Gap to Winner</div>
                <div class="stat-value">${results.length > 1 ? results[results.length - 1].gap : '-'}</div>
                <div class="stat-subtitle">Last place</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Participants</div>
                <div class="stat-value">${results.length}</div>
            </div>
        `;
    }
    
    statsGrid.innerHTML = stats;
}

/**
 * Main update function for results view
 */
export function updateResultsView(elements, sessionData, state) {
    if (!sessionData || !sessionData.runs) {
        const noData = document.getElementById('results-no-data');
        const content = document.getElementById('results-content');
        if (noData) noData.classList.remove('hidden');
        if (content) content.classList.add('hidden');
        return;
    }
    
    // Get selected method or default to fastest-lap
    const methodSelect = document.getElementById('results-method-select');
    const method = methodSelect ? methodSelect.value : 'fastest-lap';
    
    // Calculate results
    const results = calculateResults(sessionData.runs, method);
    
    // Update method description
    const methodDesc = document.getElementById('results-method-description');
    if (methodDesc) {
        methodDesc.textContent = getMethodDescription(method);
    }
    
    // Show/hide sections
    const noData = document.getElementById('results-no-data');
    const content = document.getElementById('results-content');
    
    if (results.length === 0) {
        if (noData) noData.classList.remove('hidden');
        if (content) content.classList.add('hidden');
        return;
    }
    
    if (noData) noData.classList.add('hidden');
    if (content) content.classList.remove('hidden');
    
    // Update all sections
    updatePodium(results);
    updateResultsTable(results);
    updateStatistics(results, method);
    
    console.log('📊 Results updated:', { method, resultsCount: results.length, winner: results[0]?.name });
}
