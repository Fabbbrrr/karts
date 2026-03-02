/**
 * Incident Detection Utility
 * 
 * Detects crashes, spins, and other incidents based on lap time anomalies.
 * Uses statistical analysis to identify laps that are significantly slower
 * than a driver's typical pace.
 */

const LAP_TIME_THRESHOLD = 60000; // 60 seconds max lap time

// Configuration for incident detection
const INCIDENT_CONFIG = {
    // Minimum number of laps before detection starts
    MIN_LAPS_FOR_DETECTION: 3,
    
    // Multiplier for incident detection (lap > average * multiplier)
    INCIDENT_THRESHOLD_MULTIPLIER: 1.30, // 30% slower than average
    
    // Multiplier for severe incident (major crash/spin)
    SEVERE_INCIDENT_MULTIPLIER: 1.50, // 50% slower than average
    
    // Maximum lap time to consider (filters out DNS/DNF)
    MAX_VALID_LAP_TIME: 60000, // 60 seconds
    
    // Minimum lap time to consider (filters out false positives)
    MIN_INCIDENT_LAP_TIME: 15000, // 15 seconds (anything faster isn't an incident)
    
    // Recovery check: next lap should be closer to average
    RECOVERY_THRESHOLD: 1.15 // Next lap within 15% of average confirms incident
};

/**
 * Detect incidents for a specific driver
 * 
 * @param {Array} lapHistory - Array of lap objects {lapNum, timeRaw, time}
 * @param {Object} options - Optional configuration overrides
 * @returns {Object} Incident analysis with detailed breakdown
 */
export function detectIncidents(lapHistory, options = {}) {
    const config = { ...INCIDENT_CONFIG, ...options };
    
    if (!lapHistory || lapHistory.length < config.MIN_LAPS_FOR_DETECTION) {
        return {
            totalIncidents: 0,
            severeIncidents: 0,
            incidents: [],
            incidentRate: 0
        };
    }
    
    // Filter valid laps (exclude first lap, invalid times)
    const validLaps = lapHistory
        .filter((lap, index) => 
            index > 0 && // Exclude first lap
            lap.timeRaw && 
            lap.timeRaw > config.MIN_INCIDENT_LAP_TIME &&
            lap.timeRaw <= config.MAX_VALID_LAP_TIME
        );
    
    if (validLaps.length < 2) {
        return {
            totalIncidents: 0,
            severeIncidents: 0,
            incidents: [],
            incidentRate: 0
        };
    }
    
    // Calculate driver's baseline average (excluding outliers for accuracy)
    const baseline = calculateBaselineAverage(validLaps);
    
    // Detect incidents
    const incidents = [];
    
    for (let i = 0; i < validLaps.length; i++) {
        const lap = validLaps[i];
        const prevLap = i > 0 ? validLaps[i - 1] : null;
        const nextLap = i < validLaps.length - 1 ? validLaps[i + 1] : null;
        
        // Check if lap is significantly slower than baseline
        const isSlow = lap.timeRaw > baseline.average * config.INCIDENT_THRESHOLD_MULTIPLIER;
        const isSevere = lap.timeRaw > baseline.average * config.SEVERE_INCIDENT_MULTIPLIER;
        
        if (isSlow) {
            // Verify it's an incident (not just slow driving) by checking recovery
            const hasRecovery = nextLap && 
                nextLap.timeRaw < lap.timeRaw * config.RECOVERY_THRESHOLD;
            
            // Calculate severity
            const severity = calculateSeverity(lap.timeRaw, baseline.average, config);
            
            // Only add if recovery confirmed or it's the last lap
            if (hasRecovery || i === validLaps.length - 1) {
                incidents.push({
                    lapNumber: lap.lapNum,
                    lapTime: lap.timeRaw,
                    lapTimeFormatted: lap.time,
                    baselineAverage: baseline.average,
                    delta: lap.timeRaw - baseline.average,
                    deltaPercent: ((lap.timeRaw / baseline.average - 1) * 100).toFixed(1),
                    severity: severity,
                    isSevere: isSevere,
                    timeAdded: lap.timeRaw - baseline.average,
                    recoveryLap: nextLap ? nextLap.lapNum : null,
                    recoveryTime: nextLap ? nextLap.timeRaw : null
                });
            }
        }
    }
    
    // Calculate statistics
    const severeCount = incidents.filter(i => i.isSevere).length;
    const incidentRate = (incidents.length / validLaps.length) * 100;
    const totalTimeAdded = incidents.reduce((sum, i) => sum + i.timeAdded, 0);
    
    return {
        totalIncidents: incidents.length,
        severeIncidents: severeCount,
        minorIncidents: incidents.length - severeCount,
        incidents: incidents,
        incidentRate: incidentRate.toFixed(1),
        totalTimeAdded: totalTimeAdded,
        totalTimeAddedFormatted: formatTime(totalTimeAdded),
        baselineAverage: baseline.average,
        lapsAnalyzed: validLaps.length
    };
}

/**
 * Calculate baseline average excluding statistical outliers
 * Uses median and trimmed mean for robustness
 * 
 * @param {Array} laps - Array of lap objects
 * @returns {Object} Baseline statistics
 */
function calculateBaselineAverage(laps) {
    if (laps.length === 0) return { average: 0, median: 0 };
    
    const times = laps.map(l => l.timeRaw).sort((a, b) => a - b);
    
    // Calculate median
    const median = times.length % 2 === 0
        ? (times[times.length / 2 - 1] + times[times.length / 2]) / 2
        : times[Math.floor(times.length / 2)];
    
    // Calculate trimmed mean (exclude top 10% and bottom 10%)
    const trimPercent = 0.1;
    const trimCount = Math.floor(times.length * trimPercent);
    const trimmedTimes = times.slice(trimCount, times.length - trimCount);
    
    const trimmedMean = trimmedTimes.length > 0
        ? trimmedTimes.reduce((sum, t) => sum + t, 0) / trimmedTimes.length
        : median;
    
    // Use trimmed mean for more accurate baseline
    return {
        average: trimmedMean,
        median: median,
        best: times[0],
        worst: times[times.length - 1]
    };
}

/**
 * Calculate incident severity (1-5 scale)
 * 
 * @param {number} lapTime - The slow lap time
 * @param {number} baseline - Driver's baseline average
 * @param {Object} config - Configuration
 * @returns {number} Severity (1=minor, 5=major crash)
 */
function calculateSeverity(lapTime, baseline, config) {
    const ratio = lapTime / baseline;
    
    if (ratio >= 2.0) return 5; // Major crash (2x slower)
    if (ratio >= 1.7) return 4; // Severe spin
    if (ratio >= 1.5) return 3; // Significant incident
    if (ratio >= 1.4) return 2; // Moderate incident
    return 1; // Minor incident/avoiding others
}

/**
 * Format time from milliseconds to readable format
 */
function formatTime(ms) {
    if (!ms || ms <= 0) return '--.-';
    const seconds = (ms / 1000).toFixed(3);
    return `${seconds}s`;
}

/**
 * Get incident summary text for display
 * 
 * @param {Object} analysis - Incident analysis object
 * @returns {string} Summary text
 */
export function getIncidentSummary(analysis) {
    if (!analysis || analysis.totalIncidents === 0) {
        return 'Clean session! 🎯';
    }
    
    const { totalIncidents, severeIncidents, minorIncidents } = analysis;
    
    if (severeIncidents > 0 && minorIncidents > 0) {
        return `${severeIncidents} major, ${minorIncidents} minor`;
    } else if (severeIncidents > 0) {
        return `${severeIncidents} major incident${severeIncidents > 1 ? 's' : ''}`;
    } else {
        return `${minorIncidents} minor incident${minorIncidents > 1 ? 's' : ''}`;
    }
}

/**
 * Get emoji for incident count (fun visualization)
 * 
 * @param {number} count - Number of incidents
 * @returns {string} Emoji representation
 */
export function getIncidentEmoji(count) {
    if (count === 0) return '🎯'; // Clean
    if (count === 1) return '🟡'; // One incident
    if (count === 2) return '🟠'; // Two incidents
    if (count >= 3) return '🔴'; // Multiple incidents
    return '';
}

/**
 * Batch detect incidents for all drivers
 * 
 * @param {Object} lapHistory - Lap history by kart number
 * @param {Object} sessionData - Session data with runs
 * @returns {Object} Incident analysis by kart number
 */
export function detectAllIncidents(lapHistory, sessionData) {
    if (!lapHistory || !sessionData || !sessionData.runs) {
        return {};
    }
    
    const allIncidents = {};
    
    sessionData.runs.forEach(run => {
        const kartNumber = run.kart_number;
        if (kartNumber && lapHistory[kartNumber]) {
            allIncidents[kartNumber] = detectIncidents(lapHistory[kartNumber]);
        }
    });
    
    return allIncidents;
}

/**
 * Find driver with most incidents (Crasher of the Day award 🏆)
 * 
 * @param {Object} incidentsByDriver - Incident analysis by kart number
 * @param {Object} sessionData - Session data with driver names
 * @returns {Object|null} Winner of the "award" with details
 */
export function findMostIncidents(incidentsByDriver, sessionData) {
    if (!incidentsByDriver || Object.keys(incidentsByDriver).length === 0) {
        return null;
    }
    
    let maxIncidents = 0;
    let winner = null;
    
    Object.entries(incidentsByDriver).forEach(([kartNumber, analysis]) => {
        if (analysis.totalIncidents > maxIncidents) {
            maxIncidents = analysis.totalIncidents;
            const driverData = sessionData.runs.find(r => r.kart_number === kartNumber);
            winner = {
                kartNumber,
                name: driverData ? driverData.name : 'Unknown',
                totalIncidents: analysis.totalIncidents,
                severeIncidents: analysis.severeIncidents,
                incidentRate: analysis.incidentRate,
                analysis: analysis
            };
        }
    });
    
    return winner;
}

/**
 * Export configuration for adjustment
 */
export { INCIDENT_CONFIG };

