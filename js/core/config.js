// Karting Live Timer - Configuration
// Central configuration for all app constants and default settings

export const CONFIG = {
    SOCKET_URL: 'https://live.racefacer.com:3123',
    CHANNEL: 'lemansentertainment',
    RECONNECT_DELAY: 2000
};

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

