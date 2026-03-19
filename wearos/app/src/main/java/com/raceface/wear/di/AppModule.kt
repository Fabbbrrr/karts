package com.raceface.wear.di

import android.content.Context
import com.raceface.wear.data.local.DataStoreManager
import com.raceface.wear.data.remote.SocketIOClient
import com.raceface.wear.data.repository.RaceRepository
import com.raceface.wear.domain.usecase.HapticManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides @Singleton
    fun provideSocketIOClient(): SocketIOClient = SocketIOClient()

    @Provides @Singleton
    fun provideDataStoreManager(
        @ApplicationContext context: Context
    ): DataStoreManager = DataStoreManager(context)

    @Provides @Singleton
    fun provideRaceRepository(
        socketClient: SocketIOClient,
        dataStore: DataStoreManager,
    ): RaceRepository = RaceRepository(socketClient, dataStore)

    @Provides @Singleton
    fun provideHapticManager(
        @ApplicationContext context: Context
    ): HapticManager = HapticManager(context)

    // Application-scoped scope that outlives any ViewModel.
    // Use this (not viewModelScope) for writes that must survive navigation-driven
    // ViewModel destruction — e.g. DataStore commits on Watch 6 NAND flash.
    @Provides @Singleton
    fun provideApplicationScope(): CoroutineScope = CoroutineScope(SupervisorJob())
}
