/**
 * Server-Sent Events (SSE) Service
 * Connects to backend analysis server for real-time updates
 * Replaces direct WebSocket connection to RaceFacer
 */

import { CONFIG } from '../core/config.js';

let eventSource = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 3000; // 3 seconds

// Polling fallback
let pollingInterval = null;
let pollingEnabled = false;
const POLL_INTERVAL = 1000; // Poll every 1 second
let lastDataTimestamp = 0;

// Callbacks
let onConnectCallback = null;
let onDisconnectCallback = null;
let onDataCallback = null;
let onLapCallback = null;
let onErrorCallback = null;
let serverUrl = null;

/**
 * Initialize SSE connection to backend
 * @param {string} url - Backend server URL
 * @param {Object} callbacks - Event callbacks
 */
export function connect(url, callbacks = {}) {
    serverUrl = url;
    onConnectCallback = callbacks.onConnect || null;
    onDisconnectCallback = callbacks.onDisconnect || null;
    onDataCallback = callbacks.onData || null;
    onLapCallback = callbacks.onLap || null;
    onErrorCallback = callbacks.onError || null;

    const streamUrl = `${serverUrl}/api/stream`;
    console.log('🔌 Connecting to backend SSE stream:', streamUrl);
    
    // TEMPORARY: Start polling immediately as SSE isn't working reliably from Windows to WSL
    console.warn('⚠️ Starting polling immediately (SSE unreliable in WSL network)');
    startPolling();
    return; // Skip SSE for now

    try {
        eventSource = new EventSource(streamUrl);

        // Connection opened
        eventSource.addEventListener('connected', (event) => {
            console.log('✅ Connected to backend via SSE');
            const data = JSON.parse(event.data);
            console.log('Client ID:', data.clientId);
            reconnectAttempts = 0;
            lastDataTimestamp = Date.now();
            
            // Stop polling if it was running
            stopPolling();
            
            if (onConnectCallback) {
                onConnectCallback(data);
            }
        });

        // Session data updates
        eventSource.addEventListener('session', (event) => {
            try {
                const data = JSON.parse(event.data);
                lastDataTimestamp = Date.now();
                console.log('📊 SSE data received:', data.runs?.length, 'runs');
                
                if (onDataCallback) {
                    onDataCallback(data);
                }
            } catch (error) {
                console.error('Error parsing session data:', error);
            }
        });

        // Individual lap completion
        eventSource.addEventListener('lap', (event) => {
            try {
                const data = JSON.parse(event.data);
                lastDataTimestamp = Date.now();
                
                if (onLapCallback) {
                    onLapCallback(data);
                }
            } catch (error) {
                console.error('Error parsing lap data:', error);
            }
        });

        // Heartbeat
        eventSource.addEventListener('heartbeat', (event) => {
            const data = JSON.parse(event.data);
            lastDataTimestamp = Date.now();
            console.debug('💓 Heartbeat');
        });

        // Generic message handler (fallback)
        eventSource.onmessage = (event) => {
            console.log('📨 SSE message:', event.data);
            lastDataTimestamp = Date.now();
        };

        // Error handler
        eventSource.onerror = (error) => {
            clearTimeout(connectionTimeout); // Clear timeout on error
            console.error('❌ SSE connection error', error);
            
            if (eventSource.readyState === EventSource.CLOSED) {
                console.warn('⚠️ SSE connection closed - enabling polling fallback');
                handleDisconnect();
                startPolling(); // Start polling as fallback
            } else if (eventSource.readyState === EventSource.CONNECTING) {
                console.warn('⚠️ SSE still connecting after error - will retry or timeout');
            }

            if (onErrorCallback) {
                onErrorCallback(error);
            }
        };

        // Start monitoring connection health
        startConnectionMonitor();

    } catch (error) {
        console.error('Failed to establish SSE connection:', error);
        console.warn('Starting polling fallback');
        startPolling();
        
        if (onErrorCallback) {
            onErrorCallback(error);
        }
    }
}

/**
 * Handle disconnect and attempt reconnection
 */
function handleDisconnect() {
    if (onDisconnectCallback) {
        onDisconnectCallback();
    }

    // Attempt reconnection
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`🔄 Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        
        reconnectTimer = setTimeout(() => {
            if (eventSource && eventSource.readyState === EventSource.CLOSED) {
                // Need to recreate EventSource
                const serverUrl = CONFIG.SERVER_URL || 'http://localhost:3001';
                connect(serverUrl, {
                    onConnect: onConnectCallback,
                    onDisconnect: onDisconnectCallback,
                    onData: onDataCallback,
                    onLap: onLapCallback,
                    onError: onErrorCallback
                });
            }
        }, RECONNECT_DELAY * reconnectAttempts);
    } else {
        console.error('❌ Max reconnection attempts reached');
    }
}

/**
 * Disconnect from SSE stream
 */
export function disconnect() {
    console.log('🔌 Disconnecting from backend');
    
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }

    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }

    stopPolling();
    stopConnectionMonitor();
    reconnectAttempts = 0;
}

/**
 * Check if connected
 * @returns {boolean}
 */
export function isConnected() {
    return eventSource && eventSource.readyState === EventSource.OPEN;
}

/**
 * Get connection state
 * @returns {string} 'connected', 'connecting', or 'disconnected'
 */
export function getConnectionState() {
    if (!eventSource) return 'disconnected';
    
    switch (eventSource.readyState) {
        case EventSource.CONNECTING:
            return 'connecting';
        case EventSource.OPEN:
            return 'connected';
        case EventSource.CLOSED:
            return 'disconnected';
        default:
            return 'unknown';
    }
}

/**
 * Get reconnection info
 */
export function getReconnectInfo() {
    return {
        attempts: reconnectAttempts,
        maxAttempts: MAX_RECONNECT_ATTEMPTS,
        willRetry: reconnectAttempts < MAX_RECONNECT_ATTEMPTS,
        pollingActive: pollingEnabled
    };
}

/**
 * Start polling as fallback (1 second interval)
 */
function startPolling() {
    if (pollingInterval) return; // Already polling
    
    console.log('🔄 Starting polling fallback (every 1s)');
    pollingEnabled = true;
    
    pollingInterval = setInterval(async () => {
        try {
            const response = await fetch(`${serverUrl}/api/current`);
            if (response.ok) {
                const data = await response.json();
                // /api/current returns { sessionData: {...}, analysis: {...} }
                // We need to extract sessionData
                if (data && data.sessionData) {
                    console.debug(`📊 Polling: Received data with ${data.sessionData.runs?.length || 0} karts`);
                    lastDataTimestamp = Date.now();
                    if (onDataCallback) {
                        onDataCallback(data.sessionData);
                    }
                } else if (data && data.runs) {
                    // Direct format (in case API changes)
                    console.debug(`📊 Polling: Received direct format with ${data.runs.length} karts`);
                    lastDataTimestamp = Date.now();
                    if (onDataCallback) {
                        onDataCallback(data);
                    }
                } else {
                    console.warn('⚠️ Polling: Received data but no sessionData or runs', data);
                }
            } else if (response.status === 404) {
                // No current session - send empty data
                console.debug('📊 Polling: No current session (404)');
                if (onDataCallback) {
                    onDataCallback({ runs: [] });
                }
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, POLL_INTERVAL);
}

/**
 * Stop polling
 */
function stopPolling() {
    if (pollingInterval) {
        console.log('⏹️ Stopping polling fallback');
        clearInterval(pollingInterval);
        pollingInterval = null;
        pollingEnabled = false;
    }
}

/**
 * Monitor connection health and restart if needed
 */
let connectionMonitor = null;
function startConnectionMonitor() {
    if (connectionMonitor) return;
    
    connectionMonitor = setInterval(() => {
        const timeSinceLastData = Date.now() - lastDataTimestamp;
        
        // If no data for 60 seconds and SSE is supposedly connected
        if (timeSinceLastData > 60000 && eventSource && eventSource.readyState === EventSource.OPEN) {
            console.warn('⚠️ No data received for 60s despite SSE being open - restarting');
            disconnect();
            connect(serverUrl, {
                onConnect: onConnectCallback,
                onDisconnect: onDisconnectCallback,
                onData: onDataCallback,
                onLap: onLapCallback,
                onError: onErrorCallback
            });
        }
    }, 30000); // Check every 30 seconds
}

/**
 * Stop connection monitor
 */
function stopConnectionMonitor() {
    if (connectionMonitor) {
        clearInterval(connectionMonitor);
        connectionMonitor = null;
    }
}

