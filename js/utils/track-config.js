/**
 * Track Configuration Utilities
 * Helpers for working with track configuration IDs and filtering
 * 
 * PURPOSE: Provide centralized track configuration management
 * WHY: Different track layouts must be treated as separate entities for analysis
 * FEATURE: Track Configuration Support
 */

/**
 * Get track configuration ID from session data
 * 
 * PURPOSE: Extract track configuration with fallback handling
 * WHY: Ensures consistent track config retrieval across codebase
 * HOW: Returns track_configuration_id or 'unknown' if not available
 * FEATURE: Track Configuration Support
 * 
 * @param {Object} sessionData - Session data from live timing
 * @returns {string|number} Track configuration ID or 'unknown'
 */
export function getTrackConfigId(sessionData) {
    return sessionData?.track_configuration_id || 'unknown';
}

/**
 * Filter laps by track configuration
 * 
 * PURPOSE: Get only laps from a specific track layout
 * WHY: Prevents comparing lap times from different track configurations
 * HOW: Filters lap array by trackConfigId, handles null (all configs)
 * FEATURE: Track Configuration Filtering, Kart Analysis
 * 
 * @param {Array} laps - Array of lap records
 * @param {string|number|null} trackConfigId - Track config to filter by, null for all
 * @returns {Array} Filtered lap records
 */
export function filterLapsByTrackConfig(laps, trackConfigId = null) {
    if (!laps || !Array.isArray(laps)) {
        return [];
    }
    
    // If no filter specified, return all laps
    if (trackConfigId === null) {
        return laps;
    }
    
    // Filter by track configuration
    // WHY: Only compare apples to apples - same track layout
    return laps.filter(lap => lap.trackConfigId === trackConfigId);
}

/**
 * Get unique track configurations from lap data
 * 
 * PURPOSE: Discover all track layouts present in collected data
 * WHY: Allows user to select which track configuration to analyze
 * HOW: Extracts unique trackConfigId values from laps array
 * FEATURE: Track Configuration Support, Kart Analysis
 * 
 * @param {Array} laps - Array of lap records
 * @returns {Array} Array of unique track configuration IDs
 */
export function getUniqueTrackConfigs(laps) {
    if (!laps || !Array.isArray(laps)) {
        return [];
    }
    
    const configs = new Set();
    laps.forEach(lap => {
        if (lap.trackConfigId !== undefined && lap.trackConfigId !== null) {
            configs.add(lap.trackConfigId);
        }
    });
    
    return Array.from(configs).sort();
}

/**
 * Get track configuration display name
 * 
 * PURPOSE: Convert track config ID to human-readable name
 * WHY: Improves UI clarity for users
 * HOW: Maps known IDs to names, falls back to "Track Config #X"
 * FEATURE: Track Configuration Display
 * 
 * @param {string|number} trackConfigId - Track configuration ID
 * @returns {string} Human-readable track configuration name
 */
export function getTrackConfigName(trackConfigId) {
    if (trackConfigId === 'unknown' || trackConfigId === null || trackConfigId === undefined) {
        return 'Unknown Track';
    }
    
    // Add custom mappings here if track names are known
    const customNames = {
        // Example: 1: 'Short Circuit',
        // Example: 2: 'Long Circuit',
    };
    
    return customNames[trackConfigId] || `Track Config #${trackConfigId}`;
}

/**
 * Group laps by track configuration
 * 
 * PURPOSE: Organize laps into groups by track layout
 * WHY: Allows analysis and display per track configuration
 * HOW: Creates object with trackConfigId as keys, lap arrays as values
 * FEATURE: Track Configuration Support, Data Organization
 * 
 * @param {Array} laps - Array of lap records
 * @returns {Object} Object with trackConfigId keys and lap array values
 */
export function groupLapsByTrackConfig(laps) {
    if (!laps || !Array.isArray(laps)) {
        return {};
    }
    
    const groups = {};
    
    laps.forEach(lap => {
        const configId = lap.trackConfigId || 'unknown';
        if (!groups[configId]) {
            groups[configId] = [];
        }
        groups[configId].push(lap);
    });
    
    return groups;
}

