package org.universal.scanner.poc.engine

import android.graphics.Bitmap
import androidx.camera.core.ImageProxy
import org.universal.scanner.poc.model.BarcodeFormat
import org.universal.scanner.poc.model.ScanResult

/**
 * Common abstraction for Android Scanner Engine Candidates in the POC harness.
 * Evaluates Candidate A (Google ML Kit), Candidate B (ZXing-C++ Android),
 * and Candidate C (Pure Java ZXing Baseline).
 */
interface IScannerEngine {
    val name: String
    val version: String

    /**
     * Initializes the engine and returns the cold-start initialization latency in milliseconds.
     */
    fun initEngine(): Long

    /**
     * Decodes a static Bitmap image (file/synthetic benchmark pathway).
     */
    fun decodeBitmap(bitmap: Bitmap, targetFormats: Set<BarcodeFormat> = BarcodeFormat.allFormats()): List<ScanResult>

    /**
     * Decodes a live CameraX ImageProxy frame (live camera stream pathway).
     * The implementation must NOT close the ImageProxy; the caller lifecycle handles buffer recycling.
     */
    fun decodeImageProxy(imageProxy: ImageProxy, targetFormats: Set<BarcodeFormat> = BarcodeFormat.allFormats()): List<ScanResult>

    /**
     * Releases any native resources, thread pools, or models.
     */
    fun close()
}
