// Karting Live Timer - PWA
// Real-time go-karting session viewer

// Configuration
const CONFIG = {
    SOCKET_URL: 'https://live.racefacer.com:3123',
    CHANNEL: 'lemansentertainment',
    RECONNECT_DELAY: 2000
};

// State Management
const state = {
    socket: null,
    sessionData: null,
    selectedKartNumber: null,
    isConnected: false
};

// DOM Elements
const elements = {
    connectionIndicator: document.getElementById('connection-indicator'),
    loadingScreen: document.getElementById('loading-screen'),
    selectionScreen: document.getElementById('selection-screen'),
    driverScreen: document.getElementById('driver-screen'),
    loadingStatus: document.getElementById('loading-status'),
    
    // Selection screen
    eventName: document.getElementById('event-name'),
    sessionInfo: document.getElementById('session-info'),
    driverList: document.getElementById('driver-list'),
    
    // Driver screen
    backBtn: document.getElementById('back-btn'),
    driverEventName: document.getElementById('driver-event-name'),
    driverLapInfo: document.getElementById('driver-lap-info'),
    driverPosition: document.getElementById('driver-position'),
    driverKart: document.getElementById('driver-kart'),
    lastTime: document.getElementById('last-time'),
    bestTime: document.getElementById('best-time'),
    avgTime: document.getElementById('avg-time'),
    gapTime: document.getElementById('gap-time'),
    totalLaps: document.getElementById('total-laps'),
    consistency: document.getElementById('consistency'),
    timeLeft: document.getElementById('time-left')
};

// Initialize App
function init() {
    console.log('Initializing Karting Live Timer...');
    
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('Service Worker registered:', reg))
            .catch(err => console.error('Service Worker registration failed:', err));
    }
    
    // Setup event listeners
    elements.backBtn.addEventListener('click', showSelectionScreen);
    
    // Handle install prompt
    setupInstallPrompt();
    
    // Connect to WebSocket
    connectWebSocket();
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
    
    // Subscribe to channel
    state.socket.emit('subscribe', CONFIG.CHANNEL);
}

function onDisconnect() {
    console.log('Disconnected from RaceFacer');
    state.isConnected = false;
    updateConnectionIndicator(false);
    updateLoadingStatus('Disconnected. Reconnecting...');
}

function onConnectError(error) {
    console.error('Connection error:', error);
    state.isConnected = false;
    updateConnectionIndicator(false);
    updateLoadingStatus('Connection error. Retrying...');
}

function onSessionData(data) {
    try {
        console.log('Received session data:', data);
        
        // Parse data
        if (data && data.data) {
            state.sessionData = data.data;
            
            // Update UI based on current screen
            if (state.selectedKartNumber) {
                updateDriverView();
            } else {
                updateSelectionView();
                showSelectionScreen();
            }
        }
    } catch (error) {
        console.error('Error parsing session data:', error);
    }
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

function updateSelectionView() {
    if (!state.sessionData) return;
    
    const { event_name, current_lap, total_laps, time_left, runs } = state.sessionData;
    
    // Update header
    elements.eventName.textContent = event_name || 'RaceFacer Live Timing';
    
    if (current_lap && total_laps) {
        elements.sessionInfo.textContent = `Lap ${current_lap}/${total_laps} • ${time_left}`;
    }
    
    // Update driver list
    elements.driverList.innerHTML = '';
    
    if (runs && runs.length > 0) {
        // Filter out drivers without karts
        const activeRuns = runs.filter(run => run.kart_number && run.kart_number !== '');
        
        activeRuns.forEach(run => {
            const driverItem = createDriverItem(run);
            elements.driverList.appendChild(driverItem);
        });
    }
}

function createDriverItem(run) {
    const div = document.createElement('div');
    div.className = 'driver-item';
    div.onclick = () => selectKart(run.kart_number);
    
    const positionClass = run.pos <= 3 ? `p${run.pos}` : '';
    
    div.innerHTML = `
        <div class="driver-left">
            <div class="driver-position ${positionClass}">P${run.pos}</div>
            <div class="driver-info">
                <h3>Kart ${run.kart_number}</h3>
                <p>${run.name}</p>
            </div>
        </div>
        <div class="driver-right">
            <div class="driver-best">${run.best_time}</div>
            <div class="driver-label">Best</div>
        </div>
    `;
    
    return div;
}

function updateDriverView() {
    if (!state.sessionData || !state.selectedKartNumber) return;
    
    const run = state.sessionData.runs.find(r => r.kart_number === state.selectedKartNumber);
    
    if (!run) {
        console.warn('Selected kart not found:', state.selectedKartNumber);
        showSelectionScreen();
        return;
    }
    
    // Update header
    elements.driverEventName.textContent = state.sessionData.event_name;
    elements.driverLapInfo.textContent = `Lap ${state.sessionData.current_lap}/${state.sessionData.total_laps}`;
    
    // Update position and kart
    const positionClass = run.pos <= 3 ? `p${run.pos}` : '';
    elements.driverPosition.className = `driver-position ${positionClass}`;
    elements.driverPosition.textContent = `P${run.pos}`;
    elements.driverKart.textContent = `KART ${run.kart_number}`;
    
    // Update timing data
    elements.lastTime.textContent = run.last_time || '--.-';
    elements.bestTime.textContent = run.best_time || '--.-';
    elements.avgTime.textContent = run.avg_lap || '--.-';
    elements.gapTime.textContent = run.gap || '-';
    
    // Update footer info
    elements.totalLaps.textContent = run.total_laps || '0';
    elements.consistency.textContent = run.consistency_lap || '-';
    elements.timeLeft.textContent = state.sessionData.time_left || '--:--';
}

// Screen Navigation
function showScreen(screenElement) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    screenElement.classList.add('active');
}

function showSelectionScreen() {
    state.selectedKartNumber = null;
    updateSelectionView();
    showScreen(elements.selectionScreen);
}

function showDriverScreen() {
    updateDriverView();
    showScreen(elements.driverScreen);
}

function selectKart(kartNumber) {
    console.log('Selected kart:', kartNumber);
    state.selectedKartNumber = kartNumber;
    showDriverScreen();
}

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
            installPrompt.classList.remove('hidden');
        }, 5000);
    });
    
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('Install prompt outcome:', outcome);
            deferredPrompt = null;
            installPrompt.classList.add('hidden');
        }
    });
    
    dismissBtn.addEventListener('click', () => {
        installPrompt.classList.add('hidden');
    });
    
    window.addEventListener('appinstalled', () => {
        console.log('PWA installed successfully');
        deferredPrompt = null;
        installPrompt.classList.add('hidden');
    });
}

// Auto-refresh driver view
setInterval(() => {
    if (state.selectedKartNumber && state.sessionData) {
        updateDriverView();
    }
}, 100); // Update UI smoothly

// Initialize on load
window.addEventListener('DOMContentLoaded', init);

// Handle page visibility
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page hidden');
    } else {
        console.log('Page visible');
        // Reconnect if needed
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
    selectKart,
    showSelectionScreen
};

