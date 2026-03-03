// MANUAL DATA RECOVERY SCRIPT
// Copy and paste this entire script into your browser console (F12)

console.log('🔄 Starting manual data recovery...');

// Step 1: Load backup
const autoBackup = localStorage.getItem('kartAnalysisAutoBackup');
const regularBackup = localStorage.getItem('kartAnalysisBackup');

let backup = null;
if (autoBackup) {
    backup = JSON.parse(autoBackup);
    console.log('✅ Found auto-backup:', {
        lapCount: backup.data?.laps?.length || 0,
        timestamp: new Date(backup.timestamp).toLocaleString()
    });
} else if (regularBackup) {
    backup = JSON.parse(regularBackup);
    console.log('✅ Found regular backup:', {
        lapCount: backup.data?.laps?.length || 0,
        timestamp: new Date(backup.timestamp).toLocaleString()
    });
} else {
    console.error('❌ No backup found!');
}

if (!backup || !backup.data || !backup.data.laps) {
    console.error('❌ Invalid backup structure');
} else {
    const data = backup.data;
    console.log('📊 Backup data:', {
        laps: data.laps.length,
        karts: Object.keys(data.karts || {}).length,
        drivers: Object.keys(data.drivers || {}).length,
        sessions: Object.keys(data.sessions || {}).length
    });
    
    // Step 2: Rebuild aggregations from laps
    console.log('🔨 Rebuilding karts and drivers from laps...');
    
    const karts = {};
    const drivers = {};
    
    data.laps.forEach((lap, index) => {
        if (index % 1000 === 0) console.log(`Processing lap ${index}/${data.laps.length}...`);
        
        // Rebuild kart stats
        if (!karts[lap.kartNumber]) {
            karts[lap.kartNumber] = {
                totalLaps: 0,
                bestLap: Infinity,
                worstLap: 0,
                totalTime: 0,
                drivers: [],
                driverHistory: {}
            };
        }
        
        const kart = karts[lap.kartNumber];
        kart.totalLaps++;
        kart.bestLap = Math.min(kart.bestLap, lap.lapTimeRaw);
        kart.worstLap = Math.max(kart.worstLap, lap.lapTimeRaw);
        kart.totalTime += lap.lapTimeRaw;
        
        if (!kart.drivers.includes(lap.driverName)) {
            kart.drivers.push(lap.driverName);
        }
        kart.driverHistory[lap.driverName] = (kart.driverHistory[lap.driverName] || 0) + 1;
        
        // Rebuild driver stats
        if (!drivers[lap.driverName]) {
            drivers[lap.driverName] = {
                totalLaps: 0,
                totalTime: 0,
                bestLap: Infinity,
                karts: [],
                kartHistory: {}
            };
        }
        
        const driver = drivers[lap.driverName];
        driver.totalLaps++;
        driver.totalTime += lap.lapTimeRaw;
        driver.bestLap = Math.min(driver.bestLap, lap.lapTimeRaw);
        
        if (!driver.karts.includes(lap.kartNumber)) {
            driver.karts.push(lap.kartNumber);
        }
        driver.kartHistory[lap.kartNumber] = (driver.kartHistory[lap.kartNumber] || 0) + 1;
    });
    
    console.log('✅ Rebuilt:', {
        karts: Object.keys(karts).length,
        drivers: Object.keys(drivers).length
    });
    
    // Step 3: Create complete data structure
    const recoveredData = {
        laps: data.laps,
        karts: karts,
        drivers: drivers,
        sessions: data.sessions || {}
    };
    
    // Step 4: Save to localStorage
    console.log('💾 Saving to localStorage...');
    localStorage.setItem('kartAnalysisData', JSON.stringify(recoveredData));
    
    console.log('✅ Recovery complete!');
    console.log('📊 Final stats:', {
        laps: recoveredData.laps.length,
        karts: Object.keys(recoveredData.karts).length,
        drivers: Object.keys(recoveredData.drivers).length,
        sessions: Object.keys(recoveredData.sessions).length
    });
    
    console.log('🔄 Reloading page...');
    setTimeout(() => location.reload(), 1000);
}


