// Karting Live Timer - Audio Utilities
// Sound effects and audio feedback for app events

let audioContext = null;

/**
 * Initialize the Web Audio API context
 * @returns {AudioContext|null} The audio context or null if unavailable
 */
export function initializeAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('🔊 Audio context initialized');
        return audioContext;
    } catch (err) {
        console.error('Audio initialization error:', err);
        return null;
    }
}

/**
 * Get the current audio context
 * @returns {AudioContext|null} The audio context
 */
export function getAudioContext() {
    return audioContext;
}

/**
 * Set the audio context (for external initialization)
 * @param {AudioContext} context - The audio context to set
 */
export function setAudioContext(context) {
    audioContext = context;
}

/**
 * Play a sound alert
 * @param {number} frequency - Frequency in Hz (e.g., 440 for A4)
 * @param {number} duration - Duration in seconds
 * @param {string} type - Oscillator type: 'sine', 'square', 'sawtooth', 'triangle'
 * @param {boolean} enabled - Whether sound is enabled
 */
export function playSound(frequency, duration, type = 'sine', enabled = true) {
    if (!audioContext || !enabled) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (err) {
        console.error('Sound playback error:', err);
    }
}

/**
 * Play a sequence of notes (melody)
 * @param {Array} notes - Array of {frequency, duration} objects
 * @param {boolean} enabled - Whether sound is enabled
 */
export function playMelody(notes, enabled = true) {
    if (!audioContext || !enabled || !notes || notes.length === 0) return;
    
    let startTime = audioContext.currentTime;
    
    notes.forEach((note, index) => {
        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = note.frequency;
            oscillator.type = note.type || 'sine';
            
            gainNode.gain.setValueAtTime(0.3, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + note.duration);
            
            startTime += note.duration;
        } catch (err) {
            console.error('Melody note playback error:', err);
        }
    });
}

/**
 * Play a best lap celebration sound
 * @param {boolean} enabled - Whether sound is enabled
 */
export function playBestLapCelebration(enabled = true) {
    const melody = [
        { frequency: 523, duration: 0.15 },  // C5
        { frequency: 659, duration: 0.15 },  // E5
        { frequency: 784, duration: 0.3 }    // G5
    ];
    playMelody(melody, enabled);
}

/**
 * Play a proximity alert sound
 * @param {boolean} enabled - Whether sound is enabled
 */
export function playProximityAlert(enabled = true) {
    playSound(880, 0.2, 'square', enabled);
}

/**
 * Play a position change sound
 * @param {boolean} improved - True if position improved (moved up)
 * @param {boolean} enabled - Whether sound is enabled
 */
export function playPositionChange(improved, enabled = true) {
    if (improved) {
        playSound(660, 0.2, 'sine', enabled); // Higher note for improvement
    } else {
        playSound(440, 0.2, 'sine', enabled); // Lower note for decline
    }
}

/**
 * Vibrate device (if supported)
 * @param {number|Array} pattern - Vibration pattern in milliseconds
 */
export function vibrate(pattern) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

/**
 * Celebration haptic feedback (vibration + sound)
 * @param {boolean} soundEnabled - Whether sound is enabled
 */
export function celebrateWithHaptics(soundEnabled = true) {
    vibrate([100, 50, 100, 50, 200]);
    playBestLapCelebration(soundEnabled);
}

