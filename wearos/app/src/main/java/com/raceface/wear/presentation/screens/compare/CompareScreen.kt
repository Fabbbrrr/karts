package com.raceface.wear.presentation.screens.compare

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
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
            NoMateContent()
        } else {
            val c = state.comparison
            ScalingLazyColumn(
                state          = listState,
                anchorType     = ScalingLazyListAnchorType.ItemCenter,
                modifier       = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 28.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {

                // ── Kart names ───────────────────────────────────────────
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.weight(1f),
                        ) {
                            Text(
                                text       = c.myRun.kartNumber,
                                color      = RaceFacerGreen,
                                fontSize   = 16.sp,
                                fontWeight = FontWeight.ExtraBold,
                            )
                            Text(
                                text     = c.myRun.driverName.split(" ").first(),
                                color    = TextMuted2,
                                fontSize = 9.sp,
                            )
                        }
                        Text(
                            text       = "VS",
                            color      = TextMuted,
                            fontSize   = 11.sp,
                            fontWeight = FontWeight.Bold,
                        )
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.weight(1f),
                        ) {
                            Text(
                                text       = c.mateRun.kartNumber,
                                color      = RaceFacerAmber,
                                fontSize   = 16.sp,
                                fontWeight = FontWeight.ExtraBold,
                            )
                            Text(
                                text     = c.mateRun.driverName.split(" ").first(),
                                color    = TextMuted2,
                                fontSize = 9.sp,
                            )
                        }
                    }
                }

                // ── Hero: last lap times ─────────────────────────────────
                item {
                    val deltaMs   = c.lastLapDeltaMs
                    val iWin      = deltaMs <= 0
                    val deltaText = RaceMath.formatDelta(deltaMs)

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(SurfaceDark)
                            .padding(horizontal = 8.dp, vertical = 10.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Text(
                            text          = "LAST LAP",
                            color         = TextMuted,
                            fontSize      = 8.sp,
                            letterSpacing = 1.5.sp,
                        )
                        Spacer(Modifier.height(4.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text       = c.myRun.lastTimeFormatted.ifBlank { "---.---" },
                                color      = if (iWin) RaceFacerGreen else RaceFacerRed,
                                fontSize   = 34.sp,
                                fontWeight = FontWeight.ExtraBold,
                                fontFamily = Mono,
                                letterSpacing = (-1).sp,
                            )
                            Text(
                                text       = c.mateRun.lastTimeFormatted.ifBlank { "---.---" },
                                color      = if (!iWin) RaceFacerGreen else RaceFacerRed,
                                fontSize   = 34.sp,
                                fontWeight = FontWeight.ExtraBold,
                                fontFamily = Mono,
                                letterSpacing = (-1).sp,
                            )
                        }
                        Spacer(Modifier.height(2.dp))
                        Text(
                            text       = if (iWin) "$deltaText faster" else "$deltaText slower",
                            color      = if (iWin) RaceFacerGreen else RaceFacerRed,
                            fontSize   = 11.sp,
                            fontFamily = Mono,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }

                // ── Best lap ─────────────────────────────────────────────
                item {
                    StatRow(
                        label   = "BEST LAP",
                        myVal   = c.myRun.bestTimeFormatted,
                        mateVal = c.mateRun.bestTimeFormatted,
                        deltaMs = c.bestLapDeltaMs,
                    )
                }

                // ── Average lap ──────────────────────────────────────────
                item {
                    StatRow(
                        label   = "AVERAGE",
                        myVal   = RaceMath.formatTime(c.myRun.avgLapRaw),
                        mateVal = RaceMath.formatTime(c.mateRun.avgLapRaw),
                        deltaMs = c.myRun.avgLapRaw - c.mateRun.avgLapRaw,
                    )
                }

                // ── Consistency + position side by side ──────────────────
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        MiniStatRow(
                            label   = "CONSIST.",
                            myVal   = "${RaceMath.consistency(c.myRun.lapTimes)}%",
                            mateVal = "${RaceMath.consistency(c.mateRun.lapTimes)}%",
                            // higher % is better → invert delta
                            iWin    = RaceMath.consistency(c.myRun.lapTimes) >=
                                      RaceMath.consistency(c.mateRun.lapTimes),
                            modifier = Modifier.weight(1f),
                        )
                        MiniStatRow(
                            label    = "POSITION",
                            myVal    = "P${c.myRun.position}",
                            mateVal  = "P${c.mateRun.position}",
                            iWin     = c.positionDelta <= 0,
                            modifier = Modifier.weight(1f),
                        )
                    }
                }

                // ── Gap summary ──────────────────────────────────────────
                item { GapSummary(c) }
            }
        }
    }
}

@Composable
private fun StatRow(
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
            .padding(horizontal = 8.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text       = myVal,
            color      = if (iWin) RaceFacerGreen else RaceFacerRed,
            fontSize   = 15.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = Mono,
            modifier   = Modifier.weight(1f),
            textAlign  = TextAlign.Center,
        )
        Text(
            text          = label,
            color         = TextMuted,
            fontSize      = 8.sp,
            letterSpacing = 0.5.sp,
            modifier      = Modifier.width(50.dp),
            textAlign     = TextAlign.Center,
        )
        Text(
            text       = mateVal,
            color      = if (!iWin) RaceFacerGreen else RaceFacerRed,
            fontSize   = 15.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = Mono,
            modifier   = Modifier.weight(1f),
            textAlign  = TextAlign.Center,
        )
    }
}

@Composable
private fun MiniStatRow(
    label: String,
    myVal: String,
    mateVal: String,
    iWin: Boolean,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(SurfaceDark)
            .padding(6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(label, color = TextMuted, fontSize = 7.sp, letterSpacing = 0.5.sp)
        Spacer(Modifier.height(2.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(myVal,   color = if (iWin)  RaceFacerGreen else RaceFacerRed,  fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = Mono)
            Text(mateVal, color = if (!iWin) RaceFacerGreen else RaceFacerRed, fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = Mono)
        }
    }
}

@Composable
private fun GapSummary(c: LapComparison) {
    val isBehind  = c.positionDelta > 0
    val gapText   = if (isBehind) "+${c.myRun.gap}" else c.myRun.gap
    val closing   = c.closingMs
    val trendText = when {
        closing < -50 -> "closing ${RaceMath.formatDelta(closing)}/lap"
        closing > 50  -> "losing  ${RaceMath.formatDelta(closing)}/lap"
        else          -> "stable"
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
        Text("GAP", color = TextMuted, fontSize = 8.sp, letterSpacing = 1.sp)
        Text(
            text       = gapText,
            color      = if (isBehind) RaceFacerRed else RaceFacerGreen,
            fontSize   = 22.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = Mono,
        )
        Text(trendText, color = trendColor, fontSize = 10.sp, fontFamily = Mono)
    }
}

@Composable
private fun NoMateContent() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text("No mate selected", color = TextMuted2, fontSize = 14.sp, textAlign = TextAlign.Center)
        Spacer(Modifier.height(8.dp))
        Text("Tap + VS on the HUD to pick a kart", color = TextMuted, fontSize = 11.sp, textAlign = TextAlign.Center)
    }
}
