package com.raceface.wear.presentation.screens.hud

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
    onLapHistory: () -> Unit,
    onCompare: () -> Unit,
    onSettings: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundBlack),
        contentAlignment = Alignment.Center,
    ) {
        if (state.myRun == null) {
            NoDriverContent(onPickerClick)
        } else {
            HudContent(
                state        = state,
                myRun        = state.myRun,
                onLapHistory = onLapHistory,
                onCompare    = onCompare,
                onSettings   = onSettings,
                onRepick     = onPickerClick,
            )
        }
    }
}

@Composable
private fun NoDriverContent(onPickerClick: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = Modifier
            .fillMaxSize()
            .clickable { onPickerClick() }
            .padding(16.dp),
    ) {
        Text(
            text      = "TAP TO SELECT",
            color     = Color.White,
            fontSize  = 16.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text     = "your kart",
            color    = TextMuted2,
            fontSize = 12.sp,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(16.dp))
        Box(
            modifier = Modifier
                .size(56.dp)
                .clip(RoundedCornerShape(28.dp))
                .background(RaceFacerGreen.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center,
        ) {
            Text("→", color = RaceFacerGreen, fontSize = 24.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun HudContent(
    state: HudUiState,
    myRun: DriverRun,
    onLapHistory: () -> Unit,
    onCompare: () -> Unit,
    onSettings: () -> Unit,
    onRepick: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 12.dp, vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        // ── Status bar ────────────────────────────────────────────────────
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Position badge (small — secondary to last lap)
            PositionBadge(position = myRun.position)

            // Kart number
            Text(
                text      = myRun.kartNumber,
                color     = RaceFacerGreen,
                fontSize  = 11.sp,
                fontWeight = FontWeight.Bold,
            )

            // Connection indicator
            ConnectionDot(state.connection)
        }

        Spacer(Modifier.height(2.dp))

        // ── LAST LAP — hero ──────────────────────────────────────────────
        SectionLabel("LAST LAP")

        val lastLapColor = when (state.lastLapColor) {
            LapColor.BEST_SESSION   -> RaceFacerGreen
            LapColor.PERSONAL_BEST  -> RaceFacerPurple
            LapColor.INCIDENT       -> RaceFacerRed
            LapColor.NORMAL         -> RaceFacerAmber
        }

        Text(
            text       = myRun.lastTimeFormatted.ifBlank { "---.---" },
            color      = lastLapColor,
            fontSize   = 48.sp,      // hero — the most important number on screen
            fontWeight = FontWeight.ExtraBold,
            fontFamily = Mono,
            letterSpacing = (-1).sp,
            lineHeight = 48.sp,
        )

        // Delta vs best
        if (myRun.lapTimes.isNotEmpty() && myRun.lastTimeRaw > 0 && myRun.bestTimeRaw > 0) {
            val delta = myRun.lastTimeRaw - myRun.bestTimeRaw
            val deltaColor = if (delta <= 0) RaceFacerGreen else TextMuted2
            Text(
                text      = RaceMath.formatDelta(delta) + " to best",
                color     = deltaColor,
                fontSize  = 12.sp,
                fontFamily = Mono,
            )
        }

        Spacer(Modifier.height(6.dp))

        // ── Mini stat cards row ──────────────────────────────────────────
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            MiniCard(
                label = "BEST",
                value = myRun.bestTimeFormatted,
                modifier = Modifier.weight(1f),
            )
            MiniCard(
                label = "GAP P1",
                value = myRun.gap,
                valueColor = RaceFacerAmber,
                modifier = Modifier.weight(1f),
            )
        }

        // ── Mate strip ───────────────────────────────────────────────────
        state.mateRun?.let { mate ->
            Spacer(Modifier.height(6.dp))
            MateStrip(
                mateRun  = mate,
                myLastMs = myRun.lastTimeRaw,
                onClick  = onCompare,
            )
        }

        // ── Bottom nav row ───────────────────────────────────────────────
        Spacer(Modifier.weight(1f))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly,
        ) {
            NavPill(label = "Laps", onClick = onLapHistory)
            if (state.mateRun != null) NavPill(label = "VS", onClick = onCompare)
            NavPill(label = "⚙", onClick = onSettings)
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
    val delta     = myLastMs - mateRun.lastTimeRaw  // negative = I'm faster
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
