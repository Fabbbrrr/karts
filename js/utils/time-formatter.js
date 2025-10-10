// Karting Live Timer - Time Formatting Utilities
// Utility functions for formatting time values and lap times

/**
 * Format milliseconds to seconds with 3 decimal places
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time string (e.g., "25.123")
 */
export function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    return `${seconds}.${milliseconds.toString().padStart(3, '0')}`;
}

/**
 * Format delta time with sign
 * @param {number} delta - Delta in milliseconds
 * @returns {string} Formatted delta (e.g., "+0.123" or "-0.045")
 */
export function formatDelta(delta) {
    if (!delta) return '0.000';
    const seconds = (delta / 1000).toFixed(3);
    return delta > 0 ? `+${seconds}` : seconds;
}

/**
 * Parse lap time string to milliseconds
 * @param {string} timeStr - Time string (e.g., "1:25.123" or "25.123")
 * @returns {number|null} Time in milliseconds or null if invalid
 */
export function parseLapTime(timeStr) {
    if (!timeStr) return null;
    
    const parts = timeStr.split(':');
    if (parts.length === 2) {
        // Format: "1:25.123"
        const minutes = parseInt(parts[0]);
        const seconds = parseFloat(parts[1]);
        return (minutes * 60 + seconds) * 1000;
    } else {
        // Format: "25.123"
        return parseFloat(timeStr) * 1000;
    }
}

/**
 * Format milliseconds to MM:SS.mmm format
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time (e.g., "1:25.123")
 */
export function formatLapTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    
    if (minutes > 0) {
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }
    return `${seconds}.${milliseconds.toString().padStart(3, '0')}`;
}

/**
 * Calculate percentage difference from best time
 * @param {number} currentTime - Current lap time in ms
 * @param {number} bestTime - Best lap time in ms
 * @returns {string} Percentage string (e.g., "+2.5%")
 */
export function calculatePercentageOffBest(currentTime, bestTime) {
    if (!currentTime || !bestTime || bestTime === 0) return '-';
    
    const diff = ((currentTime - bestTime) / bestTime) * 100;
    return diff >= 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
}

