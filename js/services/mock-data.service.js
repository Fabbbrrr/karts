/**
 * Karting Live Timer - Mock Data Service
 * 
 * PURPOSE: Generate realistic simulated race data for testing
 * WHY: Enable development and demos without live races
 * HOW: Generates randomized lap times, positions, and race progression
 * FEATURE: Mock Data, Testing, Development Tools
 */

// Mock configuration
const MOCK_CONFIG = {
    MIN_KARTS: 8,
    MAX_KARTS: 16,
    MIN_LAP_TIME: 24000,      // 24 seconds
    MAX_LAP_TIME: 35000,      // 35 seconds
    LAP_VARIANCE: 500,        // ±500ms per lap
    POSITION_CHANGE_CHANCE: 0.15,  // 15% chance of position change per lap
    UPDATE_INTERVAL: 3000,    // Update every 3 seconds
    INCIDENT_CHANCE: 0.05     // 5% chance of incident (slow lap)
};

// Mock driver names pool
const DRIVER_NAMES = [
    'Alex Thompson', 'Jordan Smith', 'Casey Williams', 'Morgan Taylor',
    'Riley Anderson', 'Jamie Martinez', 'Avery Garcia', 'Quinn Rodriguez',
    'Skyler Lee', 'Cameron White', 'Dakota Brown', 'Reese Wilson',
    'Parker Davis', 'Emerson Moore', 'Peyton Jackson', 'Hayden Clark',
    'Taylor Lewis', 'Drew Walker', 'Charlie Hall', 'Blake Allen'
];

// Session state
let mockSession = null;
let updateInterval = null;
let isRunning = false;
let sessionStartTime = null;
let onDataCallback = null;

/**
 * Mock kart data structure
 */
class MockKart {
    constructor(kartNumber, driverName) {
        this.kartNumber = kartNumber;
        this.driverName = driverName;
        this.position = kartNumber;
        this.laps = 0;
        this.bestTime = null;
        this.bestTimeRaw = null;
        this.lastTime = null;
        this.lastTimeRaw = null;
        this.totalTime = 0;
        this.lapTimes = [];
        
        // Generate base pace for this driver (consistency)
        this.basePace = MOCK_CONFIG.MIN_LAP_TIME + 
            Math.random() * (MOCK_CONFIG.MAX_LAP_TIME - MOCK_CONFIG.MIN_LAP_TIME);
    }
    
    /**
     * Generate next lap time with variance
     */
    generateLapTime() {
        // Random variance around base pace
        const variance = (Math.random() - 0.5) * 2 * MOCK_CONFIG.LAP_VARIANCE;
        let lapTime = this.basePace + variance;
        
        // Small chance of incident (slow lap)
        if (Math.random() < MOCK_CONFIG.INCIDENT_CHANCE) {
            lapTime += 2000 + Math.random() * 3000; // +2-5 seconds
        }
        
        // Slight improvement over race (tire warm-up)
        if (this.laps > 3) {
            lapTime -= Math.min(this.laps * 50, 500); // Max 500ms improvement
        }
        
        return Math.round(lapTime);
    }
    
    /**
     * Complete a lap
     */
    completeLap() {
        const lapTimeRaw = this.generateLapTime();
        const lapTime = formatTime(lapTimeRaw);
        
        this.laps++;
        this.lastTimeRaw = lapTimeRaw;
        this.lastTime = lapTime;
        this.totalTime += lapTimeRaw;
        this.lapTimes.push(lapTimeRaw);
        
        // Update best time
        if (!this.bestTimeRaw || lapTimeRaw < this.bestTimeRaw) {
            this.bestTimeRaw = lapTimeRaw;
            this.bestTime = lapTime;
        }
        
        return lapTimeRaw;
    }
    
    /**
     * Get average lap time
     */
    getAverageLapTime() {
        if (this.lapTimes.length === 0) return null;
        const sum = this.lapTimes.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.lapTimes.length);
    }
    
    /**
     * Calculate consistency (standard deviation)
     */
    getConsistency() {
        if (this.lapTimes.length < 2) return 0;
        
        const avg = this.getAverageLapTime();
        const squareDiffs = this.lapTimes.map(time => Math.pow(time - avg, 2));
        const variance = squareDiffs.reduce((a, b) => a + b, 0) / this.lapTimes.length;
        const stdDev = Math.sqrt(variance);
        
        return (stdDev / 1000).toFixed(3); // Convert to seconds
    }
}

/**
 * Format time in milliseconds to seconds
 */
function formatTime(ms) {
    if (!ms) return '--.-';
    const seconds = (ms / 1000).toFixed(3);
    return seconds;
}

/**
 * Format time for display (MM:SS.mmm)
 */
function formatTimeDisplay(ms) {
    if (!ms) return '--:--.-';
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(3);
    
    if (minutes > 0) {
        return `${minutes}:${seconds.padStart(6, '0')}`;
    }
    return seconds;
}

/**
 * Initialize mock session
 * @param {Object} options - Session options
 * @returns {Object} Mock session data
 */
export function initializeMockSession(options = {}) {
    const {
        sessionType = 'race',
        maxLaps = 10,
        durationMinutes = 5,
        kartCount = null
    } = options;
    
    // Determine number of karts
    const numKarts = kartCount || 
        Math.floor(Math.random() * (MOCK_CONFIG.MAX_KARTS - MOCK_CONFIG.MIN_KARTS + 1)) + 
        MOCK_CONFIG.MIN_KARTS;
    
    // Create karts with shuffled driver names
    const shuffledNames = [...DRIVER_NAMES].sort(() => Math.random() - 0.5);
    const karts = [];
    
    for (let i = 0; i < numKarts; i++) {
        const kartNumber = String(i + 1).padStart(2, '0');
        const driverName = shuffledNames[i] || `Driver ${i + 1}`;
        karts.push(new MockKart(kartNumber, driverName));
    }
    
    mockSession = {
        karts,
        sessionType,
        maxLaps,
        durationMinutes,
        startTime: Date.now(),
        currentLap: 0,
        eventName: `Mock ${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)}`,
        trackConfigId: 'mock-track-001',
        isMock: true  // Important flag to prevent persistence
    };
    
    sessionStartTime = Date.now();
    
    console.log(`🎭 Mock session initialized: ${numKarts} karts, ${maxLaps} laps, ${durationMinutes} min`);
    
    return mockSession;
}

/**
 * Update mock session (simulate lap progression)
 */
function updateMockSession() {
    if (!mockSession || !isRunning) return;
    
    const elapsed = Date.now() - sessionStartTime;
    const elapsedMinutes = elapsed / 60000;
    
    // Check if session should end
    const maxLapsReached = mockSession.currentLap >= mockSession.maxLaps;
    const timeExpired = elapsedMinutes >= mockSession.durationMinutes;
    
    if (maxLapsReached || timeExpired) {
        console.log('🏁 Mock session finished');
        stopMockSession();
        return;
    }
    
    // Randomly complete laps for karts
    const kartsToUpdate = Math.floor(Math.random() * 3) + 1; // 1-3 karts per update
    
    for (let i = 0; i < kartsToUpdate; i++) {
        // Pick a random kart that hasn't finished
        const eligibleKarts = mockSession.karts.filter(k => k.laps < mockSession.maxLaps);
        if (eligibleKarts.length === 0) break;
        
        const kart = eligibleKarts[Math.floor(Math.random() * eligibleKarts.length)];
        kart.completeLap();
        
        // Update session current lap
        mockSession.currentLap = Math.max(...mockSession.karts.map(k => k.laps));
    }
    
    // Randomly shuffle positions slightly (realistic position changes)
    if (Math.random() < MOCK_CONFIG.POSITION_CHANGE_CHANCE) {
        shufflePositions();
    } else {
        updatePositionsByTime();
    }
    
    // Generate session data in RaceFacer format
    const sessionData = generateSessionData();
    
    // Call the data callback
    if (onDataCallback) {
        onDataCallback(sessionData);
    }
}

/**
 * Update positions based on total time (realistic)
 */
function updatePositionsByTime() {
    // Sort by total time (fastest first)
    const sorted = [...mockSession.karts].sort((a, b) => {
        // If same laps, compare total time
        if (a.laps === b.laps) {
            return a.totalTime - b.totalTime;
        }
        // More laps = better position
        return b.laps - a.laps;
    });
    
    // Assign positions
    sorted.forEach((kart, index) => {
        kart.position = index + 1;
    });
}

/**
 * Shuffle positions slightly (simulate overtakes)
 */
function shufflePositions() {
    // Pick two adjacent karts and swap them
    const index = Math.floor(Math.random() * (mockSession.karts.length - 1));
    const kart1 = mockSession.karts.find(k => k.position === index + 1);
    const kart2 = mockSession.karts.find(k => k.position === index + 2);
    
    if (kart1 && kart2) {
        const temp = kart1.position;
        kart1.position = kart2.position;
        kart2.position = temp;
    }
}

/**
 * Generate session data in RaceFacer format
 */
function generateSessionData() {
    const elapsed = Date.now() - sessionStartTime;
    const elapsedSeconds = Math.floor(elapsed / 1000);
    const remainingSeconds = Math.max(0, (mockSession.durationMinutes * 60) - elapsedSeconds);
    
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const timeLeft = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Calculate gaps and intervals
    const sortedByPosition = [...mockSession.karts].sort((a, b) => a.position - b.position);
    const leader = sortedByPosition[0];
    
    const runs = sortedByPosition.map(kart => {
        // Calculate gap to leader
        let gap = '0.000';
        if (kart.position > 1 && leader.laps > 0) {
            if (kart.laps === leader.laps) {
                const gapMs = kart.totalTime - leader.totalTime;
                gap = `+${(gapMs / 1000).toFixed(3)}`;
            } else {
                const lapDiff = leader.laps - kart.laps;
                gap = `+${lapDiff} LAP${lapDiff > 1 ? 'S' : ''}`;
            }
        }
        
        // Calculate interval to car ahead
        let interval = '0.000';
        if (kart.position > 1) {
            const carAhead = sortedByPosition[kart.position - 2];
            if (kart.laps === carAhead.laps) {
                const intervalMs = kart.totalTime - carAhead.totalTime;
                interval = `+${(intervalMs / 1000).toFixed(3)}`;
            } else {
                const lapDiff = carAhead.laps - kart.laps;
                interval = `+${lapDiff} LAP${lapDiff > 1 ? 'S' : ''}`;
            }
        }
        
        const avgTime = kart.getAverageLapTime();
        
        return {
            pos: kart.position,
            kart_number: kart.kartNumber,
            kart_id: `KART-${kart.kartNumber}`,
            name: kart.driverName,
            driver_name: kart.driverName,
            last_time: kart.lastTime || '--.-',
            last_time_raw: kart.lastTimeRaw || 0,
            best_time: kart.bestTime || '--.-',
            best_time_raw: kart.bestTimeRaw || 0,
            avg_time: avgTime ? formatTime(avgTime) : '--.-',
            avg_time_raw: avgTime || 0,
            laps: kart.laps,
            total_laps: kart.laps,
            gap: gap,
            interval: interval,
            consistency: kart.getConsistency(),
            track_configuration_id: mockSession.trackConfigId
        };
    });
    
    return {
        data: {
            event_name: mockSession.eventName,
            session_name: `Mock Session - ${mockSession.sessionType}`,
            current_lap: mockSession.currentLap,
            total_laps: mockSession.maxLaps,
            time_left: timeLeft,
            track_configuration_id: mockSession.trackConfigId,
            runs: runs,
            timestamp: Date.now(),
            isMock: true  // Critical flag
        }
    };
}

/**
 * Start mock session
 * @param {Function} callback - Called with session data on each update
 * @param {Object} options - Session options
 */
export function startMockSession(callback, options = {}) {
    if (isRunning) {
        console.warn('⚠️ Mock session already running');
        return;
    }
    
    onDataCallback = callback;
    initializeMockSession(options);
    
    isRunning = true;
    
    // Send initial data immediately
    const initialData = generateSessionData();
    if (onDataCallback) {
        onDataCallback(initialData);
    }
    
    // Start update interval
    updateInterval = setInterval(updateMockSession, MOCK_CONFIG.UPDATE_INTERVAL);
    
    console.log('🎭 Mock session started');
}

/**
 * Stop mock session
 */
export function stopMockSession() {
    if (!isRunning) return;
    
    isRunning = false;
    
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
    
    console.log('🛑 Mock session stopped');
}

/**
 * Check if mock session is running
 */
export function isMockSessionRunning() {
    return isRunning;
}

/**
 * Get current mock session data
 */
export function getMockSession() {
    return mockSession;
}

/**
 * Update mock configuration
 */
export function updateMockConfig(newConfig) {
    Object.assign(MOCK_CONFIG, newConfig);
    console.log('🔧 Mock configuration updated:', newConfig);
}

/**
 * Get mock configuration
 */
export function getMockConfig() {
    return { ...MOCK_CONFIG };
}


