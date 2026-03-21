plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ksp)
}

android {
    namespace  = "com.raceface.wear"
    compileSdk = 35

    defaultConfig {
        applicationId   = "com.raceface.wear"
        minSdk          = 30          // Wear OS 3 (Galaxy Watch 4+)
        targetSdk       = 35
        versionCode     = 1
        versionName     = "1.0.0"

        // Inject build timestamp so the user can verify which build is installed
        val now = java.time.LocalDateTime.now()
        val buildTime = now.format(java.time.format.DateTimeFormatter.ofPattern("MMM dd HH:mm"))
        buildConfigField("String", "BUILD_TIME", "\"${buildTime}\"")
    }

    buildFeatures {
        buildConfig = true
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isDebuggable = true
            // versionNameSuffix = "-debug"
        }
    }

    buildFeatures {
        compose = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
            // socket.io-client brings duplicate META-INF entries
            excludes += "/META-INF/INDEX.LIST"
            excludes += "/META-INF/io.netty.versions.properties"
        }
    }
}

dependencies {
    // Compose BOM
    val composeBom = platform(libs.compose.bom)
    implementation(composeBom)
    implementation(libs.compose.ui)
    implementation(libs.compose.runtime)

    // Wear OS Compose
    implementation(libs.wear.compose.material)
    implementation(libs.wear.compose.foundation)
    implementation(libs.wear.compose.navigation)
    debugImplementation(libs.wear.compose.ui.tooling)

    // Horologist
    implementation(libs.horologist.composables)
    implementation(libs.horologist.compose.layout)

    // Hilt
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.hilt.navigation.compose)

    // DataStore
    implementation(libs.datastore.preferences)

    // Lifecycle
    implementation(libs.lifecycle.viewmodel.compose)
    implementation(libs.lifecycle.runtime.compose)

    // Coroutines
    implementation(libs.kotlinx.coroutines.android)

    // Socket.IO — connect directly to live.racefacer.com:3123
    implementation(libs.socketio.client)

    // Activity
    implementation(libs.activity.compose)

    // Wear Ambient (AmbientLifecycleObserver for AOD)
    implementation(libs.wear.ambient)

    // Location (GPS for track map)
    implementation(libs.play.services.location)
}
