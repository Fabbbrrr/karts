package com.raceface.wear.domain.usecase

import android.annotation.SuppressLint
import android.content.Context
import android.os.Looper
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.raceface.wear.domain.model.GpsPoint
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LocationTrackingManager @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val fusedClient = LocationServices.getFusedLocationProviderClient(context)

    private val _gpsFlow = MutableSharedFlow<GpsPoint>(replay = 0, extraBufferCapacity = 128)
    val gpsFlow: SharedFlow<GpsPoint> = _gpsFlow.asSharedFlow()

    // Exponential moving average for speed smoothing — reduces noise from poor fixes
    private var smoothedSpeed = 0f
    private var currentLapNumber = 0

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            val loc = result.lastLocation ?: return
            // Reject fixes with poor positional accuracy
            if (loc.accuracy > 15f) return
            if (!loc.hasSpeed()) return

            // EMA smooth the speed (α = 0.3 — responsive but noise-filtered)
            smoothedSpeed = 0.3f * loc.speed + 0.7f * smoothedSpeed

            _gpsFlow.tryEmit(
                GpsPoint(
                    lat         = loc.latitude,
                    lng         = loc.longitude,
                    speedMs     = smoothedSpeed,
                    accuracy    = loc.accuracy,
                    timestampMs = loc.time,
                    lapNumber   = currentLapNumber,
                )
            )
        }
    }

    /** Start GPS updates at 1 Hz with high accuracy (Doppler speed + positional). */
    @SuppressLint("MissingPermission")  // caller must verify ACCESS_FINE_LOCATION before calling
    fun startTracking() {
        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 1000L)
            .setMinUpdateIntervalMillis(500L)
            .setWaitForAccurateLocation(false)  // don't block on first fix
            .build()
        fusedClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper())
    }

    /** Notify the manager that the driver has completed a lap (increments lap number on points). */
    fun onNewLap(lapNumber: Int) {
        currentLapNumber = lapNumber
    }

    /** Stop GPS updates and reset state. Call when leaving the track map or ending a session. */
    fun stopTracking() {
        fusedClient.removeLocationUpdates(locationCallback)
        smoothedSpeed = 0f
        currentLapNumber = 0
    }
}
