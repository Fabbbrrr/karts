package com.raceface.wear.presentation.theme

import androidx.compose.runtime.Composable
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Colors

private val WearColorScheme = Colors(
    primary          = RaceFacerGreen,
    primaryVariant   = RaceFacerGreen.copy(alpha = 0.7f),
    secondary        = RaceFacerAmber,
    secondaryVariant = RaceFacerAmber.copy(alpha = 0.7f),
    error            = RaceFacerRed,
    background       = BackgroundBlack,
    surface          = SurfaceDark,
    onPrimary        = BackgroundBlack,
    onSecondary      = BackgroundBlack,
    onBackground     = androidx.compose.ui.graphics.Color.White,
    onSurface        = androidx.compose.ui.graphics.Color.White,
    onError          = androidx.compose.ui.graphics.Color.White,
)

@Composable
fun RaceFacerTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colors     = WearColorScheme,
        typography = WearTypography,
        content    = content,
    )
}
