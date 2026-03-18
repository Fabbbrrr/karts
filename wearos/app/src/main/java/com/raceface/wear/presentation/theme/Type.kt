package com.raceface.wear.presentation.theme

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Typography

// Monospace (system default) — all timing values use this to prevent digit-jitter
val Mono = FontFamily.Monospace

val WearTypography = Typography(
    // 52sp: last lap hero (HUD main value)
    display1 = TextStyle(
        fontFamily = Mono,
        fontWeight = FontWeight.ExtraBold,
        fontSize   = 52.sp,
        lineHeight = 52.sp,
        letterSpacing = (-1).sp,
    ),
    // 36sp: position hero (large but secondary to last lap)
    display2 = TextStyle(
        fontFamily = Mono,
        fontWeight = FontWeight.Bold,
        fontSize   = 36.sp,
        lineHeight = 38.sp,
    ),
    // 24sp: card values (best, gap, interval)
    display3 = TextStyle(
        fontFamily = Mono,
        fontWeight = FontWeight.Bold,
        fontSize   = 24.sp,
    ),
    // 17sp: lap history times
    title1 = TextStyle(
        fontFamily = Mono,
        fontWeight = FontWeight.Bold,
        fontSize   = 17.sp,
    ),
    // 14sp: secondary labels
    title2 = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold,
        fontSize   = 14.sp,
    ),
    // 13sp: data values
    title3 = TextStyle(
        fontFamily = Mono,
        fontWeight = FontWeight.Normal,
        fontSize   = 13.sp,
    ),
    // 12sp: muted labels / deltas
    body1 = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize   = 12.sp,
    ),
    // 10sp: section labels (uppercase tracking)
    body2 = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize   = 10.sp,
        letterSpacing = 1.5.sp,
    ),
    // 9sp: very small labels
    caption1 = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize   = 9.sp,
    ),
    caption2 = TextStyle(
        fontFamily = Mono,
        fontWeight = FontWeight.Normal,
        fontSize   = 9.sp,
    ),
    // 11sp: button labels
    button = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize   = 11.sp,
        letterSpacing = 0.5.sp,
    ),
)
