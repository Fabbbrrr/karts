# Socket.IO / Netty
-keep class io.socket.** { *; }
-keep class io.netty.** { *; }
-keep class com.neovisionaries.** { *; }
-dontwarn io.netty.**
-dontwarn com.neovisionaries.**

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**

# Hilt
-keep class * extends dagger.hilt.android.internal.managers.ApplicationComponentManager { *; }

# Keep data models for JSON parsing
-keep class com.raceface.wear.domain.model.** { *; }
