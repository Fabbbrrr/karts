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
     * POST one flat JSON object per kart run to the configured endpoint.
     * Sending one request per run means the receiver (Pipedream, etc.) gets
     * simple flat JSON every time — no array mapping needed.
     * Returns Result.success(Unit) if all posts succeed, failure on first error.
     */
    suspend fun export(session: SessionData): Result<Unit> = withContext(Dispatchers.IO) {
        val url = dataStore.exportUrl.first()
        if (url.isBlank()) return@withContext Result.failure(IllegalStateException("No export URL set"))

        val ts = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(Date())

        runCatching {
            session.runs.forEach { run ->
                val json = buildRunJson(ts, session, run)
                postJson(url, json)
            }
        }
    }

    private fun postJson(url: String, json: String) {
        val bytes = json.toByteArray(Charsets.UTF_8)
        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod  = "POST"
            doOutput       = true
            connectTimeout = 10_000
            readTimeout    = 15_000
            setRequestProperty("Content-Type",   "application/json; charset=utf-8")
            setRequestProperty("Content-Length", bytes.size.toString())
            setRequestProperty("Accept",         "application/json")
        }
        connection.outputStream.use { it.write(bytes); it.flush() }
        val code = connection.responseCode
        connection.disconnect()
        if (code !in 200..299) throw RuntimeException("HTTP $code")
    }

    private fun buildRunJson(timestamp: String, session: SessionData, run: com.raceface.wear.domain.model.DriverRun): String {
        // lapTimes sent as a comma-separated string — Google Sheets cells must be scalar,
        // not arrays. Parse with SPLIT(J2,",") in the Sheet if needed.
        val lapTimesStr = run.lapTimes.joinToString(",")
        return """{"timestamp":${timestamp.jsonStr()},"eventName":${session.eventName.jsonStr()},"sessionName":${session.sessionName.jsonStr()},"kartNumber":${run.kartNumber.jsonStr()},"driverName":${run.driverName.jsonStr()},"position":${run.position},"bestTimeRaw":${run.bestTimeRaw},"lastTimeRaw":${run.lastTimeRaw},"laps":${run.laps},"lapTimes":${lapTimesStr.jsonStr()}}"""
    }

    private fun String.jsonStr(): String {
        val escaped = replace("\\", "\\\\").replace("\"", "\\\"")
        return "\"$escaped\""
    }
}
