package com.raceface.wear.data.remote

import com.raceface.wear.domain.model.DriverRun
import com.raceface.wear.domain.model.SessionData
import com.raceface.wear.domain.usecase.RaceMath
import org.json.JSONArray
import org.json.JSONObject

object RaceDataMapper {

    /**
     * Parse the raw socket.io argument into a [SessionData].
     * Handles two payload shapes:
     *   1. Direct object with a `runs` array
     *   2. Wrapped: { data: { runs: [...] } }
     */
    fun parse(raw: Any?): SessionData? = try {
        val obj: JSONObject = when (raw) {
            is JSONObject -> raw
            is String     -> JSONObject(raw)
            else          -> return null
        }

        // Unwrap data.data if present
        val root = when {
            obj.has("data") && obj.get("data") is JSONObject -> {
                val inner = obj.getJSONObject("data")
                if (inner.has("data") && inner.get("data") is JSONObject)
                    inner.getJSONObject("data")
                else inner
            }
            else -> obj
        }

        val runsArray: JSONArray = root.optJSONArray("runs") ?: return null
        val runs = (0 until runsArray.length()).mapNotNull { i ->
            parseRun(runsArray.getJSONObject(i))
        }.sortedBy { it.position }

        SessionData(
            runs        = runs,
            eventName   = root.optString("event_name", "Race"),
            sessionName = root.optString("session_name", "Session"),
            currentLap  = root.optInt("current_lap", 0),
            totalLaps   = root.optInt("total_laps", 0),
        )
    } catch (e: Exception) {
        null
    }

    private fun parseRun(obj: JSONObject): DriverRun? = try {
        // kart_number or kart
        val kartNumber = obj.optString("kart_number")
            .ifBlank { obj.optString("kart") }
            .ifBlank { return null }

        val lastRaw = obj.optLong("last_time_raw", 0L)
        val bestRaw = obj.optLong("best_time_raw", 0L)

        // lap_times is an array of {lapTimeRaw: number} objects
        val lapTimes = parseLapTimes(obj.optJSONArray("lap_times"))

        // avg_lap might be in ms or might be a computed value
        val avgRaw = when {
            obj.has("avg_lap") -> obj.optLong("avg_lap", 0L)
            lapTimes.isNotEmpty() -> RaceMath.avgLap(lapTimes)
            else -> 0L
        }

        DriverRun(
            kartNumber        = kartNumber,
            driverName        = obj.optString("name", kartNumber),
            position          = obj.optInt("pos", 99),
            laps              = obj.optInt("laps", obj.optInt("total_laps", 0)),
            lastTimeRaw       = lastRaw,
            lastTimeFormatted = obj.optString("last_time").ifBlank { RaceMath.formatTime(lastRaw) },
            bestTimeRaw       = bestRaw,
            bestTimeFormatted = obj.optString("best_time").ifBlank { RaceMath.formatTime(bestRaw) },
            avgLapRaw         = avgRaw,
            lapTimes          = lapTimes,
            gap               = obj.optString("gap", "—").ifBlank { "—" },
            interval          = obj.optString("int", "—").ifBlank { "—" },
            track             = obj.optString("track_configuration_id", ""),
        )
    } catch (e: Exception) {
        null
    }

    private fun parseLapTimes(arr: JSONArray?): List<Long> {
        if (arr == null) return emptyList()
        val result = mutableListOf<Long>()
        for (i in 0 until arr.length()) {
            val item = arr.get(i)
            when (item) {
                is JSONObject -> {
                    val ms = item.optLong("lapTimeRaw", item.optLong("lapTime", 0L))
                    if (ms > 0) result.add(ms)
                }
                is Number -> {
                    val ms = item.toLong()
                    if (ms > 0) result.add(ms)
                }
            }
        }
        return result
    }
}
