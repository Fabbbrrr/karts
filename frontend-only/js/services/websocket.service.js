// Frontend-Only RaceFacer - WebSocket Service
// Manages direct Socket.IO connection to RaceFacer live timing
// No backend server required - runs entirely in browser

import { CONFIG } from '../core/config.js';

let socket = null;
let messageHistory = [];

// Event callbacks storage
const eventCallbacks = {
    onConnect: [],
    onDisconnect: [],
    onError: [],
    onData: [],
    onLap: []
};

/**
 * Initialize and connect to RaceFacer WebSocket server
 * @param {Object} callbacks - Event callbacks object
 * @returns {boolean} Connection success status
 */
export function connect(callbacks = {}) {
    console.log('🔌 Connecting to RaceFacer WebSocket...');
    
    // Merge provided callbacks
    for (const [event, callback] of Object.entries(callbacks)) {
        if (Array.isArray(eventCallbacks[event])) {
            eventCallbacks[event].push(callback);
        }
    }
    
    try {
        // Create Socket.IO connection to RaceFacer
        socket = io(CONFIG.SOCKET_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: CONFIG.RECONNECT_DELAY,
            reconnectionAttempts: Infinity
        });
        
        // Setup event listeners
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);
        socket.on(CONFIG.CHANNEL, handleData);
        
        console.log(`📡 Connected to ${CONFIG.SOCKET_URL}`);
        return true;
    } catch (error) {
        console.error('❌ WebSocket initialization error:', error);
        notifyListeners('onError', error);
        return false;
    }
}

/**
 * Handle successful connection
 */
function handleConnect() {
    console.log('✅ Connected to RaceFacer');
    
    // Join the channel to receive data
    if (socket) {
        socket.emit('join', CONFIG.CHANNEL);
        console.log(`📡 Joined channel: ${CONFIG.CHANNEL}`);
    }
    
    notifyListeners('onConnect');
}

/**
 * Handle disconnection
 */
function handleDisconnect() {
    console.log('❌ Disconnected from RaceFacer');
    notifyListeners('onDisconnect');
}

/**
 * Handle connection error
 * @param {Error} error - Connection error
 */
function handleConnectError(error) {
    console.error('⚠️ Connection error:', error);
    notifyListeners('onError', error);
}

/**
 * Handle incoming data from RaceFacer
 * @param {Object} data - Session data from server
 */
function handleData(data) {
    try {
        // Store message in history (keep last 20)
        messageHistory.unshift({
            timestamp: Date.now(),
            data: data
        });
        
        if (messageHistory.length > 20) {
            messageHistory = messageHistory.slice(0, 20);
        }
        
        // Notify data listeners
        // RaceFacer emits the session object directly on the channel event.
        // Some proxy setups wrap it as { data: { runs: [...] } }, so handle both.
        const payload = (data && data.data) ? data.data : data;
        if (payload && typeof payload === 'object') {
            console.log('📦 Raw socket payload keys:', Object.keys(payload));
            notifyListeners('onData', payload);
        }
        
        // Check for lap completions
        if (isLapComplete(data)) {
            const lapData = extractLapData(data);
            if (lapData) {
                notifyListeners('onLap', lapData);
            }
        }
    } catch (error) {
        console.error('Error processing session data:', error);
    }
}

/**
 * Check if the data indicates a lap completion
 * @param {Object} data - Session data
 * @returns {boolean} Whether it's a lap completion event
 */
function isLapComplete(data) {
    // Check for lap-related fields in the data
    return (
        (data.lap && data.kartNumber !== undefined) ||
        (data.data && data.data.sessionState && data.data.sessionState.drivers)
    );
}

/**
 * Extract lap data from session data
 * @param {Object} data - Session data
 * @returns {Object|null} Extracted lap data or null
 */
function extractLapData(data) {
    try {
        // Try different data structures
        if (data.lap && data.kartNumber !== undefined) {
            return {
                kartNumber: data.kartNumber,
                lapTime: data.lap,
                timestamp: Date.now()
            };
        }
        
        if (data.data && data.data.sessionState && data.data.sessionState.drivers) {
            // Check for lap completions in drivers
            const drivers = data.data.sessionState.drivers;
            for (const driver of drivers) {
                if (driver.laps && driver.currentLap !== undefined && driver.currentLap > 0) {
                    return {
                        kartNumber: driver.kartNumber || driver.number,
                        lapTime: driver.lastLapTime || driver.lapTimes?.[driver.currentLap - 1],
                        lapNumber: driver.currentLap,
                        timestamp: Date.now()
                    };
                }
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error extracting lap data:', error);
        return null;
    }
}

/**
 * Disconnect from WebSocket
 */
export function disconnect() {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('🔌 Disconnected from RaceFacer');
    }
}

/**
 * Check if connected
 * @returns {boolean} Connection status
 */
export function isConnected() {
    return !!socket && socket.connected;
}

/**
 * Emit event to server
 * @param {string} event - Event name
 * @param {*} data - Data to send
 */
export function emit(event, data) {
    if (socket) {
        socket.emit(event, data);
        console.log(`📤 Emitted event: ${event}`);
    }
}

/**
 * Update callbacks after initialization
 * @param {Object} callbacks - New callbacks
 */
export function updateCallbacks(callbacks) {
    for (const [event, callback] of Object.entries(callbacks)) {
        if (Array.isArray(eventCallbacks[event])) {
            eventCallbacks[event].push(callback);
        }
    }
}

/**
 * Get current socket instance
 * @returns {Object|null} Socket instance
 */
export function getSocket() {
    return socket;
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

/**
 * Add listener for a specific event type
 * @param {string} eventType - Event type (onConnect, onDisconnect, onError, onData, onLap)
 * @param {Function} callback - Callback function
 */
export function addListener(eventType, callback) {
    if (Array.isArray(eventCallbacks[eventType])) {
        eventCallbacks[eventType].push(callback);
        return true;
    }
    console.warn(`Unknown event type: ${eventType}`);
    return false;
}

/**
 * Remove listener for a specific event type
 * @param {string} eventType - Event type
 * @param {Function} callback - Callback function to remove
 */
export function removeListener(eventType, callback) {
    if (Array.isArray(eventCallbacks[eventType])) {
        const index = eventCallbacks[eventType].indexOf(callback);
        if (index !== -1) {
            eventCallbacks[eventType].splice(index, 1);
            return true;
        }
    }
    return false;
}

/**
 * Notify all listeners for a specific event type
 * @param {string} eventType - Event type
 * @param {...*} args - Arguments to pass to callbacks
 */
function notifyListeners(eventType, ...args) {
    if (Array.isArray(eventCallbacks[eventType])) {
        eventCallbacks[eventType].forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`Error in ${eventType} listener:`, error);
            }
        });
    }
}

/**
 * Reconnect to the WebSocket server
 */
export function reconnect() {
    if (socket && socket.connected) {
        socket.disconnect();
    }
    
    console.log('🔄 Attempting reconnection...');
    return connect({});
}
