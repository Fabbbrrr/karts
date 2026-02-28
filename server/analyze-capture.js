/**
 * Analyze captured WebSocket data to understand:
 * 1. How to correctly split sessions by track
 * 2. Session boundaries (when they start/end)
 * 3. Kart assignment to tracks
 * 4. Optimal data ingestion strategy
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const captureFile = process.argv[2];
if (!captureFile) {
    console.error('Usage: node analyze-capture.js <capture-file.json>');
    process.exit(1);
}

console.log('📊 Loading captured data...');
const data = JSON.parse(fs.readFileSync(captureFile, 'utf8'));
console.log(`✅ Loaded ${data.length} data points\n`);

// Analysis state
const sessions = new Map(); // Key: `${event_name}_${track_config_id}`
const karts = new Map(); // Key: kart ID, Value: { tracks: Set, sessions: Set, firstSeen, lastSeen }
const trackConfigs = new Map(); // Key: track_config_id, Value: { name, mapFile, length, kartPrefixes: Set }

// Process each data point
console.log('🔍 Analyzing data...\n');

data.forEach((dataPoint, index) => {
    const sessionData = dataPoint.data?.data || dataPoint.data;
    if (!sessionData) return;
    
    const eventName = sessionData.event_name || 'Unknown';
    const trackConfigId = sessionData.track_configuration_id || 0;
    const timestamp = dataPoint.timestamp;
    const runs = sessionData.runs || [];
    
    // Track configuration analysis
    if (sessionData.maps_data?.map) {
        if (!trackConfigs.has(trackConfigId)) {
            trackConfigs.set(trackConfigId, {
                name: sessionData.maps_data.map.bgr || 'Unknown',
                length: sessionData.maps_data.map.length,
                kartPrefixes: new Set(),
                eventNames: new Set()
            });
        }
        trackConfigs.get(trackConfigId).eventNames.add(eventName);
    }
    
    // Session analysis
    const sessionKey = `${eventName}_${trackConfigId}`;
    if (!sessions.has(sessionKey)) {
        sessions.set(sessionKey, {
            eventName,
            trackConfigId,
            firstSeen: timestamp,
            lastSeen: timestamp,
            updateCount: 0,
            kartIds: new Set(),
            kartPrefixes: new Set(),
            totalLaps: sessionData.total_laps,
            currentLap: sessionData.current_lap,
            statusChanges: []
        });
    }
    
    const session = sessions.get(sessionKey);
    session.lastSeen = timestamp;
    session.updateCount++;
    
    // Kart analysis
    runs.forEach(run => {
        const kartId = run.kart || run.kart_number || 'Unknown';
        const kartPrefix = kartId.charAt(0).toUpperCase();
        
        session.kartIds.add(kartId);
        session.kartPrefixes.add(kartPrefix);
        
        if (trackConfigs.has(trackConfigId)) {
            trackConfigs.get(trackConfigId).kartPrefixes.add(kartPrefix);
        }
        
        if (!karts.has(kartId)) {
            karts.set(kartId, {
                tracks: new Set(),
                sessions: new Set(),
                prefixes: new Set(),
                names: new Set(),
                firstSeen: timestamp,
                lastSeen: timestamp,
                totalLaps: 0
            });
        }
        
        const kart = karts.get(kartId);
        kart.tracks.add(trackConfigId);
        kart.sessions.add(sessionKey);
        kart.prefixes.add(kartPrefix);
        kart.names.add(run.name);
        kart.lastSeen = timestamp;
        kart.totalLaps = Math.max(kart.totalLaps, run.total_laps || 0);
    });
});

// Generate report
console.log('═══════════════════════════════════════════════════════════');
console.log('📊 CAPTURED DATA ANALYSIS');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('⏱️  DATA OVERVIEW');
console.log(`   Total Updates: ${data.length}`);
console.log(`   Duration: ${((data[data.length - 1].timestamp - data[0].timestamp) / 1000 / 60).toFixed(2)} minutes`);
console.log(`   Avg Update Frequency: ${(data.length / ((data[data.length - 1].timestamp - data[0].timestamp) / 1000)).toFixed(2)} updates/sec\n`);

console.log('🏁 TRACK CONFIGURATIONS DETECTED');
console.log(`   Total Tracks: ${trackConfigs.size}\n`);
for (const [trackId, config] of trackConfigs) {
    console.log(`   Track Config #${trackId}:`);
    console.log(`      Map: ${config.name}`);
    console.log(`      Length: ${config.length}m`);
    console.log(`      Kart Prefixes: ${Array.from(config.kartPrefixes).sort().join(', ')}`);
    console.log(`      Event Names: ${Array.from(config.eventNames).join(', ')}`);
    console.log('');
}

console.log('📋 SESSIONS DETECTED');
console.log(`   Total Sessions: ${sessions.size}\n`);
for (const [sessionKey, session] of sessions) {
    const duration = ((session.lastSeen - session.firstSeen) / 1000 / 60).toFixed(2);
    console.log(`   ${sessionKey}:`);
    console.log(`      Event: ${session.eventName}`);
    console.log(`      Track Config: ${session.trackConfigId}`);
    console.log(`      Duration: ${duration} minutes`);
    console.log(`      Updates: ${session.updateCount}`);
    console.log(`      Karts: ${session.kartIds.size}`);
    console.log(`      Kart Prefixes: ${Array.from(session.kartPrefixes).sort().join(', ')}`);
    console.log(`      Sample Karts: ${Array.from(session.kartIds).slice(0, 5).join(', ')}`);
    console.log('');
}

console.log('🏎️  KARTS ANALYSIS');
console.log(`   Total Unique Karts: ${karts.size}\n`);

// Group karts by prefix
const kartsByPrefix = new Map();
for (const [kartId, kartInfo] of karts) {
    const prefix = kartId.charAt(0).toUpperCase();
    if (!kartsByPrefix.has(prefix)) {
        kartsByPrefix.set(prefix, []);
    }
    kartsByPrefix.get(prefix).push({ kartId, ...kartInfo });
}

for (const [prefix, kartList] of Array.from(kartsByPrefix).sort()) {
    console.log(`   ${prefix}* Karts: ${kartList.length}`);
    console.log(`      Sample: ${kartList.slice(0, 5).map(k => k.kartId).join(', ')}`);
    console.log(`      Tracks: ${Array.from(new Set(kartList.flatMap(k => Array.from(k.tracks)))).join(', ')}`);
    console.log('');
}

// Cross-track contamination check
console.log('⚠️  CROSS-TRACK CONTAMINATION CHECK');
const contaminatedKarts = Array.from(karts.entries()).filter(([_, info]) => info.tracks.size > 1);
if (contaminatedKarts.length === 0) {
    console.log('   ✅ No karts appear in multiple tracks - clean separation!\n');
} else {
    console.log(`   ❌ Found ${contaminatedKarts.length} karts appearing in multiple tracks:\n`);
    contaminatedKarts.forEach(([kartId, info]) => {
        console.log(`      ${kartId}: tracks ${Array.from(info.tracks).join(', ')}`);
    });
    console.log('');
}

console.log('═══════════════════════════════════════════════════════════');
console.log('💡 RECOMMENDATIONS');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('1️⃣  SESSION SPLITTING STRATEGY:');
console.log('   ✅ Split by: event_name + track_configuration_id');
console.log('   ✅ Session key format: "${event_name}_${track_config_id}"');
console.log('   ✅ Session changes when either field changes\n');

console.log('2️⃣  KART TO TRACK MAPPING:');
const prefixToTrack = new Map();
for (const [trackId, config] of trackConfigs) {
    for (const prefix of config.kartPrefixes) {
        if (!prefixToTrack.has(prefix)) {
            prefixToTrack.set(prefix, []);
        }
        prefixToTrack.get(prefix).push({ trackId, name: config.name });
    }
}

for (const [prefix, tracks] of Array.from(prefixToTrack).sort()) {
    const trackNames = tracks.map(t => `${t.name} (config #${t.trackId})`).join(', ');
    console.log(`   ${prefix}* → ${trackNames}`);
}
console.log('');

if (contaminatedKarts.length > 0) {
    console.log('   ⚠️  Multiple tracks share kart prefixes!');
    console.log('   → Cannot rely on kart prefix alone');
    console.log('   → MUST use track_configuration_id from session data\n');
} else {
    console.log('   ✅ Kart prefixes are unique per track - can use as secondary identifier\n');
}

console.log('3️⃣  DATA INGESTION OPTIMIZATION:');
console.log('   ✅ Process updates in real-time (no batching needed)');
console.log('   ✅ Maintain separate session state per track_configuration_id');
console.log('   ✅ Store lap history per session, not globally');
console.log('   ✅ Save session when event_name or track_configuration_id changes');
console.log('   ✅ Session ID format: "Session_${event_number}_track${track_config_id}"\n');

console.log('4️⃣  KART ANALYSIS STRATEGY:');
console.log('   ✅ Filter by track_configuration_id FIRST');
console.log('   ✅ Then analyze lap times within same track');
console.log('   ✅ Store analysis per: kart + track_configuration_id');
console.log('   ✅ Never mix lap times from different track configs\n');

console.log('5️⃣  RESULTS DISPLAY:');
console.log('   ✅ List sessions grouped by track_configuration_id');
console.log('   ✅ Label format: "Session #X - [Track Name] - [Date] - [Winner]"');
console.log('   ✅ Allow filtering by track configuration');
console.log('   ✅ Show kart count and lap count per session\n');

console.log('═══════════════════════════════════════════════════════════\n');

// Save report
const reportPath = captureFile.replace('.json', '-analysis.txt');
const report = [
    '═══════════════════════════════════════════════════════════',
    'DATA ANALYSIS REPORT',
    '═══════════════════════════════════════════════════════════',
    '',
    `Sessions Detected: ${sessions.size}`,
    `Track Configurations: ${trackConfigs.size}`,
    `Total Karts: ${karts.size}`,
    `Duration: ${((data[data.length - 1].timestamp - data[0].timestamp) / 1000 / 60).toFixed(2)} minutes`,
    '',
    'SESSION DETAILS:',
    ...Array.from(sessions.entries()).map(([key, s]) => 
        `  ${key}: ${s.kartIds.size} karts, ${((s.lastSeen - s.firstSeen) / 1000 / 60).toFixed(2)} min`
    ),
    '',
    'KART PREFIX DISTRIBUTION:',
    ...Array.from(kartsByPrefix.entries()).map(([prefix, karts]) => 
        `  ${prefix}*: ${karts.length} karts`
    ),
    '',
    'TRACK TO PREFIX MAPPING:',
    ...Array.from(trackConfigs.entries()).map(([id, config]) => 
        `  Track ${id} (${config.name}): ${Array.from(config.kartPrefixes).sort().join(', ')}`
    )
].join('\n');

fs.writeFileSync(reportPath, report);
console.log(`📄 Report saved to: ${reportPath}\n`);




