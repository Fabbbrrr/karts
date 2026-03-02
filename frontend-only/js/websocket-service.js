// Frontend Only - WebSocket Service
// Direct connection to RaceFacer WebSocket (no server proxy needed)

/**
 * WebSocket service for connecting directly to RaceFacer
 * Optimized for mobile browser performance and reliability
 */
export class WebSocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 2000; // Start with 2 second delay
        
        this.callbacks = {
            onConnect: null,
            onDisconnect: null,
            onData: null,
            onError: null
        };
    }

    /**
     * Connect to RaceFacer WebSocket
     */
    connect(channel = 'race') {
        const serverUrl = 'wss://live.racefacer.com:3123';
        
        try {
            this.socket = new WebSocket(serverUrl);
            
            // Connection established
            this.socket.onopen = () => {
                console.log('✅ Connected to RaceFacer');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                if (this.callbacks.onConnect) {
                    this.callbacks.onConnect(channel);
                }
                
                // Join the channel
                this.send('join', { channel: channel });
            };
            
            // Handle incoming messages
            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.channel === channel && data.sessionState) {
                        if (this.callbacks.onData) {
                            this.callbacks.onData(data.sessionState);
                        }
                    }
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };
            
            // Handle connection errors
            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                if (this.callbacks.onError) {
                    this.callbacks.onError(error);
                }
            };
            
            // Handle disconnection
            this.socket.onclose = (event) => {
                console.log('❌ WebSocket disconnected:', event.reason);
                this.isConnected = false;
                
                if (this.callbacks.onDisconnect) {
                    this.callbacks.onDisconnect(event);
                }
                
                // Attempt to reconnect
                this.attemptReconnect();
            };
            
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError(error);
            }
        }
    }

    /**
     * Send data to RaceFacer
     */
    send(event, data = {}) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn('Cannot send: WebSocket not connected');
            return false;
        }
        
        try {
            const message = JSON.stringify({ event, ...data });
            this.socket.send(message);
            return true;
        } catch (error) {
            console.error('Failed to send message:', error);
            return false;
        }
    }

    /**
     * Attempt to reconnect with exponential backoff
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.warn('Max reconnection attempts reached');
            return;
        }
        
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
        
        console.log(`🔄 Attempting reconnect in ${delay}ms...`);
        
        setTimeout(() => {
            this.connect();
            this.reconnectAttempts++;
        }, delay);
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect() {
        if (this.socket) {
            try {
                this.socket.close(1000, 'User disconnected');
            } catch (error) {
                console.error('Error closing socket:', error);
            }
            this.socket = null;
        }
        
        this.isConnected = false;
    }

    /**
     * Check connection status
     */
    isSocketOpen() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }

    /**
     * Register callback for events
     */
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event] = callback;
        }
    }

    /**
     * Get current connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts
        };
    }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
