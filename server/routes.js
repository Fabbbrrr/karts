// API Routes
import { 
  healthCheck,
  getCurrentAnalysis,
  getAllKartAnalysis,
  getKartDetails,
  getStats,
  getSessionsList,
  getSessionDetails,
  exportSessionData,
  deleteSessionById,
  streamSSE,
  getReplaySession,
  getReplayMetadataController,
  getSessionsWithReplayController,
  getClientStats
} from './controllers.js';

export function setupRoutes(app) {
  // Health check
  app.get('/health', healthCheck);
  app.get('/api/health', healthCheck);
  
  // Server-Sent Events stream (NEW!)
  app.get('/api/stream', streamSSE);
  
  // Client statistics
  app.get('/api/clients', getClientStats);
  
  // Current session endpoints
  app.get('/api/current', getCurrentAnalysis);
  app.get('/api/analysis', getAllKartAnalysis);
  app.get('/api/kart/:kartNumber', getKartDetails);
  app.get('/api/stats', getStats);
  
  // Historical sessions
  app.get('/api/sessions', getSessionsList);
  app.get('/api/sessions/:sessionId', getSessionDetails);
  app.get('/api/sessions/:sessionId/export', exportSessionData);
  app.delete('/api/sessions/:sessionId', deleteSessionById);
  
  // Replay endpoints (NEW!)
  app.get('/api/replay/sessions', getSessionsWithReplayController);
  app.get('/api/replay/:sessionId', getReplaySession);
  app.get('/api/replay/:sessionId/metadata', getReplayMetadataController);
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'RaceFacer Analysis Server',
      version: '2.0.0',
      status: 'running',
      architecture: 'Backend-Controlled Multi-Client',
      endpoints: {
        health: '/health',
        stream: '/api/stream [SSE]',
        clients: '/api/clients',
        currentAnalysis: '/api/current',
        allKarts: '/api/analysis',
        kartDetails: '/api/kart/:kartNumber',
        stats: '/api/stats',
        sessions: '/api/sessions',
        sessionDetails: '/api/sessions/:sessionId',
        exportSession: '/api/sessions/:sessionId/export',
        deleteSession: 'DELETE /api/sessions/:sessionId',
        replaySessions: '/api/replay/sessions',
        replaySession: '/api/replay/:sessionId',
        replayMetadata: '/api/replay/:sessionId/metadata'
      }
    });
  });
  
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Endpoint not found',
      path: req.path,
      method: req.method
    });
  });
}
