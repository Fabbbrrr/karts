// Karting Live Timer - Race View
// Render the race tab with all drivers, positions, and timing

import { formatTime, normalizeTime } from '../utils/time-formatter.js';
import { getLapColor } from '../utils/ui-helpers.js';
import { filterStaleDrivers, TIMESTAMP_THRESHOLDS } from '../utils/timestamp-filter.js';
import { getUniqueTrackConfigs, getTrackConfigName } from '../utils/track-config.js';
import * as LapTrackerService from '../services/lap-tracker.service.js';
import { detectIncidents, getIncidentEmoji } from '../utils/incident-detector.js';

// Track collapsed state (persists across updates)
const trackCollapsedState = {
    'Lakeside': false,  // Expanded by default
    'Penrite': false,
    'Mushroom': false,
    'Rimo': false
};

/**
 * Detect track from kart name
 * Based on venue analysis:
 * - Numeric/no prefix = Lakeside (Super Karts, fastest, 32s record)
 * - P* = Penrite (Sprint Karts, 32s record)
 * - M* = Mushroom (Mini karts, kids)
 * - E* = Rimo or Unknown
 */
function getTrackFromKart(run) {
    const kartName = run.kart || '';
    const firstChar = String(kartName).charAt(0).toUpperCase();
    
    if (firstChar === 'M') return 'Mushroom';
    if (firstChar === 'P') return 'Penrite';
    if (firstChar === 'E') return 'Rimo';
    
    // Numeric or no prefix = Lakeside (Super Karts)
    return 'Lakeside';
}

/**
 * Get track color for pill styling
 */
function getTrackColor(trackName) {
    const colors = {
        'Lakeside': '#ffffff',  // White - Super Karts
        'Penrite': '#808080',   // Grey - Sprint Karts
        'Mushroom': '#ff0000',  // Red - Mini Karts (kids)
        'Rimo': '#ffaa00'       // Orange - Unknown/Rookie
    };
    return colors[trackName] || '#808080';
}

/**
 * Get track order (for display priority)
 */
function getTrackOrder(trackName) {
    const order = {
        'Lakeside': 1,  // Top/default
        'Penrite': 2,
        'Mushroom': 3,
        'Rimo': 4
    };
    return order[trackName] || 99;
}

/**
 * Update the race view with current session data including track configuration
 * 
 * PURPOSE: Display all drivers in current race with live timing data
 * WHY: Primary view for watching multi-driver races in real-time
 * HOW: Updates header, driver list, and click handlers for driver selection
 * FEATURE: Race View, Live Timing Display, Track Configuration Display
 * 
 * @param {Object} elements - Cached DOM elements
 * @param {Object} sessionData - Current session data from WebSocket
 * @param {Object} settings - User preferences and display settings
 * @param {Object} [personalRecords={}] - Driver personal best times
 * @param {Object} [state={}] - Full app state including lap history
 * @returns {void}
 */
export function updateRaceView(elements, sessionData, settings, personalRecords = {}, state = {}) {
    // Validate sessionData
    if (!sessionData || typeof sessionData !== 'object') {
        console.warn('⚠️ Invalid session data in race view');
        return;
    }
    
    // Extract with defaults
    const { 
        event_name = 'RaceFacer Live Timing', 
        current_lap = 0, 
        total_laps = 0, 
        time_left = '', 
        runs = [],  // Always an array
        track_configuration_id = null 
    } = sessionData;
    
    // Update header
    elements.eventName.textContent = event_name;
    elements.sessionInfo.textContent = `Lap ${current_lap}/${total_laps} • ${time_left}`;
    
    // Filter out stale drivers
    let runsWithKarts = runs.filter(run => run.kart_number && run.kart_number !== '');
    let activeRuns = filterStaleDrivers(runsWithKarts, TIMESTAMP_THRESHOLDS.RACE_DISPLAY, true);
    
    // Group by track
    const trackGroups = {
        'Mushroom': [],
        'Penrite': [],
        'Lakeside': [],
        'Rimo': []
    };
    
    activeRuns.forEach(run => {
        const track = getTrackFromKart(run);
        trackGroups[track].push(run);
    });
    
    // Sort each group by BEST LAP TIME (ascending = faster first)
    Object.values(trackGroups).forEach(group => {
        group.sort((a, b) => {
            // Sort by best lap time (lower is better)
            const timeA = a.best_time_raw || 999999999;
            const timeB = b.best_time_raw || 999999999;
            return timeA - timeB; // Ascending: fastest (lowest time) first
        });
        
        // RECALCULATE positions for each track (1 = fastest, 2 = second, etc.)
        group.forEach((run, index) => {
            run.trackPosition = index + 1;
        });
    });
    
    // Update track selector
    updateTrackSelector(elements, trackGroups);
    
    // Get selected track from selector
    const selectedTrack = elements.raceTrackSelector?.value || 'all';
    
    // Don't clear innerHTML - we'll update intelligently to preserve collapse state
    // elements.raceList.innerHTML = '';
    
    // Render selected track or all tracks
    if (selectedTrack === 'all') {
        // Show all tracks with headers (Lakeside first)
        const tracksInOrder = ['Lakeside', 'Penrite', 'Mushroom', 'Rimo'];
        
        // Always recreate the structure for "All Tracks" view to ensure all tracks are rendered
        const hasExistingTracks = elements.raceList.querySelector('[id^="track-header-"]');
        if (!hasExistingTracks) {
            elements.raceList.innerHTML = '';
        }
        
        tracksInOrder.forEach(trackName => {
            const trackRuns = trackGroups[trackName];
            if (!trackRuns || trackRuns.length === 0) return;
            
            renderTrackGroup(elements, trackName, trackRuns, settings, personalRecords, state);
        });
    } else {
        // Show single track (max 15 karts) - clear and rebuild
        elements.raceList.innerHTML = '';
        const trackRuns = trackGroups[selectedTrack] || [];
        if (trackRuns.length > 0) {
            renderTrackGroup(elements, selectedTrack, trackRuns, settings, personalRecords, state, false);
        } else {
            elements.raceList.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">No karts on this track</div>';
        }
    }
}

/**
 * Update track selector dropdown
 */
function updateTrackSelector(elements, trackGroups) {
    if (!elements.raceTrackSelector) {
        // Create selector if it doesn't exist
        const container = document.querySelector('.race-header') || document.querySelector('#race');
        if (container) {
            const selectorHtml = `
                <div class="track-selector-container" style="margin: 10px 0; padding: 10px; background: #1a1a1a; border-radius: 5px;">
                    <label for="race-track-selector" style="margin-right: 10px; color: #ccc;">Track:</label>
                    <select id="race-track-selector" style="padding: 5px 10px; background: #2a2a2a; color: white; border: 1px solid #444; border-radius: 3px;">
                        <option value="all">All Tracks</option>
                    </select>
                </div>
            `;
            container.insertAdjacentHTML('afterbegin', selectorHtml);
            elements.raceTrackSelector = document.getElementById('race-track-selector');
            
            // Add change handler
            elements.raceTrackSelector.addEventListener('change', () => {
                // Trigger view update by dispatching a custom event
                if (window.kartingApp && window.kartingApp.updateAllViews) {
                    window.kartingApp.updateAllViews();
                }
            });
        }
    }
    
    if (elements.raceTrackSelector) {
        const currentValue = elements.raceTrackSelector.value;
        
        // Rebuild options (Lakeside first)
        elements.raceTrackSelector.innerHTML = '<option value="all">All Tracks</option>';
        
        const tracksInOrder = ['Lakeside', 'Penrite', 'Mushroom', 'Rimo'];
        tracksInOrder.forEach(trackName => {
            if (trackGroups[trackName].length > 0) {
                const option = document.createElement('option');
                option.value = trackName;
                option.textContent = `${trackName} (${trackGroups[trackName].length} karts)`;
                elements.raceTrackSelector.appendChild(option);
            }
        });
        
        // Restore selection if still valid
        if (currentValue && [...elements.raceTrackSelector.options].some(opt => opt.value === currentValue)) {
            elements.raceTrackSelector.value = currentValue;
        }
    }
}

/**
 * Render a track group
 */
function renderTrackGroup(elements, trackName, trackRuns, settings, personalRecords, state, showHeader = true) {
    const trackColor = getTrackColor(trackName);
    const trackId = trackName.toLowerCase().replace(/\s+/g, '-');
    
    if (showHeader) {
        // Check if header and container already exist
        let header = document.getElementById(`track-header-${trackId}`);
        let container = document.getElementById(`track-container-${trackId}`);
        let toggle = document.getElementById(`track-toggle-${trackId}`);
        
        if (!header || !container) {
            // Create new header and container
            header = document.createElement('div');
            header.id = `track-header-${trackId}`;
            header.className = 'track-group-header';
            header.style.cssText = 'cursor: pointer; user-select: none;';
            header.innerHTML = `
                <h3 style="margin: 15px 0 5px 0; padding: 10px; background: #2a2a2a; border-left: 4px solid ${trackColor}; font-size: 1.1em; display: flex; align-items: center; justify-content: space-between;">
                    <span>
                        <span id="track-toggle-${trackId}" style="display: inline-block; width: 20px;">${trackCollapsedState[trackName] ? '▶' : '▼'}</span>
                        🏁 ${trackName} Track (<span id="track-count-${trackId}">${trackRuns.length}</span> karts)
                    </span>
                    <span style="font-size: 0.85em; color: #888;">Click to expand/collapse</span>
                </h3>
            `;
            
            // Toggle collapse on click
            header.addEventListener('click', () => {
                const containerEl = document.getElementById(`track-container-${trackId}`);
                const toggleEl = document.getElementById(`track-toggle-${trackId}`);
                if (containerEl && toggleEl) {
                    const isCollapsed = containerEl.style.display === 'none';
                    containerEl.style.display = isCollapsed ? 'block' : 'none';
                    toggleEl.textContent = isCollapsed ? '▼' : '▶';
                    trackCollapsedState[trackName] = !isCollapsed;
                }
            });
            
            elements.raceList.appendChild(header);
            
            // Create container for karts (collapsible)
            container = document.createElement('div');
            container.id = `track-container-${trackId}`;
            container.style.display = trackCollapsedState[trackName] ? 'none' : 'block';
            elements.raceList.appendChild(container);
        } else {
            // Update kart count in existing header
            const countEl = document.getElementById(`track-count-${trackId}`);
            if (countEl) {
                countEl.textContent = trackRuns.length;
            }
            // Clear existing container content
            container.innerHTML = '';
        }
        
        // Add karts (limit to 15 per track)
        const displayRuns = trackRuns.slice(0, 15);
        displayRuns.forEach(run => {
            const item = createRaceItem(run, settings, personalRecords, state, trackName);
            container.appendChild(item);
        });
        
        // Show warning if more than 15 karts
        if (trackRuns.length > 15) {
            const warning = document.createElement('div');
            warning.style.cssText = 'padding: 10px; text-align: center; color: #ff9900; font-style: italic;';
            warning.textContent = `⚠️ Showing top 15 of ${trackRuns.length} karts`;
            container.appendChild(warning);
        }
    } else {
        // No header, just show karts (for single track view)
        const displayRuns = trackRuns.slice(0, 15);
        displayRuns.forEach(run => {
            const item = createRaceItem(run, settings, personalRecords, state, trackName);
            elements.raceList.appendChild(item);
        });
        
        // Show warning if more than 15 karts
        if (trackRuns.length > 15) {
            const warning = document.createElement('div');
            warning.style.cssText = 'padding: 10px; text-align: center; color: #ff9900; font-style: italic;';
            warning.textContent = `⚠️ Showing top 15 of ${trackRuns.length} karts`;
            elements.raceList.appendChild(warning);
        }
    }
}

/**
 * Update track configuration filter dropdown for race view
 * 
 * PURPOSE: Allow user to filter race view by track configuration
 * WHY: Multi-track venues may have drivers on different layouts simultaneously
 * HOW: Detects available track configs, populates dropdown, auto-selects if only one
 * FEATURE: Track Configuration Filtering, Auto-Selection, User Interface
 * 
 * @param {Object} elements - DOM elements
 * @param {Array} runs - Current session runs
 * @param {string|number} currentTrackConfig - Current session's track configuration ID
 * @returns {void}
 */
function updateRaceTrackConfigFilter(elements, runs, currentTrackConfig) {
    if (!elements.raceTrackConfigFilter || !elements.raceFilterSection) return;
    
    // Get unique track configurations from current runs
    const trackConfigs = new Set();
    if (currentTrackConfig) {
        trackConfigs.add(String(currentTrackConfig));
    }
    
    const trackConfigsArray = Array.from(trackConfigs);
    
    // Store current selection
    const currentSelection = elements.raceTrackConfigFilter.value || 'all';
    
    // Rebuild options
    elements.raceTrackConfigFilter.innerHTML = '<option value="all">All Track Configurations</option>';
    
    trackConfigsArray.forEach(configId => {
        const option = document.createElement('option');
        option.value = configId;
        option.textContent = getTrackConfigName(configId);
        elements.raceTrackConfigFilter.appendChild(option);
    });
    
    // Auto-select if only one configuration exists
    if (trackConfigsArray.length === 1) {
        elements.raceTrackConfigFilter.value = trackConfigsArray[0];
        elements.raceFilterSection.style.display = 'none'; // Hide filter if only one option
    } else if (trackConfigsArray.length > 1) {
        // Show filter for multiple configs
        elements.raceFilterSection.style.display = 'block';
        // Restore selection if it still exists
        if (currentSelection !== 'all' && trackConfigsArray.includes(currentSelection)) {
            elements.raceTrackConfigFilter.value = currentSelection;
        }
    } else {
        // No track configs - hide filter
        elements.raceFilterSection.style.display = 'none';
    }
}

/**
 * Create a race item element with touch-safe event handling
 * 
 * PURPOSE: Create clickable race item that doesn't trigger on scroll
 * WHY: Android browsers interpret scroll lift-off as tap, causing unwanted driver selection
 * HOW: Tracks touch start/move/end positions to distinguish scroll from tap
 * FEATURE: Race View, Touch Event Handling, Mobile UX
 * 
 * @param {Object} run - Driver run data
 * @param {Object} settings - User settings
 * @param {Object} personalRecords - Personal records state
 * @param {Object} state - Full app state including lap history
 * @returns {HTMLElement} Race item div
 */
function createRaceItem(run, settings, personalRecords, state, trackName = '') {
    const div = document.createElement('div');
    div.className = 'race-item';
    div.dataset.kartNumber = run.kart_number;
    div.dataset.trackName = trackName; // Store track name
    div.style.cursor = 'pointer';
    
    // Touch tracking for scroll vs tap detection
    // WHY: Prevents accidental driver selection when scrolling on mobile
    let touchStartY = 0;
    let touchStartX = 0;
    let touchStartTime = 0;
    const SCROLL_THRESHOLD = 16; // pixels — more forgiving for gloved hands
    const TAP_TIME_THRESHOLD = 400; // ms — allows slightly slower taps while driving
    
    div.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
    }, { passive: true });
    
    div.addEventListener('touchend', (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndTime = Date.now();
        
        const deltaY = Math.abs(touchEndY - touchStartY);
        const deltaX = Math.abs(touchEndX - touchStartX);
        const deltaTime = touchEndTime - touchStartTime;
        
        // Only trigger if movement is small and quick (actual tap, not scroll)
        if (deltaY < SCROLL_THRESHOLD && deltaX < SCROLL_THRESHOLD && deltaTime < TAP_TIME_THRESHOLD) {
            if (window.kartingApp && window.kartingApp.selectDriverAndSwitchToHUD) {
                window.kartingApp.selectDriverAndSwitchToHUD(run.kart_number);
            }
        }
    });
    
    // Desktop click handler (no touch events on desktop)
    div.addEventListener('click', (e) => {
        // Only handle if not a touch device (touch devices use touchend)
        if (!('ontouchstart' in window)) {
            if (window.kartingApp && window.kartingApp.selectDriverAndSwitchToHUD) {
                window.kartingApp.selectDriverAndSwitchToHUD(run.kart_number);
            }
        }
    });
    
    updateRaceItemContent(div, run, settings, personalRecords, state);
    
    return div;
}

/**
 * Update race item content
 * @param {HTMLElement} div - Race item element
 * @param {Object} run - Driver run data
 * @param {Object} settings - User settings
 * @param {Object} personalRecords - Personal records state
 * @param {Object} state - Full app state including lap history
 */
function updateRaceItemContent(div, run, settings, personalRecords, state) {
    // Update classes
    div.className = 'race-item';
    if (settings.mainDriver && run.kart_number === settings.mainDriver) {
        div.classList.add('main-driver');
    }
    
    // Use track position if available, otherwise fall back to overall position
    const displayPosition = run.trackPosition || run.pos || run.position || 0;
    const positionClass = displayPosition <= 3 ? `p${displayPosition}` : '';
    
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
            <span class="race-detail-value last">${normalizeTime(run.last_time)}</span>
        </div>`);
    }

    if (settings.showAvgLap && run.avg_lap) {
        details.push(`<div class="race-detail-item">
            <span class="race-detail-label">Avg:</span>
            <span class="race-detail-value">${normalizeTime(run.avg_lap)}</span>
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
            <span class="race-detail-value pb">${normalizeTime(personalBest.bestLapFormatted)}</span>
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
    
    // Add incident detection if lap history is available
    if (state && state.lapHistory && state.lapHistory[run.kart_number]) {
        const incidentAnalysis = detectIncidents(state.lapHistory[run.kart_number]);
        if (incidentAnalysis && incidentAnalysis.totalIncidents > 0) {
            const emoji = getIncidentEmoji(incidentAnalysis.totalIncidents);
            const tooltip = incidentAnalysis.severeIncidents > 0 
                ? `${incidentAnalysis.severeIncidents} major, ${incidentAnalysis.minorIncidents} minor`
                : `${incidentAnalysis.totalIncidents} incident${incidentAnalysis.totalIncidents > 1 ? 's' : ''}`;
            details.push(`<div class="race-detail-item" title="${tooltip}">
                <span class="race-detail-label">${emoji}</span>
                <span class="race-detail-value incidents">${incidentAnalysis.totalIncidents}</span>
            </div>`);
        }
    }
    
    // Update content
    const trackName = div.dataset.trackName || getTrackFromKart(run);
    const trackColor = getTrackColor(trackName);
    const kartName = run.kart || run.kart_number || 'Unknown';
    
    // Track badge - smaller and less visible
    const trackBadge = `<span class="track-badge" style="display: inline-block; background: ${trackColor}; color: ${trackName === 'Lakeside' ? '#666' : '#aaa'}; padding: 1px 4px; border-radius: 4px; font-size: 0.55em; font-weight: normal; margin-left: 6px; opacity: 0.6;">${trackName}</span>`;
    
    div.innerHTML = `
        <div class="race-position ${positionClass}">P${displayPosition}</div>
        <div class="race-driver-info">
            <div class="race-driver-name" style="font-size: 1.15em; font-weight: bold; margin-bottom: 2px;">
                ${run.name}
                ${trackBadge}
            </div>
            <div class="race-driver-kart" style="font-size: 0.85em; color: #888; margin-bottom: 4px;">Kart ${kartName}</div>
            <div class="race-driver-details">
                ${details.join('')}
            </div>
        </div>
        <div class="race-timing">
            <div class="race-best-time" style="font-size: 1.2em; font-weight: bold;">${normalizeTime(run.best_time)}</div>
            ${settings.showGaps ? `<div class="race-gap">${run.gap}</div>` : ''}
            ${settings.showLastLap && run.last_time ? `<div class="race-last-time" style="font-size: 1.05em; color: #aaa; margin-top: 2px;">Last: ${normalizeTime(run.last_time)}</div>` : ''}
        </div>
    `;
}

/**
 * Update driver dropdown in settings
 * @param {Object} elements - DOM elements
 * @param {Object} sessionData - Current session data
 */
export function updateDriverDropdown(elements, sessionData, state) {
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
    
    // PRESERVE compare driver selections before clearing
    const compareDriver1Value = elements.compareDriver1Select?.value || '';
    const compareDriver2Value = elements.compareDriver2Select?.value || '';
    
    // Clear compare dropdowns
    if (elements.compareDriver1Select) {
        elements.compareDriver1Select.innerHTML = '<option value="">-- Select Driver --</option>';
    }
    if (elements.compareDriver2Select) {
        elements.compareDriver2Select.innerHTML = '<option value="">-- Select Driver --</option>';
    }
    
    // Clear HUD dropdowns
    if (elements.hudDriverSelect) {
        elements.hudDriverSelect.innerHTML = '<option value="">-- Select Kart --</option>';
    }
    if (elements.hudQuickDriverSelect) {
        elements.hudQuickDriverSelect.innerHTML = '<option value="">-- Select Kart --</option>';
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
            
            // HUD driver dropdowns
            if (elements.hudDriverSelect) {
                const hudOption = document.createElement('option');
                hudOption.value = run.kart_number;
                hudOption.textContent = `Kart ${run.kart_number} - ${run.name}`;
                elements.hudDriverSelect.appendChild(hudOption);
            }
            
            if (elements.hudQuickDriverSelect) {
                const hudQuickOption = document.createElement('option');
                hudQuickOption.value = run.kart_number;
                hudQuickOption.textContent = `Kart ${run.kart_number} - ${run.name}`;
                elements.hudQuickDriverSelect.appendChild(hudQuickOption);
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
    
    // RESTORE compare driver selections after populating
    if (elements.compareDriver1Select && compareDriver1Value) {
        elements.compareDriver1Select.value = compareDriver1Value;
    }
    if (elements.compareDriver2Select && compareDriver2Value) {
        elements.compareDriver2Select.value = compareDriver2Value;
    }
    
    // Restore all driver selects to the persisted main driver
    const currentMainDriver = state?.settings?.mainDriver || null;
    if (currentMainDriver) {
        if (elements.mainDriverSelect) elements.mainDriverSelect.value = currentMainDriver;
        if (elements.hudDriverSelect) elements.hudDriverSelect.value = currentMainDriver;
        if (elements.hudQuickDriverSelect) elements.hudQuickDriverSelect.value = currentMainDriver;
    }
}

