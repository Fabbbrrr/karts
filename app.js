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
    lastBestLap: {} // Track last best lap time per kart for celebration
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
    resetSettings: document.getElementById('reset-settings')
};

// Initialize App
function init() {
    console.log('Initializing Karting Live Timer v2.0...');
    
    // Load settings from localStorage
    loadSettings();
    
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
    elements.mainDriverSelect.innerHTML = '<option value="">-- Select Kart --</option>';
    
    const activeRuns = state.sessionData.runs.filter(run => run.kart_number && run.kart_number !== '');
    activeRuns.forEach(run => {
        const option = document.createElement('option');
        option.value = run.kart_number;
        option.textContent = `Kart ${run.kart_number} - ${run.name}`;
        if (run.kart_number === currentValue) {
            option.selected = true;
        }
        elements.mainDriverSelect.appendChild(option);
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
    
    // Update race list
    elements.raceList.innerHTML = '';
    
    const activeRuns = runs.filter(run => run.kart_number && run.kart_number !== '');
    
    activeRuns.forEach(run => {
        const raceItem = createRaceItem(run);
        elements.raceList.appendChild(raceItem);
    });
}

function createRaceItem(run) {
    const div = document.createElement('div');
    div.className = 'race-item';
    
    // Highlight main driver
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
    
    // Set content FIRST
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
    
    // Add click handler AFTER innerHTML (so it doesn't get wiped)
    div.addEventListener('click', (e) => {
        console.log('Driver clicked:', run.kart_number);
        e.stopPropagation();
        state.settings.mainDriver = run.kart_number;
        saveSettings();
        applySettings();
        switchTab('hud');
    });
    
    return div;
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
    
    // Gap trend
    const gapTrendEl = document.getElementById('hud-gap-trend');
    if (gapTrendEl && state.settings.showGapTrend) {
        const gapTrend = calculateGapTrend(kartNumber);
        if (gapTrend) {
            if (gapTrend.closing) {
                gapTrendEl.textContent = `Closing ${Math.abs(gapTrend.difference).toFixed(1)}s/lap`;
                gapTrendEl.className = 'hud-sub-value improving';
            } else if (gapTrend.opening) {
                gapTrendEl.textContent = `Opening +${gapTrend.difference.toFixed(1)}s/lap`;
                gapTrendEl.className = 'hud-sub-value declining';
            } else {
                gapTrendEl.textContent = 'Gap stable';
                gapTrendEl.className = 'hud-sub-value';
            }
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

// Export for debugging and HTML onclick
window.kartingApp = {
    state,
    config: CONFIG,
    switchTab,
    updateAllViews,
    toggleHUDCard
};
 cli