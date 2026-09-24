package org.universal.scanner.poc.engine

import android.graphics.Bitmap
import androidx.camera.core.ImageProxy
import org.universal.scanner.poc.model.BarcodeFormat
import org.universal.scanner.poc.model.ScanResult
import zxingcpp.BarcodeReader
import java.util.concurrent.TimeUnit

/**
 * Candidate B: ZXing-C++ Android Native Implementation.
 * Uses official JNI bindings (`io.github.zxing-cpp:android:3.1.1`).
 * Direct C++ port mirroring the WebAssembly engine.
 */
class ZxingCppScannerEngine : IScannerEngine {
    override val name: String = "ZXing-C++ (Native NDK)"
    override val version: String = "3.1.1 (zxing-cpp 2.3.0 core)"

    private val defaultOptions = BarcodeReader.Options(
        tryHarder = true,
        tryRotate = true,
        tryInvert = true,
        maxNumberOfSymbols = 10
    )

    override fun initEngine(): Long {
        val start = System.nanoTime()
        // Force native JNI library load by reading a dummy 1x1 bitmap
        try {
            val dummyBitmap = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888)
            BarcodeReader.read(dummyBitmap, defaultOptions)
            dummyBitmap.recycle()
        } catch (_: Exception) {
            // Ignore dummy error, native library is loaded
        }
        return TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start)
    }

    override fun decodeBitmap(bitmap: Bitmap, targetFormats: Set<BarcodeFormat>): List<ScanResult> {
        val start = System.nanoTime()
        return try {
            val results = BarcodeReader.read(bitmap, defaultOptions)
            val elapsedMs = (System.nanoTime() - start) / 1_000_000.0

            if (results.isNullOrEmpty()) {
                listOf(
                    ScanResult(
                        engineName = name,
                        isSuccess = false,
                        format = null,
                        rawFormatString = "NONE",
                        rawPayload = "",
                        rawBytes = null,
                        latencyMs = elapsedMs,
                        errorMessage = "No barcode detected"
                    )
                )
            } else {
                results.map { result ->
                    mapZxingCppResult(result, elapsedMs)
                }
            }
        } catch (e: Exception) {
            val elapsedMs = (System.nanoTime() - start) / 1_000_000.0
            listOf(
                ScanResult(
                    engineName = name,
                    isSuccess = false,
                    format = null,
                    rawFormatString = "ERROR",
                    rawPayload = "",
                    rawBytes = null,
                    latencyMs = elapsedMs,
                    errorMessage = e.message ?: "ZXing-C++ decode exception"
                )
            )
        }
    }

    override fun decodeImageProxy(imageProxy: ImageProxy, targetFormats: Set<BarcodeFormat>): List<ScanResult> {
        val start = System.nanoTime()
        return try {
            val results = BarcodeReader.read(imageProxy, defaultOptions)
            val elapsedMs = (System.nanoTime() - start) / 1_000_000.0

            if (results.isNullOrEmpty()) {
                listOf(
                    ScanResult(
                        engineName = name,
                        isSuccess = false,
                        format = null,
                        rawFormatString = "NONE",
                        rawPayload = "",
                        rawBytes = null,
                        latencyMs = elapsedMs,
                        errorMessage = "No barcode detected in frame"
                    )
                )
            } else {
                results.map { result ->
                    mapZxingCppResult(result, elapsedMs)
                }
            }
        } catch (e: Exception) {
            val elapsedMs = (System.nanoTime() - start) / 1_000_000.0
            listOf(
                ScanResult(
                    engineName = name,
                    isSuccess = false,
                    format = null,
                    rawFormatString = "ERROR",
                    rawPayload = "",
                    rawBytes = null,
                    latencyMs = elapsedMs,
                    errorMessage = e.message ?: "Camera frame decode exception"
                )
            )
        }
    }

    private fun mapZxingCppResult(result: BarcodeReader.Result, elapsedMs: Double): ScanResult {
        val formatName = result.format?.name ?: "UNKNOWN"
        val mappedFormat = when (formatName) {
            "EAN_8" -> BarcodeFormat.EAN_8
            "EAN_13" -> BarcodeFormat.EAN_13
            "UPC_A" -> BarcodeFormat.UPC_A
            "UPC_E" -> BarcodeFormat.UPC_E
            "CODE_39" -> BarcodeFormat.CODE_39
            "CODE_93" -> BarcodeFormat.CODE_93
            "CODE_128" -> BarcodeFormat.CODE_128
            "ITF" -> BarcodeFormat.ITF
            "CODABAR" -> BarcodeFormat.CODABAR
            "QR_CODE" -> BarcodeFormat.QR_CODE
            "MICRO_QR_CODE" -> BarcodeFormat.MICRO_QR
            "DATA_MATRIX" -> BarcodeFormat.DATA_MATRIX
            "AZTEC" -> BarcodeFormat.AZTEC
            "PDF_417" -> BarcodeFormat.PDF417
            else -> null
        }

        return ScanResult(
            engineName = name,
            isSuccess = true,
            format = mappedFormat,
            rawFormatString = formatName,
            rawPayload = result.text ?: "",
            rawBytes = result.rawBytes,
            latencyMs = elapsedMs,
            orientationDegrees = result.orientation ?: 0,
            notes = "ZXing-C++ Native Result"
        )
    }

    override fun close() {
        // Native memory allocated per scan is cleaned up automatically by JNI wrapper
    }
}
