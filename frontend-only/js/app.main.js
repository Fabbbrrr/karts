// Frontend-Only RaceFacer - Main App Coordinator
// Entry point that initializes and coordinates all modules
// No server required — connects directly to RaceFacer via Socket.IO

import { CONFIG, DEFAULT_SETTINGS } from './core/config.js';
import { AppState as state } from './core/state.js';
import * as WebSocketService from './services/websocket.service.js';
import * as StorageService from './services/storage.service.js';
import * as LapTrackerService from './services/lap-tracker.service.js';
import * as DriverSelectionService from './services/driver-selection.service.js';
import * as SessionHistoryService from './services/session-history.service.js';
import * as AudioService from './utils/audio.js';
import * as TTSService from './utils/tts.js';
import * as RaceView from './views/race.view.js';
import * as HUDView from './views/hud.view.js';
import * as CompareView from './views/compare.view.js';
import * as SummaryView from './views/summary.view.js';
import * as ResultsView from './views/results.view.js';
import * as SettingsView from './views/settings.view.js';

// DOM Elements Cache
const elements = {};

/**
 * Initialize the application and all subsystems
 */
function init() {
    console.log('🏎️ Initializing RaceFacer Frontend-Only v2.0...');

    cacheDOMElements();
    loadPersistedData();
    state.audioContext = AudioService.initializeAudio();
    setupEventListeners();
    setupPWA();
    connectWebSocket();
    setTimeout(() => refreshStorageStatus(), 500);

    // Auto-show app after 5 seconds if no connection
    setTimeout(() => {
        if (elements.loadingScreen && elements.loadingScreen.classList.contains('active')) {
            console.log('⏱️ Auto-showing app (no data after 5s)');
            showApp();
        }
    }, 5000);
}

/**
 * Cache all DOM element references for performance
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

    // Session selector / history
    elements.sessionSelectorBar = document.getElementById('session-selector-bar');
    elements.goLiveBtn = document.getElementById('go-live-btn');

    // Export / Import
    elements.summaryExport = document.getElementById('summary-export');
    elements.exportAllData = document.getElementById('export-all-data');
    elements.importAllData = document.getElementById('import-all-data');
    elements.importFileInput = document.getElementById('import-file-input');

    // Socket data viewer
    elements.viewSocketDataBtn = document.getElementById('view-socket-data-btn');
    elements.socketDataModal = document.getElementById('socket-data-modal');
    elements.socketMessageList = document.getElementById('socket-message-list');
    elements.socketRefreshBtn = document.getElementById('socket-refresh-btn');
    elements.socketClearBtn = document.getElementById('socket-clear-btn');

    console.log('📦 DOM elements cached');
}

/**
 * Load persisted data from localStorage
 */
function loadPersistedData() {
    state.settings = StorageService.loadSettings(DEFAULT_SETTINGS);
    SettingsView.applySettings(elements, state.settings);

    state.personalRecords = StorageService.loadPersonalRecords();
    state.driverNotes = StorageService.loadDriverNotes();
    state.recordedSessions = StorageService.loadRecordedSessions();

    console.log('📂 Loaded persisted data');
}

/**
 * Setup all event listeners for user interaction
 */
function setupEventListeners() {
    // Skip loading button
    if (elements.skipLoadingBtn) {
        elements.skipLoadingBtn.addEventListener('click', () => showApp());
    }

    // Tab navigation
    if (elements.tabBtns) {
        elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });
    }

    // Race item click — select driver and switch to HUD
    if (elements.raceList) {
        const handleDriverSelect = (e) => {
            let raceItem = e.target;
            for (let i = 0; i < 5 && raceItem; i++) {
                if (raceItem.classList && raceItem.classList.contains('race-item')) break;
                raceItem = raceItem.parentElement;
            }

            if (raceItem && raceItem.dataset && raceItem.dataset.kartNumber) {
                const kartNumber = raceItem.dataset.kartNumber;
                raceItem.style.transform = 'scale(0.98)';
                setTimeout(() => { raceItem.style.transform = ''; }, 100);

                state.settings.mainDriver = kartNumber;
                if (elements.mainDriverSelect) {
                    elements.mainDriverSelect.value = kartNumber;
                }
                saveSettings();
                switchTab('hud');
                updateAllViews();
            }
        };
        elements.raceList.addEventListener('click', handleDriverSelect);
        elements.raceList.addEventListener('touchend', handleDriverSelect);
    }

    // Main driver select (settings)
    if (elements.mainDriverSelect) {
        elements.mainDriverSelect.addEventListener('change', (e) => {
            DriverSelectionService.handleDriverSelectionChange(
                e.target.value || null, elements, state, updateAllViews
            );
        });
    }

    // HUD driver selector
    if (elements.hudDriverSelect) {
        elements.hudDriverSelect.addEventListener('change', (e) => {
            DriverSelectionService.handleDriverSelectionChange(
                e.target.value || null, elements, state, updateAllViews
            );
        });
    }

    // HUD quick driver selector
    if (elements.hudQuickDriverSelect) {
        elements.hudQuickDriverSelect.addEventListener('change', (e) => {
            DriverSelectionService.handleDriverSelectionChange(
                e.target.value || null, elements, state, updateAllViews
            );
        });
    }

    // Results tab
    ResultsView.setupResultsEventListeners();

    const resultsRefreshBtn = document.getElementById('results-refresh-btn');
    if (resultsRefreshBtn) {
        resultsRefreshBtn.addEventListener('click', () => {
            const dataToUse = state.replayData || state.sessionData;
            if (dataToUse) ResultsView.updateResultsView(elements, dataToUse, state);
        });
    }

    const resultsSessionSelect = document.getElementById('results-session-select');
    if (resultsSessionSelect) {
        resultsSessionSelect.addEventListener('change', (e) => {
            handleSessionSelection(e.target.value, 'results');
        });
    }

    const resultsBackToLive = document.getElementById('results-back-to-live');
    if (resultsBackToLive) {
        resultsBackToLive.addEventListener('click', () => returnToLiveMode('results'));
    }

    // Summary tab
    const summarySessionSelect = document.getElementById('summary-session-select');
    if (summarySessionSelect) {
        summarySessionSelect.addEventListener('change', (e) => {
            handleSessionSelection(e.target.value, 'summary');
        });
    }

    const summaryBackToLive = document.getElementById('summary-back-to-live');
    if (summaryBackToLive) {
        summaryBackToLive.addEventListener('click', () => returnToLiveMode('summary'));
    }

    // Go Live button
    if (elements.goLiveBtn) {
        elements.goLiveBtn.addEventListener('click', () => goLive());
    }

    // Display toggle settings
    const displayToggles = [
        { el: elements.showIntervalsCheckbox, setting: 'showIntervals' },
        { el: elements.showGapsCheckbox, setting: 'showGaps' },
        { el: elements.showConsistencyCheckbox, setting: 'showConsistency' },
        { el: elements.showAvgLapCheckbox, setting: 'showAvgLap' },
        { el: elements.showLastLapCheckbox, setting: 'showLastLap' }
    ];
    displayToggles.forEach(({ el, setting }) => {
        if (el) {
            el.addEventListener('change', (e) => {
                state.settings[setting] = e.target.checked;
                saveSettings();
                updateAllViews();
            });
        }
    });

    // HUD component toggles
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

    if (elements.enableBestLapCheckbox) {
        elements.enableBestLapCheckbox.addEventListener('change', (e) => {
            state.settings.enableBestLapCelebration = e.target.checked;
            saveSettings();
        });
    }

    // Export / Import
    if (elements.summaryExport) {
        elements.summaryExport.addEventListener('click', () => exportSessionData());
    }
    if (elements.exportAllData) {
        elements.exportAllData.addEventListener('click', () => exportAllAppData());
    }
    if (elements.importAllData) {
        elements.importAllData.addEventListener('click', () => {
            if (elements.importFileInput) elements.importFileInput.click();
        });
    }
    if (elements.importFileInput) {
        elements.importFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) { importAllAppData(file); e.target.value = ''; }
        });
    }

    // Socket data viewer
    if (elements.viewSocketDataBtn) {
        elements.viewSocketDataBtn.addEventListener('click', () => openSocketDataViewer());
    }
    if (elements.socketRefreshBtn) {
        elements.socketRefreshBtn.addEventListener('click', () => updateSocketDataViewer());
    }
    if (elements.socketClearBtn) {
        elements.socketClearBtn.addEventListener('click', () => {
            if (confirm('Clear all socket message history?')) {
                WebSocketService.clearMessageHistory();
                updateSocketDataViewer();
            }
        });
    }
    if (elements.socketDataModal) {
        elements.socketDataModal.addEventListener('click', (e) => {
            if (e.target === elements.socketDataModal) closeSocketDataViewer();
        });
    }

    // TTS toggle in HUD
    if (elements.hudTTSToggle) {
        elements.hudTTSToggle.addEventListener('click', () => {
            state.settings.enableTTS = !state.settings.enableTTS;
            elements.hudTTSToggle.classList.toggle('active', state.settings.enableTTS);
            saveSettings();
        });
    }

    console.log('✅ Event listeners set up');
}

/**
 * Setup PWA features (wake lock, service worker)
 */
function setupPWA() {
    // Keep screen on during race
    if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen')
            .then(() => console.log('✅ Wake Lock enabled'))
            .catch(err => console.log('⚠️ Wake Lock not available:', err));
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('✅ Service Worker registered:', reg.scope))
            .catch(() => console.log('ℹ️ Service Worker not registered (optional)'));
    }
}

/**
 * Connect to RaceFacer WebSocket for live timing data
 */
function connectWebSocket() {
    const callbacks = {
        onConnect: handleConnect,
        onDisconnect: handleDisconnect,
        onError: handleConnectionError,
        onData: handleSessionData
    };

    updateLoadingStatus('Connecting to RaceFacer...');
    state.socket = WebSocketService.connect(callbacks);
}

function handleConnect() {
    state.isConnected = true;
    updateConnectionIndicator(true);
    updateLoadingStatus('Connected! Waiting for race data...');
    console.log(`✅ Connected to RaceFacer — channel: ${CONFIG.CHANNEL}`);
}

function handleDisconnect() {
    state.isConnected = false;
    updateConnectionIndicator(false);
    console.log('❌ Disconnected — reconnecting...');
}

function handleConnectionError(error) {
    console.error('Connection error:', error);
    updateLoadingStatus('Connection failed. Retrying...');
}

/**
 * Handle incoming session data from WebSocket
 */
function handleSessionData(data) {
    try {
        if (!data || typeof data !== 'object') return;
        if (!data.runs) data.runs = [];

        // Ignore live data if in replay or history mode
        if (state.isReplayMode || state.isHistoryMode) return;

        console.log(`📥 Data: ${data.runs?.length} karts, event: ${data.event_name}`);

        state.sessionData = data;

        // Detect session change
        const detection = LapTrackerService.detectSessionChange(
            data, state.currentSessionId, state.lapHistory
        );

        if (detection.needsReset) {
            // Auto-save previous session before resetting
            if (state.currentSessionId && state.sessionData) {
                SessionHistoryService.saveCurrentSession(state.sessionData, state.currentSessionId)
                    .catch(err => console.error('Error saving session:', err));
            }
            resetSessionData();
        }

        state.currentSessionId = detection.sessionId;

        // Update lap history
        const updated = LapTrackerService.updateLapHistory(
            data, state.lapHistory, state.positionHistory, handleNewLap
        );
        state.lapHistory = updated.lapHistory;
        state.positionHistory = updated.positionHistory;

        // Update session best
        state.sessionBest = LapTrackerService.updateSessionBest(data, state.sessionBest);

        // First data — show app
        if (elements.loadingScreen && elements.loadingScreen.classList.contains('active')) {
            showApp();
        }

        // Update driver dropdown and views
        RaceView.updateDriverDropdown(elements, data);
        updateAllViews();

    } catch (error) {
        console.error('Error processing session data:', error);
    }
}

/**
 * Handle new lap detection from lap tracker service
 */
function handleNewLap(run) {
    const kartNumber = run.kart_number;
    const isMainDriver = state.settings.mainDriver === kartNumber;

    // Visual flash for main driver in HUD
    if (isMainDriver && state.currentTab === 'hud') {
        triggerLapFlash();
    }

    // Update personal records
    const pbResult = LapTrackerService.updatePersonalRecords(run, state.personalRecords);
    state.personalRecords = pbResult.updated;

    if (pbResult.isNewPB) {
        console.log(`🏆 New Personal Best for ${run.name}: ${run.last_time}`);
        StorageService.savePersonalRecords(state.personalRecords);

        if (isMainDriver && state.settings.enableBestLapCelebration) {
            AudioService.playBestLapCelebration(true);
            AudioService.vibrate([100, 50, 100, 50, 100]);
        }
    }

    // Best lap celebration
    if (state.settings.enableBestLapCelebration) {
        const isNewBest = LapTrackerService.checkBestLapCelebration(
            kartNumber, run.best_time_raw, state.lastBestLap
        );
        if (isNewBest && !pbResult.isNewPB) {
            AudioService.playBestLapCelebration(true);
            AudioService.vibrate([100, 50, 100]);
        }
        state.lastBestLap[kartNumber] = run.best_time_raw;
    }

    // TTS for main driver
    if (state.settings.enableTTS && isMainDriver && run.last_time) {
        const personalBest = LapTrackerService.getPersonalBest(run.name, state.personalRecords);
        let gapToPB = null;
        if (personalBest && run.last_time_raw) {
            const pbGap = LapTrackerService.calculateGapToPersonalBest(run.last_time_raw, personalBest.bestLap);
            gapToPB = pbGap.formatted;
        }
        const gapToBest = run.last_time_raw && run.best_time_raw && run.last_time_raw !== run.best_time_raw
            ? `+${((run.last_time_raw - run.best_time_raw) / 1000).toFixed(3)}`
            : null;

        TTSService.announceLap({
            lapTime: run.last_time,
            position: run.position,
            gapToBest,
            gapToPB,
            gapToP1: run.gap,
            isBestLap: run.last_time_raw === run.best_time_raw,
            announceGapP1: state.settings.ttsAnnounceGapP1,
            announceGapPB: state.settings.ttsAnnounceGapPB
        });
    }
}

/**
 * Visual flash on HUD screen when main driver completes a lap
 */
function triggerLapFlash() {
    const hudScreen = document.getElementById('hud-screen');
    if (!hudScreen) return;
    hudScreen.classList.remove('lap-flash');
    void hudScreen.offsetWidth;
    hudScreen.classList.add('lap-flash');
    setTimeout(() => hudScreen.classList.remove('lap-flash'), 600);
}

/**
 * Reset session tracking data when a new session is detected
 */
function resetSessionData() {
    console.log('🔄 Resetting session data for new session...');
    const reset = LapTrackerService.resetTrackingData();
    Object.assign(state, reset);
}

/**
 * Persist current settings to localStorage
 */
function saveSettings() {
    const settings = SettingsView.getSettingsFromUI(elements);
    Object.assign(state.settings, settings);
    StorageService.saveSettings(state.settings);
}

// ============================================================
// Navigation
// ============================================================

function showApp() {
    if (elements.loadingScreen) elements.loadingScreen.classList.remove('active');
    if (elements.tabNav) elements.tabNav.classList.remove('hidden');
    switchTab('race');
}

function switchTab(tabName) {
    state.currentTab = tabName;

    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.screen.tab-content').forEach(screen => {
        screen.classList.toggle('active', screen.id === `${tabName}-screen`);
    });

    // Populate session history selectors when switching to those tabs
    if (tabName === 'results' || tabName === 'summary') {
        populateSessionSelector(tabName);
    }

    updateAllViews();
}

async function populateSessionSelector(tab) {
    const selector = document.getElementById(`${tab}-session-select`);
    if (!selector) return;

    const history = await SessionHistoryService.getSessionHistory();
    const currentValue = selector.value;

    selector.innerHTML = '<option value="live">🔴 Live</option>';
    history.forEach(session => {
        const opt = document.createElement('option');
        opt.value = session.sessionId;
        opt.textContent = SessionHistoryService.getSessionLabel(session);
        selector.appendChild(opt);
    });

    selector.value = currentValue || 'live';
}

// ============================================================
// Session history / replay
// ============================================================

async function handleSessionSelection(sessionId, tab) {
    if (sessionId === 'live') {
        returnToLiveMode(tab);
        return;
    }

    const session = await SessionHistoryService.loadSession(sessionId);
    if (!session) {
        console.error('❌ Failed to load session:', sessionId);
        return;
    }

    state.isHistoryMode = true;
    state.currentHistorySession = session;

    updateHistoryBanner(tab, session);

    if (tab === 'results') {
        ResultsView.updateResultsView(elements, session.sessionData, state);
    } else if (tab === 'summary') {
        SummaryView.updateSummaryView(elements, session.sessionData, state);
    }
}

function returnToLiveMode(tab) {
    state.isHistoryMode = false;
    state.currentHistorySession = null;

    const selector = document.getElementById(`${tab}-session-select`);
    if (selector) selector.value = 'live';

    const banner = document.getElementById(`${tab}-history-banner`);
    if (banner) banner.classList.add('hidden');

    if (tab === 'results') {
        ResultsView.updateResultsView(elements, state.sessionData, state);
    } else if (tab === 'summary') {
        SummaryView.updateSummaryView(elements, state.sessionData, state);
    }
}

function updateHistoryBanner(tab, session) {
    const banner = document.getElementById(`${tab}-history-banner`);
    const details = document.getElementById(`${tab}-history-details`);
    if (!banner || !details) return;

    const winnerInfo = session.winner?.name && !['No Winner', 'Unknown'].includes(session.winner.name)
        ? `Winner: ${session.winner.name} (#${session.winner.kartNumber}) - ${session.winner.bestLap}`
        : (session.eventName || 'Race Session');

    details.textContent = `${session.date} ${session.startTime} • ${winnerInfo}`;
    banner.classList.remove('hidden');
}

function goLive() {
    state.isReplayMode = false;
    state.replayData = null;
    state.sessionData = null;
    state.lapHistory = {};
    state.positionHistory = {};
    state.startingPositions = {};
    state.gapHistory = {};
    state.sessionBest = null;
    state.lastBestLap = {};

    SettingsView.updateSessionSelector(elements, state.recordedSessions, false);
}

// ============================================================
// View updates
// ============================================================

function updateAllViews() {
    const data = state.isHistoryMode && state.currentHistorySession
        ? state.currentHistorySession.sessionData
        : (state.replayData || state.sessionData);

    if (!data) return;

    switch (state.currentTab) {
        case 'race':
            RaceView.updateRaceView(elements, data, state.settings, state.personalRecords, state);
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
    }
}

// ============================================================
// UI helpers
// ============================================================

function updateLoadingStatus(message) {
    if (elements.loadingStatus) elements.loadingStatus.textContent = message;
}

function updateConnectionIndicator(connected) {
    if (!elements.connectionIndicator) return;
    elements.connectionIndicator.classList.toggle('connected', connected);
    elements.connectionIndicator.classList.toggle('disconnected', !connected);
}

function refreshStorageStatus() {
    const info = StorageService.getStorageInfo();
    const statusEl = document.getElementById('storage-status');
    if (statusEl && info.total) {
        statusEl.textContent = `Storage: ${info.total.sizeMB} MB used`;
    }
}

// ============================================================
// Export / Import
// ============================================================

function exportSessionData() {
    const data = state.replayData || state.sessionData;
    if (!data) { alert('No session data to export.'); return; }

    downloadJSON({
        version: '2.0',
        exportDate: new Date().toISOString(),
        sessionData: data,
        lapHistory: state.lapHistory,
        positionHistory: state.positionHistory
    }, `race-session-${new Date().toISOString().slice(0, 10)}.json`);
}

function exportAllAppData() {
    downloadJSON({
        version: '2.0',
        exportDate: new Date().toISOString(),
        settings: state.settings,
        personalRecords: state.personalRecords,
        driverNotes: state.driverNotes,
        recordedSessions: state.recordedSessions
    }, `racefacer-backup-${new Date().toISOString().slice(0, 10)}.json`);
    console.log('✅ App data exported');
}

function importAllAppData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importData = JSON.parse(e.target.result);

            if (importData.settings) {
                state.settings = { ...DEFAULT_SETTINGS, ...importData.settings };
                StorageService.saveSettings(state.settings);
                SettingsView.applySettings(elements, state.settings);
            }
            if (importData.personalRecords) {
                state.personalRecords = importData.personalRecords;
                StorageService.savePersonalRecords(state.personalRecords);
            }
            if (importData.driverNotes) {
                state.driverNotes = importData.driverNotes;
                StorageService.saveDriverNotes(state.driverNotes);
            }
            if (importData.recordedSessions) {
                state.recordedSessions = importData.recordedSessions;
                importData.recordedSessions.forEach(s => StorageService.saveRecordedSession(s));
            }

            alert('✅ Data imported successfully!');
            refreshStorageStatus();
        } catch (error) {
            console.error('❌ Import error:', error);
            alert('Error importing data: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function downloadJSON(data, filename) {
    const uri = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', uri);
    link.setAttribute('download', filename);
    link.click();
}

// ============================================================
// Socket data viewer (debug)
// ============================================================

function openSocketDataViewer() {
    if (elements.socketDataModal) {
        elements.socketDataModal.classList.remove('hidden');
        updateSocketDataViewer();
    }
}

function closeSocketDataViewer() {
    if (elements.socketDataModal) elements.socketDataModal.classList.add('hidden');
}

function updateSocketDataViewer() {
    if (!elements.socketMessageList) return;
    const history = WebSocketService.getMessageHistory();

    if (history.length === 0) {
        elements.socketMessageList.innerHTML = '<p style="color:#888">No messages yet.</p>';
        return;
    }

    elements.socketMessageList.innerHTML = history.slice(0, 5).map((msg, i) => `
        <div class="socket-message">
            <div class="socket-message-header">
                <span>${new Date(msg.timestamp).toLocaleTimeString()}</span>
                <span>#${i + 1}</span>
            </div>
            <pre>${JSON.stringify(msg.data, null, 2).slice(0, 800)}</pre>
        </div>
    `).join('');
}

// ============================================================
// window.kartingApp — exposes functions called by inline onclick handlers in HTML
// ============================================================

window.kartingApp = {
    toggleHUDCard(setting) {
        state.settings[setting] = !state.settings[setting];
        saveSettings();
        SettingsView.applyHUDCardVisibility(elements, state.settings);
    },
    toggleHUDTTS() {
        state.settings.enableTTS = !state.settings.enableTTS;
        if (elements.hudTTSToggle) {
            elements.hudTTSToggle.classList.toggle('active', state.settings.enableTTS);
        }
        saveSettings();
    },
    selectDriverAndSwitchToHUD(kartNumber) {
        state.settings.mainDriver = kartNumber;
        if (elements.mainDriverSelect) elements.mainDriverSelect.value = kartNumber;
        saveSettings();
        switchTab('hud');
        updateAllViews();
    },
    updateAllViews() {
        updateAllViews();
    }
};

// ============================================================
// Boot
// ============================================================

document.addEventListener('DOMContentLoaded', init);
