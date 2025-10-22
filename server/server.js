// Server Setup and Initialization
import http from 'http';
import { config } from './config.js';
import logger from './logger.js';

let server = null;

export function startServer(app) {
  // Create HTTP server
  server = http.createServer(app);
  
  const PORT = config.port;
  
  server.listen(PORT, () => {
    logger.info('='.repeat(60));
    logger.info('🏁 RaceFacer Analysis Server Started');
    logger.info('='.repeat(60));
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Server listening on port ${PORT}`);
    logger.info(`WebSocket target: ${config.websocket.url}`);
    logger.info(`Storage path: ${config.storage.path}`);
    logger.info('='.repeat(60));
    logger.info('API Endpoints:');
    logger.info(`  Health:     http://localhost:${PORT}/health`);
    logger.info(`  Current:    http://localhost:${PORT}/api/current`);
    logger.info(`  Analysis:   http://localhost:${PORT}/api/analysis`);
    logger.info(`  Stats:      http://localhost:${PORT}/api/stats`);
    logger.info(`  Sessions:   http://localhost:${PORT}/api/sessions`);
    logger.info('='.repeat(60));
  });
  
  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use`);
      process.exit(1);
    } else {
      logger.error('Server error:', error);
    }
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    gracefulShutdown();
  });
  
  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully...');
    gracefulShutdown();
  });
  
  return server;
}

function gracefulShutdown() {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

export function getServer() {
  return server;
}
