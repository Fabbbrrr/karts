/**
 * Kart Performance Analysis Service
 * 
 * Advanced kart performance tracking across:
 * - Multiple tracks
 * - Multiple drivers
 * - Multiple sessions
 * 
 * Uses racing industry best practices:
 * - Normalized performance index (accounts for driver skill)
 * - Track-specific performance baselines
 * - Statistical confidence levels
 * - Outlier detection
 * - Cross-driver comparison
 */

/**
 * Detect track from kart name
 */
function getTrackFromKart(kartName) {
    const firstChar = String(kartName).charAt(0).toUpperCase();
    if (firstChar === 'M') return 'Mushroom';
    if (firstChar === 'P') return 'Penrite';
    if (firstChar === 'E') return 'Rimo';
    return 'Lakeside';
}

/**
 * Main analysis function - analyzes all karts across all tracks
 * @param {Object} kartAnalysisData - Raw kart analysis data
 * @returns {Object} Comprehensive kart performance report
 */
export function analyzeKartPerformance(kartAnalysisData) {
    console.log('🔬 Starting comprehensive kart performance analysis...');
    
    if (!kartAnalysisData || Object.keys(kartAnalysisData).length === 0) {
        return {
            kartPerformance: [],
            trackBaselines: {},
            underperformers: [],
            topPerformers: [],
            analysisDate: new Date().toISOString()
        };
    }
    
    // Step 1: Group laps by track
    const lapsByTrack = groupLapsByTrack(kartAnalysisData);
    
    // Step 2: Calculate track baselines (expected performance per track)
    const trackBaselines = calculateTrackBaselines(lapsByTrack);
    
    // Step 3: Analyze each kart's performance
    const kartPerformance = analyzeKartsAcrossTracks(kartAnalysisData, trackBaselines);
    
    // Step 4: Identify underperformers and top performers
    const { underperformers, topPerformers } = identifyOutliers(kartPerformance);
    
    // Step 5: Generate cross-driver comparison for same karts
    const crossDriverComparison = analyzeCrossDriverPerformance(kartAnalysisData);
    
    console.log(`✅ Analysis complete: ${kartPerformance.length} karts analyzed`);
    
    return {
        kartPerformance,
        trackBaselines,
        underperformers,
        topPerformers,
        crossDriverComparison,
        analysisDate: new Date().toISOString(),
        summary: {
            totalKarts: kartPerformance.length,
            totalLaps: Object.values(kartAnalysisData).reduce((sum, k) => {
                return sum + (k && k.laps && Array.isArray(k.laps) ? k.laps.length : 0);
            }, 0),
            tracksAnalyzed: Object.keys(trackBaselines).length,
            underperformingKarts: underperformers.length,
            topPerformingKarts: topPerformers.length
        }
    };
}

/**
 * Group all laps by track
 */
function groupLapsByTrack(kartAnalysisData) {
    const lapsByTrack = {};
    
    for (const [kartId, kartData] of Object.entries(kartAnalysisData)) {
        // Validate kartData and laps exist
        if (!kartData || !kartData.laps || !Array.isArray(kartData.laps)) {
            console.warn(`⚠️ Skipping kart ${kartId}: no valid laps data`);
            continue;
        }
        
        const track = kartData.trackName || getTrackFromKart(kartData.kartNumber || kartId);
        
        if (!lapsByTrack[track]) {
            lapsByTrack[track] = [];
        }
        
        // Add all valid laps to this track
        kartData.laps.forEach(lap => {
            if (lap && lap.timeRaw && lap.timeRaw > 0) {
                lapsByTrack[track].push({
                    kartId,
                    kartNumber: kartData.kartNumber,
                    timeRaw: lap.timeRaw,
                    driver: kartData.driverName,
                    timestamp: lap.timestamp
                });
            }
        });
    }
    
    return lapsByTrack;
}

/**
 * Calculate baseline performance expectations for each track
 * Uses percentile-based approach (resistant to outliers)
 */
function calculateTrackBaselines(lapsByTrack) {
    const baselines = {};
    
    for (const [track, laps] of Object.entries(lapsByTrack)) {
        if (laps.length < 10) {
            console.warn(`⚠️ Track ${track} has only ${laps.length} laps, skipping baseline`);
            continue;
        }
        
        const times = laps.map(l => l.timeRaw).sort((a, b) => a - b);
        
        baselines[track] = {
            track,
            totalLaps: laps.length,
            uniqueKarts: new Set(laps.map(l => l.kartId)).size,
            
            // Key performance metrics
            fastest: times[0],
            p10: percentile(times, 10),    // Top 10%
            p25: percentile(times, 25),    // Top quartile
            median: percentile(times, 50),  // Median (50th percentile)
            p75: percentile(times, 75),     // Bottom quartile
            p90: percentile(times, 90),     // Bottom 10%
            slowest: times[times.length - 1],
            
            // Statistical measures
            mean: times.reduce((a, b) => a + b, 0) / times.length,
            stdDev: calculateStdDev(times)
        };
    }
    
    return baselines;
}

/**
 * Analyze each kart's performance across all tracks it has run on
 */
function analyzeKartsAcrossTracks(kartAnalysisData, trackBaselines) {
    const kartPerformance = [];
    
    for (const [kartId, kartData] of Object.entries(kartAnalysisData)) {
        // Validate kartData and laps exist
        if (!kartData || !kartData.laps || !Array.isArray(kartData.laps)) {
            console.warn(`⚠️ Skipping kart ${kartId}: no valid laps data`);
            continue;
        }
        
        if (kartData.laps.length < 3) continue; // Need minimum laps for meaningful analysis
        
        const track = kartData.trackName || getTrackFromKart(kartData.kartNumber || kartId);
        const baseline = trackBaselines[track];
        
        if (!baseline) continue; // No baseline available for this track
        
        const validLaps = kartData.laps.filter(l => l && l.timeRaw && l.timeRaw > 0);
        if (validLaps.length === 0) continue; // No valid laps
        
        const lapTimes = validLaps.map(l => l.timeRaw).sort((a, b) => a - b);
        
        // Calculate kart statistics
        const kartBest = lapTimes[0];
        const kartMedian = percentile(lapTimes, 50);
        const kartMean = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
        const kartStdDev = calculateStdDev(lapTimes);
        const consistency = (kartStdDev / kartMean) * 100; // Coefficient of variation
        
        // Performance index (how does this kart compare to track baseline?)
        // < 1.0 = faster than median (good)
        // > 1.0 = slower than median (bad)
        const performanceIndex = kartMedian / baseline.median;
        
        // Percentile ranking (where does this kart's median fall in track distribution?)
        const percentileRank = calculatePercentileRank(kartMedian, baseline);
        
        // Consistency rating
        const consistencyRating = calculateConsistencyRating(consistency);
        
        // Overall rating (combines speed and consistency)
        const overallRating = calculateOverallRating(performanceIndex, consistencyRating, validLaps.length);
        
        // Confidence level (based on sample size)
        const confidence = calculateConfidenceLevel(validLaps.length);
        
        kartPerformance.push({
            kartId,
            kartNumber: kartData.kartNumber,
            track,
            
            // Session info
            drivers: kartData.drivers || [kartData.driverName],
            sessionsRun: kartData.sessions || 1,
            totalLaps: validLaps.length,
            
            // Performance metrics
            bestLap: kartBest,
            medianLap: kartMedian,
            meanLap: kartMean,
            worstLap: lapTimes[lapTimes.length - 1],
            
            // Statistical measures
            stdDev: kartStdDev,
            consistency: consistency,
            consistencyRating,
            
            // Comparative metrics
            performanceIndex,
            percentileRank,
            overallRating,
            confidence,
            
            // Comparison to baseline
            comparison: {
                vsMedian: kartMedian - baseline.median,
                vsMean: kartMean - baseline.mean,
                vsFastest: kartBest - baseline.fastest,
                vsP25: kartMedian - baseline.p25,
                vsP75: kartMedian - baseline.p75
            },
            
            // Flag issues
            flags: identifyKartIssues(kartMedian, baseline, consistency, validLaps.length)
        });
    }
    
    // Sort by performance index (best first)
    kartPerformance.sort((a, b) => a.performanceIndex - b.performanceIndex);
    
    return kartPerformance;
}

/**
 * Calculate percentile rank for a given time
 */
function calculatePercentileRank(time, baseline) {
    // Where does this time fall in the distribution?
    if (time <= baseline.p10) return 10;
    if (time <= baseline.p25) return 25;
    if (time <= baseline.median) return 50;
    if (time <= baseline.p75) return 75;
    if (time <= baseline.p90) return 90;
    return 95;
}

/**
 * Calculate consistency rating
 * Racing industry standard: Lower CV = better consistency
 */
function calculateConsistencyRating(consistency) {
    if (consistency < 2) return 'Excellent';
    if (consistency < 4) return 'Good';
    if (consistency < 6) return 'Average';
    if (consistency < 10) return 'Poor';
    return 'Very Poor';
}

/**
 * Calculate overall rating (A+ to F scale)
 */
function calculateOverallRating(performanceIndex, consistencyRating, lapCount) {
    let score = 0;
    
    // Performance component (0-60 points)
    if (performanceIndex < 0.97) score += 60;      // Exceptional
    else if (performanceIndex < 0.99) score += 50;  // Excellent
    else if (performanceIndex < 1.01) score += 40;  // Good
    else if (performanceIndex < 1.03) score += 30;  // Average
    else if (performanceIndex < 1.05) score += 20;  // Below Average
    else score += 10;                                // Poor
    
    // Consistency component (0-30 points)
    switch(consistencyRating) {
        case 'Excellent': score += 30; break;
        case 'Good': score += 25; break;
        case 'Average': score += 20; break;
        case 'Poor': score += 10; break;
        default: score += 5;
    }
    
    // Sample size confidence (0-10 points)
    if (lapCount >= 20) score += 10;
    else if (lapCount >= 10) score += 7;
    else if (lapCount >= 5) score += 5;
    else score += 2;
    
    // Convert to letter grade
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    if (score >= 45) return 'D+';
    if (score >= 40) return 'D';
    return 'F';
}

/**
 * Calculate confidence level based on sample size
 */
function calculateConfidenceLevel(lapCount) {
    if (lapCount >= 30) return 'Very High';
    if (lapCount >= 20) return 'High';
    if (lapCount >= 10) return 'Medium';
    if (lapCount >= 5) return 'Low';
    return 'Very Low';
}

/**
 * Identify specific issues with a kart
 */
function identifyKartIssues(kartMedian, baseline, consistency, lapCount) {
    const flags = [];
    
    // Performance flags
    if (kartMedian > baseline.p90) {
        flags.push({
            severity: 'critical',
            issue: 'Severely Underperforming',
            description: 'Median lap time is slower than 90% of all karts on this track'
        });
    } else if (kartMedian > baseline.p75) {
        flags.push({
            severity: 'warning',
            issue: 'Underperforming',
            description: 'Median lap time is in bottom 25% for this track'
        });
    }
    
    // Consistency flags
    if (consistency > 10) {
        flags.push({
            severity: 'critical',
            issue: 'Very Inconsistent',
            description: 'Lap times vary significantly - possible mechanical issues'
        });
    } else if (consistency > 6) {
        flags.push({
            severity: 'warning',
            issue: 'Inconsistent Performance',
            description: 'Higher than normal lap time variation'
        });
    }
    
    // Sample size flags
    if (lapCount < 5) {
        flags.push({
            severity: 'info',
            issue: 'Low Sample Size',
            description: 'Not enough laps for confident analysis'
        });
    }
    
    return flags;
}

/**
 * Identify outlier karts (underperformers and top performers)
 */
function identifyOutliers(kartPerformance) {
    const underperformers = kartPerformance
        .filter(k => k.performanceIndex > 1.03 && k.confidence !== 'Very Low')
        .sort((a, b) => b.performanceIndex - a.performanceIndex)
        .slice(0, 10); // Top 10 worst
    
    const topPerformers = kartPerformance
        .filter(k => k.performanceIndex < 0.97 && k.confidence !== 'Very Low')
        .sort((a, b) => a.performanceIndex - b.performanceIndex)
        .slice(0, 10); // Top 10 best
    
    return { underperformers, topPerformers };
}

/**
 * Analyze same kart with different drivers (isolate kart vs driver performance)
 */
function analyzeCrossDriverPerformance(kartAnalysisData) {
    const kartsByNumber = {};
    
    // Group by kart number (same physical kart, different sessions/drivers)
    for (const [kartId, kartData] of Object.entries(kartAnalysisData)) {
        // Validate kartData
        if (!kartData || !kartData.kartNumber) continue;
        if (!kartData.laps || !Array.isArray(kartData.laps) || kartData.laps.length === 0) continue;
        
        const kartNumber = kartData.kartNumber;
        
        if (!kartsByNumber[kartNumber]) {
            kartsByNumber[kartNumber] = [];
        }
        
        const validLaps = kartData.laps.filter(l => l && l.timeRaw && l.timeRaw > 0);
        if (validLaps.length === 0) continue;
        
        const lapTimes = validLaps.map(l => l.timeRaw).sort((a, b) => a - b);
        
        kartsByNumber[kartNumber].push({
            kartId,
            driver: kartData.driverName,
            track: kartData.trackName || getTrackFromKart(kartNumber),
            laps: validLaps,
            medianTime: percentile(lapTimes, 50)
        });
    }
    
    // Analyze karts that have been driven by multiple drivers
    const crossDriverAnalysis = [];
    
    for (const [kartNumber, sessions] of Object.entries(kartsByNumber)) {
        if (sessions.length < 2) continue; // Need multiple sessions for comparison
        
        // Filter to same track only (fair comparison)
        const sessionsByTrack = {};
        sessions.forEach(s => {
            if (!sessionsByTrack[s.track]) sessionsByTrack[s.track] = [];
            sessionsByTrack[s.track].push(s);
        });
        
        for (const [track, trackSessions] of Object.entries(sessionsByTrack)) {
            if (trackSessions.length < 2) continue;
            
            const medianTimes = trackSessions.map(s => s.medianTime).filter(t => t !== null);
            if (medianTimes.length < 2) continue;
            
            const fastestSession = trackSessions.reduce((best, curr) => 
                curr.medianTime < best.medianTime ? curr : best
            );
            
            const slowestSession = trackSessions.reduce((worst, curr) => 
                curr.medianTime > worst.medianTime ? curr : worst
            );
            
            const timeVariation = slowestSession.medianTime - fastestSession.medianTime;
            const percentVariation = (timeVariation / fastestSession.medianTime) * 100;
            
            crossDriverAnalysis.push({
                kartNumber,
                track,
                sessions: trackSessions.length,
                drivers: trackSessions.map(s => s.driver),
                fastestDriver: fastestSession.driver,
                fastestTime: fastestSession.medianTime,
                slowestDriver: slowestSession.driver,
                slowestTime: slowestSession.medianTime,
                timeVariation,
                percentVariation,
                
                // Assessment
                assessment: percentVariation < 2 ? 'Consistent Kart' :
                           percentVariation < 5 ? 'Normal Variation' :
                           'High Variation - Check Kart'
            });
        }
    }
    
    return crossDriverAnalysis.sort((a, b) => b.percentVariation - a.percentVariation);
}

// Utility functions

function percentile(sorted, p) {
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function calculateStdDev(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
}

/**
 * Format analysis report for display
 */
export function formatAnalysisReport(analysis) {
    const { kartPerformance, underperformers, topPerformers, crossDriverComparison, summary } = analysis;
    
    let report = `
🔬 KART PERFORMANCE ANALYSIS REPORT
═══════════════════════════════════════════════════════════════

📊 SUMMARY
────────────────────────────────────────────────────────────────
Total Karts Analyzed: ${summary.totalKarts}
Total Laps Collected: ${summary.totalLaps}
Tracks Analyzed: ${summary.tracksAnalyzed}
Underperforming Karts: ${summary.underperformingKarts}
Top Performing Karts: ${summary.topPerformingKarts}

`;
    
    if (underperformers.length > 0) {
        report += `
🚨 UNDERPERFORMING KARTS (Require Attention)
────────────────────────────────────────────────────────────────
`;
        underperformers.forEach((kart, i) => {
            report += `
${i + 1}. Kart ${kart.kartNumber} (${kart.track})
   Rating: ${kart.overallRating} | Performance Index: ${kart.performanceIndex.toFixed(3)}
   ${kart.flags.map(f => `${f.severity === 'critical' ? '🔴' : '⚠️'} ${f.issue}`).join('\n   ')}
   Consistency: ${kart.consistencyRating} (${kart.consistency.toFixed(1)}%)
   Laps: ${kart.totalLaps} | Confidence: ${kart.confidence}
`;
        });
    }
    
    if (topPerformers.length > 0) {
        report += `
🏆 TOP PERFORMING KARTS
────────────────────────────────────────────────────────────────
`;
        topPerformers.forEach((kart, i) => {
            report += `
${i + 1}. Kart ${kart.kartNumber} (${kart.track})
   Rating: ${kart.overallRating} | Performance Index: ${kart.performanceIndex.toFixed(3)}
   Consistency: ${kart.consistencyRating} (${kart.consistency.toFixed(1)}%)
   Best Lap: ${(kart.bestLap / 1000).toFixed(3)}s | Median: ${(kart.medianLap / 1000).toFixed(3)}s
`;
        });
    }
    
    if (crossDriverComparison.length > 0) {
        report += `
🔄 CROSS-DRIVER ANALYSIS (Same Kart, Different Drivers)
────────────────────────────────────────────────────────────────
`;
        crossDriverComparison.slice(0, 5).forEach(comp => {
            report += `
Kart ${comp.kartNumber} (${comp.track}) - ${comp.assessment}
   ${comp.sessions} sessions by ${comp.drivers.length} drivers
   Variation: ${comp.percentVariation.toFixed(1)}% (${(comp.timeVariation / 1000).toFixed(3)}s)
   Fastest: ${comp.fastestDriver} (${(comp.fastestTime / 1000).toFixed(3)}s)
   Slowest: ${comp.slowestDriver} (${(comp.slowestTime / 1000).toFixed(3)}s)
`;
        });
    }
    
    report += `
════════════════════════════════════════════════════════════════
Analysis Date: ${new Date(analysis.analysisDate).toLocaleString()}
`;
    
    return report;
}

