// Karting Live Timer - Driver Selection Service
// Centralized driver selection management

import * as StorageService from './storage.service.js';

/**
 * Select a driver and update all related UI elements
 * @param {string} kartNumber - Kart number to select
 * @param {Object} elements - DOM elements
 * @param {Object} state - Application state
 * @returns {boolean} Success status
 */
export function selectDriver(kartNumber, elements, state) {
    console.log('📍 Driver Selection Service: Selecting', kartNumber);
    
    if (!kartNumber) {
        console.warn('⚠️ Driver Selection: Invalid kart number');
        return false;
    }
    
    // Update state
    state.settings.mainDriver = kartNumber;
    
    // Save to storage
    StorageService.saveSettings(state.settings);
    console.log('💾 Driver Selection: Saved to storage');
    
    // Sync all dropdowns
    syncAllDropdowns(kartNumber, elements);
    console.log('🔄 Driver Selection: Synced dropdowns');
    
    return true;
}

/**
 * Get currently selected driver
 * @param {Object} state - Application state
 * @returns {string|null} Current driver kart number
 */
export function getSelectedDriver(state) {
    return state?.settings?.mainDriver || null;
}

/**
 * Sync all driver selection dropdowns to a value
 * @param {string} kartNumber - Kart number to sync to
 * @param {Object} elements - DOM elements
 */
export function syncAllDropdowns(kartNumber, elements) {
    const value = kartNumber || '';
    
    // Main driver select (settings tab)
    if (elements.mainDriverSelect) {
        elements.mainDriverSelect.value = value;
        console.log('  ✓ Synced main driver select');
    }
    
    // HUD driver select (no driver screen)
    if (elements.hudDriverSelect) {
        elements.hudDriverSelect.value = value;
        console.log('  ✓ Synced HUD driver select');
    }
    
    // HUD quick driver select (header)
    if (elements.hudQuickDriverSelect) {
        elements.hudQuickDriverSelect.value = value;
        console.log('  ✓ Synced HUD quick select');
    }
}

/**
 * Validate if a driver exists in current session
 * @param {string} kartNumber - Kart number to validate
 * @param {Object} sessionData - Current session data
 * @returns {Object} Validation result with driver data if found
 */
export function validateDriver(kartNumber, sessionData) {
    if (!sessionData || !sessionData.runs) {
        return {
            valid: false,
            reason: 'No session data available',
            driver: null
        };
    }
    
    if (!kartNumber) {
        return {
            valid: false,
            reason: 'No kart number provided',
            driver: null
        };
    }
    
    const driver = sessionData.runs.find(r => r.kart_number === kartNumber);
    
    if (!driver) {
        return {
            valid: false,
            reason: `Driver ${kartNumber} not found in session`,
            driver: null,
            availableDrivers: sessionData.runs.map(r => r.kart_number)
        };
    }
    
    return {
        valid: true,
        driver: driver
    };
}

/**
 * Select driver and switch to HUD view
 * @param {string} kartNumber - Kart number to select
 * @param {Object} elements - DOM elements
 * @param {Object} state - Application state
 * @param {Function} switchTabFn - Function to switch tabs
 * @param {Function} updateViewsFn - Function to update views
 */
export function selectDriverAndShowHUD(kartNumber, elements, state, switchTabFn, updateViewsFn) {
    console.log('🏎️ Select Driver and Show HUD:', kartNumber);
    console.log('  Session data available:', !!state.sessionData);
    console.log('  Runs in session:', state.sessionData?.runs?.length || 0);
    
    // Select the driver
    const success = selectDriver(kartNumber, elements, state);
    
    if (!success) {
        console.error('❌ Failed to select driver');
        return;
    }
    
    // Switch to HUD tab (this will trigger updateAllViews)
    switchTabFn('hud');
    
    console.log('✅ Driver selected and HUD activated');
}

/**
 * Handle driver selection change from any dropdown
 * @param {string} kartNumber - New kart number selected
 * @param {Object} elements - DOM elements  
 * @param {Object} state - Application state
 * @param {Function} updateViewsFn - Function to update all views
 */
export function handleDriverSelectionChange(kartNumber, elements, state, updateViewsFn) {
    console.log('🔄 Driver Selection Change:', kartNumber || '(cleared)');
    
    // Select the driver (or clear if empty)
    selectDriver(kartNumber || null, elements, state);
    
    // Update all views to reflect the change
    if (updateViewsFn) {
        updateViewsFn();
    }
}

