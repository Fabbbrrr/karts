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

    // Apply theme
    if (elements.themeGlassToggle) {
        elements.themeGlassToggle.checked = settings.theme === 'glass';
    }
    applyTheme(settings.theme);

    // Apply TTS settings
    updateCheckbox(elements.enableTTSCheckbox, settings.enableTTS ?? false);
    updateCheckbox(elements.ttsAnnounceGapP1Checkbox, settings.ttsAnnounceGapP1 ?? true);
    updateCheckbox(elements.ttsAnnounceGapPBCheckbox, settings.ttsAnnounceGapPB ?? true);
    if (elements.ttsRateSlider) {
        elements.ttsRateSlider.value = settings.ttsRate ?? 0.9;
    }
    if (elements.ttsRateValue) {
        elements.ttsRateValue.textContent = `${(settings.ttsRate ?? 0.9).toFixed(1)}×`;
    }
    if (elements.ttsPauseSlider) {
        elements.ttsPauseSlider.value = settings.ttsPause ?? 2000;
    }
    if (elements.ttsPauseValue) {
        elements.ttsPauseValue.textContent = `${((settings.ttsPause ?? 2000) / 1000).toFixed(1)}s`;
    }
}

/**
 * Apply theme by setting data-theme attribute on body
 * @param {string} theme - 'glass' or 'classic'
 */
export function applyTheme(theme) {
    document.body.dataset.theme = theme === 'glass' ? 'glass' : '';
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
        proximityThreshold: parseFloat(elements.proximityThresholdInput?.value) || 1.0,
        theme: elements.themeGlassToggle?.checked ? 'glass' : 'classic',
        enableTTS: elements.enableTTSCheckbox?.checked ?? false,
        ttsAnnounceGapP1: elements.ttsAnnounceGapP1Checkbox?.checked ?? true,
        ttsAnnounceGapPB: elements.ttsAnnounceGapPBCheckbox?.checked ?? true,
        ttsRate: parseFloat(elements.ttsRateSlider?.value) || 0.9,
        ttsPause: parseInt(elements.ttsPauseSlider?.value, 10) || 2000
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

