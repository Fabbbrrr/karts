package com.raceface.wear.presentation.screens.picker

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.ScalingLazyListAnchorType
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material.Text
import com.raceface.wear.domain.model.DriverRun
import com.raceface.wear.presentation.theme.*

@Composable
fun KartPickerScreen(
    phase: String,
    state: KartPickerUiState,
    onMyKartPicked: (String) -> Unit,
    onMateKartPicked: (String) -> Unit,
    onSkipMate: () -> Unit,
) {
    val isMatePhase = phase == "mate"
    val headerText = if (isMatePhase) "COMPARE WITH" else "MY KART"
    val headerSub  = if (isMatePhase) "Pick your mate's kart" else "Select your kart to start"

    val listState = rememberScalingLazyListState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundBlack)
    ) {
        ScalingLazyColumn(
            state             = listState,
            anchorType        = ScalingLazyListAnchorType.ItemCenter,
            modifier          = Modifier.fillMaxSize(),
            contentPadding    = PaddingValues(horizontal = 12.dp, vertical = 28.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            // Header
            item {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth().padding(bottom = 4.dp)
                ) {
                    if (isMatePhase && state.myKart != null) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center,
                        ) {
                            Text(
                                text  = "← ${state.myKart}",
                                color = RaceFacerGreen,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                        Spacer(Modifier.height(4.dp))
                    }
                    Text(
                        text      = headerText,
                        color     = TextMuted2,
                        fontSize  = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.5.sp,
                    )
                    Text(
                        text     = headerSub,
                        color    = TextMuted,
                        fontSize = 9.sp,
                    )
                }
            }

            // Driver chips
            val driversToShow = if (isMatePhase) {
                state.drivers.filter { it.kartNumber != state.myKart }
            } else {
                state.drivers
            }

            if (driversToShow.isEmpty()) {
                item {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                    ) {
                        Text(
                            text  = if (state.isConnected) "No drivers yet…" else "Connecting…",
                            color = TextMuted,
                            fontSize = 12.sp,
                            textAlign = TextAlign.Center,
                        )
                    }
                }
            }

            items(driversToShow) { driver ->
                KartChip(
                    driver      = driver,
                    isSelected  = when {
                        !isMatePhase -> driver.kartNumber == state.myKart
                        else         -> driver.kartNumber == state.mateKart
                    },
                    onClick     = {
                        if (isMatePhase) onMateKartPicked(driver.kartNumber)
                        else             onMyKartPicked(driver.kartNumber)
                    }
                )
            }

            // Skip / No compare option for mate phase
            if (isMatePhase) {
                item {
                    Spacer(Modifier.height(4.dp))
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(20.dp))
                            .background(SurfaceDark)
                            .border(1.dp, TextMuted.copy(alpha = 0.3f), RoundedCornerShape(20.dp))
                            .clickable { onSkipMate() }
                            .padding(vertical = 10.dp),
                    ) {
                        Text("No compare", color = TextMuted, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun KartChip(
    driver: DriverRun,
    isSelected: Boolean,
    onClick: () -> Unit,
) {
    val posColor = when (driver.position) {
        1 -> GoldP1
        2 -> SilverP2
        3 -> BronzeP3
        else -> TextMuted2
    }
    val borderColor = if (isSelected) RaceFacerGreen else Color.Transparent
    val bgColor     = if (isSelected) RaceFacerGreen.copy(alpha = 0.12f) else SurfaceDark

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(bgColor)
            .border(width = 2.dp, color = borderColor, shape = RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        // Position badge
        Text(
            text       = "P${driver.position}",
            color      = posColor,
            fontSize   = 13.sp,
            fontWeight = FontWeight.Bold,
            modifier   = Modifier.width(28.dp),
        )
        // Kart number
        Text(
            text       = driver.kartNumber,
            color      = RaceFacerGreen,
            fontSize   = 14.sp,
            fontWeight = FontWeight.ExtraBold,
            modifier   = Modifier.width(36.dp),
        )
        // Driver name
        Text(
            text     = driver.driverName,
            color    = Color.White,
            fontSize = 12.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f),
        )
        // Best lap
        Text(
            text     = driver.bestTimeFormatted,
            color    = TextMuted2,
            fontSize = 11.sp,
        )
    }
}
