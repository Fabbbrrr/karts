package com.raceface.wear.domain.usecase

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

enum class HapticEvent {
    LAP_COMPLETED,   // normal lap — single sharp pulse
    PERSONAL_BEST,   // PB for my kart — double pulse
    SESSION_BEST,    // best lap in the whole session — triple pulse
    INCIDENT,        // lap flagged as incident — long-short-short
    CONNECTED,       // socket connected — single soft tap
    DISCONNECTED,    // socket disconnected — single long pulse
}

class HapticManager(context: Context) {

    private val vibrator: Vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val vm = context.getSystemService(VibratorManager::class.java)
        vm.defaultVibrator
    } else {
        @Suppress("DEPRECATION")
        context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }

    fun fire(event: HapticEvent) {
        if (!vibrator.hasVibrator()) return
        val effect = when (event) {
            // Single sharp 80 ms pulse
            HapticEvent.LAP_COMPLETED -> VibrationEffect.createWaveform(
                longArrayOf(0, 80),
                intArrayOf(0, 200),
                -1
            )
            // Double pulse: 150 ms · 60 ms gap · 100 ms
            HapticEvent.PERSONAL_BEST -> VibrationEffect.createWaveform(
                longArrayOf(0, 150, 60, 100),
                intArrayOf(0, 220, 0, 180),
                -1
            )
            // Triple pulse: 150 · 60 gap · 150 · 60 gap · 100
            HapticEvent.SESSION_BEST -> VibrationEffect.createWaveform(
                longArrayOf(0, 150, 60, 150, 60, 100),
                intArrayOf(0, 255, 0, 255, 0, 200),
                -1
            )
            // Long-short-short: 250 · 80 gap · 80 · 80 gap · 80
            HapticEvent.INCIDENT -> VibrationEffect.createWaveform(
                longArrayOf(0, 250, 80, 80, 80, 80),
                intArrayOf(0, 255, 0, 180, 0, 180),
                -1
            )
            // Soft single 50 ms tap
            HapticEvent.CONNECTED -> VibrationEffect.createWaveform(
                longArrayOf(0, 50),
                intArrayOf(0, 120),
                -1
            )
            // Long single 300 ms pulse
            HapticEvent.DISCONNECTED -> VibrationEffect.createWaveform(
                longArrayOf(0, 300),
                intArrayOf(0, 200),
                -1
            )
        }
        vibrator.vibrate(effect)
    }
}
