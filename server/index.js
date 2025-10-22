// RaceFacer Analysis Server - Main Entry Point
import { createApp } from './app.js';
import { connectWebSocket, disconnectWebSocket } from './websocket.js';
import { startServer } from './server.js';
import { initializeStorage } from './storage.js';
import { config, validateConfig } from './config.js';
import logger from './logger.js';

/**
 * Main startup function
 */
async function main() {
  try {
    logger.info('🚀 Starting RaceFacer Analysis Server...');
    
    // Validate configuration
    logger.info('Validating configuration...');
    validateConfig();
    logger.info('✅ Configuration valid');
    
    // Initialize storage
    logger.info('Initializing storage...');
    await initializeStorage();
    logger.info('✅ Storage initialized');
    
    // Create Express app
    logger.info('Creating Express app...');
    const app = createApp();
    logger.info('✅ Express app created');
    
    // Start HTTP server
    logger.info('Starting HTTP server...');
    startServer(app);
    logger.info('✅ HTTP server started');
    
    // Connect to WebSocket
    logger.info('Connecting to timing system...');
    connectWebSocket();
    logger.info('✅ WebSocket connection initiated');
    
    logger.info('🎉 Server startup complete!');
  } catch (error) {
    logger.error('❌ Fatal error during startup:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  cleanup();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  cleanup();
  process.exit(1);
});

// Cleanup function
function cleanup() {
  logger.info('Cleaning up resources...');
  disconnectWebSocket();
}

// Start the server
main();
