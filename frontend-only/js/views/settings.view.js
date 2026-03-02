// Karting Live Timer - Settings View
// Settings management and configuration

/**
 * Apply settings to UI elements
 * @param {Object} elements - DOM elements
 * @param {Object} settings - User settings
 */
export function applySettings(elements, settings) {
    // Update main driver select
    if (elements.mainDriverSelect && settings.mainDriver) {
        elements.mainDriverSelect.value = settings.mainDriver;
    }
    
    // Update channel input
    if (elements.channelInput) {
        elements.channelInput.value = settings.channel;
    }
    
    // Update checkboxes for display toggles
    updateCheckbox(elements.showIntervalsCheckbox, settings.showIntervals);
    updateCheckbox(elements.showGapsCheckbox, settings.showGaps);
    updateCheckbox(elements.showConsistencyCheckbox, settings.showConsistency);
    updateCheckbox(elements.showAvgLapCheckbox, settings.showAvgLap);
    updateCheckbox(elements.showLastLapCheckbox, settings.showLastLap);
    
    // Update HUD component checkboxes
    updateCheckbox(elements.hudShowLastLapCheckbox, settings.hudShowLastLap);
    updateCheckbox(elements.hudShowBestLapCheckbox, settings.hudShowBestLap);
    updateCheckbox(elements.hudShowAvgLapCheckbox, settings.hudShowAvgLap);
    updateCheckbox(elements.hudShowGapCheckbox, settings.hudShowGap);
    updateCheckbox(elements.hudShowIntervalCheckbox, settings.hudShowInterval);
    updateCheckbox(elements.hudShowConsistencyCheckbox, settings.hudShowConsistency);
    updateCheckbox(elements.hudShowLapHistoryCheckbox, settings.hudShowLapHistory);
    
    // Update feature checkboxes
    updateCheckbox(elements.enableBestLapCheckbox, settings.enableBestLapCelebration);
    updateCheckbox(elements.enableProximityCheckbox, settings.enableProximityAlert);
    
    // Update proximity threshold
    if (elements.proximityThresholdInput) {
        elements.proximityThresholdInput.value = settings.proximityThreshold;
    }
}

/**
 * Update checkbox state
 * @param {HTMLInputElement} checkbox - Checkbox element
 * @param {boolean} checked - Checked state
 */
function updateCheckbox(checkbox, checked) {
    if (checkbox) {
        checkbox.checked = checked;
    }
}

/**
 * Get settings from UI elements
 * @param {Object} elements - DOM elements
 * @returns {Object} Settings object
 */
export function getSettingsFromUI(elements) {
    return {
        mainDriver: elements.mainDriverSelect?.value || null,
        channel: elements.channelInput?.value || 'lemansentertainment',
        showIntervals: elements.showIntervalsCheckbox?.checked ?? true,
        showGaps: elements.showGapsCheckbox?.checked ?? true,
        showConsistency: elements.showConsistencyCheckbox?.checked ?? true,
        showAvgLap: elements.showAvgLapCheckbox?.checked ?? true,
        showLastLap: elements.showLastLapCheckbox?.checked ?? true,
        hudShowLastLap: elements.hudShowLastLapCheckbox?.checked ?? true,
        hudShowBestLap: elements.hudShowBestLapCheckbox?.checked ?? true,
        hudShowAvgLap: elements.hudShowAvgLapCheckbox?.checked ?? true,
        hudShowGap: elements.hudShowGapCheckbox?.checked ?? true,
        hudShowInterval: elements.hudShowIntervalCheckbox?.checked ?? true,
        hudShowConsistency: elements.hudShowConsistencyCheckbox?.checked ?? true,
        hudShowLapHistory: elements.hudShowLapHistoryCheckbox?.checked ?? true,
        enableBestLapCelebration: elements.enableBestLapCheckbox?.checked ?? true,
        enableProximityAlert: elements.enableProximityCheckbox?.checked ?? true,
        proximityThreshold: parseFloat(elements.proximityThresholdInput?.value) || 1.0
    };
}

/**
 * Update session selector visibility
 * @param {Object} elements - DOM elements
 * @param {boolean} isReplayMode - Whether in replay mode
 */
export function updateSessionSelector(elements, isReplayMode) {
    if (elements.sessionSelectorBar) {
        elements.sessionSelectorBar.style.display = isReplayMode ? 'flex' : 'none';
    }
    
    if (elements.goLiveBtn) {
        elements.goLiveBtn.style.display = isReplayMode ? 'block' : 'none';
    }
}

