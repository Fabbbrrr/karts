// Karting Live Timer - Configuration
// Central configuration for all app constants and default settings

// Detect environment
const isProduction = window.location.hostname.includes('run.app') || 
                     window.location.hostname.includes('cloudrun') ||
                     window.location.protocol === 'https:';

// Auto-detect backend URL based on environment
function getBackendUrl() {
    // Production: Use deployed backend
    if (isProduction) {
        return 'https://racefacer-backend-nynn4wphja-uc.a.run.app';
    }
    
    // Development: Try to detect WSL IP or use localhost
    const wslIp = window.localStorage.getItem('wsl_backend_ip');
    if (wslIp) {
        return `http://${wslIp}:3001`;
    }
    
    return 'http://localhost:3001';
}

export const CONFIG = {
    SOCKET_URL: 'https://live.racefacer.com:3123',
    CHANNEL: 'lemansentertainment',
    RECONNECT_DELAY: 2000,
    
    // BACKEND MODE (Recommended - connects via backend server)
    // When true, UI connects to backend via SSE instead of directly to RaceFacer
    // Backend provides: multi-device sync, session replay, 24/7 data collection
    BACKEND_MODE: true,
    SERVER_URL: getBackendUrl(),
    
    // Environment info
    IS_PRODUCTION: isProduction
};

// Log configuration on load
console.log('🔧 RaceFacer Config:', {
    environment: CONFIG.IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT',
    backendUrl: CONFIG.SERVER_URL,
    backendMode: CONFIG.BACKEND_MODE
});

export const DEFAULT_SETTINGS = {
    mainDriver: null,
    channel: 'lemansentertainment', // Track/venue channel
    
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
    enableProximityAlert: true,
    proximityThreshold: 1.0, // Alert threshold in seconds
    colorTheme: 'dark', // Color theme options
    
    // HUD component visibility
    hudShowLastLap: true,
    hudShowBestLap: true,
    hudShowAvgLap: true,
    hudShowGap: true,
    hudShowInterval: true,
    hudShowConsistency: true,
    hudShowLapHistory: true,
    hudShowStats: true
};

// App metadata
export const APP_INFO = {
    name: 'Karting Live Timer',
    version: '2.0',
    description: 'Real-time go-karting session viewer with PWA support'
};

