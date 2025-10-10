// Karting Live Timer - Storage Service
// Centralized localStorage management for all app data

const STORAGE_KEYS = {
    SETTINGS: 'kartingTimerSettings',
    PERSONAL_RECORDS: 'kartingPersonalRecords',
    DRIVER_NOTES: 'karting-driver-notes',
    RECORDED_SESSIONS: 'karting-recorded-sessions',
    KART_ANALYSIS: 'kartAnalysisData',
    KART_ANALYSIS_BACKUP: 'kartAnalysisBackup',
    KART_ANALYSIS_AUTO_BACKUP: 'kartAnalysisAutoBackup'
};

/**
 * Generic localStorage getter with error handling
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Parsed value or default
 */
function getItem(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error loading ${key}:`, error);
        return defaultValue;
    }
}

/**
 * Generic localStorage setter with error handling
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be JSON stringified)
 * @returns {boolean} True if successful
 */
function setItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Error saving ${key}:`, error);
        if (error.name === 'QuotaExceededError') {
            console.warn('⚠️ LocalStorage quota exceeded. Consider exporting your data.');
        }
        return false;
    }
}

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 */
function removeItem(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error(`Error removing ${key}:`, error);
        return false;
    }
}

/**
 * Clear all app data from localStorage
 */
export function clearAllStorage() {
    Object.values(STORAGE_KEYS).forEach(key => {
        removeItem(key);
    });
}

// ==================
// Settings
// ==================

export function loadSettings(defaultSettings) {
    const saved = getItem(STORAGE_KEYS.SETTINGS, null);
    return saved ? { ...defaultSettings, ...saved } : { ...defaultSettings };
}

export function saveSettings(settings) {
    return setItem(STORAGE_KEYS.SETTINGS, settings);
}

// ==================
// Personal Records
// ==================

export function loadPersonalRecords() {
    return getItem(STORAGE_KEYS.PERSONAL_RECORDS, {});
}

export function savePersonalRecords(records) {
    return setItem(STORAGE_KEYS.PERSONAL_RECORDS, records);
}

// ==================
// Driver Notes
// ==================

export function loadDriverNotes() {
    return getItem(STORAGE_KEYS.DRIVER_NOTES, {});
}

export function saveDriverNotes(notes) {
    return setItem(STORAGE_KEYS.DRIVER_NOTES, notes);
}

// ==================
// Recorded Sessions
// ==================

export function loadRecordedSessions() {
    const sessions = getItem(STORAGE_KEYS.RECORDED_SESSIONS, []);
    console.log(`📼 Loaded ${sessions.length} recorded sessions`);
    return sessions;
}

export function saveRecordedSession(sessionRecord, maxSessions = 20) {
    let sessions = loadRecordedSessions();
    
    // Check if session already exists
    const existingIndex = sessions.findIndex(s => s.id === sessionRecord.id);
    if (existingIndex >= 0) {
        sessions[existingIndex] = sessionRecord;
    } else {
        sessions.unshift(sessionRecord); // Add to beginning
    }
    
    // Keep only last N sessions
    sessions = sessions.slice(0, maxSessions);
    
    const success = setItem(STORAGE_KEYS.RECORDED_SESSIONS, sessions);
    
    if (success) {
        console.log(`📼 Session recorded: ${sessionRecord.eventName} (${new Date(sessionRecord.timestamp).toLocaleString()})`);
    }
    
    return success;
}

export function deleteRecordedSession(sessionId) {
    let sessions = loadRecordedSessions();
    sessions = sessions.filter(s => s.id !== sessionId);
    return setItem(STORAGE_KEYS.RECORDED_SESSIONS, sessions);
}

// ==================
// Kart Analysis Data
// ==================

export function loadKartAnalysisData() {
    return getItem(STORAGE_KEYS.KART_ANALYSIS, {
        laps: [],
        drivers: {},
        karts: {},
        sessions: {}
    });
}

export function saveKartAnalysisData(data) {
    // Save primary data
    const success = setItem(STORAGE_KEYS.KART_ANALYSIS, data);
    
    // Also save recovery backup with metadata
    const backupData = {
        data: data,
        timestamp: Date.now(),
        lapCount: data.laps?.length || 0
    };
    setItem(STORAGE_KEYS.KART_ANALYSIS_BACKUP, backupData);
    
    return success;
}

export function saveKartAnalysisAutoBackup(data) {
    const backupData = {
        data: data,
        timestamp: Date.now(),
        lapCount: data.laps?.length || 0,
        autoBackup: true
    };
    
    const success = setItem(STORAGE_KEYS.KART_ANALYSIS_AUTO_BACKUP, backupData);
    
    if (success) {
        console.log(`✅ Auto-backup completed: ${backupData.lapCount} laps saved`);
    }
    
    return success;
}

export function loadKartAnalysisBackup() {
    return getItem(STORAGE_KEYS.KART_ANALYSIS_BACKUP, null);
}

export function loadKartAnalysisAutoBackup() {
    return getItem(STORAGE_KEYS.KART_ANALYSIS_AUTO_BACKUP, null);
}

export function clearKartAnalysisData() {
    removeItem(STORAGE_KEYS.KART_ANALYSIS);
    removeItem(STORAGE_KEYS.KART_ANALYSIS_BACKUP);
    removeItem(STORAGE_KEYS.KART_ANALYSIS_AUTO_BACKUP);
}

// ==================
// Storage Info
// ==================

/**
 * Get storage usage information
 * @returns {Object} Storage usage stats
 */
export function getStorageInfo() {
    const info = {};
    let totalSize = 0;
    
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
        try {
            const item = localStorage.getItem(key);
            const size = item ? new Blob([item]).size : 0;
            info[name] = {
                key,
                size,
                sizeKB: (size / 1024).toFixed(2),
                exists: !!item
            };
            totalSize += size;
        } catch (error) {
            info[name] = { key, size: 0, exists: false, error: error.message };
        }
    });
    
    info.total = {
        size: totalSize,
        sizeKB: (totalSize / 1024).toFixed(2),
        sizeMB: (totalSize / (1024 * 1024)).toFixed(2)
    };
    
    return info;
}

/**
 * Check if storage is available
 * @returns {boolean} True if localStorage is available
 */
export function isStorageAvailable() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

export { STORAGE_KEYS };

