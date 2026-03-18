package com.raceface.wear.presentation.screens.laps

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.rotary.onRotaryScrollEvent
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.ScalingLazyListAnchorType
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material.Text
import com.raceface.wear.domain.model.LapColor
import com.raceface.wear.domain.model.LapEntry
import com.raceface.wear.presentation.theme.*

@Composable
fun LapHistoryScreen(state: LapHistoryUiState) {
    val listState = rememberScalingLazyListState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundBlack),
    ) {
        ScalingLazyColumn(
            state          = listState,
            anchorType     = ScalingLazyListAnchorType.ItemCenter,
            modifier       = Modifier
                .fillMaxSize()
                .onRotaryScrollEvent { event ->
                    // Rotary crown scrolling
                    listState.dispatchRawDelta(event.verticalScrollPixels)
                    true
                },
            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 28.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            // Header
            item {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth().padding(bottom = 4.dp),
                ) {
                    Text(
                        text          = "LAP HISTORY",
                        color         = TextMuted2,
                        fontSize      = 10.sp,
                        fontWeight    = FontWeight.Bold,
                        letterSpacing = 1.5.sp,
                    )
                    Text(
                        text     = "${state.kartNumber} · ${state.totalLaps} laps",
                        color    = RaceFacerGreen,
                        fontSize = 11.sp,
                    )
                }
            }

            if (state.laps.isEmpty()) {
                item {
                    Text(
                        text      = "No laps yet",
                        color     = TextMuted,
                        fontSize  = 12.sp,
                        textAlign = TextAlign.Center,
                        modifier  = Modifier.fillMaxWidth().padding(16.dp),
                    )
                }
            }

            items(state.laps) { lap ->
                LapRow(lap = lap)
            }
        }
    }
}

@Composable
private fun LapRow(lap: LapEntry) {
    val (bgColor, timeColor, deltaColor) = when (lap.color) {
        LapColor.BEST_SESSION  -> Triple(
            RaceFacerGreen.copy(alpha = 0.08f),
            RaceFacerGreen,
            RaceFacerGreen,
        )
        LapColor.PERSONAL_BEST -> Triple(
            RaceFacerPurple.copy(alpha = 0.1f),
            RaceFacerPurple,
            TextMuted2,
        )
        LapColor.INCIDENT      -> Triple(
            RaceFacerRed.copy(alpha = 0.08f),
            RaceFacerRed,
            RaceFacerRed,
        )
        LapColor.NORMAL        -> Triple(
            SurfaceDark,
            Color.White,
            RaceFacerAmber,
        )
    }

    val badge = when (lap.color) {
        LapColor.BEST_SESSION  -> "⚡"
        LapColor.PERSONAL_BEST -> "PB"
        LapColor.INCIDENT      -> "!"
        LapColor.NORMAL        -> null
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(bgColor)
            .padding(horizontal = 12.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Lap number
        Text(
            text     = "L${lap.lapNumber}",
            color    = TextMuted,
            fontSize = 10.sp,
            modifier = Modifier.width(28.dp),
        )
        // Lap time
        Text(
            text       = lap.timeFormatted,
            color      = timeColor,
            fontSize   = 15.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = Mono,
            modifier   = Modifier.weight(1f),
        )
        // Delta
        Text(
            text     = lap.deltaFormatted,
            color    = if (lap.deltaMs <= 0) RaceFacerGreen else deltaColor,
            fontSize = 11.sp,
            fontFamily = Mono,
        )
        // Badge
        if (badge != null) {
            Spacer(Modifier.width(4.dp))
            Text(
                text     = badge,
                color    = timeColor,
                fontSize = 10.sp,
                modifier = Modifier.width(18.dp),
            )
        }
    }
}
