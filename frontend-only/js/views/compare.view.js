/**
 * Karting Live Timer - Compare View
 * 
 * PURPOSE: Clean table comparison of two drivers side-by-side
 * WHY: Users want easy-to-read data comparison with clear gaps
 * HOW: Updates table cells with driver stats and calculates gaps
 * FEATURE: Head-to-Head Comparison, Gap Analysis, Winner Highlighting
 */

import { formatTime } from '../utils/time-formatter.js';
import { calculateConsistency, calculateAverageLapTime } from '../utils/calculations.js';

const LAP_TIME_THRESHOLD = 60000; // 60 seconds

/**
 * Update compare view with two selected drivers
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
    
    // Update headers
    const header1 = document.getElementById('compare-driver1-header');
    const header2 = document.getElementById('compare-driver2-header');
    if (header1) header1.textContent = `${driver1.name || 'Driver'} (#${driver1.kart_number})`;
    if (header2) header2.textContent = `${driver2.name || 'Driver'} (#${driver2.kart_number})`;
    
    // Filter valid lap times
    const getLaps = (run) => (run.lap_times || [])
        .filter(lap => lap && lap.lapTimeRaw && lap.lapTimeRaw <= LAP_TIME_THRESHOLD)
        .map(lap => lap.lapTimeRaw);
    
    const d1Laps = getLaps(driver1);
    const d2Laps = getLaps(driver2);
    
    // Calculate average lap times
    const d1Avg = d1Laps.length > 0 ? d1Laps.reduce((sum, t) => sum + t, 0) / d1Laps.length : null;
    const d2Avg = d2Laps.length > 0 ? d2Laps.reduce((sum, t) => sum + t, 0) / d2Laps.length : null;
    
    // Calculate consistency
    const d1Consistency = d1Laps.length >= 3 ? calculateConsistency(d1Laps.map(t => ({ lapTimeRaw: t }))) : null;
    const d2Consistency = d2Laps.length >= 3 ? calculateConsistency(d2Laps.map(t => ({ lapTimeRaw: t }))) : null;
    
    // Update table cells
    updateCompareRow('pos', driver1.pos, driver2.pos, true, driver1.pos, driver2.pos);
    updateCompareRow('kart', driver1.kart_number, driver2.kart_number, false);
    updateCompareRow('best', driver1.best_time, driver2.best_time, true, driver1.best_time_raw, driver2.best_time_raw);
    updateCompareRow('last', driver1.last_time, driver2.last_time, true, driver1.last_time_raw, driver2.last_time_raw);
    updateCompareRow('avg', driver1.avg_lap || '-', driver2.avg_lap || '-', true, driver1.avg_lap_raw, driver2.avg_lap_raw);
    updateCompareRow('consistency', 
        driver1.consistency_lap || '-',
        driver2.consistency_lap || '-',
        true, driver1.consistency_lap_raw, driver2.consistency_lap_raw);
    updateCompareRow('laps', driver1.total_laps, driver2.total_laps, false, driver1.total_laps, driver2.total_laps);
    updateCompareRow('gap', driver1.gap || '-', driver2.gap || '-', false);
    
    console.log('📊 Comparison updated:', { 
        driver1: driver1.name, 
        driver2: driver2.name 
    });
}

/**
 * Update a single comparison row with gap calculation
 * 
 * @param {string} stat - Stat name  
 * @param {*} val1 - Driver 1 value
 * @param {*} val2 - Driver 2 value
 * @param {boolean} showGap - Whether to show gap calculation
 * @param {number} raw1 - Driver 1 raw value for calculation (optional)
 * @param {number} raw2 - Driver 2 raw value for calculation (optional)
 */
function updateCompareRow(stat, val1, val2, showGap, raw1, raw2) {
    const el1 = document.getElementById(`compare-driver1-${stat}`);
    const el2 = document.getElementById(`compare-driver2-${stat}`);
    const gapEl = document.getElementById(`compare-gap-${stat}`);
    
    if (!el1 || !el2) return;
    
    // Update values
    el1.textContent = val1 || '-';
    el2.textContent = val2 || '-';
    
    // Reset classes
    el1.className = 'compare-value';
    el2.className = 'compare-value';
    if (gapEl) gapEl.className = 'compare-gap';
    
    // Calculate gap and highlight winner
    if (showGap && gapEl && raw1 !== null && raw1 !== undefined && raw2 !== null && raw2 !== undefined) {
        let gap = 0;
        let winner = null;
        
        if (stat === 'pos') {
            // Position: Lower is better
            gap = Math.abs(raw1 - raw2);
            if (raw1 < raw2) {
                winner = 1;
                gapEl.textContent = `↑${gap}`;
            } else if (raw2 < raw1) {
                winner = 2;
                gapEl.textContent = `↓${gap}`;
            } else {
                gapEl.textContent = '=';
            }
        } else if (stat === 'laps') {
            // Laps: Higher is better
            gap = Math.abs(raw1 - raw2);
            if (raw1 > raw2) {
                winner = 1;
                gapEl.textContent = `+${gap}`;
            } else if (raw2 > raw1) {
                winner = 2;
                gapEl.textContent = `-${gap}`;
            } else {
                gapEl.textContent = '=';
            }
        } else {
            // Time-based: Lower is better
            gap = Math.abs(raw1 - raw2);
            if (raw1 < raw2) {
                winner = 1;
                gapEl.textContent = `-${(gap / 1000).toFixed(3)}s`;
            } else if (raw2 < raw1) {
                winner = 2;
                gapEl.textContent = `+${(gap / 1000).toFixed(3)}s`;
            } else {
                gapEl.textContent = '=';
            }
        }
        
        // Highlight winner
        if (winner === 1) {
            el1.classList.add('better');
            gapEl.classList.add('gap-positive');
        } else if (winner === 2) {
            el2.classList.add('better');
            gapEl.classList.add('gap-negative');
        }
    } else if (gapEl) {
        gapEl.textContent = '-';
    }
}

