// Karting Live Timer - WebSocket Service
// Manages Socket.IO connection to RaceFacer live timing OR SSE connection to backend

import { CONFIG } from '../core/config.js';
import * as MockDataService from './mock-data.service.js';
import * as SSEService from './sse.service.js';

let socket = null;
let connectionCallbacks = {
    onConnect: null,
    onDisconnect: null,
    onError: null,
    onData: null
};

// Store last 20 socket messages for debugging
let messageHistory = [];

// Mock mode state
let mockModeEnabled = false;

// Backend mode state (SSE instead of direct WebSocket)
let backendModeEnabled = false;

/**
 * Initialize and connect to WebSocket server or Backend SSE
 * @param {Object} callbacks - Event callbacks
 * @param {string} channel - Channel to join (only for direct WebSocket)
 * @returns {Object} Socket instance or null (for SSE)
 */
export function connect(callbacks = {}, channel = CONFIG.CHANNEL) {
    connectionCallbacks = { ...connectionCallbacks, ...callbacks };
    
    // If backend mode is enabled, use SSE instead of direct WebSocket
    if (backendModeEnabled) {
        console.log('🏢 Backend mode enabled - connecting via SSE');
        SSEService.connect(CONFIG.SERVER_URL || 'http://localhost:3001', {
            onConnect: (data) => {
                console.log('✅ SSE Connected:', data);
                if (connectionCallbacks.onConnect) {
                    connectionCallbacks.onConnect();
                }
            },
            onDisconnect: () => {
                console.warn('⚠️ SSE Disconnected');
                if (connectionCallbacks.onDisconnect) {
                    connectionCallbacks.onDisconnect();
                }
            },
            onData: (data) => {
                // Add to message history
                messageHistory.unshift({
                    timestamp: Date.now(),
                    data: data
                });
                messageHistory = messageHistory.slice(0, 20);
                
                if (connectionCallbacks.onData) {
                    connectionCallbacks.onData(data);
                }
            },
            onLap: (lapData) => {
                console.log('🏁 Lap completed:', lapData);
                // Lap data is also included in session data
            },
            onError: (error) => {
                console.error('❌ SSE Error:', error);
                if (connectionCallbacks.onError) {
                    connectionCallbacks.onError(error);
                }
            }
        });
        return null; // SSE doesn't return a socket object
    }
    
    // Otherwise, use direct WebSocket connection to RaceFacer
    try {
        socket = io(CONFIG.SOCKET_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: CONFIG.RECONNECT_DELAY,
            reconnectionAttempts: Infinity
        });
        
        // Setup event listeners
        socket.on('connect', () => handleConnect(channel));
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);
        
        // Listen to the channel for data
        socket.on(channel, handleData);
        
        console.log(`🔌 Connecting to ${CONFIG.SOCKET_URL}...`);
        
        return socket;
    } catch (error) {
        console.error('WebSocket connection error:', error);
        if (connectionCallbacks.onError) {
            connectionCallbacks.onError(error);
        }
        return null;
    }
}

/**
 * Handle successful connection
 * @param {string} channel - Channel to join
 */
function handleConnect(channel) {
    console.log('✅ Connected to RaceFacer');
    
    // Join the channel
    if (socket) {
        socket.emit('join', channel);
        console.log(`📡 Joined channel: ${channel}`);
    }
    
    if (connectionCallbacks.onConnect) {
        connectionCallbacks.onConnect();
    }
}

/**
 * Handle disconnection
 */
function handleDisconnect() {
    console.log('❌ Disconnected from RaceFacer');
    
    if (connectionCallbacks.onDisconnect) {
        connectionCallbacks.onDisconnect();
    }
}

/**
 * Handle connection error
 * @param {Error} error - Connection error
 */
function handleConnectError(error) {
    console.error('⚠️ Connection error:', error);
    
    if (connectionCallbacks.onError) {
        connectionCallbacks.onError(error);
    }
}

/**
 * Handle incoming data from channel
 * @param {Object} data - Session data from server
 */
function handleData(data) {
    try {
        // Store message in history (keep last 20)
        messageHistory.unshift({
            timestamp: new Date().toISOString(),
            data: data
        });
        
        if (messageHistory.length > 20) {
            messageHistory = messageHistory.slice(0, 20);
        }
        
        if (data && data.data && connectionCallbacks.onData) {
            connectionCallbacks.onData(data.data);
        }
    } catch (error) {
        console.error('Error processing session data:', error);
    }
}

/**
 * Reconnect to a different channel
 * @param {string} newChannel - New channel name
 * @param {string} oldChannel - Old channel name to leave
 */
export function reconnectToChannel(newChannel, oldChannel) {
    if (!socket) {
        console.error('Socket not initialized');
        return;
    }
    
    console.log(`🔄 Switching channel: ${oldChannel} → ${newChannel}`);
    
    // Remove old channel listener
    socket.off(oldChannel);
    
    // Add new channel listener
    socket.on(newChannel, handleData);
    
    // Disconnect and reconnect
    socket.disconnect();
    socket.connect();
}

/**
 * Disconnect from WebSocket or SSE
 */
export function disconnect() {
    if (backendModeEnabled) {
        SSEService.disconnect();
        console.log('🔌 Disconnected from backend SSE');
    } else if (socket) {
        socket.disconnect();
        socket = null;
        console.log('🔌 Disconnected from WebSocket');
    }
}

/**
 * Check if connected
 * @returns {boolean} Connection status
 */
export function isConnected() {
    // If in mock mode, always return true
    if (mockModeEnabled) {
        return true;
    }
    // If in backend mode, check SSE connection
    if (backendModeEnabled) {
        return SSEService.isConnected();
    }
    return socket && socket.connected;
}

/**
 * Enable mock mode for testing
 * @param {Object} options - Mock session options
 */
export function enableMockMode(options = {}) {
    console.log('🎭 Enabling mock mode...');
    
    // Disconnect from real WebSocket if connected
    if (socket && socket.connected) {
        console.log('📡 Disconnecting from live timing for mock mode');
        socket.disconnect();
    }
    
    mockModeEnabled = true;
    
    // Start mock session
    MockDataService.startMockSession((sessionData) => {
        // Simulate WebSocket data callback
        if (connectionCallbacks.onData) {
            connectionCallbacks.onData(sessionData.data);
        }
    }, options);
    
    // Simulate connection callback
    if (connectionCallbacks.onConnect) {
        connectionCallbacks.onConnect();
    }
    
    console.log('✅ Mock mode enabled');
}

/**
 * Disable mock mode and return to live mode
 */
export function disableMockMode() {
    console.log('🎭 Disabling mock mode...');
    
    mockModeEnabled = false;
    
    // Stop mock session
    MockDataService.stopMockSession();
    
    // Reconnect to real WebSocket
    if (socket) {
        console.log('📡 Reconnecting to live timing');
        socket.connect();
    }
    
    console.log('✅ Mock mode disabled, returning to live mode');
}

/**
 * Check if in mock mode
 * @returns {boolean} Mock mode status
 */
export function isMockMode() {
    return mockModeEnabled;
}

/**
 * Enable backend mode (SSE instead of direct WebSocket)
 */
export function enableBackendMode() {
    console.log('🏢 Enabling backend mode...');
    backendModeEnabled = true;
}

/**
 * Disable backend mode (use direct WebSocket)
 */
export function disableBackendMode() {
    console.log('🏢 Disabling backend mode...');
    backendModeEnabled = false;
}

/**
 * Check if in backend mode
 * @returns {boolean} Backend mode status
 */
export function isBackendMode() {
    return backendModeEnabled;
}

/**
 * Get current socket instance
 * @returns {Object|null} Socket instance
 */
export function getSocket() {
    return socket;
}

/**
 * Emit event to server
 * @param {string} event - Event name
 * @param {*} data - Data to send
 */
export function emit(event, data) {
    if (socket) {
        socket.emit(event, data);
    }
}

/**
 * Update callbacks after initialization
 * @param {Object} callbacks - New callbacks
 */
export function updateCallbacks(callbacks) {
    connectionCallbacks = { ...connectionCallbacks, ...callbacks };
}

/**
 * Get message history for debugging
 * @returns {Array} Last 20 messages
 */
export function getMessageHistory() {
    return messageHistory;
}

/**
 * Clear message history
 */
export function clearMessageHistory() {
    messageHistory = [];
}

