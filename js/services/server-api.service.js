/**
 * Karting Live Timer - Server API Service
 * 
 * PURPOSE: Fetch session data from analysis server
 * WHY: Access persistent storage and analysis from dedicated server
 * HOW: HTTP requests to server API endpoints
 * FEATURE: Server Integration, Remote Session Access
 */

import { CONFIG } from '../core/config.js';

// Server configuration (can be configured in settings)
// Uses CONFIG.SERVER_URL if available, otherwise defaults to localhost
let SERVER_URL = CONFIG.SERVER_URL || 'http://localhost:3001';

/**
 * Set server URL
 * @param {string} url - Server base URL
 */
export function setServerURL(url) {
    SERVER_URL = url;
    console.log(`🔧 Server URL set to: ${SERVER_URL}`);
}

/**
 * Get server URL
 * @returns {string} Current server URL
 */
export function getServerURL() {
    return SERVER_URL;
}

/**
 * Check if server is available
 * @returns {Promise<boolean>} True if server is reachable
 */
export async function checkServerHealth() {
    try {
        const response = await fetch(`${SERVER_URL}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Server health check passed:', data);
            return true;
        }
        
        console.warn('⚠️ Server health check failed:', response.status);
        return false;
    } catch (error) {
        console.warn('⚠️ Server not reachable:', error.message);
        return false;
    }
}

/**
 * Get current session from server
 * @returns {Promise<Object|null>} Current session data or null
 */
export async function getCurrentSession() {
    try {
        const response = await fetch(`${SERVER_URL}/api/current`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('📊 Fetched current session from server');
            return data;
        }
        
        if (response.status === 404) {
            console.log('ℹ️ No current session on server');
            return null;
        }
        
        console.error('❌ Failed to fetch current session:', response.status);
        return null;
    } catch (error) {
        console.error('❌ Error fetching current session:', error);
        return null;
    }
}

/**
 * Get all historical sessions from server
 * @returns {Promise<Array>} Array of session summaries
 */
export async function getAllSessions() {
    try {
        const response = await fetch(`${SERVER_URL}/api/sessions`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`📚 Fetched ${data.total} sessions from server`);
            return data.sessions || [];
        }
        
        console.error('❌ Failed to fetch sessions:', response.status);
        return [];
    } catch (error) {
        console.error('❌ Error fetching sessions:', error);
        return [];
    }
}

/**
 * Get backend sessions formatted for frontend
 * @returns {Promise<Array>} Array of session objects in frontend format
 */
export async function getBackendSessions() {
    try {
        const sessions = await getAllSessions();
        
        // Transform backend sessions to match frontend format
        return sessions.map(session => {
            const timestamp = new Date(session.timestamp || session.date);
            return {
                sessionId: session.sessionId,
                timestamp: timestamp.getTime(),
                date: timestamp.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                }),
                startTime: timestamp.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                }),
                eventName: session.eventName || session.sessionData?.event_name || session.analysis?.summary?.eventName || 'Race',
                trackConfigId: session.trackConfigId || session.sessionData?.track_configuration_id || 0,
                trackName: session.trackName || session.sessionData?.track_name || 'Unknown',
                karts: session.karts || session.analysis?.summary?.totalKarts || 0,
                laps: session.laps || session.analysis?.summary?.totalLaps || 0,
                duration: session.duration || 0,
                kartCount: session.karts || session.analysis?.summary?.totalKarts || 0,
                totalLaps: session.laps || session.analysis?.summary?.totalLaps || 0,
                winner: session.winner || session.analysis?.winner || null,
                sessionData: session.sessionData,
                analysis: session.analysis,
                lapHistory: session.lapHistory,
                source: 'server' // Mark as server-sourced
            };
        }).sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
        console.error('❌ Error getting backend sessions:', error);
        return [];
    }
}

/**
 * Get specific session details from server
 * @param {string|number} sessionId - Session ID
 * @returns {Promise<Object|null>} Session details or null
 */
export async function getSessionById(sessionId) {
    try {
        const response = await fetch(`${SERVER_URL}/api/sessions/${sessionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`📂 Fetched session ${sessionId} from server`);
            return data;
        }
        
        if (response.status === 404) {
            console.warn(`⚠️ Session ${sessionId} not found on server`);
            return null;
        }
        
        console.error('❌ Failed to fetch session:', response.status);
        return null;
    } catch (error) {
        console.error('❌ Error fetching session:', error);
        return null;
    }
}

/**
 * Get kart analysis from server
 * @param {string} kartNumber - Kart number
 * @returns {Promise<Object|null>} Kart analysis or null
 */
export async function getKartAnalysis(kartNumber) {
    try {
        const response = await fetch(`${SERVER_URL}/api/kart/${kartNumber}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`🏎️ Fetched analysis for kart ${kartNumber}`);
            return data;
        }
        
        if (response.status === 404) {
            console.warn(`⚠️ Kart ${kartNumber} not found on server`);
            return null;
        }
        
        console.error('❌ Failed to fetch kart analysis:', response.status);
        return null;
    } catch (error) {
        console.error('❌ Error fetching kart analysis:', error);
        return null;
    }
}

/**
 * Get server statistics
 * @returns {Promise<Object|null>} Server stats or null
 */
export async function getServerStats() {
    try {
        const response = await fetch(`${SERVER_URL}/api/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('📊 Fetched server statistics');
            return data;
        }
        
        console.error('❌ Failed to fetch server stats:', response.status);
        return null;
    } catch (error) {
        console.error('❌ Error fetching server stats:', error);
        return null;
    }
}

/**
 * Export session from server
 * @param {string|number} sessionId - Session ID
 * @returns {Promise<Blob|null>} Session data as downloadable blob
 */
export async function exportSession(sessionId) {
    try {
        const response = await fetch(`${SERVER_URL}/api/sessions/${sessionId}/export`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`📥 Exported session ${sessionId}`);
            return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        }
        
        console.error('❌ Failed to export session:', response.status);
        return null;
    } catch (error) {
        console.error('❌ Error exporting session:', error);
        return null;
    }
}

/**
 * Delete session from server
 * @param {string|number} sessionId - Session ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteSessionFromServer(sessionId) {
    try {
        const response = await fetch(`${SERVER_URL}/api/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log(`🗑️ Deleted session ${sessionId} from server`);
            return true;
        }
        
        console.error('❌ Failed to delete session:', response.status);
        return false;
    } catch (error) {
        console.error('❌ Error deleting session:', error);
        return false;
    }
}

/**
 * Transform server session format to UI format
 * @param {Object} serverSession - Session from server API
 * @returns {Object} Session in UI format
 */
export function transformServerSession(serverSession) {
    if (!serverSession) return null;
    
    const sessionData = serverSession.sessionData || {};
    const analysis = serverSession.analysis || {};
    
    // Find winner from analysis
    const winner = analysis.karts && analysis.karts.length > 0 
        ? {
            name: analysis.karts[0].driverName || 'Unknown',
            kartNumber: analysis.karts[0].kartNumber,
            bestLap: analysis.karts[0].bestLapFormatted || '-',
            bestLapRaw: analysis.karts[0].bestLap
        }
        : {
            name: 'No Winner',
            kartNumber: '-',
            bestLap: '-',
            bestLapRaw: null
        };
    
    // Create date from timestamp
    const sessionDate = new Date(serverSession.timestamp);
    
    return {
        sessionId: serverSession.sessionId,
        timestamp: sessionDate.getTime(),
        date: sessionDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        }),
        startTime: sessionDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        }),
        trackConfigId: sessionData.track_configuration_id || 'unknown',
        eventName: sessionData.event_name || 'Race Session',
        winner: winner,
        sessionData: sessionData,
        stats: {
            totalDrivers: analysis.summary?.totalKarts || 0,
            totalLaps: analysis.summary?.totalLaps || 0,
            avgLapTime: analysis.summary?.fastestLap || '-'
        },
        source: 'server' // Mark as server source
    };
}

/**
 * Get combined sessions (local + server)
 * @param {Array} localSessions - Sessions from localStorage
 * @returns {Promise<Array>} Combined and deduplicated sessions
 */
export async function getCombinedSessions(localSessions = []) {
    try {
        const serverAvailable = await checkServerHealth();
        
        if (!serverAvailable) {
            console.log('ℹ️ Server not available, using local sessions only');
            return localSessions;
        }
        
        const serverSessions = await getAllSessions();
        const transformedServerSessions = serverSessions.map(transformServerSession);
        
        // Combine and deduplicate by sessionId
        const sessionMap = new Map();
        
        // Add local sessions first (they might have more recent data)
        localSessions.forEach(session => {
            sessionMap.set(session.sessionId, { ...session, source: 'local' });
        });
        
        // Add server sessions (only if not already in local)
        transformedServerSessions.forEach(session => {
            if (!sessionMap.has(session.sessionId)) {
                sessionMap.set(session.sessionId, session);
            }
        });
        
        // Convert back to array and sort by timestamp
        const combined = Array.from(sessionMap.values());
        combined.sort((a, b) => b.timestamp - a.timestamp);
        
        console.log(`📊 Combined sessions: ${localSessions.length} local + ${transformedServerSessions.length} server = ${combined.length} total`);
        
        return combined;
    } catch (error) {
        console.error('❌ Error combining sessions:', error);
        return localSessions;
    }
}

/**
 * Delete a session from the backend
 */
export async function deleteBackendSession(sessionId) {
    try {
        const response = await fetch(`${CONFIG.SERVER_URL}/api/sessions/${sessionId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to delete session: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ Session deleted: ${sessionId}`);
        return data;
    } catch (error) {
        console.error('❌ Error deleting session:', error);
        throw error;
    }
}
