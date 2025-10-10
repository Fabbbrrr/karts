// Karting Live Timer - WebSocket Service
// Manages Socket.IO connection to RaceFacer live timing

import { CONFIG } from '../core/config.js';

let socket = null;
let connectionCallbacks = {
    onConnect: null,
    onDisconnect: null,
    onError: null,
    onData: null
};

/**
 * Initialize and connect to WebSocket server
 * @param {Object} callbacks - Event callbacks
 * @param {string} channel - Channel to join
 * @returns {Object} Socket instance
 */
export function connect(callbacks = {}, channel = CONFIG.CHANNEL) {
    connectionCallbacks = { ...connectionCallbacks, ...callbacks };
    
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
 * Disconnect from WebSocket
 */
export function disconnect() {
    if (socket) {
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
    return socket && socket.connected;
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

