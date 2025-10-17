/**
 * Karting Live Timer - HUD View
 * 
 * PURPOSE: Provide full-screen heads-up display focused on main driver
 * WHY: Allows driver to monitor their performance during race
 * FEATURE: HUD View, Driver Focus, Live Timing Display, Drag & Drop Reordering
 */

import { formatDelta } from '../utils/time-formatter.js';
import { getLapColor } from '../utils/ui-helpers.js';
import { calculateConsistency } from '../utils/calculations.js';
import * as LapTrackerService from '../services/lap-tracker.service.js';

// Drag and drop state
let draggedElement = null;
let touchDraggedElement = null;

/**
 * Update the HUD view with main driver's data
 * 
 * PURPOSE: Display focused race data for selected main driver
 * WHY: Primary view for driver to monitor their own performance
 * HOW: Finds driver in session data, updates position, times, lap history, notes
 * FEATURE: HUD View, Driver Focus, Live Performance Tracking
 * 
 * @param {Object} elements - Cached DOM elements
 * @param {Object} sessionData - Current session data from WebSocket
 * @param {Object} state - Application state with settings and records
 * @returns {void}
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
    
    // Update lap count card
    const lapCountEl = document.getElementById('hud-lap-count');
    if (lapCountEl) {
        lapCountEl.textContent = run.total_laps || 0;
    }
    
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
    
    // Update gap to best lap in last lap time box
    // WHY: Shows immediately how far off best lap the last lap was
    // FEATURE: Last Lap Gap Display, Performance Feedback
    const pctOffBestEl = document.getElementById('hud-pct-off-best');
    if (pctOffBestEl && run.last_time_raw && run.best_time_raw) {
        const gapToBest = run.last_time_raw - run.best_time_raw;
        if (gapToBest > 0) {
            const gapSeconds = (gapToBest / 1000).toFixed(3);
            pctOffBestEl.textContent = `+${gapSeconds}s`;
            pctOffBestEl.className = 'hud-sub-value declining';
            pctOffBestEl.style.display = 'block';
        } else if (gapToBest === 0) {
            pctOffBestEl.textContent = 'BEST LAP';
            pctOffBestEl.className = 'hud-sub-value improving';
            pctOffBestEl.style.display = 'block';
        } else {
            pctOffBestEl.style.display = 'none';
        }
    } else if (pctOffBestEl) {
        pctOffBestEl.style.display = 'none';
    }
    
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
    
    // Update lap history display (only if changed to prevent unnecessary resets)
    // WHY: Full re-renders cause visual flicker and reset scroll positions
    const lastLapCount = window._hudLastLapCount || 0;
    const currentLapCount = state.lapHistory[mainDriver]?.length || 0;
    if (currentLapCount !== lastLapCount || !window._hudLastDriver || window._hudLastDriver !== mainDriver) {
        updateLapHistoryDisplay(elements, mainDriver, run.best_time_raw, state.lapHistory, personalBest);
        window._hudLastLapCount = currentLapCount;
        window._hudLastDriver = mainDriver;
    }
    
    // Update driver notes (only if changed)
    const notesCount = state.driverNotes[mainDriver]?.length || 0;
    const lastNotesCount = window._hudLastNotesCount || 0;
    if (notesCount !== lastNotesCount || !window._hudLastDriver) {
        updateDriverNotesDisplay(elements, mainDriver, state.driverNotes);
        window._hudLastNotesCount = notesCount;
    }
}

/**
 * Update session timer display with continuous countdown
 * 
 * PURPOSE: Show real-time session time countdown
 * WHY: Timer should update every second, not just when WebSocket data arrives
 * HOW: Stores target end time, updates display continuously with setInterval
 * FEATURE: HUD Timer, Real-Time Updates, User Experience
 * 
 * @param {Object} elements - DOM elements
 * @param {string} timeLeft - Time left in session (HH:MM:SS or MM:SS)
 * @returns {void}
 */
function updateSessionTimer(elements, timeLeft) {
    if (!elements.hudSessionTimer) return;
    
    // Clear existing timer if any
    if (window._hudTimerInterval) {
        clearInterval(window._hudTimerInterval);
    }
    
    // Parse time left into seconds
    const parseTimeLeft = (timeStr) => {
        if (!timeStr || timeStr === '--:--') return null;
        const parts = timeStr.split(':').map(p => parseInt(p, 10));
        if (parts.length === 3) {
            // HH:MM:SS
            return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
        } else if (parts.length === 2) {
            // MM:SS
            return (parts[0] * 60) + parts[1];
        }
        return null;
    };
    
    const secondsLeft = parseTimeLeft(timeLeft);
    if (secondsLeft === null) {
        elements.hudSessionTimer.textContent = timeLeft || '--:--';
        return;
    }
    
    // Calculate end time
    const endTime = Date.now() + (secondsLeft * 1000);
    
    // Update immediately
    elements.hudSessionTimer.textContent = timeLeft;
    
    // Update every second
    // WHY: Provides smooth countdown without waiting for WebSocket updates
    window._hudTimerInterval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;
        
        if (hours > 0) {
            elements.hudSessionTimer.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            elements.hudSessionTimer.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Stop at zero
        if (remaining === 0) {
            clearInterval(window._hudTimerInterval);
        }
    }, 1000);
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
    
    // Initialize drag and drop after toggle
    setTimeout(() => initializeDragAndDrop(), 2000);
}

/**
 * Initialize drag and drop for HUD cards
 * 
 * PURPOSE: Allow users to reorder HUD cards by dragging
 * WHY: Personalized layout improves UX on small screens
 * HOW: Uses HTML5 Drag & Drop API + Touch events for mobile
 * FEATURE: Drag & Drop, Card Reordering, Mobile Touch Support
 */
function initializeDragAndDrop() {
    const cards = document.querySelectorAll('.hud-card');
    
    cards.forEach(card => {
        // Skip if already initialized
        if (card.getAttribute('data-drag-initialized') === 'true') return;
        card.setAttribute('data-drag-initialized', 'true');
        
        // Make cards draggable
        card.setAttribute('draggable', 'true');
        
        // Desktop drag events
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragleave', handleDragLeave);
        
        // Mobile touch events
        card.addEventListener('touchstart', handleTouchStart, { passive: false });
        card.addEventListener('touchmove', handleTouchMove, { passive: false });
        card.addEventListener('touchend', handleTouchEnd);
    });
}

function handleDragStart(e) {
    draggedElement = e.currentTarget;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.hud-card').forEach(card => card.classList.remove('drag-over'));
}

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
    return false;
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
    
    if (draggedElement !== e.currentTarget) {
        const parent = e.currentTarget.parentElement;
        const draggedIndex = Array.from(parent.children).indexOf(draggedElement);
        const targetIndex = Array.from(parent.children).indexOf(e.currentTarget);
        
        if (draggedIndex < targetIndex) {
            parent.insertBefore(draggedElement, e.currentTarget.nextSibling);
        } else {
            parent.insertBefore(draggedElement, e.currentTarget);
        }
    }
    
    return false;
}

function handleTouchStart(e) {
    if (e.target.classList.contains('hud-toggle-btn')) return;
    touchDraggedElement = e.currentTarget;
    e.currentTarget.classList.add('dragging');
}

function handleTouchMove(e) {
    if (!touchDraggedElement) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (elementBelow && elementBelow.classList.contains('hud-card') && elementBelow !== touchDraggedElement) {
        elementBelow.classList.add('drag-over');
    }
}

function handleTouchEnd(e) {
    if (!touchDraggedElement) return;
    
    touchDraggedElement.classList.remove('dragging');
    
    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    document.querySelectorAll('.hud-card').forEach(card => card.classList.remove('drag-over'));
    
    if (elementBelow && elementBelow.classList.contains('hud-card') && elementBelow !== touchDraggedElement) {
        const parent = touchDraggedElement.parentElement;
        const draggedIndex = Array.from(parent.children).indexOf(touchDraggedElement);
        const targetIndex = Array.from(parent.children).indexOf(elementBelow);
        
        if (draggedIndex < targetIndex) {
            parent.insertBefore(touchDraggedElement, elementBelow.nextSibling);
        } else {
            parent.insertBefore(touchDraggedElement, elementBelow);
        }
    }
    
    touchDraggedElement = null;
}

