package com.raceface.wear.presentation.screens.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.ScalingLazyListAnchorType
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material.Text
import com.raceface.wear.domain.model.ConnectionState
import com.raceface.wear.presentation.theme.*

@Composable
fun SettingsScreen(
    state: SettingsUiState,
    onReconnect: () -> Unit,
    onChannelSave: (String) -> Unit,
    onRepickKarts: () -> Unit,
    onClearMate: () -> Unit,
) {
    val listState = rememberScalingLazyListState()
    var channelInput by remember(state.channel) { mutableStateOf(state.channel) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundBlack),
    ) {
        ScalingLazyColumn(
            state          = listState,
            anchorType     = ScalingLazyListAnchorType.ItemCenter,
            modifier       = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 28.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            item {
                Text(
                    text          = "SETTINGS",
                    color         = TextMuted2,
                    fontSize      = 11.sp,
                    fontWeight    = FontWeight.Bold,
                    letterSpacing = 1.5.sp,
                )
            }

            // ── Connection ──────────────────────────────────────────────
            item { GroupLabel("CONNECTION") }

            item {
                SettingsRow(
                    label    = "Channel",
                    subLabel = channelInput,
                ) { /* no trailing action — inline edit below */ }
            }

            item {
                // Inline channel editor
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(SurfaceDark)
                        .padding(10.dp),
                ) {
                    BasicTextField(
                        value         = channelInput,
                        onValueChange = { channelInput = it },
                        textStyle     = TextStyle(color = Color.White, fontSize = 13.sp, fontFamily = Mono),
                        cursorBrush   = SolidColor(RaceFacerGreen),
                        singleLine    = true,
                        modifier      = Modifier.fillMaxWidth(),
                    )
                }
            }

            item {
                ActionChip(label = "Save Channel") {
                    onChannelSave(channelInput)
                }
            }

            item {
                val (dot, text) = when (state.connection) {
                    ConnectionState.CONNECTED    -> "🟢" to "Connected"
                    ConnectionState.CONNECTING   -> "🟡" to "Connecting…"
                    ConnectionState.DISCONNECTED -> "🔴" to "Disconnected"
                }
                SettingsRow(label = "Status", subLabel = "$dot $text") {}
            }

            item { ActionChip(label = "Reconnect", onClick = onReconnect) }

            // ── Karts ──────────────────────────────────────────────────
            item { GroupLabel("KARTS") }

            item {
                SettingsRow(
                    label    = "My Kart",
                    subLabel = state.myKart ?: "Not set",
                    trailingColor = RaceFacerGreen,
                    trailing = "Change",
                    onClick  = onRepickKarts,
                )
            }

            item {
                SettingsRow(
                    label    = "Compare",
                    subLabel = state.mateKart ?: "None",
                    trailingColor = RaceFacerAmber,
                    trailing = "Change",
                    onClick  = { onRepickKarts() },
                )
            }

            if (state.mateKart != null) {
                item {
                    ActionChip(label = "Clear Compare", color = RaceFacerRed, onClick = onClearMate)
                }
            }

            // ── About ──────────────────────────────────────────────────
            item { GroupLabel("ABOUT") }

            item {
                SettingsRow(
                    label    = "RaceFacer Wear",
                    subLabel = "v1.0.0 · Standalone",
                ) {}
            }
        }
    }
}

@Composable
private fun GroupLabel(text: String) {
    Text(
        text          = text,
        color         = RaceFacerGreen,
        fontSize      = 9.sp,
        fontWeight    = FontWeight.Bold,
        letterSpacing = 1.5.sp,
        modifier      = Modifier.padding(top = 4.dp),
    )
}

@Composable
private fun SettingsRow(
    label: String,
    subLabel: String,
    trailing: String? = null,
    trailingColor: androidx.compose.ui.graphics.Color = TextMuted2,
    onClick: (() -> Unit)? = null,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(SurfaceDark)
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(label,    color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Medium)
            Text(subLabel, color = TextMuted,   fontSize = 10.sp)
        }
        if (trailing != null) {
            Text(trailing, color = trailingColor, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun ActionChip(
    label: String,
    color: androidx.compose.ui.graphics.Color = RaceFacerGreen,
    onClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(color.copy(alpha = 0.12f))
            .clickable(onClick = onClick)
            .padding(vertical = 10.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text       = label,
            color      = color,
            fontSize   = 12.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}
