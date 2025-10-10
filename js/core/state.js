// Karting Live Timer - State Management
// Centralized state management with reactive updates

import { DEFAULT_SETTINGS } from './config.js';

// Application state
const state = {
    socket: null,
    sessionData: null,
    isConnected: false,
    currentTab: 'race',
    settings: { ...DEFAULT_SETTINGS },
    
    // Lap and race tracking
    lapHistory: {},
    startingPositions: {},
    gapHistory: {},
    sessionBest: null,
    personalRecords: null,
    lastBestLap: {},
    lastGap: {},
    currentSessionId: null,
    lastPosition: {},
    positionHistory: {},
    
    // Audio and alerts
    audioContext: null,
    lastProximityAlert: null,
    
    // Driver notes
    driverNotes: {},
    
    // Session replay
    isReplayMode: false,
    recordedSessions: [],
    replayData: null,
    
    // Kart Analysis Data
    kartAnalysisData: {
        laps: [],
        drivers: {},
        karts: {},
        sessions: {}
    },
    lastLapCount: {},
    lastAutoBackupTime: 0
};

// State accessor methods
export const getState = () => state;

export const setState = (updates) => {
    Object.assign(state, updates);
};

export const getSessionData = () => state.sessionData;

export const setSessionData = (data) => {
    state.sessionData = data;
};

export const getSettings = () => state.settings;

export const updateSettings = (settings) => {
    state.settings = { ...state.settings, ...settings };
};

export const getKartAnalysisData = () => state.kartAnalysisData;

export const setKartAnalysisData = (data) => {
    state.kartAnalysisData = data;
};

export const getCurrentTab = () => state.currentTab;

export const setCurrentTab = (tab) => {
    state.currentTab = tab;
};

export const isConnected = () => state.isConnected;

export const setConnected = (connected) => {
    state.isConnected = connected;
};

// Export for legacy compatibility
export default state;

