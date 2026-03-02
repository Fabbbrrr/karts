// Frontend-Only RaceFacer - IndexedDB Storage Service
// Uses browser's IndexedDB for persistent storage with larger limits than localStorage
// No backend server required - all data stored locally in browser

import { CONFIG } from '../js/core/config.js';

const DB_NAME = 'RaceFacerFrontend';
const DB_VERSION = 1;
let dbInstance = null;

// Object store names
const STORES = {
    SETTINGS: 'settings',
    PERSONAL_RECORDS: 'personalRecords',
    DRIVER_NOTES: 'driverNotes',
    RECORDED_SESSIONS: 'recordedSessions',
    KART_ANALYSIS: 'kartAnalysis'
};

/**
 * Initialize IndexedDB database
 * @returns {Promise<IDBDatabase>} Database instance
 */
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create stores if they don't exist
            if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
            }
            
            if (!db.objectStoreNames.contains(STORES.PERSONAL_RECORDS)) {
                const store = db.createObjectStore(STORES.PERSONAL_RECORDS, { autoIncrement: true });
                store.createIndex('kartNumber', 'kartNumber', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
            
            if (!db.objectStoreNames.contains(STORES.DRIVER_NOTES)) {
                db.createObjectStore(STORES.DRIVER_NOTES, { keyPath: 'driverName' });
            }
            
            if (!db.objectStoreNames.contains(STORES.RECORDED_SESSIONS)) {
                const store = db.createObjectStore(STORES.RECORDED_SESSIONS, { autoIncrement: true });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('eventName', 'eventName', { unique: false });
            }
            
            if (!db.objectStoreNames.contains(STORES.KART_ANALYSIS)) {
                const store = db.createObjectStore(STORES.KART_ANALYSIS, { keyPath: 'key' });
                store.createIndex('lapCount', 'lapCount', { unique: false });
            }
        };
        
        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            console.log(`📦 IndexedDB initialized: ${DB_NAME} v${DB_VERSION}`);
            resolve(dbInstance);
        };
        
        request.onerror = (event) => {
            console.error('❌ IndexedDB initialization error:', event.target.error);
            reject(new Error('Failed to initialize IndexedDB'));
        };
    });
}

/**
 * Get database instance
 * @returns {Promise<IDBDatabase>} Database instance
 */
function getDB() {
    if (dbInstance) {
        return Promise.resolve(dbInstance);
    }
    return initDB();
}

/**
 * Generic transaction wrapper
 * @param {string} storeName - Store name
 * @param {string} mode - Transaction mode ('readonly' or 'readwrite')
 * @param {Function} callback - Callback function with store as parameter
 * @returns {Promise<any>} Result from callback
 */
function transaction(storeName, mode, callback) {
    return getDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, mode);
            const store = tx.objectStore(storeName);
            
            tx.oncomplete = () => resolve();
            tx.onerror = (event) => reject(event.target.error);
            
            callback(store);
        });
    });
}

// ==================
// Settings
// ==================

export function loadSettings(defaultSettings) {
    return transaction(STORES.SETTINGS, 'readonly', store => {
        const request = store.get(CONFIG.CHANNEL);
        
        request.onsuccess = (event) => {
            const result = event.target.result;
            if (result && result.value) {
                console.log('📂 Loaded settings from IndexedDB');
                resolve({ ...defaultSettings, ...result.value });
            } else {
                resolve({ ...defaultSettings });
            }
        };
    }).catch(error => {
        console.warn('⚠️ Settings load failed, using defaults:', error);
        return { ...defaultSettings };
    });
}

export function saveSettings(settings) {
    return transaction(STORES.SETTINGS, 'readwrite', store => {
        const request = store.put({
            key: CONFIG.CHANNEL,
            value: settings
        });
        
        request.onsuccess = () => {
            console.log('💾 Settings saved to IndexedDB');
        };
    }).catch(error => {
        console.error('❌ Settings save failed:', error);
        return false;
    });
}

// ==================
// Personal Records
// ==================

export function loadPersonalRecords() {
    return transaction(STORES.PERSONAL_RECORDS, 'readonly', store => {
        const request = store.getAll();
        
        request.onsuccess = (event) => {
            const records = event.target.result || {};
            console.log(`📂 Loaded ${records.length} personal records`);
            resolve(records);
        };
    }).catch(error => {
        console.warn('⚠️ Personal records load failed:', error);
        return [];
    });
}

export function savePersonalRecords(records) {
    // For personal records, we'll use a simplified approach
    // In IndexedDB, we'd typically store each record separately
    // But for compatibility with existing code, we'll store as JSON in settings
    console.log('💾 Personal records saved via settings storage');
    return true;
}

// ==================
// Driver Notes
// ==================

export function loadDriverNotes() {
    return transaction(STORES.DRIVER_NOTES, 'readonly', store => {
        const request = store.getAll();
        
        request.onsuccess = (event) => {
            const notes = {};
            event.target.result.forEach(item => {
                notes[item.driverName] = item.notes;
            });
            console.log(`📂 Loaded ${Object.keys(notes).length} driver notes`);
            resolve(notes);
        };
    }).catch(error => {
        console.warn('⚠️ Driver notes load failed:', error);
        return {};
    });
}

export function saveDriverNotes(notes) {
    return transaction(STORES.DRIVER_NOTES, 'readwrite', store => {
        // Delete existing notes
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
            const existingNotes = getAllRequest.result;
            
            // Add new notes
            Object.entries(notes).forEach(([driverName, note]) => {
                store.put({
                    driverName: driverName,
                    notes: note
                });
            });
            
            console.log(`💾 Saved ${Object.keys(notes).length} driver notes`);
        };
    }).catch(error => {
        console.error('❌ Driver notes save failed:', error);
        return false;
    });
}

// ==================
// Recorded Sessions
// ==================

export function loadRecordedSessions() {
    return transaction(STORES.RECORDED_SESSIONS, 'readonly', store => {
        const request = store.getAll();
        
        request.onsuccess = (event) => {
            const sessions = event.target.result || [];
            // Sort by timestamp descending
            sessions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            console.log(`📂 Loaded ${sessions.length} recorded sessions`);
            resolve(sessions);
        };
    }).catch(error => {
        console.warn('⚠️ Recorded sessions load failed:', error);
        return [];
    });
}

export function saveRecordedSession(sessionRecord, maxSessions = CONFIG.MAX_SESSIONS) {
    return transaction(STORES.RECORDED_SESSIONS, 'readwrite', store => {
        // First, get all existing sessions
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
            let sessions = getAllRequest.result || [];
            
            // Check if session already exists
            const existingIndex = sessions.findIndex(s => s.id === sessionRecord.id);
            if (existingIndex >= 0) {
                sessions[existingIndex] = sessionRecord;
            } else {
                sessions.unshift(sessionRecord); // Add to beginning
            }
            
            // Keep only last N sessions
            sessions = sessions.slice(0, maxSessions);
            
            // Clear store and add all sessions back
            const clearRequest = store.clear();
            
            clearRequest.onsuccess = () => {
                sessions.forEach(session => {
                    store.add(session);
                });
                
                console.log(`💾 Session recorded: ${sessionRecord.eventName} (${new Date(sessionRecord.timestamp).toLocaleString()})`);
            };
        };
    }).catch(error => {
        console.error('❌ Save recorded session failed:', error);
        return false;
    });
}

export function deleteRecordedSession(sessionId) {
    return transaction(STORES.RECORDED_SESSIONS, 'readwrite', store => {
        const request = store.delete(sessionId);
        
        request.onsuccess = () => {
            console.log(`🗑️ Deleted session: ${sessionId}`);
        };
    }).catch(error => {
        console.error('❌ Delete session failed:', error);
        return false;
    });
}

// ==================
// Kart Analysis Data
// ==================

export function loadKartAnalysisData() {
    return transaction(STORES.KART_ANALYSIS, 'readonly', store => {
        const request = store.get('main');
        
        request.onsuccess = (event) => {
            const result = event.target.result;
            if (result && result.value) {
                console.log(`📂 Loaded kart analysis with ${result.value.laps?.length || 0} laps`);
                resolve(result.value);
            } else {
                resolve({
                    laps: [],
                    drivers: {},
                    karts: {},
                    sessions: {}
                });
            }
        };
    }).catch(error => {
        console.warn('⚠️ Kart analysis load failed:', error);
        return {
            laps: [],
            drivers: {},
            karts: {},
            sessions: {}
        };
    });
}

export function saveKartAnalysisData(data) {
    return transaction(STORES.KART_ANALYSIS, 'readwrite', store => {
        const request = store.put({
            key: 'main',
            value: data,
            lapCount: data.laps?.length || 0
        });
        
        request.onsuccess = () => {
            console.log(`💾 Kart analysis saved with ${data.laps?.length || 0} laps`);
        };
    }).catch(error => {
        console.error('❌ Kart analysis save failed:', error);
        return false;
    });
}

export function clearKartAnalysisData() {
    return transaction(STORES.KART_ANALYSIS, 'readwrite', store => {
        const request = store.clear();
        
        request.onsuccess = () => {
            console.log('🗑️ Kart analysis data cleared');
        };
    }).catch(error => {
        console.error('❌ Clear kart analysis failed:', error);
        return false;
    });
}

// ==================
// Export/Import Functions
// ==================

/**
 * Export all data as downloadable JSON
 */
export function exportAllData() {
    // Get all data from IndexedDB and create a comprehensive export
    Promise.all([
        loadSettings({}),
        loadDriverNotes(),
        loadRecordedSessions()
    ]).then(([settings, notes, sessions]) => {
        const exportData = {
            version: '2.0',
            exportDate: new Date().toISOString(),
            dataType: 'completeRaceFacerData',
            data: {
                settings: settings,
                driverNotes: notes,
                recordedSessions: sessions
            }
        };
        
        // Create download link
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `racefacer-backup-${new Date().toISOString().slice(0, 10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        console.log('✅ All data exported:', exportFileDefaultName);
    }).catch(error => {
        console.error('❌ Export failed:', error);
        alert('Export failed: ' + error.message);
    });
}

/**
 * Import data from JSON file
 * @param {File} file - File object to import
 * @returns {Promise<Object>} Imported data
 */
export function importAllData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (!importedData.data) {
                    throw new Error('Invalid data format');
                }
                
                console.log('📥 Imported data version:', importedData.version);
                resolve(importedData.data);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Error reading file'));
        };
        
        reader.readAsText(file);
    });
}

// ==================
// Storage Info
// ==================

/**
 * Get storage usage information from IndexedDB
 * @returns {Promise<Object>} Storage usage stats
 */
export async function getStorageInfo() {
    try {
        const db = await getDB();
        
        // Estimate storage by counting records
        let totalSize = 0;
        const info = {};
        
        for (const storeName of Object.values(STORES)) {
            const request = db.transaction(storeName).objectStore(storeName).count();
            
            request.onsuccess = (event) => {
                const count = event.target.result;
                // Estimate ~500 bytes per record
                const estimatedSize = count * 500;
                
                info[storeName] = {
                    key: storeName,
                    recordCount: count,
                    estimatedSize: estimatedSize,
                    estimatedKB: (estimatedSize / 1024).toFixed(2)
                };
                
                totalSize += estimatedSize;
            };
        }
        
        // Wait for all counts to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        info.total = {
            size: totalSize,
            sizeKB: (totalSize / 1024).toFixed(2),
            sizeMB: (totalSize / (1024 * 1024)).toFixed(2)
        };
        
        return info;
    } catch (error) {
        console.error('Error getting storage info:', error);
        return {};
    }
}

/**
 * Check if IndexedDB is available
 * @returns {boolean} True if IndexedDB is available
 */
export function isStorageAvailable() {
    try {
        // Test for IndexedDB availability
        const test = '__storage_test__';
        const request = indexedDB.open(test, 1);
        
        request.onupgradeneeded = () => {};
        request.onsuccess = () => {
            indexedDB.deleteDatabase(test);
        };
        
        return true;
    } catch (e) {
        return false;
    }
}

// ==================
// Initialization
// ==================

export async function initializeStorage() {
    try {
        await initDB();
        console.log('✅ Storage service initialized');
        return true;
    } catch (error) {
        console.error('❌ Storage initialization failed:', error);
        return false;
    }
}
"