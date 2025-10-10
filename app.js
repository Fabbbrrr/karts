// Karting Live Timer v2.0 - PWA
// Real-time go-karting session viewer with tabs, HUD, and settings

// Configuration
const CONFIG = {
    SOCKET_URL: 'https://live.racefacer.com:3123',
    CHANNEL: 'lemansentertainment',
    RECONNECT_DELAY: 2000
};

// Settings with defaults
const DEFAULT_SETTINGS = {
    mainDriver: null,
    channel: 'lemansentertainment', // Track/venue channel
    // Display toggles
    showIntervals: true,
    showGaps: true,
    showConsistency: true,
    showAvgLap: true,
    showLastLap: true,
    // New feature toggles
    showPaceTrend: true,
    showPercentageOffBest: true,
    showGapTrend: true,
    showPositionChanges: true,
    enableBestLapCelebration: true,
    enableProximityAlert: true, // Opponent proximity alerts
    proximityThreshold: 1.0, // Alert threshold in seconds
    colorTheme: 'dark', // Color theme: 'dark', 'light', 'f1-red', 'racing-green'
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

// State Management
const state = {
    socket: null,
    sessionData: null,
    isConnected: false,
    currentTab: 'race',
    settings: { ...DEFAULT_SETTINGS },
    lapHistory: {}, // Track lap history per kart: { kartNumber: [{lapNum, time, timeRaw, delta}] }
    startingPositions: {}, // Track starting position for each kart
    gapHistory: {}, // Track gap trends: { kartNumber: [{timestamp, gap}] }
    sessionBest: null, // Track fastest lap of session
    personalRecords: null, // Load from localStorage
    lastBestLap: {}, // Track last best lap time per kart for celebration
    lastGap: {}, // Track last gap for delta calculation
    currentSessionId: null, // Track current session to detect changes
    audioContext: null, // Web Audio API context for sound alerts
    lastPosition: {}, // Track last position for position change alerts
    positionHistory: {}, // Track position per lap for all karts: { kartNumber: [{lapNum, position}] }
    driverNotes: {}, // Track driver notes: { kartNumber: [{lapNum, note, timestamp}] }
    lastProximityAlert: null, // Track last proximity alert timestamp to avoid spam
    isReplayMode: false, // Are we viewing a recorded session?
    recordedSessions: [], // List of recorded sessions
    replayData: null, // Current replay session data
    // Kart Analysis Data
    kartAnalysisData: {
        laps: [],  // All lap records: [{timestamp, sessionId, kartNumber, driverName, lapTime, lapTimeRaw, position, lapNum}]
        drivers: {},  // { driverName: { totalLaps, totalTime, kartHistory: { kartNumber: lapCount } } }
        karts: {},    // { kartNumber: { totalLaps, bestLap, driverHistory: { driverName: lapCount } } }
        sessions: {}  // Session metadata for context
    },
    lastLapCount: {} // Track last lap count per kart to detect new laps
};

// DOM Elements
const elements = {
    // Navigation
    tabNav: document.getElementById('tab-nav'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    
    // Connection
    connectionIndicator: document.getElementById('connection-indicator'),
    loadingScreen: document.getElementById('loading-screen'),
    loadingStatus: document.getElementById('loading-status'),
    skipLoadingBtn: document.getElementById('skip-loading-btn'),
    
    // Race tab
    raceScreen: document.getElementById('race-screen'),
    eventName: document.getElementById('event-name'),
    sessionInfo: document.getElementById('session-info'),
    raceList: document.getElementById('race-list'),
    
    // HUD tab
    hudScreen: document.getElementById('hud-screen'),
    hudNoDriver: document.getElementById('hud-no-driver'),
    hudContent: document.getElementById('hud-content'),
    hudEventName: document.getElementById('hud-event-name'),
    hudLapInfo: document.getElementById('hud-lap-info'),
    hudPosition: document.getElementById('hud-position'),
    hudKart: document.getElementById('hud-kart'),
    hudLastTime: document.getElementById('hud-last-time'),
    hudBestTime: document.getElementById('hud-best-time'),
    hudAvgTime: document.getElementById('hud-avg-time'),
    hudGap: document.getElementById('hud-gap'),
    hudInterval: document.getElementById('hud-interval'),
    hudConsistency: document.getElementById('hud-consistency'),
    hudLaps: document.getElementById('hud-laps'),
    hudTimeLeft: document.getElementById('hud-time-left'),
    
    // Settings tab
    settingsScreen: document.getElementById('settings-screen'),
    channelInput: document.getElementById('channel-input'),
    mainDriverSelect: document.getElementById('main-driver-select'),
    showIntervals: document.getElementById('show-intervals'),
    showGaps: document.getElementById('show-gaps'),
    showConsistency: document.getElementById('show-consistency'),
    showAvgLap: document.getElementById('show-avg-lap'),
    showLastLap: document.getElementById('show-last-lap'),
    // New settings
    showPaceTrend: document.getElementById('show-pace-trend'),
    showPercentageOffBest: document.getElementById('show-percentage-off-best'),
    showGapTrend: document.getElementById('show-gap-trend'),
    showPositionChanges: document.getElementById('show-position-changes'),
    enableBestLapCelebration: document.getElementById('enable-best-lap-celebration'),
    enableProximityAlert: document.getElementById('enable-proximity-alert'),
    colorThemeSelect: document.getElementById('color-theme-select'),
    resetSettings: document.getElementById('reset-settings'),
    
    // Compare tab
    compareScreen: document.getElementById('compare-screen'),
    compareDriver1Select: document.getElementById('compare-driver1'),
    compareDriver2Select: document.getElementById('compare-driver2'),
    compareContent: document.getElementById('compare-content'),
    compareNoSelection: document.getElementById('compare-no-selection'),
    
    // Summary tab
    summaryScreen: document.getElementById('summary-screen'),
    summaryNoData: document.getElementById('summary-no-data'),
    summaryContent: document.getElementById('summary-content'),
    summaryExport: document.getElementById('summary-export'),
    positionChart: document.getElementById('position-chart'),
    positionChartLegend: document.getElementById('position-chart-legend'),
    
    // Data management
    exportAllData: document.getElementById('export-all-data'),
    importAllData: document.getElementById('import-all-data'),
    importFileInput: document.getElementById('import-file-input'),
    importAnalysisBtn: document.getElementById('import-analysis-btn'),
    importAnalysisFileInput: document.getElementById('import-analysis-file-input'),
    
    // HUD component toggles in settings
    hudShowLastLapCheckbox: document.getElementById('hud-show-last-lap'),
    hudShowBestLapCheckbox: document.getElementById('hud-show-best-lap'),
    hudShowAvgLapCheckbox: document.getElementById('hud-show-avg-lap'),
    hudShowGapCheckbox: document.getElementById('hud-show-gap'),
    hudShowIntervalCheckbox: document.getElementById('hud-show-interval'),
    hudShowConsistencyCheckbox: document.getElementById('hud-show-consistency'),
    hudShowLapHistoryCheckbox: document.getElementById('hud-show-lap-history'),
    showAllHud: document.getElementById('show-all-hud'),
    
    // Driver notes
    hudNoteInput: document.getElementById('hud-note-input'),
    hudAddNoteBtn: document.getElementById('hud-add-note-btn'),
    hudNotesList: document.getElementById('hud-notes-list'),
    
    // HUD driver selectors
    hudDriverSelect: document.getElementById('hud-driver-select'),
    hudQuickDriverSelect: document.getElementById('hud-quick-driver-select'),
    
    // Results tab
    resultsScreen: document.getElementById('results-screen'),
    resultsNoData: document.getElementById('results-no-data'),
    resultsContent: document.getElementById('results-content'),
    resultsMethodSelect: document.getElementById('results-method-select'),
    resultsMethodDescription: document.getElementById('results-method-description'),
    resultsTableBody: document.getElementById('results-table-body'),
    resultsChart: document.getElementById('results-chart'),
    resultsStatsGrid: document.getElementById('results-stats-grid'),
    podiumP1: document.getElementById('podium-p1'),
    podiumP2: document.getElementById('podium-p2'),
    podiumP3: document.getElementById('podium-p3'),
    
    // Session selector
    sessionSelectorBar: document.getElementById('session-selector-bar'),
    sessionSelector: document.getElementById('session-selector'),
    goLiveBtn: document.getElementById('go-live-btn'),
    
    // Kart Analysis tab
    analysisScreen: document.getElementById('analysis-screen'),
    analysisNoData: document.getElementById('analysis-no-data'),
    analysisContent: document.getElementById('analysis-content'),
    analysisStats: document.getElementById('analysis-stats'),
    analysisTable: document.getElementById('analysis-table'),
    analysisTableBody: document.getElementById('analysis-table-body'),
    analysisDetails: document.getElementById('analysis-details')
};

// Initialize App
function init() {
    console.log('Initializing Karting Live Timer v2.0...');
    
    // Load settings from localStorage
    loadSettings();
    
    // Load personal records
    loadPersonalRecords();
    
    // Load driver notes
    loadDriverNotes();
    
    // Load recorded sessions
    loadRecordedSessions();
    
    // Load kart analysis data
    loadKartAnalysisData();
    
    // Update session selector UI
    updateSessionSelector();
    
    // Enable always-on display mode
    enableAlwaysOnDisplay();
    
    // Initialize audio for sound alerts
    initializeAudio();
    
    // Auto-show app after 5 seconds even without connection
    setTimeout(() => {
        if (elements.loadingScreen.classList.contains('active')) {
            console.log('⏱️ Auto-showing app (no data after 5s)');
            showApp();
        }
    }, 5000);
    
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('Service Worker registered:', reg))
            .catch(err => console.error('Service Worker registration failed:', err));
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup install prompt
    setupInstallPrompt();
    
    // Connect to WebSocket
    connectWebSocket();
}

// Show the app (remove loading screen, show tabs)
function showApp() {
    elements.loadingScreen.classList.remove('active');
    elements.tabNav.classList.remove('hidden');
    switchTab('race');
    updateSessionSelector();
}

// Initialize Audio Context for sound alerts
function initializeAudio() {
    try {
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('🔊 Audio context initialized');
    } catch (err) {
        console.error('Audio initialization error:', err);
    }
}

// Play sound alert
function playSound(frequency, duration, type = 'sine') {
    if (!state.audioContext || !state.settings.enableBestLapCelebration) return;
    
    try {
        const oscillator = state.audioContext.createOscillator();
        const gainNode = state.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(state.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, state.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, state.audioContext.currentTime + duration);
        
        oscillator.start(state.audioContext.currentTime);
        oscillator.stop(state.audioContext.currentTime + duration);
    } catch (err) {
        console.error('Sound playback error:', err);
    }
}

// Sound alert for personal best
function playBestLapSound() {
    // Happy ascending chime
    playSound(523, 0.1); // C
    setTimeout(() => playSound(659, 0.1), 100); // E
    setTimeout(() => playSound(784, 0.2), 200); // G
}

// Sound alert for position gain
function playPositionUpSound() {
    // Quick double beep
    playSound(800, 0.1);
    setTimeout(() => playSound(1000, 0.15), 120);
}

// Sound alert for position loss
function playPositionDownSound() {
    // Low warning tone
    playSound(300, 0.2);
}

// Sound alert for opponent proximity
function playProximityAlertSound() {
    // Alert beeps
    playSound(600, 0.1);
    setTimeout(() => playSound(600, 0.1), 150);
}

// Check for nearby opponents and alert
function checkOpponentProximity() {
    if (!state.settings.enableProximityAlert || !state.settings.mainDriver || !state.sessionData) return;
    
    const mainDriver = state.settings.mainDriver;
    const run = state.sessionData.runs.find(r => r.kart_number === mainDriver);
    if (!run || !run.int) return;
    
    // Parse interval (time to car ahead)
    const intervalStr = run.int;
    if (intervalStr === '-' || intervalStr === 'Leader') return;
    
    // Extract seconds from interval (e.g., "+1.234" or "1.234")
    const intervalMatch = intervalStr.match(/[\+\-]?(\d+\.?\d*)/);
    if (!intervalMatch) return;
    
    const intervalSeconds = parseFloat(intervalMatch[1]);
    const threshold = state.settings.proximityThreshold;
    
    // Check if opponent is within threshold
    if (intervalSeconds <= threshold) {
        // Avoid spamming alerts - only alert once every 5 seconds
        const now = Date.now();
        if (!state.lastProximityAlert || (now - state.lastProximityAlert) > 5000) {
            state.lastProximityAlert = now;
            
            // Visual alert (HUD element will show it)
            showProximityAlert(intervalSeconds);
            
            // Sound alert
            playProximityAlertSound();
            
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
        }
    }
}

// Show proximity alert visual feedback
function showProximityAlert(interval) {
    const alertEl = document.getElementById('proximity-alert');
    if (!alertEl) return;
    
    alertEl.textContent = `⚠️ Opponent ${interval.toFixed(1)}s ahead!`;
    alertEl.style.display = 'block';
    alertEl.classList.add('proximity-alert-active');
    
    // Hide after 3 seconds
    setTimeout(() => {
        alertEl.classList.remove('proximity-alert-active');
        setTimeout(() => {
            alertEl.style.display = 'none';
        }, 300);
    }, 3000);
}

// Enable always-on display (prevent screen sleep)
function enableAlwaysOnDisplay() {
    if ('wakeLock' in navigator) {
        let wakeLock = null;
        
        const requestWakeLock = async () => {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log('🔆 Always-on display enabled (Wake Lock active)');
                
                wakeLock.addEventListener('release', () => {
                    console.log('Wake Lock released');
                });
            } catch (err) {
                console.error('Wake Lock error:', err);
            }
        };
        
        // Request wake lock
        requestWakeLock();
        
        // Re-request wake lock when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (wakeLock !== null && document.visibilityState === 'visible') {
                requestWakeLock();
            }
        });
    } else {
        console.log('⚠️ Wake Lock API not supported');
    }
}

// Event Listeners
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
    
    // Race item click - enhanced reliability with multiple event types
    if (elements.raceList) {
        // Use both click and touchend for better mobile support
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
                applySettings();
                switchTab('hud');
            } else {
                console.log('⚠️ Click outside race item or no kart number found');
            }
        };
        
        elements.raceList.addEventListener('click', handleDriverSelect);
        elements.raceList.addEventListener('touchend', handleDriverSelect);
    }
    
    // Settings - add listeners only if elements exist
    if (elements.channelInput) {
        elements.channelInput.addEventListener('change', (e) => {
            const newChannel = e.target.value.trim() || 'lemansentertainment';
            if (newChannel !== state.settings.channel) {
                state.settings.channel = newChannel;
                saveSettings();
                // Reconnect to new channel
                reconnectToChannel();
            }
        });
    }
    
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
            state.settings.mainDriver = e.target.value || null;
            saveSettings();
            applySettings();
            updateAllViews();
        });
    }
    
    // HUD quick driver selector (header)
    if (elements.hudQuickDriverSelect) {
        elements.hudQuickDriverSelect.addEventListener('change', (e) => {
            state.settings.mainDriver = e.target.value || null;
            saveSettings();
            applySettings();
            updateAllViews();
        });
    }
    
    // Results method selector
    if (elements.resultsMethodSelect) {
        elements.resultsMethodSelect.addEventListener('change', () => {
            updateResultsView();
        });
    }
    
    // Session selector
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
                applySettings();
                updateAllViews();
            }
        });
    }
    
    // Compare tab listeners
    if (elements.compareDriver1Select) {
        elements.compareDriver1Select.addEventListener('change', () => {
            updateCompareView();
        });
    }
    
    if (elements.compareDriver2Select) {
        elements.compareDriver2Select.addEventListener('change', () => {
            updateCompareView();
        });
    }
    
    // Summary tab listener
    if (elements.summaryExport) {
        elements.summaryExport.addEventListener('click', () => {
            exportSessionData();
        });
    }
    
    // Data management listeners
    if (elements.exportAllData) {
        elements.exportAllData.addEventListener('click', () => {
            exportAllAppData();
        });
    }
    
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
                applyHUDCardVisibility();
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
            applySettings();
            applyHUDCardVisibility();
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
}

// Settings Management
function loadSettings() {
    try {
        const saved = localStorage.getItem('kartingTimerSettings');
        if (saved) {
            state.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        }
        applySettings();
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

function saveSettings() {
    try {
        localStorage.setItem('kartingTimerSettings', JSON.stringify(state.settings));
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

function applySettings() {
    // Apply to form elements - check if they exist first
    if (elements.channelInput) {
        elements.channelInput.value = state.settings.channel || 'lemansentertainment';
    }
    if (elements.mainDriverSelect && elements.mainDriverSelect.value !== state.settings.mainDriver) {
        elements.mainDriverSelect.value = state.settings.mainDriver || '';
    }
    if (elements.showIntervals) elements.showIntervals.checked = state.settings.showIntervals;
    if (elements.showGaps) elements.showGaps.checked = state.settings.showGaps;
    if (elements.showConsistency) elements.showConsistency.checked = state.settings.showConsistency;
    if (elements.showAvgLap) elements.showAvgLap.checked = state.settings.showAvgLap;
    if (elements.showLastLap) elements.showLastLap.checked = state.settings.showLastLap;
    // New settings
    if (elements.showPaceTrend) elements.showPaceTrend.checked = state.settings.showPaceTrend;
    if (elements.showPercentageOffBest) elements.showPercentageOffBest.checked = state.settings.showPercentageOffBest;
    if (elements.showGapTrend) elements.showGapTrend.checked = state.settings.showGapTrend;
    if (elements.showPositionChanges) elements.showPositionChanges.checked = state.settings.showPositionChanges;
    if (elements.enableBestLapCelebration) elements.enableBestLapCelebration.checked = state.settings.enableBestLapCelebration;
    if (elements.enableProximityAlert) elements.enableProximityAlert.checked = state.settings.enableProximityAlert;
    if (elements.colorThemeSelect) elements.colorThemeSelect.value = state.settings.colorTheme || 'dark';
    
    // Apply theme
    applyTheme(state.settings.colorTheme || 'dark');
    
    // HUD component visibility
    if (elements.hudShowLastLapCheckbox) elements.hudShowLastLapCheckbox.checked = state.settings.hudShowLastLap;
    if (elements.hudShowBestLapCheckbox) elements.hudShowBestLapCheckbox.checked = state.settings.hudShowBestLap;
    if (elements.hudShowAvgLapCheckbox) elements.hudShowAvgLapCheckbox.checked = state.settings.hudShowAvgLap;
    if (elements.hudShowGapCheckbox) elements.hudShowGapCheckbox.checked = state.settings.hudShowGap;
    if (elements.hudShowIntervalCheckbox) elements.hudShowIntervalCheckbox.checked = state.settings.hudShowInterval;
    if (elements.hudShowConsistencyCheckbox) elements.hudShowConsistencyCheckbox.checked = state.settings.hudShowConsistency;
    if (elements.hudShowLapHistoryCheckbox) elements.hudShowLapHistoryCheckbox.checked = state.settings.hudShowLapHistory;
}

// Tab Navigation
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
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const activeScreen = document.getElementById(`${tabName}-screen`);
    if (activeScreen) {
        activeScreen.classList.add('active');
    }
    
    // Update view for current tab
    updateAllViews();
}

// WebSocket Connection
function connectWebSocket() {
    updateLoadingStatus('Connecting to RaceFacer...');
    
    try {
        state.socket = io(CONFIG.SOCKET_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: CONFIG.RECONNECT_DELAY,
            reconnectionAttempts: Infinity
        });
        
        state.socket.on('connect', onConnect);
        state.socket.on('disconnect', onDisconnect);
        state.socket.on('connect_error', onConnectError);
        
        // Listen to the configured channel
        const channel = state.settings.channel || CONFIG.CHANNEL;
        state.socket.on(channel, onSessionData);
        
    } catch (error) {
        console.error('WebSocket connection error:', error);
        updateLoadingStatus('Connection failed. Retrying...');
    }
}

// Reconnect to a new channel
function reconnectToChannel() {
    console.log('🔄 Reconnecting to new channel...');
    
    if (state.socket) {
        // Remove old event listener
        const oldChannel = CONFIG.CHANNEL;
        state.socket.off(oldChannel);
        
        // Add new event listener
        const newChannel = state.settings.channel || CONFIG.CHANNEL;
        state.socket.on(newChannel, onSessionData);
        
        // Disconnect and reconnect
        state.socket.disconnect();
        state.socket.connect();
        
        // Reset session data
        updateLoadingStatus(`Connecting to ${newChannel}...`);
        elements.loadingScreen.classList.add('active');
        elements.tabNav.classList.add('hidden');
    }
}

function onConnect() {
    console.log('Connected to RaceFacer');
    state.isConnected = true;
    updateConnectionIndicator(true);
    updateConnectionStatus();
    updateSessionSelector();
    updateLoadingStatus('Connected! Waiting for data...');
    
    // Join the channel (use configured channel from settings)
    const channel = state.settings.channel || CONFIG.CHANNEL;
    console.log(`📡 Joining channel: ${channel}`);
    state.socket.emit('join', channel);
}

function onDisconnect() {
    console.log('Disconnected from RaceFacer');
    state.isConnected = false;
    updateConnectionIndicator(false);
    updateConnectionStatus();
    updateSessionSelector();
}

function onConnectError(error) {
    console.error('Connection error:', error);
    state.isConnected = false;
    updateConnectionIndicator(false);
}

function onSessionData(data) {
    try {
        // Ignore live data if in replay mode
        if (state.isReplayMode) {
            return;
        }
        
        if (data && data.data) {
            state.sessionData = data.data;
            
            // Detect session change and reset
            detectAndResetSession();
            
            // Track lap history
            updateLapHistory();
            
            // First time receiving data - show tabs and switch to race view
            if (elements.loadingScreen.classList.contains('active')) {
                showApp();
            }
            
            // Update driver dropdown in settings
            updateDriverDropdown();
            
            // Update all views immediately with fresh data
            // This ensures instant UI updates as soon as server pushes new data
            updateAllViews();
        }
    } catch (error) {
        console.error('Error parsing session data:', error);
    }
}

// Detect session change and reset data
function detectAndResetSession() {
    if (!state.sessionData) return;
    
    // Create a session identifier from available data
    // Use event_name + current_lap combination as session ID
    // When current_lap goes back to 0/1 from a higher number, it's a new session
    const sessionId = `${state.sessionData.event_name}_${state.sessionData.session_name || 'default'}`;
    const currentLap = state.sessionData.current_lap || 0;
    
    // Check if this is a new session
    if (state.currentSessionId && state.currentSessionId !== sessionId) {
        console.log('🔄 New session detected! Resetting lap data...');
        console.log(`Previous: ${state.currentSessionId}, New: ${sessionId}`);
        resetSessionData();
    } 
    // Also detect session restart if lap count goes back to start
    else if (state.currentSessionId === sessionId) {
        // Check if we went from lap 3+ back to lap 0-2 (session restart)
        const hadLapData = Object.keys(state.lapHistory).some(kart => 
            state.lapHistory[kart] && state.lapHistory[kart].length > 3
        );
        
        if (hadLapData && currentLap <= 2) {
            console.log('🔄 Session restart detected (lap counter reset)! Resetting lap data...');
            resetSessionData();
        }
    }
    
    // Update current session ID
    state.currentSessionId = sessionId;
}

// Reset session-specific data
function resetSessionData() {
    console.log('Resetting session data...');
    
    // Save current session before resetting (if we have data)
    if (state.sessionData && state.currentSessionId && !state.isReplayMode) {
        saveCurrentSession();
    }
    
    state.lapHistory = {};
    state.startingPositions = {};
    state.gapHistory = {};
    state.sessionBest = null;
    state.lastBestLap = {};
    state.lastGap = {};
    state.positionHistory = {};
    state.driverNotes = {};
    console.log('✅ Session data reset complete!');
}

// Track lap history with deltas
function updateLapHistory() {
    if (!state.sessionData || !state.sessionData.runs) return;
    
    state.sessionData.runs.forEach(run => {
        if (!run.kart_number || !run.last_time_raw) return;
        
        const kartNumber = run.kart_number;
        
        // Track starting position
        if (!state.startingPositions[kartNumber]) {
            state.startingPositions[kartNumber] = run.pos;
        }
        
        // Check for position changes and play sounds
        if (kartNumber === state.settings.mainDriver && state.lastPosition[kartNumber]) {
            const lastPos = state.lastPosition[kartNumber];
            if (run.pos < lastPos) {
                // Position improved
                playPositionUpSound();
            } else if (run.pos > lastPos) {
                // Position lost
                playPositionDownSound();
            }
        }
        state.lastPosition[kartNumber] = run.pos;
        
        // Initialize history for this kart if needed
        if (!state.lapHistory[kartNumber]) {
            state.lapHistory[kartNumber] = [];
        }
        
        const history = state.lapHistory[kartNumber];
        const lapCount = run.total_laps;
        
        // Check if this is a new lap (lap count increased)
        if (history.length === 0 || history[history.length - 1].lapNum < lapCount) {
            // Check for best lap celebration
            if (state.settings.enableBestLapCelebration) {
                checkBestLapCelebration(kartNumber, run.best_time_raw);
            }
            
            // Collect lap for kart analysis
            collectKartAnalysisLap(run, lapCount);
            
            // Add new lap to history
            const lapData = {
                lapNum: lapCount,
                time: run.last_time,
                timeRaw: run.last_time_raw,
                bestTimeRaw: run.best_time_raw,
                delta: 0,
                position: run.pos
            };
            
            // Track position history for chart
            if (!state.positionHistory[kartNumber]) {
                state.positionHistory[kartNumber] = [];
            }
            state.positionHistory[kartNumber].push({
                lapNum: lapCount,
                position: run.pos
            });
            
            // Calculate delta from best lap
            if (run.best_time_raw && run.last_time_raw) {
                lapData.delta = run.last_time_raw - run.best_time_raw;
            }
            
            history.push(lapData);
            
            // Keep only last 20 laps
            if (history.length > 20) {
                history.shift();
            }
        }
        
        // Track gap trends
        trackGapTrend(kartNumber, run.gap);
        
        // Update session best
        if (!state.sessionBest || (run.best_time_raw && run.best_time_raw < state.sessionBest.timeRaw)) {
            state.sessionBest = {
                kartNumber: run.kart_number,
                name: run.name,
                time: run.best_time,
                timeRaw: run.best_time_raw
            };
        }
    });
}

// Check and trigger best lap celebration
function checkBestLapCelebration(kartNumber, bestTimeRaw) {
    if (!bestTimeRaw) return;
    
    const lastBest = state.lastBestLap[kartNumber];
    if (!lastBest || bestTimeRaw < lastBest) {
        state.lastBestLap[kartNumber] = bestTimeRaw;
        if (lastBest) {
            // New personal best! Trigger celebration
            triggerBestLapCelebration(kartNumber);
        }
    }
}

// Trigger best lap celebration animation
function triggerBestLapCelebration(kartNumber) {
    // Only celebrate for main driver
    if (kartNumber !== state.settings.mainDriver) return;
    
    const hudScreen = elements.hudScreen;
    if (!hudScreen) return;
    
    hudScreen.classList.add('best-lap-celebration');
    
    // Play sound
    playBestLapSound();
    
    // Vibrate if available
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
    }
    
    setTimeout(() => {
        hudScreen.classList.remove('best-lap-celebration');
    }, 2000);
}

// Track gap trend over time
function trackGapTrend(kartNumber, gap) {
    if (!state.gapHistory[kartNumber]) {
        state.gapHistory[kartNumber] = [];
    }
    
    // Parse gap to number (handle "+1.234", "+1 lap", etc)
    let gapValue = null;
    if (gap && gap !== '-') {
        const match = gap.match(/\+?([\d.]+)/);
        if (match) {
            gapValue = parseFloat(match[1]);
        }
    }
    
    state.gapHistory[kartNumber].push({
        timestamp: Date.now(),
        gap: gapValue
    });
    
    // Keep only last 10 data points
    if (state.gapHistory[kartNumber].length > 10) {
        state.gapHistory[kartNumber].shift();
    }
}

// Calculate delta to leader (gaining/losing time)
function calculateDeltaToLeader(kartNumber, currentGap) {
    if (!currentGap || currentGap === '-') return null;
    
    // Parse current gap
    const match = currentGap.match(/\+?([\d.]+)/);
    if (!match) return null;
    
    const currentGapValue = parseFloat(match[1]);
    const lastGapValue = state.lastGap[kartNumber];
    
    // Update last gap
    state.lastGap[kartNumber] = currentGapValue;
    
    // Need at least 2 data points
    if (lastGapValue === undefined) return null;
    
    // Calculate delta (negative = closing, positive = opening)
    const delta = currentGapValue - lastGapValue;
    
    return {
        value: delta,
        closing: delta < -0.05, // Closing by > 0.05s
        opening: delta > 0.05,  // Opening by > 0.05s
        text: delta < 0 ? `△ ${delta.toFixed(2)}s` : `▽ +${delta.toFixed(2)}s`
    };
}

// Calculate pace trend
function calculatePaceTrend(kartNumber) {
    const history = state.lapHistory[kartNumber];
    if (!history || history.length < 4) return null;
    
    const recentLaps = history.slice(-3);
    const olderLaps = history.length > 6 ? history.slice(-6, -3) : history.slice(0, Math.max(history.length - 3, 1));
    
    const recentAvg = recentLaps.reduce((sum, lap) => sum + lap.timeRaw, 0) / recentLaps.length;
    const olderAvg = olderLaps.reduce((sum, lap) => sum + lap.timeRaw, 0) / olderLaps.length;
    
    const diff = recentAvg - olderAvg;
    
    return {
        improving: diff < -100, // Improving by > 0.1s
        declining: diff > 100,  // Declining by > 0.1s
        difference: diff / 1000
    };
}

// Calculate percentage off best
function calculatePercentageOffBest(lastTimeRaw, bestTimeRaw) {
    if (!lastTimeRaw || !bestTimeRaw || lastTimeRaw === bestTimeRaw) return 0;
    return (((lastTimeRaw - bestTimeRaw) / bestTimeRaw) * 100).toFixed(1);
}

// Calculate ideal/theoretical lap time
function calculateIdealLapTime(kartNumber) {
    const history = state.lapHistory[kartNumber];
    if (!history || history.length < 2) return null;
    
    // Get best 3 laps and average them for "ideal" pace
    const sortedLaps = [...history]
        .filter(lap => lap.timeRaw > 0)
        .sort((a, b) => a.timeRaw - b.timeRaw);
    
    if (sortedLaps.length < 2) return null;
    
    const top3 = sortedLaps.slice(0, Math.min(3, sortedLaps.length));
    const idealTimeRaw = top3.reduce((sum, lap) => sum + lap.timeRaw, 0) / top3.length;
    
    // Format time
    const minutes = Math.floor(idealTimeRaw / 60000);
    const seconds = ((idealTimeRaw % 60000) / 1000).toFixed(3);
    const idealTime = minutes > 0 ? `${minutes}:${seconds.padStart(6, '0')}` : seconds;
    
    return {
        timeRaw: idealTimeRaw,
        time: idealTime,
        improvement: sortedLaps[0].timeRaw - idealTimeRaw // Potential gain
    };
}

// Calculate consistency score (0-100)
function calculateConsistencyScore(kartNumber) {
    const history = state.lapHistory[kartNumber];
    if (!history || history.length < 3) return null;
    
    // Only use valid lap times (exclude outliers > 10s off average)
    const validLaps = history.filter(lap => lap.timeRaw > 0);
    if (validLaps.length < 3) return null;
    
    const times = validLaps.map(lap => lap.timeRaw);
    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    
    // Calculate standard deviation
    const squaredDiffs = times.map(time => Math.pow(time - average, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / times.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to percentage of average (coefficient of variation)
    const coefficientOfVariation = (stdDev / average) * 100;
    
    // Convert to 0-100 score (lower CV = higher score)
    // CV of 0.5% = 100 score, CV of 5% = 0 score
    const score = Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 20)));
    
    let rating = 'Poor';
    if (score >= 90) rating = 'Excellent';
    else if (score >= 75) rating = 'Very Good';
    else if (score >= 60) rating = 'Good';
    else if (score >= 40) rating = 'Average';
    
    return {
        score: Math.round(score),
        rating,
        stdDev: (stdDev / 1000).toFixed(3), // Convert to seconds
        text: `${Math.round(score)}/100 - ${rating}`
    };
}

// Calculate gap trend
function calculateGapTrend(kartNumber) {
    const history = state.gapHistory[kartNumber];
    if (!history || history.length < 3) return null;
    
    const validGaps = history.filter(h => h.gap !== null).slice(-5);
    if (validGaps.length < 2) return null;
    
    const first = validGaps[0].gap;
    const last = validGaps[validGaps.length - 1].gap;
    const diff = last - first;
    
    return {
        closing: diff < -0.5, // Gap closing by > 0.5s
        opening: diff > 0.5,  // Gap opening by > 0.5s
        difference: diff
    };
}

// Get F1-style lap color
function getLapColor(lap, bestTimeRaw) {
    if (!lap.timeRaw) return '';
    
    // Purple = Personal best
    if (lap.timeRaw === bestTimeRaw) return 'purple';
    
    // Green = Within 0.5s of best
    if (lap.delta !== null && Math.abs(lap.delta) <= 500) return 'green';
    
    // Yellow = Within 1s of best
    if (lap.delta !== null && Math.abs(lap.delta) <= 1000) return 'yellow';
    
    // Red = More than 1s off best
    return 'red';
}

// UI Updates
function updateConnectionIndicator(connected) {
    if (connected) {
        elements.connectionIndicator.classList.add('connected');
    } else {
        elements.connectionIndicator.classList.remove('connected');
    }
}

function updateConnectionStatus() {
    // Update connection indicator based on mode
    if (state.isReplayMode) {
        elements.connectionIndicator.classList.remove('connected');
        elements.connectionIndicator.classList.add('replay-mode');
        elements.connectionIndicator.textContent = '📼 REPLAY MODE';
    } else if (state.isConnected) {
        elements.connectionIndicator.classList.add('connected');
        elements.connectionIndicator.classList.remove('replay-mode');
        elements.connectionIndicator.textContent = '';
    } else {
        elements.connectionIndicator.classList.remove('connected', 'replay-mode');
        elements.connectionIndicator.textContent = '';
    }
}

function updateSessionSelector() {
    if (!elements.sessionSelector) return;
    
    // Show Go Live button only in replay mode
    if (elements.goLiveBtn) {
        if (state.isReplayMode) {
            elements.goLiveBtn.classList.remove('hidden');
        } else {
            elements.goLiveBtn.classList.add('hidden');
        }
    }
    
    // Populate session selector
    elements.sessionSelector.innerHTML = '<option value="">Live Data (Current Session)</option>';
    
    state.recordedSessions.forEach(session => {
        const option = document.createElement('option');
        option.value = session.id;
        const date = new Date(session.timestamp);
        option.textContent = `${session.eventName} - ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        if (state.isReplayMode && session.id === state.currentSessionId) {
            option.selected = true;
        }
        
        elements.sessionSelector.appendChild(option);
    });
}

function updateLoadingStatus(message) {
    elements.loadingStatus.textContent = message;
}

function updateDriverDropdown() {
    if (!state.sessionData || !state.sessionData.runs) return;
    
    const currentValue = elements.mainDriverSelect.value;
    const compare1Value = elements.compareDriver1Select?.value || '';
    const compare2Value = elements.compareDriver2Select?.value || '';
    
    elements.mainDriverSelect.innerHTML = '<option value="">-- Select Kart --</option>';
    if (elements.compareDriver1Select) elements.compareDriver1Select.innerHTML = '<option value="">-- Select Driver --</option>';
    if (elements.compareDriver2Select) elements.compareDriver2Select.innerHTML = '<option value="">-- Select Driver --</option>';
    if (elements.hudDriverSelect) elements.hudDriverSelect.innerHTML = '<option value="">-- Select Kart --</option>';
    if (elements.hudQuickDriverSelect) elements.hudQuickDriverSelect.innerHTML = '<option value="">-- Select Kart --</option>';
    
    const activeRuns = state.sessionData.runs.filter(run => run.kart_number && run.kart_number !== '');
    activeRuns.forEach(run => {
        // Main driver select (Settings)
        const option = document.createElement('option');
        option.value = run.kart_number;
        option.textContent = `Kart ${run.kart_number} - ${run.name}`;
        if (run.kart_number === currentValue) {
            option.selected = true;
        }
        elements.mainDriverSelect.appendChild(option);
        
        // HUD driver select (no driver selected screen)
        if (elements.hudDriverSelect) {
            const hudOption = document.createElement('option');
            hudOption.value = run.kart_number;
            hudOption.textContent = `Kart ${run.kart_number} - ${run.name}`;
            if (run.kart_number === currentValue) {
                hudOption.selected = true;
            }
            elements.hudDriverSelect.appendChild(hudOption);
        }
        
        // HUD quick driver select (header selector)
        if (elements.hudQuickDriverSelect) {
            const quickOption = document.createElement('option');
            quickOption.value = run.kart_number;
            quickOption.textContent = `${run.kart_number} - ${run.name}`;
            if (run.kart_number === currentValue) {
                quickOption.selected = true;
            }
            elements.hudQuickDriverSelect.appendChild(quickOption);
        }
        
        // Compare driver 1 select
        if (elements.compareDriver1Select) {
            const option1 = document.createElement('option');
            option1.value = run.kart_number;
            option1.textContent = `Kart ${run.kart_number} - ${run.name}`;
            if (run.kart_number === compare1Value) {
                option1.selected = true;
            }
            elements.compareDriver1Select.appendChild(option1);
        }
        
        // Compare driver 2 select
        if (elements.compareDriver2Select) {
            const option2 = document.createElement('option');
            option2.value = run.kart_number;
            option2.textContent = `Kart ${run.kart_number} - ${run.name}`;
            if (run.kart_number === compare2Value) {
                option2.selected = true;
            }
            elements.compareDriver2Select.appendChild(option2);
        }
    });
}

function updateRaceView() {
    if (!state.sessionData) return;
    
    const { event_name, current_lap, total_laps, time_left, runs } = state.sessionData;
    
    // Update header
    elements.eventName.textContent = event_name || 'RaceFacer Live Timing';
    elements.sessionInfo.textContent = `Lap ${current_lap}/${total_laps} • ${time_left}`;
    
    const activeRuns = runs.filter(run => run.kart_number && run.kart_number !== '');
    
    // Efficient update: reuse existing elements
    const existingItems = Array.from(elements.raceList.children);
    
    activeRuns.forEach((run, index) => {
        const existingItem = existingItems[index];
        const kartNumber = run.kart_number;
        
        // Check if we can reuse existing element
        if (existingItem && existingItem.dataset.kartNumber === kartNumber) {
            // Update existing element content (no recreate = no blink)
            updateRaceItemContent(existingItem, run);
        } else {
            // Create new element
            const newItem = createRaceItem(run);
            if (existingItem) {
                elements.raceList.replaceChild(newItem, existingItem);
            } else {
                elements.raceList.appendChild(newItem);
            }
        }
    });
    
    // Remove extra items if any
    while (elements.raceList.children.length > activeRuns.length) {
        elements.raceList.removeChild(elements.raceList.lastChild);
    }
}

function createRaceItem(run) {
    const div = document.createElement('div');
    div.className = 'race-item';
    div.dataset.kartNumber = run.kart_number; // Track kart number for efficient updates
    
    // Build initial content
    updateRaceItemContent(div, run);
    
    return div;
}

function updateRaceItemContent(div, run) {
    // Update classes
    div.className = 'race-item';
    if (state.settings.mainDriver && run.kart_number === state.settings.mainDriver) {
        div.classList.add('main-driver');
    }
    
    const positionClass = run.pos <= 3 ? `p${run.pos}` : '';
    
    // Build details array based on settings
    const details = [];
    
    if (state.settings.showLastLap && run.last_time) {
        details.push(`<div class="race-detail-item">
            <span class="race-detail-label">Last:</span>
            <span class="race-detail-value last">${run.last_time}</span>
        </div>`);
    }
    
    if (state.settings.showAvgLap && run.avg_lap) {
        details.push(`<div class="race-detail-item">
            <span class="race-detail-label">Avg:</span>
            <span class="race-detail-value">${run.avg_lap}</span>
        </div>`);
    }
    
    if (state.settings.showConsistency && run.consistency_lap) {
        details.push(`<div class="race-detail-item">
            <span class="race-detail-label">±</span>
            <span class="race-detail-value">${run.consistency_lap}</span>
        </div>`);
    }
    
    if (state.settings.showIntervals && run.int) {
        details.push(`<div class="race-detail-item">
            <span class="race-detail-label">Int:</span>
            <span class="race-detail-value">${run.int}</span>
        </div>`);
    }
    
    // Update content
    div.innerHTML = `
        <div class="race-position ${positionClass}">P${run.pos}</div>
        <div class="race-driver-info">
            <div class="race-driver-name">Kart ${run.kart_number}</div>
            <div class="race-driver-kart">${run.name}</div>
            <div class="race-driver-details">
                ${details.join('')}
            </div>
        </div>
        <div class="race-timing">
            <div class="race-best-time">${run.best_time}</div>
            ${state.settings.showGaps ? `<div class="race-gap">${run.gap}</div>` : ''}
        </div>
    `;
}

function updateHUDView() {
    if (!state.sessionData) return;
    
    const mainDriver = state.settings.mainDriver;
    
    if (!mainDriver) {
        elements.hudNoDriver.style.display = 'flex';
        elements.hudContent.classList.add('hidden');
        return;
    }
    
    const run = state.sessionData.runs.find(r => r.kart_number === mainDriver);
    
    if (!run) {
        elements.hudNoDriver.style.display = 'flex';
        elements.hudContent.classList.add('hidden');
        return;
    }
    
    // Show HUD content
    elements.hudNoDriver.style.display = 'none';
    elements.hudContent.classList.remove('hidden');
    
    // Update header
    elements.hudEventName.textContent = state.sessionData.event_name;
    elements.hudLapInfo.textContent = `Lap ${state.sessionData.current_lap}/${state.sessionData.total_laps}`;
    
    // Update session timer
    updateSessionTimer(state.sessionData.time_left);
    
    // Update header stat badges
    updateHeaderBadges(mainDriver, run);
    
    // Update position and kart
    const positionClass = run.pos <= 3 ? `p${run.pos}` : '';
    elements.hudPosition.className = `hud-position ${positionClass}`;
    elements.hudPosition.textContent = `P${run.pos}`;
    elements.hudKart.textContent = `KART ${run.kart_number}`;
    
    // Apply visibility settings to cards
    applyHUDCardVisibility();
    
    // Update timing data
    elements.hudLastTime.textContent = run.last_time || '--.-';
    elements.hudBestTime.textContent = run.best_time || '--.-';
    elements.hudAvgTime.textContent = run.avg_lap || '--.-';
    elements.hudGap.textContent = run.gap || '-';
    elements.hudInterval.textContent = run.int || '-';
    elements.hudConsistency.textContent = run.consistency_lap || '-';
    
    // Update consistency score
    const consistencyScoreEl = document.getElementById('hud-consistency-score');
    if (consistencyScoreEl) {
        const consistencyScore = calculateConsistencyScore(mainDriver);
        if (consistencyScore) {
            consistencyScoreEl.textContent = consistencyScore.text;
            if (consistencyScore.score >= 75) {
                consistencyScoreEl.className = 'hud-sub-value improving';
            } else if (consistencyScore.score < 50) {
                consistencyScoreEl.className = 'hud-sub-value declining';
            } else {
                consistencyScoreEl.className = 'hud-sub-value';
            }
        } else {
            consistencyScoreEl.textContent = 'Need 3+ laps';
            consistencyScoreEl.className = 'hud-sub-value';
        }
    }
    
    // Update sub-values
    updateHUDSubValues(mainDriver, run);
    
    // Update footer
    elements.hudLaps.textContent = run.total_laps || '0';
    elements.hudTimeLeft.textContent = state.sessionData.time_left || '--:--';
    
    // Update lap history
    updateLapHistoryDisplay(mainDriver, run.best_time_raw);
    
    // Update driver notes
    updateDriverNotesList();
    
    // Check for opponent proximity
    checkOpponentProximity();
}

// Update session timer with warnings
function updateSessionTimer(timeLeft) {
    const timerEl = document.getElementById('hud-session-timer');
    if (!timerEl || !timeLeft) return;
    
    // Parse time (format: "MM:SS" or "H:MM:SS")
    const parts = timeLeft.split(':');
    let totalSeconds = 0;
    
    if (parts.length === 2) {
        // MM:SS
        totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else if (parts.length === 3) {
        // H:MM:SS
        totalSeconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
    
    // Update display
    timerEl.textContent = timeLeft;
    
    // Apply warning styles
    timerEl.className = 'hud-session-timer';
    if (totalSeconds <= 60 && totalSeconds > 30) {
        timerEl.classList.add('warning');
    } else if (totalSeconds <= 30) {
        timerEl.classList.add('critical');
    }
}

// Update header stat badges
function updateHeaderBadges(kartNumber, run) {
    const paceTrendEl = document.getElementById('hud-pace-trend');
    const positionChangeEl = document.getElementById('hud-position-change');
    
    if (!paceTrendEl || !positionChangeEl) return;
    
    // Pace Trend
    if (state.settings.showPaceTrend) {
        const paceTrend = calculatePaceTrend(kartNumber);
        if (paceTrend) {
            if (paceTrend.improving) {
                paceTrendEl.className = 'hud-stat-badge improving';
                paceTrendEl.textContent = `📈 Improving ${paceTrend.difference.toFixed(1)}s/lap`;
            } else if (paceTrend.declining) {
                paceTrendEl.className = 'hud-stat-badge declining';
                paceTrendEl.textContent = `📉 Declining +${Math.abs(paceTrend.difference).toFixed(1)}s/lap`;
            } else {
                paceTrendEl.className = 'hud-stat-badge';
                paceTrendEl.textContent = 'Steady pace';
            }
            paceTrendEl.style.display = 'block';
        } else {
            paceTrendEl.style.display = 'none';
        }
    } else {
        paceTrendEl.style.display = 'none';
    }
    
    // Position Changes
    if (state.settings.showPositionChanges) {
        const startPos = state.startingPositions[kartNumber];
        if (startPos) {
            const change = startPos - run.pos;
            if (change > 0) {
                positionChangeEl.className = 'hud-stat-badge position-up';
                positionChangeEl.textContent = `↑ +${change} positions`;
            } else if (change < 0) {
                positionChangeEl.className = 'hud-stat-badge position-down';
                positionChangeEl.textContent = `↓ ${change} positions`;
            } else {
                positionChangeEl.className = 'hud-stat-badge';
                positionChangeEl.textContent = `P${startPos} → P${run.pos}`;
            }
            positionChangeEl.style.display = 'block';
        } else {
            positionChangeEl.style.display = 'none';
        }
    } else {
        positionChangeEl.style.display = 'none';
    }
}

// Update HUD sub-values
function updateHUDSubValues(kartNumber, run) {
    // Percentage off best
    const pctOffBestEl = document.getElementById('hud-pct-off-best');
    if (pctOffBestEl && state.settings.showPercentageOffBest) {
        const pct = calculatePercentageOffBest(run.last_time_raw, run.best_time_raw);
        if (pct > 0) {
            pctOffBestEl.textContent = `+${pct}% off best`;
            pctOffBestEl.className = 'hud-sub-value declining';
        } else if (pct < 0) {
            pctOffBestEl.textContent = `${pct}% faster`;
            pctOffBestEl.className = 'hud-sub-value improving';
        } else {
            pctOffBestEl.textContent = 'Personal best!';
            pctOffBestEl.className = 'hud-sub-value improving';
        }
    }
    
    // Ideal lap time
    const idealLapEl = document.getElementById('hud-ideal-lap');
    if (idealLapEl) {
        const idealLap = calculateIdealLapTime(kartNumber);
        if (idealLap && run.best_time_raw) {
            const diff = run.best_time_raw - idealLap.timeRaw;
            if (diff > 10) { // More than 0.01s difference
                idealLapEl.textContent = `Ideal: ${idealLap.time} (-${(diff / 1000).toFixed(3)}s possible)`;
                idealLapEl.className = 'hud-sub-value';
            } else {
                idealLapEl.textContent = 'At ideal pace!';
                idealLapEl.className = 'hud-sub-value improving';
            }
        } else {
            idealLapEl.textContent = '';
        }
    }
    
    // Session best comparison
    const sessionBestEl = document.getElementById('hud-session-best');
    if (sessionBestEl && state.sessionBest) {
        if (state.sessionBest.kartNumber === kartNumber) {
            sessionBestEl.textContent = '🏆 Session Best!';
            sessionBestEl.className = 'hud-sub-value improving';
        } else {
            const diff = run.best_time_raw - state.sessionBest.timeRaw;
            sessionBestEl.textContent = `+${(diff / 1000).toFixed(3)}s vs ${state.sessionBest.name}`;
            sessionBestEl.className = 'hud-sub-value';
        }
    }
    
    // Gap trend + Delta to leader
    const gapTrendEl = document.getElementById('hud-gap-trend');
    if (gapTrendEl) {
        const delta = calculateDeltaToLeader(kartNumber, run.gap);
        
        if (state.settings.showGapTrend && delta) {
            if (delta.closing) {
                gapTrendEl.textContent = `${delta.text} - Closing!`;
                gapTrendEl.className = 'hud-sub-value improving';
            } else if (delta.opening) {
                gapTrendEl.textContent = `${delta.text} - Opening`;
                gapTrendEl.className = 'hud-sub-value declining';
            } else {
                gapTrendEl.textContent = `${delta.text} - Stable`;
                gapTrendEl.className = 'hud-sub-value';
            }
        } else if (!state.settings.showGapTrend) {
            gapTrendEl.textContent = '';
        }
    }
}

// Apply HUD card visibility based on settings
function applyHUDCardVisibility() {
    const cardMap = {
        'hudShowLastLap': 'hud-card-last-lap',
        'hudShowBestLap': 'hud-card-best-lap',
        'hudShowAvgLap': 'hud-card-avg',
        'hudShowGap': 'hud-card-gap',
        'hudShowInterval': 'hud-card-interval',
        'hudShowConsistency': 'hud-card-consistency',
        'hudShowLapHistory': 'hud-card-lap-history'
    };
    
    Object.entries(cardMap).forEach(([setting, cardId]) => {
        const card = document.getElementById(cardId);
        if (card) {
            if (state.settings[setting]) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        }
    });
}

// Toggle HUD card visibility
function toggleHUDCard(settingName) {
    state.settings[settingName] = !state.settings[settingName];
    saveSettings();
    applyHUDCardVisibility();
}

// Expose toggleHUDCard to global scope for onclick handlers
window.kartingApp = {
    toggleHUDCard: toggleHUDCard,
    deleteDriverNote: (kartNumber, timestamp) => deleteDriverNote(kartNumber, timestamp)
};

// Apply color theme
function applyTheme(theme) {
    // Remove all theme classes
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-f1-red', 'theme-racing-green');
    
    // Add selected theme class
    document.body.classList.add(`theme-${theme}`);
    
    console.log(`🎨 Theme applied: ${theme}`);
}

// Driver Notes Functions
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
    saveDriverNotes();
    
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
    
    saveDriverNotes();
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
        
        const timeStr = new Date(note.timestamp).toLocaleTimeString();
        
        div.innerHTML = `
            <div class="hud-note-header">
                <span class="hud-note-lap">Lap ${note.lapNum}</span>
                <span>
                    <span class="hud-note-time">${timeStr}</span>
                    <button class="hud-note-delete" onclick="window.kartingApp.deleteDriverNote('${kartNumber}', ${note.timestamp})">×</button>
                </span>
            </div>
            <div class="hud-note-text">${escapeHtml(note.note)}</div>
        `;
        
        elements.hudNotesList.appendChild(div);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function saveDriverNotes() {
    try {
        localStorage.setItem('karting-driver-notes', JSON.stringify(state.driverNotes));
    } catch (error) {
        console.error('Error saving driver notes:', error);
    }
}

function loadDriverNotes() {
    try {
        const saved = localStorage.getItem('karting-driver-notes');
        if (saved) {
            state.driverNotes = JSON.parse(saved);
        }
    } catch (error) {
        console.error('Error loading driver notes:', error);
        state.driverNotes = {};
    }
}

// ============================
// SESSION RECORDING & REPLAY
// ============================

function saveCurrentSession() {
    if (!state.sessionData || !state.currentSessionId) return;
    
    try {
        const sessionRecord = {
            id: state.currentSessionId,
            timestamp: Date.now(),
            eventName: state.sessionData.event_name,
            channel: CONFIG.CHANNEL,
            sessionData: state.sessionData,
            lapHistory: state.lapHistory,
            positionHistory: state.positionHistory,
            startingPositions: state.startingPositions,
            sessionBest: state.sessionBest,
            driverNotes: state.driverNotes
        };
        
        // Load existing sessions
        const saved = localStorage.getItem('karting-recorded-sessions');
        let sessions = saved ? JSON.parse(saved) : [];
        
        // Check if this session already exists
        const existingIndex = sessions.findIndex(s => s.id === state.currentSessionId);
        if (existingIndex >= 0) {
            // Update existing session
            sessions[existingIndex] = sessionRecord;
        } else {
            // Add new session
            sessions.unshift(sessionRecord); // Add to beginning
        }
        
        // Keep only last 20 sessions to avoid localStorage bloat
        sessions = sessions.slice(0, 20);
        
        localStorage.setItem('karting-recorded-sessions', JSON.stringify(sessions));
        state.recordedSessions = sessions;
        
        console.log(`📼 Session recorded: ${state.sessionData.event_name} (${new Date(sessionRecord.timestamp).toLocaleString()})`);
    } catch (error) {
        console.error('Error saving session:', error);
    }
}

function loadRecordedSessions() {
    try {
        const saved = localStorage.getItem('karting-recorded-sessions');
        if (saved) {
            state.recordedSessions = JSON.parse(saved);
            console.log(`📼 Loaded ${state.recordedSessions.length} recorded sessions`);
        }
    } catch (error) {
        console.error('Error loading recorded sessions:', error);
        state.recordedSessions = [];
    }
}

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
    updateConnectionStatus();
    updateSessionSelector();
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
    updateConnectionStatus();
    updateSessionSelector();
    
    // If we have live data, update views
    if (state.sessionData) {
        updateAllViews();
    }
    
    console.log('✅ Now listening to live feed');
}

function updateLapHistoryDisplay(kartNumber, bestTimeRaw) {
    const hudLapList = document.getElementById('hud-lap-list');
    if (!hudLapList) return;
    
    const history = state.lapHistory[kartNumber];
    
    if (!history || history.length === 0) {
        hudLapList.innerHTML = '<div class="hud-no-laps">No lap data yet...</div>';
        return;
    }
    
    // Reverse to show newest first
    const reversedHistory = [...history].reverse();
    
    hudLapList.innerHTML = '';
    
    reversedHistory.forEach(lap => {
        const div = document.createElement('div');
        div.className = 'hud-lap-item';
        
        // F1-style color coding
        const lapColor = getLapColor(lap, bestTimeRaw);
        div.classList.add(`lap-${lapColor}`);
        
        // Mark best lap
        if (bestTimeRaw && lap.timeRaw === bestTimeRaw) {
            div.classList.add('best');
        }
        
        // Format delta
        let deltaText = '-';
        let deltaClass = 'neutral';
        
        if (lap.delta !== 0 && lap.delta !== null && !isNaN(lap.delta)) {
            const deltaSeconds = (lap.delta / 1000).toFixed(3);
            if (lap.delta > 0) {
                deltaText = `+${deltaSeconds}`;
                deltaClass = 'positive';
            } else {
                deltaText = deltaSeconds;
                deltaClass = 'negative';
            }
        } else if (lap.delta === 0) {
            deltaText = '0.000';
            deltaClass = 'neutral';
        }
        
        div.innerHTML = `
            <div class="hud-lap-number">L${lap.lapNum}</div>
            <div class="hud-lap-time">${lap.time}</div>
            <div class="hud-lap-delta ${deltaClass}">${deltaText}</div>
        `;
        
        hudLapList.appendChild(div);
    });
}

// UI updates are now driven by websocket events (onSessionData)
// This ensures updates happen immediately when new data arrives,
// without unnecessary re-renders when data hasn't changed

// PWA Install Prompt
let deferredPrompt;

function setupInstallPrompt() {
    const installPrompt = document.getElementById('install-prompt');
    const installBtn = document.getElementById('install-btn');
    const dismissBtn = document.getElementById('dismiss-install');
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install prompt after 5 seconds
        setTimeout(() => {
            if (installPrompt) installPrompt.classList.remove('hidden');
        }, 5000);
    });
    
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log('Install prompt outcome:', outcome);
                deferredPrompt = null;
                if (installPrompt) installPrompt.classList.add('hidden');
            }
        });
    }
    
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            if (installPrompt) installPrompt.classList.add('hidden');
        });
    }
    
    window.addEventListener('appinstalled', () => {
        console.log('PWA installed successfully');
        deferredPrompt = null;
        if (installPrompt) installPrompt.classList.add('hidden');
    });
}

// Initialize on load
window.addEventListener('DOMContentLoaded', init);

// Handle page visibility
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page hidden');
    } else {
        console.log('Page visible');
        if (!state.isConnected && state.socket) {
            state.socket.connect();
        }
    }
});

// Prevent zoom on double-tap (mobile)
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Personal Records Management
function loadPersonalRecords() {
    try {
        const saved = localStorage.getItem('kartingPersonalRecords');
        if (saved) {
            state.personalRecords = JSON.parse(saved);
            console.log('Personal records loaded:', state.personalRecords);
        } else {
            state.personalRecords = {};
        }
    } catch (error) {
        console.error('Error loading personal records:', error);
        state.personalRecords = {};
    }
}

function savePersonalRecords() {
    try {
        localStorage.setItem('kartingPersonalRecords', JSON.stringify(state.personalRecords));
    } catch (error) {
        console.error('Error saving personal records:', error);
    }
}

function checkAndUpdateRecords(kartNumber, run) {
    if (!state.personalRecords[kartNumber]) {
        state.personalRecords[kartNumber] = {
            bestLapRaw: Infinity,
            bestLap: null,
            bestPosition: Infinity,
            mostLaps: 0,
            mostPositionsGained: -Infinity
        };
    }
    
    const records = state.personalRecords[kartNumber];
    const newRecords = [];
    
    // Check best lap
    if (run.best_time_raw && run.best_time_raw < records.bestLapRaw) {
        records.bestLapRaw = run.best_time_raw;
        records.bestLap = run.best_time;
        newRecords.push(`🏁 New best lap: ${run.best_time}`);
    }
    
    // Check best position
    if (run.pos < records.bestPosition) {
        records.bestPosition = run.pos;
        newRecords.push(`🥇 New best position: P${run.pos}`);
    }
    
    // Check most laps
    if (run.total_laps > records.mostLaps) {
        records.mostLaps = run.total_laps;
        newRecords.push(`📊 Most laps: ${run.total_laps}`);
    }
    
    // Check most positions gained
    const startPos = state.startingPositions[kartNumber];
    if (startPos) {
        const gained = startPos - run.pos;
        if (gained > records.mostPositionsGained) {
            records.mostPositionsGained = gained;
            newRecords.push(`↑ Most positions gained: +${gained}`);
        }
    }
    
    if (newRecords.length > 0) {
        savePersonalRecords();
    }
    
    return newRecords;
}

// ============================================================================
// KART ANALYSIS SYSTEM
// ============================================================================

// Load kart analysis data from localStorage
function loadKartAnalysisData() {
    try {
        const saved = localStorage.getItem('kartAnalysisData');
        if (saved) {
            state.kartAnalysisData = JSON.parse(saved);
            console.log('📊 Kart analysis data loaded:', {
                laps: state.kartAnalysisData.laps.length,
                karts: Object.keys(state.kartAnalysisData.karts).length,
                drivers: Object.keys(state.kartAnalysisData.drivers).length
            });
        } else {
            // Initialize fresh structure
            state.kartAnalysisData = {
                laps: [],
                drivers: {},
                karts: {},
                sessions: {}
            };
        }
    } catch (error) {
        console.error('Error loading kart analysis data:', error);
        state.kartAnalysisData = {
            laps: [],
            drivers: {},
            karts: {},
            sessions: {}
        };
    }
}

// Save kart analysis data to localStorage
function saveKartAnalysisData() {
    try {
        localStorage.setItem('kartAnalysisData', JSON.stringify(state.kartAnalysisData));
    } catch (error) {
        console.error('Error saving kart analysis data:', error);
    }
}

// Collect lap data for kart analysis (called when new lap detected)
function collectKartAnalysisLap(run, lapNum) {
    if (!run || !run.kart_number || !run.last_time_raw) return;
    
    const kartNumber = run.kart_number;
    const driverName = run.name || `Driver ${kartNumber}`;
    const sessionId = state.currentSessionId || 'unknown';
    
    // Create lap record
    const lapRecord = {
        timestamp: Date.now(),
        sessionId: sessionId,
        kartNumber: kartNumber,
        driverName: driverName,
        lapTime: run.last_time,
        lapTimeRaw: run.last_time_raw,
        position: run.pos,
        lapNum: lapNum
    };
    
    // Add to laps array
    state.kartAnalysisData.laps.push(lapRecord);
    
    // Update driver aggregates
    if (!state.kartAnalysisData.drivers[driverName]) {
        state.kartAnalysisData.drivers[driverName] = {
            totalLaps: 0,
            totalTime: 0,
            kartHistory: {}
        };
    }
    const driver = state.kartAnalysisData.drivers[driverName];
    driver.totalLaps++;
    driver.totalTime += run.last_time_raw;
    if (!driver.kartHistory[kartNumber]) {
        driver.kartHistory[kartNumber] = 0;
    }
    driver.kartHistory[kartNumber]++;
    
    // Update kart aggregates
    if (!state.kartAnalysisData.karts[kartNumber]) {
        state.kartAnalysisData.karts[kartNumber] = {
            totalLaps: 0,
            bestLap: Infinity,
            bestLapDriver: null,
            driverHistory: {}
        };
    }
    const kart = state.kartAnalysisData.karts[kartNumber];
    kart.totalLaps++;
    if (run.last_time_raw < kart.bestLap) {
        kart.bestLap = run.last_time_raw;
        kart.bestLapDriver = driverName;
    }
    if (!kart.driverHistory[driverName]) {
        kart.driverHistory[driverName] = 0;
    }
    kart.driverHistory[driverName]++;
    
    // Update session metadata
    if (!state.kartAnalysisData.sessions[sessionId]) {
        state.kartAnalysisData.sessions[sessionId] = {
            eventName: state.sessionData?.event_name || 'Unknown',
            startTime: Date.now(),
            lapCount: 0
        };
    }
    state.kartAnalysisData.sessions[sessionId].lapCount++;
    
    // Save to localStorage
    saveKartAnalysisData();
    
    console.log(`📊 Kart analysis lap collected: ${driverName} in Kart #${kartNumber} - ${run.last_time}`);
}

// Find drivers who have used multiple karts (most valuable data)
function findCrossKartDrivers() {
    const crossKartDrivers = {};
    const comparisonPairs = [];
    
    Object.entries(state.kartAnalysisData.drivers).forEach(([driverName, driverData]) => {
        const karts = Object.keys(driverData.kartHistory);
        if (karts.length >= 2) {
            crossKartDrivers[driverName] = karts;
            
            // Generate comparison pairs
            for (let i = 0; i < karts.length; i++) {
                for (let j = i + 1; j < karts.length; j++) {
                    comparisonPairs.push({
                        driver: driverName,
                        kart1: karts[i],
                        kart2: karts[j]
                    });
                }
            }
        }
    });
    
    return { crossKartDrivers, comparisonPairs };
}

// Calculate Driver-Normalized Performance Index for a kart
function calculateNormalizedIndex(kartNumber) {
    const kart = state.kartAnalysisData.karts[kartNumber];
    if (!kart || kart.totalLaps === 0) {
        return null;
    }
    
    // Get all laps for this kart
    const kartLaps = state.kartAnalysisData.laps.filter(lap => lap.kartNumber === kartNumber);
    
    if (kartLaps.length === 0) {
        return null;
    }
    
    // Calculate ratio for each lap (lap time / driver's overall average)
    const ratios = [];
    const crossKartDriverLaps = [];
    
    kartLaps.forEach(lap => {
        const driver = state.kartAnalysisData.drivers[lap.driverName];
        if (!driver || driver.totalLaps === 0) return;
        
        const driverAverage = driver.totalTime / driver.totalLaps;
        if (driverAverage === 0) return;
        
        const ratio = lap.lapTimeRaw / driverAverage;
        ratios.push(ratio);
        
        // Check if this driver used multiple karts (higher confidence)
        if (Object.keys(driver.kartHistory).length >= 2) {
            crossKartDriverLaps.push(ratio);
        }
    });
    
    if (ratios.length === 0) {
        return null;
    }
    
    // Calculate index - weight cross-kart driver data more heavily
    let index;
    if (crossKartDriverLaps.length >= 3) {
        // If we have enough cross-kart data, weight it 70%
        const crossKartAvg = crossKartDriverLaps.reduce((a, b) => a + b, 0) / crossKartDriverLaps.length;
        const allAvg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
        index = (crossKartAvg * 0.7) + (allAvg * 0.3);
    } else {
        // Otherwise use all data equally
        index = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    }
    
    const percentageFaster = (1 - index) * 100; // Negative = slower, positive = faster
    
    return {
        index: index,
        percentageFaster: percentageFaster,
        lapCount: kartLaps.length,
        driverCount: Object.keys(kart.driverHistory).length,
        crossKartDriverCount: crossKartDriverLaps.length > 0 ? 
            new Set(kartLaps.filter(lap => {
                const d = state.kartAnalysisData.drivers[lap.driverName];
                return d && Object.keys(d.kartHistory).length >= 2;
            }).map(lap => lap.driverName)).size : 0
    };
}

// Calculate percentile-based ranking for a kart
function calculatePercentileRanking(kartNumber) {
    const kartLaps = state.kartAnalysisData.laps.filter(lap => lap.kartNumber === kartNumber);
    
    if (kartLaps.length === 0) {
        return null;
    }
    
    // Group laps by session
    const sessionGroups = {};
    kartLaps.forEach(lap => {
        if (!sessionGroups[lap.sessionId]) {
            sessionGroups[lap.sessionId] = [];
        }
        sessionGroups[lap.sessionId].push(lap);
    });
    
    const percentiles = [];
    
    // Calculate percentile for each session
    Object.entries(sessionGroups).forEach(([sessionId, laps]) => {
        // Get all laps in this session
        const allSessionLaps = state.kartAnalysisData.laps.filter(l => l.sessionId === sessionId);
        
        laps.forEach(lap => {
            // Count how many laps were slower
            const slowerCount = allSessionLaps.filter(l => l.lapTimeRaw > lap.lapTimeRaw).length;
            const percentile = (slowerCount / allSessionLaps.length) * 100;
            percentiles.push(percentile);
        });
    });
    
    if (percentiles.length === 0) {
        return null;
    }
    
    return {
        avgPercentile: percentiles.reduce((a, b) => a + b, 0) / percentiles.length,
        bestPercentile: Math.max(...percentiles),
        worstPercentile: Math.min(...percentiles)
    };
}

// Get comprehensive statistics for a kart
function getKartStats(kartNumber) {
    const kart = state.kartAnalysisData.karts[kartNumber];
    if (!kart) {
        return null;
    }
    
    const kartLaps = state.kartAnalysisData.laps.filter(lap => lap.kartNumber === kartNumber);
    
    // Calculate average lap time
    const avgLapTime = kartLaps.length > 0 ?
        kartLaps.reduce((sum, lap) => sum + lap.lapTimeRaw, 0) / kartLaps.length : 0;
    
    // Get driver list with their stats
    const driverList = Object.entries(kart.driverHistory).map(([driverName, lapCount]) => {
        const driverLaps = kartLaps.filter(lap => lap.driverName === driverName);
        const bestLap = driverLaps.length > 0 ?
            Math.min(...driverLaps.map(lap => lap.lapTimeRaw)) : Infinity;
        
        return {
            name: driverName,
            lapCount: lapCount,
            bestLap: bestLap
        };
    }).sort((a, b) => a.bestLap - b.bestLap);
    
    return {
        bestLapTime: kart.bestLap,
        bestLapDriver: kart.bestLapDriver,
        avgLapTime: avgLapTime,
        uniqueDriverCount: Object.keys(kart.driverHistory).length,
        totalLaps: kart.totalLaps,
        driverList: driverList
    };
}

// Calculate confidence score for kart analysis
function calculateConfidence(kartNumber) {
    const kart = state.kartAnalysisData.karts[kartNumber];
    if (!kart) {
        return { level: 'Low', score: 0, warnings: [], crossKartDrivers: 0 };
    }
    
    const kartLaps = state.kartAnalysisData.laps.filter(lap => lap.kartNumber === kartNumber);
    const driverCount = Object.keys(kart.driverHistory).length;
    
    // Count cross-kart drivers for this kart
    const crossKartDrivers = kartLaps.filter(lap => {
        const driver = state.kartAnalysisData.drivers[lap.driverName];
        return driver && Object.keys(driver.kartHistory).length >= 2;
    });
    const uniqueCrossKartDrivers = new Set(crossKartDrivers.map(lap => lap.driverName)).size;
    
    // Calculate variance in lap times
    if (kartLaps.length === 0) {
        return { level: 'Low', score: 0, warnings: ['No lap data'], crossKartDrivers: 0 };
    }
    
    const avgLapTime = kartLaps.reduce((sum, lap) => sum + lap.lapTimeRaw, 0) / kartLaps.length;
    const variance = kartLaps.reduce((sum, lap) => sum + Math.pow(lap.lapTimeRaw - avgLapTime, 2), 0) / kartLaps.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / avgLapTime) * 100; // Percentage
    
    // Calculate confidence score (0-100)
    let score = 0;
    const warnings = [];
    
    // Lap count factor (max 40 points)
    if (kartLaps.length >= 50) {
        score += 40;
    } else if (kartLaps.length >= 20) {
        score += 25;
        warnings.push(`⚠️ Moderate lap count (${kartLaps.length} laps)`);
    } else {
        score += Math.min(20, kartLaps.length * 0.4);
        warnings.push(`⚠️ Low lap count (${kartLaps.length} laps)`);
    }
    
    // Driver count factor (max 30 points)
    if (driverCount >= 5) {
        score += 30;
    } else if (driverCount >= 3) {
        score += 20;
        warnings.push(`⚠️ Moderate driver variety (${driverCount} drivers)`);
    } else {
        score += driverCount * 5;
        warnings.push(`⚠️ Few drivers (${driverCount} drivers)`);
    }
    
    // Cross-kart drivers bonus (max 20 points)
    if (uniqueCrossKartDrivers >= 3) {
        score += 20;
    } else if (uniqueCrossKartDrivers >= 1) {
        score += uniqueCrossKartDrivers * 6;
    }
    
    // Consistency factor (max 10 points)
    if (coefficientOfVariation < 5) {
        score += 10; // Very consistent
    } else if (coefficientOfVariation < 10) {
        score += 5; // Moderate consistency
    } else {
        warnings.push(`⚠️ High variance detected (${coefficientOfVariation.toFixed(1)}% CV)`);
    }
    
    // Determine level
    let level;
    if (score >= 70) {
        level = 'High';
    } else if (score >= 40) {
        level = 'Medium';
    } else {
        level = 'Low';
    }
    
    return {
        level: level,
        score: Math.round(score),
        warnings: warnings,
        crossKartDrivers: uniqueCrossKartDrivers
    };
}

// Update kart analysis view
function updateKartAnalysisView() {
    if (!elements.analysisScreen) return;
    
    const karts = state.kartAnalysisData.karts;
    const kartNumbers = Object.keys(karts);
    
    // Show no data message if empty
    if (kartNumbers.length === 0) {
        if (elements.analysisNoData) {
            elements.analysisNoData.classList.remove('hidden');
        }
        if (elements.analysisContent) {
            elements.analysisContent.classList.add('hidden');
        }
        return;
    }
    
    // Show content
    if (elements.analysisNoData) {
        elements.analysisNoData.classList.add('hidden');
    }
    if (elements.analysisContent) {
        elements.analysisContent.classList.remove('hidden');
    }
    
    // Update summary stats
    updateAnalysisSummaryStats();
    
    // Update rankings table
    updateAnalysisRankingsTable();
}

// Update summary statistics
function updateAnalysisSummaryStats() {
    if (!elements.analysisStats) return;
    
    const totalLaps = state.kartAnalysisData.laps.length;
    const totalKarts = Object.keys(state.kartAnalysisData.karts).length;
    const totalDrivers = Object.keys(state.kartAnalysisData.drivers).length;
    const { crossKartDrivers } = findCrossKartDrivers();
    const crossKartCount = Object.keys(crossKartDrivers).length;
    
    elements.analysisStats.innerHTML = `
        <div class="analysis-stat-card">
            <div class="analysis-stat-value">${totalLaps}</div>
            <div class="analysis-stat-label">Total Laps Collected</div>
        </div>
        <div class="analysis-stat-card">
            <div class="analysis-stat-value">${totalKarts}</div>
            <div class="analysis-stat-label">Karts Analyzed</div>
        </div>
        <div class="analysis-stat-card">
            <div class="analysis-stat-value">${totalDrivers}</div>
            <div class="analysis-stat-label">Drivers Tracked</div>
        </div>
        <div class="analysis-stat-card">
            <div class="analysis-stat-value">${crossKartCount}</div>
            <div class="analysis-stat-label">Cross-Kart Drivers</div>
        </div>
    `;
}

// Update rankings table
function updateAnalysisRankingsTable() {
    if (!elements.analysisTableBody) return;
    
    const karts = state.kartAnalysisData.karts;
    const kartNumbers = Object.keys(karts);
    
    // Calculate analysis for all karts
    const kartAnalysis = kartNumbers.map(kartNumber => {
        const normalized = calculateNormalizedIndex(kartNumber);
        const percentile = calculatePercentileRanking(kartNumber);
        const stats = getKartStats(kartNumber);
        const confidence = calculateConfidence(kartNumber);
        
        return {
            kartNumber,
            normalized,
            percentile,
            stats,
            confidence
        };
    }).filter(k => k.normalized !== null);
    
    // Sort by normalized index (lower = faster)
    kartAnalysis.sort((a, b) => a.normalized.index - b.normalized.index);
    
    // Generate table rows
    elements.analysisTableBody.innerHTML = '';
    
    kartAnalysis.forEach((kart, index) => {
        const row = document.createElement('tr');
        row.className = 'analysis-table-row';
        
        // Rank
        const rank = index + 1;
        let rankClass = '';
        if (rank === 1) rankClass = 'rank-gold';
        else if (rank === 2) rankClass = 'rank-silver';
        else if (rank === 3) rankClass = 'rank-bronze';
        
        // Performance indicator
        const pctFaster = kart.normalized.percentageFaster;
        let perfClass = 'perf-neutral';
        let perfIcon = '−';
        if (pctFaster > 1) {
            perfClass = 'perf-faster';
            perfIcon = '↑';
        } else if (pctFaster < -1) {
            perfClass = 'perf-slower';
            perfIcon = '↓';
        }
        
        // Confidence badge
        const confLevel = kart.confidence.level;
        let confClass = 'conf-low';
        let confIcon = '🔴';
        if (confLevel === 'High') {
            confClass = 'conf-high';
            confIcon = '🟢';
        } else if (confLevel === 'Medium') {
            confClass = 'conf-medium';
            confIcon = '🟡';
        }
        
        // Format best lap time
        const bestLapFormatted = formatTime(kart.stats.bestLapTime);
        
        row.innerHTML = `
            <td class="rank ${rankClass}">${rank}</td>
            <td class="kart-number">#${kart.kartNumber}</td>
            <td class="norm-index">${kart.normalized.index.toFixed(3)}</td>
            <td class="perf-diff ${perfClass}">${perfIcon} ${Math.abs(pctFaster).toFixed(1)}%</td>
            <td class="percentile">${kart.percentile ? kart.percentile.avgPercentile.toFixed(1) : 'N/A'}</td>
            <td class="lap-count">${kart.stats.totalLaps}</td>
            <td class="driver-count">${kart.stats.uniqueDriverCount}</td>
            <td class="confidence ${confClass}">${confIcon} ${confLevel}</td>
            <td class="details-btn-cell">
                <button class="details-btn" onclick="window.kartingApp.showKartDetails('${kart.kartNumber}')">
                    Details
                </button>
            </td>
        `;
        
        elements.analysisTableBody.appendChild(row);
    });
}

// Show detailed stats for a specific kart
function showKartDetails(kartNumber) {
    const normalized = calculateNormalizedIndex(kartNumber);
    const percentile = calculatePercentileRanking(kartNumber);
    const stats = getKartStats(kartNumber);
    const confidence = calculateConfidence(kartNumber);
    
    if (!normalized || !stats) {
        alert('No data available for this kart');
        return;
    }
    
    // Format times
    const bestLapFormatted = formatTime(stats.bestLapTime);
    const avgLapFormatted = formatTime(stats.avgLapTime);
    
    // Build driver list HTML
    const driverListHTML = stats.driverList.map(driver => {
        const bestLap = formatTime(driver.bestLap);
        const crossKartDriver = state.kartAnalysisData.drivers[driver.name] &&
            Object.keys(state.kartAnalysisData.drivers[driver.name].kartHistory).length >= 2;
        const crossKartBadge = crossKartDriver ? ' <span class="cross-kart-badge">✓ Multi-kart</span>' : '';
        
        return `
            <div class="driver-item">
                <span class="driver-name">${driver.name}${crossKartBadge}</span>
                <span class="driver-stats">${driver.lapCount} laps | Best: ${bestLap}</span>
            </div>
        `;
    }).join('');
    
    // Build warnings HTML
    const warningsHTML = confidence.warnings.length > 0 ?
        `<div class="warnings-section">
            ${confidence.warnings.map(w => `<div class="warning-item">${w}</div>`).join('')}
        </div>` : '';
    
    // Create modal content
    const detailsHTML = `
        <div class="kart-details-modal">
            <div class="kart-details-header">
                <h2>Kart #${kartNumber} Analysis</h2>
                <button class="close-btn" onclick="window.kartingApp.closeKartDetails()">×</button>
            </div>
            <div class="kart-details-content">
                <div class="details-section">
                    <h3>Performance Metrics</h3>
                    <div class="metrics-grid">
                        <div class="metric">
                            <span class="metric-label">Normalized Index:</span>
                            <span class="metric-value">${normalized.index.toFixed(3)}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">vs Average:</span>
                            <span class="metric-value ${normalized.percentageFaster > 0 ? 'positive' : 'negative'}">
                                ${normalized.percentageFaster > 0 ? '+' : ''}${normalized.percentageFaster.toFixed(2)}%
                            </span>
                        </div>
                        ${percentile ? `
                        <div class="metric">
                            <span class="metric-label">Avg Percentile:</span>
                            <span class="metric-value">${percentile.avgPercentile.toFixed(1)}</span>
                        </div>
                        ` : ''}
                        <div class="metric">
                            <span class="metric-label">Confidence:</span>
                            <span class="metric-value">${confidence.level} (${confidence.score}/100)</span>
                        </div>
                    </div>
                    ${warningsHTML}
                </div>
                
                <div class="details-section">
                    <h3>Lap Statistics</h3>
                    <div class="metrics-grid">
                        <div class="metric">
                            <span class="metric-label">Best Lap:</span>
                            <span class="metric-value">${bestLapFormatted}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Best Lap By:</span>
                            <span class="metric-value">${stats.bestLapDriver || 'N/A'}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Average Lap:</span>
                            <span class="metric-value">${avgLapFormatted}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Total Laps:</span>
                            <span class="metric-value">${stats.totalLaps}</span>
                        </div>
                    </div>
                </div>
                
                <div class="details-section">
                    <h3>Driver History (${stats.uniqueDriverCount} drivers)</h3>
                    ${confidence.crossKartDrivers > 0 ? 
                        `<p class="cross-kart-info">✓ ${confidence.crossKartDrivers} driver(s) used multiple karts (high confidence data)</p>` : ''}
                    <div class="driver-list">
                        ${driverListHTML}
                    </div>
                </div>
                
                <div class="details-section">
                    <h3>Analysis Explanation</h3>
                    <p><strong>Normalized Index:</strong> Compares how drivers perform in this kart relative to their overall average. 
                    Lower is better. Index of 1.000 = average performance, < 1.000 = faster than average, > 1.000 = slower than average.</p>
                    <p><strong>vs Average:</strong> Percentage difference from average kart performance. Positive means this kart is faster than average.</p>
                    ${percentile ? '<p><strong>Percentile:</strong> Average ranking position across all sessions (higher is better).</p>' : ''}
                    <p><strong>Cross-Kart Drivers:</strong> Drivers who used multiple karts provide the most valuable comparison data.</p>
                </div>
            </div>
        </div>
    `;
    
    if (elements.analysisDetails) {
        elements.analysisDetails.innerHTML = detailsHTML;
        elements.analysisDetails.classList.remove('hidden');
        
        // Add click handler to close when clicking outside the modal
        elements.analysisDetails.onclick = (e) => {
            if (e.target === elements.analysisDetails) {
                closeKartDetails();
            }
        };
    }
}

// Close kart details modal
function closeKartDetails() {
    if (elements.analysisDetails) {
        elements.analysisDetails.classList.add('hidden');
        elements.analysisDetails.onclick = null;
    }
}

// Reset all kart analysis data
function resetKartAnalysisData() {
    if (confirm('Are you sure you want to reset all kart analysis data? This cannot be undone.')) {
        state.kartAnalysisData = {
            laps: [],
            drivers: {},
            karts: {},
            sessions: {}
        };
        saveKartAnalysisData();
        updateKartAnalysisView();
        alert('Kart analysis data has been reset.');
    }
}

// Export kart analysis data
function exportKartAnalysisData() {
    const exportData = {
        kartAnalysisData: state.kartAnalysisData,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `kart-analysis-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// Import kart analysis data
function importKartAnalysisData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (imported.kartAnalysisData) {
                state.kartAnalysisData = imported.kartAnalysisData;
                saveKartAnalysisData();
                updateKartAnalysisView();
                alert('Kart analysis data imported successfully!');
            } else {
                alert('Invalid kart analysis file format.');
            }
        } catch (error) {
            console.error('Error importing kart analysis data:', error);
            alert('Error importing data. Please check the file format.');
        }
    };
    reader.readAsText(file);
}

// Compare View
function updateCompareView() {
    if (!state.sessionData) return;
    
    const driver1Num = elements.compareDriver1Select?.value;
    const driver2Num = elements.compareDriver2Select?.value;
    
    if (!driver1Num || !driver2Num || driver1Num === driver2Num) {
        if (elements.compareContent) elements.compareContent.classList.add('hidden');
        if (elements.compareNoSelection) elements.compareNoSelection.style.display = 'block';
        return;
    }
    
    const driver1 = state.sessionData.runs.find(r => r.kart_number === driver1Num);
    const driver2 = state.sessionData.runs.find(r => r.kart_number === driver2Num);
    
    if (!driver1 || !driver2) return;
    
    if (elements.compareContent) elements.compareContent.classList.remove('hidden');
    if (elements.compareNoSelection) elements.compareNoSelection.style.display = 'none';
    
    // Update driver names
    const d1Name = document.getElementById('compare-driver1-name');
    const d2Name = document.getElementById('compare-driver2-name');
    if (d1Name) d1Name.textContent = `Kart ${driver1.kart_number}`;
    if (d2Name) d2Name.textContent = `Kart ${driver2.kart_number}`;
    
    // Update stats with highlighting
    updateCompareRow('pos', driver1.pos, driver2.pos, (a, b) => a < b);
    updateCompareRow('best', driver1.best_time, driver2.best_time, (a, b) => a.timeRaw < b.timeRaw, driver1, driver2);
    updateCompareRow('last', driver1.last_time, driver2.last_time, (a, b) => a.timeRaw < b.timeRaw, driver1, driver2);
    updateCompareRow('avg', driver1.avg_lap, driver2.avg_lap, (a, b) => a.timeRaw < b.timeRaw, driver1, driver2);
    updateCompareRow('consistency', driver1.consistency_lap, driver2.consistency_lap, (a, b) => a.timeRaw < b.timeRaw, driver1, driver2);
    updateCompareRow('laps', driver1.total_laps, driver2.total_laps, (a, b) => a > b);
    updateCompareRow('gap', driver1.gap, driver2.gap, (a, b) => a < b);
}

function updateCompareRow(stat, val1, val2, isBetter, run1, run2) {
    const el1 = document.getElementById(`compare-driver1-${stat}`);
    const el2 = document.getElementById(`compare-driver2-${stat}`);
    
    if (!el1 || !el2) return;
    
    el1.textContent = val1 || '-';
    el2.textContent = val2 || '-';
    
    // Reset colors
    el1.style.color = '';
    el2.style.color = '';
    
    // Highlight better value
    if (val1 && val2 && val1 !== '-' && val2 !== '-') {
        let compare;
        if (run1 && run2) {
            // For time comparisons, use raw values
            compare = isBetter({timeRaw: run1[`${stat}_time_raw`] || run1.best_time_raw}, {timeRaw: run2[`${stat}_time_raw`] || run2.best_time_raw});
        } else {
            compare = isBetter(val1, val2);
        }
        
        if (compare) {
            el1.style.color = '#00ff88';
            el2.style.color = '#ff6b6b';
        } else {
            el1.style.color = '#ff6b6b';
            el2.style.color = '#00ff88';
        }
    }
}

// Summary View
function updateSummaryView() {
    if (!state.sessionData || !state.settings.mainDriver) {
        if (elements.summaryNoData) elements.summaryNoData.style.display = 'block';
        if (elements.summaryContent) elements.summaryContent.classList.add('hidden');
        return;
    }
    
    const run = state.sessionData.runs.find(r => r.kart_number === state.settings.mainDriver);
    if (!run) return;
    
    if (elements.summaryNoData) elements.summaryNoData.style.display = 'none';
    if (elements.summaryContent) elements.summaryContent.classList.remove('hidden');
    
    // Update driver name
    const nameEl = document.getElementById('summary-driver-name');
    if (nameEl) nameEl.textContent = `Kart ${run.kart_number} - ${run.name}`;
    
    // Update stats
    const bestLapEl = document.getElementById('summary-best-lap');
    const avgLapEl = document.getElementById('summary-avg-lap');
    const totalLapsEl = document.getElementById('summary-total-laps');
    const consistencyEl = document.getElementById('summary-consistency');
    const finalPosEl = document.getElementById('summary-final-pos');
    const posChangeEl = document.getElementById('summary-pos-change');
    
    if (bestLapEl) bestLapEl.textContent = run.best_time || '--.-';
    if (avgLapEl) avgLapEl.textContent = run.avg_lap || '--.-';
    if (totalLapsEl) totalLapsEl.textContent = run.total_laps || '0';
    if (consistencyEl) consistencyEl.textContent = run.consistency_lap || '-';
    if (finalPosEl) finalPosEl.textContent = `P${run.pos}`;
    
    // Position change
    const startPos = state.startingPositions[run.kart_number];
    if (posChangeEl && startPos) {
        const change = startPos - run.pos;
        if (change > 0) {
            posChangeEl.textContent = `↑ +${change}`;
            posChangeEl.style.color = '#00ff88';
        } else if (change < 0) {
            posChangeEl.textContent = `↓ ${change}`;
            posChangeEl.style.color = '#ff6b6b';
        } else {
            posChangeEl.textContent = '-';
            posChangeEl.style.color = '';
        }
    }
    
    // Update lap list
    const lapListEl = document.getElementById('summary-lap-list');
    if (lapListEl) {
        const history = state.lapHistory[run.kart_number];
        if (history && history.length > 0) {
            lapListEl.innerHTML = '';
            history.forEach(lap => {
                const div = document.createElement('div');
                div.className = 'summary-lap-item';
                if (lap.timeRaw === run.best_time_raw) {
                    div.classList.add('best');
                }
                
                const lapColor = getLapColor(lap, run.best_time_raw);
                div.innerHTML = `
                    <div style="color: ${getLapColorHex(lapColor)}; font-weight: bold;">L${lap.lapNum}</div>
                    <div style="color: ${getLapColorHex(lapColor)};">${lap.time}</div>
                    <div style="color: #888;">Δ ${formatDelta(lap.delta)}</div>
                    <div style="color: #888;">P${lap.position || '-'}</div>
                `;
                lapListEl.appendChild(div);
            });
        } else {
            lapListEl.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No lap data available</div>';
        }
    }
    
    // Check for new personal records
    const newRecords = checkAndUpdateRecords(run.kart_number, run);
    const recordsEl = document.getElementById('summary-records');
    const recordsListEl = document.getElementById('summary-records-list');
    
    if (newRecords.length > 0 && recordsEl && recordsListEl) {
        recordsEl.classList.remove('hidden');
        recordsListEl.innerHTML = '';
        newRecords.forEach(record => {
            const div = document.createElement('div');
            div.className = 'summary-record-item';
            div.textContent = record;
            recordsListEl.appendChild(div);
        });
    }
    
    // Draw position chart
    drawPositionChart();
}

function getLapColorHex(color) {
    const colors = {
        'purple': '#a855f7',
        'green': '#00ff88',
        'yellow': '#ffaa00',
        'red': '#ff6b6b'
    };
    return colors[color] || '#fff';
}

// Draw position chart showing position changes lap-by-lap
function drawPositionChart() {
    if (!elements.positionChart || !state.sessionData) return;
    
    const canvas = elements.positionChart;
    const ctx = canvas.getContext('2d');
    
    // Get all drivers with position history
    const drivers = Object.keys(state.positionHistory).filter(kartNumber => {
        return state.positionHistory[kartNumber].length > 0;
    });
    
    if (drivers.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#666';
        ctx.font = '16px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No position data available yet...', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate chart dimensions
    const padding = 50;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    
    // Find max lap number
    let maxLap = 0;
    drivers.forEach(kartNumber => {
        const history = state.positionHistory[kartNumber];
        if (history.length > 0) {
            maxLap = Math.max(maxLap, history[history.length - 1].lapNum);
        }
    });
    
    // Find max position (highest position number, e.g., 10 for P10)
    let maxPos = 0;
    drivers.forEach(kartNumber => {
        state.positionHistory[kartNumber].forEach(point => {
            maxPos = Math.max(maxPos, point.position);
        });
    });
    
    // Draw grid
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    
    // Horizontal lines (positions)
    for (let i = 0; i <= maxPos; i++) {
        const y = padding + (i / maxPos) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();
        
        // Position labels
        ctx.fillStyle = '#666';
        ctx.font = '12px "Inter", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`P${i + 1}`, padding - 10, y + 4);
    }
    
    // Vertical lines (laps)
    const lapStep = Math.ceil(maxLap / 10); // Show ~10 grid lines
    for (let i = 0; i <= maxLap; i += lapStep) {
        const x = padding + (i / maxLap) * chartWidth;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + chartHeight);
        ctx.stroke();
        
        // Lap labels
        ctx.fillStyle = '#666';
        ctx.font = '12px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`L${i}`, x, canvas.height - padding + 20);
    }
    
    // Generate colors for each driver
    const colors = generateDriverColors(drivers.length);
    
    // Draw lines for each driver
    drivers.forEach((kartNumber, index) => {
        const history = state.positionHistory[kartNumber];
        const color = colors[index];
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        
        history.forEach((point, i) => {
            const x = padding + (point.lapNum / maxLap) * chartWidth;
            const y = padding + ((point.position - 1) / maxPos) * chartHeight;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw points
        ctx.fillStyle = color;
        history.forEach(point => {
            const x = padding + (point.lapNum / maxLap) * chartWidth;
            const y = padding + ((point.position - 1) / maxPos) * chartHeight;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    });
    
    // Update legend
    updateChartLegend(drivers, colors);
}

// Generate distinct colors for drivers
function generateDriverColors(count) {
    const baseColors = [
        '#00ff88', '#ff6b6b', '#ffaa00', '#a855f7', 
        '#3b82f6', '#ec4899', '#14b8a6', '#f59e0b',
        '#8b5cf6', '#10b981', '#f43f5e', '#06b6d4'
    ];
    
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
}

// Update chart legend
function updateChartLegend(drivers, colors) {
    if (!elements.positionChartLegend) return;
    
    elements.positionChartLegend.innerHTML = '';
    
    drivers.forEach((kartNumber, index) => {
        const run = state.sessionData.runs.find(r => r.kart_number === kartNumber);
        if (!run) return;
        
        const div = document.createElement('div');
        div.className = 'legend-item';
        div.innerHTML = `
            <div class="legend-color" style="background: ${colors[index]};"></div>
            <span>Kart ${kartNumber} - ${run.name}</span>
        `;
        elements.positionChartLegend.appendChild(div);
    });
}

function formatDelta(delta) {
    if (!delta) return '0.000';
    const seconds = (delta / 1000).toFixed(3);
    return delta > 0 ? `+${seconds}` : seconds;
}

// Export Session Data
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
            delta: formatDelta(lap.delta),
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

// Export ALL App Data (settings, lap history, personal records)
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

// Import ALL App Data
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
                saveSettings();
            }
            
            // Import lap history
            if (importedData.lapHistory) {
                state.lapHistory = importedData.lapHistory;
            }
            
            // Import personal records
            if (importedData.personalRecords) {
                state.personalRecords = importedData.personalRecords;
                savePersonalRecords();
            }
            
            // Import starting positions
            if (importedData.startingPositions) {
                state.startingPositions = importedData.startingPositions;
            }
            
            // Import driver notes
            if (importedData.driverNotes) {
                state.driverNotes = importedData.driverNotes;
                saveDriverNotes();
            }
            
            // Apply settings to UI
            applySettings();
            applyHUDCardVisibility();
            updateAllViews();
            
            alert('✅ Data imported successfully!\n\nAll your settings, lap history, and personal records have been restored.');
            
        } catch (error) {
            console.error('Import error:', error);
            alert('❌ Import failed!\n\nThe file may be corrupted or in an invalid format.\n\nError: ' + error.message);
        }
    };
    
    reader.onerror = () => {
        alert('❌ Failed to read file!');
    };
    
    reader.readAsText(file);
}

// ============================
// RESULTS VIEW FUNCTIONS
// ============================

// Scoring method descriptions
const SCORING_METHODS = {
    'fastest-lap': {
        name: 'Fastest Lap',
        description: 'Winner determined by single fastest lap time. Traditional sprint race format used by most venues.',
        calculate: (runs) => {
            return runs
                .filter(run => run.best_time_raw && run.best_time_raw > 0)
                .map(run => ({
                    kart: run.kart_number,
                    name: run.name,
                    score: run.best_time_raw,
                    displayScore: run.best_time,
                    laps: run.total_laps
                }))
                .sort((a, b) => a.score - b.score);
        }
    },
    'total-time': {
        name: 'Total Time',
        description: 'Sum of all lap times. Common in endurance racing - rewards consistency and completion of laps.',
        calculate: (runs) => {
            const results = [];
            runs.forEach(run => {
                const history = state.lapHistory[run.kart_number];
                if (history && history.length > 0) {
                    const totalTime = history.reduce((sum, lap) => sum + (lap.timeRaw || 0), 0);
                    results.push({
                        kart: run.kart_number,
                        name: run.name,
                        score: totalTime,
                        displayScore: formatTime(totalTime),
                        laps: history.length
                    });
                }
            });
            return results.sort((a, b) => a.score - b.score);
        }
    },
    'average-lap': {
        name: 'Average Lap Time',
        description: 'Average of all completed laps. Rewards overall consistency throughout the entire session.',
        calculate: (runs) => {
            return runs
                .filter(run => run.avg_lap_raw && run.avg_lap_raw > 0)
                .map(run => ({
                    kart: run.kart_number,
                    name: run.name,
                    score: run.avg_lap_raw,
                    displayScore: run.avg_lap,
                    laps: run.total_laps
                }))
                .sort((a, b) => a.score - b.score);
        }
    },
    'best-3-avg': {
        name: 'Best 3 Laps Average',
        description: 'Average of your 3 fastest laps. Eliminates outliers while rewarding peak performance.',
        calculate: (runs) => {
            const results = [];
            runs.forEach(run => {
                const history = state.lapHistory[run.kart_number];
                if (history && history.length >= 3) {
                    const best3 = [...history]
                        .filter(lap => lap.timeRaw > 0)
                        .sort((a, b) => a.timeRaw - b.timeRaw)
                        .slice(0, 3);
                    if (best3.length === 3) {
                        const avg = best3.reduce((sum, lap) => sum + lap.timeRaw, 0) / 3;
                        results.push({
                            kart: run.kart_number,
                            name: run.name,
                            score: avg,
                            displayScore: formatTime(avg),
                            laps: run.total_laps
                        });
                    }
                }
            });
            return results.sort((a, b) => a.score - b.score);
        }
    },
    'consistency': {
        name: 'Consistency Score',
        description: 'Rewards consistent lap times. Higher score = more consistent driving with less variation.',
        calculate: (runs) => {
            const results = [];
            runs.forEach(run => {
                const consistencyData = calculateConsistencyScore(run.kart_number);
                if (consistencyData && consistencyData.score > 0) {
                    results.push({
                        kart: run.kart_number,
                        name: run.name,
                        score: consistencyData.score,
                        displayScore: `${consistencyData.score}/100`,
                        laps: run.total_laps,
                        isHigherBetter: true // For consistency, higher is better
                    });
                }
            });
            // Sort descending for consistency (higher = better)
            return results.sort((a, b) => b.score - a.score);
        }
    }
};

function updateResultsView() {
    if (!state.sessionData || !state.sessionData.runs) {
        if (elements.resultsNoData) elements.resultsNoData.style.display = 'block';
        if (elements.resultsContent) elements.resultsContent.classList.add('hidden');
        return;
    }
    
    if (elements.resultsNoData) elements.resultsNoData.style.display = 'none';
    if (elements.resultsContent) elements.resultsContent.classList.remove('hidden');
    
    const method = elements.resultsMethodSelect?.value || 'fastest-lap';
    const methodConfig = SCORING_METHODS[method];
    
    // Update description
    if (elements.resultsMethodDescription) {
        elements.resultsMethodDescription.textContent = methodConfig.description;
    }
    
    // Calculate results
    const results = methodConfig.calculate(state.sessionData.runs);
    
    if (results.length === 0) {
        if (elements.resultsTableBody) {
            elements.resultsTableBody.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Not enough data to calculate results with this method</div>';
        }
        return;
    }
    
    // Update podium
    updatePodium(results, methodConfig);
    
    // Update full rankings table
    updateResultsTable(results, methodConfig);
    
    // Update bar chart
    drawResultsChart(results, methodConfig);
    
    // Update statistics
    updateResultsStats(results, methodConfig);
}

function updatePodium(results, methodConfig) {
    const podiumElements = [elements.podiumP1, elements.podiumP2, elements.podiumP3];
    
    for (let i = 0; i < 3; i++) {
        const podiumEl = podiumElements[i];
        if (!podiumEl) continue;
        
        if (results[i]) {
            const result = results[i];
            const gap = i === 0 ? '' : formatGap(result.score - results[0].score, methodConfig.isHigherBetter);
            
            podiumEl.querySelector('.podium-kart').textContent = `Kart ${result.kart}`;
            podiumEl.querySelector('.podium-name').textContent = result.name;
            podiumEl.querySelector('.podium-time').textContent = `${result.displayScore}${gap ? ' (' + gap + ')' : ''}`;
        } else {
            podiumEl.querySelector('.podium-kart').textContent = '-';
            podiumEl.querySelector('.podium-name').textContent = '-';
            podiumEl.querySelector('.podium-time').textContent = '-';
        }
    }
}

function updateResultsTable(results, methodConfig) {
    if (!elements.resultsTableBody) return;
    
    elements.resultsTableBody.innerHTML = '';
    
    results.forEach((result, index) => {
        const gap = index === 0 ? '-' : formatGap(result.score - results[0].score, methodConfig.isHigherBetter);
        
        const row = document.createElement('div');
        row.className = 'results-table-row';
        if (index < 3) row.classList.add(`podium-${index + 1}`);
        
        row.innerHTML = `
            <div class="results-col-pos">${index + 1}</div>
            <div class="results-col-kart">${result.kart}</div>
            <div class="results-col-name">${result.name}</div>
            <div class="results-col-score">${result.displayScore}</div>
            <div class="results-col-gap">${gap}</div>
        `;
        
        elements.resultsTableBody.appendChild(row);
    });
}

function drawResultsChart(results, methodConfig) {
    if (!elements.resultsChart) return;
    
    const canvas = elements.resultsChart;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const padding = 50;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    
    // Take top 10 for chart
    const top10 = results.slice(0, 10);
    const barHeight = chartHeight / top10.length;
    
    // Find max/min for scaling
    const isHigherBetter = methodConfig.isHigherBetter;
    const values = top10.map(r => r.score);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue;
    
    // Draw bars
    top10.forEach((result, index) => {
        const y = padding + index * barHeight;
        let barWidth;
        
        if (isHigherBetter) {
            // For consistency: scale from 0 to max
            barWidth = (result.score / maxValue) * chartWidth;
        } else {
            // For time: invert so fastest (lowest) gets longest bar
            const normalized = range > 0 ? (maxValue - result.score) / range : 1;
            barWidth = normalized * chartWidth;
        }
        
        // Color gradient based on position
        const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
        const color = index < 3 ? colors[index] : '#00ff88';
        
        // Draw bar
        ctx.fillStyle = color;
        ctx.fillRect(padding, y + 5, barWidth, barHeight - 10);
        
        // Draw kart number
        ctx.fillStyle = '#fff';
        ctx.font = '14px "Inter", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`#${result.kart}`, padding + 5, y + barHeight / 2 + 5);
        
        // Draw value
        ctx.textAlign = 'right';
        ctx.fillText(result.displayScore, canvas.width - padding - 5, y + barHeight / 2 + 5);
    });
}

function updateResultsStats(results, methodConfig) {
    if (!elements.resultsStatsGrid || results.length === 0) return;
    
    const winner = results[0];
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const spread = results[results.length - 1].score - results[0].score;
    
    elements.resultsStatsGrid.innerHTML = `
        <div class="results-stat-card">
            <div class="results-stat-label">Winner</div>
            <div class="results-stat-value">Kart ${winner.kart}</div>
        </div>
        <div class="results-stat-card">
            <div class="results-stat-label">Winning Score</div>
            <div class="results-stat-value">${winner.displayScore}</div>
        </div>
        <div class="results-stat-card">
            <div class="results-stat-label">Field Average</div>
            <div class="results-stat-value">${methodConfig.isHigherBetter ? avgScore.toFixed(1) : formatTime(avgScore)}</div>
        </div>
        <div class="results-stat-card">
            <div class="results-stat-label">First to Last Gap</div>
            <div class="results-stat-value">${formatGap(spread, methodConfig.isHigherBetter)}</div>
        </div>
        <div class="results-stat-card">
            <div class="results-stat-label">Drivers Classified</div>
            <div class="results-stat-value">${results.length}</div>
        </div>
    `;
}

function formatGap(gap, isHigherBetter) {
    if (gap === 0) return '-';
    if (isHigherBetter) {
        return `-${gap.toFixed(1)} pts`;
    }
    return `+${(gap / 1000).toFixed(3)}s`;
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    return `${seconds}.${milliseconds.toString().padStart(3, '0')}`;
}

// Update All Views (including compare and summary)
function updateAllViews() {
    if (!state.sessionData) return;
    
    // Update existing views
    if (state.currentTab === 'race' && elements.raceScreen) {
        updateRaceView();
    }
    if (state.currentTab === 'hud' && elements.hudScreen) {
        updateHUDView();
    }
    if (state.currentTab === 'results' && elements.resultsScreen) {
        updateResultsView();
    }
    if (state.currentTab === 'compare' && elements.compareScreen) {
        updateCompareView();
    }
    if (state.currentTab === 'summary' && elements.summaryScreen) {
        updateSummaryView();
    }
    if (state.currentTab === 'analysis' && elements.analysisScreen) {
        updateKartAnalysisView();
    }
}

// Export for debugging and HTML onclick
window.kartingApp = {
    state,
    config: CONFIG,
    switchTab,
    updateAllViews,
    toggleHUDCard,
    showKartDetails,
    closeKartDetails,
    resetKartAnalysisData,
    exportKartAnalysisData,
    importKartAnalysisData,
    showApp
};
