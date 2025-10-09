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
    showIntervals: true,
    showGaps: true,
    showConsistency: true,
    showAvgLap: true,
    showLastLap: true
};

// State Management
const state = {
    socket: null,
    sessionData: null,
    isConnected: false,
    currentTab: 'race',
    settings: { ...DEFAULT_SETTINGS },
    lapHistory: {} // Track lap history per kart: { kartNumber: [{lapNum, time, timeRaw, delta}] }
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
        
        // Initialize history for this kart if needed
        if (!state.lapHistory[kartNumber]) {
            state.lapHistory[kartNumber] = [];
        }
        
        const history = state.lapHistory[kartNumber];
        const lapCount = run.total_laps;
        
        // Check if this is a new lap (lap count increased)
        if (history.length === 0 || history[history.length - 1].lapNum < lapCount) {
            // Add new lap to history
            const lapData = {
                lapNum: lapCount,
                time: run.last_time,
                timeRaw: run.last_time_raw,
                bestTimeRaw: run.best_time_raw,
                delta: 0
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
    });
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
    
    // Add click handler to select driver
    div.style.cursor = 'pointer';
    div.addEventListener('click', () => {
        state.settings.mainDriver = run.kart_number;
        saveSettings();
        applySettings();
        switchTab('hud');
    });
    
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
    
    // Update position and kart
    const positionClass = run.pos <= 3 ? `p${run.pos}` : '';
    elements.hudPosition.className = `hud-position ${positionClass}`;
    elements.hudPosition.textContent = `P${run.pos}`;
    elements.hudKart.textContent = `KART ${run.kart_number}`;
    
    // Update timing data
    elements.hudLastTime.textContent = run.last_time || '--.-';
    elements.hudBestTime.textContent = run.best_time || '--.-';
    elements.hudAvgTime.textContent = run.avg_lap || '--.-';
    elements.hudGap.textContent = run.gap || '-';
    elements.hudInterval.textContent = run.int || '-';
    elements.hudConsistency.textContent = run.consistency_lap || '-';
    
    // Update footer
    elements.hudLaps.textContent = run.total_laps || '0';
    elements.hudTimeLeft.textContent = state.sessionData.time_left || '--:--';
    
    // Update lap history
    updateLapHistoryDisplay(mainDriver, run.best_time_raw);
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

// Export for debugging
window.kartingApp = {
    state,
    config: CONFIG,
    switchTab,
    updateAllViews
};
