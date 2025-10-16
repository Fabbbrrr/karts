/**
 * Timestamp Filtering Utilities
 * 
 * PURPOSE: Provide centralized timestamp validation for stale driver detection
 * WHY: Venues sometimes forget to remove drivers from previous sessions
 * FEATURE: Timestamp Filtering, Stale Driver Detection
 */

/**
 * Check if a driver's current lap is stale (started too long ago)
 * 
 * PURPOSE: Determine if driver should be hidden from display
 * WHY: Old drivers from previous sessions should not appear in current session
 * HOW: Compares current lap start timestamp to current time
 * FEATURE: Timestamp Filtering, Stale Driver Detection
 * 
 * @param {Object} run - Driver run data with current_lap_start_timestamp
 * @param {number} thresholdSeconds - Maximum age in seconds before considered stale
 * @returns {boolean} True if driver is stale (should be hidden), false if active
 */
export function isDriverStale(run, thresholdSeconds = 600) {
    // If no timestamp available, assume driver is active (don't filter)
    if (!run.current_lap_start_timestamp) {
        return false;
    }
    
    const currentTime = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds
    const lapAge = currentTime - run.current_lap_start_timestamp;
    
    return lapAge > thresholdSeconds;
}

/**
 * Get the age of a driver's current lap in seconds
 * 
 * PURPOSE: Calculate how long ago the current lap started
 * WHY: Useful for logging and debugging stale driver issues
 * HOW: Subtracts lap start timestamp from current time
 * FEATURE: Timestamp Analysis, Debugging
 * 
 * @param {Object} run - Driver run data with current_lap_start_timestamp
 * @returns {number|null} Age in seconds, or null if timestamp not available
 */
export function getLapAge(run) {
    if (!run.current_lap_start_timestamp) {
        return null;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime - run.current_lap_start_timestamp;
}

/**
 * Format lap age as human-readable string
 * 
 * PURPOSE: Display lap age in friendly format
 * WHY: Better UX for debugging and logging
 * HOW: Converts seconds to minutes/hours
 * FEATURE: Time Formatting, User Interface
 * 
 * @param {number} ageSeconds - Age in seconds
 * @returns {string} Formatted age string (e.g., "5 minutes ago", "2 hours ago")
 */
export function formatLapAge(ageSeconds) {
    if (ageSeconds === null || ageSeconds === undefined) {
        return 'unknown';
    }
    
    const minutes = Math.floor(ageSeconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
        return `${ageSeconds} second${ageSeconds !== 1 ? 's' : ''} ago`;
    }
}

/**
 * Filter array of runs to remove stale drivers
 * 
 * PURPOSE: Remove stale drivers from runs array
 * WHY: Centralized filtering logic for all views
 * HOW: Filters runs array using isDriverStale check
 * FEATURE: Timestamp Filtering, Data Processing
 * 
 * @param {Array} runs - Array of driver run objects
 * @param {number} thresholdSeconds - Maximum age in seconds before considered stale
 * @param {boolean} logFiltered - Whether to log filtered drivers (default: true)
 * @returns {Array} Filtered runs array with only active drivers
 */
export function filterStaleDrivers(runs, thresholdSeconds = 600, logFiltered = true) {
    if (!runs || !Array.isArray(runs)) {
        return [];
    }
    
    return runs.filter(run => {
        const stale = isDriverStale(run, thresholdSeconds);
        
        if (stale && logFiltered) {
            const age = getLapAge(run);
            const ageFormatted = formatLapAge(age);
            console.log(`🕐 Filtering stale driver: ${run.name} (kart ${run.kart_number}) - lap started ${ageFormatted}`);
        }
        
        return !stale;
    });
}

/**
 * Timestamp thresholds used throughout the application
 * WHY: Centralized configuration for consistent behavior
 */
export const TIMESTAMP_THRESHOLDS = {
    KART_ANALYSIS: 5 * 60,      // 5 minutes - for kart analysis lap collection
    RACE_DISPLAY: 10 * 60,      // 10 minutes - for hiding from race view
    SUMMARY_DISPLAY: 10 * 60,   // 10 minutes - for hiding from summary view
    RESULTS_DISPLAY: 30 * 60    // 30 minutes - results can show older data
};

