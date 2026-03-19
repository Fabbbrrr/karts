package com.raceface.wear.domain.usecase

import com.raceface.wear.data.local.DataStoreManager
import com.raceface.wear.domain.model.SessionData
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RaceExporter @Inject constructor(
    private val dataStore: DataStoreManager,
) {
    /**
     * POST the full session to the configured Google Apps Script URL.
     * Builds JSON manually — no extra library required.
     * Returns Result.success(Unit) or Result.failure(exception).
     */
    suspend fun export(session: SessionData): Result<Unit> = withContext(Dispatchers.IO) {
        val url = dataStore.exportUrl.first()
        if (url.isBlank()) return@withContext Result.failure(IllegalStateException("No export URL set"))

        runCatching {
            val json = buildJson(session)
            val connection = (URL(url).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                setRequestProperty("Content-Type", "application/json; charset=utf-8")
                doOutput      = true
                connectTimeout = 10_000
                readTimeout    = 15_000
            }
            OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { it.write(json) }
            val code = connection.responseCode
            connection.disconnect()
            if (code !in 200..299) throw RuntimeException("HTTP $code")
        }
    }

    private fun buildJson(session: SessionData): String {
        val ts = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(Date())

        val runsJson = session.runs.joinToString(",\n") { run ->
            val lapTimesJson = run.lapTimes.joinToString(",") { it.toString() }
            """    {
      "kartNumber":   ${run.kartNumber.jsonStr()},
      "driverName":   ${run.driverName.jsonStr()},
      "position":     ${run.position},
      "bestTimeRaw":  ${run.bestTimeRaw},
      "lastTimeRaw":  ${run.lastTimeRaw},
      "laps":         ${run.laps},
      "lapTimes":     [$lapTimesJson]
    }"""
        }

        return """{
  "timestamp":   "$ts",
  "eventName":   ${session.eventName.jsonStr()},
  "sessionName": ${session.sessionName.jsonStr()},
  "runs": [
$runsJson
  ]
}"""
    }

    private fun String.jsonStr(): String {
        val escaped = replace("\\", "\\\\").replace("\"", "\\\"")
        return "\"$escaped\""
    }
}
