package com.raceface.wear.presentation.screens.laps

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.raceface.wear.data.repository.RaceRepository
import com.raceface.wear.domain.model.LapEntry
import com.raceface.wear.domain.usecase.RaceMath
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LapHistoryUiState(
    val kartNumber: String = "",
    val driverName: String = "",
    val laps: List<LapEntry> = emptyList(),
    val totalLaps: Int = 0,
)

@HiltViewModel
class LapHistoryViewModel @Inject constructor(
    private val repository: RaceRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(LapHistoryUiState())
    val uiState: StateFlow<LapHistoryUiState> = _uiState.asStateFlow()

    private var sessionBestMs: Long = Long.MAX_VALUE
    private var personalBestMs: Long = Long.MAX_VALUE

    init {
        viewModelScope.launch {
            combine(
                repository.dataStore.myKart,
                repository.sessionDataFlow,
            ) { myKart, session -> Pair(myKart, session) }
                .collect { (myKart, session) ->
                    if (myKart == null) return@collect
                    val run = repository.getDriver(myKart, session) ?: return@collect

                    // Update session best
                    session.runs.forEach { r ->
                        if (r.bestTimeRaw in 1 until RaceMath.LAP_THRESHOLD_MS) {
                            if (r.bestTimeRaw < sessionBestMs) sessionBestMs = r.bestTimeRaw
                        }
                    }
                    if (run.bestTimeRaw in 1 until RaceMath.LAP_THRESHOLD_MS) {
                        if (run.bestTimeRaw < personalBestMs) personalBestMs = run.bestTimeRaw
                    }

                    val laps = RaceMath.buildLapHistory(run.lapTimes, sessionBestMs, personalBestMs)

                    _uiState.update {
                        it.copy(
                            kartNumber = run.kartNumber,
                            driverName = run.driverName,
                            laps       = laps,
                            totalLaps  = run.laps,
                        )
                    }
                }
        }
    }
}
