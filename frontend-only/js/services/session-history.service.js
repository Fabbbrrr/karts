/**
 * Frontend-Only Session History Service
 *
 * PURPOSE: Save and retrieve past race sessions for review
 * WHY: Users want to compare past performance and review historical data
 * HOW: Stores session snapshots in localStorage (browser-only, no server)
 * FEATURE: Session History, Historical Data Retrieval, Auto-save
 */

const STORAGE_KEY = 'karting_session_history';
const MAX_SESSIONS = 20;
const LAP_TIME_THRESHOLD = 60000; // 60 seconds

/**
 * Get all saved session history (local only)
 * 
 * PURPOSE: Retrieve list of past sessions from localStorage
 * WHY: Populate dropdown selector with available sessions
 * 
 * @returns {Array} Array of session objects, newest first
 */
export function getLocalSessionHistory() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        
        const sessions = JSON.parse(stored);
        // Sort by timestamp, newest first
        return sessions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
        console.error('❌ Error loading session history:', error);
        return [];
    }
}

/**
 * Get all saved session history (local only)
 *
 * PURPOSE: Retrieve list of past sessions from localStorage
 * WHY: Populate dropdown selector with available sessions
 *
 * @returns {Promise<Array>} Array of session objects, newest first
 */
export async function getSessionHistory() {
    return getLocalSessionHistory();
}

/**
 * Save current session to history
 * 
 * PURPOSE: Persist session data for later review
 * WHY: Auto-save sessions when they change or end
 * 
 * @param {Object} sessionData - Current session data from WebSocket
 * @param {string} currentSessionId - Current session identifier
 * @returns {Promise<Object|null>} Saved session object or null if failed
 */
export async function saveCurrentSession(sessionData, currentSessionId) {
    try {
        if (!sessionData || !sessionData.runs || sessionData.runs.length === 0) {
            console.log('⏭️ No session data to save');
            return null;
        }
        
        // Don't save mock data
        if (sessionData.isMock) {
            console.log('🎭 Skipping save of mock session data');
            return null;
        }
        
        // Find winner (driver with best lap time under threshold)
        const winner = findSessionWinner(sessionData.runs);
        
        // Generate session metadata
        const now = new Date();
        const sessionObj = {
            sessionId: currentSessionId,
            timestamp: now.getTime(),
            date: now.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            }),
            startTime: now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            }),
            trackConfigId: sessionData.runs[0]?.track_configuration_id || 'unknown',
            eventName: sessionData.event_name || 'Race Session',
            winner: winner,
            sessionData: sessionData, // Store full session data
            stats: {
                totalDrivers: sessionData.runs.length,
                totalLaps: Math.max(...sessionData.runs.map(r => r.laps || 0)),
                avgLapTime: calculateSessionAvgLap(sessionData.runs)
            }
        };
        
        // Get existing history
        const history = await getSessionHistory();
        
        // Ensure history is an array
        const historyArray = Array.isArray(history) ? history : [];
        
        // Check if this session already exists (avoid duplicates)
        const existingIndex = historyArray.findIndex(s => s.sessionId === currentSessionId);
        if (existingIndex !== -1) {
            console.log('📝 Updating existing session in history');
            historyArray[existingIndex] = sessionObj;
        } else {
            console.log('💾 Saving new session to history');
            historyArray.unshift(sessionObj); // Add to beginning
        }
        
        // Limit to MAX_SESSIONS, remove oldest
        const trimmedHistory = historyArray.slice(0, MAX_SESSIONS);
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
        
        console.log(`✅ Session saved: ${sessionObj.date} ${sessionObj.startTime} - Winner: ${winner.name}`);
        return sessionObj;
        
    } catch (error) {
        console.error('❌ Error saving session:', error);
        return null;
    }
}

/**
 * Load a specific session from history
 * 
 * PURPOSE: Retrieve session data by ID
 * WHY: User selected a historical session to view
 * 
 * @param {string} sessionId - Session identifier
 * @returns {Promise<Object|null>} Session object or null if not found
 */
export async function loadSession(sessionId) {
    try {
        // First check local storage
        const localHistory = getLocalSessionHistory();
        const localSession = localHistory.find(s => s.sessionId === sessionId);
        
        if (localSession) {
            console.log(`📂 Loaded local session: ${localSession.date} ${localSession.startTime}`);
            return localSession;
        }
        
        console.warn('⚠️ Session not found:', sessionId);
        return null;
    } catch (error) {
        console.error('❌ Error loading session:', error);
        return null;
    }
}

/**
 * Delete a session from history
 * 
 * PURPOSE: Remove unwanted sessions
 * WHY: User wants to clean up history
 * 
 * @param {string} sessionId - Session identifier to delete
 * @returns {boolean} Success status
 */
export function deleteSession(sessionId) {
    try {
        const history = getLocalSessionHistory();
        const filtered = history.filter(s => s.sessionId !== sessionId);
        
        if (filtered.length < history.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
            console.log(`🗑️ Deleted session: ${sessionId}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Error deleting session:', error);
        return false;
    }
}

/**
 * Clear all session history
 * 
 * PURPOSE: Reset history storage
 * WHY: User wants to clear all historical data
 * 
 * @returns {boolean} Success status
 */
export function clearAllSessions() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('🗑️ All session history cleared');
        return true;
    } catch (error) {
        console.error('❌ Error clearing history:', error);
        return false;
    }
}

/**
 * Find session winner (driver with best lap)
 * 
 * PURPOSE: Identify winning driver for session labeling
 * WHY: Makes sessions easier to identify in history
 * 
 * @param {Array} runs - Session runs data
 * @returns {Object} Winner object with name, kart, best lap
 */
function findSessionWinner(runs) {
    if (!runs || runs.length === 0) {
        return {
            name: 'Unknown',
            kartNumber: '-',
            bestLap: '-',
            bestLapRaw: null
        };
    }
    
    // Filter runs with valid best times (under threshold)
    const validRuns = runs.filter(r => 
        r.best_time_raw && 
        r.best_time_raw <= LAP_TIME_THRESHOLD
    );
    
    if (validRuns.length === 0) {
        return {
            name: 'No Winner',
            kartNumber: '-',
            bestLap: '-',
            bestLapRaw: null
        };
    }
    
    // Find fastest lap
    const winner = validRuns.reduce((best, current) => 
        current.best_time_raw < best.best_time_raw ? current : best
    );
    
    return {
        name: winner.name || `Driver ${winner.kart_number}`,
        kartNumber: winner.kart_number,
        bestLap: winner.best_time || '-',
        bestLapRaw: winner.best_time_raw
    };
}

/**
 * Calculate session average lap time
 * 
 * PURPOSE: Summary statistic for session
 * WHY: Helps identify session difficulty/speed
 * 
 * @param {Array} runs - Session runs data
 * @returns {string} Formatted average lap time
 */
function calculateSessionAvgLap(runs) {
    const allLapTimes = [];
    
    runs.forEach(run => {
        if (run.lap_times && Array.isArray(run.lap_times)) {
            run.lap_times.forEach(lap => {
                if (lap && lap.lapTimeRaw && lap.lapTimeRaw <= LAP_TIME_THRESHOLD) {
                    allLapTimes.push(lap.lapTimeRaw);
                }
            });
        }
    });
    
    if (allLapTimes.length === 0) return '-';
    
    const avg = allLapTimes.reduce((sum, t) => sum + t, 0) / allLapTimes.length;
    const seconds = (avg / 1000).toFixed(3);
    return `${seconds}s`;
}

/**
 * Get session display label
 * 
 * PURPOSE: Generate user-friendly session label
 * WHY: Makes dropdown options readable
 * 
 * @param {Object} session - Session object
 * @returns {string} Formatted label
 */
export function getSessionLabel(session) {
    const winner = session.winner?.name && session.winner.name !== 'No Winner' && session.winner.name !== 'Unknown'
        ? `${session.winner.name} (#${session.winner.kartNumber}) - ${session.winner.bestLap}`
        : session.eventName;
    
    const trackLabel = session.trackName ? `${session.trackName} - ` : '';
    const kartInfo = session.karts ? ` - ${session.karts} karts` : '';
    const sourceIcon = session.source === 'server' ? '☁️' : '📅';
    return `${sourceIcon} ${session.date} - ${trackLabel}${session.startTime}${kartInfo} - ${winner}`;
}

/**
 * Get storage usage info
 * 
 * PURPOSE: Show how much storage is used
 * WHY: Help users manage storage
 * 
 * @returns {Object} Storage info
 */
export function getStorageInfo() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const sessions = stored ? JSON.parse(stored) : [];
        const sizeKB = stored ? (stored.length / 1024).toFixed(2) : 0;
        
        return {
            sessionCount: sessions.length,
            maxSessions: MAX_SESSIONS,
            sizeKB: sizeKB,
            percentFull: (sessions.length / MAX_SESSIONS) * 100
        };
    } catch (error) {
        console.error('❌ Error getting storage info:', error);
        return {
            sessionCount: 0,
            maxSessions: MAX_SESSIONS,
            sizeKB: 0,
            percentFull: 0
        };
    }
}

