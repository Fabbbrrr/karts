// Karting Live Timer - UI Helper Utilities
// Helper functions for DOM manipulation and UI updates

/**
 * Get lap color based on performance (F1-style color coding)
 * @param {Object} lap - Lap object with timeRaw
 * @param {number} bestTimeRaw - Best lap time in ms
 * @returns {string} Color code: 'purple', 'green', 'yellow', 'white'
 */
export function getLapColor(lap, bestTimeRaw) {
    if (!lap || !lap.timeRaw || !bestTimeRaw) return 'white';
    
    const diff = lap.timeRaw - bestTimeRaw;
    const percentDiff = (diff / bestTimeRaw) * 100;
    
    if (diff === 0) return 'purple';      // Best lap
    if (percentDiff < 0.5) return 'green';  // Within 0.5%
    if (percentDiff < 2) return 'yellow';   // Within 2%
    return 'white';                          // Slower
}

/**
 * Get trend indicator icon
 * @param {Object} trend - Trend object with improving/declining flags
 * @returns {string} Trend icon
 */
export function getTrendIcon(trend) {
    if (!trend) return '';
    if (trend.improving || trend.closing) return '↗️';
    if (trend.declining || trend.opening) return '↘️';
    return '→';
}

/**
 * Get delta CSS class based on value
 * @param {number} delta - Delta value
 * @returns {string} CSS class name
 */
export function getDeltaClass(delta) {
    if (delta === null || delta === undefined || isNaN(delta)) return 'neutral';
    if (delta > 0) return 'positive';
    if (delta < 0) return 'negative';
    return 'neutral';
}

/**
 * Create HTML element with class and content
 * @param {string} tag - HTML tag name
 * @param {string} className - CSS class name(s)
 * @param {string} content - Inner HTML content
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, className = '', content = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.innerHTML = content;
    return element;
}

/**
 * Toggle element visibility
 * @param {HTMLElement} element - Element to toggle
 * @param {boolean} show - True to show, false to hide
 */
export function toggleVisibility(element, show) {
    if (!element) return;
    if (show) {
        element.classList.remove('hidden');
        element.style.display = '';
    } else {
        element.classList.add('hidden');
        element.style.display = 'none';
    }
}

/**
 * Clear element content
 * @param {HTMLElement} element - Element to clear
 */
export function clearElement(element) {
    if (element) element.innerHTML = '';
}

/**
 * Show loading state
 * @param {HTMLElement} element - Element to show loading in
 * @param {string} message - Loading message
 */
export function showLoading(element, message = 'Loading...') {
    if (!element) return;
    element.innerHTML = `<div class="loading-message">${message}</div>`;
}

/**
 * Show error state
 * @param {HTMLElement} element - Element to show error in
 * @param {string} message - Error message
 */
export function showError(element, message = 'An error occurred') {
    if (!element) return;
    element.innerHTML = `<div class="error-message">⚠️ ${message}</div>`;
}

/**
 * Show empty state
 * @param {HTMLElement} element - Element to show empty state in
 * @param {string} message - Empty state message
 */
export function showEmptyState(element, message = 'No data available') {
    if (!element) return;
    element.innerHTML = `<div class="empty-state">${message}</div>`;
}

/**
 * Format position with ordinal suffix
 * @param {number} position - Position number
 * @returns {string} Formatted position (e.g., "1st", "2nd", "3rd")
 */
export function formatPosition(position) {
    if (!position) return '-';
    
    const suffix = ['th', 'st', 'nd', 'rd'];
    const mod = position % 100;
    
    return position + (suffix[(mod - 20) % 10] || suffix[mod] || suffix[0]);
}

/**
 * Get position change indicator
 * @param {number} currentPos - Current position
 * @param {number} lastPos - Previous position
 * @returns {string} Change indicator with arrow
 */
export function getPositionChangeIndicator(currentPos, lastPos) {
    if (!lastPos || currentPos === lastPos) return '';
    if (currentPos < lastPos) return `↑ +${lastPos - currentPos}`;
    return `↓ -${currentPos - lastPos}`;
}

/**
 * Scroll element into view smoothly
 * @param {HTMLElement} element - Element to scroll to
 * @param {Object} options - Scroll options
 */
export function scrollIntoViewSmooth(element, options = {}) {
    if (!element) return;
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        ...options
    });
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} True if successful
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}

/**
 * Generate a unique ID
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique ID
 */
export function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

