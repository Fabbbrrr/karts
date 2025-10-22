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
    const { sessionId, sessionData, analysis, lapHistory: currentLapHistory } = data;
    
    // Save current session (overwrite each time)
    const currentFile = join(STORAGE_PATH, 'current', 'session.json');
    await fs.writeFile(currentFile, JSON.stringify({
      sessionId,
      sessionData,
      analysis,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    // Save historical session (with unique ID)
    const sessionFile = join(STORAGE_PATH, 'sessions', `session-${sessionId}.json`);
    await fs.writeFile(sessionFile, JSON.stringify({
      sessionId,
      sessionData,
      analysis,
      lapHistory: currentLapHistory,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    logger.info(`Session data saved: ${sessionId}`);
    
    // Cleanup old sessions
    await cleanupOldSessions();
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
    if (error.code !== 'ENOENT') {
      logger.error('Error reading current session:', error);
    }
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
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = join(sessionsDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          const session = JSON.parse(data);
          sessions.push({
            sessionId: session.sessionId,
            eventName: session.sessionData?.event_name || 'Unknown',
            timestamp: session.timestamp,
            karts: session.analysis?.summary?.totalKarts || 0,
            laps: session.analysis?.summary?.totalLaps || 0
          });
        } catch (err) {
          logger.warn(`Error reading session file ${file}:`, err.message);
        }
      }
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
    const sessionFile = join(STORAGE_PATH, 'sessions', `session-${sessionId}.json`);
    const data = await fs.readFile(sessionFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.error(`Error reading session ${sessionId}:`, error);
    }
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
