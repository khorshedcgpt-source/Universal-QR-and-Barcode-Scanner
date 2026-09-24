package org.universal.scanner.poc.ui

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import org.universal.scanner.poc.camera.CameraXManager
import org.universal.scanner.poc.engine.IScannerEngine
import org.universal.scanner.poc.engine.MlKitScannerEngine
import org.universal.scanner.poc.engine.ZxingCppScannerEngine
import org.universal.scanner.poc.engine.ZxingJavaScannerEngine

/**
 * Isolated diagnostic UI for Android Scanner Engine POC testing.
 * Provides live camera switching between Candidate A and Candidate B,
 * plus diagnostic metrics reporting.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var cameraManager: CameraXManager
    private lateinit var previewView: PreviewView
    private lateinit var statusText: TextView

    private val engines: Map<String, IScannerEngine> by lazy {
        mapOf(
            "Candidate A: ML Kit" to MlKitScannerEngine(),
            "Candidate B: ZXing-C++" to ZxingCppScannerEngine(),
            "Candidate C: ZXing Java" to ZxingJavaScannerEngine()
        )
    }

    private var currentEngine: IScannerEngine? = null

    private val cameraPermissionRequest = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            startCameraWithCurrentEngine()
        } else {
            statusText.text = "Camera permission denied by user"
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Simple programmatic diagnostic layout
        val rootLayout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding(16, 16, 16, 16)
        }

        val titleView = TextView(this).apply {
            text = "Android Scanner Engine POC"
            textSize = 20f
            setPadding(0, 0, 0, 16)
        }
        rootLayout.addView(titleView)

        val buttonLayout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.HORIZONTAL
        }

        val btnMlKit = Button(this).apply {
            text = "ML Kit"
            setOnClickListener { switchEngine("Candidate A: ML Kit") }
        }
        val btnZxingCpp = Button(this).apply {
            text = "ZXing-C++"
            setOnClickListener { switchEngine("Candidate B: ZXing-C++") }
        }
        val btnTorch = Button(this).apply {
            text = "Torch"
            setOnClickListener { cameraManager.toggleTorch() }
        }

        buttonLayout.addView(btnMlKit)
        buttonLayout.addView(btnZxingCpp)
        buttonLayout.addView(btnTorch)
        rootLayout.addView(buttonLayout)

        statusText = TextView(this).apply {
            text = "Status: Select engine to start camera"
            textSize = 14f
            setPadding(0, 16, 0, 16)
        }
        rootLayout.addView(statusText)

        previewView = PreviewView(this).apply {
            layoutParams = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                800
            )
        }
        rootLayout.addView(previewView)

        setContentView(rootLayout)

        cameraManager = CameraXManager(this, this, previewView) { results ->
            runOnUiThread {
                val sb = java.lang.StringBuilder()
                sb.append("Detected ${results.size} symbols:\n")
                results.forEach { r ->
                    sb.append("Format: ${r.rawFormatString} (${r.latencyMs}ms)\n")
                    sb.append("Payload: ${r.rawPayload}\n")
                }
                statusText.text = sb.toString()
            }
        }

        switchEngine("Candidate A: ML Kit")
    }

    private fun switchEngine(key: String) {
        currentEngine?.close()
        currentEngine = engines[key]
        val initLatency = currentEngine?.initEngine() ?: 0L
        statusText.text = "Active: $key (Init: ${initLatency}ms)"

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            startCameraWithCurrentEngine()
        } else {
            cameraPermissionRequest.launch(Manifest.permission.CAMERA)
        }
    }

    private fun startCameraWithCurrentEngine() {
        currentEngine?.let { engine ->
            cameraManager.startCamera(engine)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraManager.stopCamera()
        engines.values.forEach { it.close() }
    }
}
