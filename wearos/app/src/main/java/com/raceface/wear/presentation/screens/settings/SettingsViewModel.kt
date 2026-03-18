package com.raceface.wear.presentation.screens.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.raceface.wear.data.repository.RaceRepository
import com.raceface.wear.domain.model.ConnectionState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsUiState(
    val myKart: String? = null,
    val mateKart: String? = null,
    val channel: String = "lemansentertainment",
    val connection: ConnectionState = ConnectionState.CONNECTING,
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val repository: RaceRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            combine(
                repository.dataStore.myKart,
                repository.dataStore.mateKart,
                repository.dataStore.channel,
                repository.connectionState,
            ) { my, mate, ch, conn -> listOf(my, mate, ch, conn) }
                .collect { (my, mate, ch, conn) ->
                    _uiState.update {
                        it.copy(
                            myKart     = my as String?,
                            mateKart   = mate as String?,
                            channel    = ch as String,
                            connection = conn as ConnectionState,
                        )
                    }
                }
        }
    }

    fun saveChannel(channel: String) {
        viewModelScope.launch {
            repository.dataStore.setChannel(channel.trim())
            repository.reconnect()
        }
    }

    fun reconnect() {
        viewModelScope.launch {
            repository.reconnect()
        }
    }

    fun clearMate() {
        viewModelScope.launch {
            repository.dataStore.setMateKart(null)
        }
    }
}
