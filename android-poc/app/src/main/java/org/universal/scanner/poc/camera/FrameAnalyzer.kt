package org.universal.scanner.poc.camera

import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import org.universal.scanner.poc.engine.IScannerEngine
import org.universal.scanner.poc.model.ScanResult

/**
 * CameraX ImageAnalysis analyzer implementation.
 * Dispatches frames to the active scanner engine and guarantees buffer release via imageProxy.close().
 */
class FrameAnalyzer(
    private val engine: IScannerEngine,
    private val onDecoded: (List<ScanResult>) -> Unit
) : ImageAnalysis.Analyzer {

    override fun analyze(imageProxy: ImageProxy) {
        try {
            val results = engine.decodeImageProxy(imageProxy)
            if (results.any { it.isSuccess }) {
                onDecoded(results.filter { it.isSuccess })
            }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            // CRITICAL: Always release imageProxy buffer to prevent camera stream pipeline stall
            imageProxy.close()
        }
    }
}
