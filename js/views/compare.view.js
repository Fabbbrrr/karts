// Karting Live Timer - Compare View
// Side-by-side driver comparison

/**
 * Update compare view with two selected drivers
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
    
    // Update driver names
    const d1Name = document.getElementById('compare-driver1-name');
    const d2Name = document.getElementById('compare-driver2-name');
    if (d1Name) d1Name.textContent = `Kart ${driver1.kart_number}`;
    if (d2Name) d2Name.textContent = `Kart ${driver2.kart_number}`;
    
    // Update stats with highlighting
    updateCompareRow('pos', driver1.pos, driver2.pos, (a, b) => a < b);
    updateCompareRow('best', driver1.best_time, driver2.best_time, (a, b) => a.timeRaw < b.timeRaw, driver1, driver2);
    updateCompareRow('last', driver1.last_time, driver2.last_time, (a, b) => a.timeRaw < b.timeRaw, driver1, driver2);
    updateCompareRow('avg', driver1.avg_lap, driver2.avg_lap, (a, b) => a.timeRaw < b.timeRaw, driver1, driver2);
    updateCompareRow('consistency', driver1.consistency_lap, driver2.consistency_lap, (a, b) => a.timeRaw < b.timeRaw, driver1, driver2);
    updateCompareRow('laps', driver1.total_laps, driver2.total_laps, (a, b) => a > b);
    updateCompareRow('gap', driver1.gap, driver2.gap, (a, b) => a < b);
}

/**
 * Update a single comparison row
 * @param {string} stat - Stat name
 * @param {*} val1 - Driver 1 value
 * @param {*} val2 - Driver 2 value
 * @param {Function} isBetter - Comparison function
 * @param {Object} run1 - Driver 1 run data (optional, for raw values)
 * @param {Object} run2 - Driver 2 run data (optional, for raw values)
 */
function updateCompareRow(stat, val1, val2, isBetter, run1, run2) {
    const el1 = document.getElementById(`compare-driver1-${stat}`);
    const el2 = document.getElementById(`compare-driver2-${stat}`);
    
    if (!el1 || !el2) return;
    
    el1.textContent = val1 || '-';
    el2.textContent = val2 || '-';
    
    // Reset classes
    el1.className = 'compare-value';
    el2.className = 'compare-value';
    
    // Highlight better value
    if (val1 && val2) {
        let better1, better2;
        
        // For time-based stats, compare raw values
        if (run1 && run2 && (stat === 'best' || stat === 'last' || stat === 'avg' || stat === 'consistency')) {
            const raw1 = run1[`${stat}_time_raw`] || run1[`${stat}_lap_raw`];
            const raw2 = run2[`${stat}_time_raw`] || run2[`${stat}_lap_raw`];
            better1 = raw1 && raw2 && raw1 < raw2;
            better2 = raw1 && raw2 && raw2 < raw1;
        } else {
            better1 = isBetter(val1, val2);
            better2 = isBetter(val2, val1);
        }
        
        if (better1) el1.classList.add('better');
        if (better2) el2.classList.add('better');
    }
}

