/**
 * Data Capture Script
 * 
 * Connects to RaceFacer WebSocket and logs all incoming data
 * to help understand session boundaries, track switching, and data patterns.
 * 
 * Usage:
 *   node server/data-capture.js [duration_in_minutes]
 * 
 * Output:
 *   - Logs to console with timestamps
 *   - Saves raw data to server/storage/capture/data-capture-[timestamp].json
 *   - Saves analysis to server/storage/capture/analysis-[timestamp].txt
 */

import { io } from 'socket.io-client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const WS_HOST = process.env.WS_HOST || 'live.racefacer.com';
const WS_PORT = process.env.WS_PORT || '3123';
const WS_PROTOCOL = process.env.WS_PROTOCOL || 'https';
const WS_CHANNEL = process.env.WS_CHANNEL || 'lemansentertainment';

const CAPTURE_DURATION = parseInt(process.argv[2]) || 30; // Default 30 minutes

// State
const capturedData = [];
const sessionMetrics = {
    totalUpdates: 0,
    uniqueEventNames: new Set(),
    uniqueTrackConfigs: new Set(),
    kartIds: new Set(),
    eventNameChanges: [],
    trackConfigChanges: [],
    kartAppearances: new Map(),
    kartDisappearances: new Map(),
    lapCountChanges: [],
    timeGaps: []
};

let lastUpdate = null;
let lastEventName = null;
let lastTrackConfig = null;
let lastKartIds = new Set();
let startTime = Date.now();

// Create capture directory
const captureDir = path.join(__dirname, 'storage', 'capture');
if (!fs.existsSync(captureDir)) {
    fs.mkdirSync(captureDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const dataFile = path.join(captureDir, `data-capture-${timestamp}.json`);
const analysisFile = path.join(captureDir, `analysis-${timestamp}.txt`);

console.log('═══════════════════════════════════════════════════════════');
console.log('🔍 RaceFacer Data Capture Script');
console.log('═══════════════════════════════════════════════════════════');
console.log(`📡 Connecting to: ${WS_PROTOCOL}://${WS_HOST}:${WS_PORT}`);
console.log(`📺 Channel: ${WS_CHANNEL}`);
console.log(`⏱️  Duration: ${CAPTURE_DURATION} minutes`);
console.log(`💾 Output: ${dataFile}`);
console.log('═══════════════════════════════════════════════════════════\n');

// Connect to WebSocket
const socket = io(`${WS_PROTOCOL}://${WS_HOST}:${WS_PORT}`, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: Infinity
});

socket.on('connect', () => {
    console.log('✅ Connected to RaceFacer WebSocket');
    socket.emit('join', WS_CHANNEL);
    console.log(`📻 Joined channel: ${WS_CHANNEL}\n`);
    console.log('🎬 Starting data capture...\n');
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from WebSocket');
});

socket.on('error', (error) => {
    console.error('⚠️  WebSocket Error:', error.message);
});

// Listen to ALL events to debug
socket.onAny((eventName, ...args) => {
    console.log(`🔔 Event received: ${eventName}`);
});

// Listen on the channel name (not 'data')
socket.on(WS_CHANNEL, (data) => {
    const now = Date.now();
    const captureTime = new Date().toISOString();
    
    sessionMetrics.totalUpdates++;
    
    // Calculate time gap
    if (lastUpdate) {
        const gap = now - lastUpdate;
        sessionMetrics.timeGaps.push(gap);
    }
    lastUpdate = now;
    
    // Store raw data with metadata
    const dataPoint = {
        captureTime,
        timestamp: now,
        data: JSON.parse(JSON.stringify(data)) // Deep clone
    };
    capturedData.push(dataPoint);
    
    // Analyze event_name changes
    const currentEventName = data.event_name || 'UNKNOWN';
    if (currentEventName !== lastEventName && lastEventName !== null) {
        const change = {
            time: captureTime,
            from: lastEventName,
            to: currentEventName,
            updateNumber: sessionMetrics.totalUpdates
        };
        sessionMetrics.eventNameChanges.push(change);
        console.log(`\n🔄 EVENT NAME CHANGE at update #${sessionMetrics.totalUpdates}:`);
        console.log(`   "${lastEventName}" → "${currentEventName}"\n`);
    }
    sessionMetrics.uniqueEventNames.add(currentEventName);
    lastEventName = currentEventName;
    
    // Analyze track_configuration_id changes
    const currentTrackConfig = data.track_configuration_id || 'UNKNOWN';
    if (currentTrackConfig !== lastTrackConfig && lastTrackConfig !== null) {
        const change = {
            time: captureTime,
            from: lastTrackConfig,
            to: currentTrackConfig,
            updateNumber: sessionMetrics.totalUpdates
        };
        sessionMetrics.trackConfigChanges.push(change);
        console.log(`\n🏁 TRACK CONFIG CHANGE at update #${sessionMetrics.totalUpdates}:`);
        console.log(`   ${lastTrackConfig} → ${currentTrackConfig}\n`);
    }
    sessionMetrics.uniqueTrackConfigs.add(currentTrackConfig);
    lastTrackConfig = currentTrackConfig;
    
    // Analyze karts
    const currentKartIds = new Set();
    if (data.runs && Array.isArray(data.runs)) {
        data.runs.forEach(run => {
            const kartId = run.racer_session_id;
            currentKartIds.add(kartId);
            sessionMetrics.kartIds.add(kartId);
            
            // Track appearances
            if (!sessionMetrics.kartAppearances.has(kartId)) {
                sessionMetrics.kartAppearances.set(kartId, {
                    firstSeen: captureTime,
                    updateNumber: sessionMetrics.totalUpdates,
                    eventName: currentEventName,
                    trackConfig: currentTrackConfig
                });
            }
            
            // New kart appeared
            if (!lastKartIds.has(kartId)) {
                console.log(`   ✨ NEW KART: ${run.racer_name || 'Unknown'} (ID: ${kartId}) - Lap ${run.best_lap_number || 0}`);
            }
        });
        
        // Detect disappeared karts
        for (const kartId of lastKartIds) {
            if (!currentKartIds.has(kartId)) {
                sessionMetrics.kartDisappearances.set(kartId, {
                    lastSeen: captureTime,
                    updateNumber: sessionMetrics.totalUpdates,
                    eventName: currentEventName,
                    trackConfig: currentTrackConfig
                });
                console.log(`   👻 KART DISAPPEARED: ID ${kartId}`);
            }
        }
    }
    lastKartIds = currentKartIds;
    
    // Log EVERY update (not just every 10)
    const elapsed = Math.round((now - startTime) / 1000);
    console.log(`📊 Update #${sessionMetrics.totalUpdates} | ${elapsed}s | Event: ${currentEventName} | Track: ${currentTrackConfig} | Karts: ${currentKartIds.size}`);
    
    // Write to file every 5 updates (not on every single one to avoid too much I/O)
    if (sessionMetrics.totalUpdates % 5 === 0) {
        try {
            fs.writeFileSync(dataFile, JSON.stringify(capturedData, null, 2));
            console.log(`   💾 Saved ${capturedData.length} data points to file`);
        } catch (error) {
            console.error(`   ⚠️  Error saving to file: ${error.message}`);
        }
    }
});

// Graceful shutdown
function shutdown() {
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('🛑 Stopping data capture...');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Generate analysis
    const analysis = generateAnalysis();
    
    // Save files
    console.log('💾 Saving captured data...');
    fs.writeFileSync(dataFile, JSON.stringify(capturedData, null, 2));
    console.log(`   ✅ Raw data saved: ${dataFile}`);
    console.log(`   📦 Size: ${(fs.statSync(dataFile).size / 1024).toFixed(2)} KB`);
    
    fs.writeFileSync(analysisFile, analysis);
    console.log(`   ✅ Analysis saved: ${analysisFile}\n`);
    
    console.log(analysis);
    
    socket.disconnect();
    process.exit(0);
}

function generateAnalysis() {
    const duration = (Date.now() - startTime) / 1000;
    const avgGap = sessionMetrics.timeGaps.length > 0 
        ? sessionMetrics.timeGaps.reduce((a, b) => a + b, 0) / sessionMetrics.timeGaps.length 
        : 0;
    
    let report = '';
    report += '═══════════════════════════════════════════════════════════\n';
    report += '📊 DATA CAPTURE ANALYSIS\n';
    report += '═══════════════════════════════════════════════════════════\n\n';
    
    report += '⏱️  TIMING\n';
    report += `   Duration: ${Math.round(duration)}s (${(duration / 60).toFixed(2)} minutes)\n`;
    report += `   Total Updates: ${sessionMetrics.totalUpdates}\n`;
    report += `   Update Frequency: ${(sessionMetrics.totalUpdates / duration).toFixed(2)} updates/sec\n`;
    report += `   Avg Gap Between Updates: ${avgGap.toFixed(0)}ms\n\n`;
    
    report += '🏁 EVENTS & TRACKS\n';
    report += `   Unique Event Names: ${sessionMetrics.uniqueEventNames.size}\n`;
    for (const name of sessionMetrics.uniqueEventNames) {
        report += `      - ${name}\n`;
    }
    report += `\n   Unique Track Configs: ${sessionMetrics.uniqueTrackConfigs.size}\n`;
    for (const config of sessionMetrics.uniqueTrackConfigs) {
        report += `      - ${config}\n`;
    }
    report += '\n';
    
    report += '🔄 EVENT NAME CHANGES\n';
    if (sessionMetrics.eventNameChanges.length === 0) {
        report += '   No changes detected\n\n';
    } else {
        sessionMetrics.eventNameChanges.forEach((change, i) => {
            report += `   ${i + 1}. Update #${change.updateNumber} at ${change.time}\n`;
            report += `      "${change.from}" → "${change.to}"\n`;
        });
        report += '\n';
    }
    
    report += '🏁 TRACK CONFIG CHANGES\n';
    if (sessionMetrics.trackConfigChanges.length === 0) {
        report += '   No changes detected\n\n';
    } else {
        sessionMetrics.trackConfigChanges.forEach((change, i) => {
            report += `   ${i + 1}. Update #${change.updateNumber} at ${change.time}\n`;
            report += `      ${change.from} → ${change.to}\n`;
        });
        report += '\n';
    }
    
    report += '🏎️  KARTS\n';
    report += `   Total Unique Karts: ${sessionMetrics.kartIds.size}\n`;
    report += `   Karts Appeared: ${sessionMetrics.kartAppearances.size}\n`;
    report += `   Karts Disappeared: ${sessionMetrics.kartDisappearances.size}\n\n`;
    
    report += '   APPEARANCES:\n';
    for (const [kartId, info] of sessionMetrics.kartAppearances) {
        report += `      Kart ${kartId}: Update #${info.updateNumber} at ${info.firstSeen}\n`;
        report += `         Event: ${info.eventName}, Track: ${info.trackConfig}\n`;
    }
    report += '\n';
    
    report += '   DISAPPEARANCES:\n';
    if (sessionMetrics.kartDisappearances.size === 0) {
        report += '      None (all karts still active)\n';
    } else {
        for (const [kartId, info] of sessionMetrics.kartDisappearances) {
            report += `      Kart ${kartId}: Update #${info.updateNumber} at ${info.lastSeen}\n`;
            report += `         Event: ${info.eventName}, Track: ${info.trackConfig}\n`;
        }
    }
    report += '\n';
    
    report += '═══════════════════════════════════════════════════════════\n';
    report += '💡 RECOMMENDATIONS\n';
    report += '═══════════════════════════════════════════════════════════\n\n';
    
    // Generate recommendations based on patterns
    if (sessionMetrics.uniqueTrackConfigs.size > 1) {
        report += '⚠️  MULTIPLE TRACK CONFIGS DETECTED\n';
        report += '   → Sessions MUST be separated by track_configuration_id\n';
        report += '   → Each track config should have its own session store\n';
        report += '   → Kart analysis should filter by track config\n\n';
    }
    
    if (sessionMetrics.eventNameChanges.length > 0) {
        report += '⚠️  EVENT NAME CHANGES DETECTED\n';
        report += '   → Event name changes indicate new sessions\n';
        report += '   → Use event_name + track_configuration_id as session key\n\n';
    }
    
    if (sessionMetrics.kartDisappearances.size > 0) {
        report += '⚠️  KARTS DISAPPEARING FROM FEED\n';
        report += '   → Must track all karts that appeared in session\n';
        report += '   → Keep historical data even after kart disappears\n';
        report += '   → Session should end only on event/track change\n\n';
    }
    
    report += '═══════════════════════════════════════════════════════════\n';
    
    return report;
}

// Set timeout for capture duration
setTimeout(() => {
    console.log('\n⏰ Capture duration reached');
    shutdown();
}, CAPTURE_DURATION * 60 * 1000);

// Handle Ctrl+C
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);


