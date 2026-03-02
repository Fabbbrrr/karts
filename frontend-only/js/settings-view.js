// Frontend Only - Settings View
// Configuration panel for frontend-only operation

export const SettingsView = {
    isOpen: false,

    /**
     * Open settings panel
     */
    open() {
        this.isOpen = true;
        
        // Create or update settings panel
        let panel = document.querySelector('.settings-panel');
        if (!panel) {
            panel = this.createSettingsPanel();
            document.body.appendChild(panel);
        }
        
        panel.classList.add('open');
    },

    /**
     * Close settings panel
     */
    close() {
        this.isOpen = false;
        const panel = document.querySelector('.settings-panel');
        if (panel) {
            panel.classList.remove('open');
        }
    },

    /**
     * Create settings panel HTML
     */
    createSettingsPanel() {
        const panel = document.createElement('div');
        panel.className = 'settings-panel';
        
        panel.innerHTML = `
            <div class="settings-content">
                <h3>⚙️ Settings</h3>
                
                <!-- Connection Settings -->
                <div class="setting-item">
                    <label class="setting-label">Auto Connect to RaceFacer</label>
                    <input type="checkbox" id="auto-connect" checked>
                    <small class="text-secondary">Automatically connect to live timing on startup</small>
                </div>
                
                <!-- Main Driver Settings -->
                <div class="setting-item">
                    <label class="setting-label">Main Driver Kart Number</label>
                    <input type="number" id="main-driver" placeholder="Enter kart number" style="width: 100%; padding: 0.5rem; margin-bottom: 0.5rem; border-radius: 4px; border: 1px solid #333; background: #222; color: white;">
                    <small class="text-secondary">Select your kart for quick access</small>
                </div>
                
                <!-- Display Settings -->
                <div class="setting-item">
                    <label class="setting-label">Display Mode</label>
                    <select id="display-mode" style="width: 100%; padding: 0.5rem; margin-bottom: 0.5rem; border-radius: 4px; border: 1px solid #333; background: #222; color: white;">
                        <option value="normal">Normal</option>
                        <option value="contrast">High Contrast (Sunlight)</option>
                        <option value="battery">Battery Saving</option>
                    </select>
                </div>
                
                <!-- Audio Settings -->
                <div class="setting-item">
                    <label class="setting-label">Enable Audio Alerts</label>
                    <input type="checkbox" id="audio-enabled" checked>
                </div>
                
                <!-- Vibration Settings -->
                <div class="setting-item">
                    <label class="setting-label">Enable Haptic Feedback</label>
                    <input type="checkbox" id="vibration-enabled" checked>
                </div>
                
                <!-- Data Storage Info -->
                <div class="setting-item" style="background: rgba(0, 255, 136, 0.1);">
                    <h4>💾 Storage Information</h4>
                    <p id="storage-info" class="text-secondary">Loading storage info...</p>
                </div>
                
                <!-- Actions -->
                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <button class="btn btn-primary" onclick="SettingsView.save()" style="flex: 1;">Save & Close</button>
                    <button class="btn btn-secondary" onclick="SettingsView.close()">Cancel</button>
                </div>
            </div>
        `;
        
        return panel;
    },

    /**
     * Save settings and close panel
     */
    save() {
        const autoConnect = document.getElementById('auto-connect').checked;
        const mainDriver = document.getElementById('main-driver').value;
        const displayMode = document.getElementById('display-mode').value;
        const audioEnabled = document.getElementById('audio-enabled').checked;
        const vibrationEnabled = document.getElementById('vibration-enabled').checked;

        // Update app state
        window.AppState = window.AppState || {
            settings: {
                autoConnect: true,
                mainDriver: null,
                displayMode: 'normal',
                audioEnabled: true,
                vibrationEnabled: true
            }
        };

        window.AppState.settings.autoConnect = autoConnect;
        window.AppState.settings.mainDriver = mainDriver || null;
        window.AppState.settings.displayMode = displayMode;
        window.AppState.settings.audioEnabled = audioEnabled;
        window.AppState.settings.vibrationEnabled = vibrationEnabled;

        // Apply display mode changes
        this.applyDisplayMode(displayMode);

        // Save to localStorage
        try {
            localStorage.setItem('settings', JSON.stringify(window.AppState.settings));
            
            if (mainDriver) {
                localStorage.setItem('mainDriver', mainDriver);
            }
            
            console.log('✅ Settings saved');
        } catch (error) {
            console.error('❌ Error saving settings:', error);
        }

        // Close panel
        this.close();
    },

    /**
     * Apply display mode changes
     */
    applyDisplayMode(mode) {
        const body = document.body;
        
        // Remove all mode classes
        body.classList.remove('sunlight-mode', 'battery-saving');
        
        switch (mode) {
            case 'contrast':
                body.classList.add('sunlight-mode');
                break;
            case 'battery':
                body.classList.add('battery-saving');
                break;
            default:
                // Normal mode - no special classes
                break;
        }
    },

    /**
     * Update storage info display
     */
    updateStorageInfo() {
        const storageInfo = document.getElementById('storage-info');
        if (!storageInfo) return;

        try {
            // Calculate used storage
            let totalUsed = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                if (value) {
                    totalUsed += value.length;
                }
            }

            // Convert to KB/MB
            let displaySize = (totalUsed / 1024).toFixed(2) + ' KB';
            if (totalUsed > 1024 * 1024) {
                displaySize = ((totalUsed / 1024) / 1024).toFixed(2) + ' MB';
            }

            storageInfo.textContent = `Used: ${displaySize} of ~5MB limit`;
        } catch (error) {
            storageInfo.textContent = 'Error calculating storage';
        }
    },

    /**
     * Initialize settings panel
     */
    init() {
        // Add click handler to close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.isOpen) return;
            
            const panel = document.querySelector('.settings-panel');
            const settingsBtn = document.querySelector('.settings-btn');
            
            if (panel && !panel.contains(e.target) && e.target !== settingsBtn) {
                this.close();
            }
        });

        // Update storage info periodically
        setInterval(() => this.updateStorageInfo(), 5000);
    }
};

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => SettingsView.init());
}
