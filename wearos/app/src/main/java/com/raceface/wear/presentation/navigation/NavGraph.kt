package com.raceface.wear.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavType
import androidx.navigation.navArgument
import androidx.wear.compose.navigation.SwipeDismissableNavHost
import androidx.wear.compose.navigation.composable
import androidx.wear.compose.navigation.rememberSwipeDismissableNavController
import com.raceface.wear.presentation.screens.compare.CompareScreen
import com.raceface.wear.presentation.screens.hud.HudScreen
import com.raceface.wear.presentation.screens.hud.HudViewModel
import com.raceface.wear.presentation.screens.laps.LapHistoryScreen
import com.raceface.wear.presentation.screens.laps.LapHistoryViewModel
import com.raceface.wear.presentation.screens.picker.KartPickerScreen
import com.raceface.wear.presentation.screens.picker.KartPickerViewModel
import com.raceface.wear.presentation.screens.compare.CompareViewModel
import com.raceface.wear.presentation.screens.settings.SettingsScreen
import com.raceface.wear.presentation.screens.settings.SettingsViewModel

@Composable
fun RaceFacerNavGraph(startDestination: String) {
    val navController = rememberSwipeDismissableNavController()

    SwipeDismissableNavHost(
        navController   = navController,
        startDestination = startDestination,
    ) {
        // ── HUD ─────────────────────────────────────────────────────────────
        composable(Screen.Hud.route) {
            val vm: HudViewModel = hiltViewModel()
            val state by vm.uiState.collectAsStateWithLifecycle()
            HudScreen(
                state         = state,
                onPickerClick = { navController.navigate(Screen.KartPicker.myKart()) },
                onLapHistory  = { navController.navigate(Screen.LapHistory.route) },
                onCompare     = { navController.navigate(Screen.Compare.route) },
                onSettings    = { navController.navigate(Screen.Settings.route) },
            )
        }

        // ── Kart Picker ──────────────────────────────────────────────────────
        composable(
            route     = "kart_picker?phase={phase}",
            arguments = listOf(navArgument("phase") {
                type         = NavType.StringType
                defaultValue = "my"
            })
        ) { backStack ->
            val phase = backStack.arguments?.getString("phase") ?: "my"
            val vm: KartPickerViewModel = hiltViewModel()
            val state by vm.uiState.collectAsStateWithLifecycle()
            KartPickerScreen(
                phase          = phase,
                state          = state,
                onMyKartPicked = { kart ->
                    vm.setMyKart(kart)
                    navController.navigate(Screen.KartPicker.mateKart()) {
                        popUpTo(Screen.KartPicker.myKart()) { inclusive = true }
                    }
                },
                onMateKartPicked = { kart ->
                    vm.setMateKart(kart)
                    navController.navigate(Screen.Hud.route) {
                        popUpTo(Screen.KartPicker.mateKart()) { inclusive = true }
                    }
                },
                onSkipMate = {
                    vm.setMateKart(null)
                    navController.navigate(Screen.Hud.route) {
                        popUpTo(Screen.KartPicker.mateKart()) { inclusive = true }
                    }
                },
            )
        }

        // ── Lap History ──────────────────────────────────────────────────────
        composable(Screen.LapHistory.route) {
            val vm: LapHistoryViewModel = hiltViewModel()
            val state by vm.uiState.collectAsStateWithLifecycle()
            LapHistoryScreen(state = state)
        }

        // ── Compare ──────────────────────────────────────────────────────────
        composable(Screen.Compare.route) {
            val vm: CompareViewModel = hiltViewModel()
            val state by vm.uiState.collectAsStateWithLifecycle()
            CompareScreen(
                state     = state,
                onRepick  = { navController.navigate(Screen.KartPicker.myKart()) },
            )
        }

        // ── Settings ─────────────────────────────────────────────────────────
        composable(Screen.Settings.route) {
            val vm: SettingsViewModel = hiltViewModel()
            val state by vm.uiState.collectAsStateWithLifecycle()
            SettingsScreen(
                state          = state,
                onReconnect    = vm::reconnect,
                onChannelSave  = vm::saveChannel,
                onRepickKarts  = { navController.navigate(Screen.KartPicker.myKart()) },
                onClearMate    = vm::clearMate,
            )
        }
    }
}
