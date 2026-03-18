package com.raceface.wear.domain.usecase

import com.raceface.wear.domain.model.LapColor
import com.raceface.wear.domain.model.LapEntry
import kotlin.math.abs
import kotlin.math.sqrt

object RaceMath {

    /** Laps longer than this are pit stops / incidents and excluded from averages. */
    const val LAP_THRESHOLD_MS = 60_000L

    /** A lap 30%+ slower than the trimmed average is an incident. */
    private const val INCIDENT_MULTIPLIER = 1.30

    /** Ported from calculations.js — standard deviation → 0-100 score (100 = most consistent). */
    fun consistency(lapTimes: List<Long>): Int {
        val valid = lapTimes.filter { it in 1 until LAP_THRESHOLD_MS }
        if (valid.size < 2) return 0
        val avg = valid.average()
        val variance = valid.sumOf { (it - avg) * (it - avg) } / valid.size
        val stdDev = sqrt(variance)
        val score = 100.0 - (stdDev / avg * 100.0)
        return score.toInt().coerceIn(0, 100)
    }

    /** Format milliseconds as "SS.mmm" or "M:SS.mmm" matching the web app. */
    fun formatTime(ms: Long): String {
        if (ms <= 0) return "---.---"
        val mins = ms / 60_000L
        val secs = (ms % 60_000L) / 1000.0
        return if (mins > 0) "%d:%06.3f".format(mins, secs)
        else "%06.3f".format(secs)
    }

    /** Format a delta in milliseconds as "+0.388" or "-0.388". */
    fun formatDelta(ms: Long): String {
        val secs = ms / 1000.0
        return if (secs >= 0) "+%.3f".format(secs) else "%.3f".format(secs)
    }

    /** Detect if a lap is an incident (ported from incident-detector.js). */
    fun isIncident(lapMs: Long, lapTimes: List<Long>): Boolean {
        val valid = lapTimes.filter { it in 1 until LAP_THRESHOLD_MS }
        if (valid.size < 3) return false
        val baseline = trimmedMean(valid)
        return lapMs > baseline * INCIDENT_MULTIPLIER
    }

    /** Trimmed mean: excludes bottom 10% and top 10% of values. */
    private fun trimmedMean(times: List<Long>): Double {
        val sorted = times.sorted()
        val trim = (sorted.size * 0.1).toInt().coerceAtLeast(1)
        val trimmed = sorted.drop(trim).dropLast(trim)
        return if (trimmed.isEmpty()) sorted.average() else trimmed.average()
    }

    /** Count incidents in a lap history. */
    fun incidentCount(lapTimes: List<Long>): Int =
        lapTimes.count { isIncident(it, lapTimes) }

    /** Build a LapEntry list from a full list of lap times and the session best. */
    fun buildLapHistory(
        lapTimes: List<Long>,
        sessionBestMs: Long,
        personalBestMs: Long,
    ): List<LapEntry> {
        val validBest = lapTimes.filter { it in 1 until LAP_THRESHOLD_MS }.minOrNull() ?: 0L
        return lapTimes.reversed().mapIndexed { revIdx, ms ->
            val lapNumber = lapTimes.size - revIdx
            val deltaMs = if (validBest > 0) ms - validBest else 0L
            val color = when {
                ms >= LAP_THRESHOLD_MS          -> LapColor.INCIDENT
                isIncident(ms, lapTimes)        -> LapColor.INCIDENT
                ms == sessionBestMs             -> LapColor.BEST_SESSION
                ms == personalBestMs            -> LapColor.PERSONAL_BEST
                else                            -> LapColor.NORMAL
            }
            LapEntry(
                lapNumber      = lapNumber,
                timeMs         = ms,
                timeFormatted  = formatTime(ms),
                deltaMs        = deltaMs,
                deltaFormatted = formatDelta(deltaMs),
                color          = color,
            )
        }
    }

    /** Average of valid laps. */
    fun avgLap(lapTimes: List<Long>): Long {
        val valid = lapTimes.filter { it in 1 until LAP_THRESHOLD_MS }
        return if (valid.isEmpty()) 0L else valid.average().toLong()
    }

    /** Closing speed: compare last 3-lap average to prior 3-lap average. Negative = closing. */
    fun closingSpeedMs(lapTimes: List<Long>): Long {
        if (lapTimes.size < 6) return 0L
        val recent = lapTimes.takeLast(3).filter { it in 1 until LAP_THRESHOLD_MS }
        val prior  = lapTimes.dropLast(3).takeLast(3).filter { it in 1 until LAP_THRESHOLD_MS }
        if (recent.isEmpty() || prior.isEmpty()) return 0L
        return recent.average().toLong() - prior.average().toLong()
    }
}
