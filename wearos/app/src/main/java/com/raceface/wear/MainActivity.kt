package com.raceface.wear

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.lifecycleScope
import com.raceface.wear.presentation.navigation.RaceFacerNavGraph
import com.raceface.wear.presentation.navigation.Screen
import com.raceface.wear.presentation.theme.RaceFacerTheme
import com.raceface.wear.service.RaceConnectionService
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Start the foreground service that holds the Socket.IO connection
        startForegroundService(Intent(this, RaceConnectionService::class.java))

        lifecycleScope.launch {
            // Always start at the kart picker so stale DataStore selections
            // (kart from a previous session that no longer exists) can never
            // strand the user in an empty HUD loop.
            setContent {
                RaceFacerTheme {
                    RaceFacerNavGraph(startDestination = Screen.KartPicker.route)
                }
            }
        }
    }

    override fun onDestroy() {
        // Service is sticky — it will restart. Only stop explicitly from Settings.
        super.onDestroy()
    }
}
