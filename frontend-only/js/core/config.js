// Frontend-Only RaceFacer - Configuration
// Central configuration for all app constants and default settings

// Detect if we're running in frontend-only mode (default)
const isFrontendOnly = true;

export const CONFIG = {
    // FRONTEND ONLY MODE
    // When true, UI connects directly to RaceFacer via WebSocket
    // No backend server required - runs entirely in browser
    FRONTEND_ONLY_MODE: isFrontendOnly,
    
    // Direct WebSocket connection to RaceFacer
    SOCKET_URL: 'https://live.racefacer.com:3123',
    CHANNEL: 'lemansentertainment',
    RECONNECT_DELAY: 2000,
    
    // Driver filtering - only save sessions with these drivers
    TRACKED_DRIVERS: [],
    
    // Storage configuration
    MAX_SESSIONS: 50,           // Maximum sessions to store in browser
    STORAGE_ENGINE: 'indexedDB', // Use IndexedDB for larger data
    
    // Feature flags (frontend-only features)
    ENABLE_LIVE_TIMING: true,
    ENABLE_COMPARE_MODE: true,
    ENABLE_SESSION_HISTORY: true,
    ENABLE_KART_ANALYSIS: false, // Disabled in frontend-only mode
    ENABLE_BACKEND_SYNC: false,  // Disabled - no server connection
    
    // UI settings
    DEFAULT_THEME: 'dark',
    AUTO_UPDATE_INTERVAL: 2000, // ms between updates
    MAX_LAP_HISTORY_PER_DRIVER: 100,
    
    // Environment info
    IS_PRODUCTION: true, // Always production for frontend-only deployment
    ENVIRONMENT: 'frontend-only'
};

// Log configuration on load (only in development)
try {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('🔧 RaceFacer Config:', {
            environment: CONFIG.ENVIRONMENT,
            socketUrl: CONFIG.SOCKET_URL,
            channel: CONFIG.CHANNEL
        });
    }
} catch (_) { /* service worker context */ }

export const DEFAULT_SETTINGS = {
    mainDriver: null,
    channel: 'lemansentertainment',
    
    // Display toggles
    showIntervals: true,
    showGaps: true,
    showConsistency: true,
    showAvgLap: true,
    showLastLap: true,
    
    // Feature toggles
    showPaceTrend: true,
    showPercentageOffBest: true,
    showGapTrend: true,
    showPositionChanges: true,
    enableBestLapCelebration: true,
    enableProximityAlert: false, // Disabled in frontend-only mode
    
    // HUD component visibility
    hudShowLastLap: true,
    hudShowBestLap: true,
    hudShowAvgLap: true,
    hudShowGap: true,
    hudShowInterval: true,
    hudShowConsistency: true,
    hudShowLapHistory: true,
    hudShowStats: true,
    
    // Storage settings
    trackedDrivers: [], // List of driver names to track
    
    // Compare mode settings
    compareMethod: 'fastestLap', // Options: fastestLap, totalTime, averageLap, best3Average, consistencyScore

    // Text-to-speech
    enableTTS: false,
    ttsAnnounceGapP1: true,
    ttsAnnounceGapPB: true,

    // Proximity alert threshold (seconds)
    proximityThreshold: 2,

    // UI theme: 'classic' (solid dark) | 'glass' (translucent + blur)
    theme: 'classic'
};

// App metadata
export const APP_INFO = {
    name: 'Karting Live Timer (Frontend-Only)',
    version: '2.0',
    description: 'Real-time go-karting session viewer with browser-only storage'
};