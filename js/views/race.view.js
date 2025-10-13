// Karting Live Timer - Race View
// Render the race tab with all drivers, positions, and timing

import { formatTime } from '../utils/time-formatter.js';
import { getLapColor } from '../utils/ui-helpers.js';
import * as LapTrackerService from '../services/lap-tracker.service.js';

/**
 * Update the race view with current session data
 * @param {Object} elements - DOM elements
 * @param {Object} sessionData - Current session data
 * @param {Object} settings - User settings
 * @param {Object} personalRecords - Personal records state
 */
export function updateRaceView(elements, sessionData, settings, personalRecords = {}) {
    if (!sessionData) return;
    
    const { event_name, current_lap, total_laps, time_left, runs } = sessionData;
    
    // Update header
    elements.eventName.textContent = event_name || 'RaceFacer Live Timing';
    elements.sessionInfo.textContent = `Lap ${current_lap}/${total_laps} • ${time_left}`;
    
    const activeRuns = runs.filter(run => run.kart_number && run.kart_number !== '');
    
    // Efficient update: reuse existing elements
    const existingItems = Array.from(elements.raceList.children);
    
    activeRuns.forEach((run, index) => {
        const existingItem = existingItems[index];
        const kartNumber = run.kart_number;
        
        // Check if we can reuse existing element
        if (existingItem && existingItem.dataset.kartNumber === kartNumber) {
            // Update existing element content (no recreate = no blink)
            updateRaceItemContent(existingItem, run, settings, personalRecords);
        } else {
            // Create new element
            const newItem = createRaceItem(run, settings, personalRecords);
            if (existingItem) {
                elements.raceList.replaceChild(newItem, existingItem);
            } else {
                elements.raceList.appendChild(newItem);
            }
        }
    });
    
    // Remove extra items if any
    while (elements.raceList.children.length > activeRuns.length) {
        elements.raceList.removeChild(elements.raceList.lastChild);
    }
}

/**
 * Create a race item element
 * @param {Object} run - Driver run data
 * @param {Object} settings - User settings
 * @param {Object} personalRecords - Personal records state
 * @returns {HTMLElement} Race item div
 */
function createRaceItem(run, settings, personalRecords) {
    const div = document.createElement('div');
    div.className = 'race-item';
    div.dataset.kartNumber = run.kart_number;
    
    updateRaceItemContent(div, run, settings, personalRecords);
    
    return div;
}

/**
 * Update race item content
 * @param {HTMLElement} div - Race item element
 * @param {Object} run - Driver run data
 * @param {Object} settings - User settings
 * @param {Object} personalRecords - Personal records state
 */
function updateRaceItemContent(div, run, settings, personalRecords) {
    // Update classes
    div.className = 'race-item';
    if (settings.mainDriver && run.kart_number === settings.mainDriver) {
        div.classList.add('main-driver');
    }
    
    const positionClass = run.pos <= 3 ? `p${run.pos}` : '';
    
    // Get personal best info
    const personalBest = LapTrackerService.getPersonalBest(run.name, personalRecords);
    const pbGap = personalBest && run.last_time_raw ? 
        LapTrackerService.calculateGapToPersonalBest(run.last_time_raw, personalBest.bestLap) : 
        null;
    
    // Build details array based on settings
    const details = [];
    
    if (settings.showLastLap && run.last_time) {
        details.push(`<div class="race-detail-item">
            <span class="race-detail-label">Last:</span>
            <span class="race-detail-value last">${run.last_time}</span>
        </div>`);
    }
    
    if (settings.showAvgLap && run.avg_lap) {
        details.push(`<div class="race-detail-item">
            <span class="race-detail-label">Avg:</span>
            <span class="race-detail-value">${run.avg_lap}</span>
        </div>`);
    }
    
    if (settings.showConsistency && run.consistency_lap) {
        details.push(`<div class="race-detail-item">
            <span class="race-detail-label">±</span>
            <span class="race-detail-value">${run.consistency_lap}</span>
        </div>`);
    }
    
    if (settings.showIntervals && run.int) {
        details.push(`<div class="race-detail-item">
            <span class="race-detail-label">Int:</span>
            <span class="race-detail-value">${run.int}</span>
        </div>`);
    }
    
    // Add personal best info if available
    if (personalBest) {
        details.push(`<div class="race-detail-item">
            <span class="race-detail-label">PB:</span>
            <span class="race-detail-value pb">${personalBest.bestLapFormatted}</span>
        </div>`);
        
        // Add gap to PB if last lap is available
        if (pbGap && pbGap.formatted !== '-') {
            const gapClass = pbGap.isPositive ? 'gap-positive' : 'gap-negative';
            details.push(`<div class="race-detail-item">
                <span class="race-detail-label">Gap to PB:</span>
                <span class="race-detail-value ${gapClass}">${pbGap.formatted}</span>
            </div>`);
        }
    }
    
    // Update content
    div.innerHTML = `
        <div class="race-position ${positionClass}">P${run.pos}</div>
        <div class="race-driver-info">
            <div class="race-driver-name">Kart ${run.kart_number}</div>
            <div class="race-driver-kart">${run.name}</div>
            <div class="race-driver-details">
                ${details.join('')}
            </div>
        </div>
        <div class="race-timing">
            <div class="race-best-time">${run.best_time}</div>
            ${settings.showGaps ? `<div class="race-gap">${run.gap}</div>` : ''}
        </div>
    `;
}

/**
 * Update driver dropdown in settings
 * @param {Object} elements - DOM elements
 * @param {Object} sessionData - Current session data
 */
export function updateDriverDropdown(elements, sessionData) {
    if (!sessionData || !sessionData.runs) {
        console.warn('⚠️ updateDriverDropdown: No session data or runs');
        return;
    }
    
    console.log('🔄 Updating driver dropdown with', sessionData.runs.length, 'runs');
    
    // Clear existing options (keep first "Select driver" option)
    if (elements.mainDriverSelect) {
        while (elements.mainDriverSelect.options.length > 1) {
            elements.mainDriverSelect.remove(1);
        }
    }
    
    // Clear compare dropdowns
    if (elements.compareDriver1Select) {
        elements.compareDriver1Select.innerHTML = '<option value="">Select Driver 1</option>';
    }
    if (elements.compareDriver2Select) {
        elements.compareDriver2Select.innerHTML = '<option value="">Select Driver 2</option>';
    }
    
    // Add drivers from current session
    const filteredRuns = sessionData.runs.filter(run => run.kart_number && run.kart_number !== '');
    console.log('🔄 Adding', filteredRuns.length, 'drivers to dropdown');
    
    filteredRuns.forEach(run => {
            // Main driver dropdown
            if (elements.mainDriverSelect) {
                const option = document.createElement('option');
                option.value = run.kart_number;
                option.textContent = `Kart ${run.kart_number} - ${run.name}`;
                elements.mainDriverSelect.appendChild(option);
            }
            
            // Compare dropdowns
            if (elements.compareDriver1Select) {
                const option1 = document.createElement('option');
                option1.value = run.kart_number;
                option1.textContent = `Kart ${run.kart_number} - ${run.name}`;
                elements.compareDriver1Select.appendChild(option1);
            }
            
            if (elements.compareDriver2Select) {
                const option2 = document.createElement('option');
                option2.value = run.kart_number;
                option2.textContent = `Kart ${run.kart_number} - ${run.name}`;
                elements.compareDriver2Select.appendChild(option2);
            }
        });
}

