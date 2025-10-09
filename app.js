// Karting Live Timer v2.0 - PWA
// Real-time go-karting session viewer with tabs, HUD, and settings

// Configuration
const CONFIG = {
    SOCKET_URL: 'https://live.racefacer.com:3123',
    CHANNEL: 'lemansentertainment',
    RECONNECT_DELAY: 2000,
    UPDATE_INTERVAL: 50 // Fastest possible refresh (50ms)
};

// Settings with defaults
const DEFAULT_SETTINGS = {
    mainDriver: null,
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
    lastGap: {} // Track last gap for delta calculation
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
    
    // Data management
    exportAllData: document.getElementById('export-all-data'),
    importAllData: document.getElementById('import-all-data'),
    importFileInput: document.getElementById('import-file-input'),
    
    // HUD component toggles in settings
    hudShowLastLapCheckbox: document.getElementById('hud-show-last-lap'),
    hudShowBestLapCheckbox: document.getElementById('hud-show-best-lap'),
    hudShowAvgLapCheckbox: document.getElementById('hud-show-avg-lap'),
    hudShowGapCheckbox: document.getElementById('hud-show-gap'),
    hudShowIntervalCheckbox: document.getElementById('hud-show-interval'),
    hudShowConsistencyCheckbox: document.getElementById('hud-show-consistency'),
    hudShowLapHistoryCheckbox: document.getElementById('hud-show-lap-history'),
    showAllHud: document.getElementById('show-all-hud')
};

// Initialize App
function init() {
    console.log('Initializing Karting Live Timer v2.0...');
    
    // Load settings from localStorage
    loadSettings();
    
    // Load personal records
    loadPersonalRecords();
    
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

// Event Listeners
function setupEventListeners() {
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
    if (elements.mainDriverSelect) {
        elements.mainDriverSelect.addEventListener('change', (e) => {
            state.settings.mainDriver = e.target.value || null;
            saveSettings();
            updateAllViews();
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
        state.socket.on(CONFIG.CHANNEL, onSessionData);
        
    } catch (error) {
        console.error('WebSocket connection error:', error);
        updateLoadingStatus('Connection failed. Retrying...');
    }
}

function onConnect() {
    console.log('Connected to RaceFacer');
    state.isConnected = true;
    updateConnectionIndicator(true);
    updateLoadingStatus('Connected! Waiting for data...');
    
    // Join the channel
    state.socket.emit('join', CONFIG.CHANNEL);
}

function onDisconnect() {
    console.log('Disconnected from RaceFacer');
    state.isConnected = false;
    updateConnectionIndicator(false);
}

function onConnectError(error) {
    console.error('Connection error:', error);
    state.isConnected = false;
    updateConnectionIndicator(false);
}

function onSessionData(data) {
    try {
        if (data && data.data) {
            state.sessionData = data.data;
            
            // Track lap history
            updateLapHistory();
            
            // First time receiving data - show tabs and switch to race view
            if (elements.loadingScreen.classList.contains('active')) {
                elements.loadingScreen.classList.remove('active');
                elements.tabNav.classList.remove('hidden');
                switchTab('race');
            }
            
            // Update driver dropdown in settings
            updateDriverDropdown();
            
            // Update all views
            updateAllViews();
        }
    } catch (error) {
        console.error('Error parsing session data:', error);
    }
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
            
            // Add new lap to history
            const lapData = {
                lapNum: lapCount,
                time: run.last_time,
                timeRaw: run.last_time_raw,
                bestTimeRaw: run.best_time_raw,
                delta: 0,
                position: run.pos
            };
            
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
    
    const activeRuns = state.sessionData.runs.filter(run => run.kart_number && run.kart_number !== '');
    activeRuns.forEach(run => {
        // Main driver select
        const option = document.createElement('option');
        option.value = run.kart_number;
        option.textContent = `Kart ${run.kart_number} - ${run.name}`;
        if (run.kart_number === currentValue) {
            option.selected = true;
        }
        elements.mainDriverSelect.appendChild(option);
        
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

function updateAllViews() {
    if (!state.sessionData) return;
    
    switch (state.currentTab) {
        case 'race':
            updateRaceView();
            break;
        case 'hud':
            updateHUDView();
            break;
        case 'settings':
            // Settings view is static
            break;
    }
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

// Fast update loop
setInterval(() => {
    if (state.sessionData) {
        updateAllViews();
    }
}, CONFIG.UPDATE_INTERVAL);

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
        startingPositions: state.startingPositions
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
                '- Personal records\n\n' +
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
    if (state.currentTab === 'compare' && elements.compareScreen) {
        updateCompareView();
    }
    if (state.currentTab === 'summary' && elements.summaryScreen) {
        updateSummaryView();
    }
}

// Export for debugging and HTML onclick
window.kartingApp = {
    state,
    config: CONFIG,
    switchTab,
    updateAllViews,
    toggleHUDCard
};
