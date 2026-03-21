package com.raceface.wear.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.wear.compose.navigation.SwipeDismissableNavHost
import androidx.wear.compose.navigation.composable
import androidx.wear.compose.navigation.rememberSwipeDismissableNavController
import com.raceface.wear.presentation.screens.compare.CompareScreen
import com.raceface.wear.presentation.screens.compare.CompareViewModel
import com.raceface.wear.presentation.screens.hud.HudScreen
import com.raceface.wear.presentation.screens.hud.HudViewModel
import com.raceface.wear.presentation.screens.laps.LapHistoryScreen
import com.raceface.wear.presentation.screens.laps.LapHistoryViewModel
import com.raceface.wear.presentation.screens.picker.KartPickerScreen
import com.raceface.wear.presentation.screens.picker.KartPickerViewModel
import com.raceface.wear.presentation.screens.settings.SettingsScreen
import com.raceface.wear.presentation.screens.settings.SettingsViewModel
import com.raceface.wear.presentation.screens.trackmap.TrackMapScreen
import com.raceface.wear.presentation.screens.trackmap.TrackMapViewModel

@Composable
fun RaceFacerNavGraph(startDestination: String) {
    val navController = rememberSwipeDismissableNavController()

    SwipeDismissableNavHost(
        navController    = navController,
        startDestination = startDestination,
    ) {

        // ── Kart Picker (start screen) ─────────────────────────────────────
        composable(Screen.KartPicker.route) {
            val vm: KartPickerViewModel = hiltViewModel()
            val state by vm.uiState.collectAsStateWithLifecycle()
            KartPickerScreen(
                title        = "MY KART",
                drivers      = state.drivers,
                isConnected  = state.isConnected,
                selectedKart = state.myKart,
                onKartPicked = { kart ->
                    vm.selectKart(kart)
                    navController.navigate(Screen.Hud.route) {
                        popUpTo(0) { inclusive = true }
                    }
                },
            )
        }

        // ── HUD ─────────────────────────────────────────────────────────────
        composable(Screen.Hud.route) {
            val vm: HudViewModel = hiltViewModel()
            val state by vm.uiState.collectAsStateWithLifecycle()
            HudScreen(
                state         = state,
                onPickerClick = { navController.navigate(Screen.KartPicker.route) },
                onPickMate    = { navController.navigate(Screen.MatePicker.route) },
                onLapHistory  = { navController.navigate(Screen.LapHistory.route) },
                onCompare     = { navController.navigate(Screen.Compare.route) },
                onSettings    = { navController.navigate(Screen.Settings.route) },
                onTrackMap    = { navController.navigate(Screen.TrackMap.route) },
                onSaveRace    = vm::saveRace,
            )
        }

        // ── Mate Picker (from HUD only) ────────────────────────────────────
        composable(Screen.MatePicker.route) {
            val vm: KartPickerViewModel = hiltViewModel()
            val state by vm.uiState.collectAsStateWithLifecycle()
            KartPickerScreen(
                title        = "COMPARE WITH",
                drivers      = state.drivers.filter { it.kartNumber != state.myKart },
                isConnected  = state.isConnected,
                selectedKart = state.mateKart,
                onKartPicked = { kart ->
                    vm.selectMate(kart)
                    navController.popBackStack(Screen.Hud.route, false)
                },
                onSkip = {
                    vm.selectMate(null)
                    navController.popBackStack(Screen.Hud.route, false)
                },
            )
        }

        // ── Lap History ─────────────────────────────────────────────────────
        composable(Screen.LapHistory.route) {
            val vm: LapHistoryViewModel = hiltViewModel()
            val state by vm.uiState.collectAsStateWithLifecycle()
            LapHistoryScreen(state = state)
        }

        // ── Compare ─────────────────────────────────────────────────────────
        composable(Screen.Compare.route) {
            val vm: CompareViewModel = hiltViewModel()
            val state by vm.uiState.collectAsStateWithLifecycle()
            CompareScreen(
                state       = state,
                onRepick    = { navController.navigate(Screen.KartPicker.route) },
                onBackToHud = {
                    if (!navController.popBackStack(Screen.Hud.route, false)) {
                        navController.navigate(Screen.Hud.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                },
            )
        }

        // ── Settings ────────────────────────────────────────────────────────
        composable(Screen.Settings.route) {
            val vm: SettingsViewModel = hiltViewModel()
            val state by vm.uiState.collectAsStateWithLifecycle()
            SettingsScreen(
                state            = state,
                onReconnect      = vm::reconnect,
                onChannelSave    = vm::saveChannel,
                onRepickKarts    = { navController.navigate(Screen.KartPicker.route) },
                onClearMate      = vm::clearMate,
                onExportUrlSave  = vm::saveExportUrl,
            )
        }

        // ── Track Map ───────────────────────────────────────────────────────
        composable(Screen.TrackMap.route) {
            val vm: TrackMapViewModel = hiltViewModel()
            val state by vm.uiState.collectAsStateWithLifecycle()
            TrackMapScreen(state = state, viewModel = vm)
        }
    }
}
