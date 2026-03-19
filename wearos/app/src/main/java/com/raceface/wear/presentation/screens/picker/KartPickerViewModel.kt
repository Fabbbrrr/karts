package com.raceface.wear.presentation.screens.picker

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.raceface.wear.data.repository.RaceRepository
import com.raceface.wear.domain.model.DriverRun
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
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
    private val appScope: CoroutineScope,
) : ViewModel() {

    private val _uiState = MutableStateFlow(KartPickerUiState())
    val uiState: StateFlow<KartPickerUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repository.isConnected.collect { connected ->
                _uiState.update { it.copy(isConnected = connected) }
            }
        }
        viewModelScope.launch {
            repository.sessionDataFlow.collect { session ->
                _uiState.update { it.copy(drivers = session.runs) }
            }
        }
        viewModelScope.launch {
            repository.dataStore.myKart.collect { kart ->
                _uiState.update { it.copy(myKart = kart) }
            }
        }
        viewModelScope.launch {
            repository.dataStore.mateKart.collect { kart ->
                _uiState.update { it.copy(mateKart = kart) }
            }
        }
    }

    /** Pick my kart — clears any stale mate from a previous session. */
    fun selectKart(kartNumber: String) {
        appScope.launch {
            repository.dataStore.setMyKart(kartNumber)
            repository.dataStore.setMateKart(null)
        }
    }

    /** Pick (or clear) the comparison mate. */
    fun selectMate(kartNumber: String?) {
        appScope.launch { repository.dataStore.setMateKart(kartNumber) }
    }
}
