package org.universal.scanner.poc.engine

import android.graphics.Bitmap
import androidx.camera.core.ImageProxy
import com.google.zxing.BinaryBitmap
import com.google.zxing.DecodeHintType
import com.google.zxing.MultiFormatReader
import com.google.zxing.RGBLuminanceSource
import com.google.zxing.common.HybridBinarizer
import org.universal.scanner.poc.model.BarcodeFormat
import org.universal.scanner.poc.model.ScanResult
import java.util.EnumMap
import java.util.concurrent.TimeUnit

/**
 * Candidate C (Reference Baseline): Pure Java ZXing (`com.google.zxing:core:3.5.3`).
 * Historical baseline for comparison.
 */
class ZxingJavaScannerEngine : IScannerEngine {
    override val name: String = "ZXing Java (Baseline)"
    override val version: String = "3.5.3"

    private val reader = MultiFormatReader()
    private val hints = EnumMap<DecodeHintType, Any>(DecodeHintType::class.java).apply {
        put(DecodeHintType.TRY_HARDER, java.lang.Boolean.TRUE)
        put(DecodeHintType.CHARACTER_SET, "UTF-8")
    }

    override fun initEngine(): Long {
        val start = System.nanoTime()
        reader.setHints(hints)
        return TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start)
    }

    override fun decodeBitmap(bitmap: Bitmap, targetFormats: Set<BarcodeFormat>): List<ScanResult> {
        val start = System.nanoTime()
        return try {
            val width = bitmap.width
            val height = bitmap.height
            val pixels = IntArray(width * height)
            bitmap.getPixels(pixels, 0, width, 0, 0, width, height)

            val source = RGBLuminanceSource(width, height, pixels)
            val binaryBitmap = BinaryBitmap(HybridBinarizer(source))

            val result = reader.decodeWithState(binaryBitmap)
            reader.reset()
            val elapsedMs = (System.nanoTime() - start) / 1_000_000.0

            listOf(
                ScanResult(
                    engineName = name,
                    isSuccess = true,
                    format = mapJavaFormat(result.barcodeFormat.name),
                    rawFormatString = result.barcodeFormat.name,
                    rawPayload = result.text ?: "",
                    rawBytes = result.rawBytes,
                    latencyMs = elapsedMs
                )
            )
        } catch (e: Exception) {
            reader.reset()
            val elapsedMs = (System.nanoTime() - start) / 1_000_000.0
            listOf(
                ScanResult(
                    engineName = name,
                    isSuccess = false,
                    format = null,
                    rawFormatString = "NONE",
                    rawPayload = "",
                    rawBytes = null,
                    latencyMs = elapsedMs,
                    errorMessage = e.message ?: "Java ZXing NotFoundException"
                )
            )
        }
    }

    override fun decodeImageProxy(imageProxy: ImageProxy, targetFormats: Set<BarcodeFormat>): List<ScanResult> {
        val start = System.nanoTime()
        return try {
            val plane = imageProxy.planes[0]
            val buffer = plane.buffer
            val data = ByteArray(buffer.remaining())
            buffer.get(data)

            val width = imageProxy.width
            val height = imageProxy.height
            val source = com.google.zxing.PlanarYUVLuminanceSource(
                data, width, height, 0, 0, width, height, false
            )
            val binaryBitmap = BinaryBitmap(HybridBinarizer(source))

            val result = reader.decodeWithState(binaryBitmap)
            reader.reset()
            val elapsedMs = (System.nanoTime() - start) / 1_000_000.0

            listOf(
                ScanResult(
                    engineName = name,
                    isSuccess = true,
                    format = mapJavaFormat(result.barcodeFormat.name),
                    rawFormatString = result.barcodeFormat.name,
                    rawPayload = result.text ?: "",
                    rawBytes = result.rawBytes,
                    latencyMs = elapsedMs
                )
            )
        } catch (e: Exception) {
            reader.reset()
            val elapsedMs = (System.nanoTime() - start) / 1_000_000.0
            listOf(
                ScanResult(
                    engineName = name,
                    isSuccess = false,
                    format = null,
                    rawFormatString = "NONE",
                    rawPayload = "",
                    rawBytes = null,
                    latencyMs = elapsedMs,
                    errorMessage = e.message ?: "Camera frame decode error"
                )
            )
        }
    }

    private fun mapJavaFormat(name: String): BarcodeFormat? = when (name) {
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
        "DATA_MATRIX" -> BarcodeFormat.DATA_MATRIX
        "AZTEC" -> BarcodeFormat.AZTEC
        "PDF_417" -> BarcodeFormat.PDF417
        else -> null
    }

    override fun close() {
        reader.reset()
    }
}
