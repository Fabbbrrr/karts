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
  deleteSessionById
} from './controllers.js';

export function setupRoutes(app) {
  // Health check
  app.get('/health', healthCheck);
  app.get('/api/health', healthCheck);
  
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
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'RaceFacer Analysis Server',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/health',
        currentAnalysis: '/api/current',
        allKarts: '/api/analysis',
        kartDetails: '/api/kart/:kartNumber',
        stats: '/api/stats',
        sessions: '/api/sessions',
        sessionDetails: '/api/sessions/:sessionId',
        exportSession: '/api/sessions/:sessionId/export',
        deleteSession: 'DELETE /api/sessions/:sessionId'
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
