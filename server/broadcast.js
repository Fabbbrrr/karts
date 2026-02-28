// Multi-Client Broadcast System
// Manages SSE connections and broadcasts data to all connected clients

import logger from './logger.js';

// Store all connected clients
const clients = new Map();
let clientIdCounter = 0;

/**
 * Add a new client connection
 * @param {Response} res - Express response object configured for SSE
 * @param {Object} metadata - Client metadata
 * @returns {string} Client ID
 */
export function addClient(res, metadata = {}) {
    const clientId = `client-${++clientIdCounter}-${Date.now()}`;
    
    const client = {
        id: clientId,
        res,
        connectedAt: new Date(),
        lastActivity: new Date(),
        metadata: {
            userAgent: metadata.userAgent || 'Unknown',
            ip: metadata.ip || 'Unknown',
            ...metadata
        }
    };
    
    clients.set(clientId, client);
    
    logger.info(`📱 Client connected: ${clientId}`, {
        totalClients: clients.size,
        ip: client.metadata.ip
    });
    
    return clientId;
}

/**
 * Remove a client connection
 * @param {string} clientId - Client ID
 */
export function removeClient(clientId) {
    const client = clients.get(clientId);
    if (client) {
        clients.delete(clientId);
        logger.info(`📱 Client disconnected: ${clientId}`, {
            totalClients: clients.size,
            duration: Date.now() - client.connectedAt.getTime()
        });
    }
}

/**
 * Send data to a specific client
 * @param {string} clientId - Client ID
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
export function sendToClient(clientId, event, data) {
    const client = clients.get(clientId);
    if (!client) return false;
    
    try {
        client.res.write(`event: ${event}\n`);
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
        client.lastActivity = new Date();
        return true;
    } catch (error) {
        logger.error(`Error sending to client ${clientId}:`, error);
        removeClient(clientId);
        return false;
    }
}

/**
 * Broadcast data to all connected clients
 * @param {string} event - Event name
 * @param {Object} data - Data to broadcast
 */
export function broadcast(event, data) {
    const timestamp = Date.now();
    let successCount = 0;
    let failCount = 0;
    
    for (const [clientId, client] of clients.entries()) {
        try {
            client.res.write(`event: ${event}\n`);
            client.res.write(`data: ${JSON.stringify({ ...data, timestamp })}\n\n`);
            client.lastActivity = new Date();
            successCount++;
        } catch (error) {
            logger.error(`Error broadcasting to client ${clientId}:`, error);
            removeClient(clientId);
            failCount++;
        }
    }
    
    if (clients.size > 0) {
        logger.debug(`📡 Broadcast ${event} to ${successCount} clients (${failCount} failed)`);
    }
    
    return { successCount, failCount };
}

/**
 * Broadcast session data
 * @param {Object} sessionData - Session data from WebSocket
 */
export function broadcastSessionData(sessionData) {
    return broadcast('session', sessionData);
}

/**
 * Broadcast lap completion
 * @param {Object} lapData - Lap data
 */
export function broadcastLap(lapData) {
    return broadcast('lap', lapData);
}

/**
 * Broadcast position change
 * @param {Object} positionData - Position change data
 */
export function broadcastPositionChange(positionData) {
    return broadcast('position', positionData);
}

/**
 * Broadcast incident/event
 * @param {Object} incidentData - Incident data
 */
export function broadcastIncident(incidentData) {
    return broadcast('incident', incidentData);
}

/**
 * Send heartbeat to all clients
 */
export function sendHeartbeat() {
    return broadcast('heartbeat', {
        serverTime: Date.now(),
        connectedClients: clients.size
    });
}

/**
 * Get all connected clients info
 */
export function getClients() {
    return Array.from(clients.values()).map(client => ({
        id: client.id,
        connectedAt: client.connectedAt,
        lastActivity: client.lastActivity,
        durationSeconds: Math.floor((Date.now() - client.connectedAt.getTime()) / 1000),
        metadata: client.metadata
    }));
}

/**
 * Get client statistics
 */
export function getClientStats() {
    const now = Date.now();
    const clients_array = Array.from(clients.values());
    
    return {
        totalClients: clients.size,
        activeClients: clients_array.filter(c => 
            now - c.lastActivity.getTime() < 30000 // Active in last 30s
        ).length,
        oldestConnectionSeconds: clients.size > 0
            ? Math.floor((now - Math.min(...clients_array.map(c => c.connectedAt.getTime()))) / 1000)
            : 0,
        newestConnectionSeconds: clients.size > 0
            ? Math.floor((now - Math.max(...clients_array.map(c => c.connectedAt.getTime()))) / 1000)
            : 0
    };
}

/**
 * Clean up stale connections
 */
export function cleanupStaleConnections() {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    let removed = 0;
    
    for (const [clientId, client] of clients.entries()) {
        if (now - client.lastActivity.getTime() > staleThreshold) {
            logger.warn(`Removing stale client: ${clientId}`);
            removeClient(clientId);
            removed++;
        }
    }
    
    if (removed > 0) {
        logger.info(`🧹 Cleaned up ${removed} stale connections`);
    }
    
    return removed;
}

// Heartbeat interval (every 30 seconds)
setInterval(() => {
    if (clients.size > 0) {
        sendHeartbeat();
    }
}, 30000);

// Cleanup interval (every 5 minutes)
setInterval(() => {
    cleanupStaleConnections();
}, 5 * 60 * 1000);


