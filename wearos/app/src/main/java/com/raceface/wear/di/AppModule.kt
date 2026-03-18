package com.raceface.wear.di

import android.content.Context
import com.raceface.wear.data.local.DataStoreManager
import com.raceface.wear.data.remote.SocketIOClient
import com.raceface.wear.data.repository.RaceRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
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
}
