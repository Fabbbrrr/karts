/**
 * Quick test to verify WebSocket connection
 */
import { io } from 'socket.io-client';

const WS_HOST = 'live.racefacer.com';
const WS_PORT = '3123';
const WS_PROTOCOL = 'https';
const WS_CHANNEL = 'lemansentertainment';

console.log('═══════════════════════════════════════════════════════════');
console.log('🔍 Testing RaceFacer WebSocket Connection');
console.log('═══════════════════════════════════════════════════════════');
console.log(`📡 Connecting to: ${WS_PROTOCOL}://${WS_HOST}:${WS_PORT}`);
console.log(`📺 Channel: ${WS_CHANNEL}`);
console.log('═══════════════════════════════════════════════════════════\n');

let updateCount = 0;
let connectionTimeout;

const socket = io(`${WS_PROTOCOL}://${WS_HOST}:${WS_PORT}`, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 5
});

socket.on('connect', () => {
    console.log('✅ Connected to WebSocket');
    socket.emit('join', WS_CHANNEL);
    console.log(`📻 Joined channel: ${WS_CHANNEL}`);
    console.log('⏳ Waiting for data (will timeout in 30 seconds)...\n');
    
    // Set timeout to exit if no data received
    connectionTimeout = setTimeout(() => {
        console.log('\n⚠️  No data received in 30 seconds');
        console.log('   This could mean:');
        console.log('   1. No active session right now');
        console.log('   2. WebSocket is connected but not broadcasting');
        console.log('   3. Channel name might be incorrect\n');
        process.exit(0);
    }, 30000);
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from WebSocket');
    process.exit(1);
});

socket.on('connect_error', (error) => {
    console.error('❌ Connection Error:', error.message);
    process.exit(1);
});

socket.on('error', (error) => {
    console.error('⚠️  WebSocket Error:', error.message);
});

socket.on('data', (data) => {
    clearTimeout(connectionTimeout);
    updateCount++;
    
    const kartCount = data.runs ? data.runs.length : 0;
    const eventName = data.event_name || 'UNKNOWN';
    const trackConfig = data.track_configuration_id || 'UNKNOWN';
    
    console.log(`📊 Update #${updateCount}:`);
    console.log(`   Event: ${eventName}`);
    console.log(`   Track: ${trackConfig}`);
    console.log(`   Karts: ${kartCount}`);
    
    if (kartCount > 0) {
        console.log('   Sample kart:', data.runs[0].racer_name || 'Unknown');
    }
    console.log('');
    
    // Exit after 5 updates
    if (updateCount >= 5) {
        console.log('✅ Connection test successful! Received 5 updates.');
        console.log('   data-capture.js should work fine.\n');
        process.exit(0);
    }
});

// Exit after 60 seconds max
setTimeout(() => {
    console.log('\n⏰ Test timeout (60 seconds)');
    console.log(`   Received ${updateCount} updates\n`);
    process.exit(0);
}, 60000);




