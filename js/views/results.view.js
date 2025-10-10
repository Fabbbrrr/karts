// Karting Live Timer - Results View
// Detailed results table with all statistics

/**
 * Update results view with full standings
 * @param {Object} elements - DOM elements
 * @param {Object} sessionData - Current session data
 */
export function updateResultsView(elements, sessionData) {
    if (!sessionData || !elements.resultsTableBody) return;
    
    const runs = [...sessionData.runs]
        .filter(run => run.kart_number && run.kart_number !== '')
        .sort((a, b) => a.pos - b.pos);
    
    // Generate div-based table rows (matching the HTML structure)
    elements.resultsTableBody.innerHTML = runs.map(run => {
        // Add podium class for top 3
        let podiumClass = '';
        if (run.pos === 1) podiumClass = 'podium-1';
        else if (run.pos === 2) podiumClass = 'podium-2';
        else if (run.pos === 3) podiumClass = 'podium-3';
        
        // Format the score display (best lap time)
        const scoreDisplay = run.best_time || '-';
        
        // Format gap display
        const gapDisplay = run.gap || '-';
        
        return `
            <div class="results-table-row ${podiumClass}">
                <div class="results-col-pos">${run.pos}</div>
                <div class="results-col-kart">#${run.kart_number}</div>
                <div class="results-col-name">${run.name}</div>
                <div class="results-col-score">${scoreDisplay}</div>
                <div class="results-col-gap">${gapDisplay}</div>
            </div>
        `;
    }).join('');
    
    // Show/hide no-data message
    const resultsNoData = document.getElementById('results-no-data');
    const resultsContent = document.getElementById('results-content');
    
    if (runs.length === 0) {
        if (resultsNoData) resultsNoData.classList.remove('hidden');
        if (resultsContent) resultsContent.classList.add('hidden');
    } else {
        if (resultsNoData) resultsNoData.classList.add('hidden');
        if (resultsContent) resultsContent.classList.remove('hidden');
    }
}

