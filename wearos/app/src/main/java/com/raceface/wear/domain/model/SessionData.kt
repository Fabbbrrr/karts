package com.raceface.wear.domain.model

data class SessionData(
    val runs: List<DriverRun>,
    val eventName: String,
    val sessionName: String,
    val currentLap: Int,
    val totalLaps: Int,
)

data class DriverRun(
    val kartNumber: String,
    val driverName: String,
    val position: Int,
    val laps: Int,
    val lastTimeRaw: Long,          // milliseconds
    val lastTimeFormatted: String,  // "SS.mmm" or "M:SS.mmm"
    val bestTimeRaw: Long,
    val bestTimeFormatted: String,
    val avgLapRaw: Long,            // milliseconds
    val lapTimes: List<Long>,       // individual lap times in ms
    val gap: String,                // "+4.195" or "—"
    val interval: String,           // "+0.5" or "—"
    val track: String,
)

data class LapComparison(
    val myRun: DriverRun,
    val mateRun: DriverRun,
    // positive = mate is faster (I'm slower), negative = I'm faster
    val lastLapDeltaMs: Long,
    val bestLapDeltaMs: Long,
    // positive = I'm behind mate in position standings
    val positionDelta: Int,
    val closingMs: Long,            // trend: negative = closing, positive = losing ground
)

enum class ConnectionState { CONNECTING, CONNECTED, DISCONNECTED }

data class HudUiState(
    val myRun: DriverRun? = null,
    val mateRun: DriverRun? = null,
    val sessionData: SessionData? = null,
    val connection: ConnectionState = ConnectionState.CONNECTING,
    val lastLapColor: LapColor = LapColor.NORMAL,
    val lapHistory: List<LapEntry> = emptyList(),
    val exportState: ExportState = ExportState.IDLE,
)

data class LapEntry(
    val lapNumber: Int,
    val timeMs: Long,
    val timeFormatted: String,
    val deltaMs: Long,           // vs best lap
    val deltaFormatted: String,
    val color: LapColor,
)

enum class LapColor { BEST_SESSION, PERSONAL_BEST, INCIDENT, NORMAL }

/** Tracks the state of a race export POST to Google Sheets. */
enum class ExportState { IDLE, SENDING, SUCCESS, ERROR }
