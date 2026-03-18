package com.raceface.wear.presentation.screens.compare

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.raceface.wear.data.repository.RaceRepository
import com.raceface.wear.domain.model.LapComparison
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CompareUiState(
    val comparison: LapComparison? = null,
    val noMateSelected: Boolean = false,
)

@HiltViewModel
class CompareViewModel @Inject constructor(
    private val repository: RaceRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(CompareUiState())
    val uiState: StateFlow<CompareUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            combine(
                repository.dataStore.myKart,
                repository.dataStore.mateKart,
                repository.sessionDataFlow,
            ) { my, mate, session -> Triple(my, mate, session) }
                .collect { (myKart, mateKart, session) ->
                    if (mateKart == null) {
                        _uiState.update { it.copy(comparison = null, noMateSelected = true) }
                        return@collect
                    }
                    val myRun   = myKart?.let { repository.getDriver(it, session) }
                    val mateRun = repository.getDriver(mateKart, session)

                    if (myRun != null && mateRun != null) {
                        val comparison = repository.buildComparison(myRun, mateRun)
                        _uiState.update { it.copy(comparison = comparison, noMateSelected = false) }
                    }
                }
        }
    }
}
