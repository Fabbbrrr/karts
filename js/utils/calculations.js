// Karting Live Timer - Calculation Utilities
// Utility functions for lap time calculations, deltas, and trends

/**
 * Calculate delta to leader (gaining/losing time)
 * @param {string} kartNumber - Kart number
 * @param {string|number} currentGap - Current gap to leader
 * @param {Object} lastGapState - State object tracking last gaps
 * @returns {Object|null} Delta object with value, trend, and text
 */
export function calculateDeltaToLeader(kartNumber, currentGap, lastGapState) {
    if (!currentGap || currentGap === '-') return null;
    
    // Parse current gap
    const match = currentGap.toString().match(/\+?([\d.]+)/);
    if (!match) return null;
    
    const currentGapValue = parseFloat(match[1]);
    const lastGapValue = lastGapState[kartNumber];
    
    // Update last gap
    lastGapState[kartNumber] = currentGapValue;
    
    // Need at least 2 data points
    if (lastGapValue === undefined) return null;
    
    // Calculate delta (negative = closing, positive = opening)
    const delta = currentGapValue - lastGapValue;
    
    return {
        value: delta,
        closing: delta < -0.05, // Closing by > 0.05s
        opening: delta > 0.05,  // Opening by > 0.05s
        text: delta < 0 ? `△ ${delta.toFixed(2)}s` : `▽ +${delta.toFixed(2)}s`
    };
}

/**
 * Calculate pace trend from lap history
 * @param {Array} lapHistory - Array of lap objects
 * @returns {Object|null} Trend object with direction and value
 */
export function calculatePaceTrend(lapHistory) {
    if (!lapHistory || lapHistory.length < 3) return null;
    
    // Get last 3 laps
    const recent = lapHistory.slice(-3);
    
    // Calculate average of first 2 vs last 2
    const early = (recent[0].timeRaw + recent[1].timeRaw) / 2;
    const late = (recent[1].timeRaw + recent[2].timeRaw) / 2;
    
    const trend = late - early;
    
    return {
        improving: trend < -50, // Improving by > 0.05s
        declining: trend > 50,  // Declining by > 0.05s
        value: trend
    };
}

/**
 * Calculate gap trend (closing/opening over time)
 * @param {Array} gapHistory - Array of gap measurements
 * @returns {Object|null} Trend object
 */
export function calculateGapTrend(gapHistory) {
    if (!gapHistory || gapHistory.length < 5) return null;
    
    // Simple linear regression on last 5 data points
    const n = gapHistory.length;
    const recent = gapHistory.slice(-5);
    
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    recent.forEach((point, index) => {
        const x = index;
        const y = point.gap;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    return {
        closing: slope < -0.01, // Gap decreasing
        opening: slope > 0.01,  // Gap increasing
        stable: Math.abs(slope) <= 0.01,
        rate: slope
    };
}

/**
 * Calculate consistency score from lap times
 * @param {Array} lapTimes - Array of lap time values in ms
 * @returns {number} Consistency score (0-100, higher is better)
 */
export function calculateConsistency(lapTimes) {
    if (!lapTimes || lapTimes.length < 3) return 0;
    
    // Calculate standard deviation
    const mean = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
    const variance = lapTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / lapTimes.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to percentage (lower stdDev = higher consistency)
    // Normalize: 100 - (stdDev / mean * 100)
    const consistency = Math.max(0, 100 - (stdDev / mean * 100));
    
    return Math.round(consistency);
}

/**
 * Calculate average lap time
 * @param {Array} lapTimes - Array of lap time values in ms
 * @returns {number} Average lap time in ms
 */
export function calculateAverageLapTime(lapTimes) {
    if (!lapTimes || lapTimes.length === 0) return 0;
    return lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
}

/**
 * Find best and worst lap from lap times
 * @param {Array} lapTimes - Array of lap time values in ms
 * @returns {Object} Object with best and worst lap times
 */
export function findBestWorstLaps(lapTimes) {
    if (!lapTimes || lapTimes.length === 0) {
        return { best: null, worst: null };
    }
    
    return {
        best: Math.min(...lapTimes),
        worst: Math.max(...lapTimes)
    };
}

/**
 * Calculate proximity alert (when approaching another driver)
 * @param {number} gap - Gap to driver ahead in seconds
 * @param {number} threshold - Alert threshold in seconds
 * @returns {boolean} True if within proximity threshold
 */
export function isWithinProximityThreshold(gap, threshold = 1.0) {
    if (!gap || gap === '-') return false;
    
    const match = gap.toString().match(/\+?([\d.]+)/);
    if (!match) return false;
    
    const gapValue = parseFloat(match[1]);
    return gapValue <= threshold;
}

