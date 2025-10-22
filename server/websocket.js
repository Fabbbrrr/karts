// WebSocket Client for RaceFacer Timing System
import { io } from 'socket.io-client';
import { config } from './config.js';
import logger from './logger.js';
import { processSessionData } from './analysis.js';
import { saveSessionData, updateLapHistory } from './storage.js';

let socket = null;
let lapHistory = {};
let currentSessionId = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 50;

/**
 * Connect to RaceFacer WebSocket timing system
 */
export function connectWebSocket() {
  const wsUrl = config.websocket.url;
  
  logger.info(`Connecting to RaceFacer timing system at ${wsUrl}`);
  
  socket = io(wsUrl, {
    transports: ['websocket', 'polling'],
    reconnection: config.websocket.reconnection,
    reconnectionAttempts: config.websocket.reconnectionAttempts,
    reconnectionDelay: config.websocket.reconnectionDelay,
    reconnectionDelayMax: config.websocket.reconnectionDelayMax,
    timeout: config.websocket.timeout,
    forceNew: true
  });
  
  setupEventHandlers();
  
  return socket;
}

/**
 * Setup WebSocket event handlers
 */
function setupEventHandlers() {
  // Connection successful
  socket.on('connect', () => {
    logger.info('✅ Connected to RaceFacer timing system');
    logger.info(`Socket ID: ${socket.id}`);
    reconnectAttempts = 0;
  });
  
  // Connection error
  socket.on('connect_error', (error) => {
    reconnectAttempts++;
    logger.error(`Connection error (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}):`, {
      message: error.message,
      description: error.description
    });
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      logger.error('Max reconnection attempts reached. Stopping reconnection.');
      socket.disconnect();
    }
  });
  
  // Disconnected
  socket.on('disconnect', (reason) => {
    logger.warn(`Disconnected from timing system: ${reason}`);
    
    if (reason === 'io server disconnect') {
      // Server initiated disconnect, reconnect manually
      logger.info('Attempting manual reconnection...');
      setTimeout(() => {
        socket.connect();
      }, 5000);
    }
  });
  
  // Reconnection attempt
  socket.on('reconnect_attempt', (attemptNumber) => {
    logger.info(`Reconnection attempt ${attemptNumber}...`);
  });
  
  // Reconnection successful
  socket.on('reconnect', (attemptNumber) => {
    logger.info(`✅ Reconnected successfully after ${attemptNumber} attempts`);
    reconnectAttempts = 0;
  });
  
  // Reconnection error
  socket.on('reconnect_error', (error) => {
    logger.error('Reconnection error:', error.message);
  });
  
  // Reconnection failed
  socket.on('reconnect_failed', () => {
    logger.error('❌ Reconnection failed after all attempts');
  });
  
  // Listen for timing data
  // Based on the client-side websocket, the event might be 'timing-data' or similar
  socket.on('timing-data', handleTimingData);
  socket.on('session-data', handleSessionData);
  socket.on('lap-data', handleLapData);
  
  // Fallback: listen for any data event
  socket.onAny((eventName, ...args) => {
    logger.debug(`Received event: ${eventName}`, { argsCount: args.length });
  });
}

/**
 * Handle incoming timing data
 */
function handleTimingData(data) {
  try {
    logger.debug('Received timing data', { 
      eventName: data?.data?.event_name,
      runs: data?.data?.runs?.length 
    });
    
    if (data && data.data) {
      processAndStoreData(data.data);
    }
  } catch (error) {
    logger.error('Error handling timing data:', error);
  }
}

/**
 * Handle incoming session data
 */
function handleSessionData(data) {
  try {
    logger.debug('Received session data', {
      sessionId: data?.timestamp,
      eventName: data?.event_name
    });
    
    if (data) {
      processAndStoreData(data);
    }
  } catch (error) {
    logger.error('Error handling session data:', error);
  }
}

/**
 * Handle incoming lap data
 */
function handleLapData(data) {
  try {
    logger.debug('Received lap data', { kartNumber: data?.kart_number });
    
    if (data && data.kart_number) {
      updateLapHistory(data.kart_number, data);
    }
  } catch (error) {
    logger.error('Error handling lap data:', error);
  }
}

/**
 * Process and store incoming data
 */
function processAndStoreData(sessionData) {
  try {
    // Detect session change
    const newSessionId = sessionData.timestamp || Date.now();
    const isNewSession = !currentSessionId || Math.abs(newSessionId - currentSessionId) > 3600; // 1 hour
    
    if (isNewSession && currentSessionId) {
      logger.info('🔄 New session detected, resetting lap history');
      lapHistory = {};
    }
    
    currentSessionId = newSessionId;
    
    // Update lap history from runs
    if (sessionData.runs && Array.isArray(sessionData.runs)) {
      for (const run of sessionData.runs) {
        if (run.kart_number && run.last_time_raw && run.total_laps) {
          updateLapHistory(run.kart_number, {
            lapNum: run.total_laps,
            timeRaw: run.last_time_raw,
            position: run.pos,
            timestamp: Date.now()
          });
        }
      }
    }
    
    // Process analysis every 30 seconds or on significant changes
    const shouldAnalyze = shouldRunAnalysis();
    
    if (shouldAnalyze) {
      logger.info('📊 Running analysis...');
      const analysis = processSessionData(sessionData, lapHistory);
      
      // Save to storage
      saveSessionData({
        sessionId: currentSessionId,
        sessionData,
        analysis,
        lapHistory,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`✅ Analysis complete: ${analysis.summary.totalKarts} karts, ${analysis.summary.totalLaps} laps`);
    }
  } catch (error) {
    logger.error('Error processing and storing data:', error);
  }
}

/**
 * Determine if analysis should run
 */
let lastAnalysisTime = 0;
const ANALYSIS_INTERVAL = 30000; // 30 seconds

function shouldRunAnalysis() {
  const now = Date.now();
  if (now - lastAnalysisTime > ANALYSIS_INTERVAL) {
    lastAnalysisTime = now;
    return true;
  }
  return false;
}

/**
 * Get current socket instance
 */
export function getSocket() {
  return socket;
}

/**
 * Get current lap history
 */
export function getLapHistory() {
  return lapHistory;
}

/**
 * Disconnect from WebSocket
 */
export function disconnectWebSocket() {
  if (socket) {
    logger.info('Disconnecting from timing system...');
    socket.disconnect();
    socket = null;
  }
}

/**
 * Check if connected
 */
export function isConnected() {
  return socket && socket.connected;
}
