// Karting Live Timer - Kart Analysis Service
// Advanced kart performance analysis with driver normalization

/**
 * Find drivers who have used multiple karts (cross-kart drivers)
 * @param {Object} analysisData - Kart analysis data with drivers
 * @returns {Object} Cross-kart drivers and comparison pairs
 */
export function findCrossKartDrivers(analysisData) {
    const crossKartDrivers = {};
    const comparisonPairs = [];
    
    Object.entries(analysisData.drivers).forEach(([driverName, driverData]) => {
        const kartsUsed = Object.keys(driverData.kartHistory);
        
        if (kartsUsed.length >= 2) {
            crossKartDrivers[driverName] = {
                kartsUsed: kartsUsed,
                totalLaps: driverData.totalLaps,
                avgTime: driverData.totalTime / driverData.totalLaps
            };
            
            // Create comparison pairs
            for (let i = 0; i < kartsUsed.length; i++) {
                for (let j = i + 1; j < kartsUsed.length; j++) {
                    comparisonPairs.push({
                        driver: driverName,
                        kart1: kartsUsed[i],
                        kart2: kartsUsed[j]
                    });
                }
            }
        }
    });
    
    return { crossKartDrivers, comparisonPairs };
}

/**
 * Calculate Driver-Normalized Performance Index for a kart on a specific track configuration
 * 
 * PURPOSE: Determine kart performance independent of driver skill level
 * WHY: Different drivers have different skill levels; normalize to compare karts fairly
 * HOW: Calculate ratio of lap times vs driver's average, weighted by cross-kart drivers
 * FEATURE: Kart Analysis, Driver Normalization, Track Configuration Filtering
 * 
 * @param {string} kartId - Kart ID to analyze (kartId or kartNumber for backward compatibility)
 * @param {Object} analysisData - Kart analysis data with laps, drivers, karts
 * @param {string|number} [trackConfigId] - Optional track configuration filter
 * @returns {Object|null} Normalized index with statistics, or null if insufficient data
 * @returns {number} returns.index - Performance index (1.0 = average, <1.0 = faster, >1.0 = slower)
 * @returns {number} returns.percentageFaster - Percentage faster/slower than average
 * @returns {number} returns.lapCount - Number of laps analyzed
 * @returns {number} returns.driverCount - Number of unique drivers
 * @returns {number} returns.crossKartDriverCount - Drivers who used multiple karts (high confidence)
 */
export function calculateNormalizedIndex(kartId, analysisData, trackConfigId = null) {
    const kart = analysisData.karts[kartId];
    if (!kart || kart.totalLaps === 0) {
        return null;
    }
    
    // FILTER: Exclude laps longer than 60 seconds from analysis
    // WHY: Long laps indicate incidents or system errors, not kart performance
    const LAP_TIME_THRESHOLD = 60000; // 60 seconds in milliseconds
    
    // Get all laps for this kart filtered by track configuration
    // WHY: Different track layouts (short/long) must not be compared
    // FEATURE: Track Configuration Filtering
    const kartLaps = analysisData.laps.filter(lap => {
        const matchesKart = (lap.kartId === kartId || lap.kartNumber === kartId);
        const validTime = lap.lapTimeRaw <= LAP_TIME_THRESHOLD;
        const matchesTrack = trackConfigId === null || lap.trackConfigId === trackConfigId;
        return matchesKart && validTime && matchesTrack;
    });
    
    if (kartLaps.length === 0) {
        return null;
    }
    
    // Calculate ratio for each lap (lap time / driver's overall average)
    const ratios = [];
    const crossKartDriverLaps = [];
    
    kartLaps.forEach(lap => {
        const driver = analysisData.drivers[lap.driverName];
        if (!driver || driver.totalLaps === 0) return;
        
        const driverAverage = driver.totalTime / driver.totalLaps;
        if (driverAverage === 0) return;
        
        const ratio = lap.lapTimeRaw / driverAverage;
        ratios.push(ratio);
        
        // Check if this driver used multiple karts (higher confidence)
        if (Object.keys(driver.kartHistory).length >= 2) {
            crossKartDriverLaps.push(ratio);
        }
    });
    
    if (ratios.length === 0) {
        return null;
    }
    
    // Calculate index - weight cross-kart driver data more heavily
    let index;
    if (crossKartDriverLaps.length >= 3) {
        // If we have enough cross-kart data, weight it 70%
        const crossKartAvg = crossKartDriverLaps.reduce((a, b) => a + b, 0) / crossKartDriverLaps.length;
        const allAvg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
        index = (crossKartAvg * 0.7) + (allAvg * 0.3);
    } else {
        // Otherwise use all data equally
        index = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    }
    
    const percentageFaster = (1 - index) * 100; // Negative = slower, positive = faster
    
    // Count unique cross-kart drivers
    const crossKartDriverCount = new Set(
        kartLaps
            .filter(lap => {
                const d = analysisData.drivers[lap.driverName];
                return d && Object.keys(d.kartHistory).length >= 2;
            })
            .map(lap => lap.driverName)
    ).size;
    
    return {
        index: index,
        percentageFaster: percentageFaster,
        lapCount: kartLaps.length,
        driverCount: Object.keys(kart.driverHistory).length,
        crossKartDriverCount: crossKartDriverCount
    };
}

/**
 * Calculate percentile-based ranking for a kart
 * @param {string} kartId - Kart ID to analyze
 * @param {Object} analysisData - Kart analysis data
 * @returns {Object|null} Percentile statistics
 */
export function calculatePercentileRanking(kartId, analysisData) {
    // FILTER: Exclude laps longer than 60 seconds from analysis
    const LAP_TIME_THRESHOLD = 60000; // 60 seconds in milliseconds
    
    const kartLaps = analysisData.laps.filter(lap => 
        (lap.kartId === kartId || lap.kartNumber === kartId) && lap.lapTimeRaw <= LAP_TIME_THRESHOLD
    );
    
    if (kartLaps.length === 0) {
        return null;
    }
    
    // Group laps by session
    const sessionGroups = {};
    kartLaps.forEach(lap => {
        if (!sessionGroups[lap.sessionId]) {
            sessionGroups[lap.sessionId] = [];
        }
        sessionGroups[lap.sessionId].push(lap);
    });
    
    const percentiles = [];
    
    // Calculate percentile for each session
    Object.entries(sessionGroups).forEach(([sessionId, laps]) => {
        // Get all laps in this session (excluding laps > 60s)
        const allSessionLaps = analysisData.laps.filter(l => l.sessionId === sessionId && l.lapTimeRaw <= LAP_TIME_THRESHOLD);
        
        laps.forEach(lap => {
            // Count how many laps were slower
            const slowerCount = allSessionLaps.filter(l => l.lapTimeRaw > lap.lapTimeRaw).length;
            const percentile = (slowerCount / allSessionLaps.length) * 100;
            percentiles.push(percentile);
        });
    });
    
    if (percentiles.length === 0) {
        return null;
    }
    
    return {
        avgPercentile: percentiles.reduce((a, b) => a + b, 0) / percentiles.length,
        bestPercentile: Math.max(...percentiles),
        worstPercentile: Math.min(...percentiles)
    };
}

/**
 * Get comprehensive statistics for a kart
 * @param {string} kartId - Kart ID to analyze
 * @param {Object} analysisData - Kart analysis data
 * @returns {Object|null} Comprehensive kart statistics
 */
export function getKartStats(kartId, analysisData) {
    const kart = analysisData.karts[kartId];
    if (!kart) {
        return null;
    }
    
    // FILTER: Exclude laps longer than 60 seconds from analysis
    const LAP_TIME_THRESHOLD = 60000; // 60 seconds in milliseconds
    
    // Get lap times from laps array (no duplication in storage)
    const kartLaps = analysisData.laps.filter(lap => 
        (lap.kartId === kartId || lap.kartNumber === kartId) && lap.lapTimeRaw <= LAP_TIME_THRESHOLD
    );
    
    if (kartLaps.length === 0) {
        return {
            totalLaps: 0,
            bestLapTime: Infinity,
            worstLapTime: 0,
            avgLapTime: 0,
            stdDev: 0,
            consistency: 0,
            uniqueDriverCount: kart.drivers.length,
            drivers: kart.drivers,
            driverHistory: kart.driverHistory
        };
    }
    
    // Calculate average
    const avgTime = kart.totalTime / kart.totalLaps;
    
    // Calculate standard deviation from actual lap times
    const variance = kartLaps.reduce((sum, lap) => {
        return sum + Math.pow(lap.lapTimeRaw - avgTime, 2);
    }, 0) / kartLaps.length;
    const stdDev = Math.sqrt(variance);
    
    return {
        totalLaps: kart.totalLaps,
        bestLapTime: kart.bestLap,
        worstLapTime: kart.worstLap,
        avgLapTime: avgTime,
        stdDev: stdDev,
        consistency: Math.max(0, 100 - (stdDev / avgTime * 100)),
        uniqueDriverCount: kart.drivers.length,
        drivers: kart.drivers,
        driverHistory: kart.driverHistory
    };
}

/**
 * Calculate confidence level for analysis
 * @param {string} kartId - Kart ID to analyze
 * @param {Object} analysisData - Kart analysis data
 * @returns {Object} Confidence assessment
 */
export function calculateConfidence(kartId, analysisData) {
    const normalized = calculateNormalizedIndex(kartId, analysisData);
    const stats = getKartStats(kartId, analysisData);
    
    if (!normalized || !stats) {
        return { level: 'Low', score: 0 };
    }
    
    let score = 0;
    
    // Lap count factor (0-30 points)
    if (normalized.lapCount >= 50) score += 30;
    else if (normalized.lapCount >= 20) score += 20;
    else if (normalized.lapCount >= 10) score += 10;
    else score += 5;
    
    // Driver diversity factor (0-30 points)
    if (normalized.driverCount >= 5) score += 30;
    else if (normalized.driverCount >= 3) score += 20;
    else if (normalized.driverCount >= 2) score += 10;
    else score += 5;
    
    // Cross-kart driver factor (0-20 points)
    if (normalized.crossKartDriverCount >= 3) score += 20;
    else if (normalized.crossKartDriverCount >= 2) score += 15;
    else if (normalized.crossKartDriverCount >= 1) score += 10;
    
    // Consistency factor (0-20 points)
    if (stats.consistency >= 95) score += 20;
    else if (stats.consistency >= 90) score += 15;
    else if (stats.consistency >= 85) score += 10;
    else score += 5;
    
    // Determine level
    let level;
    if (score >= 70) level = 'High';
    else if (score >= 40) level = 'Medium';
    else level = 'Low';
    
    return { level, score };
}

/**
 * Analyze all karts and return sorted rankings
 * @param {Object} analysisData - Kart analysis data
 * @returns {Array} Array of kart analysis objects sorted by performance
 */
export function analyzeAllKarts(analysisData) {
    const karts = analysisData.karts || {};
    const kartIds = Object.keys(karts);
    
    console.log('🔬 Analysis Service Debug:', {
        totalKarts: kartIds.length,
        kartIds: kartIds,
        totalLaps: (analysisData.laps || []).length
    });
    
    // Calculate analysis for all karts
    const kartAnalysis = kartIds.map(kartId => {
        const kart = karts[kartId];
        const normalized = calculateNormalizedIndex(kartId, analysisData);
        const percentile = calculatePercentileRanking(kartId, analysisData);
        const stats = getKartStats(kartId, analysisData);
        const confidence = calculateConfidence(kartId, analysisData);
        
        if (!normalized) {
            console.warn(`⚠️ Kart ID ${kartId}: normalized index is null`);
        }
        
        return {
            kartId: kartId,
            kartNumber: kart.kartNumber || kartId,  // Display number for UI
            kartName: kart.kartName || kart.kartNumber || kartId,
            normalized,
            percentile,
            stats,
            confidence
        };
    }).filter(k => k.normalized !== null);
    
    console.log(`✅ Analysis complete: ${kartAnalysis.length} karts with valid data`);
    
    // Sort by: best average lap → best lap → number of laps → confidence
    kartAnalysis.sort((a, b) => {
        // Primary: Best average lap (lower is better)
        const avgDiff = a.stats.avgLapTime - b.stats.avgLapTime;
        if (Math.abs(avgDiff) > 10) return avgDiff; // 10ms threshold
        
        // Secondary: Best lap time (lower is better)
        const bestDiff = a.stats.bestLapTime - b.stats.bestLapTime;
        if (Math.abs(bestDiff) > 10) return bestDiff; // 10ms threshold
        
        // Tertiary: Number of laps (more is better)
        const lapsDiff = b.stats.totalLaps - a.stats.totalLaps;
        if (lapsDiff !== 0) return lapsDiff;
        
        // Quaternary: Confidence score (higher is better)
        return b.confidence.score - a.confidence.score;
    });
    
    return kartAnalysis;
}

/**
 * Get summary statistics for all analysis data
 * @param {Object} analysisData - Kart analysis data
 * @returns {Object} Summary statistics
 */
export function getSummaryStats(analysisData) {
    return {
        totalLaps: analysisData.laps.length,
        totalKarts: Object.keys(analysisData.karts).length,
        totalDrivers: Object.keys(analysisData.drivers).length,
        totalSessions: Object.keys(analysisData.sessions).length,
        crossKartDrivers: findCrossKartDrivers(analysisData).crossKartDrivers
    };
}

