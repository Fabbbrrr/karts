package com.raceface.wear.domain.model

data class GpsPoint(
    val lat: Double,
    val lng: Double,
    val speedMs: Float,       // metres/second (Doppler-derived — accurate to ±0.1–0.3 m/s)
    val accuracy: Float,      // positional accuracy in metres
    val timestampMs: Long,
    val lapNumber: Int = 0,
)
