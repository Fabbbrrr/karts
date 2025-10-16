/**
 * Text-to-Speech (TTS) Utilities
 * 
 * PURPOSE: Provide voice feedback for lap times and gaps
 * WHY: Allows driver to keep eyes on track while receiving performance updates
 * FEATURE: Text-to-Speech, Voice Feedback, Accessibility
 */

/**
 * Check if TTS is supported by browser
 * 
 * PURPOSE: Determine if Web Speech API is available
 * WHY: Not all browsers support speech synthesis
 * HOW: Checks for speechSynthesis in window object
 * FEATURE: TTS Support Detection, Browser Compatibility
 * 
 * @returns {boolean} True if TTS is supported
 */
export function isTTSSupported() {
    return 'speechSynthesis' in window;
}

/**
 * Speak text using TTS with cancellation of previous speech
 * 
 * PURPOSE: Convert text to speech for driver feedback
 * WHY: Hands-free feedback while racing
 * HOW: Uses Web Speech API, cancels previous speech to avoid queue buildup
 * FEATURE: Text-to-Speech, Voice Feedback
 * 
 * @param {string} text - Text to speak
 * @param {Object} [options={}] - Speech options (rate, pitch, volume)
 * @returns {void}
 */
export function speak(text, options = {}) {
    if (!isTTSSupported()) {
        console.warn('⚠️ TTS not supported in this browser');
        return;
    }
    
    // Cancel any ongoing speech to avoid queue buildup
    // WHY: Only the latest lap time is relevant
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure speech parameters
    utterance.rate = options.rate || 1.1; // Slightly faster than normal for brevity
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 0.8; // Not too loud
    utterance.lang = options.lang || 'en-US';
    
    // Error handling
    utterance.onerror = (event) => {
        console.error('TTS error:', event.error);
    };
    
    window.speechSynthesis.speak(utterance);
}

/**
 * Stop any ongoing speech
 * 
 * PURPOSE: Cancel current TTS playback
 * WHY: User may want to silence the feedback
 * HOW: Calls speechSynthesis.cancel()
 * FEATURE: TTS Control
 * 
 * @returns {void}
 */
export function stopSpeaking() {
    if (isTTSSupported()) {
        window.speechSynthesis.cancel();
    }
}

/**
 * Format lap time for natural speech
 * 
 * PURPOSE: Convert lap time string to speakable format
 * WHY: "30.916" should be spoken as "30 point 9 seconds" not "thirty thousand"
 * HOW: Parses time string and formats for natural speech
 * FEATURE: TTS Formatting, Natural Language
 * 
 * @param {string} lapTime - Lap time string (e.g., "30.916")
 * @returns {string} Speakable format
 */
export function formatLapTimeForSpeech(lapTime) {
    if (!lapTime || lapTime === '--.-' || lapTime === '-') {
        return '';
    }
    
    // Parse MM:SS.mmm or SS.mmm format
    const parts = lapTime.split(':');
    let seconds, decimals;
    
    if (parts.length === 2) {
        // MM:SS.mmm format
        const minutes = parseInt(parts[0], 10);
        const secParts = parts[1].split('.');
        seconds = parseInt(secParts[0], 10);
        decimals = secParts[1] ? secParts[1].substring(0, 1) : '0'; // First decimal only
        
        if (minutes > 0) {
            return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ${seconds} point ${decimals} seconds`;
        }
    } else {
        // SS.mmm format
        const secParts = lapTime.split('.');
        seconds = parseInt(secParts[0], 10);
        decimals = secParts[1] ? secParts[1].substring(0, 1) : '0';
    }
    
    return `${seconds} point ${decimals} seconds`;
}

/**
 * Format gap for natural speech
 * 
 * PURPOSE: Convert gap string to speakable format
 * WHY: "+0.532" should be spoken as "plus 0.5 seconds"
 * HOW: Parses gap and formats for concise speech
 * FEATURE: TTS Formatting, Natural Language
 * 
 * @param {string} gap - Gap string (e.g., "+0.532", "-0.124")
 * @returns {string} Speakable format
 */
export function formatGapForSpeech(gap) {
    if (!gap || gap === '-' || gap === '--.-') {
        return '';
    }
    
    // Parse gap value
    const isPositive = gap.startsWith('+');
    const isNegative = gap.startsWith('-');
    const value = parseFloat(gap.replace('+', '').replace('-', ''));
    
    if (isNaN(value)) {
        return '';
    }
    
    // Round to one decimal for speech brevity
    const rounded = Math.abs(value).toFixed(1);
    
    if (isPositive) {
        return `plus ${rounded} seconds`;
    } else if (isNegative) {
        return `minus ${rounded} seconds`;
    } else {
        return `${rounded} seconds`;
    }
}

/**
 * Announce lap time with gaps (comprehensive race feedback)
 * 
 * PURPOSE: Provide complete lap performance feedback via voice
 * WHY: Driver gets all critical info without looking at screen
 * HOW: Combines lap time, gap to best, gap to PB, gap to P1 into single announcement
 * FEATURE: Lap Announcement, Voice Feedback, Race Performance
 * 
 * @param {Object} data - Lap announcement data
 * @param {string} data.lapTime - Lap time (e.g., "30.916")
 * @param {string} [data.gapToBest] - Gap to session best (e.g., "+0.532")
 * @param {string} [data.gapToPB] - Gap to personal best (e.g., "-0.124")
 * @param {string} [data.gapToP1] - Gap to leader (e.g., "+2.5")
 * @param {boolean} [data.isBestLap=false] - True if this is session best lap
 * @returns {void}
 */
export function announceLap(data) {
    const parts = [];
    
    // Lap time
    const lapTimeSpeech = formatLapTimeForSpeech(data.lapTime);
    if (lapTimeSpeech) {
        parts.push(lapTimeSpeech);
    }
    
    // Best lap celebration
    if (data.isBestLap) {
        parts.push('Best lap!');
    }
    
    // Gap to session best
    if (data.gapToBest && data.gapToBest !== '-' && !data.isBestLap) {
        const gapSpeech = formatGapForSpeech(data.gapToBest);
        if (gapSpeech) {
            parts.push(gapSpeech);
        }
    }
    
    // Gap to personal best
    if (data.gapToPB && data.gapToPB !== '-') {
        const pbGapSpeech = formatGapForSpeech(data.gapToPB);
        if (pbGapSpeech) {
            parts.push(`PB ${pbGapSpeech}`);
        }
    }
    
    // Gap to P1
    if (data.gapToP1 && data.gapToP1 !== '-' && data.gapToP1 !== 'LEADER') {
        const p1GapSpeech = formatGapForSpeech(data.gapToP1);
        if (p1GapSpeech) {
            parts.push(`to leader ${p1GapSpeech}`);
        }
    }
    
    // Speak combined announcement
    if (parts.length > 0) {
        speak(parts.join(', '));
    }
}

/**
 * Test TTS with sample message
 * 
 * PURPOSE: Allow user to test TTS functionality
 * WHY: Users should verify TTS works before racing
 * HOW: Speaks a sample lap announcement
 * FEATURE: TTS Testing, User Experience
 * 
 * @returns {void}
 */
export function testTTS() {
    if (!isTTSSupported()) {
        alert('Text-to-Speech is not supported in your browser');
        return;
    }
    
    announceLap({
        lapTime: '30.5',
        gapToBest: '+0.2',
        gapToPB: '-0.1',
        gapToP1: '+1.5'
    });
}

