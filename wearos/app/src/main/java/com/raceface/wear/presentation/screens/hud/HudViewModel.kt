package com.raceface.wear.presentation.screens.hud

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.raceface.wear.data.repository.RaceRepository
import com.raceface.wear.domain.model.ConnectionState
import com.raceface.wear.domain.model.HudUiState
import com.raceface.wear.domain.model.LapColor
import com.raceface.wear.domain.model.SessionData
import com.raceface.wear.domain.usecase.RaceMath
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HudViewModel @Inject constructor(
    private val repository: RaceRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(HudUiState())
    val uiState: StateFlow<HudUiState> = _uiState.asStateFlow()

    // Track session best lap for lap colouring
    private var sessionBestMs: Long = Long.MAX_VALUE
    private var personalBestMs: Long = Long.MAX_VALUE

    init {
        viewModelScope.launch {
            combine(
                repository.dataStore.myKart,
                repository.dataStore.mateKart,
                repository.connectionState,
            ) { my, mate, conn -> Triple(my, mate, conn) }
                .collect { (myKart, mateKart, conn) ->
                    _uiState.update {
                        it.copy(connection = conn)
                    }
                    // Trigger a state update with current session if available
                    val current = _uiState.value.sessionData
                    if (current != null) updateFromSession(current, myKart, mateKart)
                }
        }

        viewModelScope.launch {
            repository.sessionDataFlow.collect { session ->
                val myKart   = repository.dataStore.myKart.value
                val mateKart = repository.dataStore.mateKart.value
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

        _uiState.update {
            it.copy(
                myRun        = myRun,
                mateRun      = mateRun,
                sessionData  = session,
                // connection state is updated separately via the combine() collector above
                lastLapColor = lastLapColor,
                lapHistory   = lapHistory,
            )
        }
    }

}
