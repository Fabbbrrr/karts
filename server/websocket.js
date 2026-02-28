// WebSocket Client for RaceFacer Timing System
import { io } from 'socket.io-client';
import { config } from './config.js';
import logger from './logger.js';
import { processSessionData } from './analysis.js';
import { saveSessionData, saveReplayData, deleteSession } from './storage.js';
import { broadcastSessionData, broadcastLap } from './broadcast.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Save combined session data to current/session.json for API endpoints
 * Uses atomic write to prevent corruption
 */
function saveCombinedSessionData(sessionData, eventName) {
    try {
        const currentDir = path.join(__dirname, 'storage', 'current');
        const currentFile = path.join(currentDir, 'session.json');
        const tempFile = path.join(currentDir, 'session.json.tmp');
        
        // Ensure directory exists
        if (!fs.existsSync(currentDir)) {
            fs.mkdirSync(currentDir, { recursive: true });
            logger.info(`📁 Created storage/current directory`);
        }
        
        const data = {
            sessionId: `combined_${eventName.replace(/[^a-zA-Z0-9]/g, '_')}`,
            timestamp: new Date().toISOString(),
            sessionData: sessionData,
            analysis: {
                summary: {
                    totalKarts: sessionData.runs?.length || 0,
                    totalLaps: 0
                }
            }
        };
        
        // Write to temp file first (atomic operation)
        fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
        
        // Then rename (atomic operation on most filesystems)
        fs.renameSync(tempFile, currentFile);
        
        logger.info(`💾 Updated current/session.json with ${data.analysis.summary.totalKarts} karts`);
    } catch (error) {
        logger.error('❌ Error saving combined session data:', error);
    }
}

let socket = null;
let lapHistory = {};
let currentSessionId = null;
let currentEventName = null; // Track event name to detect session changes
let currentSessionData = null; // Store current session data for track name lookup
let allSessionKarts = {}; // Track ALL karts that have participated in current session (even after they finish)
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 50;

/**
 * Get friendly track name from session data
 * Uses map name if available, falls back to track config ID
 */
function getTrackName(trackConfigId, sessionData = null) {
    // Try to get track name from map data first (most reliable)
    if (sessionData?.maps_data?.map?.bgr) {
        const mapName = sessionData.maps_data.map.bgr.replace('.png', '');
        // Return capitalized map name
        return mapName.charAt(0).toUpperCase() + mapName.slice(1);
    }
    
    // Fallback to ID mapping (less reliable, but better than nothing)
    const trackNames = {
        1: 'Penrite',
        2: 'Mario',  // Updated based on lap time analysis
        3: 'Lakeside'
    };
    return trackNames[trackConfigId] || `Track ${trackConfigId}`;
}

/**
 * Connect to RaceFacer WebSocket timing system
 */
export function connectWebSocket() {
  const wsUrl = config.websocket.url;
  
  logger.info(`🔌 Connecting to RaceFacer timing system...`);
  logger.info(`   URL: ${wsUrl}`);
  logger.info(`   Channel: ${config.websocket.channel}`);
  
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
  const channel = config.websocket.channel;
  
  // Connection successful
  socket.on('connect', () => {
    logger.info('✅ Connected to RaceFacer timing system');
    logger.info(`Socket ID: ${socket.id}`);
    reconnectAttempts = 0;
    
    // Join the channel (critical for receiving data)
    socket.emit('join', channel);
    logger.info(`📡 Joined channel: ${channel}`);
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
    
    // Rejoin the channel after reconnection
    socket.emit('join', channel);
    logger.info(`📡 Rejoined channel: ${channel}`);
  });
  
  // Reconnection error
  socket.on('reconnect_error', (error) => {
    logger.error('Reconnection error:', error.message);
  });
  
  // Reconnection failed
  socket.on('reconnect_failed', () => {
    logger.error('❌ Reconnection failed after all attempts');
  });
  
  // Listen on the channel for data (matches client-side pattern)
  socket.on(channel, handleChannelData);
  
  // Monitor other events (minimal logging)
  socket.onAny((eventName, ...args) => {
    if (eventName !== channel && eventName !== 'connect' && eventName !== 'disconnect') {
      logger.debug(`Event: ${eventName}`);
    }
  });
}

/**
 * Handle incoming channel data (matches client-side pattern)
 */
function handleChannelData(data) {
  try {
    // Data structure matches client: { data: { event_name, runs, ... } }
    if (data && data.data) {
      processAndStoreData(data.data);
    } else if (data) {
      // Fallback: data might be at root level
      processAndStoreData(data);
    }
  } catch (error) {
    logger.error('Error handling channel data:', error);
  }
}

/**
 * Process and store incoming data
 * 
 * CRITICAL: WebSocket sends data for ALL 3 tracks in ONE update!
 * We must split by track (based on kart prefix) and manage separate sessions per track.
 */
let updateCount = 0;
let trackSessions = {}; // Separate session tracking per track: { 'Mario': {...}, 'Penrite': {...}, 'Lakeside': {...} }

/**
 * Detect track from kart name
 * Based on venue analysis:
 * - Numeric/no prefix = Lakeside (Super Karts, fastest, 32s record)
 * - P* = Penrite (Sprint Karts, 32s record)
 * - M* = Mushroom (Mini karts, kids)
 * - E* = Rimo (Rookie track)
 */
function getTrackFromKart(kartName) {
    const firstChar = String(kartName).charAt(0).toUpperCase();
    if (firstChar === 'M') return 'Mushroom';
    if (firstChar === 'P') return 'Penrite';
    if (firstChar === 'E') return 'Rimo';
    return 'Lakeside'; // Numeric or no prefix = Super Karts
}

function processAndStoreData(sessionData) {
    try {
        updateCount++;
        
        const eventName = sessionData.event_name || 'Unknown';
        
        // Log every 10 updates
        if (updateCount % 10 === 0) {
            const kartCount = sessionData.runs?.length || 0;
            logger.info(`📡 Update #${updateCount}: ${kartCount} karts active (ALL TRACKS)`);
        }
        
        // SPLIT runs by track
        const trackRuns = {
            'Mushroom': [],
            'Penrite': [],
            'Lakeside': [],
            'Rimo': []
        };
        
        const allModifiedRuns = []; // Collect all runs with track-specific positions
        
        if (sessionData.runs && Array.isArray(sessionData.runs)) {
            sessionData.runs.forEach(run => {
                const kartName = run.kart || run.kart_number || '';
                const track = getTrackFromKart(kartName);
                trackRuns[track].push(run);
            });
            
            // Log distribution
            if (updateCount % 10 === 0) {
                logger.info(`   Track split: Lakeside=${trackRuns.Lakeside.length}, Penrite=${trackRuns.Penrite.length}, Mushroom=${trackRuns.Mushroom.length}, Rimo=${trackRuns.Rimo.length}`);
            }
        }
        
        // Process each track independently
        for (const [trackName, runs] of Object.entries(trackRuns)) {
            if (runs.length === 0) continue; // Skip tracks with no karts
            
            const modifiedRuns = processTrackSession(trackName, runs, eventName, sessionData);
            allModifiedRuns.push(...modifiedRuns);
        }
        
        // BROADCAST modified data with track-specific positions to clients
        const modifiedSessionData = {
            ...sessionData,
            runs: allModifiedRuns.length > 0 ? allModifiedRuns : sessionData.runs
        };
        
        if (updateCount % 10 === 0) {
            logger.info(`   Broadcasting ${modifiedSessionData.runs.length} karts to clients`);
        }
        
        const broadcastResult = broadcastSessionData(modifiedSessionData);
        
        if (updateCount % 10 === 0 && broadcastResult) {
            logger.info(`   Broadcast sent to ${broadcastResult.successCount} clients, ${broadcastResult.failCount} failed`);
        }
        
        // Save to current/session.json for API endpoints (every 5 updates)
        if (updateCount % 5 === 0) {
            saveCombinedSessionData(modifiedSessionData, eventName);
        }
        
    } catch (error) {
        logger.error('Error processing and storing data:', error);
    }
}

/**
 * Process session for a single track
 * @returns {Array} Modified runs with track-specific positions
 */
function processTrackSession(trackName, runs, eventName, fullSessionData) {
    // Initialize track session if needed
    if (!trackSessions[trackName]) {
        trackSessions[trackName] = {
            sessionId: null,
            eventName: null,
            karts: {},
            lapHistory: {},
            previousLapCounts: {},
            startTime: null,
            updateCount: 0,
            lastKartSet: new Set()
        };
    }
    
    const track = trackSessions[trackName];
    track.updateCount++;
    
    // RECALCULATE positions for this track (1, 2, 3, ... within track)
    // Sort by best lap time
    const sortedRuns = [...runs].sort((a, b) => {
        const timeA = a.best_time_raw || 999999;
        const timeB = b.best_time_raw || 999999;
        return timeA - timeB;
    });
    
    // Assign track-specific positions
    sortedRuns.forEach((run, index) => {
        run.trackPosition = index + 1;
    });
    
    // Check for session change on this track
    // Detect: 1) Event name changed, 2) Significant kart roster change (>50% different), 3) First session
    const currentKartSet = new Set(runs.map(r => r.kart || r.kart_number));
    const kartSetChanged = !track.lastKartSet.size || 
                          (calculateSetDifference(currentKartSet, track.lastKartSet) > 0.5);
    
    const isNewSession = !track.eventName || 
                        (track.eventName !== eventName) ||
                        (kartSetChanged && runs.length < 5); // New session if roster changed and few karts (session just started)
    
    if (isNewSession && track.sessionId) {
        const kartCount = Object.keys(track.karts).length;
        const totalLaps = Object.values(track.lapHistory).reduce((sum, laps) => sum + laps.length, 0);
        
        logger.info(`🔄 ${trackName} session change detected:`);
        logger.info(`   Event: "${track.eventName}" → "${eventName}"`);
        logger.info(`   Karts: ${kartCount}, Total Laps: ${totalLaps}`);
        
        // Save completed session
        markTrackSessionComplete(trackName);
        
        // Reset track session
        track.karts = {};
        track.lapHistory = {};
        track.previousLapCounts = {};
        track.updateCount = 1;
        track.startTime = Date.now();
        track.sessionId = `${eventName.replace(/[^a-zA-Z0-9]/g, '_')}_${trackName}`;
        track.eventName = eventName;
    } else if (!track.sessionId) {
        // First session for this track
        track.startTime = Date.now();
        track.sessionId = `${eventName.replace(/[^a-zA-Z0-9]/g, '_')}_${trackName}`;
        track.eventName = eventName;
        logger.info(`🆕 Started ${trackName} session: ${track.sessionId}`);
    }
    
    track.lastKartSet = currentKartSet;
    
    // Update karts in this track's session (use sorted runs with track positions)
    sortedRuns.forEach(run => {
        const kartKey = run.kart || run.kart_number;
        if (!kartKey) return;
        
        track.karts[kartKey] = {
            ...track.karts[kartKey],
            ...run,
            pos: run.trackPosition, // Override with track-specific position
            position: run.trackPosition,
            lastSeen: Date.now()
        };
        
        // Track laps
        if (run.last_time_raw && run.total_laps) {
            if (!track.lapHistory[kartKey]) {
                track.lapHistory[kartKey] = [];
            }
            
            const prevLapCount = track.previousLapCounts[kartKey] || 0;
            if (run.total_laps > prevLapCount) {
                track.lapHistory[kartKey].push({
                    lapNum: run.total_laps,
                    timeRaw: run.last_time_raw,
                    position: run.trackPosition, // Use track position
                    timestamp: Date.now()
                });
                track.previousLapCounts[kartKey] = run.total_laps;
            }
        }
    });
    
    // Save session every 5 updates (per track)
    if (track.updateCount % 5 === 0 && Object.keys(track.karts).length >= 2) {
        updateTrackSession(trackName);
    }
    
    // Return modified runs with track positions
    return sortedRuns;
}

/**
 * Calculate how different two sets are (0 = identical, 1 = completely different)
 */
function calculateSetDifference(set1, set2) {
    const union = new Set([...set1, ...set2]);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    return 1 - (intersection.size / union.size);
}

/**
 * Update a track's session file
 */
function updateTrackSession(trackName) {
    const track = trackSessions[trackName];
    if (!track || !track.sessionId) return;
    
    const kartCount = Object.keys(track.karts).length;
    const totalLaps = Object.values(track.lapHistory).reduce((sum, laps) => sum + laps.length, 0);
    
    if (kartCount < 2 || totalLaps < 5) return; // Need minimum data
    
    const sessionDataForTrack = {
        event_name: track.eventName,
        track_name: trackName,
        runs: Object.values(track.karts)
    };
    
    const analysis = processSessionData(sessionDataForTrack, track.lapHistory);
    
    saveSessionData({
        sessionId: track.sessionId,
        eventName: track.eventName,
        trackConfigId: null, // We're using track names now
        trackName: trackName,
        sessionData: sessionDataForTrack,
        analysis,
        lapHistory: track.lapHistory,
        timestamp: new Date().toISOString(),
        isComplete: false
    });
    
    logger.debug(`📝 Updated ${trackName} session: ${kartCount} karts, ${totalLaps} laps`);
}

/**
 * Mark a track's session as complete
 */
function markTrackSessionComplete(trackName) {
    const track = trackSessions[trackName];
    if (!track || !track.sessionId) return;
    
    const kartCount = Object.keys(track.karts).length;
    const totalLaps = Object.values(track.lapHistory).reduce((sum, laps) => sum + laps.length, 0);
    const sessionDuration = track.startTime ? (Date.now() - track.startTime) / 1000 : 0;
    
    // Validation
    if (kartCount < 2) {
        logger.info(`❌ ${trackName} session not saved: only ${kartCount} kart`);
        deleteSession(track.sessionId);
        return;
    }
    
    if (kartCount > 20) {
        logger.warn(`⚠️ ${trackName} session has ${kartCount} karts (max 15 expected) - might be mixing tracks!`);
    }
    
    if (totalLaps < 10) {
        logger.info(`❌ ${trackName} session too short: ${totalLaps} laps`);
        deleteSession(track.sessionId);
        return;
    }
    
    logger.info(`🏁 ${trackName} session complete: "${track.eventName}"`);
    logger.info(`   ${kartCount} karts, ${totalLaps} laps, ${Math.floor(sessionDuration / 60)}m${Math.floor(sessionDuration % 60)}s`);
    
    const sessionDataForTrack = {
        event_name: track.eventName,
        track_name: trackName,
        runs: Object.values(track.karts)
    };
    
    const analysis = processSessionData(sessionDataForTrack, track.lapHistory);
    
    saveSessionData({
        sessionId: track.sessionId,
        eventName: track.eventName,
        trackConfigId: null,
        trackName: trackName,
        sessionData: sessionDataForTrack,
        analysis,
        lapHistory: track.lapHistory,
        timestamp: new Date().toISOString(),
        duration: sessionDuration * 1000,
        isComplete: true
    });
    
    logger.info(`✅ ${trackName} session saved: ${track.sessionId}`);
}

/**
 * Get current socket instance
 */
export function getSocket() {
  return socket;
}

/**
 * Get lap history for all tracks
 */
export function getLapHistory() {
  // Merge all track lap histories
  const merged = {};
  Object.values(trackSessions).forEach(track => {
    Object.assign(merged, track.lapHistory);
  });
  return merged;
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
