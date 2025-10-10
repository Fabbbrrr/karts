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
    
    elements.resultsTableBody.innerHTML = runs.map(run => {
        const posClass = run.pos <= 3 ? `p${run.pos}` : '';
        
        return `
            <tr>
                <td class="results-pos ${posClass}">${run.pos}</td>
                <td class="results-kart">${run.kart_number}</td>
                <td class="results-driver">${run.name}</td>
                <td class="results-best-time">${run.best_time || '-'}</td>
                <td class="results-last-time">${run.last_time || '-'}</td>
                <td class="results-avg-time">${run.avg_lap || '-'}</td>
                <td class="results-laps">${run.total_laps || 0}</td>
                <td class="results-gap">${run.gap || '-'}</td>
                <td class="results-interval">${run.int || '-'}</td>
                <td class="results-consistency">${run.consistency_lap || '-'}</td>
            </tr>
        `;
    }).join('');
}

