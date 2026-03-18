package com.raceface.wear

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.lifecycleScope
import com.raceface.wear.data.local.DataStoreManager
import com.raceface.wear.presentation.navigation.RaceFacerNavGraph
import com.raceface.wear.presentation.navigation.Screen
import com.raceface.wear.presentation.theme.RaceFacerTheme
import com.raceface.wear.service.RaceConnectionService
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject lateinit var dataStore: DataStoreManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Start the foreground service that holds the Socket.IO connection
        startForegroundService(Intent(this, RaceConnectionService::class.java))

        lifecycleScope.launch {
            // Check if a kart has been previously selected
            val myKart = dataStore.myKart.first()
            val startDest = if (myKart.isNullOrBlank()) {
                Screen.KartPicker.myKart()
            } else {
                Screen.Hud.route
            }

            setContent {
                RaceFacerTheme {
                    RaceFacerNavGraph(startDestination = startDest)
                }
            }
        }
    }

    override fun onDestroy() {
        // Service is sticky — it will restart. Only stop explicitly from Settings.
        super.onDestroy()
    }
}
