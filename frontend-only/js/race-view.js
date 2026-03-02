// Frontend Only - Race View
// Works directly with WebSocket data (no server required)

/**
 * Render the race tab with all drivers, positions, and timing
 * Optimized for mobile browser use in karting
 */
export const RaceView = {
    // Track collapsed state (persists across updates)
    trackCollapsedState: {
        'Lakeside': false,
        'Penrite': false,
        'Mushroom': false,
        'Rimo': false
    },

    /**
     * Detect track from kart name
     */
    getTrackFromKart(run) {
        const kartName = run.kart || '';
        const firstChar = String(kartName).charAt(0).toUpperCase();
        
        if (firstChar === 'M') return 'Mushroom';
        if (firstChar === 'P') return 'Penrite';
        if (firstChar === 'E') return 'Rimo';
        
        // Numeric or no prefix = Lakeside (Super Karts)
        return 'Lakeside';
    },

    /**
     * Get track color for pill styling
     */
    getTrackColor(trackName) {
        const colors = {
            'Lakeside': '#ffffff',  // White - Super Karts
            'Penrite': '#808080',   // Grey - Sprint Karts
            'Mushroom': '#ff0000',  // Red - Mini Karts (kids)
            'Rimo': '#ffaa00'       // Orange - Unknown/Rookie
        };
        return colors[trackName] || '#808080';
    },

    /**
     * Format lap time for display
     */
    formatLapTime(lapTime) {
        if (!lapTime && lapTime !== 0) return '-:-.-';
        
        const seconds = Math.floor(lapTime);
        const milliseconds = Math.round((lapTime - seconds) * 10);
        
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        
        return `${mins}:${secs.toString().padStart(2, '0')}.${milliseconds}`;
    },

    /**
     * Update race view with session data
     */
    update(sessionData) {
        if (!sessionData || !sessionData.runs) {
            console.warn('No valid session data for race view');
            return;
        }

        const raceContainer = document.querySelector('[data-section="race"] .mobile-content');
        if (!raceContainer) return;

        // Get and filter drivers
        let runs = Array.isArray(sessionData.runs) ? sessionData.runs : [];
        
        // Sort by position
        runs.sort((a, b) => (a.pos || 999) - (b.pos || 999));

        if (runs.length === 0) {
            raceContainer.innerHTML = '<div class="text-center text-secondary p-3">Waiting for data...</div>';
            return;
        }

        // Group by track for collapsible sections
        const groups = this.groupByTrack(runs);

        let html = '';
        
        Object.entries(groups).forEach(([trackName, drivers]) => {
            const collapsed = this.trackCollapsedState[trackName] ? 'collapsed' : '';
            const trackColor = this.getTrackColor(trackName);

            html += `
                <div class="card">
                    <div class="card-header" onclick="RaceView.toggleTrack('${trackName}')">
                        <span style="color: ${trackColor}">${trackName}</span>
                        <small>(${drivers.length} karts)</small>
                        <span class="float-right">${this.getExpandIcon(trackName)}</span>
                    </div>
                    
                    <div class="driver-list" style="display: ${this.trackCollapsedState[trackName] ? 'none' : 'block'}">
                        ${drivers.map(driver => this.renderDriverCard(driver, sessionData)).join('')}
                    </div>
                </div>
            `;
        });

        raceContainer.innerHTML = html || '<div class="text-center text-secondary p-3">No data available</div>';
    },

    /**
     * Group drivers by track
     */
    groupByTrack(runs) {
        const groups = {};
        
        runs.forEach(run => {
            if (!run.kart_number && !run.name) return;
            
            const trackName = this.getTrackFromKart(run);
            
            if (!groups[trackName]) {
                groups[trackName] = [];
            }
            
            groups[trackName].push(run);
        });

        // Sort drivers within each group by position
        Object.keys(groups).forEach(track => {
            groups[track].sort((a, b) => (a.pos || 999) - (b.pos || 999));
        });

        return groups;
    },

    /**
     * Render individual driver card
     */
    renderDriverCard(driver, sessionData) {
        if (!driver) return '';

        const kartNumber = driver.kart_number || driver.name || 'Unknown';
        const driverName = driver.name || 'Unknown Driver';
        const position = driver.pos || '-';
        const lapTime = this.formatLapTime(driver.last_time_raw);
        const totalLaps = driver.total_laps || 0;

        // Determine if this is the selected driver
        const selectedClass = sessionData?.settings?.mainDriver === kartNumber ? 'selected' : '';

        return `
            <div class="driver-item ${selectedClass}" onclick="RaceView.onDriverSelect('${kartNumber}')">
                <div class="driver-info">
                    <span class="driver-name">${driverName}</span>
                    <span class="driver-position">#${position}</span>
                </div>
                <div class="driver-lap-time">${lapTime}</div>
                <small class="text-secondary">Laps: ${totalLaps}</small>
            </div>
        `;
    },

    /**
     * Handle driver selection
     */
    onDriverSelect(kartNumber) {
        console.log('Driver selected:', kartNumber);
        
        // Update main driver setting
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        settings.mainDriver = kartNumber;
        localStorage.setItem('settings', JSON.stringify(settings));
        
        // Refresh the view to show selection highlight
        this.update(window.sessionData);
    },

    /**
     * Toggle track group visibility
     */
    toggleTrack(trackName) {
        this.trackCollapsedState[trackName] = !this.trackCollapsedState[trackName];
        
        // Refresh view to show/hide collapsed sections
        if (window.sessionData) {
            this.update(window.sessionData);
        }
    },

    /**
     * Get expand/collapse icon
     */
    getExpandIcon(trackName) {
        return this.trackCollapsedState[trackName] ? '▼' : '▲';
    },

    /**
     * Initialize event listeners for race view
     */
    init() {
        // Add click handlers for driver selection
        document.addEventListener('click', (e) => {
            const driverItem = e.target.closest('.driver-item');
            if (driverItem && driverItem.dataset.kartNumber) {
                this.onDriverSelect(driverItem.dataset.kartNumber);
            }
        });
    }
};

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => RaceView.init());
}
