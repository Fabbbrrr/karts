/**
 * Karting Live Timer - Compare View
 * 
 * PURPOSE: Visual head-to-head driver comparison with animated bars and charts
 * WHY: Engaging visual comparison helps identify performance differences
 * HOW: Uses progress bars, winner indicators, and lap-by-lap charts
 * FEATURE: Head-to-Head Comparison, Visual Stats, Performance Charts
 */

import { formatTime } from '../utils/time-formatter.js';
import { calculateConsistency, calculateAverageLapTime } from '../utils/calculations.js';

const LAP_TIME_THRESHOLD = 60000; // 60 seconds

/**
 * Update compare view with two selected drivers
 * 
 * PURPOSE: Display flashy visual comparison between two drivers
 * WHY: Users want engaging, easy-to-understand performance comparisons
 * HOW: Updates driver cards, stat bars, charts, and winner indicators
 * 
 * @param {Object} elements - DOM elements
 * @param {Object} sessionData - Current session data
 */
export function updateCompareView(elements, sessionData) {
    if (!sessionData) return;
    
    const driver1Num = elements.compareDriver1Select?.value;
    const driver2Num = elements.compareDriver2Select?.value;
    
    if (!driver1Num || !driver2Num || driver1Num === driver2Num) {
        if (elements.compareContent) elements.compareContent.classList.add('hidden');
        if (elements.compareNoSelection) elements.compareNoSelection.style.display = 'block';
        return;
    }
    
    const driver1 = sessionData.runs.find(r => r.kart_number === driver1Num);
    const driver2 = sessionData.runs.find(r => r.kart_number === driver2Num);
    
    if (!driver1 || !driver2) return;
    
    if (elements.compareContent) elements.compareContent.classList.remove('hidden');
    if (elements.compareNoSelection) elements.compareNoSelection.style.display = 'none';
    
    // Update driver header cards
    updateDriverCard(1, driver1);
    updateDriverCard(2, driver2);
    
    // Filter valid lap times
    const getLaps = (run) => (run.lap_times || [])
        .filter(lap => lap && lap.lapTimeRaw && lap.lapTimeRaw <= LAP_TIME_THRESHOLD)
        .map(lap => lap.lapTimeRaw);
    
    const d1Laps = getLaps(driver1);
    const d2Laps = getLaps(driver2);
    
    // Calculate stats
    const stats = {
        best: {
            val1: driver1.best_time_raw && driver1.best_time_raw <= LAP_TIME_THRESHOLD ? driver1.best_time_raw : null,
            val2: driver2.best_time_raw && driver2.best_time_raw <= LAP_TIME_THRESHOLD ? driver2.best_time_raw : null,
            display1: driver1.best_time || '-',
            display2: driver2.best_time || '-',
            lowerIsBetter: true
        },
        avg: {
            val1: d1Laps.length > 0 ? d1Laps.reduce((sum, t) => sum + t, 0) / d1Laps.length : null,
            val2: d2Laps.length > 0 ? d2Laps.reduce((sum, t) => sum + t, 0) / d2Laps.length : null,
            display1: d1Laps.length > 0 ? formatTime(d1Laps.reduce((sum, t) => sum + t, 0) / d1Laps.length) : '-',
            display2: d2Laps.length > 0 ? formatTime(d2Laps.reduce((sum, t) => sum + t, 0) / d2Laps.length) : '-',
            lowerIsBetter: true
        },
        consistency: {
            val1: d1Laps.length >= 3 ? calculateConsistency(d1Laps.map(t => ({ lapTimeRaw: t }))) : null,
            val2: d2Laps.length >= 3 ? calculateConsistency(d2Laps.map(t => ({ lapTimeRaw: t }))) : null,
            display1: d1Laps.length >= 3 ? `${calculateConsistency(d1Laps.map(t => ({ lapTimeRaw: t }))).toFixed(3)}s` : '-',
            display2: d2Laps.length >= 3 ? `${calculateConsistency(d2Laps.map(t => ({ lapTimeRaw: t }))).toFixed(3)}s` : '-',
            lowerIsBetter: true
        },
        laps: {
            val1: d1Laps.length,
            val2: d2Laps.length,
            display1: d1Laps.length.toString(),
            display2: d2Laps.length.toString(),
            lowerIsBetter: false
        }
    };
    
    // Update visual comparison bars
    let score1 = 0;
    let score2 = 0;
    
    Object.keys(stats).forEach(key => {
        const stat = stats[key];
        const winner = updateComparisonBars(key, stat);
        if (winner === 1) score1++;
        if (winner === 2) score2++;
    });
    
    // Update scores
    const score1El = document.getElementById('compare-score-1');
    const score2El = document.getElementById('compare-score-2');
    if (score1El) score1El.textContent = score1;
    if (score2El) score2El.textContent = score2;
    
    // Update lap-by-lap chart
    updateLapChart(driver1, driver2, d1Laps, d2Laps);
    
    console.log('📊 Comparison updated:', { 
        driver1: driver1.name, 
        driver2: driver2.name, 
        score: `${score1}-${score2}` 
    });
}

/**
 * Update driver header card
 */
function updateDriverCard(driverNum, run) {
    const kartEl = document.getElementById(`compare-driver${driverNum}-kart`);
    const nameEl = document.getElementById(`compare-driver${driverNum}-name`);
    const posEl = document.getElementById(`compare-driver${driverNum}-position`);
    
    if (kartEl) kartEl.textContent = `#${run.kart_number}`;
    if (nameEl) nameEl.textContent = run.name || `Driver ${run.kart_number}`;
    if (posEl) posEl.textContent = `P${run.position || '-'}`;
}

/**
 * Update comparison bars for a stat
 * @returns {number|null} Winner (1, 2, or null for tie)
 */
function updateComparisonBars(statKey, stat) {
    const bar1 = document.getElementById(`compare-bar-${statKey}-1`);
    const bar2 = document.getElementById(`compare-bar-${statKey}-2`);
    const val1El = document.getElementById(`compare-value-${statKey}-1`);
    const val2El = document.getElementById(`compare-value-${statKey}-2`);
    const winnerEl = document.getElementById(`compare-winner-${statKey}`);
    
    if (!bar1 || !bar2 || !val1El || !val2El || !winnerEl) return null;
    
    // Update values
    val1El.textContent = stat.display1;
    val2El.textContent = stat.display2;
    
    // Determine winner and percentages
    let winner = null;
    let pct1 = 0;
    let pct2 = 0;
    
    if (stat.val1 !== null && stat.val2 !== null) {
        if (stat.lowerIsBetter) {
            // Lower is better (lap times, consistency)
            const max = Math.max(stat.val1, stat.val2);
            pct1 = max > 0 ? (max / stat.val1) * 100 : 100;
            pct2 = max > 0 ? (max / stat.val2) * 100 : 100;
            winner = stat.val1 < stat.val2 ? 1 : (stat.val2 < stat.val1 ? 2 : null);
        } else {
            // Higher is better (lap count)
            const max = Math.max(stat.val1, stat.val2);
            pct1 = max > 0 ? (stat.val1 / max) * 100 : 100;
            pct2 = max > 0 ? (stat.val2 / max) * 100 : 100;
            winner = stat.val1 > stat.val2 ? 1 : (stat.val2 > stat.val1 ? 2 : null);
        }
    } else if (stat.val1 !== null) {
        pct1 = 100;
        winner = 1;
    } else if (stat.val2 !== null) {
        pct2 = 100;
        winner = 2;
    }
    
    // Update bar widths with animation
    bar1.style.width = `${Math.min(100, pct1)}%`;
    bar2.style.width = `${Math.min(100, pct2)}%`;
    
    // Update winner indicator
    if (winner === 1) {
        winnerEl.textContent = '🏆 Driver 1 Wins!';
        winnerEl.className = 'compare-winner winner-1';
        bar1.classList.add('winning-bar');
        bar2.classList.remove('winning-bar');
    } else if (winner === 2) {
        winnerEl.textContent = '🏆 Driver 2 Wins!';
        winnerEl.className = 'compare-winner winner-2';
        bar2.classList.add('winning-bar');
        bar1.classList.remove('winning-bar');
    } else {
        winnerEl.textContent = '🤝 Tie!';
        winnerEl.className = 'compare-winner tie';
        bar1.classList.remove('winning-bar');
        bar2.classList.remove('winning-bar');
    }
    
    return winner;
}

/**
 * Update lap-by-lap comparison chart
 */
function updateLapChart(driver1, driver2, d1Laps, d2Laps) {
    const chartContainer = document.getElementById('compare-lap-chart-container');
    if (!chartContainer) return;
    
    const maxLaps = Math.max(d1Laps.length, d2Laps.length);
    
    if (maxLaps === 0) {
        chartContainer.innerHTML = '<p class="no-chart-data">No lap data available</p>';
        return;
    }
    
    let html = '<div class="lap-chart-bars">';
    
    for (let i = 0; i < maxLaps; i++) {
        const lap1 = d1Laps[i];
        const lap2 = d2Laps[i];
        
        const lapLabel = `L${i + 1}`;
        const lap1Display = lap1 ? formatTime(lap1) : '-';
        const lap2Display = lap2 ? formatTime(lap2) : '-';
        
        let lap1Class = 'lap-bar driver-1-bar';
        let lap2Class = 'lap-bar driver-2-bar';
        
        if (lap1 && lap2) {
            if (lap1 < lap2) lap1Class += ' faster-lap';
            else if (lap2 < lap1) lap2Class += ' faster-lap';
        }
        
        html += `
            <div class="lap-comparison-group">
                <div class="lap-label">${lapLabel}</div>
                <div class="lap-bars-container">
                    <div class="${lap1Class}" title="Driver 1: ${lap1Display}">
                        <span class="lap-time-label">${lap1Display}</span>
                    </div>
                    <div class="${lap2Class}" title="Driver 2: ${lap2Display}">
                        <span class="lap-time-label">${lap2Display}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    chartContainer.innerHTML = html;
}

