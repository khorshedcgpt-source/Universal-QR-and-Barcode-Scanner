package org.universal.scanner.poc.benchmark

import android.graphics.Bitmap
import org.json.JSONArray
import org.json.JSONObject
import org.universal.scanner.poc.corpus.SyntheticCorpus
import org.universal.scanner.poc.engine.IScannerEngine
import org.universal.scanner.poc.model.FixtureCategory
import org.universal.scanner.poc.model.TestFixture

/**
 * Automated benchmark execution engine for the Android POC.
 * Executes repeated iterations (10 attempts per fixture) to measure latency,
 * repeatability, detection reliability, and byte-exact payload fidelity.
 */
class BenchmarkRunner(
    private val engine: IScannerEngine,
    private val bitmapProvider: (TestFixture) -> Bitmap?
) {

    data class FixtureBenchmarkResult(
        val fixtureId: String,
        val format: String,
        val category: String,
        val condition: String,
        val expectedPayload: String,
        val decodedPayload: String,
        val resultStatus: String, // PASS, PARTIAL, FAIL, NOT_SUPPORTED, NOT_VERIFIED, BLOCKED
        val exactMatch: Boolean,
        val minLatencyMs: Double,
        val maxLatencyMs: Double,
        val avgLatencyMs: Double,
        val medianLatencyMs: Double,
        val attempts: Int,
        val successfulAttempts: Int,
        val notes: String
    ) {
        fun toJsonObject(): JSONObject = JSONObject().apply {
            put("engine", "Android: ${engine.name}")
            put("platform", "Android")
            put("fixtureId", fixtureId)
            put("format", format)
            put("category", category)
            put("condition", condition)
            put("expectedPayload", expectedPayload)
            put("decodedPayload", decodedPayload)
            put("result", resultStatus)
            put("exactMatch", exactMatch)
            put("avgLatencyMs", avgLatencyMs)
            put("minLatencyMs", minLatencyMs)
            put("maxLatencyMs", maxLatencyMs)
            put("medianLatencyMs", medianLatencyMs)
            put("attempts", attempts)
            put("successfulAttempts", successfulAttempts)
            put("notes", notes)
        }
    }

    fun runBenchmark(
        iterationsPerFixture: Int = 10,
        onProgress: (Int, Int, String) -> Unit = { _, _, _ -> }
    ): List<FixtureBenchmarkResult> {
        val results = mutableListOf<FixtureBenchmarkResult>()
        val fixtures = SyntheticCorpus.ALL_FIXTURES
        val total = fixtures.size

        fixtures.forEachIndexed { index, fixture ->
            onProgress(index + 1, total, fixture.id)
            val bitmap = bitmapProvider(fixture)

            if (bitmap == null) {
                results.add(
                    FixtureBenchmarkResult(
                        fixtureId = fixture.id,
                        format = fixture.format.standardName,
                        category = fixture.category.name,
                        condition = fixture.condition,
                        expectedPayload = fixture.expectedPayload,
                        decodedPayload = "",
                        resultStatus = "BLOCKED",
                        exactMatch = false,
                        minLatencyMs = 0.0,
                        maxLatencyMs = 0.0,
                        avgLatencyMs = 0.0,
                        medianLatencyMs = 0.0,
                        attempts = iterationsPerFixture,
                        successfulAttempts = 0,
                        notes = "Bitmap fixture unavailable in environment"
                    )
                )
                return@forEachIndexed
            }

            val latencies = mutableListOf<Double>()
            var successCount = 0
            var lastDecodedPayload = ""
            var lastExactMatch = false

            for (attempt in 0 until iterationsPerFixture) {
                val scanResults = engine.decodeBitmap(bitmap)
                if (scanResults.isNotEmpty()) {
                    val primary = scanResults[0]
                    latencies.add(primary.latencyMs)

                    if (fixture.isNegativeControl) {
                        // For negative controls, success means NO detection
                        if (!primary.isSuccess) {
                            successCount++
                        }
                    } else if (primary.isSuccess) {
                        lastDecodedPayload = primary.rawPayload
                        val match = primary.rawPayload == fixture.expectedPayload
                        if (match) {
                            lastExactMatch = true
                            successCount++
                        } else if (primary.rawPayload.isNotEmpty()) {
                            // Partial decode or payload alteration
                            lastExactMatch = false
                            if (attempt == 0) successCount++
                        }
                    }
                }
            }

            latencies.sort()
            val minLat = if (latencies.isNotEmpty()) latencies.first() else 0.0
            val maxLat = if (latencies.isNotEmpty()) latencies.last() else 0.0
            val avgLat = if (latencies.isNotEmpty()) latencies.average() else 0.0
            val medLat = if (latencies.isNotEmpty()) latencies[latencies.size / 2] else 0.0

            val status = when {
                fixture.isNegativeControl -> {
                    if (successCount == iterationsPerFixture) "PASS" else "FAIL"
                }
                successCount == iterationsPerFixture && lastExactMatch -> "PASS"
                successCount > 0 && lastExactMatch -> "PARTIAL"
                successCount > 0 && !lastExactMatch -> "PARTIAL"
                else -> "FAIL"
            }

            results.add(
                FixtureBenchmarkResult(
                    fixtureId = fixture.id,
                    format = fixture.format.standardName,
                    category = fixture.category.name,
                    condition = fixture.condition,
                    expectedPayload = fixture.expectedPayload,
                    decodedPayload = lastDecodedPayload,
                    resultStatus = status,
                    exactMatch = lastExactMatch,
                    minLatencyMs = minLat,
                    maxLatencyMs = maxLat,
                    avgLatencyMs = avgLat,
                    medianLatencyMs = medLat,
                    attempts = iterationsPerFixture,
                    successfulAttempts = successCount,
                    notes = "$successCount/$iterationsPerFixture successful attempts"
                )
            )
        }

        return results
    }

    companion object {
        fun resultsToJson(results: List<FixtureBenchmarkResult>): String {
            val array = JSONArray()
            results.forEach { array.put(it.toJsonObject()) }
            return array.toString(2)
        }
    }
}
