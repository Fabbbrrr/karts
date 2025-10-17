// Karting Live Timer - Main App Coordinator
// Entry point that initializes and coordinates all modules

import { CONFIG, DEFAULT_SETTINGS } from './core/config.js';
import state from './core/state.js';
import * as WebSocketService from './services/websocket.service.js';
import * as StorageService from './services/storage.service.js';
import * as LapTrackerService from './services/lap-tracker.service.js';
import * as DriverSelectionService from './services/driver-selection.service.js';
import * as SessionHistoryService from './services/session-history.service.js';
import * as AudioService from './utils/audio.js';
import * as TTSService from './utils/tts.js';
import { isDriverStale, getLapAge, TIMESTAMP_THRESHOLDS } from './utils/timestamp-filter.js';
import * as RaceView from './views/race.view.js';
import * as HUDView from './views/hud.view.js';
import * as AnalysisView from './views/analysis.view.js';
import * as CompareView from './views/compare.view.js';
import * as SummaryView from './views/summary.view.js';
import * as ResultsView from './views/results.view.js';
import * as SettingsView from './views/settings.view.js';

// DOM Elements Cache
// WHY: Avoid repeated DOM queries for performance
const elements = {};

/**
 * Initialize the application and all subsystems
 * 
 * PURPOSE: Bootstrap the entire application from page load
 * WHY: Single entry point for initialization ensures proper startup sequence
 * HOW: Sequentially initializes DOM cache, storage, audio, events, PWA, and WebSocket
 * FEATURE: Application Lifecycle, Initialization
 * 
 * @returns {void}
 */
function init() {
    console.log('🏎️ Initializing Karting Live Timer v2.0...');
    
    // Cache DOM elements
    // WHY: Performance optimization - avoid repeated querySelector calls
    cacheDOMElements();
    
    // Load data from localStorage
    // WHY: Restore user settings and persisted analysis data from previous sessions
    loadPersistedData();
    
    // Initialize audio
    // WHY: Prepare audio context for lap celebration sounds
    state.audioContext = AudioService.initializeAudio();
    
    // Setup event listeners
    // WHY: Enable user interaction with UI elements
    setupEventListeners();
    
    // Setup PWA features
    // WHY: Enable offline capabilities and app installation
    setupPWA();
    
    // Connect to WebSocket
    // WHY: Begin receiving live timing data from RaceFacer
    connectWebSocket();
    
    // Update storage status initially
    // WHY: Show user how much space is being used
    setTimeout(() => refreshStorageStatus(), 500);
    
    // Auto-show app after 5 seconds if no connection
    // WHY: Don't leave user stuck on loading screen if WebSocket fails
    setTimeout(() => {
        if (elements.loadingScreen && elements.loadingScreen.classList.contains('active')) {
            console.log('⏱️ Auto-showing app (no data after 5s)');
            showApp();
        }
    }, 5000);
}

/**
 * Cache all DOM element references for performance
 * 
 * PURPOSE: Store references to frequently accessed DOM elements
 * WHY: Dramatically improves performance by avoiding repeated DOM queries
 * HOW: Queries all UI elements once and stores in elements object
 * FEATURE: Performance Optimization, DOM Management
 * 
 * @returns {void}
 */
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
    elements.hudTTSToggle = document.getElementById('hud-tts-toggle');
    
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
    elements.trackConfigFilter = document.getElementById('track-config-filter');
    elements.analysisStats = document.getElementById('analysis-stats');
    elements.analysisTableBody = document.getElementById('analysis-table-body');
    elements.analysisDetails = document.getElementById('analysis-details');
    
    // Race tab filters
    elements.raceTrackConfigFilter = document.getElementById('race-track-config-filter');
    elements.raceFilterSection = document.getElementById('race-filter-section');
    
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
/**
 * Load persisted data from localStorage
 * 
 * PURPOSE: Restore application state from previous session
 * WHY: Preserve user settings, personal records, and kart analysis across sessions
 * HOW: Loads settings, personal records, and kart analysis data from localStorage
 * FEATURE: Data Persistence, State Management
 * 
 * @returns {void}
 */
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

/**
 * Migrate old kart analysis data to ensure all properties exist and remove duplication
 * 
 * PURPOSE: Maintain backward compatibility with older data structures
 * WHY: Data format evolved over versions; must support loading old data
 * HOW: Checks for missing properties, removes deprecated fields, ensures consistency
 * FEATURE: Data Migration, Backward Compatibility, Storage Optimization
 * 
 * @returns {void}
 */
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

/**
 * Setup all event listeners for user interaction
 * 
 * PURPOSE: Bind user actions to application logic
 * WHY: Enable interactive features like tab switching, driver selection, settings changes
 * HOW: Attaches event listeners to buttons, dropdowns, forms, and other interactive elements
 * FEATURE: User Interaction, Event Handling, UI Controls
 * 
 * @returns {void}
 */
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
            DriverSelectionService.handleDriverSelectionChange(
                e.target.value || null,
                elements,
                state,
                updateAllViews
            );
        });
    }
    
    // HUD driver selector (no driver screen)
    if (elements.hudDriverSelect) {
        elements.hudDriverSelect.addEventListener('change', (e) => {
            DriverSelectionService.handleDriverSelectionChange(
                e.target.value || null,
                elements,
                state,
                updateAllViews
            );
        });
    }
    
    // HUD quick driver selector (header)
    if (elements.hudQuickDriverSelect) {
        elements.hudQuickDriverSelect.addEventListener('change', (e) => {
            DriverSelectionService.handleDriverSelectionChange(
                e.target.value || null,
                elements,
                state,
                updateAllViews
            );
        });
    }
    
    // Results method selector
    if (elements.resultsMethodSelect) {
        elements.resultsMethodSelect.addEventListener('change', () => {
            ResultsView.updateResultsView(elements, state.sessionData, state);
        });
    }
    
    // Results refresh button
    const resultsRefreshBtn = document.getElementById('results-refresh-btn');
    if (resultsRefreshBtn) {
        resultsRefreshBtn.addEventListener('click', () => {
            console.log('🔄 Manual results refresh triggered');
            console.log('📊 Current state.sessionData:', state.sessionData);
            console.log('📊 Runs available:', state.sessionData?.runs?.length);
            
            // Use replay data if available, otherwise session data
            const dataToUse = state.replayData || state.sessionData;
            
            if (!dataToUse || !dataToUse.runs || dataToUse.runs.length === 0) {
                console.error('❌ No data available for results calculation');
                alert('No session data available yet. Please wait for the session to start.');
                return;
            }
            
            ResultsView.updateResultsView(elements, dataToUse, state);
        });
    }
    
    // Results session selector
    const resultsSessionSelect = document.getElementById('results-session-select');
    if (resultsSessionSelect) {
        resultsSessionSelect.addEventListener('change', (e) => {
            handleSessionSelection(e.target.value, 'results');
        });
    }
    
    // Results back to live button
    const resultsBackToLive = document.getElementById('results-back-to-live');
    if (resultsBackToLive) {
        resultsBackToLive.addEventListener('click', () => {
            returnToLiveMode('results');
        });
    }
    
    // Summary session selector
    const summarySessionSelect = document.getElementById('summary-session-select');
    if (summarySessionSelect) {
        summarySessionSelect.addEventListener('change', (e) => {
            handleSessionSelection(e.target.value, 'summary');
        });
    }
    
    // Summary back to live button
    const summaryBackToLive = document.getElementById('summary-back-to-live');
    if (summaryBackToLive) {
        summaryBackToLive.addEventListener('click', () => {
            returnToLiveMode('summary');
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
    
    // Track configuration filters
    if (elements.raceTrackConfigFilter) {
        elements.raceTrackConfigFilter.addEventListener('change', () => {
            console.log('🔄 Race track config filter changed:', elements.raceTrackConfigFilter.value);
            updateAllViews();
        });
    }
    
    if (elements.trackConfigFilter) {
        elements.trackConfigFilter.addEventListener('change', () => {
            console.log('🔄 Analysis track config filter changed:', elements.trackConfigFilter.value);
            AnalysisView.updateAnalysisView(elements, state.kartAnalysisData);
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

/**
 * Setup Progressive Web App features
 * 
 * PURPOSE: Enable offline capabilities and app installation
 * WHY: Allows app to work without internet and be installed on home screen
 * HOW: Registers service worker for caching and offline functionality
 * FEATURE: Progressive Web App, Offline Support, Service Worker
 * 
 * @returns {void}
 */
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

/**
 * Connect to RaceFacer WebSocket for live timing data
 * 
 * PURPOSE: Establish real-time connection to receive live race data
 * WHY: Core functionality - app displays live timing from RaceFacer system
 * HOW: Uses WebSocketService to connect via Socket.IO, sets up event handlers
 * FEATURE: Live Timing, WebSocket Connection, Real-Time Data
 * 
 * @returns {void}
 */
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

/**
 * Handle successful WebSocket connection
 * 
 * PURPOSE: Update UI and state when WebSocket connects
 * WHY: User needs feedback that connection is established
 * HOW: Updates connection indicator, logs channel info, shows waiting status
 * FEATURE: WebSocket Connection, Connection Status, Live Timing
 * 
 * @returns {void}
 */
function handleConnect() {
    state.isConnected = true;
    updateConnectionIndicator(true);
    updateLoadingStatus('Connected! Waiting for data...');
    const channel = state.settings.channel || CONFIG.CHANNEL;
    console.log('✅ Connected to RaceFacer');
    console.log(`📡 Listening on channel: ${channel}`);
    console.log('⏰ Waiting for session data... (updates will appear in console)');
}

/**
 * Handle WebSocket disconnection
 * 
 * PURPOSE: Update UI and state when WebSocket disconnects
 * WHY: User needs feedback that live data is no longer flowing
 * HOW: Updates connection indicator classes, logs disconnection
 * FEATURE: WebSocket Connection, Connection Status, Error Handling
 * 
 * @returns {void}
 */
function handleDisconnect() {
    state.isConnected = false;
    updateConnectionIndicator(false);
    console.log('❌ Disconnected from RaceFacer - reconnecting...');
}

/**
 * Handle WebSocket connection errors
 * 
 * PURPOSE: Respond to connection failures
 * WHY: User needs feedback when connection attempts fail
 * HOW: Logs error and updates loading status with retry message
 * FEATURE: Error Handling, WebSocket Connection, User Feedback
 * 
 * @param {Error} error - Connection error object
 * @returns {void}
 */
function handleConnectionError(error) {
    console.error('Connection error:', error);
    updateLoadingStatus('Connection failed. Retrying...');
}

/**
 * Handle incoming session data from WebSocket
 * 
 * PURPOSE: Process live timing data from RaceFacer and update application state
 * WHY: Core functionality - this is where live race data enters the application
 * HOW: Validates data, detects session changes, updates lap history, triggers view updates
 * FEATURE: Live Timing, Session Management, Lap Tracking, Data Processing
 * 
 * @param {Object} data - Session data from WebSocket (runs, lap times, positions, etc.)
 * @returns {void}
 */
function handleSessionData(data) {
    try {
        // Ignore live data if in replay or history mode
        if (state.isReplayMode) {
            console.log('⏸️ Ignoring live data - in replay mode');
            return;
        }
        
        if (state.isHistoryMode) {
            console.log('📅 Ignoring live data - viewing history');
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
        
        // Auto-save previous session if session changed
        if (detection.needsReset && state.currentSessionId && state.sessionData) {
            console.log('💾 Auto-saving previous session to history');
            SessionHistoryService.saveCurrentSession(state.sessionData, state.currentSessionId);
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

/**
 * Handle new lap detection from lap tracker service
 * 
 * PURPOSE: Process when a driver completes a new lap
 * WHY: Trigger celebrations, collect analysis data, update personal records
 * HOW: Checks for personal bests, updates records, collects kart data, triggers audio/visual feedback
 * FEATURE: Lap Detection, Personal Records, Best Lap Celebration, Kart Analysis, HUD Flash
 * 
 * @param {Object} run - Driver run data for the lap
 * @param {number} lapNum - Lap number completed
 * @param {Object} lapData - Additional lap metadata (gap, interval, etc.)
 * @returns {void}
 */
/**
 * Handle new lap detection from lap tracker service
 * 
 * PURPOSE: Process when a driver completes a new lap
 * WHY: Trigger celebrations, collect analysis data, update personal records, announce lap
 * HOW: Checks for personal bests, updates records, collects kart data, triggers audio/visual/voice feedback
 * FEATURE: Lap Detection, Personal Records, Best Lap Celebration, Kart Analysis, HUD Flash, TTS Announcement
 * 
 * @param {Object} run - Driver run data for the lap
 * @param {number} lapNum - Lap number completed
 * @param {Object} lapData - Additional lap metadata (gap, interval, etc.)
 * @returns {void}
 */
function handleNewLap(run, lapNum, lapData) {
    const kartNumber = run.kart_number;
    const isMainDriver = state.settings.mainDriver === kartNumber;
    
    // SCREEN FLASH: Trigger prominent flash for main driver's lap in HUD view
    if (isMainDriver && state.currentTab === 'hud') {
        triggerLapFlash();
    }
    
    // Update personal records
    const pbResult = LapTrackerService.updatePersonalRecords(run, state.personalRecords);
    state.personalRecords = pbResult.updated;
    
    if (pbResult.isNewPB) {
        console.log(`🏆 New Personal Best for ${run.name}: ${run.last_time}`);
        StorageService.savePersonalRecords(state.personalRecords);
        
        // Play celebration if it's the selected driver
        if (isMainDriver && state.settings.enableBestLapCelebration) {
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
        
        // Store last best lap time
        state.lastBestLap[kartNumber] = run.best_time_raw;
    }
    
    // TTS Announcement for main driver
    // WHY: Voice feedback allows driver to keep eyes on track
    // FEATURE: Text-to-Speech, Voice Feedback, Racing UX
    // NOTE: Announce on every lap regardless of which tab is open
    if (state.settings.enableTTS && isMainDriver && run.last_time) {
        console.log('🎤 TTS conditions met, announcing lap');
        
        // Calculate gaps for comprehensive announcement
        const personalBest = LapTrackerService.getPersonalBest(run.name, state.personalRecords);
        let gapToPB = null;
        if (personalBest && run.last_time_raw) {
            const pbGap = LapTrackerService.calculateGapToPersonalBest(run.last_time_raw, personalBest.bestLap);
            gapToPB = pbGap.formatted;
        }
        
        const gapToBest = run.last_time_raw && run.best_time_raw && run.last_time_raw !== run.best_time_raw ? 
            `+${((run.last_time_raw - run.best_time_raw) / 1000).toFixed(3)}` : null;
        
        TTSService.announceLap({
            lapTime: run.last_time,
            position: run.position,
            gapToBest: gapToBest,
            gapToPB: gapToPB,
            gapToP1: run.gap,
            isBestLap: run.last_time_raw === run.best_time_raw,
            // Pass user preferences for what to announce
            announceGapP1: state.settings.ttsAnnounceGapP1,
            announceGapPB: state.settings.ttsAnnounceGapPB
        });
    } else {
        // Debug why TTS didn't fire
        if (!state.settings.enableTTS) console.log('🔇 TTS disabled in settings');
        if (!isMainDriver) console.log('🔇 Not main driver (main:', state.settings.mainDriver, ', lap:', run.kart_number, ')');
        if (!run.last_time) console.log('🔇 No lap time available');
    }
    
    // Collect lap for kart analysis
    collectKartAnalysisLap(run, lapNum);
}

// Trigger prominent screen flash animation
/**
 * Trigger visual flash animation on HUD when main driver completes a lap
 * 
 * PURPOSE: Provide prominent visual feedback for lap completion
 * WHY: User requested more prominent flash to confirm lap was recorded
 * HOW: Adds CSS animation class, removes after animation duration
 * FEATURE: HUD Lap Flash, Visual Feedback, User Experience
 * 
 * @returns {void}
 */
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

/**
 * Collect lap for kart analysis with track configuration and timestamp filtering
 * 
 * PURPOSE: Store individual lap data for long-term kart performance analysis
 * WHY: Track kart performance across sessions while filtering anomalies and stale data
 * HOW: Validates lap time, timestamp age, extracts kart ID, adds track configuration metadata
 * FEATURE: Kart Analysis, Track Configuration Support, 60-Second Lap Filter, Timestamp Filtering
 * 
 * @param {Object} run - Driver run data from current lap
 * @param {number} lapNum - Lap number completed
 * @returns {void}
 */
function collectKartAnalysisLap(run, lapNum) {
    const sessionId = state.currentSessionId || 'unknown';
    const trackConfigId = state.sessionData?.track_configuration_id || 'unknown';
    
    // FILTER: Exclude laps longer than 60 seconds from kart analysis
    // WHY: These are likely incidents, system errors, or forgotten drivers from previous sessions
    // FEATURE: 60-Second Lap Filter (prevents anomalies from corrupting kart performance data)
    const LAP_TIME_THRESHOLD = 60000; // 60 seconds in milliseconds
    if (run.last_time_raw > LAP_TIME_THRESHOLD) {
        console.log(`⚠️ Excluding long lap from analysis: ${run.name} - ${run.last_time} (${run.last_time_raw}ms > ${LAP_TIME_THRESHOLD}ms)`);
        return; // Don't add to analysis data, but lap is still visible in session data for winner determination
    }
    
    // FILTER: Exclude laps that started more than 5 minutes ago
    // WHY: Drivers from previous sessions may still appear if venue doesn't clear them properly
    // FEATURE: Timestamp Filtering (prevents stale drivers from affecting kart analysis)
    if (isDriverStale(run, TIMESTAMP_THRESHOLDS.KART_ANALYSIS)) {
        const lapAge = getLapAge(run);
        const minutesAgo = Math.floor(lapAge / 60);
        console.log(`⏰ Excluding stale lap from analysis: ${run.name} - lap started ${minutesAgo} minutes ago`);
        return; // Don't add to analysis data
    }
    
    // Use kart_id as the base identifier for analysis (not kart_number which can change)
    // WHY: Kart numbers can be renumbered by venue, but kart_id remains stable
    const baseKartId = run.kart_id ? String(run.kart_id) : run.kart_number;
    
    // Create composite key: trackConfig + kart ID for true uniqueness
    // WHY: Same kart number on different track layouts are effectively different configurations
    // FEATURE: Track Configuration Separation (prevents cross-track contamination)
    const kartId = `${trackConfigId}_${baseKartId}`;
    
    // Create lap record with track configuration for proper filtering
    // WHY: Different track layouts (e.g., short vs long circuit) must not be compared
    const lapRecord = {
        timestamp: Date.now(),
        sessionId: sessionId,
        trackConfigId: trackConfigId,         // TRACK CONFIGURATION: Separate different layouts
        kartId: kartId,                        // Composite unique identifier (track + kart)
        baseKartId: baseKartId,                // Original kart ID for reference
        kartNumber: run.kart_number,           // Display number for reference
        kartName: run.kart,                    // Full name (e.g., "E14")
        driverName: run.name,
        lapTime: run.last_time,
        lapTimeRaw: run.last_time_raw,
        position: run.pos,
        lapNum: lapNum
    };
    
    // Add to laps array
    state.kartAnalysisData.laps.push(lapRecord);
    
    // Update kart stats by composite kartId (track + kart ID)
    // WHY: Each track configuration needs separate kart stats
    if (!state.kartAnalysisData.karts[kartId]) {
        state.kartAnalysisData.karts[kartId] = {
            kartId: kartId,
            baseKartId: baseKartId,
            trackConfigId: trackConfigId,
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

/**
 * Rebuild kart and driver aggregations from stored lap array
 * 
 * PURPOSE: Recalculate all kart/driver statistics from raw lap data
 * WHY: Needed after data import, storage recovery, or filter changes
 * HOW: Iterates all laps, filters invalid data, rebuilds aggregate statistics
 * FEATURE: Kart Analysis, Data Recovery, 60-Second Lap Filter, Track Config Support
 * 
 * @returns {void}
 */
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
    // WHY: Prevents corrupted data from affecting statistics after recovery
    const LAP_TIME_THRESHOLD = 60000; // 60 seconds in milliseconds
    let excludedCount = 0;
    
    // Track configuration summary for logging
    const trackConfigs = new Set();
    
    // Rebuild from laps
    state.kartAnalysisData.laps.forEach(lap => {
        // Skip laps longer than 60 seconds
        if (lap.lapTimeRaw > LAP_TIME_THRESHOLD) {
            excludedCount++;
            return;
        }
        
        // Track configurations seen (for logging)
        if (lap.trackConfigId) {
            trackConfigs.add(lap.trackConfigId);
        }
        
        // Use kartId if available, fallback to kartNumber for old data
        // WHY: Maintains backward compatibility with older stored data
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
    
    // Log rebuild results
    if (excludedCount > 0) {
        console.log(`⚠️ Excluded ${excludedCount} laps > 60s from aggregations`);
    }
    if (trackConfigs.size > 0) {
        console.log(`🏁 Track configurations found: ${Array.from(trackConfigs).join(', ')}`);
    }
    console.log(`✅ Rebuilt: ${Object.keys(state.kartAnalysisData.karts).length} karts, ${Object.keys(state.kartAnalysisData.drivers).length} drivers`);
}

// Reset session data
/**
 * Reset session data when a new session is detected
 * 
 * PURPOSE: Clear session-specific tracking data for new race
 * WHY: Different sessions should not share lap history or position data
 * HOW: Resets lap history, position history, gaps, session best, starting positions
 * FEATURE: Session Management, Data Reset, Session Change Detection
 * 
 * @returns {void}
 */
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

/**
 * Save current session for later replay
 * 
 * PURPOSE: Store complete session snapshot for replay feature
 * WHY: Allows user to review past sessions without live connection
 * HOW: Packages session data, lap history, and metadata into sessionRecord object
 * FEATURE: Session Replay, Data Persistence, Session Recording
 * 
 * @returns {void}
 */
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

/**
 * Save user settings to localStorage
 * 
 * PURPOSE: Persist user preferences across sessions
 * WHY: User settings should be remembered between app opens
 * HOW: Extracts settings from UI, stores in localStorage via StorageService
 * FEATURE: Settings Management, Data Persistence, User Preferences
 * 
 * @returns {void}
 */
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
/**
 * Switch between application tabs (views)
 * 
 * PURPOSE: Navigate between different views (Race, HUD, Analysis, etc.)
 * WHY: Provides multi-view interface for different use cases
 * HOW: Updates CSS classes, triggers view-specific updates, manages visibility
 * FEATURE: Navigation, Tab Management, View Switching
 * 
 * @param {string} tabName - Name of tab to switch to ('race', 'hud', 'analysis', etc.)
 * @returns {void}
 */
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

/**
 * Handle session selection from dropdown
 * 
 * PURPOSE: Load historical session when user selects from dropdown
 * WHY: Enable viewing past session results and summaries
 * HOW: Load session from history service, update state, refresh views
 * FEATURE: Session History, Historical Data Viewing
 * 
 * @param {string} sessionId - Selected session ID ("live" or historical ID)
 * @param {string} tab - Which tab triggered the selection ("results" or "summary")
 * @returns {void}
 */
function handleSessionSelection(sessionId, tab) {
    console.log(`📂 Session selection: ${sessionId} from ${tab} tab`);
    
    if (sessionId === 'live') {
        returnToLiveMode(tab);
        return;
    }
    
    // Load historical session
    const session = SessionHistoryService.loadSession(sessionId);
    if (!session) {
        console.error('❌ Failed to load session:', sessionId);
        alert('Failed to load session. Please try again.');
        return;
    }
    
    // Enter history mode
    state.isHistoryMode = true;
    state.currentHistorySession = session;
    
    console.log('📅 Entered history mode:', {
        date: session.date,
        time: session.startTime,
        winner: session.winner.name
    });
    
    // Update banner
    updateHistoryBanner(tab, session);
    
    // Update view with historical data
    if (tab === 'results') {
        ResultsView.updateResultsView(elements, session.sessionData, state);
    } else if (tab === 'summary') {
        SummaryView.updateSummaryView(elements, session.sessionData, state);
    }
}

/**
 * Return to live mode from history viewing
 * 
 * PURPOSE: Exit history mode and resume live updates
 * WHY: User wants to return to current live session
 * HOW: Reset history state, hide banner, restore live data
 * FEATURE: Session History, Live Mode
 * 
 * @param {string} tab - Which tab to return to live mode ("results" or "summary")
 * @returns {void}
 */
function returnToLiveMode(tab) {
    console.log(`🔴 Returning to live mode from ${tab} tab`);
    
    // Exit history mode
    state.isHistoryMode = false;
    state.currentHistorySession = null;
    
    // Reset selector to live
    const selector = document.getElementById(`${tab}-session-select`);
    if (selector) {
        selector.value = 'live';
    }
    
    // Hide banner
    const banner = document.getElementById(`${tab}-history-banner`);
    if (banner) {
        banner.classList.add('hidden');
    }
    
    // Update view with live data
    if (tab === 'results') {
        ResultsView.updateResultsView(elements, state.sessionData, state);
    } else if (tab === 'summary') {
        SummaryView.updateSummaryView(elements, state.sessionData, state);
    }
    
    console.log('✅ Returned to live mode');
}

/**
 * Update history banner with session info
 * 
 * PURPOSE: Show user they're viewing historical data
 * WHY: Clear indication of history mode vs live mode
 * HOW: Populate banner with session details and show it
 * FEATURE: Session History, UI Feedback
 * 
 * @param {string} tab - Which tab's banner to update
 * @param {Object} session - Session object with metadata
 * @returns {void}
 */
function updateHistoryBanner(tab, session) {
    const banner = document.getElementById(`${tab}-history-banner`);
    const details = document.getElementById(`${tab}-history-details`);
    
    if (!banner || !details) return;
    
    // Format banner details
    const winnerInfo = session.winner.name !== 'No Winner' && session.winner.name !== 'Unknown'
        ? `Winner: ${session.winner.name} (#${session.winner.kartNumber}) - ${session.winner.bestLap}`
        : session.eventName;
    
    details.textContent = `${session.date} ${session.startTime} • ${winnerInfo}`;
    
    // Show banner
    banner.classList.remove('hidden');
}

// Update all views
/**
 * Update all views with current session data
 * 
 * PURPOSE: Refresh UI to reflect latest data changes
 * WHY: Called after WebSocket updates, user actions, or tab switches
 * HOW: Conditionally updates active tab's view based on currentTab state
 * FEATURE: View Management, UI Updates, Data Synchronization
 * 
 * @returns {void}
 */
function updateAllViews() {
    if (!state.sessionData && !state.replayData && !state.currentHistorySession) {
        console.warn('⚠️ No session, replay, or history data available for view update');
        return;
    }
    
    // Use history data if in history mode, otherwise use replay or live data
    const data = state.isHistoryMode && state.currentHistorySession 
        ? state.currentHistorySession.sessionData 
        : (state.replayData || state.sessionData);
    
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
            ResultsView.updateResultsView(elements, data, state);
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
        DriverSelectionService.selectDriverAndShowHUD(
            kartNumber,
            elements,
            state,
            switchTab,
            updateAllViews
        );
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
    testTTS: (scenario) => {
        console.log('🎤 Testing TTS scenario:', scenario);
        testTTSScenario(scenario);
    },
    stopTTS: () => {
        console.log('🔇 Stopping TTS');
        TTSService.stopSpeaking();
    },
    toggleHUDTTS: () => {
        console.log('🎤 toggleHUDTTS called, current state:', state.settings.enableTTS);
        state.settings.enableTTS = !state.settings.enableTTS;
        
        // Sync settings checkbox (get fresh reference if needed)
        const ttsCheckbox = document.getElementById('enable-tts');
        if (ttsCheckbox) {
            ttsCheckbox.checked = state.settings.enableTTS;
        }
        
        saveSettings();
        updateHUDTTSButton();
        updateTTSConfigVisibility();
        console.log('🎤 HUD TTS toggled to:', state.settings.enableTTS);
        
        // Give user feedback
        if (state.settings.enableTTS) {
            TTSService.speak('Voice announcements enabled');
        } else {
            TTSService.speak('Voice announcements disabled');
        }
    },
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

/**
 * Update HUD TTS toggle button appearance
 * 
 * PURPOSE: Sync HUD TTS button with settings state
 * WHY: Provide visual feedback of TTS enabled/disabled state
 * HOW: Adds/removes 'active' class based on enableTTS setting
 * FEATURE: TTS Control, UI Feedback
 * 
 * @returns {void}
 */
function updateHUDTTSButton() {
    if (!elements.hudTTSToggle) {
        console.warn('⚠️ HUD TTS button element not found');
        return;
    }
    
    console.log('🔄 Updating HUD TTS button, enableTTS:', state.settings.enableTTS);
    
    if (state.settings.enableTTS) {
        elements.hudTTSToggle.classList.add('active');
        elements.hudTTSToggle.title = 'Voice Announcements ON (click to disable)';
        elements.hudTTSToggle.setAttribute('data-state', 'enabled');
    } else {
        elements.hudTTSToggle.classList.remove('active');
        elements.hudTTSToggle.title = 'Voice Announcements OFF (click to enable)';
        elements.hudTTSToggle.setAttribute('data-state', 'disabled');
    }
}

/**
 * Show/hide TTS configuration section based on TTS enabled state
 * 
 * PURPOSE: Only show TTS options when TTS is enabled
 * WHY: Reduce UI clutter when TTS is disabled
 * HOW: Toggles display of tts-config-section
 * FEATURE: Settings UI, Conditional Display
 * 
 * @returns {void}
 */
function updateTTSConfigVisibility() {
    if (!elements.ttsConfigSection) return;
    
    if (state.settings.enableTTS) {
        elements.ttsConfigSection.style.display = 'block';
    } else {
        elements.ttsConfigSection.style.display = 'none';
    }
}

/**
 * Test TTS with different racing scenarios
 * 
 * PURPOSE: Allow user to preview TTS announcements before racing
 * WHY: Users need to verify TTS works and adjust volume/preferences
 * HOW: Simulates different lap scenarios with realistic test data
 * FEATURE: TTS Testing, User Experience, Settings Preview
 * 
 * @param {string} scenario - Test scenario name (fast, slow, best, pb, leader, chase)
 * @returns {void}
 */
function testTTSScenario(scenario) {
    if (!TTSService.isTTSSupported()) {
        alert('Text-to-Speech is not supported in your browser');
        return;
    }
    
    const scenarios = {
        fast: {
            lapTime: '30.5',
            gapToBest: '-0.2',  // Faster than previous best
            gapToPB: '+0.1',    // Still slower than personal best
            gapToP1: '+0.8',    // Behind leader
            isBestLap: false
        },
        slow: {
            lapTime: '31.2',
            gapToBest: '+0.7',  // Slower than best
            gapToPB: '+1.4',    // Much slower than PB
            gapToP1: '+2.1',    // Further behind leader
            isBestLap: false
        },
        best: {
            lapTime: '29.8',
            gapToBest: null,    // This IS the best
            gapToPB: '-0.3',    // New session best
            gapToP1: 'LEADER',  // You're P1
            isBestLap: true
        },
        pb: {
            lapTime: '29.5',
            gapToBest: '-0.5',  // Much faster
            gapToPB: '-0.3',    // New personal best
            gapToP1: '+0.2',    // Very close to leader
            isBestLap: true
        },
        leader: {
            lapTime: '30.1',
            gapToBest: '+0.1',
            gapToPB: '+0.3',
            gapToP1: 'LEADER',  // You're leading
            isBestLap: false
        },
        chase: {
            lapTime: '30.3',
            gapToBest: '+0.5',
            gapToPB: '+0.8',
            gapToP1: '+1.5',    // Chasing the leader
            isBestLap: false
        }
    };
    
    const testData = scenarios[scenario];
    if (!testData) {
        console.error('Unknown TTS test scenario:', scenario);
        return;
    }
    
    console.log('🎤 Testing scenario:', scenario, testData);
    TTSService.announceLap(testData);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

