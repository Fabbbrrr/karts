package com.raceface.wear.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "raceface_prefs")

@Singleton
class DataStoreManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        val KEY_MY_KART   = stringPreferencesKey("my_kart")
        val KEY_MATE_KART = stringPreferencesKey("mate_kart")
        val KEY_CHANNEL   = stringPreferencesKey("channel")
    }

    val myKart: Flow<String?>   = context.dataStore.data.map { it[KEY_MY_KART] }
    val mateKart: Flow<String?> = context.dataStore.data.map { it[KEY_MATE_KART] }
    val channel: Flow<String>   = context.dataStore.data.map { it[KEY_CHANNEL] ?: "lemansentertainment" }

    suspend fun setMyKart(kart: String) {
        context.dataStore.edit { it[KEY_MY_KART] = kart }
    }

    suspend fun setMateKart(kart: String?) {
        context.dataStore.edit {
            if (kart == null) it.remove(KEY_MATE_KART) else it[KEY_MATE_KART] = kart
        }
    }

    suspend fun setChannel(channel: String) {
        context.dataStore.edit { it[KEY_CHANNEL] = channel }
    }

    suspend fun clearKarts() {
        context.dataStore.edit {
            it.remove(KEY_MY_KART)
            it.remove(KEY_MATE_KART)
        }
    }
}
