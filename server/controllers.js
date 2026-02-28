// API Controllers
import { 
  getCurrentSession, 
  getAllSessions, 
  getSessionById,
  getStorageStats,
  exportSession,
  deleteSession,
  getKartLapHistory,
  getReplayData,
  getReplayMetadata,
  getSessionsWithReplay
} from './storage.js';
import { isConnected } from './websocket.js';
import { addClient, removeClient, sendToClient, getClients, getClientStats as getBroadcastStats } from './broadcast.js';
import logger from './logger.js';

/**
 * Health check endpoint
 */
export function healthCheck(req, res) {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    websocket: {
      connected: isConnected()
    },
    uptime: process.uptime()
  };
  
  res.json(health);
}

/**
 * Get current session analysis
 */
export async function getCurrentAnalysis(req, res) {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return res.status(404).json({ 
        error: 'No current session data available',
        message: 'Server is running but no data has been received yet'
      });
    }
    
    res.json({
      sessionId: session.sessionId,
      analysis: session.analysis,
      sessionData: session.sessionData, // Send full session data including runs array
      timestamp: session.timestamp
    });
  } catch (error) {
    logger.error('Error getting current analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get all kart analysis from current session
 */
export async function getAllKartAnalysis(req, res) {
  try {
    const session = await getCurrentSession();
    
    if (!session || !session.analysis) {
      return res.status(404).json({ error: 'No analysis data available' });
    }
    
    res.json({
      summary: session.analysis.summary,
      karts: session.analysis.karts,
      crossKartDrivers: session.analysis.crossKartDrivers
    });
  } catch (error) {
    logger.error('Error getting kart analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get specific kart details
 */
export async function getKartDetails(req, res) {
  try {
    const { kartNumber } = req.params;
    const session = await getCurrentSession();
    
    if (!session || !session.analysis || !session.analysis.karts) {
      return res.status(404).json({ error: 'No analysis data available' });
    }
    
    const kart = session.analysis.karts.find(k => k.kartNumber === kartNumber);
    
    if (!kart) {
      return res.status(404).json({ error: `Kart ${kartNumber} not found` });
    }
    
    // Include real-time lap history
    const lapHistory = getKartLapHistory(kartNumber);
    
    res.json({
      ...kart,
      realtimeLapHistory: lapHistory
    });
  } catch (error) {
    logger.error('Error getting kart details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get statistics
 */
export async function getStats(req, res) {
  try {
    const storageStats = await getStorageStats();
    const session = await getCurrentSession();
    
    const stats = {
      storage: storageStats,
      websocket: {
        connected: isConnected()
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      },
      currentSession: session ? {
        eventName: session.sessionData?.event_name,
        totalKarts: session.analysis?.summary?.totalKarts || 0,
        totalLaps: session.analysis?.summary?.totalLaps || 0,
        fastestLap: session.analysis?.summary?.fastestLap
      } : null
    };
    
    res.json(stats);
  } catch (error) {
    logger.error('Error getting stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get all sessions (historical)
 */
export async function getSessionsList(req, res) {
  try {
    const allSessions = await getAllSessions();
    
    // Filter to only include meaningful sessions (>1 kart, >=10 laps)
    const sessions = allSessions.filter(session => {
      // getAllSessions returns objects with 'karts' and 'laps' properties
      const kartCount = session.karts || 0;
      const totalLaps = session.laps || 0;
      return kartCount > 1 && totalLaps >= 10;
    });
    
    res.json({
      total: sessions.length,
      sessions
    });
  } catch (error) {
    logger.error('Error getting sessions list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get specific session details
 */
export async function getSessionDetails(req, res) {
  try {
    const { sessionId } = req.params;
    const session = await getSessionById(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: `Session ${sessionId} not found` });
    }
    
    res.json(session);
  } catch (error) {
    logger.error('Error getting session details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Export session data
 */
export async function exportSessionData(req, res) {
  try {
    const { sessionId } = req.params;
    const exportData = await exportSession(sessionId);
    
    if (!exportData) {
      return res.status(404).json({ error: `Session ${sessionId} not found` });
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="session-${sessionId}.json"`);
    res.json(exportData);
  } catch (error) {
    logger.error('Error exporting session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Delete session
 */
export async function deleteSessionById(req, res) {
  try {
    const { sessionId } = req.params;
    const success = await deleteSession(sessionId);
    
    if (!success) {
      return res.status(404).json({ error: `Session ${sessionId} not found` });
    }
    
    res.json({ message: 'Session deleted successfully', sessionId });
  } catch (error) {
    logger.error('Error deleting session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== SERVER-SENT EVENTS ====================

/**
 * Server-Sent Events (SSE) stream endpoint
 * Establishes persistent connection for real-time updates
 */
export function streamSSE(req, res) {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering if behind proxy
  
  // Note: CORS headers are set by middleware, but EventSource doesn't send credentials by default
  // so the CORS middleware will handle it correctly
  
  try {
    // Flush headers immediately
    res.flushHeaders();
  } catch (error) {
    logger.error('Error flushing SSE headers:', error);
    return res.status(500).end();
  }
  
  // Add client to broadcast list
  const clientId = addClient(res, {
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress
  });
  
  logger.info(`📱 SSE client connected: ${clientId}`);
  
  // Send initial connection message
  sendToClient(clientId, 'connected', {
    clientId,
    message: 'Connected to RaceFacer Analysis Server',
    serverTime: Date.now()
  });
  
  // Send current session data if available
  getCurrentSession().then(currentSession => {
    if (currentSession && currentSession.sessionData) {
      logger.info(`📤 Sending current session to client ${clientId}`);
      sendToClient(clientId, 'session', currentSession.sessionData);
    } else {
      logger.info(`ℹ️ No current session available for client ${clientId}`);
      // Send empty session data so UI knows there's no active race
      sendToClient(clientId, 'session', { runs: [] });
    }
  }).catch(error => {
    logger.error('Error sending current session to new client:', error);
    // Send empty session data on error
    sendToClient(clientId, 'session', { runs: [] });
  });
  
  // Handle client disconnect
  req.on('close', () => {
    removeClient(clientId);
  });
}

/**
 * Get connected client statistics
 */
export function getClientStats(req, res) {
  try {
    const stats = getBroadcastStats();
    const clients = getClients();
    
    res.json({
      ...stats,
      clients: clients.map(c => ({
        id: c.id,
        connectedAt: c.connectedAt,
        durationSeconds: c.durationSeconds,
        userAgent: c.metadata.userAgent
      }))
    });
  } catch (error) {
    logger.error('Error getting client stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== REPLAY ENDPOINTS ====================

/**
 * Get replay data for a session
 */
export async function getReplaySession(req, res) {
  try {
    const { sessionId } = req.params;
    const { startTime, endTime, limit, speed = 1 } = req.query;
    
    const options = {};
    if (startTime) options.startTime = parseInt(startTime);
    if (endTime) options.endTime = parseInt(endTime);
    if (limit) options.limit = parseInt(limit);
    
    const replayData = await getReplayData(sessionId, options);
    
    if (!replayData || replayData.length === 0) {
      return res.status(404).json({ 
        error: `No replay data found for session ${sessionId}` 
      });
    }
    
    res.json({
      sessionId,
      dataPoints: replayData.length,
      speed: parseFloat(speed),
      data: replayData
    });
  } catch (error) {
    logger.error('Error getting replay data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get replay metadata for a session
 */
export async function getReplayMetadataController(req, res) {
  try {
    const { sessionId } = req.params;
    const metadata = await getReplayMetadata(sessionId);
    
    if (!metadata) {
      return res.status(404).json({ 
        error: `No replay data found for session ${sessionId}` 
      });
    }
    
    res.json({
      sessionId,
      ...metadata
    });
  } catch (error) {
    logger.error('Error getting replay metadata:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get all sessions with replay data
 */
export async function getSessionsWithReplayController(req, res) {
  try {
    const sessions = await getSessionsWithReplay();
    
    res.json({
      count: sessions.length,
      sessions
    });
  } catch (error) {
    logger.error('Error getting sessions with replay:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
