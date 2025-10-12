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
    // Save primary data only (backup disabled to save storage quota)
    const success = setItem(STORAGE_KEYS.KART_ANALYSIS, data);
    
    // Backup removed to prevent quota issues - use manual export instead
    // const backupData = {
    //     data: data,
    //     timestamp: Date.now(),
    //     lapCount: data.laps?.length || 0
    // };
    // setItem(STORAGE_KEYS.KART_ANALYSIS_BACKUP, backupData);
    
    return success;
}

export function saveKartAnalysisAutoBackup(data) {
    // Auto-backup disabled to prevent quota exceeded errors
    // Use manual export functionality instead
    console.log(`ℹ️ Auto-backup disabled (use manual export). ${data.laps?.length || 0} laps in memory.`);
    return true;
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

/**
 * Export kart analysis data as downloadable JSON
 * @param {Object} analysisData - Kart analysis data to export
 */
export function exportKartAnalysisData(analysisData) {
    const exportData = {
        version: '2.0',
        exportDate: new Date().toISOString(),
        dataType: 'kartAnalysis',
        data: analysisData
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `kart-analysis-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    console.log('✅ Kart analysis data exported:', exportFileDefaultName);
}

/**
 * Import kart analysis data from file
 * @param {File} file - File object to import
 * @param {Object} currentData - Current analysis data
 * @param {string} mergeMode - 'ask', 'merge', or 'replace'
 * @returns {Promise<Object>} Imported/merged analysis data
 */
export function importKartAnalysisData(file, currentData, mergeMode = 'ask') {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validate structure
                if (!importedData.data || !importedData.data.laps) {
                    throw new Error('Invalid kart analysis data format');
                }
                
                const imported = importedData.data;
                
                // Determine merge strategy
                let finalData;
                
                if (currentData.laps.length === 0) {
                    // No existing data, just use imported
                    finalData = imported;
                    console.log('📥 Imported kart analysis data (no existing data)');
                } else if (mergeMode === 'replace') {
                    // Replace existing data
                    finalData = imported;
                    console.log('📥 Replaced kart analysis data');
                } else if (mergeMode === 'merge') {
                    // Merge data
                    finalData = mergeKartAnalysisData(currentData, imported);
                    console.log('📥 Merged kart analysis data');
                } else {
                    // Ask user
                    const choice = confirm(
                        `You have ${currentData.laps.length} existing laps.\n` +
                        `The file contains ${imported.laps.length} laps.\n\n` +
                        `Click OK to MERGE data (keep both)\n` +
                        `Click Cancel to REPLACE existing data with imported data`
                    );
                    
                    if (choice) {
                        finalData = mergeKartAnalysisData(currentData, imported);
                        console.log('📥 Merged kart analysis data');
                    } else {
                        finalData = imported;
                        console.log('📥 Replaced kart analysis data');
                    }
                }
                
                resolve(finalData);
                
            } catch (error) {
                console.error('❌ Import error:', error);
                reject(error);
                alert('Error importing data: ' + error.message);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Error reading file'));
        };
        
        reader.readAsText(file);
    });
}

/**
 * Merge two kart analysis datasets
 * @param {Object} current - Current data
 * @param {Object} imported - Imported data
 * @returns {Object} Merged data
 */
function mergeKartAnalysisData(current, imported) {
    const merged = {
        laps: [...current.laps, ...imported.laps],
        drivers: { ...current.drivers },
        karts: { ...current.karts },
        sessions: { ...current.sessions, ...imported.sessions }
    };
    
    // Merge driver stats
    Object.entries(imported.drivers).forEach(([driverName, driverData]) => {
        if (merged.drivers[driverName]) {
            // Merge existing driver
            const existing = merged.drivers[driverName];
            existing.totalLaps += driverData.totalLaps;
            existing.totalTime += driverData.totalTime;
            existing.bestLap = Math.min(existing.bestLap, driverData.bestLap);
            existing.lapTimes = [...(existing.lapTimes || []), ...(driverData.lapTimes || [])];
            
            // Merge kart history
            Object.entries(driverData.kartHistory || {}).forEach(([kartNum, laps]) => {
                existing.kartHistory[kartNum] = (existing.kartHistory[kartNum] || 0) + laps;
            });
            
            // Merge karts list
            (driverData.karts || []).forEach(kart => {
                if (!existing.karts.includes(kart)) {
                    existing.karts.push(kart);
                }
            });
        } else {
            // New driver
            merged.drivers[driverName] = { ...driverData };
        }
    });
    
    // Merge kart stats
    Object.entries(imported.karts).forEach(([kartNumber, kartData]) => {
        if (merged.karts[kartNumber]) {
            // Merge existing kart
            const existing = merged.karts[kartNumber];
            existing.totalLaps += kartData.totalLaps;
            existing.totalTime += kartData.totalTime;
            existing.bestLap = Math.min(existing.bestLap, kartData.bestLap);
            existing.worstLap = Math.max(existing.worstLap, kartData.worstLap);
            existing.lapTimes = [...(existing.lapTimes || []), ...(kartData.lapTimes || [])];
            
            // Merge driver history
            Object.entries(kartData.driverHistory || {}).forEach(([driverName, laps]) => {
                existing.driverHistory[driverName] = (existing.driverHistory[driverName] || 0) + laps;
            });
            
            // Merge drivers list
            (kartData.drivers || []).forEach(driver => {
                if (!existing.drivers.includes(driver)) {
                    existing.drivers.push(driver);
                }
            });
        } else {
            // New kart
            merged.karts[kartNumber] = { ...kartData };
        }
    });
    
    return merged;
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
 * Get kart analysis storage status with warnings
 * @returns {Object} Storage status and warnings
 */
export function getKartAnalysisStorageStatus() {
    const data = loadKartAnalysisData();
    const lapCount = data.laps?.length || 0;
    const sessionCount = Object.keys(data.sessions || {}).length;
    
    // Estimate storage size (optimized: ~200 bytes per lap + metadata)
    const estimatedLapSize = lapCount * 200;
    const estimatedKartSize = Object.keys(data.karts || {}).length * 300;
    const estimatedDriverSize = Object.keys(data.drivers || {}).length * 350;
    const estimatedSize = estimatedLapSize + estimatedKartSize + estimatedDriverSize;
    const estimatedMB = (estimatedSize / (1024 * 1024)).toFixed(2);
    
    // Determine zone and warning level
    const SAFARI_LIMIT = 5 * 1024 * 1024; // 5MB
    const percentOfLimit = ((estimatedSize / SAFARI_LIMIT) * 100).toFixed(1);
    
    let zone = 'green';
    let message = '';
    let action = null;
    
    if (sessionCount > 140 || estimatedSize > 7 * 1024 * 1024) {
        zone = 'red';
        message = `Storage ${percentOfLimit}% full! ${sessionCount} sessions stored. Auto-cleanup will maintain 140 sessions.`;
        action = 'export_recommended';
    } else if (sessionCount > 100 || estimatedSize > 5 * 1024 * 1024) {
        zone = 'orange';
        message = `${sessionCount} sessions stored (${estimatedMB} MB). Consider exporting data for backup.`;
        action = 'export_suggested';
    } else if (sessionCount > 70 || estimatedSize > 3.5 * 1024 * 1024) {
        zone = 'yellow';
        message = `${sessionCount} sessions stored. Storage is healthy.`;
        action = 'none';
    } else {
        zone = 'green';
        message = `${sessionCount} sessions stored. Plenty of storage available.`;
        action = 'none';
    }
    
    return {
        lapCount,
        sessionCount,
        kartCount: Object.keys(data.karts || {}).length,
        driverCount: Object.keys(data.drivers || {}).length,
        estimatedSize,
        estimatedMB,
        percentOfLimit: parseFloat(percentOfLimit),
        zone,
        message,
        action
    };
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

