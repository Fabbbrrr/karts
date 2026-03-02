// Frontend Only - Main Application Entry Point
// Simplified for direct browser operation without backend dependency

import { webSocketService } from './websocket-service.js';
import * as RaceView from './race-view.js';
import * as SettingsView from './settings-view.js';
import * as SummaryView from './summary-view.js';
import * as CompareView from './compare-view.js';

// Application State
const AppState = {
    sessionData: null,
    currentTab: 'race',
    settings: {
        mainDriver: null,
        autoConnect: true,
        vibrationEnabled: true,
        audioEnabled: true
    }
};

/**
 * Load persisted data from localStorage
 */
function loadPersistedData() {
    try {
        // Load settings
        const savedSettings = localStorage.getItem('settings');
        if (savedSettings) {
            AppState.settings = JSON.parse(savedSettings);
            console.log('✅ Settings loaded from storage');
        }
        
        // Load main driver preference
        const mainDriver = localStorage.getItem('mainDriver');
        if (mainDriver) {
            AppState.settings.mainDriver = mainDriver;
        }
        
        // Load session history
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        console.log(`📂 Loaded ${sessions.length} sessions from storage`);
        
    } catch (error) {
        console.error('❌ Error loading persisted data:', error);
    }
}

/**
 * Save settings to localStorage
 */
function saveSettings() {
    try {
        localStorage.setItem('settings', JSON.stringify(AppState.settings));
        console.log('✅ Settings saved');
    } catch (error) {
        console.error('❌ Error saving settings:', error);
    }
}

/**
 * Handle WebSocket data updates
 */
function handleWebSocketData(data) {
    AppState.sessionData = data;
    window.sessionData = data; // Make available globally for views
    
    // Update UI based on current tab
    updateCurrentView(data);
}

/**
 * Update the current view with new data
 */
function updateCurrentView(sessionData) {
    if (!sessionData) return;
    
    switch (AppState.currentTab) {
        case 'race':
            RaceView.update(sessionData);
            break;
        case 'summary':
            SummaryView.update(sessionData);
            break;
        case 'compare':
            CompareView.update(sessionData);
            break;
    }
}

/**
 * Handle tab navigation changes
 */
function handleTabChange(tabName) {
    AppState.currentTab = tabName;
    
    // Update UI to show selected tab
    document.querySelectorAll('[data-section]').forEach(el => {
        el.classList.remove('active');
    });
    
    const activeSection = document.querySelector(`[data-section="${tabName}"]`);
    if (activeSection) {
        activeSection.classList.add('active');
    }
    
    // Refresh current view with data
    if (AppState.sessionData) {
        updateCurrentView(AppState.sessionData);
    }
    
    console.log(`📊 Switched to ${tabName} tab`);
}

/**
 * Setup event listeners for UI elements
 */
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = e.target.dataset.tab;
            if (tabName) {
                handleTabChange(tabName);
                
                // Update active state
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
    });
    
    // Settings button
    const settingsBtn = document.querySelector('.settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            SettingsView.open();
        });
    }
}

/**
 * Initialize the application
 */
export function init() {
    console.log('🚀 Initializing Frontend-Only Application...');
    
    // Load persisted data first
    loadPersistedData();
    
    // Setup tab navigation
    setupEventListeners();
    
    // Initialize RaceView
    RaceView.init();
    
    // Connect to WebSocket
    webSocketService.on('onConnect', (channel) => {
        console.log(`📡 Connected to channel: ${channel}`);
        document.getElementById('connection-status')?.classList.add('connected');
        document.getElementById('connection-status')?.classList.remove('disconnected');
        
        // Join the race channel
        webSocketService.send('join', { channel: 'race' });
    });
    
    webSocketService.on('onDisconnect', () => {
        console.log('❌ WebSocket disconnected');
        document.getElementById('connection-status')?.classList.add('disconnected');
        document.getElementById('connection-status')?.classList.remove('connected');
    });
    
    webSocketService.on('onData', handleWebSocketData);
    
    // Connect to RaceFacer
    if (AppState.settings.autoConnect) {
        console.log('🔄 Connecting to RaceFacer WebSocket...');
        webSocketService.connect('race');
    }
    
    // Show initial view
    const initialTab = AppState.currentTab || 'race';
    handleTabChange(initialTab);
    document.querySelector(`[data-section="${initialTab}"]`)?.classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.dataset.tab === initialTab) {
            btn.classList.add('active');
        }
    });
    
    console.log('✅ Frontend-Only Application initialized!');
}

// Export for use in other modules
export { AppState, saveSettings };
