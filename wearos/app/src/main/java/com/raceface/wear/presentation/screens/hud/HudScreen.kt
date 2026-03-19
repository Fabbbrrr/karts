package com.raceface.wear.presentation.screens.hud

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.ScalingLazyListAnchorType
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material.Text
import com.raceface.wear.domain.model.ConnectionState
import com.raceface.wear.domain.model.DriverRun
import com.raceface.wear.domain.model.HudUiState
import com.raceface.wear.domain.model.LapColor
import com.raceface.wear.domain.usecase.RaceMath
import com.raceface.wear.presentation.theme.*

@Composable
fun HudScreen(
    state: HudUiState,
    onPickerClick: () -> Unit,
    onPickMate: () -> Unit = {},
    onLapHistory: () -> Unit,
    onCompare: () -> Unit,
    onSettings: () -> Unit,
    onTrackMap: () -> Unit = {},
) {
    // Keep the display at full brightness for the entire session — no ambient
    // dimming, no OS timeout. The driver needs to glance at the watch without
    // lifting their wrist, so the screen must always be on and readable.
    val view = LocalView.current
    DisposableEffect(Unit) {
        view.keepScreenOn = true
        onDispose { view.keepScreenOn = false }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundBlack),
        contentAlignment = Alignment.Center,
    ) {
        if (state.myRun == null) {
            // Kart was picked but session data hasn't arrived yet.
            // Should only flash for a fraction of a second.
            Text(
                text      = "Waiting for data\u2026",
                color     = TextMuted,
                fontSize  = 14.sp,
                textAlign = TextAlign.Center,
            )
        } else {
            HudContent(
                state        = state,
                myRun        = state.myRun,
                onLapHistory = onLapHistory,
                onPickMate   = onPickMate,
                onCompare    = onCompare,
                onSettings   = onSettings,
                onRepick     = onPickerClick,
                onTrackMap   = onTrackMap,
            )
        }
    }
}

@Composable
private fun HudContent(
    state: HudUiState,
    myRun: DriverRun,
    onLapHistory: () -> Unit,
    onPickMate: () -> Unit,
    onCompare: () -> Unit,
    onSettings: () -> Unit,
    onRepick: () -> Unit,
    onTrackMap: () -> Unit,
) {
    val listState = rememberScalingLazyListState()

    ScalingLazyColumn(
        state          = listState,
        anchorType     = ScalingLazyListAnchorType.ItemCenter,
        modifier       = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        // ── Status bar ──────────────────────────────────────────────────
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                PositionBadge(position = myRun.position)

                Text(
                    text       = myRun.kartNumber,
                    color      = RaceFacerGreen,
                    fontSize   = 11.sp,
                    fontWeight = FontWeight.Bold,
                )

                ConnectionDot(state.connection)
            }
        }

        // ── LAST LAP — hero ─────────────────────────────────────────────
        item {
            val lastLapColor = when (state.lastLapColor) {
                LapColor.BEST_SESSION  -> RaceFacerGreen
                LapColor.PERSONAL_BEST -> RaceFacerPurple
                LapColor.INCIDENT      -> RaceFacerRed
                LapColor.NORMAL        -> RaceFacerAmber
            }

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                SectionLabel("LAST LAP")

                Text(
                    text          = myRun.lastTimeFormatted.ifBlank { "---.---" },
                    color         = lastLapColor,
                    fontSize      = 48.sp,
                    fontWeight    = FontWeight.ExtraBold,
                    fontFamily    = Mono,
                    letterSpacing = (-1).sp,
                    lineHeight    = 48.sp,
                )

                if (myRun.lapTimes.isNotEmpty() && myRun.lastTimeRaw > 0 && myRun.bestTimeRaw > 0) {
                    val delta = myRun.lastTimeRaw - myRun.bestTimeRaw
                    val deltaColor = if (delta <= 0) RaceFacerGreen else TextMuted2
                    Text(
                        text       = RaceMath.formatDelta(delta) + " to best",
                        color      = deltaColor,
                        fontSize   = 12.sp,
                        fontFamily = Mono,
                    )
                }
            }
        }

        // ── Mini stat cards ─────────────────────────────────────────────
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                MiniCard(
                    label    = "BEST",
                    value    = myRun.bestTimeFormatted,
                    modifier = Modifier.weight(1f),
                )
                MiniCard(
                    label      = "GAP P1",
                    value      = myRun.gap,
                    valueColor = RaceFacerAmber,
                    modifier   = Modifier.weight(1f),
                )
            }
        }

        // ── Mate strip (only when mate is selected) ─────────────────────
        if (state.mateRun != null) {
            item {
                MateStrip(
                    mateRun  = state.mateRun,
                    myLastMs = myRun.lastTimeRaw,
                    onClick  = onCompare,
                )
            }
        }

        // ── Nav pills — row 1 ───────────────────────────────────────────
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
            ) {
                NavPill(label = "Laps", onClick = onLapHistory)
                NavPill(
                    label   = if (state.mateRun != null) "VS" else "+ VS",
                    onClick = if (state.mateRun != null) onCompare else onPickMate,
                )
                NavPill(label = "MAP", onClick = onTrackMap)
            }
        }

        // ── Nav pills — row 2 ───────────────────────────────────────────
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
            ) {
                NavPill(label = "KART", onClick = onRepick)
                NavPill(label = "⚙", onClick = onSettings)
            }
        }
    }
}

@Composable
private fun PositionBadge(position: Int) {
    val (text, color) = when (position) {
        1    -> "P1" to GoldP1
        2    -> "P2" to SilverP2
        3    -> "P3" to BronzeP3
        else -> "P$position" to TextMuted2
    }
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(color.copy(alpha = 0.15f))
            .padding(horizontal = 6.dp, vertical = 2.dp),
    ) {
        Text(
            text       = text,
            color      = color,
            fontSize   = 12.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}

@Composable
private fun ConnectionDot(state: ConnectionState) {
    val color = when (state) {
        ConnectionState.CONNECTED    -> RaceFacerGreen
        ConnectionState.CONNECTING   -> RaceFacerAmber
        ConnectionState.DISCONNECTED -> RaceFacerRed
    }
    Box(
        modifier = Modifier
            .size(8.dp)
            .clip(RoundedCornerShape(4.dp))
            .background(color)
    )
}

@Composable
private fun SectionLabel(text: String) {
    Text(
        text          = text,
        color         = TextMuted,
        fontSize      = 9.sp,
        fontWeight    = FontWeight.Medium,
        letterSpacing = 1.5.sp,
    )
}

@Composable
private fun MiniCard(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    valueColor: Color = Color.White,
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(SurfaceDark)
            .padding(horizontal = 8.dp, vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text          = label,
            color         = TextMuted,
            fontSize      = 8.sp,
            letterSpacing = 1.sp,
        )
        Text(
            text       = value,
            color      = valueColor,
            fontSize   = 14.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = Mono,
        )
    }
}

@Composable
private fun MateStrip(
    mateRun: DriverRun,
    myLastMs: Long,
    onClick: () -> Unit,
) {
    val delta     = myLastMs - mateRun.lastTimeRaw
    val deltaText = if (delta < 0) "${RaceMath.formatDelta(delta)} faster"
                    else "${RaceMath.formatDelta(delta)} behind"
    val deltaColor = if (delta <= 0) RaceFacerGreen else RaceFacerRed

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(SurfaceDark)
            .clickable { onClick() }
            .padding(horizontal = 10.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column {
            Text(
                text          = "MATE · ${mateRun.kartNumber}",
                color         = TextMuted,
                fontSize      = 8.sp,
                letterSpacing = 1.sp,
            )
            Text(
                text       = mateRun.lastTimeFormatted,
                color      = RaceFacerAmber,
                fontSize   = 14.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = Mono,
            )
        }
        Text(
            text     = deltaText,
            color    = deltaColor,
            fontSize = 11.sp,
            fontFamily = Mono,
        )
    }
}

@Composable
private fun NavPill(label: String, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(14.dp))
            .background(SurfaceDark)
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 6.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text       = label,
            color      = TextMuted2,
            fontSize   = 11.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}
