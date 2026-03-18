package com.raceface.wear.presentation.screens.picker

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.raceface.wear.data.repository.RaceRepository
import com.raceface.wear.domain.model.DriverRun
import com.raceface.wear.domain.model.SessionData
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class KartPickerUiState(
    val drivers: List<DriverRun> = emptyList(),
    val myKart: String? = null,
    val mateKart: String? = null,
    val isConnected: Boolean = false,
)

@HiltViewModel
class KartPickerViewModel @Inject constructor(
    private val repository: RaceRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(KartPickerUiState())
    val uiState: StateFlow<KartPickerUiState> = _uiState.asStateFlow()

    // Accumulate the latest driver list from the live session
    private var latestSession: SessionData? = null

    init {
        viewModelScope.launch {
            // Observe persisted selections
            combine(
                repository.dataStore.myKart,
                repository.dataStore.mateKart,
                repository.isConnected,
            ) { my, mate, connected ->
                Triple(my, mate, connected)
            }.collect { (my, mate, connected) ->
                _uiState.update { it.copy(myKart = my, mateKart = mate, isConnected = connected) }
            }
        }

        viewModelScope.launch {
            repository.sessionDataFlow.collect { session ->
                latestSession = session
                _uiState.update { it.copy(drivers = session.runs) }
            }
        }
    }

    fun setMyKart(kartNumber: String) {
        viewModelScope.launch {
            repository.dataStore.setMyKart(kartNumber)
        }
    }

    fun setMateKart(kartNumber: String?) {
        viewModelScope.launch {
            repository.dataStore.setMateKart(kartNumber)
        }
    }
}
