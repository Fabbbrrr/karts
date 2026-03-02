// Frontend-Only RaceFacer - State Management
// Manages application state and data flow

import { DEFAULT_SETTINGS } from './config.js';

export const AppState = {
    // Core state
    socket: null,
    isConnected: false,
    currentTab: 'race',

    // Session data
    sessionData: null,
    currentSessionId: null,
    lastBestLap: {},

    // Lap and race tracking
    lapHistory: {},
    startingPositions: {},
    gapHistory: {},
    sessionBest: null,
    personalRecords: null,
    lastGap: {},
    lastPosition: {},
    positionHistory: {},
    lastLapCount: {},

    // Multi-track support
    currentTrackConfig: null,
    trackSessions: {},

    // Audio and alerts
    audioContext: null,
    lastProximityAlert: null,

    // Driver notes
    driverNotes: {},

    // Session replay / history
    isReplayMode: false,
    recordedSessions: [],
    replayData: null,
    isHistoryMode: false,
    currentHistorySession: null,

    // Kart Analysis Data (disabled in frontend-only)
    kartAnalysisData: {
        laps: [],
        drivers: {},
        karts: {},
        sessions: {}
    },
    lastAutoBackupTime: 0,

    // Settings (loaded from localStorage on boot)
    settings: { ...DEFAULT_SETTINGS }
};

// State management functions
export const StateManager = {
    // Initialize state
    init() {
        console.log('📦 Initializing AppState');
        return AppState;
    },
    
    // Update state with merge
    update(newState) {
        Object.assign(AppState, newState);
        AppState.lastUpdate = Date.now();
        this.notifyListeners();
        return AppState;
    },
    
    // Get specific state property
    get(propertyPath) {
        const keys = propertyPath.split('.');
        let value = AppState;
        for (const key of keys) {
            if (value === undefined || value === null) return undefined;
            value = value[key];
        }
        return value;
    },
    
    // Set specific state property
    set(propertyPath, value) {
        const keys = propertyPath.split('.');
        let obj = AppState;
        for (let i = 0; i < keys.length - 1; i++) {
            if (obj[keys[i]] === undefined || obj[keys[i]] === null) {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
        AppState.lastUpdate = Date.now();
        this.notifyListeners();
    },
    
    // Add listener for state changes
    addListener(callback) {
        if (!AppState.listeners) {
            AppState.listeners = new Set();
        }
        AppState.listeners.add(callback);
    },
    
    // Remove listener
    removeListener(callback) {
        if (AppState.listeners) {
            AppState.listeners.delete(callback);
        }
    },
    
    // Notify all listeners of state change
    notifyListeners() {
        if (!AppState.listeners) return;
        const timestamp = Date.now();
        AppState.listeners.forEach(listener => listener(timestamp));
    },
    
    // Clear session data (but keep settings)
    clearSessionData() {
        AppState.sessionData = null;
        AppState.currentSessionId = null;
        AppState.lapHistory = {};
        AppState.personalRecords = null;
        AppState.startingPositions = {};
        AppState.gapHistory = {};
        AppState.positionHistory = {};
        AppState.sessionBest = null;
        AppState.lastGap = {};
        AppState.lastPosition = {};
        AppState.lastLapCount = {};
        AppState.replayData = null;
        AppState.isReplayMode = false;
        AppState.isHistoryMode = false;
        AppState.currentHistorySession = null;
    },

    // Clear all data (including settings)
    resetToDefaults() {
        this.clearSessionData();
        AppState.settings = { ...DEFAULT_SETTINGS };
        AppState.isConnected = false;
        AppState.currentTab = 'race';
    },
    
    // Get tracked drivers from settings
    getTrackedDrivers() {
        const drivers = AppState.settings.trackedDrivers || [];
        return Array.isArray(drivers) ? drivers : []; // Ensure array
    },
    
    // Check if session contains tracked drivers
    hasTrackedDrivers(sessionData) {
        const trackedDrivers = this.getTrackedDrivers();
        if (trackedDrivers.length === 0) return false;
        
        // Check if any driver in the session matches tracked drivers
        if (!sessionData.drivers || !Array.isArray(sessionData.drivers)) return false;
        
        for (const driver of sessionData.drivers) {
            const driverName = driver.name || driver.driver_name || driver.kartNumber || '';
            if (trackedDrivers.some(td => 
                td.toLowerCase() === driverName.toLowerCase()
            )) {
                return true;
            }
        }
        return false;
    },
    
    // Get compare methods
    getCompareMethods() {
        return [
            { id: 'fastestLap', name: 'Fastest Lap', description: 'Winner has the single fastest lap' },
            { id: 'totalTime', name: 'Total Time', description: 'Winner has lowest cumulative time' },
            { id: 'averageLap', name: 'Average Lap', description: 'Winner has best average lap time' },
            { id: 'best3Average', name: 'Best 3 Average', description: 'Best average of top 3 laps' },
            { id: 'consistencyScore', name: 'Consistency Score', description: 'Most consistent driving' }
        ];
    }
};

// Initialize state on module load
StateManager.init();