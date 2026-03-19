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
                    val parsed = RaceDataMapper.parse(raw)
                    if (parsed != null) {
                        _sessionData.tryEmit(parsed)
                    }
                }

                s.connect()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialise socket", e)
        }
    }

    fun disconnect() {
        socket?.let { s ->
            s.off()       // remove all listeners
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
