/**
 * Detailed track configuration analysis
 * Analyzes map names, track lengths, and lap times to correctly identify tracks
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const captureFile = process.argv[2];
if (!captureFile) {
    console.error('Usage: node analyze-tracks.js <capture-file.json>');
    process.exit(1);
}

console.log('📊 Loading captured data...');
const data = JSON.parse(fs.readFileSync(captureFile, 'utf8'));
console.log(`✅ Loaded ${data.length} data points\n`);

// Track configuration details
const trackConfigs = new Map();

// Analyze each data point
data.forEach((dataPoint, index) => {
    const sessionData = dataPoint.data?.data || dataPoint.data;
    if (!sessionData) return;
    
    const trackConfigId = sessionData.track_configuration_id;
    const mapsData = sessionData.maps_data?.map;
    
    if (trackConfigId !== undefined && mapsData) {
        if (!trackConfigs.has(trackConfigId)) {
            trackConfigs.set(trackConfigId, {
                id: trackConfigId,
                mapBgr: mapsData.bgr,
                mapSvg: mapsData.svg,
                length: mapsData.length,
                isReverse: mapsData.is_reverse,
                correction: mapsData.correction,
                lapTimes: [],
                kartPrefixes: new Set(),
                eventNames: new Set()
            });
        }
        
        const config = trackConfigs.get(trackConfigId);
        config.eventNames.add(sessionData.event_name);
        
        // Collect lap times
        if (sessionData.runs && Array.isArray(sessionData.runs)) {
            sessionData.runs.forEach(run => {
                if (run.best_time_raw && run.best_time_raw > 1000 && run.best_time_raw < 100000) {
                    config.lapTimes.push(run.best_time_raw / 1000); // Convert to seconds
                }
                
                // Track kart prefixes
                const kartId = run.kart || run.kart_number || '';
                if (kartId) {
                    const prefix = String(kartId).charAt(0).toUpperCase();
                    config.kartPrefixes.add(prefix);
                }
            });
        }
    }
});

// Generate report
console.log('═══════════════════════════════════════════════════════════');
console.log('🏁 TRACK CONFIGURATION DETAILED ANALYSIS');
console.log('═══════════════════════════════════════════════════════════\n');

for (const [trackId, config] of Array.from(trackConfigs).sort((a, b) => a[0] - b[0])) {
    console.log(`\n🏁 TRACK CONFIG #${trackId}`);
    console.log('─────────────────────────────────────────────────────────');
    console.log(`📄 Map Files:`);
    console.log(`   Background: ${config.mapBgr}`);
    console.log(`   SVG: ${config.mapSvg}`);
    console.log(`   Length: ${config.length}m`);
    console.log(`   Reverse: ${config.isReverse ? 'Yes' : 'No'}`);
    console.log(`   Correction: ${config.correction}`);
    
    console.log(`\n📊 Lap Time Statistics:`);
    if (config.lapTimes.length > 0) {
        const sorted = config.lapTimes.sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
        const median = sorted[Math.floor(sorted.length / 2)];
        
        // Get percentiles
        const p10 = sorted[Math.floor(sorted.length * 0.1)];
        const p90 = sorted[Math.floor(sorted.length * 0.9)];
        
        console.log(`   Total Laps Recorded: ${config.lapTimes.length}`);
        console.log(`   Fastest: ${min.toFixed(3)}s`);
        console.log(`   Slowest: ${max.toFixed(3)}s`);
        console.log(`   Average: ${avg.toFixed(3)}s`);
        console.log(`   Median: ${median.toFixed(3)}s`);
        console.log(`   10th Percentile: ${p10.toFixed(3)}s`);
        console.log(`   90th Percentile: ${p90.toFixed(3)}s`);
        
        // Show distribution
        console.log(`\n   Top 10 Fastest Laps:`);
        sorted.slice(0, 10).forEach((time, i) => {
            console.log(`      ${i + 1}. ${time.toFixed(3)}s`);
        });
    } else {
        console.log(`   No lap times recorded`);
    }
    
    console.log(`\n🏎️  Kart Prefixes: ${Array.from(config.kartPrefixes).sort().join(', ')}`);
    console.log(`📋 Events: ${Array.from(config.eventNames).join(', ')}`);
}

console.log('\n\n═══════════════════════════════════════════════════════════');
console.log('💡 TRACK IDENTIFICATION');
console.log('═══════════════════════════════════════════════════════════\n');

// Identify tracks by map names and lap times
for (const [trackId, config] of trackConfigs) {
    const mapName = config.mapBgr.replace('.png', '').toLowerCase();
    const avgTime = config.lapTimes.length > 0 
        ? config.lapTimes.reduce((a, b) => a + b, 0) / config.lapTimes.length 
        : 0;
    const minTime = config.lapTimes.length > 0 
        ? Math.min(...config.lapTimes)
        : 0;
    
    console.log(`Track Config #${trackId}:`);
    console.log(`   Map Name: ${mapName}`);
    console.log(`   Length: ${config.length}m`);
    console.log(`   Min Lap: ${minTime.toFixed(3)}s`);
    console.log(`   Avg Lap: ${avgTime.toFixed(3)}s`);
    
    // Suggest track name based on data
    let suggestedName = mapName.charAt(0).toUpperCase() + mapName.slice(1);
    
    if (minTime > 0) {
        if (minTime < 20) {
            suggestedName += ' (Very Short Track)';
        } else if (minTime < 25) {
            suggestedName += ' (Short Track)';
        } else if (minTime < 30) {
            suggestedName += ' (Medium Track)';
        } else if (minTime < 35) {
            suggestedName += ' (Long Track)';
        } else {
            suggestedName += ' (Very Long Track)';
        }
    }
    
    console.log(`   → ${suggestedName}`);
    console.log('');
}

console.log('═══════════════════════════════════════════════════════════\n');




