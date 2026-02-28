// Data Storage Module with Session Management
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { config } from './config.js';
import logger from './logger.js';

const STORAGE_PATH = config.storage.path;
const MAX_SESSIONS = config.storage.maxSessions;
const MAX_LAPS = config.storage.maxLapsPerSession;

// In-memory lap history (persists during server runtime)
let lapHistory = {};

/**
 * Initialize storage directory
 */
export async function initializeStorage() {
  try {
    await fs.mkdir(STORAGE_PATH, { recursive: true });
    await fs.mkdir(join(STORAGE_PATH, 'sessions'), { recursive: true });
    await fs.mkdir(join(STORAGE_PATH, 'current'), { recursive: true });
    await fs.mkdir(join(STORAGE_PATH, 'replay'), { recursive: true });
    logger.info(`Storage initialized at ${STORAGE_PATH}`);
  } catch (error) {
    logger.error('Error initializing storage:', error);
    throw error;
  }
}

/**
 * Update lap history for a specific kart
 */
export function updateLapHistory(kartNumber, lapData) {
  if (!kartNumber) return;
  
  if (!lapHistory[kartNumber]) {
    lapHistory[kartNumber] = [];
  }
  
  const history = lapHistory[kartNumber];
  const lapNum = lapData.lapNum || lapData.lap_number;
  
  // Check if this lap already exists
  const existingLap = history.find(l => l.lapNum === lapNum);
  
  if (!existingLap && lapData.timeRaw) {
    // Add new lap
    history.push({
      lapNum: lapNum,
      timeRaw: lapData.timeRaw,
      position: lapData.position,
      timestamp: lapData.timestamp || Date.now()
    });
    
    // Keep only recent laps (prevent memory issues)
    if (history.length > MAX_LAPS) {
      history.shift();
    }
    
    logger.debug(`Lap ${lapNum} added for kart ${kartNumber}: ${(lapData.timeRaw / 1000).toFixed(3)}s`);
  }
}

/**
 * Get lap history for a specific kart
 */
export function getKartLapHistory(kartNumber) {
  return lapHistory[kartNumber] || [];
}

/**
 * Get all lap history
 */
export function getAllLapHistory() {
  return lapHistory;
}

/**
 * Clear lap history (for new session)
 */
export function clearLapHistory() {
  lapHistory = {};
  logger.info('Lap history cleared');
}

/**
 * Save session data to file
 */
export async function saveSessionData(data) {
  try {
    const { 
      sessionId, 
      eventName,
      trackConfigId,
      trackName,
      sessionData, 
      analysis, 
      lapHistory: currentLapHistory, 
      duration,
      isComplete = false 
    } = data;
    
    // ONLY save sessions with meaningful data (≥2 karts, ≥10 laps)
    const kartCount = sessionData?.runs?.length || 0;
    const totalLaps = analysis?.summary?.totalLaps || 0;
    
    if (kartCount < 2 || totalLaps < 10) {
      logger.debug(`Skipping save - insufficient data (${kartCount} karts, ${totalLaps} laps) - need ≥2 karts and ≥10 laps`);
      return;
    }
    
    // Prepare enriched metadata
    const metadata = {
      sessionId,
      eventName,
      trackConfigId,
      trackName,
      date: new Date().toISOString(),
      karts: kartCount,
      laps: totalLaps,
      duration: duration || 0,
      isComplete,
      winner: analysis?.summary?.winner || null
    };
    
    // Save current session (overwrite each time)
    const currentFile = join(STORAGE_PATH, 'current', 'session.json');
    await fs.writeFile(currentFile, JSON.stringify({
      ...metadata,
      sessionData,
      analysis,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    // Save historical session (with unique ID) - ALWAYS update the SAME file for this session
    const sessionFile = join(STORAGE_PATH, 'sessions', `session-${sessionId}.json`);
    await fs.writeFile(sessionFile, JSON.stringify({
      ...metadata,
      sessionData,
      analysis,
      lapHistory: currentLapHistory,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    if (isComplete) {
      logger.info(`✅ Session marked complete: ${sessionId} (${kartCount} karts, ${totalLaps} laps)`);
    }
    
    // Cleanup old sessions (only if this is a complete session)
    if (isComplete) {
      await cleanupOldSessions();
    }
  } catch (error) {
    logger.error('Error saving session data:', error);
    throw error;
  }
}

/**
 * Get current session data
 */
export async function getCurrentSession() {
  try {
    const currentFile = join(STORAGE_PATH, 'current', 'session.json');
    const data = await fs.readFile(currentFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist - this is normal on startup
      return null;
    }
    
    if (error instanceof SyntaxError) {
      // JSON parse error - file is corrupted
      logger.error('⚠️ Current session file is corrupted, deleting it:', error.message);
      try {
        await fs.unlink(join(STORAGE_PATH, 'current', 'session.json'));
        logger.info('🗑️ Deleted corrupted session file, will be recreated on next update');
      } catch (unlinkError) {
        logger.error('Error deleting corrupted file:', unlinkError);
      }
      return null;
    }
    
    logger.error('Error reading current session:', error);
    return null;
  }
}

/**
 * Get all stored sessions
 */
export async function getAllSessions() {
  try {
    const sessionsDir = join(STORAGE_PATH, 'sessions');
    const files = await fs.readdir(sessionsDir);
    
    const sessions = [];
    
    // First, add historical sessions from sessions/
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = join(sessionsDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          const session = JSON.parse(data);
          sessions.push({
            sessionId: session.sessionId,
            eventName: session.eventName || session.sessionData?.event_name || 'Unknown',
            trackConfigId: session.trackConfigId || session.sessionData?.track_configuration_id || 0,
            trackName: session.trackName || session.sessionData?.track_name || 'Unknown',
            date: session.date || session.timestamp,
            timestamp: session.timestamp,
            karts: session.karts || session.analysis?.summary?.totalKarts || 0,
            laps: session.laps || session.analysis?.summary?.totalLaps || 0,
            duration: session.duration || 0,
            winner: session.winner || session.analysis?.summary?.winner || null,
            isComplete: session.isComplete !== false
          });
        } catch (err) {
          logger.warn(`Error reading session file ${file}:`, err.message);
        }
      }
    }
    
    // Also include current session if it meets criteria
    try {
      const currentSession = await getCurrentSession();
      if (currentSession) {
        const kartCount = currentSession.karts || currentSession.sessionData?.runs?.length || 0;
        const totalLaps = currentSession.laps || currentSession.analysis?.summary?.totalLaps || 0;
        
        // Include if it meets the save criteria
        if (kartCount > 1 && totalLaps >= 10) {
          // Check if it's not already in the historical sessions
          const existsInHistory = sessions.some(s => s.sessionId === currentSession.sessionId);
          if (!existsInHistory) {
            sessions.push({
              sessionId: currentSession.sessionId,
              eventName: currentSession.eventName || currentSession.sessionData?.event_name || 'Unknown',
              trackConfigId: currentSession.trackConfigId || currentSession.sessionData?.track_configuration_id || 0,
              trackName: currentSession.trackName || currentSession.sessionData?.track_name || 'Unknown',
              date: currentSession.date || currentSession.timestamp,
              timestamp: currentSession.timestamp,
              karts: kartCount,
              laps: totalLaps,
              duration: currentSession.duration || 0,
              winner: currentSession.winner || currentSession.analysis?.summary?.winner || null,
              isCurrent: true // Mark as current/live session
            });
            logger.debug(`Including current session ${currentSession.sessionId} in session list (${kartCount} karts, ${totalLaps} laps)`);
          }
        }
      }
    } catch (err) {
      logger.debug('No current session to include:', err.message);
    }
    
    // Sort by timestamp (newest first)
    sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return sessions;
  } catch (error) {
    logger.error('Error getting all sessions:', error);
    return [];
  }
}

/**
 * Get specific session by ID
 */
export async function getSessionById(sessionId) {
  try {
    // First try historical sessions
    const sessionFile = join(STORAGE_PATH, 'sessions', `session-${sessionId}.json`);
    try {
      const data = await fs.readFile(sessionFile, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      // File not found, check current session
    }
    
    // Try current session
    const currentSession = await getCurrentSession();
    if (currentSession && String(currentSession.sessionId) === String(sessionId)) {
      return currentSession;
    }
    
    return null;
  } catch (error) {
    logger.error(`Error reading session ${sessionId}:`, error);
    return null;
  }
}

/**
 * Delete session by ID
 */
export async function deleteSession(sessionId) {
  try {
    const sessionFile = join(STORAGE_PATH, 'sessions', `session-${sessionId}.json`);
    await fs.unlink(sessionFile);
    logger.info(`Session ${sessionId} deleted`);
    return true;
  } catch (error) {
    logger.error(`Error deleting session ${sessionId}:`, error);
    return false;
  }
}

/**
 * Cleanup old sessions (keep only MAX_SESSIONS)
 */
async function cleanupOldSessions() {
  try {
    const sessions = await getAllSessions();
    
    if (sessions.length > MAX_SESSIONS) {
      const sessionsToDelete = sessions.slice(MAX_SESSIONS);
      
      for (const session of sessionsToDelete) {
        await deleteSession(session.sessionId);
      }
      
      logger.info(`Cleaned up ${sessionsToDelete.length} old sessions`);
    }
  } catch (error) {
    logger.error('Error cleaning up old sessions:', error);
  }
}

/**
 * Get storage statistics
 */
export async function getStorageStats() {
  try {
    const sessions = await getAllSessions();
    const currentSession = await getCurrentSession();
    
    let totalSize = 0;
    const sessionsDir = join(STORAGE_PATH, 'sessions');
    const files = await fs.readdir(sessionsDir);
    
    for (const file of files) {
      const stats = await fs.stat(join(sessionsDir, file));
      totalSize += stats.size;
    }
    
    return {
      totalSessions: sessions.length,
      currentSession: currentSession ? {
        sessionId: currentSession.sessionId,
        eventName: currentSession.sessionData?.event_name,
        karts: currentSession.analysis?.summary?.totalKarts || 0
      } : null,
      storageSize: totalSize,
      storageSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      maxSessions: MAX_SESSIONS,
      lapHistoryKarts: Object.keys(lapHistory).length
    };
  } catch (error) {
    logger.error('Error getting storage stats:', error);
    return {
      totalSessions: 0,
      currentSession: null,
      storageSize: 0,
      storageSizeMB: '0.00',
      maxSessions: MAX_SESSIONS,
      lapHistoryKarts: Object.keys(lapHistory).length
    };
  }
}

/**
 * Export session to JSON (for backup/download)
 */
export async function exportSession(sessionId) {
  try {
    const session = await getSessionById(sessionId);
    if (!session) return null;
    
    return {
      exportDate: new Date().toISOString(),
      session
    };
  } catch (error) {
    logger.error(`Error exporting session ${sessionId}:`, error);
    return null;
  }
}

// ==================== REPLAY DATA STORAGE ====================

/**
 * Save replay data point for full session replay
 * Stores timestamped snapshots of session data
 * @param {string} sessionId - Session ID
 * @param {Object} dataPoint - { timestamp, data }
 */
export async function saveReplayData(sessionId, dataPoint) {
  try {
    // ONLY save replay data if session has karts
    const hasKarts = dataPoint?.data?.runs?.length > 0;
    
    if (!hasKarts) {
      // Silently skip empty sessions
      return;
    }
    
    const replayDir = join(STORAGE_PATH, 'replay', String(sessionId));
    await fs.mkdir(replayDir, { recursive: true });
    
    // Save data point with timestamp as filename
    const filename = `${dataPoint.timestamp}.json`;
    const filepath = join(replayDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(dataPoint, null, 2));
    
    // Clean up old data points (keep last 10000 to avoid filling disk)
    await cleanupReplayData(sessionId, 10000);
  } catch (error) {
    logger.error(`Error saving replay data for session ${sessionId}:`, error);
  }
}

/**
 * Get replay data for a session
 * @param {string} sessionId - Session ID
 * @param {Object} options - { startTime, endTime, limit }
 * @returns {Array} Array of replay data points
 */
export async function getReplayData(sessionId, options = {}) {
  try {
    const replayDir = join(STORAGE_PATH, 'replay', String(sessionId));
    
    try {
      await fs.access(replayDir);
    } catch {
      return [];
    }
    
    const files = await fs.readdir(replayDir);
    let dataPoints = [];
    
    // Sort files by timestamp
    const sortedFiles = files
      .filter(f => f.endsWith('.json'))
      .sort((a, b) => {
        const timeA = parseInt(a.replace('.json', ''));
        const timeB = parseInt(b.replace('.json', ''));
        return timeA - timeB;
      });
    
    // Apply filters
    let filteredFiles = sortedFiles;
    
    if (options.startTime) {
      filteredFiles = filteredFiles.filter(f => {
        const time = parseInt(f.replace('.json', ''));
        return time >= options.startTime;
      });
    }
    
    if (options.endTime) {
      filteredFiles = filteredFiles.filter(f => {
        const time = parseInt(f.replace('.json', ''));
        return time <= options.endTime;
      });
    }
    
    if (options.limit) {
      filteredFiles = filteredFiles.slice(0, options.limit);
    }
    
    // Load data points
    for (const file of filteredFiles) {
      try {
        const content = await fs.readFile(join(replayDir, file), 'utf-8');
        dataPoints.push(JSON.parse(content));
      } catch (error) {
        logger.warn(`Error reading replay file ${file}:`, error);
      }
    }
    
    return dataPoints;
  } catch (error) {
    logger.error(`Error getting replay data for session ${sessionId}:`, error);
    return [];
  }
}

/**
 * Get replay metadata for a session
 * @param {string} sessionId - Session ID
 * @returns {Object} { totalPoints, startTime, endTime, duration }
 */
export async function getReplayMetadata(sessionId) {
  try {
    const replayDir = join(STORAGE_PATH, 'replay', String(sessionId));
    
    try {
      await fs.access(replayDir);
    } catch {
      return null;
    }
    
    const files = await fs.readdir(replayDir);
    const timestamps = files
      .filter(f => f.endsWith('.json'))
      .map(f => parseInt(f.replace('.json', '')))
      .filter(t => !isNaN(t))
      .sort((a, b) => a - b);
    
    if (timestamps.length === 0) {
      return null;
    }
    
    return {
      totalPoints: timestamps.length,
      startTime: timestamps[0],
      endTime: timestamps[timestamps.length - 1],
      duration: timestamps[timestamps.length - 1] - timestamps[0]
    };
  } catch (error) {
    logger.error(`Error getting replay metadata for session ${sessionId}:`, error);
    return null;
  }
}

/**
 * Clean up old replay data points
 * @param {string} sessionId - Session ID
 * @param {number} maxPoints - Maximum data points to keep
 */
async function cleanupReplayData(sessionId, maxPoints) {
  try {
    const replayDir = join(STORAGE_PATH, 'replay', String(sessionId));
    const files = await fs.readdir(replayDir);
    
    const sortedFiles = files
      .filter(f => f.endsWith('.json'))
      .sort((a, b) => {
        const timeA = parseInt(a.replace('.json', ''));
        const timeB = parseInt(b.replace('.json', ''));
        return timeA - timeB;
      });
    
    // Remove oldest files if we exceed maxPoints
    if (sortedFiles.length > maxPoints) {
      const filesToRemove = sortedFiles.slice(0, sortedFiles.length - maxPoints);
      for (const file of filesToRemove) {
        await fs.unlink(join(replayDir, file));
      }
      logger.info(`Cleaned up ${filesToRemove.length} old replay data points for session ${sessionId}`);
    }
  } catch (error) {
    logger.error(`Error cleaning up replay data for session ${sessionId}:`, error);
  }
}

/**
 * Delete all replay data for a session
 * @param {string} sessionId - Session ID
 */
export async function deleteReplayData(sessionId) {
  try {
    const replayDir = join(STORAGE_PATH, 'replay', String(sessionId));
    await fs.rm(replayDir, { recursive: true, force: true });
    logger.info(`Deleted replay data for session ${sessionId}`);
  } catch (error) {
    logger.error(`Error deleting replay data for session ${sessionId}:`, error);
  }
}

/**
 * Get all sessions with replay data
 * @returns {Array} Array of session IDs with replay data
 */
export async function getSessionsWithReplay() {
  try {
    const replayDir = join(STORAGE_PATH, 'replay');
    
    try {
      await fs.access(replayDir);
    } catch {
      return [];
    }
    
    const dirs = await fs.readdir(replayDir, { withFileTypes: true });
    const sessions = [];
    
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const metadata = await getReplayMetadata(dir.name);
        if (metadata) {
          sessions.push({
            sessionId: dir.name,
            ...metadata
          });
        }
      }
    }
    
    // Sort by start time (newest first)
    sessions.sort((a, b) => b.startTime - a.startTime);
    
    return sessions;
  } catch (error) {
    logger.error('Error getting sessions with replay:', error);
    return [];
  }
}
