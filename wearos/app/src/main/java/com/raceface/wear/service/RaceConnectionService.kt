package com.raceface.wear.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.raceface.wear.MainActivity
import com.raceface.wear.R
import com.raceface.wear.data.repository.RaceRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class RaceConnectionService : Service() {

    @Inject lateinit var repository: RaceRepository

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    companion object {
        const val CHANNEL_ID = "raceface_live"
        const val NOTIF_ID   = 1001
        const val ACTION_RECONNECT = "com.raceface.wear.RECONNECT"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        // minSdk = 30 (Android 11) — must specify service types when calling startForeground.
        // Only DATA_SYNC here; location tracking runs from the Activity (TrackMapScreen)
        // after the user grants ACCESS_FINE_LOCATION — starting with LOCATION type before
        // permission is granted crashes with SecurityException on fresh installs.
        startForeground(
            NOTIF_ID,
            buildNotification("Connecting…"),
            ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC,
        )
        startConnection()
    }

    private fun startConnection() {
        serviceScope.launch {
            val channel = repository.dataStore.channel.first()
            repository.connect(channel)

            // Update notification when connection state changes
            repository.isConnected.collect { connected ->
                val text = if (connected) "Connected · Receiving data" else "Disconnected — retrying…"
                val notifManager = getSystemService(NotificationManager::class.java)
                notifManager.notify(NOTIF_ID, buildNotification(text))
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_RECONNECT) {
            serviceScope.launch { repository.reconnect() }
        }
        return START_STICKY   // restart if killed
    }

    override fun onDestroy() {
        repository.disconnect()
        serviceScope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun buildNotification(statusText: String): Notification {
        val tapIntent = Intent(this, MainActivity::class.java).let {
            PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_IMMUTABLE)
        }
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("RaceFacer Live")
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(tapIntent)
            .setOngoing(true)
            .build()
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Live Race Connection",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Shows while RaceFacer is connected to a live session"
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }
}
