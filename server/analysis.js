// Kart Analysis Logic (Server-side port from client code)
import { config } from './config.js';
import logger from './logger.js';

const LAP_TIME_THRESHOLD = config.thresholds.lapTimeThreshold;
const MIN_LAPS = config.thresholds.minLapsForAnalysis;

/**
 * Format time in milliseconds to MM:SS.mmm
 */
function formatTime(ms) {
  if (!ms || ms <= 0) return '--.-';
  
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(3);
  
  if (minutes > 0) {
    return `${minutes}:${seconds.padStart(6, '0')}`;
  }
  return `${seconds}`;
}

/**
 * Calculate standard deviation of lap times
 */
function calculateStdDev(times) {
  if (times.length < 2) return 0;
  
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const squaredDiffs = times.map(time => Math.pow(time - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / times.length;
  
  return Math.sqrt(variance);
}

/**
 * Calculate consistency (standard deviation in seconds)
 */
export function calculateConsistency(lapTimes) {
  if (!lapTimes || lapTimes.length < MIN_LAPS) return null;
  
  const times = lapTimes
    .filter(lap => lap.lapTimeRaw && lap.lapTimeRaw <= LAP_TIME_THRESHOLD)
    .map(lap => lap.lapTimeRaw);
  
  if (times.length < MIN_LAPS) return null;
  
  const stdDev = calculateStdDev(times);
  return stdDev / 1000; // Convert to seconds
}

/**
 * Calculate average lap time
 */
export function calculateAverageLapTime(lapTimes) {
  if (!lapTimes || lapTimes.length === 0) return null;
  
  const validLaps = lapTimes.filter(lap =>
    lap.lapTimeRaw && lap.lapTimeRaw <= LAP_TIME_THRESHOLD
  );
  
  if (validLaps.length === 0) return null;
  
  const sum = validLaps.reduce((total, lap) => total + lap.lapTimeRaw, 0);
  return sum / validLaps.length;
}

/**
 * Analyze a single kart's performance
 */
export function analyzeKart(run, lapHistory) {
  if (!run.kart_number) return null;
  
  const kartNumber = run.kart_number;
  const laps = lapHistory[kartNumber] || [];
  
  // Get valid lap times
  const validLaps = laps.filter(lap => lap.timeRaw && lap.timeRaw <= LAP_TIME_THRESHOLD);
  
  if (validLaps.length < MIN_LAPS) {
    logger.debug(`Not enough laps for kart ${kartNumber}: ${validLaps.length}`);
    return null;
  }
  
  // Calculate metrics
  const lapTimes = validLaps.map(l => ({ lapTimeRaw: l.timeRaw }));
  const avgLapTime = calculateAverageLapTime(lapTimes);
  const consistency = calculateConsistency(lapTimes);
  const bestLap = Math.min(...validLaps.map(l => l.timeRaw));
  
  // Calculate best 3 average
  const sortedTimes = validLaps.map(l => l.timeRaw).sort((a, b) => a - b);
  const best3Avg = sortedTimes.length >= 3
    ? sortedTimes.slice(0, 3).reduce((a, b) => a + b, 0) / 3
    : avgLapTime;
  
  // Calculate total time
  const totalTime = validLaps.reduce((sum, lap) => sum + lap.timeRaw, 0);
  
  return {
    kartNumber,
    kartId: run.kart_id,
    driverName: run.name,
    totalLaps: run.total_laps,
    validLaps: validLaps.length,
    bestLap: bestLap,
    bestLapFormatted: formatTime(bestLap),
    avgLapTime: avgLapTime,
    avgLapTimeFormatted: formatTime(avgLapTime),
    best3Avg: best3Avg,
    best3AvgFormatted: formatTime(best3Avg),
    consistency: consistency,
    consistencyFormatted: consistency ? `${consistency.toFixed(3)}s` : '--',
    totalTime: totalTime,
    totalTimeFormatted: formatTime(totalTime),
    lapHistory: validLaps.map(lap => ({
      lapNum: lap.lapNum,
      time: lap.timeRaw,
      timeFormatted: formatTime(lap.timeRaw),
      position: lap.position
    })),
    lastUpdate: new Date().toISOString()
  };
}

/**
 * Analyze all karts in current session
 */
export function analyzeAllKarts(sessionData, lapHistory) {
  if (!sessionData || !sessionData.runs) {
    logger.warn('No session data available for analysis');
    return [];
  }
  
  const analyses = [];
  
  for (const run of sessionData.runs) {
    try {
      const analysis = analyzeKart(run, lapHistory);
      if (analysis) {
        analyses.push(analysis);
      }
    } catch (error) {
      logger.error(`Error analyzing kart ${run.kart_number}:`, error);
    }
  }
  
  logger.info(`Analyzed ${analyses.length} karts`);
  return analyses;
}

/**
 * Calculate normalized performance index (0-100)
 */
export function calculateNormalizedIndex(kartAnalysis, allAnalyses) {
  if (!allAnalyses || allAnalyses.length === 0) return 0;
  
  const bestLapTimes = allAnalyses.map(a => a.bestLap).filter(t => t > 0);
  const consistencies = allAnalyses.map(a => a.consistency).filter(c => c !== null);
  
  if (bestLapTimes.length === 0) return 0;
  
  const fastestLap = Math.min(...bestLapTimes);
  const slowestLap = Math.max(...bestLapTimes);
  const bestConsistency = Math.min(...consistencies);
  const worstConsistency = Math.max(...consistencies);
  
  // Normalize lap time (lower is better)
  const lapTimeScore = slowestLap > fastestLap
    ? 100 - ((kartAnalysis.bestLap - fastestLap) / (slowestLap - fastestLap)) * 100
    : 100;
  
  // Normalize consistency (lower is better)
  const consistencyScore = kartAnalysis.consistency !== null && worstConsistency > bestConsistency
    ? 100 - ((kartAnalysis.consistency - bestConsistency) / (worstConsistency - bestConsistency)) * 100
    : 50;
  
  // Weighted average (70% lap time, 30% consistency)
  const normalizedIndex = (lapTimeScore * 0.7) + (consistencyScore * 0.3);
  
  return Math.round(normalizedIndex);
}

/**
 * Get comprehensive kart statistics
 */
export function getKartStats(kartAnalysis) {
  if (!kartAnalysis) return null;
  
  return {
    kartNumber: kartAnalysis.kartNumber,
    driverName: kartAnalysis.driverName,
    totalLaps: kartAnalysis.totalLaps,
    validLaps: kartAnalysis.validLaps,
    bestLap: kartAnalysis.bestLapFormatted,
    avgLap: kartAnalysis.avgLapTimeFormatted,
    best3Avg: kartAnalysis.best3AvgFormatted,
    consistency: kartAnalysis.consistencyFormatted,
    totalTime: kartAnalysis.totalTimeFormatted,
    lastUpdate: kartAnalysis.lastUpdate
  };
}

/**
 * Find drivers who drove multiple karts
 */
export function findCrossKartDrivers(allAnalyses) {
  const driverKarts = {};
  
  for (const analysis of allAnalyses) {
    const driverName = analysis.driverName;
    if (!driverName) continue;
    
    if (!driverKarts[driverName]) {
      driverKarts[driverName] = [];
    }
    
    driverKarts[driverName].push({
      kartNumber: analysis.kartNumber,
      bestLap: analysis.bestLap,
      avgLap: analysis.avgLapTime,
      laps: analysis.validLaps
    });
  }
  
  // Filter to drivers with multiple karts
  const crossKartDrivers = Object.entries(driverKarts)
    .filter(([_, karts]) => karts.length > 1)
    .map(([driverName, karts]) => ({
      driverName,
      karts: karts.sort((a, b) => a.bestLap - b.bestLap)
    }));
  
  return crossKartDrivers;
}

/**
 * Process raw session data into analysis format
 */
export function processSessionData(sessionData, lapHistory) {
  try {
    logger.info('Processing session data for analysis');
    
    // Analyze all karts
    const kartAnalyses = analyzeAllKarts(sessionData, lapHistory);
    
    // Calculate normalized indices
    const analysesWithIndex = kartAnalyses.map(analysis => ({
      ...analysis,
      normalizedIndex: calculateNormalizedIndex(analysis, kartAnalyses)
    }));
    
    // Sort by performance (best lap)
    analysesWithIndex.sort((a, b) => a.bestLap - b.bestLap);
    
    // Find cross-kart drivers
    const crossKartDrivers = findCrossKartDrivers(analysesWithIndex);
    
    // Calculate session summary
    const summary = {
      timestamp: new Date().toISOString(),
      sessionId: sessionData.timestamp || Date.now(),
      eventName: sessionData.event_name || 'Unknown Event',
      trackConfig: sessionData.track_configuration_id || null,
      totalKarts: analysesWithIndex.length,
      totalLaps: analysesWithIndex.reduce((sum, a) => sum + a.totalLaps, 0),
      fastestLap: analysesWithIndex.length > 0
        ? analysesWithIndex[0].bestLapFormatted
        : '--',
      fastestDriver: analysesWithIndex.length > 0
        ? analysesWithIndex[0].driverName
        : 'N/A',
      crossKartDrivers: crossKartDrivers.length
    };
    
    logger.info(`Analysis complete: ${summary.totalKarts} karts, ${summary.totalLaps} laps`);
    
    return {
      summary,
      karts: analysesWithIndex,
      crossKartDrivers
    };
  } catch (error) {
    logger.error('Error processing session data:', error);
    throw error;
  }
}
