package com.raceface.wear.presentation.navigation

sealed class Screen(val route: String) {
    data object Hud         : Screen("hud")
    data object KartPicker  : Screen("kart_picker?phase={phase}") {
        fun myKart()   = "kart_picker?phase=my"
        fun mateKart() = "kart_picker?phase=mate"
    }
    data object LapHistory  : Screen("lap_history")
    data object Compare     : Screen("compare")
    data object Settings    : Screen("settings")
}
