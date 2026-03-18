package com.raceface.wear.presentation.screens.compare

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.ScalingLazyListAnchorType
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material.Text
import com.raceface.wear.domain.model.LapComparison
import com.raceface.wear.domain.usecase.RaceMath
import com.raceface.wear.presentation.theme.*

@Composable
fun CompareScreen(
    state: CompareUiState,
    onRepick: () -> Unit,
) {
    val listState = rememberScalingLazyListState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundBlack),
    ) {
        if (state.noMateSelected || state.comparison == null) {
            NoMateContent(onRepick)
        } else {
            ScalingLazyColumn(
                state          = listState,
                anchorType     = ScalingLazyListAnchorType.ItemCenter,
                modifier       = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 28.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                item { CompareHeader(state.comparison) }
                item { Spacer(Modifier.height(4.dp)) }
                item { CompareRow("LAST LAP", state.comparison.myRun.lastTimeFormatted,
                    state.comparison.mateRun.lastTimeFormatted, state.comparison.lastLapDeltaMs) }
                item { CompareRow("BEST LAP", state.comparison.myRun.bestTimeFormatted,
                    state.comparison.mateRun.bestTimeFormatted, state.comparison.bestLapDeltaMs) }
                item { CompareRow("AVERAGE",
                    RaceMath.formatTime(state.comparison.myRun.avgLapRaw),
                    RaceMath.formatTime(state.comparison.mateRun.avgLapRaw),
                    state.comparison.myRun.avgLapRaw - state.comparison.mateRun.avgLapRaw) }
                item { CompareRow("CONSIST.",
                    "${RaceMath.consistency(state.comparison.myRun.lapTimes)}%",
                    "${RaceMath.consistency(state.comparison.mateRun.lapTimes)}%",
                    // for consistency, higher is better — invert delta
                    (RaceMath.consistency(state.comparison.mateRun.lapTimes) -
                     RaceMath.consistency(state.comparison.myRun.lapTimes)).toLong()) }
                item { CompareRow("POSITION",
                    "P${state.comparison.myRun.position}",
                    "P${state.comparison.mateRun.position}",
                    state.comparison.positionDelta.toLong()) }
                item { CompareRow("LAPS",
                    "${state.comparison.myRun.laps}",
                    "${state.comparison.mateRun.laps}",
                    (state.comparison.myRun.laps - state.comparison.mateRun.laps).toLong()) }
                item { GapSummary(state.comparison) }
            }
        }
    }
}

@Composable
private fun CompareHeader(c: LapComparison) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
            Text(c.myRun.kartNumber, color = RaceFacerGreen, fontSize = 14.sp, fontWeight = FontWeight.ExtraBold)
            Text(c.myRun.driverName.split(" ").first(), color = TextMuted2, fontSize = 9.sp)
        }
        Text("VS", color = TextMuted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
            Text(c.mateRun.kartNumber, color = RaceFacerAmber, fontSize = 14.sp, fontWeight = FontWeight.ExtraBold)
            Text(c.mateRun.driverName.split(" ").first(), color = TextMuted2, fontSize = 9.sp)
        }
    }
}

/**
 * A comparison row. [deltaMs] is (my value - mate value):
 * negative = I'm better (lower time / higher consistency / better position)
 * positive = mate is better
 */
@Composable
private fun CompareRow(
    label: String,
    myVal: String,
    mateVal: String,
    deltaMs: Long,
) {
    val iWin = deltaMs <= 0

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(SurfaceDark)
            .padding(horizontal = 6.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // My value
        Box(
            modifier = Modifier
                .weight(1f)
                .clip(RoundedCornerShape(6.dp))
                .background(if (iWin) RaceFacerGreen.copy(alpha = 0.12f) else RaceFacerRed.copy(alpha = 0.08f))
                .padding(4.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text       = myVal,
                color      = if (iWin) RaceFacerGreen else RaceFacerRed,
                fontSize   = 12.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = Mono,
                textAlign  = TextAlign.Center,
            )
        }
        // Label
        Text(
            text          = label,
            color         = TextMuted,
            fontSize      = 8.sp,
            textAlign     = TextAlign.Center,
            letterSpacing = 0.5.sp,
            modifier      = Modifier.width(52.dp),
        )
        // Mate value
        Box(
            modifier = Modifier
                .weight(1f)
                .clip(RoundedCornerShape(6.dp))
                .background(if (!iWin) RaceFacerGreen.copy(alpha = 0.12f) else RaceFacerRed.copy(alpha = 0.08f))
                .padding(4.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text       = mateVal,
                color      = if (!iWin) RaceFacerGreen else RaceFacerRed,
                fontSize   = 12.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = Mono,
                textAlign  = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun GapSummary(c: LapComparison) {
    val isBehind = c.positionDelta > 0
    val gapText  = if (isBehind) "+${c.myRun.gap}" else c.myRun.gap
    val closing  = c.closingMs
    val trendText = when {
        closing < -50   -> "▽ closing ${RaceMath.formatDelta(closing)}/lap"
        closing > 50    -> "△ losing ${RaceMath.formatDelta(closing)}/lap"
        else            -> "→ stable"
    }
    val trendColor = when {
        closing < -50 -> RaceFacerGreen
        closing > 50  -> RaceFacerRed
        else          -> TextMuted2
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(SurfaceDark)
            .padding(10.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text          = "GAP BETWEEN",
            color         = TextMuted,
            fontSize      = 8.sp,
            letterSpacing = 1.sp,
        )
        Text(
            text       = gapText,
            color      = if (isBehind) RaceFacerRed else RaceFacerGreen,
            fontSize   = 20.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = Mono,
        )
        Text(
            text     = trendText,
            color    = trendColor,
            fontSize = 10.sp,
            fontFamily = Mono,
        )
    }
}

@Composable
private fun NoMateContent(onRepick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text("No mate selected", color = TextMuted2, fontSize = 14.sp, textAlign = TextAlign.Center)
        Spacer(Modifier.height(8.dp))
        Text("Go to Settings → Compare to pick a kart", color = TextMuted, fontSize = 11.sp, textAlign = TextAlign.Center)
    }
}
