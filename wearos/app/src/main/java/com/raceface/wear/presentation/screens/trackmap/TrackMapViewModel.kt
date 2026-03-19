package com.raceface.wear.presentation.screens.trackmap

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.raceface.wear.data.repository.RaceRepository
import com.raceface.wear.domain.model.GpsPoint
import com.raceface.wear.domain.usecase.LocationTrackingManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TrackMapUiState(
    // All points grouped by lap number (0 = pre-first-lap, 1 = lap 1, …)
    val lapPoints: Map<Int, List<GpsPoint>> = emptyMap(),
    val currentLap: Int = 0,
    // Which lap to display; -1 = show all laps overlaid
    val selectedLap: Int = -1,
    val isTracking: Boolean = false,
    val hasGpsPermission: Boolean = false,
)

@HiltViewModel
class TrackMapViewModel @Inject constructor(
    private val repository: RaceRepository,
    private val locationManager: LocationTrackingManager,
) : ViewModel() {

    private val _uiState = MutableStateFlow(TrackMapUiState())
    val uiState: StateFlow<TrackMapUiState> = _uiState.asStateFlow()

    // In-memory lap storage — mutable lists per lap for efficient appending
    private val lapStorage = mutableMapOf<Int, MutableList<GpsPoint>>()
    private var currentLapNumber = 0
    private var myKart: String? = null

    init {
        viewModelScope.launch {
            myKart = repository.dataStore.myKart.first()
        }

        // Collect incoming GPS points and bucket them by lap number
        viewModelScope.launch {
            locationManager.gpsFlow.collect { point ->
                val lap = lapStorage.getOrPut(currentLapNumber) { mutableListOf() }
                lap.add(point.copy(lapNumber = currentLapNumber))
                // Snapshot immutable copy for UI — avoid holding mutable refs across threads
                val snapshot = lapStorage.mapValues { it.value.toList() }
                _uiState.update { it.copy(lapPoints = snapshot) }
            }
        }

        // Advance lap counter when socket data shows a new lap completed for my kart
        viewModelScope.launch {
            repository.sessionDataFlow.collect { session ->
                val kart = myKart ?: return@collect
                val run = repository.getDriver(kart, session) ?: return@collect
                if (run.laps > currentLapNumber) {
                    currentLapNumber = run.laps
                    locationManager.onNewLap(currentLapNumber)
                    _uiState.update { it.copy(currentLap = currentLapNumber) }
                }
            }
        }
    }

    /** Called by the screen after the user grants ACCESS_FINE_LOCATION. */
    fun startTracking() {
        locationManager.startTracking()
        _uiState.update { it.copy(isTracking = true, hasGpsPermission = true) }
    }

    /** Called by the screen if the user denies ACCESS_FINE_LOCATION. */
    fun onPermissionDenied() {
        _uiState.update { it.copy(hasGpsPermission = false) }
    }

    /** Select which lap to display on the map; -1 shows all laps overlaid. */
    fun selectLap(lap: Int) {
        _uiState.update { it.copy(selectedLap = lap) }
    }

    override fun onCleared() {
        locationManager.stopTracking()
        super.onCleared()
    }
}
