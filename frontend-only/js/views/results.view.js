/**
 * Karting Live Timer - Results View (Complete Redesign)
 * 
 * Modern, feature-rich results screen with:
 * - Multiple scoring methods
 * - Dynamic podium with animations
 * - Full results table with search & sort
 * - Session insights & achievements
 * - Award badges system
 * - Live calculation
 * - Export functionality
 */

import { formatTime, normalizeTime } from '../utils/time-formatter.js';
import { calculateConsistency, calculateAverageLapTime } from '../utils/calculations.js';
import { filterStaleDrivers, TIMESTAMP_THRESHOLDS } from '../utils/timestamp-filter.js';
import * as SessionHistoryService from '../services/session-history.service.js';
import { detectAllIncidents, findMostIncidents } from '../utils/incident-detector.js';

const LAP_TIME_THRESHOLD = 60000; // 60 seconds

let currentMethod = 'fastest-lap';
let currentResults = [];
let searchQuery = '';
let cachedSessionData = null;
let cachedState = null;
let currentTrack = 'all'; // Track filter

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
 * Main update function - orchestrates entire results view
 */
export function updateResultsView(elements, sessionData, state, method = null) {
    console.log('🏁 Results View Update:', { 
        hasData: !!sessionData, 
        runs: sessionData?.runs?.length,
        method: method || currentMethod,
        track: currentTrack
    });
    
    // Store data for recalculation
    cachedSessionData = sessionData;
    cachedState = state;
    
    // Update method if provided
    if (method) {
        currentMethod = method;
        // Update active button state
        updateMethodButtonState(method);
    }
    
    // Populate session selector and track filter
    populateSessionSelector('results');
    updateTrackFilter(elements, sessionData);
    
    // Check for data
    if (!sessionData || !sessionData.runs || sessionData.runs.length === 0) {
        showNoData(true);
        return;
    }
    
    showNoData(false);
    
    // Filter runs by track if not "all"
    let filteredRuns = sessionData.runs;
    if (currentTrack !== 'all') {
        filteredRuns = sessionData.runs.filter(run => {
            const kartName = run.kart || run.kart_number || '';
            return getTrackFromKart(kartName) === currentTrack;
        });
        console.log(`🏁 Filtered to ${currentTrack}: ${filteredRuns.length} karts`);
    }
    
    // Update session overview stats
    updateSessionOverview({ ...sessionData, runs: filteredRuns }, state);
    
    // Enrich runs with lap history data
    const enrichedRuns = enrichRunsWithLapHistory(filteredRuns, state);
    
    // Calculate results based on current method
    const results = calculateResults(enrichedRuns, currentMethod);
    currentResults = results;
    
    // Update all sections
    updateMethodDescription(currentMethod);
    updatePodium(results);
    updateResultsTable(results, searchQuery);
    updateInsights({ ...sessionData, runs: filteredRuns }, results, state);
    
    console.log('✅ Results view updated successfully with method:', currentMethod, 'track:', currentTrack);
}

/**
 * Enrich runs with lap history data from state
 */
function enrichRunsWithLapHistory(runs, state) {
    if (!runs) return runs;
    
    // Use session-specific lap history if in history mode, otherwise use global state
    let lapHistory = {};
    
    if (state.isHistoryMode && state.currentHistorySession?.lapHistory) {
        // Historical session: use session's own lap history
        lapHistory = state.currentHistorySession.lapHistory;
        console.log('📜 Using historical lap history:', Object.keys(lapHistory).length, 'karts');
    } else if (state.lapHistory) {
        // Live mode: use global state lap history
        lapHistory = state.lapHistory;
    } else {
        // No lap history available
        return runs.map(run => ({
            ...run,
            lap_times: [] // Empty array for methods that need it
        }));
    }
    
    return runs.map(run => {
        const kartNumber = run.kart_number;
        const enrichedRun = { ...run };
        
        // Get lap times for this kart from lap history
        if (lapHistory[kartNumber] && lapHistory[kartNumber].length > 0) {
            enrichedRun.lap_times = lapHistory[kartNumber].map(lap => ({
                lapNum: lap.lapNum,
                lapTime: lap.time,
                lapTimeRaw: lap.timeRaw,
                delta: lap.delta,
                position: lap.position
            }));
        } else {
            // Empty array if no lap history for this kart
            enrichedRun.lap_times = [];
        }
        
        return enrichedRun;
    });
}

/**
 * Show/hide no data placeholder
 */
function showNoData(show) {
    const noData = document.getElementById('results-no-data');
    const content = document.getElementById('results-content');
    
    if (noData && content) {
        if (show) {
            noData.classList.remove('hidden');
            content.style.display = 'none';
        } else {
            noData.classList.add('hidden');
            content.style.display = 'block';
        }
    }
}

/**
 * Update session overview stats
 */
function updateSessionOverview(sessionData, state) {
    // Driver count
    const driversEl = document.getElementById('results-drivers-count');
    if (driversEl) {
        driversEl.textContent = sessionData.runs.length;
    }
    
    // Total laps
    const lapsEl = document.getElementById('results-laps-count');
    if (lapsEl) {
        const totalLaps = sessionData.runs.reduce((sum, run) => sum + (run.total_laps || 0), 0);
        lapsEl.textContent = totalLaps;
    }
    
    // Fastest lap
    const fastestEl = document.getElementById('results-fastest-time');
    if (fastestEl) {
        const validLaps = sessionData.runs
            .filter(r => r.best_time_raw && r.best_time_raw <= LAP_TIME_THRESHOLD)
            .map(r => r.best_time_raw);
        
        if (validLaps.length > 0) {
            const fastest = Math.min(...validLaps);
            fastestEl.textContent = formatTime(fastest);
        } else {
            fastestEl.textContent = '--.-';
        }
    }
    
    // Average lap - use API-provided averages or calculate from lap history
    const avgEl = document.getElementById('results-avg-time');
    if (avgEl) {
        // Collect all valid lap times from lap history
        const allLaps = [];
        const lapHistory = state?.lapHistory || {};
        
        sessionData.runs.forEach(run => {
            const kartNumber = run.kart_number;
            if (lapHistory[kartNumber] && lapHistory[kartNumber].length > 0) {
                const validLaps = lapHistory[kartNumber]
                    .filter(lap => lap.timeRaw && lap.timeRaw <= LAP_TIME_THRESHOLD)
                    .map(lap => lap.timeRaw);
                allLaps.push(...validLaps);
            }
        });
        
        if (allLaps.length > 0) {
            const avg = allLaps.reduce((a, b) => a + b, 0) / allLaps.length;
            avgEl.textContent = formatTime(avg);
        } else {
            // Fallback: use API-provided averages
            const validAvgs = sessionData.runs
                .filter(r => r.avg_lap_raw && r.avg_lap_raw <= LAP_TIME_THRESHOLD)
                .map(r => r.avg_lap_raw);
            
            if (validAvgs.length > 0) {
                const overallAvg = validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length;
                avgEl.textContent = formatTime(overallAvg);
            } else {
                avgEl.textContent = '--.-';
            }
        }
    }
    
    // Update subtitle
    const subtitle = document.getElementById('results-subtitle');
    if (subtitle && sessionData.event_name) {
        subtitle.textContent = sessionData.event_name;
    }
}

/**
 * Calculate results based on scoring method
 */
function calculateResults(runs, method) {
    // Filter stale drivers
    const activeRuns = filterStaleDrivers(runs, TIMESTAMP_THRESHOLDS.RESULTS_DISPLAY, false);
    
    console.log(`📊 Calculating results for method: ${method}, active runs: ${activeRuns.length}`);
    
    const results = activeRuns
        .filter(run => run.kart_number && run.total_laps > 0)
        .map(run => {
            let score = null;
            let scoreDisplay = '-';
            let rawScore = Infinity;
            
            // Get valid lap times from lap history
            const lapTimes = (run.lap_times || [])
                .filter(lap => lap && lap.lapTimeRaw && lap.lapTimeRaw <= LAP_TIME_THRESHOLD)
                .map(lap => lap.lapTimeRaw);
            
            console.log(`Kart ${run.kart_number}: lapHistory=${lapTimes.length} laps, best_time_raw=${run.best_time_raw}, avg_lap_raw=${run.avg_lap_raw}`);
            
            switch (method) {
                case 'fastest-lap':
                    // Use API-provided best_time_raw
                    if (run.best_time_raw && run.best_time_raw <= LAP_TIME_THRESHOLD) {
                        rawScore = run.best_time_raw;
                        scoreDisplay = normalizeTime(run.best_time) || formatTime(rawScore);
                        score = rawScore;
                    }
                    break;
                    
                case 'total-time':
                    // Calculate total time from lap history
                    if (lapTimes.length > 0) {
                        rawScore = lapTimes.reduce((sum, time) => sum + time, 0);
                        scoreDisplay = formatTime(rawScore);
                        score = rawScore;
                    } else if (run.avg_lap_raw && run.total_laps > 0) {
                        // Fallback: estimate from average lap time
                        rawScore = run.avg_lap_raw * run.total_laps;
                        scoreDisplay = formatTime(rawScore);
                        score = rawScore;
                    }
                    break;
                    
                case 'average-lap':
                    // Use API-provided avg_lap_raw (more accurate as it includes all laps)
                    if (run.avg_lap_raw && run.avg_lap_raw <= LAP_TIME_THRESHOLD) {
                        rawScore = run.avg_lap_raw;
                        scoreDisplay = normalizeTime(run.avg_lap) || formatTime(rawScore);
                        score = rawScore;
                    } else if (lapTimes.length > 0) {
                        // Fallback: calculate from lap history
                        rawScore = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
                        scoreDisplay = formatTime(rawScore);
                        score = rawScore;
                    }
                    break;
                    
                case 'best-3-avg':
                    // Calculate from lap history (needs individual lap times)
                    if (lapTimes.length >= 3) {
                        const best3 = [...lapTimes].sort((a, b) => a - b).slice(0, 3);
                        rawScore = best3.reduce((sum, time) => sum + time, 0) / 3;
                        scoreDisplay = formatTime(rawScore);
                        score = rawScore;
                    } else if (lapTimes.length > 0) {
                        // Less than 3 laps in history: use all available laps
                        rawScore = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
                        scoreDisplay = formatTime(rawScore);
                        score = rawScore;
                    } else if (run.best_time_raw && run.best_time_raw <= LAP_TIME_THRESHOLD) {
                        // Fallback: use best lap as approximation when no lap history
                        // (Best 3 would be close to best lap for consistent drivers)
                        rawScore = run.best_time_raw;
                        scoreDisplay = formatTime(rawScore);
                        score = rawScore;
                    }
                    break;
                    
                case 'consistency':
                    // Use API-provided consistency_lap_raw (standard deviation)
                    if (run.consistency_lap_raw !== undefined && run.consistency_lap_raw !== null) {
                        // Convert from milliseconds to seconds
                        rawScore = run.consistency_lap_raw / 1000;
                        scoreDisplay = `${rawScore.toFixed(3)}s`;
                        score = rawScore;
                    } else if (lapTimes.length >= 3) {
                        // Fallback: calculate from lap history
                        const consistency = calculateConsistency(lapTimes.map(time => ({ lapTimeRaw: time })));
                        if (consistency !== null) {
                            rawScore = consistency;
                            scoreDisplay = `${consistency.toFixed(3)}s`;
                            score = consistency;
                        }
                    }
                    break;
            }
            
            // Calculate awards/badges
            const awards = [];
            if (run.best_time_raw === Math.min(...activeRuns.filter(r => r.best_time_raw).map(r => r.best_time_raw))) {
                awards.push({ icon: '⚡', label: 'Fastest Lap' });
            }
            
            // Consistency badge based on API value
            if (run.consistency_lap_raw !== undefined && run.consistency_lap_raw !== null) {
                const consistencySec = run.consistency_lap_raw / 1000;
                if (consistencySec < 1.0) {
                    awards.push({ icon: '🎯', label: 'Consistent' });
                }
            } else if (lapTimes.length > 0) {
                const consistency = calculateConsistency(lapTimes.map(t => ({ lapTimeRaw: t })));
                if (consistency !== null && consistency < 1.0) {
                    awards.push({ icon: '🎯', label: 'Consistent' });
                }
            }
            
            return {
                ...run,
                score,
                scoreDisplay,
                rawScore,
                validLaps: lapTimes.length || run.total_laps,
                awards,
                bestLapDisplay: run.best_time || '-'
            };
        })
        .filter(result => {
            const isValid = result.score !== null && result.score !== Infinity;
            if (!isValid) {
                console.log(`❌ Kart ${result.kart_number} filtered out: score=${result.score}, rawScore=${result.rawScore}`);
            }
            return isValid;
        })
        .sort((a, b) => a.rawScore - b.rawScore);
    
    console.log(`✅ ${results.length} karts passed filter for ${method}`);
    
    // Assign positions and gaps
    results.forEach((result, index) => {
        result.position = index + 1;
        
        if (index === 0) {
            result.gap = '-';
            result.gapRaw = 0;
        } else {
            const gapValue = result.rawScore - results[0].rawScore;
            result.gapRaw = gapValue;
            
            if (method === 'consistency') {
                // Consistency is already in seconds
                result.gap = `+${gapValue.toFixed(3)}s`;
            } else {
                // Convert milliseconds to seconds
                const gapSeconds = gapValue / 1000;
                if (gapSeconds < 60) {
                    result.gap = `+${gapSeconds.toFixed(3)}s`;
                } else {
                    const minutes = Math.floor(gapSeconds / 60);
                    const seconds = (gapSeconds % 60).toFixed(3);
                    result.gap = `+${minutes}:${seconds.padStart(6, '0')}`;
                }
            }
        }
    });
    
    // Add special awards (second pass to identify winners)
    addSpecialAwards(results);
    
    return results;
}

/**
 * Add special award badges to results (Ice in Veins, Hot Start, etc.)
 * This is a second pass after results are calculated
 */
function addSpecialAwards(results) {
    if (results.length === 0) return;
    
    // Ice in Veins - smallest best/avg variance (most consistent)
    const iceWinner = results
        .filter(r => r.bestLapRaw && r.avgLapRaw && r.bestLapRaw > 0)
        .map(r => ({
            ...r,
            variance: r.avgLapRaw - r.bestLapRaw
        }))
        .sort((a, b) => a.variance - b.variance)[0];
    
    if (iceWinner) {
        const result = results.find(r => r.kart_number === iceWinner.kart_number);
        if (result) {
            result.awards.push({ icon: '🧊', label: 'Ice in Veins' });
        }
    }
    
    // Hot Start - fastest lap in laps 2-4
    let hotStartWinner = null;
    let hotStartTime = Infinity;
    
    results.forEach(r => {
        if (r.lap_times && r.lap_times.length >= 2) {
            const earlyLaps = r.lap_times
                .filter(lap => lap.lapNum >= 2 && lap.lapNum <= 5)
                .filter(lap => lap.lapTimeRaw && lap.lapTimeRaw <= LAP_TIME_THRESHOLD);
            
            if (earlyLaps.length > 0) {
                const bestEarly = Math.min(...earlyLaps.map(lap => lap.lapTimeRaw));
                if (bestEarly < hotStartTime) {
                    hotStartTime = bestEarly;
                    hotStartWinner = r;
                }
            }
        }
    });
    
    if (hotStartWinner) {
        const result = results.find(r => r.kart_number === hotStartWinner.kart_number);
        if (result) {
            result.awards.push({ icon: '🔥', label: 'Hot Start' });
        }
    }
    
    // Fastest Finisher - best lap in final 3 laps
    let fastestFinisher = null;
    let fastestFinishTime = Infinity;
    
    results.forEach(r => {
        if (r.lap_times && r.lap_times.length >= 3) {
            const finalLaps = r.lap_times
                .slice(-3)
                .filter(lap => lap.lapTimeRaw && lap.lapTimeRaw <= LAP_TIME_THRESHOLD);
            
            if (finalLaps.length > 0) {
                const bestFinal = Math.min(...finalLaps.map(lap => lap.lapTimeRaw));
                if (bestFinal < fastestFinishTime) {
                    fastestFinishTime = bestFinal;
                    fastestFinisher = r;
                }
            }
        }
    });
    
    if (fastestFinisher) {
        const result = results.find(r => r.kart_number === fastestFinisher.kart_number);
        if (result) {
            result.awards.push({ icon: '🏁', label: 'Fastest Finisher' });
        }
    }
    
    // Purple Lap King - most personal best improvements
    let purpleKing = null;
    let maxPurpleLaps = 0;
    
    results.forEach(r => {
        if (r.lap_times && r.lap_times.length > 0) {
            let purpleCount = 0;
            let personalBest = Infinity;
            
            r.lap_times.forEach(lap => {
                if (lap.lapTimeRaw && lap.lapTimeRaw <= LAP_TIME_THRESHOLD) {
                    if (lap.lapTimeRaw < personalBest) {
                        purpleCount++;
                        personalBest = lap.lapTimeRaw;
                    }
                }
            });
            
            if (purpleCount > maxPurpleLaps) {
                maxPurpleLaps = purpleCount;
                purpleKing = r;
            }
        }
    });
    
    if (purpleKing && maxPurpleLaps > 1) { // At least 2 improvements to earn award
        const result = results.find(r => r.kart_number === purpleKing.kart_number);
        if (result) {
            result.awards.push({ icon: '👑', label: 'Purple Lap King' });
        }
    }
}

/**
 * Update method description
 */
function updateMethodDescription(method) {
    const descriptions = {
        'fastest-lap': 'Winner determined by the single fastest lap time recorded.',
        'total-time': 'Winner has the lowest cumulative time (endurance format).',
        'average-lap': 'Winner has the best average lap time.',
        'best-3-avg': 'Winner has the best average of their 3 fastest laps.',
        'consistency': 'Winner has the most consistent lap times (lowest variance).'
    };
    
    const descEl = document.getElementById('results-method-description');
    if (descEl) {
        descEl.textContent = descriptions[method] || '';
    }
}

/**
 * Update podium display
 */
function updatePodium(results) {
    const positions = [1, 2, 3];
    
    positions.forEach(pos => {
        const result = results[pos - 1];
        const kartEl = document.getElementById(`podium-p${pos}-kart`);
        const nameEl = document.getElementById(`podium-p${pos}-name`);
        const timeEl = document.getElementById(`podium-p${pos}-time`);
        const gapEl = document.getElementById(`podium-p${pos}-gap`);
        
        if (result) {
            if (kartEl) kartEl.textContent = `#${result.kart_number}`;
            if (nameEl) nameEl.textContent = result.name || 'Unknown';
            if (timeEl) timeEl.textContent = result.scoreDisplay;
            if (gapEl) gapEl.textContent = result.gap;
        } else {
            if (kartEl) kartEl.textContent = '#-';
            if (nameEl) nameEl.textContent = '-';
            if (timeEl) timeEl.textContent = '--.-';
            if (gapEl && gapEl) gapEl.textContent = '-';
        }
    });
}

/**
 * Update results table
 */
function updateResultsTable(results, searchQuery) {
    const tbody = document.getElementById('results-table-body-modern');
    if (!tbody) return;
    
    // Filter by search
    let filteredResults = results;
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredResults = results.filter(r => 
            r.name.toLowerCase().includes(query) ||
            r.kart_number.toLowerCase().includes(query)
        );
    }
    
    tbody.innerHTML = filteredResults.map(result => {
        const podiumClass = result.position <= 3 ? `podium-${result.position}` : '';
        const awardsHtml = result.awards.map(a => 
            `<span class="award-badge" title="${a.label}">${a.icon}</span>`
        ).join('');
        
        return `
            <tr class="${podiumClass}">
                <td class="pos-cell">
                    ${result.position <= 3 ? ['🥇', '🥈', '🥉'][result.position - 1] : ''} 
                    ${result.position}
                </td>
                <td class="kart-cell">#${result.kart_number}</td>
                <td class="name-cell">${result.name || 'Unknown'}</td>
                <td class="score-cell">${result.scoreDisplay}</td>
                <td class="gap-cell">${result.gap}</td>
                <td class="best-cell">${result.bestLapDisplay}</td>
                <td class="laps-cell">${result.validLaps}</td>
                <td class="awards-cell">${awardsHtml || '-'}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Update session insights
 */
function updateInsights(sessionData, results, state) {
    // Fastest lap
    const fastestDriver = results.find(r => r.awards.some(a => a.icon === '⚡'));
    const fastestEl = document.getElementById('insight-fastest');
    const fastestTimeEl = document.getElementById('insight-fastest-time');
    if (fastestEl && fastestDriver) {
        fastestEl.textContent = fastestDriver.name;
        if (fastestTimeEl) fastestTimeEl.textContent = fastestDriver.bestLapDisplay;
    }
    
    // Most consistent
    const consistentResults = results.map(r => {
        // Use API-provided consistency value if available
        if (r.consistency_lap_raw !== undefined && r.consistency_lap_raw !== null) {
            return { ...r, consistencyScore: r.consistency_lap_raw / 1000 }; // Convert ms to seconds
        }
        
        // Fallback: calculate from lap times
        const laps = (r.lap_times || [])
            .filter(lap => lap && lap.lapTimeRaw && lap.lapTimeRaw <= LAP_TIME_THRESHOLD)
            .map(lap => lap.lapTimeRaw);
        if (laps.length >= 3) {
            const consistency = calculateConsistency(laps.map(t => ({ lapTimeRaw: t })));
            return { ...r, consistencyScore: consistency };
        }
        return null;
    }).filter(r => r && r.consistencyScore !== null);
    
    const mostConsistent = consistentResults.sort((a, b) => a.consistencyScore - b.consistencyScore)[0];
    const consistentEl = document.getElementById('insight-consistent');
    const consistentScoreEl = document.getElementById('insight-consistent-score');
    if (consistentEl && mostConsistent) {
        consistentEl.textContent = mostConsistent.name;
        if (consistentScoreEl) consistentScoreEl.textContent = `${mostConsistent.consistencyScore.toFixed(3)}s σ`;
    }
    
    // Most improved (position gain)
    const improved = results
        .filter(r => r.pos && r.pos !== r.position)
        .map(r => ({ ...r, gain: r.pos - r.position }))
        .sort((a, b) => b.gain - a.gain)[0];
    const improvedEl = document.getElementById('insight-improved');
    const improvedGainEl = document.getElementById('insight-improved-gain');
    if (improvedEl && improved) {
        improvedEl.textContent = improved.name;
        if (improvedGainEl) improvedGainEl.textContent = `+${improved.gain} positions`;
    }
    
    // Completion rate
    const completionEl = document.getElementById('insight-completion');
    const completionRateEl = document.getElementById('insight-completion-rate');
    if (completionEl && results.length > 0) {
        const finishers = results.filter(r => r.run_status !== 'dnf').length;
        const rate = (finishers / results.length * 100).toFixed(0);
        completionEl.textContent = `${finishers}/${results.length}`;
        if (completionRateEl) completionRateEl.textContent = `${rate}%`;
    }
    
    // Most incidents ("Crasher of the Day" award 🏆)
    const incidentsEl = document.getElementById('insight-incidents');
    const incidentsCountEl = document.getElementById('insight-incidents-count');
    if (incidentsEl && state && state.lapHistory) {
        const allIncidents = detectAllIncidents(state.lapHistory, sessionData);
        const crasher = findMostIncidents(allIncidents, sessionData);
        
        if (crasher && crasher.totalIncidents > 0) {
            incidentsEl.textContent = crasher.name;
            const countText = crasher.severeIncidents > 0 
                ? `${crasher.totalIncidents} (${crasher.severeIncidents} major)`
                : `${crasher.totalIncidents} incident${crasher.totalIncidents > 1 ? 's' : ''}`;
            if (incidentsCountEl) incidentsCountEl.textContent = countText;
        } else {
            incidentsEl.textContent = 'Clean session! 🎯';
            if (incidentsCountEl) incidentsCountEl.textContent = 'No incidents detected';
        }
    }
    
    // Ice in Veins (Most Consistent - smallest best/avg gap)
    const iceEl = document.getElementById('insight-ice');
    const iceScoreEl = document.getElementById('insight-ice-score');
    if (iceEl && results.length > 0) {
        const iceResults = results
            .filter(r => r.bestLapRaw && r.avgLapRaw && r.bestLapRaw > 0)
            .map(r => ({
                ...r,
                variance: r.avgLapRaw - r.bestLapRaw,
                consistencyPercent: ((r.bestLapRaw / r.avgLapRaw) * 100).toFixed(1)
            }))
            .sort((a, b) => a.variance - b.variance);
        
        if (iceResults.length > 0) {
            const iceWinner = iceResults[0];
            iceEl.textContent = iceWinner.name;
            if (iceScoreEl) {
                const varianceSeconds = (iceWinner.variance / 1000).toFixed(3);
                iceScoreEl.textContent = `${iceWinner.consistencyPercent}% (±${varianceSeconds}s)`;
            }
        }
    }
    
    // Fastest Finisher (Best lap in final 3 laps)
    const fastestFinisherEl = document.getElementById('insight-fastest-finisher');
    const fastestFinisherTimeEl = document.getElementById('insight-fastest-finisher-time');
    if (fastestFinisherEl && state && state.lapHistory) {
        let fastestFinisher = null;
        let fastestFinishTime = Infinity;
        
        Object.entries(state.lapHistory).forEach(([kartNumber, laps]) => {
            if (laps.length >= 3) {
                const finalLaps = laps.slice(-3);
                const bestFinalLap = finalLaps
                    .filter(lap => lap.timeRaw && lap.timeRaw <= LAP_TIME_THRESHOLD)
                    .sort((a, b) => a.timeRaw - b.timeRaw)[0];
                
                if (bestFinalLap && bestFinalLap.timeRaw < fastestFinishTime) {
                    fastestFinishTime = bestFinalLap.timeRaw;
                    const driverData = sessionData.runs.find(r => r.kart_number === kartNumber);
                    fastestFinisher = {
                        name: driverData ? driverData.name : `Kart ${kartNumber}`,
                        time: bestFinalLap.time,
                        lapNum: bestFinalLap.lapNum
                    };
                }
            }
        });
        
        if (fastestFinisher) {
            fastestFinisherEl.textContent = fastestFinisher.name;
            if (fastestFinisherTimeEl) {
                fastestFinisherTimeEl.textContent = `${fastestFinisher.time} (Lap ${fastestFinisher.lapNum})`;
            }
        }
    }
    
    // Hot Start (Fastest lap in laps 2-4)
    const hotStartEl = document.getElementById('insight-hot-start');
    const hotStartTimeEl = document.getElementById('insight-hot-start-time');
    if (hotStartEl && state && state.lapHistory) {
        let hotStarter = null;
        let hotStartTime = Infinity;
        
        Object.entries(state.lapHistory).forEach(([kartNumber, laps]) => {
            if (laps.length >= 2) {
                const earlyLaps = laps.slice(1, 5); // Laps 2-5 (index 1-4)
                const bestEarlyLap = earlyLaps
                    .filter(lap => lap.timeRaw && lap.timeRaw <= LAP_TIME_THRESHOLD)
                    .sort((a, b) => a.timeRaw - b.timeRaw)[0];
                
                if (bestEarlyLap && bestEarlyLap.timeRaw < hotStartTime) {
                    hotStartTime = bestEarlyLap.timeRaw;
                    const driverData = sessionData.runs.find(r => r.kart_number === kartNumber);
                    hotStarter = {
                        name: driverData ? driverData.name : `Kart ${kartNumber}`,
                        time: bestEarlyLap.time,
                        lapNum: bestEarlyLap.lapNum
                    };
                }
            }
        });
        
        if (hotStarter) {
            hotStartEl.textContent = hotStarter.name;
            if (hotStartTimeEl) {
                hotStartTimeEl.textContent = `${hotStarter.time} (Lap ${hotStarter.lapNum})`;
            }
        }
    }
    
    // Purple Lap King (Most personal best improvements)
    const purpleKingEl = document.getElementById('insight-purple-king');
    const purpleCountEl = document.getElementById('insight-purple-count');
    if (purpleKingEl && state && state.lapHistory) {
        let purpleKing = null;
        let maxPurpleLaps = 0;
        
        Object.entries(state.lapHistory).forEach(([kartNumber, laps]) => {
            let purpleCount = 0;
            let personalBest = Infinity;
            
            laps.forEach(lap => {
                if (lap.timeRaw && lap.timeRaw <= LAP_TIME_THRESHOLD) {
                    if (lap.timeRaw < personalBest) {
                        purpleCount++;
                        personalBest = lap.timeRaw;
                    }
                }
            });
            
            if (purpleCount > maxPurpleLaps) {
                maxPurpleLaps = purpleCount;
                const driverData = sessionData.runs.find(r => r.kart_number === kartNumber);
                purpleKing = {
                    name: driverData ? driverData.name : `Kart ${kartNumber}`,
                    count: purpleCount,
                    totalLaps: laps.length
                };
            }
        });
        
        if (purpleKing && maxPurpleLaps > 0) {
            purpleKingEl.textContent = purpleKing.name;
            if (purpleCountEl) {
                purpleCountEl.textContent = `${purpleKing.count} purple laps`;
            }
        }
    }
}

/**
 * Update method button active state
 */
function updateMethodButtonState(method) {
    const methodButtons = document.querySelectorAll('.method-btn-modern');
    methodButtons.forEach(btn => {
        if (btn.dataset.method === method) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Setup event listeners
 */
export function setupResultsEventListeners() {
    // Method buttons
    const methodButtons = document.querySelectorAll('.method-btn-modern');
    methodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const newMethod = btn.dataset.method;
            console.log('🔄 Switching to method:', newMethod);
            
            // Recalculate with new method using cached data
            if (cachedSessionData) {
                updateResultsView({}, cachedSessionData, cachedState, newMethod);
            } else if (window.kartingApp && window.kartingApp.state && window.kartingApp.state.sessionData) {
                // Fallback to global state
                updateResultsView(
                    {}, 
                    window.kartingApp.state.sessionData, 
                    window.kartingApp.state, 
                    newMethod
                );
            }
        });
    });
    
    // Search
    const searchInput = document.getElementById('results-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            updateResultsTable(currentResults, searchQuery);
        });
    }
    
    // Export button
    const exportBtn = document.getElementById('results-export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportResults(currentResults, currentMethod);
        });
    }
    
    console.log('✅ Results event listeners setup complete');
}

/**
 * Export results
 */
function exportResults(results, method) {
    const exportData = {
        timestamp: new Date().toISOString(),
        scoringMethod: method,
        results: results.map(r => ({
            position: r.position,
            kartNumber: r.kart_number,
            driver: r.name,
            score: r.scoreDisplay,
            gap: r.gap,
            bestLap: r.bestLapDisplay,
            laps: r.validLaps,
            awards: r.awards.map(a => a.label)
        }))
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const fileName = `results-${new Date().toISOString().split('T')[0]}.json`;
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', fileName);
    link.click();
    
    console.log('📥 Results exported:', fileName);
}

/**
 * Populate session selector (async to support server sessions)
 */
/**
 * Update track filter dropdown
 */
function updateTrackFilter(elements, sessionData) {
    // Find or create track filter
    let trackFilter = document.getElementById('results-track-filter');
    
    if (!trackFilter) {
        // Create track filter if it doesn't exist
        // Try to find session selector first, then insert after it
        const sessionSelector = document.getElementById('results-session-select');
        const insertTarget = sessionSelector?.parentElement || 
                            document.querySelector('.results-header') || 
                            document.querySelector('#results .results-controls') ||
                            document.querySelector('#results');
        
        if (insertTarget) {
            const filterHtml = `
                <div class="track-filter-container" style="margin: 10px 0; padding: 10px; background: #1a1a1a; border-radius: 5px;">
                    <label for="results-track-filter" style="margin-right: 10px; color: #fff; font-weight: bold; font-size: 1.1em;">🏁 Track Filter:</label>
                    <select id="results-track-filter" style="padding: 8px 15px; background: #2a2a2a; color: white; border: 2px solid #444; border-radius: 5px; font-size: 1em; cursor: pointer;">
                        <option value="all">All Tracks</option>
                    </select>
                    <span style="margin-left: 10px; color: #888; font-size: 0.9em;">Select a track to see results for that track only</span>
                </div>
            `;
            
            if (sessionSelector?.parentElement) {
                // Insert after session selector
                sessionSelector.parentElement.insertAdjacentHTML('afterend', filterHtml);
            } else {
                // Insert at the beginning
                insertTarget.insertAdjacentHTML('afterbegin', filterHtml);
            }
            
            trackFilter = document.getElementById('results-track-filter');
            
            // Add change handler
            trackFilter.addEventListener('change', (e) => {
                currentTrack = e.target.value;
                console.log(`🏁 Track filter changed to: ${currentTrack}`);
                // Re-render with new filter
                if (cachedSessionData && cachedState) {
                    updateResultsView(elements, cachedSessionData, cachedState, currentMethod);
                }
            });
            
            console.log('✅ Track filter created and inserted');
        } else {
            console.warn('⚠️ Could not find insertion point for track filter');
        }
    }
    
    if (trackFilter && sessionData?.runs) {
        // Count karts per track
        const trackCounts = {
            'Lakeside': 0,
            'Penrite': 0,
            'Mushroom': 0,
            'Rimo': 0
        };
        
        sessionData.runs.forEach(run => {
            const kartName = run.kart || run.kart_number || '';
            const track = getTrackFromKart(kartName);
            trackCounts[track]++;
        });
        
        // Rebuild options
        const currentValue = trackFilter.value || 'all';
        trackFilter.innerHTML = '<option value="all">🌐 All Tracks Combined</option>';
        
        const trackOrder = ['Lakeside', 'Penrite', 'Mushroom', 'Rimo'];
        const trackIcons = {
            'Lakeside': '⚡',
            'Penrite': '🏎️',
            'Mushroom': '🍄',
            'Rimo': '🎯'
        };
        
        trackOrder.forEach(track => {
            if (trackCounts[track] > 0) {
                const option = document.createElement('option');
                option.value = track;
                option.textContent = `${trackIcons[track]} ${track} (${trackCounts[track]} karts)`;
                trackFilter.appendChild(option);
            }
        });
        
        // Restore selection
        if ([...trackFilter.options].some(opt => opt.value === currentValue)) {
            trackFilter.value = currentValue;
        }
        
        console.log(`✅ Track filter updated with ${Object.values(trackCounts).reduce((a,b) => a+b, 0)} total karts`);
    }
}

async function populateSessionSelector(tab) {
    const selector = document.getElementById(`${tab}-session-select`);
    if (!selector) {
        console.warn('⚠️ Session selector not found for tab:', tab);
        return;
    }
    
    console.log('📋 Populating session selector for:', tab);
    
    try {
        const sessions = await SessionHistoryService.getSessionHistory();
        console.log(`✅ Got ${sessions.length} sessions from backend`);
        
        // Store current selection
        const currentValue = selector.value || 'live';
        
        // Rebuild options (always refresh to get latest sessions)
        selector.innerHTML = '<option value="live">🔴 Live</option>';
        
        if (sessions.length > 0) {
            sessions.forEach(session => {
                const option = document.createElement('option');
                option.value = session.sessionId;
                option.textContent = SessionHistoryService.getSessionLabel(session);
                selector.appendChild(option);
            });
            console.log(`📋 Added ${sessions.length} session options to selector`);
        } else {
            console.log('📋 No historical sessions available');
        }
        
        // Restore selection if it still exists
        if (currentValue !== 'live' && sessions.find(s => String(s.sessionId) === String(currentValue))) {
            selector.value = currentValue;
        }
    } catch (error) {
        console.error('❌ Error populating session selector:', error);
    }
}

