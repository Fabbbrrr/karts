package com.raceface.wear.data.repository

import com.raceface.wear.data.local.DataStoreManager
import com.raceface.wear.data.remote.SocketIOClient
import com.raceface.wear.domain.model.ConnectionState
import com.raceface.wear.domain.model.DriverRun
import com.raceface.wear.domain.model.LapComparison
import com.raceface.wear.domain.model.SessionData
import com.raceface.wear.domain.usecase.RaceMath
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RaceRepository @Inject constructor(
    private val socketClient: SocketIOClient,
    val dataStore: DataStoreManager,
) {
    /** Raw session data from the socket (SharedFlow, replays last value). */
    val sessionDataFlow: SharedFlow<SessionData> = socketClient.sessionData

    /** Live connection state. */
    val isConnected: StateFlow<Boolean> = socketClient.isConnected

    val connectionState: Flow<ConnectionState> = socketClient.isConnected.map { connected ->
        if (connected) ConnectionState.CONNECTED else ConnectionState.DISCONNECTED
    }

    fun connect(channel: String) = socketClient.connect(channel)
    fun reconnect()              = socketClient.reconnect()
    fun disconnect()             = socketClient.disconnect()

    fun getDriver(kartNumber: String, session: SessionData): DriverRun? =
        session.runs.find { it.kartNumber == kartNumber }

    fun buildComparison(myRun: DriverRun, mateRun: DriverRun): LapComparison {
        val closingMs = if (myRun.lapTimes.size >= 6 && mateRun.lapTimes.size >= 6) {
            RaceMath.closingSpeedMs(myRun.lapTimes) - RaceMath.closingSpeedMs(mateRun.lapTimes)
        } else 0L

        return LapComparison(
            myRun          = myRun,
            mateRun        = mateRun,
            lastLapDeltaMs = myRun.lastTimeRaw - mateRun.lastTimeRaw,
            bestLapDeltaMs = myRun.bestTimeRaw - mateRun.bestTimeRaw,
            positionDelta  = myRun.position - mateRun.position,
            closingMs      = closingMs,
        )
    }
}
