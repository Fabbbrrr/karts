package com.raceface.wear.presentation.navigation

sealed class Screen(val route: String) {
    data object Hud        : Screen("hud")
    data object KartPicker : Screen("kart_picker")
    data object MatePicker : Screen("mate_picker")
    data object LapHistory : Screen("lap_history")
    data object Compare    : Screen("compare")
    data object Settings   : Screen("settings")
    data object TrackMap   : Screen("track_map")
}
