package com.raceface.wear.presentation.screens.picker

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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

/**
 * Pure display composable — shows a scrollable list of karts.
 * Zero navigation logic, zero DataStore awareness.
 */
@Composable
fun KartPickerScreen(
    title: String,
    drivers: List<DriverRun>,
    isConnected: Boolean,
    selectedKart: String? = null,
    onKartPicked: (String) -> Unit,
    onSkip: (() -> Unit)? = null,
) {
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
            // Title
            item {
                Text(
                    text          = title,
                    color         = TextMuted2,
                    fontSize      = 10.sp,
                    fontWeight    = FontWeight.Bold,
                    letterSpacing = 1.5.sp,
                    modifier      = Modifier.fillMaxWidth(),
                    textAlign     = TextAlign.Center,
                )
            }

            // Empty state
            if (drivers.isEmpty()) {
                item {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                    ) {
                        Text(
                            text      = if (isConnected) "No drivers yet\u2026" else "Connecting\u2026",
                            color     = TextMuted,
                            fontSize  = 12.sp,
                            textAlign = TextAlign.Center,
                        )
                    }
                }
            }

            // Kart chips
            items(drivers) { driver ->
                KartChip(
                    driver     = driver,
                    isSelected = driver.kartNumber == selectedKart,
                    onClick    = { onKartPicked(driver.kartNumber) },
                )
            }

            // Optional skip button (mate picker only)
            if (onSkip != null) {
                item {
                    Spacer(Modifier.height(4.dp))
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(20.dp))
                            .background(SurfaceDark)
                            .border(1.dp, TextMuted.copy(alpha = 0.3f), RoundedCornerShape(20.dp))
                            .clickable { onSkip() }
                            .padding(vertical = 10.dp),
                    ) {
                        Text("No compare", color = TextMuted, fontSize = 12.sp)
                    }
                }
            }

            // Build stamp — lets you confirm which build is installed
            item {
                Spacer(Modifier.height(8.dp))
                val fmt = remember {
                    java.text.SimpleDateFormat("MMM dd HH:mm", java.util.Locale.US)
                        .format(java.util.Date(com.raceface.wear.BuildConfig.BUILD_TIME_MS))
                }
                Text(
                    text      = "build $fmt",
                    color     = TextMuted.copy(alpha = 0.5f),
                    fontSize  = 8.sp,
                    textAlign = TextAlign.Center,
                    modifier  = Modifier.fillMaxWidth(),
                )
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
        1    -> GoldP1
        2    -> SilverP2
        3    -> BronzeP3
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
        Text(
            text       = "P${driver.position}",
            color      = posColor,
            fontSize   = 13.sp,
            fontWeight = FontWeight.Bold,
            modifier   = Modifier.width(28.dp),
        )
        Text(
            text       = driver.kartNumber,
            color      = RaceFacerGreen,
            fontSize   = 14.sp,
            fontWeight = FontWeight.ExtraBold,
            modifier   = Modifier.width(36.dp),
        )
        Text(
            text     = driver.driverName,
            color    = Color.White,
            fontSize = 12.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f),
        )
        Text(
            text     = driver.bestTimeFormatted,
            color    = TextMuted2,
            fontSize = 11.sp,
        )
    }
}
