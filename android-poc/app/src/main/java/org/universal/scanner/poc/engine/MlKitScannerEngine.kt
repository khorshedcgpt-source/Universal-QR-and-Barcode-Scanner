package org.universal.scanner.poc.engine

import android.graphics.Bitmap
import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageProxy
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.barcode.BarcodeScanner
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import org.universal.scanner.poc.model.BarcodeFormat
import org.universal.scanner.poc.model.ScanResult
import java.util.concurrent.TimeUnit

/**
 * Candidate A: Google ML Kit Barcode Scanning implementation.
 * Uses bundled on-device model (`com.google.mlkit:barcode-scanning:17.3.0`).
 */
class MlKitScannerEngine : IScannerEngine {
    override val name: String = "Google ML Kit (Bundled On-Device)"
    override val version: String = "17.3.0"

    private var scanner: BarcodeScanner? = null

    override fun initEngine(): Long {
        val start = System.nanoTime()
        val options = BarcodeScannerOptions.Builder()
            .setBarcodeFormats(
                Barcode.FORMAT_ALL_FORMATS
            )
            .build()
        scanner = BarcodeScanning.getClient(options)
        return TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start)
    }

    override fun decodeBitmap(bitmap: Bitmap, targetFormats: Set<BarcodeFormat>): List<ScanResult> {
        val activeScanner = scanner ?: run {
            initEngine()
            scanner!!
        }

        val start = System.nanoTime()
        val image = InputImage.fromBitmap(bitmap, 0)

        return try {
            val task = activeScanner.process(image)
            val barcodes = Tasks.await(task, 5000, TimeUnit.MILLISECONDS)
            val elapsedMs = (System.nanoTime() - start) / 1_000_000.0

            if (barcodes.isEmpty()) {
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
                barcodes.map { barcode ->
                    mapMlKitBarcode(barcode, elapsedMs)
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
                    errorMessage = e.message ?: "ML Kit decode exception"
                )
            )
        }
    }

    @OptIn(ExperimentalGetImage::class)
    override fun decodeImageProxy(imageProxy: ImageProxy, targetFormats: Set<BarcodeFormat>): List<ScanResult> {
        val mediaImage = imageProxy.image ?: return listOf(
            ScanResult(
                engineName = name,
                isSuccess = false,
                format = null,
                rawFormatString = "NULL_IMAGE",
                rawPayload = "",
                rawBytes = null,
                latencyMs = 0.0,
                errorMessage = "ImageProxy contains null media image"
            )
        )

        val activeScanner = scanner ?: run {
            initEngine()
            scanner!!
        }

        val start = System.nanoTime()
        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)

        return try {
            val task = activeScanner.process(image)
            val barcodes = Tasks.await(task, 1000, TimeUnit.MILLISECONDS)
            val elapsedMs = (System.nanoTime() - start) / 1_000_000.0

            if (barcodes.isEmpty()) {
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
                barcodes.map { barcode ->
                    mapMlKitBarcode(barcode, elapsedMs)
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

    private fun mapMlKitBarcode(barcode: Barcode, elapsedMs: Double): ScanResult {
        val mappedFormat = when (barcode.format) {
            Barcode.FORMAT_EAN_8 -> BarcodeFormat.EAN_8
            Barcode.FORMAT_EAN_13 -> BarcodeFormat.EAN_13
            Barcode.FORMAT_UPC_A -> BarcodeFormat.UPC_A
            Barcode.FORMAT_UPC_E -> BarcodeFormat.UPC_E
            Barcode.FORMAT_CODE_39 -> BarcodeFormat.CODE_39
            Barcode.FORMAT_CODE_93 -> BarcodeFormat.CODE_93
            Barcode.FORMAT_CODE_128 -> BarcodeFormat.CODE_128
            Barcode.FORMAT_ITF -> BarcodeFormat.ITF
            Barcode.FORMAT_CODABAR -> BarcodeFormat.CODABAR
            Barcode.FORMAT_QR_CODE -> BarcodeFormat.QR_CODE
            Barcode.FORMAT_DATA_MATRIX -> BarcodeFormat.DATA_MATRIX
            Barcode.FORMAT_AZTEC -> BarcodeFormat.AZTEC
            Barcode.FORMAT_PDF417 -> BarcodeFormat.PDF417
            else -> null
        }

        return ScanResult(
            engineName = name,
            isSuccess = true,
            format = mappedFormat,
            rawFormatString = "FORMAT_${barcode.format}",
            rawPayload = barcode.rawValue ?: "",
            rawBytes = barcode.rawBytes,
            latencyMs = elapsedMs,
            boundingBox = barcode.boundingBox?.toShortString()
        )
    }

    override fun close() {
        scanner?.close()
        scanner = null
    }
}
