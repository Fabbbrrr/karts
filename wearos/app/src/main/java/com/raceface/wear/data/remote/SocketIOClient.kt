package com.raceface.wear.data.remote

import android.util.Log
import com.raceface.wear.domain.model.SessionData
import io.socket.client.IO
import io.socket.client.Socket
import io.socket.engineio.client.transports.WebSocket
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import java.net.URI
import javax.inject.Inject
import javax.inject.Singleton

private const val TAG = "SocketIOClient"
private const val SOCKET_URL = "https://live.racefacer.com:3123"

@Singleton
class SocketIOClient @Inject constructor() {

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    private val _sessionData = MutableSharedFlow<SessionData>(replay = 1)
    val sessionData: SharedFlow<SessionData> = _sessionData.asSharedFlow()

    private var socket: Socket? = null
    private var currentChannel: String = "lemansentertainment"

    // Accumulated lap times per kart — the server does NOT send a lap_times array;
    // we build it ourselves by detecting when total_laps increases, same as the web frontend.
    private val accumulatedLapTimes = mutableMapOf<String, MutableList<Long>>()
    private val lastKnownLapCount  = mutableMapOf<String, Int>()
    private var lastSessionKey = ""

    fun connect(channel: String = currentChannel) {
        currentChannel = channel
        disconnect()

        try {
            val options = IO.Options().apply {
                transports = arrayOf(WebSocket.NAME)
                reconnection = true
                reconnectionAttempts = Int.MAX_VALUE
                reconnectionDelay = 2000
                reconnectionDelayMax = 30_000
            }

            socket = IO.socket(URI.create(SOCKET_URL), options).also { s ->
                s.on(Socket.EVENT_CONNECT) {
                    Log.d(TAG, "Connected — joining channel '$currentChannel'")
                    _isConnected.value = true
                    s.emit("join", currentChannel)
                }

                s.on(Socket.EVENT_DISCONNECT) { args ->
                    Log.d(TAG, "Disconnected: ${args.firstOrNull()}")
                    _isConnected.value = false
                }

                s.on(Socket.EVENT_CONNECT_ERROR) { args ->
                    Log.w(TAG, "Connect error: ${args.firstOrNull()}")
                    _isConnected.value = false
                }

                s.on(currentChannel) { args ->
                    val raw = args.firstOrNull() ?: return@on
                    val parsed = RaceDataMapper.parse(raw) ?: return@on
                    _sessionData.tryEmit(accumulate(parsed))
                }

                s.connect()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialise socket", e)
        }
    }

    /**
     * Accumulate per-kart lap times in memory.
     *
     * The live.racefacer.com server does not include a `lap_times` array in its
     * payload (the web frontend builds lap history the same way by tracking
     * `total_laps` changes). Each time `run.laps` increases we record `lastTimeRaw`
     * as the completed lap time — exactly matching the JS lap-tracker.service.js logic.
     */
    private fun accumulate(session: SessionData): SessionData {
        // Detect session change and reset accumulated state
        val sessionKey = "${session.eventName}_${session.sessionName}"
        if (sessionKey != lastSessionKey && lastSessionKey.isNotEmpty()) {
            Log.d(TAG, "New session detected — resetting lap history")
            accumulatedLapTimes.clear()
            lastKnownLapCount.clear()
        }
        lastSessionKey = sessionKey

        val updatedRuns = session.runs.map { run ->
            val kart    = run.kartNumber
            val history = accumulatedLapTimes.getOrPut(kart) { mutableListOf() }
            val prev    = lastKnownLapCount[kart] ?: 0

            if (run.laps > prev && run.lastTimeRaw > 0) {
                history.add(run.lastTimeRaw)
                // Mirror the web frontend cap of 20 laps (keep last 20)
                if (history.size > 20) history.removeAt(0)
                lastKnownLapCount[kart] = run.laps
            }

            run.copy(lapTimes = history.toList())
        }

        return session.copy(runs = updatedRuns)
    }

    fun disconnect() {
        socket?.let { s ->
            s.off()
            s.disconnect()
            s.close()
        }
        socket = null
        _isConnected.value = false
    }

    fun reconnect() {
        connect(currentChannel)
    }
}
