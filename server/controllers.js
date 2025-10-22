// API Controllers
import { 
  getCurrentSession, 
  getAllSessions, 
  getSessionById,
  getStorageStats,
  exportSession,
  deleteSession,
  getKartLapHistory
} from './storage.js';
import { isConnected } from './websocket.js';
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
      sessionData: {
        eventName: session.sessionData?.event_name,
        trackConfig: session.sessionData?.track_configuration_id,
        currentLap: session.sessionData?.current_lap,
        totalLaps: session.sessionData?.total_laps
      },
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
    const sessions = await getAllSessions();
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
