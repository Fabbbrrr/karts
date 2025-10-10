// Karting Live Timer - Main App Coordinator
// Entry point that initializes and coordinates all modules

import { CONFIG, DEFAULT_SETTINGS } from './core/config.js';
import state from './core/state.js';
import * as WebSocketService from './services/websocket.service.js';
import * as StorageService from './services/storage.service.js';
import * as LapTrackerService from './services/lap-tracker.service.js';
import * as AudioService from './utils/audio.js';
import * as RaceView from './views/race.view.js';
import * as HUDView from './views/hud.view.js';
import * as AnalysisView from './views/analysis.view.js';
import * as CompareView from './views/compare.view.js';
import * as SummaryView from './views/summary.view.js';
import * as ResultsView from './views/results.view.js';
import * as SettingsView from './views/settings.view.js';

// DOM Elements Cache
const elements = {};

// Initialize the application
function init() {
    console.log('🏎️ Initializing Karting Live Timer v2.0...');
    
    // Cache DOM elements
    cacheDOMElements();
    
    // Load data from localStorage
    loadPersistedData();
    
    // Initialize audio
    state.audioContext = AudioService.initializeAudio();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup PWA features
    setupPWA();
    
    // Connect to WebSocket
    connectWebSocket();
    
    // Auto-show app after 5 seconds if no connection
    setTimeout(() => {
        if (elements.loadingScreen && elements.loadingScreen.classList.contains('active')) {
            console.log('⏱️ Auto-showing app (no data after 5s)');
            showApp();
        }
    }, 5000);
}

// Cache all DOM elements
function cacheDOMElements() {
    // Navigation
    elements.tabNav = document.getElementById('tab-nav');
    elements.tabBtns = document.querySelectorAll('.tab-btn');
    
    // Loading
    elements.loadingScreen = document.getElementById('loading-screen');
    elements.loadingStatus = document.getElementById('loading-status');
    elements.skipLoadingBtn = document.getElementById('skip-loading-btn');
    
    // Connection
    elements.connectionIndicator = document.getElementById('connection-indicator');
    
    // Race tab
    elements.raceScreen = document.getElementById('race-screen');
    elements.eventName = document.getElementById('event-name');
    elements.sessionInfo = document.getElementById('session-info');
    elements.raceList = document.getElementById('race-list');
    
    // HUD tab
    elements.hudScreen = document.getElementById('hud-screen');
    elements.hudNoDriver = document.getElementById('hud-no-driver');
    elements.hudContent = document.getElementById('hud-content');
    elements.hudEventName = document.getElementById('hud-event-name');
    elements.hudLapInfo = document.getElementById('hud-lap-info');
    elements.hudPosition = document.getElementById('hud-position');
    elements.hudKart = document.getElementById('hud-kart');
    elements.hudLastTime = document.getElementById('hud-last-time');
    elements.hudBestTime = document.getElementById('hud-best-time');
    elements.hudAvgTime = document.getElementById('hud-avg-time');
    elements.hudGap = document.getElementById('hud-gap');
    elements.hudInterval = document.getElementById('hud-interval');
    elements.hudConsistency = document.getElementById('hud-consistency');
    elements.hudLapList = document.getElementById('hud-lap-list');
    elements.hudNotesList = document.getElementById('hud-notes-list');
    
    // Results tab
    elements.resultsTableBody = document.getElementById('results-table-body');
    
    // Compare tab
    elements.compareDriver1Select = document.getElementById('compare-driver1-select');
    elements.compareDriver2Select = document.getElementById('compare-driver2-select');
    elements.compareContent = document.getElementById('compare-content');
    elements.compareNoSelection = document.getElementById('compare-no-selection');
    
    // Summary tab
    elements.summaryPositionsList = document.getElementById('summary-positions-list');
    elements.summaryFastestLap = document.getElementById('summary-fastest-lap');
    elements.positionChart = document.getElementById('position-chart');
    
    // Analysis tab
    elements.analysisScreen = document.getElementById('analysis-screen');
    elements.analysisNoData = document.getElementById('analysis-no-data');
    elements.analysisContent = document.getElementById('analysis-content');
    elements.analysisStats = document.getElementById('analysis-stats');
    elements.analysisTableBody = document.getElementById('analysis-table-body');
    elements.analysisDetails = document.getElementById('analysis-details');
    
    // Settings tab
    elements.mainDriverSelect = document.getElementById('main-driver-select');
    elements.channelInput = document.getElementById('channel-input');
    elements.showIntervalsCheckbox = document.getElementById('show-intervals');
    elements.showGapsCheckbox = document.getElementById('show-gaps');
    elements.showConsistencyCheckbox = document.getElementById('show-consistency');
    elements.showAvgLapCheckbox = document.getElementById('show-avg-lap');
    elements.showLastLapCheckbox = document.getElementById('show-last-lap');
    elements.hudShowLastLapCheckbox = document.getElementById('hud-show-last-lap');
    elements.hudShowBestLapCheckbox = document.getElementById('hud-show-best-lap');
    elements.hudShowAvgLapCheckbox = document.getElementById('hud-show-avg-lap');
    elements.hudShowGapCheckbox = document.getElementById('hud-show-gap');
    elements.hudShowIntervalCheckbox = document.getElementById('hud-show-interval');
    elements.hudShowConsistencyCheckbox = document.getElementById('hud-show-consistency');
    elements.hudShowLapHistoryCheckbox = document.getElementById('hud-show-lap-history');
    elements.enableBestLapCheckbox = document.getElementById('enable-best-lap');
    elements.enableProximityCheckbox = document.getElementById('enable-proximity');
    elements.proximityThresholdInput = document.getElementById('proximity-threshold');
    
    // Session selector
    elements.sessionSelectorBar = document.getElementById('session-selector-bar');
    elements.goLiveBtn = document.getElementById('go-live-btn');
}

// Load persisted data
function loadPersistedData() {
    // Load settings
    state.settings = StorageService.loadSettings(DEFAULT_SETTINGS);
    SettingsView.applySettings(elements, state.settings);
    
    // Load personal records
    state.personalRecords = StorageService.loadPersonalRecords();
    
    // Load driver notes
    state.driverNotes = StorageService.loadDriverNotes();
    
    // Load recorded sessions
    state.recordedSessions = StorageService.loadRecordedSessions();
    
    // Load kart analysis data
    state.kartAnalysisData = StorageService.loadKartAnalysisData();
    
    // Migrate old data structure to new format (backward compatibility)
    migrateKartAnalysisData();
    
    // Start auto-backup for kart analysis
    startAutoBackup();
}

// Migrate old kart analysis data to ensure all properties exist
function migrateKartAnalysisData() {
    // Ensure laps array exists
    if (!state.kartAnalysisData.laps) {
        state.kartAnalysisData.laps = [];
    }
    
    // Migrate kart objects
    if (state.kartAnalysisData.karts) {
        Object.keys(state.kartAnalysisData.karts).forEach(kartNumber => {
            const kart = state.kartAnalysisData.karts[kartNumber];
            
            // Add missing properties
            if (!kart.lapTimes) kart.lapTimes = [];
            if (!kart.drivers) kart.drivers = [];
            if (!kart.driverHistory) kart.driverHistory = {};
            if (kart.bestLap === undefined) kart.bestLap = Infinity;
            if (kart.worstLap === undefined) kart.worstLap = 0;
            if (kart.totalTime === undefined) kart.totalTime = 0;
            if (kart.totalLaps === undefined) kart.totalLaps = 0;
        });
    }
    
    // Migrate driver objects
    if (state.kartAnalysisData.drivers) {
        Object.keys(state.kartAnalysisData.drivers).forEach(driverName => {
            const driver = state.kartAnalysisData.drivers[driverName];
            
            // Add missing properties
            if (!driver.lapTimes) driver.lapTimes = [];
            if (!driver.karts) driver.karts = [];
            if (!driver.kartHistory) driver.kartHistory = {};
            if (driver.bestLap === undefined) driver.bestLap = Infinity;
            if (driver.totalTime === undefined) driver.totalTime = 0;
            if (driver.totalLaps === undefined) driver.totalLaps = 0;
        });
    }
    
    // Ensure sessions object exists
    if (!state.kartAnalysisData.sessions) {
        state.kartAnalysisData.sessions = {};
    }
    
    console.log('✅ Kart analysis data migration completed');
}

// Setup event listeners
function setupEventListeners() {
    // Skip loading button
    if (elements.skipLoadingBtn) {
        elements.skipLoadingBtn.addEventListener('click', () => {
            console.log('⏭️ User skipped loading screen');
            showApp();
        });
    }
    
    // Tab navigation
    if (elements.tabBtns) {
        elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });
    }
    
    // Race item click - select driver and switch to HUD
    if (elements.raceList) {
        const handleDriverSelect = (e) => {
            // Prevent default to avoid any conflicts
            e.preventDefault();
            
            // Find the race item - check multiple levels
            let raceItem = e.target;
            
            // Traverse up to 5 levels to find .race-item
            for (let i = 0; i < 5 && raceItem; i++) {
                if (raceItem.classList && raceItem.classList.contains('race-item')) {
                    break;
                }
                raceItem = raceItem.parentElement;
            }
            
            if (raceItem && raceItem.dataset && raceItem.dataset.kartNumber) {
                const kartNumber = raceItem.dataset.kartNumber;
                console.log('✅ Driver selected:', kartNumber);
                
                // Visual feedback
                raceItem.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    raceItem.style.transform = '';
                }, 100);
                
                // Update selection
                state.settings.mainDriver = kartNumber;
                saveSettings();
                
                // Update the dropdown to reflect the selection
                if (elements.mainDriverSelect) {
                    elements.mainDriverSelect.value = kartNumber;
                }
                
                // Switch to HUD tab to show the selected driver
                switchTab('hud');
            } else {
                console.log('⚠️ Click outside race item or no kart number found');
            }
        };
        
        // Use both click and touchend for better mobile support
        elements.raceList.addEventListener('click', handleDriverSelect);
        elements.raceList.addEventListener('touchend', handleDriverSelect);
    }
    
    // Settings changes
    if (elements.mainDriverSelect) {
        elements.mainDriverSelect.addEventListener('change', () => {
            state.settings.mainDriver = elements.mainDriverSelect.value;
            saveSettings();
            updateAllViews();
        });
    }
    
    // Compare driver selections
    if (elements.compareDriver1Select) {
        elements.compareDriver1Select.addEventListener('change', () => updateAllViews());
    }
    if (elements.compareDriver2Select) {
        elements.compareDriver2Select.addEventListener('change', () => updateAllViews());
    }
    
    // Analysis details modal - click outside to close
    if (elements.analysisDetails) {
        elements.analysisDetails.addEventListener('click', (e) => {
            if (e.target === elements.analysisDetails) {
                AnalysisView.closeKartDetails(elements);
            }
        });
    }
}

// Setup PWA features
function setupPWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('✅ Service Worker registered:', reg))
            .catch(err => console.error('❌ Service Worker registration failed:', err));
    }
    
    // Enable wake lock for always-on display
    if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen')
            .then(() => console.log('✅ Wake Lock enabled'))
            .catch(err => console.log('⚠️ Wake Lock not available:', err));
    }
}

// Connect to WebSocket
function connectWebSocket() {
    const callbacks = {
        onConnect: handleConnect,
        onDisconnect: handleDisconnect,
        onError: handleConnectionError,
        onData: handleSessionData
    };
    
    const channel = state.settings.channel || CONFIG.CHANNEL;
    state.socket = WebSocketService.connect(callbacks, channel);
    
    updateLoadingStatus('Connecting to RaceFacer...');
}

// WebSocket handlers
function handleConnect() {
    state.isConnected = true;
    updateConnectionIndicator(true);
    updateLoadingStatus('Connected! Waiting for data...');
}

function handleDisconnect() {
    state.isConnected = false;
    updateConnectionIndicator(false);
}

function handleConnectionError(error) {
    console.error('Connection error:', error);
    updateLoadingStatus('Connection failed. Retrying...');
}

function handleSessionData(data) {
    try {
        // Ignore live data if in replay mode
        if (state.isReplayMode) return;
        
        state.sessionData = data;
        
        // Detect session change
        const detection = LapTrackerService.detectSessionChange(
            data,
            state.currentSessionId,
            state.lapHistory
        );
        
        if (detection.needsReset) {
            resetSessionData();
        }
        
        state.currentSessionId = detection.sessionId;
        
        // Update lap history
        const updated = LapTrackerService.updateLapHistory(
            data,
            state.lapHistory,
            state.positionHistory,
            handleNewLap
        );
        
        state.lapHistory = updated.lapHistory;
        state.positionHistory = updated.positionHistory;
        
        // Update session best
        state.sessionBest = LapTrackerService.updateSessionBest(data, state.sessionBest);
        
        // First time receiving data - show app
        if (elements.loadingScreen && elements.loadingScreen.classList.contains('active')) {
            showApp();
        }
        
        // Update driver dropdown
        RaceView.updateDriverDropdown(elements, data);
        
        // Update all views
        updateAllViews();
        
    } catch (error) {
        console.error('Error processing session data:', error);
    }
}

// Handle new lap detection
function handleNewLap(run, lapNum, lapData) {
    const kartNumber = run.kart_number;
    
    // Check for best lap celebration
    if (state.settings.enableBestLapCelebration) {
        const isNewBest = LapTrackerService.checkBestLapCelebration(
            kartNumber,
            run.best_time_raw,
            state.lastBestLap
        );
        
        if (isNewBest) {
            AudioService.playBestLapCelebration(true);
            AudioService.vibrate([100, 50, 100]);
            console.log(`🏆 New best lap for Kart ${kartNumber}!`);
        }
    }
    
    // Collect lap for kart analysis
    collectKartAnalysisLap(run, lapNum);
}

// Collect lap for kart analysis
function collectKartAnalysisLap(run, lapNum) {
    const sessionId = state.currentSessionId || 'unknown';
    
    const lapRecord = {
        timestamp: Date.now(),
        sessionId: sessionId,
        kartNumber: run.kart_number,
        driverName: run.name,
        lapTime: run.last_time,
        lapTimeRaw: run.last_time_raw,
        position: run.pos,
        lapNum: lapNum
    };
    
    // Add to laps array
    state.kartAnalysisData.laps.push(lapRecord);
    
    // Update kart stats
    if (!state.kartAnalysisData.karts[run.kart_number]) {
        state.kartAnalysisData.karts[run.kart_number] = {
            totalLaps: 0,
            bestLap: Infinity,
            worstLap: 0,
            totalTime: 0,
            drivers: [],
            driverHistory: {},
            lapTimes: []
        };
    }
    
    const kart = state.kartAnalysisData.karts[run.kart_number];
    
    // Ensure all properties exist (for backward compatibility with old data)
    if (!kart.lapTimes) kart.lapTimes = [];
    if (!kart.drivers) kart.drivers = [];
    if (!kart.driverHistory) kart.driverHistory = {};
    
    kart.totalLaps++;
    kart.bestLap = Math.min(kart.bestLap, run.last_time_raw);
    kart.worstLap = Math.max(kart.worstLap, run.last_time_raw);
    kart.totalTime += run.last_time_raw;
    kart.lapTimes.push(run.last_time_raw);
    
    if (!kart.drivers.includes(run.name)) {
        kart.drivers.push(run.name);
    }
    
    kart.driverHistory[run.name] = (kart.driverHistory[run.name] || 0) + 1;
    
    // Update driver stats
    if (!state.kartAnalysisData.drivers[run.name]) {
        state.kartAnalysisData.drivers[run.name] = {
            totalLaps: 0,
            totalTime: 0,
            bestLap: Infinity,
            karts: [],
            kartHistory: {},
            lapTimes: []
        };
    }
    
    const driver = state.kartAnalysisData.drivers[run.name];
    
    // Ensure all properties exist (for backward compatibility with old data)
    if (!driver.lapTimes) driver.lapTimes = [];
    if (!driver.karts) driver.karts = [];
    if (!driver.kartHistory) driver.kartHistory = {};
    
    driver.totalLaps++;
    driver.totalTime += run.last_time_raw;
    driver.bestLap = Math.min(driver.bestLap, run.last_time_raw);
    driver.lapTimes.push(run.last_time_raw);
    
    if (!driver.karts.includes(run.kart_number)) {
        driver.karts.push(run.kart_number);
    }
    
    driver.kartHistory[run.kart_number] = (driver.kartHistory[run.kart_number] || 0) + 1;
    
    // Save to localStorage
    StorageService.saveKartAnalysisData(state.kartAnalysisData);
}

// Reset session data
function resetSessionData() {
    console.log('🔄 Resetting session data...');
    
    // Save current session before resetting
    if (state.sessionData && state.currentSessionId && !state.isReplayMode) {
        saveCurrentSession();
    }
    
    // Reset tracking data
    const reset = LapTrackerService.resetTrackingData();
    Object.assign(state, reset);
}

// Save current session
function saveCurrentSession() {
    const sessionRecord = {
        id: state.currentSessionId,
        timestamp: Date.now(),
        eventName: state.sessionData.event_name,
        channel: state.settings.channel || CONFIG.CHANNEL,
        sessionData: state.sessionData,
        lapHistory: state.lapHistory,
        positionHistory: state.positionHistory,
        startingPositions: state.startingPositions,
        sessionBest: state.sessionBest,
        driverNotes: state.driverNotes
    };
    
    StorageService.saveRecordedSession(sessionRecord);
}

// Save settings
function saveSettings() {
    const settings = SettingsView.getSettingsFromUI(elements);
    Object.assign(state.settings, settings);
    StorageService.saveSettings(state.settings);
}

// Start auto-backup for kart analysis
function startAutoBackup() {
    setInterval(() => {
        const lapCount = state.kartAnalysisData.laps.length;
        if (lapCount === 0) return;
        
        const lastBackup = state.lastAutoBackupTime || 0;
        const now = Date.now();
        const tenMinutes = 10 * 60 * 1000;
        
        if (now - lastBackup < tenMinutes) return;
        
        console.log('💾 Auto-backup triggered...');
        state.lastAutoBackupTime = now;
        StorageService.saveKartAnalysisAutoBackup(state.kartAnalysisData);
    }, 5 * 60 * 1000); // Every 5 minutes
}

// Show app (remove loading screen)
function showApp() {
    if (elements.loadingScreen) elements.loadingScreen.classList.remove('active');
    if (elements.tabNav) elements.tabNav.classList.remove('hidden');
    switchTab('race');
}

// Switch tab
function switchTab(tabName) {
    state.currentTab = tabName;
    
    // Update tab buttons
    elements.tabBtns.forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Show/hide screens
    const screens = document.querySelectorAll('.screen.tab-content');
    screens.forEach(screen => {
        if (screen.id === `${tabName}-screen`) {
            screen.classList.add('active');
        } else {
            screen.classList.remove('active');
        }
    });
    
    // Update view
    updateAllViews();
}

// Update all views
function updateAllViews() {
    if (!state.sessionData && !state.replayData) return;
    
    const data = state.replayData || state.sessionData;
    
    switch (state.currentTab) {
        case 'race':
            RaceView.updateRaceView(elements, data, state.settings);
            break;
        case 'hud':
            HUDView.updateHUDView(elements, data, state);
            HUDView.applyHUDCardVisibility(elements, state.settings);
            break;
        case 'results':
            ResultsView.updateResultsView(elements, data);
            break;
        case 'compare':
            CompareView.updateCompareView(elements, data);
            break;
        case 'summary':
            SummaryView.updateSummaryView(elements, data, state);
            break;
        case 'analysis':
            AnalysisView.updateAnalysisView(elements, state.kartAnalysisData);
            break;
    }
}

// Update loading status
function updateLoadingStatus(message) {
    if (elements.loadingStatus) {
        elements.loadingStatus.textContent = message;
    }
}

// Update connection indicator
function updateConnectionIndicator(connected) {
    if (!elements.connectionIndicator) return;
    
    if (connected) {
        elements.connectionIndicator.classList.remove('disconnected');
        elements.connectionIndicator.classList.add('connected');
    } else {
        elements.connectionIndicator.classList.remove('connected');
        elements.connectionIndicator.classList.add('disconnected');
    }
}

// Export for HTML onclick handlers and debugging
window.kartingApp = {
    state,
    switchTab,
    updateAllViews,
    showKartDetails: (kartNumber) => AnalysisView.showKartDetails(kartNumber, elements, state.kartAnalysisData),
    closeKartDetails: () => AnalysisView.closeKartDetails(elements),
    resetKartAnalysisData: () => {
        if (confirm('Are you sure you want to reset all kart analysis data? This cannot be undone.')) {
            state.kartAnalysisData = { laps: [], drivers: {}, karts: {}, sessions: {} };
            StorageService.clearKartAnalysisData();
            updateAllViews();
            alert('Kart analysis data has been reset.');
        }
    },
    exportKartAnalysisData: () => {
        // This would be implemented similar to the original
        console.log('Export kart analysis data');
    },
    importKartAnalysisData: (file) => {
        // This would be implemented similar to the original
        console.log('Import kart analysis data', file);
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

