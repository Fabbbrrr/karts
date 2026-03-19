package com.raceface.wear.presentation.screens.trackmap

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.wear.compose.material.Text
import com.raceface.wear.domain.model.GpsPoint
import com.raceface.wear.presentation.theme.*
import kotlin.math.cos
import kotlin.math.max

@Composable
fun TrackMapScreen(state: TrackMapUiState, viewModel: TrackMapViewModel) {
    val context = LocalContext.current

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) viewModel.startTracking() else viewModel.onPermissionDenied()
    }

    // Auto-request permission on first composition
    LaunchedEffect(Unit) {
        val hasPermission = ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        if (hasPermission) {
            viewModel.startTracking()
        } else {
            permissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundBlack),
        contentAlignment = Alignment.Center,
    ) {
        when {
            !state.hasGpsPermission && !state.isTracking -> GpsPermissionDeniedContent()
            state.isTracking && state.lapPoints.isEmpty() -> GpsAcquiringContent()
            else -> TrackMapContent(state = state, onLapSelect = viewModel::selectLap)
        }
    }
}

@Composable
private fun GpsPermissionDeniedContent() {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = Modifier.padding(16.dp),
    ) {
        Text(
            text      = "GPS NEEDED",
            color     = Color.White,
            fontSize  = 14.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(6.dp))
        Text(
            text      = "Grant location access in Settings",
            color     = TextMuted2,
            fontSize  = 11.sp,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun GpsAcquiringContent() {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = Modifier.padding(16.dp),
    ) {
        Text(
            text      = "ACQUIRING GPS",
            color     = RaceFacerAmber,
            fontSize  = 12.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text      = "Move to open sky",
            color     = TextMuted2,
            fontSize  = 10.sp,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun TrackMapContent(
    state: TrackMapUiState,
    onLapSelect: (Int) -> Unit,
) {
    // Determine which points to show
    val visiblePoints: List<GpsPoint> = remember(state.lapPoints, state.selectedLap) {
        if (state.selectedLap == -1) {
            state.lapPoints.values.flatten()
        } else {
            state.lapPoints[state.selectedLap] ?: emptyList()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        // Title + lap indicator
        Text(
            text      = "TRACK",
            color     = TextMuted,
            fontSize  = 9.sp,
            fontWeight = FontWeight.Medium,
            letterSpacing = 1.5.sp,
        )

        val lapLabel = if (state.selectedLap == -1) "ALL LAPS" else "LAP ${state.selectedLap}"
        Text(
            text     = lapLabel,
            color    = TextMuted2,
            fontSize = 10.sp,
        )

        Spacer(Modifier.height(4.dp))

        // Canvas heatmap — fills most of the screen
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(horizontal = 8.dp),
            contentAlignment = Alignment.Center,
        ) {
            if (visiblePoints.size >= 2) {
                TrackHeatmapCanvas(points = visiblePoints)
            } else {
                Text(
                    text    = "…",
                    color   = TextMuted,
                    fontSize = 24.sp,
                )
            }
        }

        // Speed legend — red → yellow → green
        SpeedLegend()

        Spacer(Modifier.height(4.dp))

        // Lap selector pills
        val lapNumbers = state.lapPoints.keys.sorted()
        if (lapNumbers.isNotEmpty()) {
            LapSelectorRow(
                lapNumbers   = lapNumbers,
                selectedLap  = state.selectedLap,
                onLapSelect  = onLapSelect,
            )
        }
    }
}

@Composable
private fun TrackHeatmapCanvas(points: List<GpsPoint>) {
    // Cache normalised offsets — recompute only when points list changes
    val normalised = remember(points) { normalisePoints(points) }
    val speeds     = remember(points) { points.map { it.speedMs } }
    val minSpeed   = remember(speeds) { (speeds.minOrNull() ?: 0f) }
    val maxSpeed   = remember(speeds) {
        val raw = speeds.maxOrNull() ?: 1f
        // Ensure minimum range of 3 m/s (~11 km/h) to avoid flat colouring on short samples
        max(raw, minSpeed + 3f)
    }

    androidx.compose.foundation.Canvas(
        modifier = Modifier
            .fillMaxSize()
            .clip(RoundedCornerShape(50))  // circular clip for round watch
    ) {
        if (normalised.size < 2) return@Canvas

        val canvasWidth  = size.width
        val canvasHeight = size.height

        // Scale normalised [0,1] coords to canvas pixels
        val scaled = normalised.map { (nx, ny) ->
            Offset(nx * canvasWidth, ny * canvasHeight)
        }

        // Draw thin background track outline (all points, dark grey)
        for (i in 0 until scaled.size - 1) {
            drawLine(
                color       = Color(0xFF333333),
                start       = scaled[i],
                end         = scaled[i + 1],
                strokeWidth = 10f,
                cap         = StrokeCap.Round,
            )
        }

        // Draw speed heatmap segments on top
        for (i in 0 until scaled.size - 1) {
            val speed = speeds.getOrElse(i) { 0f }
            drawLine(
                color       = speedColor(speed, minSpeed, maxSpeed),
                start       = scaled[i],
                end         = scaled[i + 1],
                strokeWidth = 6f,
                cap         = StrokeCap.Round,
            )
        }

        // Start/finish dot (white)
        scaled.firstOrNull()?.let { start ->
            drawCircle(
                color  = Color.White,
                radius = 8f,
                center = start,
            )
        }

        // Current position dot (bright green)
        scaled.lastOrNull()?.let { last ->
            drawCircle(
                color  = RaceFacerGreen,
                radius = 6f,
                center = last,
            )
        }
    }
}

/**
 * Normalise lat/lng points to [0, 1] canvas coordinates with margin.
 *
 * Uses cos(lat) correction so that 1° longitude = proportionally correct
 * distance vs 1° latitude (avoids horizontal squashing at high latitudes).
 */
private fun normalisePoints(points: List<GpsPoint>): List<Pair<Float, Float>> {
    if (points.size < 2) return emptyList()

    val minLat = points.minOf { it.lat }
    val maxLat = points.maxOf { it.lat }
    val minLng = points.minOf { it.lng }
    val maxLng = points.maxOf { it.lng }

    val latRange = maxLat - minLat
    val lngRange = maxLng - minLng

    // cos(lat) correction — longitude spans less real distance at higher latitudes
    val midLat = (minLat + maxLat) / 2.0
    val lngCorrected = lngRange * cos(Math.toRadians(midLat))

    val dataRange = max(latRange, lngCorrected).takeIf { it > 0 } ?: 1.0
    val margin = 0.08  // 8% margin on each side

    return points.map { p ->
        val nx = (margin + (p.lng - minLng) * cos(Math.toRadians(midLat)) / dataRange * (1.0 - 2 * margin)).toFloat()
        val ny = (margin + (maxLat - p.lat) / dataRange * (1.0 - 2 * margin)).toFloat()  // Y flipped
        nx to ny
    }
}

/**
 * Map a speed value to a colour on the red → yellow → green gradient.
 *
 * t=0 (slow/braking) → red
 * t=0.5 (mid-speed)  → yellow
 * t=1 (full throttle) → green
 */
private fun speedColor(speed: Float, minSpeed: Float, maxSpeed: Float): Color {
    val t = ((speed - minSpeed) / (maxSpeed - minSpeed)).coerceIn(0f, 1f)
    return if (t < 0.5f) {
        lerp(Color.Red, Color.Yellow, t * 2f)
    } else {
        lerp(Color.Yellow, RaceFacerGreen, (t - 0.5f) * 2f)
    }
}

@Composable
private fun SpeedLegend() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(text = "SLOW", color = Color.Red, fontSize = 8.sp, letterSpacing = 0.5.sp)
        // Gradient bar drawn with Canvas
        androidx.compose.foundation.Canvas(
            modifier = Modifier
                .weight(1f)
                .height(4.dp)
                .padding(horizontal = 4.dp)
        ) {
            val steps = 20
            val segWidth = size.width / steps
            val barHeight = size.height
            for (i in 0 until steps) {
                val t = i / steps.toFloat()
                val color = if (t < 0.5f) lerp(Color.Red, Color.Yellow, t * 2f)
                            else lerp(Color.Yellow, RaceFacerGreen, (t - 0.5f) * 2f)
                drawRect(
                    color   = color,
                    topLeft = Offset(i * segWidth, 0f),
                    size    = Size(segWidth, barHeight),
                )
            }
        }
        Text(text = "FAST", color = RaceFacerGreen, fontSize = 8.sp, letterSpacing = 0.5.sp)
    }
}

@Composable
private fun LapSelectorRow(
    lapNumbers: List<Int>,
    selectedLap: Int,
    onLapSelect: (Int) -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp, Alignment.CenterHorizontally),
    ) {
        // "ALL" pill
        LapPill(
            label     = "ALL",
            selected  = selectedLap == -1,
            onClick   = { onLapSelect(-1) },
        )
        // Show last 3 laps to avoid overflow on small screen
        lapNumbers.takeLast(3).forEach { lap ->
            LapPill(
                label    = "$lap",
                selected = selectedLap == lap,
                onClick  = { onLapSelect(lap) },
            )
        }
    }
}

@Composable
private fun LapPill(label: String, selected: Boolean, onClick: () -> Unit) {
    val bg    = if (selected) RaceFacerGreen.copy(alpha = 0.25f) else SurfaceDark
    val color = if (selected) RaceFacerGreen else TextMuted2
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(10.dp))
            .background(bg)
            .clickable { onClick() }
            .padding(horizontal = 8.dp, vertical = 4.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text       = label,
            color      = color,
            fontSize   = 10.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}
