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
    
    // Update storage status initially
    setTimeout(() => refreshStorageStatus(), 500);
    
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
    elements.hudDriverSelect = document.getElementById('hud-driver-select');
    elements.hudQuickDriverSelect = document.getElementById('hud-quick-driver-select');
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
    elements.hudSessionTimer = document.getElementById('hud-session-timer');
    
    // Results tab
    elements.resultsTableBody = document.getElementById('results-table-body');
    
    // Compare tab
    elements.compareDriver1Select = document.getElementById('compare-driver1');
    elements.compareDriver2Select = document.getElementById('compare-driver2');
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
    
    // Export/Import buttons
    elements.summaryExport = document.getElementById('summary-export');
    elements.exportAllData = document.getElementById('export-all-data');
    elements.importAllData = document.getElementById('import-all-data');
    elements.importFileInput = document.getElementById('import-file-input');
    elements.importAnalysisBtn = document.getElementById('import-analysis-btn');
    elements.importAnalysisFileInput = document.getElementById('import-analysis-file-input');
    
    // Socket data viewer
    elements.viewSocketDataBtn = document.getElementById('view-socket-data-btn');
    elements.socketDataModal = document.getElementById('socket-data-modal');
    elements.socketMessageList = document.getElementById('socket-message-list');
    elements.socketRefreshBtn = document.getElementById('socket-refresh-btn');
    elements.socketClearBtn = document.getElementById('socket-clear-btn');
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
    
    // Auto-backup disabled to save storage (use manual export instead)
    // startAutoBackup();
}

// Migrate old kart analysis data to ensure all properties exist and remove duplication
function migrateKartAnalysisData() {
    // Ensure laps array exists
    if (!state.kartAnalysisData.laps) {
        state.kartAnalysisData.laps = [];
    }
    
    // Migrate kart objects - remove lapTimes array to save storage
    if (state.kartAnalysisData.karts) {
        Object.keys(state.kartAnalysisData.karts).forEach(kartKey => {
            const kart = state.kartAnalysisData.karts[kartKey];
            
            // Remove lapTimes array (duplication - can calculate from laps array)
            if (kart.lapTimes) {
                delete kart.lapTimes;
            }
            
            // Ensure required properties exist
            if (!kart.drivers) kart.drivers = [];
            if (!kart.driverHistory) kart.driverHistory = {};
            if (kart.bestLap === undefined) kart.bestLap = Infinity;
            if (kart.worstLap === undefined) kart.worstLap = 0;
            if (kart.totalTime === undefined) kart.totalTime = 0;
            if (kart.totalLaps === undefined) kart.totalLaps = 0;
            
            // Add kartId if missing (migration for old data)
            if (!kart.kartId) {
                kart.kartId = kartKey;
            }
            // Add kartNumber if missing (for display)
            if (!kart.kartNumber) {
                kart.kartNumber = kartKey;
            }
        });
    }
    
    // Migrate driver objects - remove lapTimes array to save storage
    if (state.kartAnalysisData.drivers) {
        Object.keys(state.kartAnalysisData.drivers).forEach(driverName => {
            const driver = state.kartAnalysisData.drivers[driverName];
            
            // Remove lapTimes array (duplication - can calculate from laps array)
            if (driver.lapTimes) {
                delete driver.lapTimes;
            }
            
            // Ensure required properties exist
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
    
    console.log('✅ Kart analysis data migration completed - storage optimized');
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
            console.log('🔍 Race list clicked', e.target);
            
            // Don't prevent default initially - let it bubble
            // e.preventDefault();
            
            // Find the race item - check multiple levels
            let raceItem = e.target;
            
            // Traverse up to 5 levels to find .race-item
            for (let i = 0; i < 5 && raceItem; i++) {
                if (raceItem.classList && raceItem.classList.contains('race-item')) {
                    console.log('🎯 Found race item at level', i);
                    break;
                }
                raceItem = raceItem.parentElement;
            }
            
            if (raceItem && raceItem.dataset && raceItem.dataset.kartNumber) {
                const kartNumber = raceItem.dataset.kartNumber;
                console.log('✅ Driver selected:', kartNumber);
                console.log('📊 Session data:', state.sessionData);
                console.log('📦 Main driver dropdown:', elements.mainDriverSelect);
                console.log('📋 Dropdown options:', elements.mainDriverSelect?.options.length);
                
                // Visual feedback
                raceItem.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    raceItem.style.transform = '';
                }, 100);
                
                // Update selection
                state.settings.mainDriver = kartNumber;
                saveSettings();
                console.log('💾 Settings saved, mainDriver:', state.settings.mainDriver);
                
                // Update the dropdown to reflect the selection
                if (elements.mainDriverSelect) {
                    elements.mainDriverSelect.value = kartNumber;
                    console.log('🔽 Dropdown value set to:', elements.mainDriverSelect.value);
                }
                
                // Switch to HUD tab to show the selected driver
                switchTab('hud');
                
                // Update all views to show the selected driver
                updateAllViews();
                console.log('✅ Views updated');
            } else {
                console.log('⚠️ Click outside race item or no kart number found', {
                    hasRaceItem: !!raceItem,
                    hasDataset: raceItem?.dataset,
                    kartNumber: raceItem?.dataset?.kartNumber
                });
            }
        };
        
        // Use both click and touchend for better mobile support
        elements.raceList.addEventListener('click', handleDriverSelect);
        elements.raceList.addEventListener('touchend', handleDriverSelect);
        console.log('✅ Race list event listeners attached');
    } else {
        console.warn('⚠️ Race list element not found!');
    }
    
    // Channel input - change track/venue
    if (elements.channelInput) {
        elements.channelInput.addEventListener('change', (e) => {
            const newChannel = e.target.value.trim() || 'lemansentertainment';
            if (newChannel !== state.settings.channel) {
                state.settings.channel = newChannel;
                saveSettings();
                reconnectToChannel();
            }
        });
    }
    
    // Main driver select (settings)
    if (elements.mainDriverSelect) {
        elements.mainDriverSelect.addEventListener('change', (e) => {
            state.settings.mainDriver = e.target.value || null;
            saveSettings();
            updateAllViews();
        });
    }
    
    // HUD driver selector (no driver screen)
    if (elements.hudDriverSelect) {
        elements.hudDriverSelect.addEventListener('change', (e) => {
            const selectedDriver = e.target.value || null;
            console.log('🏎️ HUD driver selector changed:', selectedDriver);
            state.settings.mainDriver = selectedDriver;
            saveSettings();
            
            // Sync other dropdowns
            if (elements.mainDriverSelect) {
                elements.mainDriverSelect.value = selectedDriver || '';
            }
            if (elements.hudQuickDriverSelect) {
                elements.hudQuickDriverSelect.value = selectedDriver || '';
            }
            
            SettingsView.applySettings(elements, state.settings);
            updateAllViews();
        });
    }
    
    // HUD quick driver selector (header)
    if (elements.hudQuickDriverSelect) {
        elements.hudQuickDriverSelect.addEventListener('change', (e) => {
            const selectedDriver = e.target.value || null;
            console.log('🏎️ HUD quick selector changed:', selectedDriver);
            state.settings.mainDriver = selectedDriver;
            saveSettings();
            
            // Sync other dropdowns
            if (elements.mainDriverSelect) {
                elements.mainDriverSelect.value = selectedDriver || '';
            }
            if (elements.hudDriverSelect) {
                elements.hudDriverSelect.value = selectedDriver || '';
            }
            
            SettingsView.applySettings(elements, state.settings);
            updateAllViews();
        });
    }
    
    // Results method selector
    if (elements.resultsMethodSelect) {
        elements.resultsMethodSelect.addEventListener('change', () => {
            ResultsView.updateResultsView(elements, state.sessionData);
        });
    }
    
    // Session selector for replay
    if (elements.sessionSelector) {
        elements.sessionSelector.addEventListener('change', (e) => {
            const sessionId = e.target.value;
            if (sessionId) {
                loadReplaySession(sessionId);
            }
        });
    }
    
    // Go Live button
    if (elements.goLiveBtn) {
        elements.goLiveBtn.addEventListener('click', () => {
            goLive();
        });
    }
    
    // Display toggle settings
    if (elements.showIntervals) {
        elements.showIntervals.addEventListener('change', (e) => {
            state.settings.showIntervals = e.target.checked;
            saveSettings();
            updateAllViews();
        });
    }
    
    if (elements.showGaps) {
        elements.showGaps.addEventListener('change', (e) => {
            state.settings.showGaps = e.target.checked;
            saveSettings();
            updateAllViews();
        });
    }
    
    if (elements.showConsistency) {
        elements.showConsistency.addEventListener('change', (e) => {
            state.settings.showConsistency = e.target.checked;
            saveSettings();
            updateAllViews();
        });
    }
    
    if (elements.showAvgLap) {
        elements.showAvgLap.addEventListener('change', (e) => {
            state.settings.showAvgLap = e.target.checked;
            saveSettings();
            updateAllViews();
        });
    }
    
    if (elements.showLastLap) {
        elements.showLastLap.addEventListener('change', (e) => {
            state.settings.showLastLap = e.target.checked;
            saveSettings();
            updateAllViews();
        });
    }
    
    // New feature settings
    if (elements.showPaceTrend) {
        elements.showPaceTrend.addEventListener('change', (e) => {
            state.settings.showPaceTrend = e.target.checked;
            saveSettings();
            updateAllViews();
        });
    }
    
    if (elements.showPercentageOffBest) {
        elements.showPercentageOffBest.addEventListener('change', (e) => {
            state.settings.showPercentageOffBest = e.target.checked;
            saveSettings();
            updateAllViews();
        });
    }
    
    if (elements.showGapTrend) {
        elements.showGapTrend.addEventListener('change', (e) => {
            state.settings.showGapTrend = e.target.checked;
            saveSettings();
            updateAllViews();
        });
    }
    
    if (elements.showPositionChanges) {
        elements.showPositionChanges.addEventListener('change', (e) => {
            state.settings.showPositionChanges = e.target.checked;
            saveSettings();
            updateAllViews();
        });
    }
    
    if (elements.enableBestLapCelebration) {
        elements.enableBestLapCelebration.addEventListener('change', (e) => {
            state.settings.enableBestLapCelebration = e.target.checked;
            saveSettings();
        });
    }
    
    if (elements.enableProximityAlert) {
        elements.enableProximityAlert.addEventListener('change', (e) => {
            state.settings.enableProximityAlert = e.target.checked;
            saveSettings();
        });
    }
    
    if (elements.colorThemeSelect) {
        elements.colorThemeSelect.addEventListener('change', (e) => {
            state.settings.colorTheme = e.target.value;
            saveSettings();
            applyTheme(e.target.value);
        });
    }
    
    if (elements.resetSettings) {
        elements.resetSettings.addEventListener('click', () => {
            if (confirm('Reset all settings to defaults?')) {
                state.settings = { ...DEFAULT_SETTINGS };
                saveSettings();
                SettingsView.applySettings(elements, state.settings);
                updateAllViews();
            }
        });
    }
    
    // Compare driver selections
    if (elements.compareDriver1Select) {
        elements.compareDriver1Select.addEventListener('change', () => {
            CompareView.updateCompareView(elements, state.sessionData);
        });
    }
    
    if (elements.compareDriver2Select) {
        elements.compareDriver2Select.addEventListener('change', () => {
            CompareView.updateCompareView(elements, state.sessionData);
        });
    }
    
    // Summary tab - export session data
    if (elements.summaryExport) {
        elements.summaryExport.addEventListener('click', () => {
            exportSessionData();
        });
    }
    
    // Data management - export all app data
    if (elements.exportAllData) {
        elements.exportAllData.addEventListener('click', () => {
            exportAllAppData();
        });
    }
    
    // Data management - import all app data
    if (elements.importAllData) {
        elements.importAllData.addEventListener('click', () => {
            elements.importFileInput.click();
        });
    }
    
    if (elements.importFileInput) {
        elements.importFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                importAllAppData(file);
                e.target.value = ''; // Reset input
            }
        });
    }
    
    // Kart analysis import
    if (elements.importAnalysisBtn) {
        elements.importAnalysisBtn.addEventListener('click', () => {
            elements.importAnalysisFileInput.click();
        });
    }
    
    if (elements.importAnalysisFileInput) {
        elements.importAnalysisFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                importKartAnalysisData(file);
                e.target.value = ''; // Reset input
            }
        });
    }
    
    // HUD component toggles in settings
    const hudCheckboxes = [
        { el: elements.hudShowLastLapCheckbox, setting: 'hudShowLastLap' },
        { el: elements.hudShowBestLapCheckbox, setting: 'hudShowBestLap' },
        { el: elements.hudShowAvgLapCheckbox, setting: 'hudShowAvgLap' },
        { el: elements.hudShowGapCheckbox, setting: 'hudShowGap' },
        { el: elements.hudShowIntervalCheckbox, setting: 'hudShowInterval' },
        { el: elements.hudShowConsistencyCheckbox, setting: 'hudShowConsistency' },
        { el: elements.hudShowLapHistoryCheckbox, setting: 'hudShowLapHistory' }
    ];
    
    hudCheckboxes.forEach(({ el, setting }) => {
        if (el) {
            el.addEventListener('change', (e) => {
                state.settings[setting] = e.target.checked;
                saveSettings();
                SettingsView.applyHUDCardVisibility(elements, state.settings);
            });
        }
    });
    
    // Show all HUD components button
    if (elements.showAllHud) {
        elements.showAllHud.addEventListener('click', () => {
            state.settings.hudShowLastLap = true;
            state.settings.hudShowBestLap = true;
            state.settings.hudShowAvgLap = true;
            state.settings.hudShowGap = true;
            state.settings.hudShowInterval = true;
            state.settings.hudShowConsistency = true;
            state.settings.hudShowLapHistory = true;
            saveSettings();
            SettingsView.applySettings(elements, state.settings);
            SettingsView.applyHUDCardVisibility(elements, state.settings);
            alert('All HUD components restored! ✅');
        });
    }
    
    // Driver notes
    if (elements.hudAddNoteBtn) {
        elements.hudAddNoteBtn.addEventListener('click', () => {
            addDriverNote();
        });
    }
    
    if (elements.hudNoteInput) {
        elements.hudNoteInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addDriverNote();
            }
        });
    }
    
    // Socket data viewer
    if (elements.viewSocketDataBtn) {
        elements.viewSocketDataBtn.addEventListener('click', () => {
            openSocketDataViewer();
        });
    }
    
    if (elements.socketRefreshBtn) {
        elements.socketRefreshBtn.addEventListener('click', () => {
            updateSocketDataViewer();
        });
    }
    
    if (elements.socketClearBtn) {
        elements.socketClearBtn.addEventListener('click', () => {
            if (confirm('Clear all socket message history?')) {
                WebSocketService.clearMessageHistory();
                updateSocketDataViewer();
            }
        });
    }
    
    // Analysis details modal - click outside to close
    if (elements.analysisDetails) {
        elements.analysisDetails.addEventListener('click', (e) => {
            if (e.target === elements.analysisDetails) {
                AnalysisView.closeKartDetails(elements);
            }
        });
    }
    
    // Socket data modal - click outside to close
    if (elements.socketDataModal) {
        elements.socketDataModal.addEventListener('click', (e) => {
            if (e.target === elements.socketDataModal) {
                closeSocketDataViewer();
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
    const channel = state.settings.channel || CONFIG.CHANNEL;
    console.log('✅ Connected to RaceFacer');
    console.log(`📡 Listening on channel: ${channel}`);
    console.log('⏰ Waiting for session data... (updates will appear in console)');
}

function handleDisconnect() {
    state.isConnected = false;
    updateConnectionIndicator(false);
    console.log('❌ Disconnected from RaceFacer - reconnecting...');
}

function handleConnectionError(error) {
    console.error('Connection error:', error);
    updateLoadingStatus('Connection failed. Retrying...');
}

function handleSessionData(data) {
    try {
        // Ignore live data if in replay mode
        if (state.isReplayMode) {
            console.log('⏸️ Ignoring live data - in replay mode');
            return;
        }
        
        // Log data receipt for debugging
        const timestamp = new Date().toLocaleTimeString();
        console.log(`📥 [${timestamp}] Session data received:`, {
            currentLap: data?.current_lap,
            timeLeft: data?.time_left,
            runCount: data?.runs?.length,
            eventName: data?.event_name
        });
        
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
        console.log(`🔄 Updating view: ${state.currentTab}`);
        updateAllViews();
        
    } catch (error) {
        console.error('Error processing session data:', error);
    }
}

// Handle new lap detection
function handleNewLap(run, lapNum, lapData) {
    const kartNumber = run.kart_number;
    
    // SCREEN FLASH: Trigger prominent flash for main driver's lap in HUD view
    if (state.settings.mainDriver === kartNumber && state.currentTab === 'hud') {
        triggerLapFlash();
    }
    
    // Update personal records
    const pbResult = LapTrackerService.updatePersonalRecords(run, state.personalRecords);
    state.personalRecords = pbResult.updated;
    
    if (pbResult.isNewPB) {
        console.log(`🏆 New Personal Best for ${run.name}: ${run.last_time}`);
        StorageService.savePersonalRecords(state.personalRecords);
        
        // Play celebration if it's the selected driver
        if (state.settings.mainDriver === kartNumber && state.settings.enableBestLapCelebration) {
            AudioService.playBestLapCelebration(true);
            AudioService.vibrate([100, 50, 100, 50, 100]);
        }
    }
    
    // Check for best lap celebration (session best)
    if (state.settings.enableBestLapCelebration) {
        const isNewBest = LapTrackerService.checkBestLapCelebration(
            kartNumber,
            run.best_time_raw,
            state.lastBestLap
        );
        
        if (isNewBest && !pbResult.isNewPB) {
            AudioService.playBestLapCelebration(true);
            AudioService.vibrate([100, 50, 100]);
            console.log(`🏆 New session best lap for Kart ${kartNumber}!`);
        }
    }
    
    // Collect lap for kart analysis
    collectKartAnalysisLap(run, lapNum);
}

// Trigger prominent screen flash animation
function triggerLapFlash() {
    const hudScreen = document.getElementById('hud-screen');
    if (!hudScreen) return;
    
    // Remove existing flash class if present
    hudScreen.classList.remove('lap-flash');
    
    // Force reflow to restart animation
    void hudScreen.offsetWidth;
    
    // Add flash class
    hudScreen.classList.add('lap-flash');
    
    // Remove after animation completes
    setTimeout(() => {
        hudScreen.classList.remove('lap-flash');
    }, 600);
}

// Collect lap for kart analysis
function collectKartAnalysisLap(run, lapNum) {
    const sessionId = state.currentSessionId || 'unknown';
    
    // FILTER: Exclude laps longer than 60 seconds from kart analysis
    // These are likely incidents, system errors, or forgotten drivers
    const LAP_TIME_THRESHOLD = 60000; // 60 seconds in milliseconds
    if (run.last_time_raw > LAP_TIME_THRESHOLD) {
        console.log(`⚠️ Excluding long lap from analysis: ${run.name} - ${run.last_time} (${run.last_time_raw}ms > ${LAP_TIME_THRESHOLD}ms)`);
        return; // Don't add to analysis data, but lap is still visible in session data
    }
    
    // Use kart_id as the unique identifier for analysis (not kart_number which can change)
    const kartId = run.kart_id ? String(run.kart_id) : run.kart_number;
    
    const lapRecord = {
        timestamp: Date.now(),
        sessionId: sessionId,
        kartId: kartId,                    // Use kart_id for uniqueness
        kartNumber: run.kart_number,       // Store display number for reference
        kartName: run.kart,                // Store full name (e.g., "E14")
        driverName: run.name,
        lapTime: run.last_time,
        lapTimeRaw: run.last_time_raw,
        position: run.pos,
        lapNum: lapNum
    };
    
    // Add to laps array
    state.kartAnalysisData.laps.push(lapRecord);
    
    // Update kart stats by kart_id (minimal storage - no lapTimes array)
    if (!state.kartAnalysisData.karts[kartId]) {
        state.kartAnalysisData.karts[kartId] = {
            kartId: kartId,
            kartNumber: run.kart_number,   // Current display number
            kartName: run.kart,            // Full name
            totalLaps: 0,
            bestLap: Infinity,
            worstLap: 0,
            totalTime: 0,
            drivers: [],
            driverHistory: {}
        };
    }
    
    const kart = state.kartAnalysisData.karts[kartId];
    
    // Update display number if it changed (kart was renumbered)
    if (run.kart_number) {
        kart.kartNumber = run.kart_number;
        kart.kartName = run.kart;
    }
    
    // Ensure all properties exist (for backward compatibility)
    if (!kart.drivers) kart.drivers = [];
    if (!kart.driverHistory) kart.driverHistory = {};
    // Remove old lapTimes array if exists (cleanup)
    if (kart.lapTimes) delete kart.lapTimes;
    
    kart.totalLaps++;
    kart.bestLap = Math.min(kart.bestLap, run.last_time_raw);
    kart.worstLap = Math.max(kart.worstLap, run.last_time_raw);
    kart.totalTime += run.last_time_raw;
    
    if (!kart.drivers.includes(run.name)) {
        kart.drivers.push(run.name);
    }
    
    kart.driverHistory[run.name] = (kart.driverHistory[run.name] || 0) + 1;
    
    // Update driver stats (minimal storage - no lapTimes array)
    if (!state.kartAnalysisData.drivers[run.name]) {
        state.kartAnalysisData.drivers[run.name] = {
            totalLaps: 0,
            totalTime: 0,
            bestLap: Infinity,
            karts: [],
            kartHistory: {}
        };
    }
    
    const driver = state.kartAnalysisData.drivers[run.name];
    
    // Ensure all properties exist (for backward compatibility)
    if (!driver.karts) driver.karts = [];
    if (!driver.kartHistory) driver.kartHistory = {};
    // Remove old lapTimes array if exists (cleanup)
    if (driver.lapTimes) delete driver.lapTimes;
    
    driver.totalLaps++;
    driver.totalTime += run.last_time_raw;
    driver.bestLap = Math.min(driver.bestLap, run.last_time_raw);
    
    if (!driver.karts.includes(run.kart_number)) {
        driver.karts.push(run.kart_number);
    }
    
    driver.kartHistory[run.kart_number] = (driver.kartHistory[run.kart_number] || 0) + 1;
    
    // Track session info for cleanup
    if (!state.kartAnalysisData.sessions[sessionId]) {
        state.kartAnalysisData.sessions[sessionId] = {
            firstLapTimestamp: Date.now(),
            lapCount: 0
        };
    }
    state.kartAnalysisData.sessions[sessionId].lapCount++;
    state.kartAnalysisData.sessions[sessionId].lastLapTimestamp = Date.now();
    
    // Save to localStorage
    StorageService.saveKartAnalysisData(state.kartAnalysisData);
    
    // Check if cleanup needed (every 10 laps to reduce overhead)
    if (state.kartAnalysisData.laps.length % 10 === 0) {
        cleanupOldSessions();
    }
}

// Cleanup old sessions to maintain storage limits
function cleanupOldSessions() {
    const MAX_SESSIONS = 140; // Allows ~30,000 laps (avg 214 laps/session)
    const sessions = state.kartAnalysisData.sessions;
    const sessionIds = Object.keys(sessions);
    
    if (sessionIds.length <= MAX_SESSIONS) return;
    
    // Sort sessions by last lap timestamp (oldest first)
    const sortedSessions = sessionIds
        .map(id => ({ id, timestamp: sessions[id].lastLapTimestamp || sessions[id].firstLapTimestamp }))
        .sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate how many sessions to delete
    const sessionsToDelete = sortedSessions.slice(0, sessionIds.length - MAX_SESSIONS);
    
    if (sessionsToDelete.length === 0) return;
    
    console.log(`🗑️ Cleaning up ${sessionsToDelete.length} old sessions...`);
    
    // Get session IDs to delete
    const deleteSessionIds = new Set(sessionsToDelete.map(s => s.id));
    
    // Remove laps from deleted sessions
    const originalLapCount = state.kartAnalysisData.laps.length;
    state.kartAnalysisData.laps = state.kartAnalysisData.laps.filter(
        lap => !deleteSessionIds.has(lap.sessionId)
    );
    
    // Remove session entries
    deleteSessionIds.forEach(id => {
        delete state.kartAnalysisData.sessions[id];
    });
    
    // Rebuild kart and driver statistics from remaining laps
    rebuildAggregations();
    
    const deletedLaps = originalLapCount - state.kartAnalysisData.laps.length;
    console.log(`✅ Deleted ${deletedLaps} laps from ${sessionsToDelete.length} old sessions. Keeping last ${MAX_SESSIONS} sessions (~30k laps capacity).`);
    
    // Save cleaned data
    StorageService.saveKartAnalysisData(state.kartAnalysisData);
}

// Rebuild kart and driver aggregations from laps array
function rebuildAggregations() {
    console.log(`🔨 Rebuilding aggregations from ${state.kartAnalysisData.laps?.length || 0} laps...`);
    
    // Ensure data structure exists
    if (!state.kartAnalysisData.laps) {
        console.error('❌ No laps array found!');
        return;
    }
    
    // Reset all karts and drivers
    state.kartAnalysisData.karts = {};
    state.kartAnalysisData.drivers = {};
    
    // FILTER: Exclude laps longer than 60 seconds when rebuilding
    const LAP_TIME_THRESHOLD = 60000; // 60 seconds in milliseconds
    let excludedCount = 0;
    
    // Rebuild from laps
    state.kartAnalysisData.laps.forEach(lap => {
        // Skip laps longer than 60 seconds
        if (lap.lapTimeRaw > LAP_TIME_THRESHOLD) {
            excludedCount++;
            return;
        }
        
        // Use kartId if available, fallback to kartNumber for old data
        const lapKartId = lap.kartId || lap.kartNumber;
        
        // Rebuild kart stats
        if (!state.kartAnalysisData.karts[lapKartId]) {
            state.kartAnalysisData.karts[lapKartId] = {
                kartId: lapKartId,
                kartNumber: lap.kartNumber || lapKartId,
                kartName: lap.kartName || lap.kartNumber || lapKartId,
                totalLaps: 0,
                bestLap: Infinity,
                worstLap: 0,
                totalTime: 0,
                drivers: [],
                driverHistory: {}
            };
        }
        
        const kart = state.kartAnalysisData.karts[lapKartId];
        
        // Update display info if available
        if (lap.kartNumber) kart.kartNumber = lap.kartNumber;
        if (lap.kartName) kart.kartName = lap.kartName;
        
        kart.totalLaps++;
        kart.bestLap = Math.min(kart.bestLap, lap.lapTimeRaw);
        kart.worstLap = Math.max(kart.worstLap, lap.lapTimeRaw);
        kart.totalTime += lap.lapTimeRaw;
        
        if (!kart.drivers.includes(lap.driverName)) {
            kart.drivers.push(lap.driverName);
        }
        kart.driverHistory[lap.driverName] = (kart.driverHistory[lap.driverName] || 0) + 1;
        
        // Rebuild driver stats
        if (!state.kartAnalysisData.drivers[lap.driverName]) {
            state.kartAnalysisData.drivers[lap.driverName] = {
                totalLaps: 0,
                totalTime: 0,
                bestLap: Infinity,
                karts: [],
                kartHistory: {}
            };
        }
        
        const driver = state.kartAnalysisData.drivers[lap.driverName];
        driver.totalLaps++;
        driver.totalTime += lap.lapTimeRaw;
        driver.bestLap = Math.min(driver.bestLap, lap.lapTimeRaw);
        
        if (!driver.karts.includes(lapKartId)) {
            driver.karts.push(lapKartId);
        }
        driver.kartHistory[lapKartId] = (driver.kartHistory[lapKartId] || 0) + 1;
    });
    
    if (excludedCount > 0) {
        console.log(`⚠️ Excluded ${excludedCount} laps > 60s from aggregations`);
    }
    console.log(`✅ Rebuilt: ${Object.keys(state.kartAnalysisData.karts).length} karts, ${Object.keys(state.kartAnalysisData.drivers).length} drivers`);
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
    if (!state.sessionData && !state.replayData) {
        console.warn('⚠️ No session or replay data available for view update');
        return;
    }
    
    const data = state.replayData || state.sessionData;
    
    console.log(`📺 Updating ${state.currentTab} view with data:`, {
        runs: data.runs?.length,
        currentLap: data.current_lap,
        timeLeft: data.time_left
    });
    
    switch (state.currentTab) {
        case 'race':
            RaceView.updateRaceView(elements, data, state.settings, state.personalRecords);
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

// Reconnect to a new channel
function reconnectToChannel() {
    console.log('🔄 Reconnecting to new channel...');
    
    if (state.socket) {
        WebSocketService.disconnect();
        const newChannel = state.settings.channel || CONFIG.CHANNEL;
        updateLoadingStatus(`Connecting to ${newChannel}...`);
        
        if (elements.loadingScreen) {
            elements.loadingScreen.classList.add('active');
        }
        if (elements.tabNav) {
            elements.tabNav.classList.add('hidden');
        }
        
        connectWebSocket();
    }
}

// Session replay functions
function loadReplaySession(sessionId) {
    const session = state.recordedSessions.find(s => s.id === sessionId);
    if (!session) {
        console.error('Session not found:', sessionId);
        return;
    }
    
    console.log(`🎬 Loading replay: ${session.eventName}`);
    
    // Enter replay mode
    state.isReplayMode = true;
    state.replayData = session;
    
    // Restore session data
    state.sessionData = session.sessionData;
    state.lapHistory = session.lapHistory;
    state.positionHistory = session.positionHistory;
    state.startingPositions = session.startingPositions;
    state.sessionBest = session.sessionBest;
    state.driverNotes = session.driverNotes || {};
    state.currentSessionId = session.id;
    
    // Update UI
    SettingsView.updateSessionSelector(elements, state.recordedSessions, state.isReplayMode);
    updateAllViews();
    
    console.log('✅ Replay loaded successfully');
}

function goLive() {
    console.log('🔴 Going live...');
    
    // Exit replay mode
    state.isReplayMode = false;
    state.replayData = null;
    
    // Clear current data (will be replaced by live feed)
    state.sessionData = null;
    state.lapHistory = {};
    state.positionHistory = {};
    state.startingPositions = {};
    state.gapHistory = {};
    state.sessionBest = null;
    state.lastBestLap = {};
    state.lastGap = {};
    state.lastPosition = {};
    state.currentSessionId = null;
    
    // Update UI
    SettingsView.updateSessionSelector(elements, state.recordedSessions, state.isReplayMode);
    
    // If we have live data, update views
    if (state.sessionData) {
        updateAllViews();
    }
    
    console.log('✅ Now listening to live feed');
}

// Theme management
function applyTheme(theme) {
    // Remove all theme classes
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-f1-red', 'theme-racing-green');
    
    // Add selected theme class
    document.body.classList.add(`theme-${theme}`);
    
    console.log(`🎨 Theme applied: ${theme}`);
}

// Driver notes functions
function addDriverNote() {
    if (!state.settings.mainDriver || !elements.hudNoteInput) return;
    
    const noteText = elements.hudNoteInput.value.trim();
    if (!noteText) return;
    
    const kartNumber = state.settings.mainDriver;
    const run = state.sessionData?.runs?.find(r => r.kart_number === kartNumber);
    const lapNum = run?.total_laps || 0;
    
    // Initialize notes array for this kart if needed
    if (!state.driverNotes[kartNumber]) {
        state.driverNotes[kartNumber] = [];
    }
    
    // Add note
    const note = {
        lapNum: lapNum,
        note: noteText,
        timestamp: Date.now()
    };
    
    state.driverNotes[kartNumber].push(note);
    
    // Save to localStorage
    StorageService.saveDriverNotes(state.driverNotes);
    
    // Clear input
    elements.hudNoteInput.value = '';
    
    // Update display
    updateDriverNotesList();
    
    // Haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

function deleteDriverNote(kartNumber, timestamp) {
    if (!state.driverNotes[kartNumber]) return;
    
    state.driverNotes[kartNumber] = state.driverNotes[kartNumber].filter(
        note => note.timestamp !== timestamp
    );
    
    StorageService.saveDriverNotes(state.driverNotes);
    updateDriverNotesList();
}

function updateDriverNotesList() {
    if (!elements.hudNotesList || !state.settings.mainDriver) return;
    
    const kartNumber = state.settings.mainDriver;
    const notes = state.driverNotes[kartNumber] || [];
    
    if (notes.length === 0) {
        elements.hudNotesList.innerHTML = '<div class="hud-notes-empty">No notes yet. Add a note to remember important moments!</div>';
        return;
    }
    
    // Reverse to show newest first
    const reversedNotes = [...notes].reverse();
    
    elements.hudNotesList.innerHTML = '';
    
    reversedNotes.forEach(note => {
        const div = document.createElement('div');
        div.className = 'hud-note-item';
        div.innerHTML = `
            <div class="hud-note-header">
                <span class="hud-note-lap">Lap ${note.lapNum}</span>
                <span class="hud-note-time">${new Date(note.timestamp).toLocaleTimeString()}</span>
                <button class="hud-note-delete" onclick="window.kartingApp.deleteDriverNote('${kartNumber}', ${note.timestamp})">×</button>
            </div>
            <div class="hud-note-text">${note.note}</div>
        `;
        elements.hudNotesList.appendChild(div);
    });
}

// Export/Import functions
function exportSessionData() {
    if (!state.sessionData || !state.settings.mainDriver) {
        alert('No session data to export. Select a driver first.');
        return;
    }
    
    const run = state.sessionData.runs.find(r => r.kart_number === state.settings.mainDriver);
    if (!run) return;
    
    const history = state.lapHistory[run.kart_number] || [];
    const exportData = {
        sessionInfo: {
            eventName: state.sessionData.event_name,
            date: new Date().toISOString(),
            driver: `Kart ${run.kart_number} - ${run.name}`
        },
        summary: {
            bestLap: run.best_time,
            averageLap: run.avg_lap,
            totalLaps: run.total_laps,
            finalPosition: run.pos,
            startingPosition: state.startingPositions[run.kart_number],
            consistency: run.consistency_lap
        },
        laps: history.map(lap => ({
            lapNumber: lap.lapNum,
            lapTime: lap.time,
            delta: lap.delta ? (lap.delta < 0 ? `${lap.delta}` : `+${lap.delta}`) : '-',
            position: lap.position
        }))
    };
    
    // Create download
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `karting-session-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function exportAllAppData() {
    const exportData = {
        version: '2.0',
        exportDate: new Date().toISOString(),
        settings: state.settings,
        lapHistory: state.lapHistory,
        personalRecords: state.personalRecords,
        startingPositions: state.startingPositions,
        driverNotes: state.driverNotes
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `karting-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    alert('✅ All data exported successfully!\n\nFile: ' + exportFileDefaultName);
}

function importAllAppData(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate data structure
            if (!importedData.version) {
                throw new Error('Invalid backup file format');
            }
            
            // Confirm import
            const confirmation = confirm(
                `Import backup from ${new Date(importedData.exportDate).toLocaleString()}?\n\n` +
                'This will replace:\n' +
                '- All settings\n' +
                '- Lap history\n' +
                '- Personal records\n' +
                '- Driver notes\n\n' +
                'Current data will be overwritten!'
            );
            
            if (!confirmation) return;
            
            // Import settings
            if (importedData.settings) {
                state.settings = { ...DEFAULT_SETTINGS, ...importedData.settings };
                StorageService.saveSettings(state.settings);
            }
            
            // Import lap history
            if (importedData.lapHistory) {
                state.lapHistory = importedData.lapHistory;
            }
            
            // Import personal records
            if (importedData.personalRecords) {
                state.personalRecords = importedData.personalRecords;
                StorageService.savePersonalRecords(state.personalRecords);
            }
            
            // Import starting positions
            if (importedData.startingPositions) {
                state.startingPositions = importedData.startingPositions;
            }
            
            // Import driver notes
            if (importedData.driverNotes) {
                state.driverNotes = importedData.driverNotes;
                StorageService.saveDriverNotes(state.driverNotes);
            }
            
            // Apply settings and update views
            SettingsView.applySettings(elements, state.settings);
            updateAllViews();
            
            alert('✅ Data imported successfully!');
            
        } catch (error) {
            console.error('Import error:', error);
            alert(`❌ Import failed: ${error.message}`);
        }
    };
    
    reader.readAsText(file);
}

function importKartAnalysisData(file) {
    StorageService.importKartAnalysisData(file, state.kartAnalysisData, 'ask')
        .then(importedData => {
            state.kartAnalysisData = importedData;
            StorageService.saveKartAnalysisData(state.kartAnalysisData);
            updateAllViews();
        })
        .catch(error => {
            console.error('Import error:', error);
        });
}

// Socket data viewer functions
function openSocketDataViewer() {
    if (elements.socketDataModal) {
        elements.socketDataModal.classList.remove('hidden');
        updateSocketDataViewer();
        
        // Auto-refresh every 2 seconds while open
        if (state.socketViewerInterval) {
            clearInterval(state.socketViewerInterval);
        }
        state.socketViewerInterval = setInterval(() => {
            if (!elements.socketDataModal.classList.contains('hidden')) {
                updateSocketDataViewer();
            } else {
                clearInterval(state.socketViewerInterval);
                state.socketViewerInterval = null;
            }
        }, 2000);
    }
}

function closeSocketDataViewer() {
    if (elements.socketDataModal) {
        elements.socketDataModal.classList.add('hidden');
    }
    if (state.socketViewerInterval) {
        clearInterval(state.socketViewerInterval);
        state.socketViewerInterval = null;
    }
}

function updateSocketDataViewer() {
    if (!elements.socketMessageList) return;
    
    const messages = WebSocketService.getMessageHistory();
    
    if (messages.length === 0) {
        elements.socketMessageList.innerHTML = `
            <div style="text-align: center; color: #888; padding: 40px;">
                <p style="font-size: 1.2rem; margin-bottom: 8px;">📭 No messages received yet</p>
                <p style="font-size: 0.9rem;">Wait for data to arrive from the WebSocket connection</p>
            </div>
        `;
        return;
    }
    
    const messagesHtml = messages.map((msg, index) => {
        const timestamp = new Date(msg.timestamp).toLocaleTimeString();
        const jsonStr = JSON.stringify(msg.data, null, 2);
        
        return `
            <div style="border: 1px solid #333; border-radius: 8px; padding: 12px; margin-bottom: 12px; background: #0a0a0a;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #333;">
                    <span style="color: #00ff88; font-weight: bold;">Message #${messages.length - index}</span>
                    <span style="color: #888; font-size: 0.85rem;">${timestamp}</span>
                </div>
                <pre style="
                    background: #000;
                    padding: 12px;
                    border-radius: 4px;
                    overflow-x: auto;
                    margin: 0;
                    font-size: 0.85rem;
                    line-height: 1.4;
                    color: #e0e0e0;
                    max-height: 400px;
                    overflow-y: auto;
                "><code>${escapeHtml(jsonStr)}</code></pre>
            </div>
        `;
    }).join('');
    
    elements.socketMessageList.innerHTML = messagesHtml;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Storage status monitoring
function refreshStorageStatus() {
    const status = StorageService.getKartAnalysisStorageStatus();
    const contentEl = document.getElementById('storage-status-content');
    
    if (!contentEl) return;
    
    // Determine color based on zone
    let zoneColor = '#00ff88'; // green
    let zoneEmoji = '✅';
    if (status.zone === 'yellow') {
        zoneColor = '#ffaa00';
        zoneEmoji = '⚠️';
    } else if (status.zone === 'orange') {
        zoneColor = '#ff8800';
        zoneEmoji = '🟠';
    } else if (status.zone === 'red') {
        zoneColor = '#ff6b6b';
        zoneEmoji = '🔴';
    }
    
    contentEl.innerHTML = `
        <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #aaa;">Total Laps:</span>
                <span style="color: #fff; font-weight: bold;">${status.lapCount.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #aaa;">Sessions:</span>
                <span style="color: #fff; font-weight: bold;">${status.sessionCount} / 140 max</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #aaa;">Karts Analyzed:</span>
                <span style="color: #fff; font-weight: bold;">${status.kartCount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #aaa;">Unique Drivers:</span>
                <span style="color: #fff; font-weight: bold;">${status.driverCount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #aaa;">Estimated Size:</span>
                <span style="color: #fff; font-weight: bold;">${status.estimatedMB} MB</span>
            </div>
        </div>
        
        <div style="background: #0a0a0a; border-radius: 4px; padding: 8px; border-left: 3px solid ${zoneColor};">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.2rem;">${zoneEmoji}</span>
                <span style="color: ${zoneColor}; font-size: 0.9rem;">${status.message}</span>
            </div>
        </div>
        
        <div style="margin-top: 8px; padding: 8px; background: #0a0a0a; border-radius: 4px;">
            <div style="font-size: 0.75rem; color: #666;">
                💡 Auto-cleanup: Keeps last 140 sessions (~30k laps)<br/>
                📊 Optimized storage: ~200 bytes per lap (no backups)<br/>
                💾 Manual export recommended for long-term data backup<br/>
                ⚠️ Note: 30k laps may exceed Safari 5MB limit. Best on Chrome/Firefox (10MB).
            </div>
        </div>
    `;
}

// Export for HTML onclick handlers and debugging
window.kartingApp = {
    state,
    switchTab,
    updateAllViews,
    selectDriverAndSwitchToHUD: (kartNumber) => {
        console.log('🏎️ Selecting driver and switching to HUD:', kartNumber);
        console.log('Session data available:', !!state.sessionData);
        console.log('Session runs:', state.sessionData?.runs?.length);
        
        // Set main driver in settings
        state.settings.mainDriver = kartNumber;
        StorageService.saveSettings(state.settings);
        
        // Update HUD driver dropdowns
        if (elements.hudDriverSelect) {
            elements.hudDriverSelect.value = kartNumber;
        }
        if (elements.hudQuickDriverSelect) {
            elements.hudQuickDriverSelect.value = kartNumber;
        }
        
        // Update main driver select in settings tab
        if (elements.mainDriverSelect) {
            elements.mainDriverSelect.value = kartNumber;
        }
        
        // Switch to HUD tab (this will call updateAllViews)
        switchTab('hud');
        
        console.log('✅ Driver selected and HUD tab activated');
    },
    showKartDetails: (kartNumber) => {
        console.log('🔍 showKartDetails called for kart:', kartNumber);
        console.log('Elements:', elements);
        console.log('Analysis data:', state.kartAnalysisData);
        return AnalysisView.showKartDetails(kartNumber, elements, state.kartAnalysisData);
    },
    closeKartDetails: () => {
        console.log('🔍 closeKartDetails called');
        return AnalysisView.closeKartDetails(elements);
    },
    deleteDriverNote,
    resetKartAnalysisData: () => {
        if (confirm('Are you sure you want to reset all kart analysis data? This cannot be undone.')) {
            state.kartAnalysisData = { laps: [], drivers: {}, karts: {}, sessions: {} };
            StorageService.saveKartAnalysisData(state.kartAnalysisData);
            localStorage.removeItem('kartAnalysisBackup');
            localStorage.removeItem('kartAnalysisAutoBackup');
            updateAllViews();
            alert('Kart analysis data has been reset.');
        }
    },
    recoverFromBackup: () => {
        const recovered = StorageService.recoverFromBackup();
        if (recovered) {
            console.log('🔍 Recovered data structure:', {
                laps: recovered.laps?.length || 0,
                karts: Object.keys(recovered.karts || {}).length,
                drivers: Object.keys(recovered.drivers || {}).length,
                sessions: Object.keys(recovered.sessions || {}).length
            });
            
            // Set the recovered data
            state.kartAnalysisData = recovered;
            
            // Rebuild aggregations from laps array to ensure data integrity
            console.log('🔄 Rebuilding aggregations from laps...');
            rebuildAggregations();
            
            // Save the rebuilt data
            StorageService.saveKartAnalysisData(state.kartAnalysisData);
            
            // Force update all views
            updateAllViews();
            refreshStorageStatus();
            
            // Switch to analysis tab to show results
            switchTab('analysis');
            
            const lapCount = state.kartAnalysisData.laps?.length || 0;
            const kartCount = Object.keys(state.kartAnalysisData.karts || {}).length;
            alert(`✅ Data recovered and rebuilt!\n\nRestored:\n- ${lapCount} laps\n- ${kartCount} karts\n- ${Object.keys(state.kartAnalysisData.drivers || {}).length} drivers\n- ${Object.keys(state.kartAnalysisData.sessions || {}).length} sessions`);
        } else {
            alert('❌ No backup data found to recover.');
        }
    },
    exportKartAnalysisData: () => {
        if (state.kartAnalysisData.laps.length === 0) {
            alert('No kart analysis data to export. Start collecting data by running sessions.');
            return;
        }
        StorageService.exportKartAnalysisData(state.kartAnalysisData);
        alert('✅ Kart analysis data exported successfully!');
    },
    importKartAnalysisData,
    exportSessionData,
    exportAllAppData,
    importAllAppData,
    openSocketDataViewer,
    closeSocketDataViewer,
    updateSocketDataViewer,
    refreshStorageStatus
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

