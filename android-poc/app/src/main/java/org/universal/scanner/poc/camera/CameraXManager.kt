package org.universal.scanner.poc.camera

import android.content.Context
import android.util.Size
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import org.universal.scanner.poc.engine.IScannerEngine
import org.universal.scanner.poc.model.ScanResult
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * CameraX lifecycle and stream manager for the isolated Android POC.
 * Binds preview and continuous ImageAnalysis at 1080p target resolution.
 */
class CameraXManager(
    private val context: Context,
    private val lifecycleOwner: LifecycleOwner,
    private val previewView: PreviewView,
    private val onResult: (List<ScanResult>) -> Unit
) {
    private var camera: Camera? = null
    private var cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()
    private var activeEngine: IScannerEngine? = null
    private var isTorchOn = false

    fun startCamera(engine: IScannerEngine) {
        activeEngine = engine
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)

        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()

            val preview = Preview.Builder()
                .build()
                .also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

            val imageAnalyzer = ImageAnalysis.Builder()
                .setTargetResolution(Size(1920, 1080)) // Target 1080p
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also {
                    it.setAnalyzer(
                        cameraExecutor,
                        FrameAnalyzer(engine) { results ->
                            onResult(results)
                        }
                    )
                }

            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

            try {
                cameraProvider.unbindAll()
                camera = cameraProvider.bindToLifecycle(
                    lifecycleOwner,
                    cameraSelector,
                    preview,
                    imageAnalyzer
                )
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }, ContextCompat.getMainExecutor(context))
    }

    fun toggleTorch(): Boolean {
        camera?.cameraControl?.let { control ->
            isTorchOn = !isTorchOn
            control.enableTorch(isTorchOn)
            return isTorchOn
        }
        return false
    }

    fun stopCamera() {
        cameraExecutor.shutdown()
    }
}
