package com.raceface.wear.presentation.screens.hud

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.raceface.wear.data.repository.RaceRepository
import com.raceface.wear.domain.model.ConnectionState
import com.raceface.wear.domain.model.ExportState
import com.raceface.wear.domain.model.HudUiState
import com.raceface.wear.domain.model.LapColor
import com.raceface.wear.domain.model.SessionData
import com.raceface.wear.domain.usecase.HapticEvent
import com.raceface.wear.domain.usecase.HapticManager
import com.raceface.wear.domain.usecase.RaceExporter
import com.raceface.wear.domain.usecase.RaceMath
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HudViewModel @Inject constructor(
    private val repository: RaceRepository,
    private val haptic: HapticManager,
    private val exporter: RaceExporter,
) : ViewModel() {

    private val _uiState = MutableStateFlow(HudUiState())
    val uiState: StateFlow<HudUiState> = _uiState.asStateFlow()

    // Track session best lap for lap colouring
    private var sessionBestMs: Long = Long.MAX_VALUE
    private var personalBestMs: Long = Long.MAX_VALUE

    // For haptic detection — tracks the last lap time we fired a haptic for
    private var lastHapticLapMs: Long = -1L
    private var prevConnectionState: ConnectionState? = null

    init {
        viewModelScope.launch {
            combine(
                repository.dataStore.myKart,
                repository.dataStore.mateKart,
                repository.connectionState,
            ) { my, mate, conn -> Triple(my, mate, conn) }
                .collect { (myKart, mateKart, conn) ->
                    // Fire haptic on connection state changes
                    val prev = prevConnectionState
                    if (prev != null && prev != conn) {
                        when (conn) {
                            ConnectionState.CONNECTED    -> haptic.fire(HapticEvent.CONNECTED)
                            ConnectionState.DISCONNECTED -> haptic.fire(HapticEvent.DISCONNECTED)
                            else -> Unit
                        }
                    }
                    prevConnectionState = conn

                    _uiState.update { it.copy(connection = conn) }
                    val current = _uiState.value.sessionData
                    if (current != null) updateFromSession(current, myKart, mateKart)
                }
        }

        viewModelScope.launch {
            repository.sessionDataFlow.collect { session ->
                val myKart   = repository.dataStore.myKart.first()
                val mateKart = repository.dataStore.mateKart.first()
                updateFromSession(session, myKart, mateKart)
            }
        }
    }

    private fun updateFromSession(session: SessionData, myKart: String?, mateKart: String?) {
        val myRun   = myKart?.let { repository.getDriver(it, session) }
        val mateRun = mateKart?.let { repository.getDriver(it, session) }

        // Update session best
        session.runs.forEach { run ->
            if (run.bestTimeRaw in 1 until RaceMath.LAP_THRESHOLD_MS) {
                if (run.bestTimeRaw < sessionBestMs) sessionBestMs = run.bestTimeRaw
            }
        }

        // Update personal best for my kart
        if (myRun != null && myRun.bestTimeRaw in 1 until RaceMath.LAP_THRESHOLD_MS) {
            if (myRun.bestTimeRaw < personalBestMs) personalBestMs = myRun.bestTimeRaw
        }

        val lapHistory = if (myRun != null && myRun.lapTimes.isNotEmpty()) {
            RaceMath.buildLapHistory(myRun.lapTimes, sessionBestMs, personalBestMs)
        } else emptyList()

        val lastLapColor = when {
            myRun == null -> LapColor.NORMAL
            myRun.lastTimeRaw <= 0 -> LapColor.NORMAL
            myRun.lastTimeRaw == sessionBestMs -> LapColor.BEST_SESSION
            myRun.lastTimeRaw == personalBestMs -> LapColor.PERSONAL_BEST
            RaceMath.isIncident(myRun.lastTimeRaw, myRun.lapTimes) -> LapColor.INCIDENT
            else -> LapColor.NORMAL
        }

        // Fire haptic when a new lap completes (lastTimeRaw changes to a new valid value)
        if (myRun != null && myRun.lastTimeRaw > 0 && myRun.lastTimeRaw != lastHapticLapMs) {
            lastHapticLapMs = myRun.lastTimeRaw
            val hapticEvent = when (lastLapColor) {
                LapColor.BEST_SESSION  -> HapticEvent.SESSION_BEST
                LapColor.PERSONAL_BEST -> HapticEvent.PERSONAL_BEST
                LapColor.INCIDENT      -> HapticEvent.INCIDENT
                LapColor.NORMAL        -> HapticEvent.LAP_COMPLETED
            }
            haptic.fire(hapticEvent)
        }

        _uiState.update {
            it.copy(
                myRun        = myRun,
                mateRun      = mateRun,
                sessionData  = session,
                lastLapColor = lastLapColor,
                lapHistory   = lapHistory,
            )
        }
    }

    fun saveRace() {
        val session = _uiState.value.sessionData ?: return
        if (_uiState.value.exportState == ExportState.SENDING) return  // debounce

        viewModelScope.launch {
            _uiState.update { it.copy(exportState = ExportState.SENDING) }

            val result = exporter.export(session)

            if (result.isSuccess) {
                haptic.fire(HapticEvent.CONNECTED)   // short positive buzz
                _uiState.update { it.copy(exportState = ExportState.SUCCESS) }
            } else {
                haptic.fire(HapticEvent.DISCONNECTED) // short negative buzz
                _uiState.update { it.copy(exportState = ExportState.ERROR) }
            }

            // Auto-reset pill to IDLE after 3 seconds
            delay(3_000)
            _uiState.update { it.copy(exportState = ExportState.IDLE) }
        }
    }
}
