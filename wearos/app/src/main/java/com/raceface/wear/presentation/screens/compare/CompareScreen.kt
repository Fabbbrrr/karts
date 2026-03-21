package com.raceface.wear.presentation.screens.compare

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.wear.compose.material.Text
import com.raceface.wear.domain.model.LapComparison
import com.raceface.wear.domain.usecase.RaceMath
import com.raceface.wear.presentation.theme.*

@Composable
fun CompareScreen(
    state: CompareUiState,
    onRepick: () -> Unit,
    onBackToHud: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundBlack),
        contentAlignment = Alignment.Center,
    ) {
        if (state.noMateSelected || state.comparison == null) {
            NoMateContent()
        } else {
            CompareContent(
                c            = state.comparison,
                onBackToHud  = onBackToHud,
            )
        }
    }
}

@Composable
private fun CompareContent(
    c: LapComparison,
    onBackToHud: () -> Unit,
) {
    val deltaMs   = c.lastLapDeltaMs
    val iWin      = deltaMs <= 0
    val deltaText = RaceMath.formatDelta(deltaMs)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween,
    ) {
        // ── Top bar: back button + lap counts ─────────────────────────────
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Back to HUD pill
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(14.dp))
                    .background(SurfaceDark)
                    .clickable(onClick = onBackToHud)
                    .padding(horizontal = 10.dp, vertical = 5.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text       = "< HUD",
                    color      = TextMuted2,
                    fontSize   = 10.sp,
                    fontWeight = FontWeight.Bold,
                )
            }

            // Lap counts
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                LapBadge(label = "L${c.myRun.laps}", color = RaceFacerGreen)
                LapBadge(label = "L${c.mateRun.laps}", color = RaceFacerAmber)
            }
        }

        // ── Kart identities ───────────────────────────────────────────────
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // My kart: position + number + name
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    PositionText(c.myRun.position)
                    Text(
                        text       = "#${c.myRun.kartNumber}",
                        color      = RaceFacerGreen,
                        fontSize   = 14.sp,
                        fontWeight = FontWeight.ExtraBold,
                    )
                }
                Text(
                    text     = c.myRun.driverName.split(" ").first(),
                    color    = TextMuted2,
                    fontSize = 9.sp,
                )
            }

            // Mate kart: number + position
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    Text(
                        text       = "#${c.mateRun.kartNumber}",
                        color      = RaceFacerAmber,
                        fontSize   = 14.sp,
                        fontWeight = FontWeight.ExtraBold,
                    )
                    PositionText(c.mateRun.position)
                }
                Text(
                    text     = c.mateRun.driverName.split(" ").first(),
                    color    = TextMuted2,
                    fontSize = 9.sp,
                )
            }
        }

        // ── Hero: stacked lap times + delta ───────────────────────────────
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth(),
        ) {
            // My last lap — always green (identity)
            Text(
                text          = c.myRun.lastTimeFormatted.ifBlank { "---.---" },
                color         = RaceFacerGreen,
                fontSize      = 36.sp,
                fontWeight    = FontWeight.ExtraBold,
                fontFamily    = Mono,
                letterSpacing = (-1).sp,
                textAlign     = TextAlign.Center,
            )

            // VS separator
            Text(
                text       = "VS",
                color      = TextMuted,
                fontSize   = 10.sp,
                fontWeight = FontWeight.Bold,
            )

            // Mate last lap — always amber (identity)
            Text(
                text          = c.mateRun.lastTimeFormatted.ifBlank { "---.---" },
                color         = RaceFacerAmber,
                fontSize      = 36.sp,
                fontWeight    = FontWeight.ExtraBold,
                fontFamily    = Mono,
                letterSpacing = (-1).sp,
                textAlign     = TextAlign.Center,
            )

            Spacer(Modifier.height(4.dp))

            // Delta — green if winning, red if losing
            Text(
                text       = if (iWin) "$deltaText faster" else "$deltaText slower",
                color      = if (iWin) RaceFacerGreen else RaceFacerRed,
                fontSize   = 14.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = Mono,
            )
        }

        // ── Footer: best lap comparison + trend ───────────────────────────
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            // Best lap comparison
            val bestDelta = c.bestLapDeltaMs
            val bestIWin  = bestDelta <= 0
            Text(
                text  = "best ${c.myRun.bestTimeFormatted} vs ${c.mateRun.bestTimeFormatted}",
                color = TextMuted2,
                fontSize = 10.sp,
                fontFamily = Mono,
            )

            // Closing/losing trend
            val closing   = c.closingMs
            val trendText = when {
                closing < -50 -> "closing ${RaceMath.formatDelta(closing)}/lap"
                closing > 50  -> "losing ${RaceMath.formatDelta(closing)}/lap"
                else          -> "stable pace"
            }
            val trendColor = when {
                closing < -50 -> RaceFacerGreen
                closing > 50  -> RaceFacerRed
                else          -> TextMuted2
            }
            Text(
                text       = trendText,
                color      = trendColor,
                fontSize   = 9.sp,
                fontFamily = Mono,
            )
        }
    }
}

@Composable
private fun PositionText(position: Int) {
    val color = when (position) {
        1    -> GoldP1
        2    -> SilverP2
        3    -> BronzeP3
        else -> TextMuted2
    }
    Text(
        text       = "P$position",
        color      = color,
        fontSize   = 12.sp,
        fontWeight = FontWeight.Bold,
    )
}

@Composable
private fun LapBadge(label: String, color: androidx.compose.ui.graphics.Color) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(color.copy(alpha = 0.15f))
            .padding(horizontal = 6.dp, vertical = 2.dp),
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
