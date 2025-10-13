// Karting Live Timer - Lap Tracker Service
// Track lap history, gaps, positions, and trends

/**
 * Update lap history for all drivers
 * @param {Object} sessionData - Current session data
 * @param {Object} lapHistory - Lap history state object
 * @param {Object} positionHistory - Position history state object
 * @param {Function} onNewLap - Callback when new lap detected
 * @returns {Object} Updated lap and position history
 */
export function updateLapHistory(sessionData, lapHistory, positionHistory, onNewLap) {
    if (!sessionData || !sessionData.runs) return { lapHistory, positionHistory };
    
    sessionData.runs.forEach(run => {
        if (!run.kart_number || !run.last_time_raw) return;
        
        const kartNumber = run.kart_number;
        
        // Initialize history for this kart if not exists
        if (!lapHistory[kartNumber]) {
            lapHistory[kartNumber] = [];
        }
        
        if (!positionHistory[kartNumber]) {
            positionHistory[kartNumber] = [];
        }
        
        const history = lapHistory[kartNumber];
        const lapCount = run.total_laps;
        
        // Check if this is a new lap (lap count increased)
        if (history.length === 0 || history[history.length - 1].lapNum < lapCount) {
            // New lap detected
            const lapData = {
                lapNum: lapCount,
                time: run.last_time,
                timeRaw: run.last_time_raw,
                bestTimeRaw: run.best_time_raw,
                delta: 0,
                position: run.pos
            };
            
            // Calculate delta from best lap
            if (run.best_time_raw && run.last_time_raw) {
                lapData.delta = run.last_time_raw - run.best_time_raw;
            }
            
            history.push(lapData);
            
            // Track position history for chart
            positionHistory[kartNumber].push({
                lapNum: lapCount,
                position: run.pos
            });
            
            // Keep only last 20 laps
            if (history.length > 20) {
                history.shift();
            }
            
            // Call callback with new lap
            if (onNewLap) {
                onNewLap(run, lapCount, lapData);
            }
        }
    });
    
    return { lapHistory, positionHistory };
}

/**
 * Track gap trends over time
 * @param {string} kartNumber - Kart number
 * @param {string|number} gap - Current gap to leader
 * @param {Object} gapHistory - Gap history state object
 * @returns {Object} Updated gap history
 */
export function trackGapTrend(kartNumber, gap, gapHistory) {
    if (!gap || gap === '-') return gapHistory;
    
    // Parse gap value
    const match = gap.toString().match(/\+?([\d.]+)/);
    if (!match) return gapHistory;
    
    const gapValue = parseFloat(match[1]);
    
    // Initialize history for this kart if not exists
    if (!gapHistory[kartNumber]) {
        gapHistory[kartNumber] = [];
    }
    
    // Add to history
    gapHistory[kartNumber].push({
        timestamp: Date.now(),
        gap: gapValue
    });
    
    // Keep only last 10 data points
    if (gapHistory[kartNumber].length > 10) {
        gapHistory[kartNumber].shift();
    }
    
    return gapHistory;
}

/**
 * Detect and check best lap for celebration
 * @param {string} kartNumber - Kart number
 * @param {number} bestTimeRaw - Current best lap time
 * @param {Object} lastBestLap - Last best lap state object
 * @returns {boolean} True if new best lap detected
 */
export function checkBestLapCelebration(kartNumber, bestTimeRaw, lastBestLap) {
    if (!bestTimeRaw) return false;
    
    const lastBest = lastBestLap[kartNumber];
    
    // If we have a previous best and current is better
    if (lastBest && bestTimeRaw < lastBest) {
        lastBestLap[kartNumber] = bestTimeRaw;
        return true; // New best lap!
    }
    
    // First lap or initialize
    if (!lastBest) {
        lastBestLap[kartNumber] = bestTimeRaw;
        return false;
    }
    
    return false;
}

/**
 * Track session best lap
 * @param {Object} sessionData - Current session data
 * @param {Object} sessionBest - Current session best
 * @returns {Object|null} Updated session best
 */
export function updateSessionBest(sessionData, sessionBest) {
    if (!sessionData || !sessionData.runs) return sessionBest;
    
    let best = sessionBest;
    
    sessionData.runs.forEach(run => {
        if (run.best_time_raw && (!best || run.best_time_raw < best.timeRaw)) {
            best = {
                kartNumber: run.kart_number,
                name: run.name,
                time: run.best_time,
                timeRaw: run.best_time_raw
            };
        }
    });
    
    return best;
}

/**
 * Update personal records for a driver
 * @param {Object} run - Driver run data
 * @param {Object} personalRecords - Personal records state
 * @returns {Object} Updated personal records and whether it's a new PB
 */
export function updatePersonalRecords(run, personalRecords) {
    if (!run || !run.name || !run.last_time_raw) {
        return { updated: personalRecords, isNewPB: false };
    }
    
    const driverName = run.name;
    const lapTime = run.last_time_raw;
    
    // Initialize driver record if doesn't exist
    if (!personalRecords[driverName]) {
        personalRecords[driverName] = {
            bestLap: lapTime,
            bestLapFormatted: run.last_time,
            kartNumber: run.kart_number,
            timestamp: Date.now(),
            sessionName: null
        };
        return { updated: personalRecords, isNewPB: true };
    }
    
    // Check if this is a new personal best
    const currentPB = personalRecords[driverName].bestLap;
    if (lapTime < currentPB) {
        personalRecords[driverName] = {
            bestLap: lapTime,
            bestLapFormatted: run.last_time,
            kartNumber: run.kart_number,
            timestamp: Date.now(),
            sessionName: null
        };
        return { updated: personalRecords, isNewPB: true };
    }
    
    return { updated: personalRecords, isNewPB: false };
}

/**
 * Get personal best for a driver
 * @param {string} driverName - Driver name
 * @param {Object} personalRecords - Personal records state
 * @returns {Object|null} Personal best info or null
 */
export function getPersonalBest(driverName, personalRecords) {
    if (!driverName || !personalRecords || !personalRecords[driverName]) {
        return null;
    }
    
    return personalRecords[driverName];
}

/**
 * Calculate gap to personal best
 * @param {number} currentLapTime - Current lap time in ms
 * @param {number} personalBestTime - Personal best time in ms
 * @returns {Object} Gap info with value and formatted string
 */
export function calculateGapToPersonalBest(currentLapTime, personalBestTime) {
    if (!currentLapTime || !personalBestTime) {
        return { gap: 0, formatted: '-', isPositive: false };
    }
    
    const gap = currentLapTime - personalBestTime;
    const gapSeconds = (gap / 1000).toFixed(3);
    
    if (gap > 0) {
        return { 
            gap, 
            formatted: `+${gapSeconds}`, 
            isPositive: true 
        };
    } else if (gap < 0) {
        return { 
            gap, 
            formatted: gapSeconds, 
            isPositive: false 
        };
    }
    
    return { gap: 0, formatted: '0.000', isPositive: false };
}

/**
 * Detect session change
 * @param {Object} sessionData - Current session data
 * @param {string} currentSessionId - Current session ID
 * @param {Object} lapHistory - Lap history state
 * @returns {Object} Detection result with needsReset flag
 */
export function detectSessionChange(sessionData, currentSessionId, lapHistory) {
    if (!sessionData) {
        return { needsReset: false, sessionId: currentSessionId };
    }
    
    // Create session identifier
    const sessionId = `${sessionData.event_name}_${sessionData.session_name || 'default'}`;
    const currentLap = sessionData.current_lap || 0;
    
    // Check if this is a new session
    if (currentSessionId && currentSessionId !== sessionId) {
        console.log('🔄 New session detected! Resetting lap data...');
        console.log(`Previous: ${currentSessionId}, New: ${sessionId}`);
        return { needsReset: true, sessionId };
    }
    
    // Also detect session restart if lap count goes back to start
    if (currentSessionId === sessionId) {
        // Check if we went from lap 3+ back to lap 0-2 (session restart)
        const hadLapData = Object.keys(lapHistory).some(kart => 
            lapHistory[kart] && lapHistory[kart].length > 3
        );
        
        if (hadLapData && currentLap <= 2) {
            console.log('🔄 Session restart detected (lap counter reset)! Resetting lap data...');
            return { needsReset: true, sessionId };
        }
    }
    
    return { needsReset: false, sessionId };
}

/**
 * Reset all session-specific tracking data
 * @returns {Object} Empty tracking objects
 */
export function resetTrackingData() {
    return {
        lapHistory: {},
        startingPositions: {},
        gapHistory: {},
        sessionBest: null,
        lastBestLap: {},
        lastGap: {},
        lastPosition: {},
        positionHistory: {}
    };
}

/**
 * Track starting positions for comparison
 * @param {Object} sessionData - Current session data
 * @param {Object} startingPositions - Starting positions state
 * @returns {Object} Updated starting positions
 */
export function trackStartingPositions(sessionData, startingPositions) {
    if (!sessionData || !sessionData.runs) return startingPositions;
    
    sessionData.runs.forEach(run => {
        if (run.kart_number && !startingPositions[run.kart_number]) {
            startingPositions[run.kart_number] = run.pos;
        }
    });
    
    return startingPositions;
}

/**
 * Get position changes for a driver
 * @param {string} kartNumber - Kart number
 * @param {number} currentPosition - Current position
 * @param {Object} startingPositions - Starting positions state
 * @returns {Object} Position change info
 */
export function getPositionChange(kartNumber, currentPosition, startingPositions) {
    const startPos = startingPositions[kartNumber];
    
    if (!startPos) {
        return { change: 0, text: '-' };
    }
    
    const change = startPos - currentPosition;
    
    if (change > 0) {
        return { change, text: `↑ +${change}`, improved: true };
    } else if (change < 0) {
        return { change, text: `↓ ${change}`, improved: false };
    }
    
    return { change: 0, text: '−', improved: false };
}

