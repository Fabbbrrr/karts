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
import okhttp3.OkHttpClient
import java.net.URI
import java.util.concurrent.TimeUnit
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
            val okHttpClient = OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(0, TimeUnit.MINUTES)   // no read timeout (persistent connection)
                .build()

            val options = IO.Options.builder()
                .setTransports(arrayOf(WebSocket.NAME))
                .setReconnection(true)
                .setReconnectionAttempts(Int.MAX_VALUE)
                .setReconnectionDelay(2000)
                .setReconnectionDelayMax(30_000)
                .setWebSocketFactory(okHttpClient)
                .setCallFactory(okHttpClient)
                .build()

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
