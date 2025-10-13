// Karting Live Timer - HUD View
// Full-screen heads-up display for main driver

import { formatDelta } from '../utils/time-formatter.js';
import { getLapColor } from '../utils/ui-helpers.js';
import { calculateConsistency } from '../utils/calculations.js';
import * as LapTrackerService from '../services/lap-tracker.service.js';

/**
 * Update the HUD view for main driver
 * @param {Object} elements - DOM elements
 * @param {Object} sessionData - Current session data
 * @param {Object} state - Application state
 */
export function updateHUDView(elements, sessionData, state) {
    console.log('🎯 updateHUDView called', {
        hasSessionData: !!sessionData,
        mainDriver: state.settings.mainDriver,
        runCount: sessionData?.runs?.length
    });
    
    if (!sessionData) {
        console.warn('⚠️ No session data in HUD view');
        return;
    }
    
    const mainDriver = state.settings.mainDriver;
    
    if (!mainDriver) {
        console.warn('⚠️ No main driver selected');
        elements.hudNoDriver.style.display = 'flex';
        elements.hudContent.classList.add('hidden');
        return;
    }
    
    const run = sessionData.runs.find(r => r.kart_number === mainDriver);
    
    if (!run) {
        console.warn('⚠️ Driver not found in session data:', mainDriver);
        console.log('Available kart numbers:', sessionData.runs.map(r => r.kart_number));
        elements.hudNoDriver.style.display = 'flex';
        elements.hudContent.classList.add('hidden');
        return;
    }
    
    console.log('✅ HUD displaying driver:', mainDriver, run.name);
    
    // Show HUD content
    elements.hudNoDriver.style.display = 'none';
    elements.hudContent.classList.remove('hidden');
    
    // Update header
    elements.hudEventName.textContent = sessionData.event_name;
    elements.hudLapInfo.textContent = `Lap ${sessionData.current_lap}/${sessionData.total_laps}`;
    
    // Update session timer
    updateSessionTimer(elements, sessionData.time_left);
    
    // Update header stat badges
    updateHeaderBadges(elements, mainDriver, run, state);
    
    // Update position and kart
    const positionClass = run.pos <= 3 ? `p${run.pos}` : '';
    elements.hudPosition.className = `hud-position ${positionClass}`;
    elements.hudPosition.textContent = `P${run.pos}`;
    elements.hudKart.textContent = `KART ${run.kart_number}`;
    
    // Update timing data
    elements.hudLastTime.textContent = run.last_time || '--.-';
    elements.hudBestTime.textContent = run.best_time || '--.-';
    elements.hudAvgTime.textContent = run.avg_lap || '--.-';
    elements.hudGap.textContent = run.gap || '-';
    elements.hudInterval.textContent = run.int || '-';
    elements.hudConsistency.textContent = run.consistency_lap || '-';
    
    // Update personal best and gap to PB
    const personalBest = LapTrackerService.getPersonalBest(run.name, state.personalRecords);
    const hudPersonalBestEl = document.getElementById('hud-personal-best');
    const hudPBGapEl = document.getElementById('hud-pb-gap');
    
    if (hudPersonalBestEl) {
        hudPersonalBestEl.textContent = personalBest ? personalBest.bestLapFormatted : '--.-';
    }
    
    if (hudPBGapEl && personalBest && run.last_time_raw) {
        const pbGap = LapTrackerService.calculateGapToPersonalBest(run.last_time_raw, personalBest.bestLap);
        if (pbGap.formatted !== '-') {
            hudPBGapEl.textContent = pbGap.formatted;
            hudPBGapEl.className = pbGap.isPositive ? 'positive' : 'negative';
        } else {
            hudPBGapEl.textContent = '-';
            hudPBGapEl.className = '';
        }
    } else if (hudPBGapEl) {
        hudPBGapEl.textContent = '-';
        hudPBGapEl.className = '';
    }
    
    // Update consistency score
    const consistencyScoreEl = document.getElementById('hud-consistency-score');
    if (consistencyScoreEl) {
        const consistencyScore = calculateConsistencyScore(mainDriver, state.lapHistory);
        consistencyScoreEl.textContent = `${consistencyScore}%`;
    }
    
    // Update lap history display
    updateLapHistoryDisplay(elements, mainDriver, run.best_time_raw, state.lapHistory, personalBest);
    
    // Update driver notes
    updateDriverNotesDisplay(elements, mainDriver, state.driverNotes);
}

/**
 * Update session timer display
 * @param {Object} elements - DOM elements
 * @param {string} timeLeft - Time left in session
 */
function updateSessionTimer(elements, timeLeft) {
    if (elements.hudSessionTimer) {
        elements.hudSessionTimer.textContent = timeLeft || '--:--';
    }
}

/**
 * Update header stat badges
 * @param {Object} elements - DOM elements
 * @param {string} kartNumber - Kart number
 * @param {Object} run - Driver run data
 * @param {Object} state - Application state
 */
function updateHeaderBadges(elements, kartNumber, run, state) {
    // Laps completed
    const lapsEl = document.getElementById('hud-header-laps');
    if (lapsEl) {
        lapsEl.textContent = `${run.total_laps} Laps`;
    }
    
    // Position change
    const posChangeEl = document.getElementById('hud-header-position-change');
    if (posChangeEl && state.startingPositions[kartNumber]) {
        const startPos = state.startingPositions[kartNumber];
        const change = startPos - run.pos;
        if (change > 0) {
            posChangeEl.textContent = `↑ +${change}`;
            posChangeEl.className = 'hud-badge positive';
        } else if (change < 0) {
            posChangeEl.textContent = `↓ ${change}`;
            posChangeEl.className = 'hud-badge negative';
        } else {
            posChangeEl.textContent = '−';
            posChangeEl.className = 'hud-badge neutral';
        }
        posChangeEl.style.display = 'inline-block';
    } else if (posChangeEl) {
        posChangeEl.style.display = 'none';
    }
}

/**
 * Update lap history display
 * @param {Object} elements - DOM elements
 * @param {string} kartNumber - Kart number
 * @param {number} bestTimeRaw - Best lap time in ms
 * @param {Object} lapHistory - Lap history state
 * @param {Object} personalBest - Personal best info
 */
function updateLapHistoryDisplay(elements, kartNumber, bestTimeRaw, lapHistory, personalBest) {
    const hudLapList = elements.hudLapList;
    if (!hudLapList) return;
    
    const history = lapHistory[kartNumber];
    
    if (!history || history.length === 0) {
        hudLapList.innerHTML = '<div class="hud-no-laps">No lap data yet...</div>';
        return;
    }
    
    // Reverse to show newest first
    const reversedHistory = [...history].reverse();
    
    hudLapList.innerHTML = '';
    
    reversedHistory.forEach(lap => {
        const div = document.createElement('div');
        div.className = 'hud-lap-item';
        
        // F1-style color coding
        const lapColor = getLapColor(lap, bestTimeRaw);
        div.classList.add(`lap-${lapColor}`);
        
        // Mark best lap
        if (bestTimeRaw && lap.timeRaw === bestTimeRaw) {
            div.classList.add('best');
        }
        
        // Mark if it's the personal best
        if (personalBest && lap.timeRaw === personalBest.bestLap) {
            div.classList.add('personal-best');
        }
        
        // Format delta (to session best)
        let deltaText = '-';
        let deltaClass = 'neutral';
        
        if (lap.delta !== 0 && lap.delta !== null && !isNaN(lap.delta)) {
            const deltaSeconds = (lap.delta / 1000).toFixed(3);
            if (lap.delta > 0) {
                deltaText = `+${deltaSeconds}`;
                deltaClass = 'positive';
            } else {
                deltaText = deltaSeconds;
                deltaClass = 'negative';
            }
        } else if (lap.delta === 0) {
            deltaText = '0.000';
            deltaClass = 'neutral';
        }
        
        // Calculate gap to PB
        let pbGapText = '';
        if (personalBest) {
            const pbGap = LapTrackerService.calculateGapToPersonalBest(lap.timeRaw, personalBest.bestLap);
            if (pbGap.formatted !== '-') {
                pbGapText = `<div class="hud-lap-pb-gap ${pbGap.isPositive ? 'positive' : 'negative'}">${pbGap.formatted}</div>`;
            }
        }
        
        div.innerHTML = `
            <div class="hud-lap-number">L${lap.lapNum}</div>
            <div class="hud-lap-time">${lap.time}</div>
            <div class="hud-lap-delta ${deltaClass}">${deltaText}</div>
            ${pbGapText}
        `;
        
        hudLapList.appendChild(div);
    });
}

/**
 * Update driver notes display
 * @param {Object} elements - DOM elements
 * @param {string} kartNumber - Kart number
 * @param {Object} driverNotes - Driver notes state
 */
function updateDriverNotesDisplay(elements, kartNumber, driverNotes) {
    const notesList = elements.hudNotesList;
    if (!notesList) return;
    
    const notes = driverNotes[kartNumber] || [];
    
    if (notes.length === 0) {
        notesList.innerHTML = '<div class="hud-no-notes">No notes yet</div>';
        return;
    }
    
    notesList.innerHTML = '';
    
    // Show notes in reverse order (newest first)
    [...notes].reverse().forEach(note => {
        const div = document.createElement('div');
        div.className = 'hud-note-item';
        
        const time = new Date(note.timestamp).toLocaleTimeString();
        
        div.innerHTML = `
            <div class="hud-note-lap">Lap ${note.lapNum}</div>
            <div class="hud-note-text">${note.note}</div>
            <div class="hud-note-time">${time}</div>
        `;
        
        notesList.appendChild(div);
    });
}

/**
 * Calculate consistency score for a driver
 * @param {string} kartNumber - Kart number
 * @param {Object} lapHistory - Lap history state
 * @returns {number} Consistency score (0-100)
 */
function calculateConsistencyScore(kartNumber, lapHistory) {
    const history = lapHistory[kartNumber];
    if (!history || history.length < 3) return 0;
    
    const lapTimes = history.map(lap => lap.timeRaw);
    return calculateConsistency(lapTimes);
}

/**
 * Apply HUD card visibility based on settings
 * @param {Object} elements - DOM elements
 * @param {Object} settings - User settings
 */
export function applyHUDCardVisibility(elements, settings) {
    // Helper to toggle card visibility
    const toggleCard = (cardId, visible) => {
        const card = document.getElementById(cardId);
        if (card) {
            card.style.display = visible ? '' : 'none';
        }
    };
    
    toggleCard('hud-card-last-lap', settings.hudShowLastLap);
    toggleCard('hud-card-best-lap', settings.hudShowBestLap);
    toggleCard('hud-card-avg-lap', settings.hudShowAvgLap);
    toggleCard('hud-card-gap', settings.hudShowGap);
    toggleCard('hud-card-interval', settings.hudShowInterval);
    toggleCard('hud-card-consistency', settings.hudShowConsistency);
    toggleCard('hud-card-lap-history', settings.hudShowLapHistory);
    toggleCard('hud-card-stats', settings.hudShowStats);
}

