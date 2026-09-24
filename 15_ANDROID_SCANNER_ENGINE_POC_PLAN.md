# ANDROID SCANNER ENGINE PROOF OF CONCEPT (POC) SPECIFICATION & EXECUTION PLAN

## Universal QR and Barcode Scanner

**Project:** Universal QR and Barcode Scanner  
**Document:** `15_ANDROID_SCANNER_ENGINE_POC_PLAN.md`  
**Platform Target:** Android (API 26+ / Android 8.0 to Android 15+)  
**Document Status:** POC Specification & Execution Plan  
**Implementation Status:** POC Plan Formulated / Android Production Code NOT Authorized  
**Authoritative Dependencies:** `00`–`14` Project Documentation (`01_PROJECT_SPECIFICATION.md`, `02_ARCHITECTURE.md`, `03_TECHNICAL_SPECIFICATION.md`, `05_PRIVACY_SECURITY_SPEC.md`, `07_BARCODE_SUPPORT.md`, `08_TESTING.md`, `11_TECHNOLOGY_DECISIONS.md`, `12_SCANNER_ENGINE_VERIFICATION.md`, `13_SCANNER_ENGINE_POC.md`, `14_SCANNER_ENGINE_POC_RESULTS.md`)  
**Scanner Engine Decision Status:** **NOT DECIDED** (Awaiting Android Empirical Verification)

---

# 1. PURPOSE AND OBJECTIVES

Following the completion and review of the Web Scanner Engine POC (`14_SCANNER_ENGINE_POC_RESULTS.md`), this document establishes the formal, controlled technical specification and execution plan for the **Android Scanner Engine Proof of Concept (POC)**.

The primary objective of the Android POC is to empirically evaluate candidate scanning engines on the Android platform under realistic runtime and optical conditions without committing to production code or pre-emptively selecting an engine.

### Core Questions to Answer Empirically:
1. **Detection & Decoding Accuracy:** Can the candidate engine decode all 14 project-mandated formats under standard and degraded conditions?
2. **CameraX Integration & Frame Processing:** How reliably does each candidate process continuous real-time frames delivered via CameraX `ImageAnalysis` (`YUV_420_888` / native buffers) without memory leaks, buffer starvation, or dropped frames?
3. **High-Density PDF417 Performance:** Does the engine decode high-density, multi-row PDF417 symbols with 100% byte integrity, text/byte compaction modes, and various orientations?
4. **Multiple Barcode Detection:** How does each candidate perform when multiple distinct 1D/2D barcodes appear simultaneously within the viewfinder?
5. **Difficult Image Conditions:** How resilient is the engine against motion blur, low light, specular glare, 45°/90° rotation, perspective skew, and partial occlusion?
6. **False-Positive Rejection:** Does the engine maintain a 0.0% false-positive rate when exposed to negative control inputs (dense text documents, noise patterns, checkerboards)?
7. **Resource Footprint & Latency:** What is the wall-clock decode latency per frame, CPU/GPU utilization, thermal impact, and APK size delta for each candidate?
8. **Strict Privacy & Offline Operation:** Can the engine operate with zero outbound network requests, no telemetry, and complete on-device local execution?

---

# 2. CANDIDATE ENGINES TO EVALUATE

Per `11_TECHNOLOGY_DECISIONS.md` and `12_SCANNER_ENGINE_VERIFICATION.md`, the Android POC will benchmark the following candidates side-by-side using an identical test harness:

### Candidate A: Google ML Kit Barcode Scanning
* **Package/Artifact:** `com.google.mlkit:barcode-scanning:17.3.0` (or latest stable)
* **Delivery Models to Compare:**
  1. *Bundled Model:* Compiled directly into the APK (`com.google.mlkit:barcode-scanning`). Works 100% offline immediately upon installation; increases APK size by ~2.2 MB.
  2. *Unbundled / Thin Model (Google Play Services dynamic delivery):* Requires initial download via Google Play Services; smaller APK, but introduces a runtime dependency that must be verified for offline-first readiness.
* **Underlying Technology:** Google on-device machine learning models optimized for mobile NPU/DSP/CPU.
* **Documented Constraints to Test:** Document 12 noted Google's documented constraint: Data Matrix recognition requires the code to intersect the center point of the input image. This will be empirically verified.

### Candidate B: ZXing-C++ Android Native (JNI/NDK)
* **Package/Artifact:** `io.github.zxing-cpp:android` (official Android AAR wrapper around `zxing-cpp` native core)
* **Delivery Model:** Precompiled C++ shared libraries (`libzxing.so`) bundled for ABIs: `arm64-v8a`, `armeabi-v7a`, `x86_64`.
* **Underlying Technology:** Modernized, high-performance C++20 barcode reading engine.
* **Cross-Platform Baseline:** Directly mirrors the core algorithm evaluated in the WebAssembly POC (`zxing-wasm`).

### Candidate C (Reference Control): ZXing Java Port
* **Package/Artifact:** `com.google.zxing:core:3.5.3`
* **Purpose:** Serves as the historical open-source Java baseline to measure modern improvements of ML Kit and ZXing-C++.

---

# 3. BOUNDARIES AND NON-GOALS

The Android POC is strictly an experimental verification harness.

### Out of Scope / Prohibited in the POC:
* **No Production Architecture or Code:** Do not create production packages, dependency injection graphs, or persistent Room databases.
* **No Production UI:** No finished navigation bars, history lists, settings sheets, or branding assets. The POC UI consists solely of a camera preview with raw diagnostics overlay and an automated file test runner.
* **No Bangladesh NID Parser:** PDF417 testing must verify raw byte integrity only. Do not parse NID fields, schema definitions, or personal identities.
* **No Real NID / PII Data:** Under no circumstances will real personal identity images or payloads be used. All test fixtures must be synthetic.
* **No Final Engine Decision:** Do not author `15_FINAL_SCANNER_ENGINE_DECISION.md` or declare an engine approved.

---

# 4. REQUIRED FORMAT COVERAGE MATRIX

All 14 formats defined in `07_BARCODE_SUPPORT.md` must be empirically evaluated on Android:

| Format Index | Barcode Symbology | Category | Target Test Payload | Expected Behavior & Success Criteria |
|---|---|---|---|---|
| 1 | **EAN-8** | 1D Retail | `96385074` | Exact 8-digit decode, checksum validated |
| 2 | **EAN-13** | 1D Retail | `5901234123457` | Exact 13-digit decode, checksum validated |
| 3 | **UPC-A** | 1D Retail | `012345678905` | Exact 12-digit decode |
| 4 | **UPC-E** | 1D Retail | `01234565` | Zero-suppressed 8-digit decode |
| 5 | **Code 39** | 1D Industrial | `TEST39` | Standard alphanumeric decode |
| 6 | **Code 93** | 1D Industrial | `CODE93` | Alphanumeric with dual check characters |
| 7 | **Code 128** | 1D Industrial | `TEST-CODE128-BATCH-99` | Full ASCII character set decode |
| 8 | **ITF** | 1D Logistics | `123456789012` | Interleaved 2 of 5 numeric decode |
| 9 | **Codabar** | 1D Medical/Library | `A123456789B` | Numeric with start/stop delimiter preservation |
| 10 | **QR Code** | 2D Matrix | `https://example.com/scanner-poc-test-01` | ISO/IEC 18004 alphanumeric/byte decode |
| 11 | **Data Matrix** | 2D Matrix | `SYNTHETIC-DATAMATRIX-ABC-9921` | ECC200 square & rectangular formats |
| 12 | **Aztec** | 2D Matrix | `AZTEC-SYNTHETIC-TOKEN-4491` | Central bullseye finder, square grid |
| 13 | **PDF417** | 2D Stacked (Critical) | Standard synthetic payload & byte blocks | Multi-row text/byte compaction modes |
| 14 | **Micro QR** | 2D Matrix (Conditional) | `MQR-TEST-771` | Validated ISO/IEC 18004 Micro QR fixture |

---

# 5. TEST ENVIRONMENT & INPUT MODES

The Android POC must test two distinct input pathways and report results separately:

### A. Synthetic Still Image / File Benchmark (`Image/File Tested`)
* Standardized bitmap inputs loaded directly into memory from project assets.
* Directly cross-comparable with the Web POC test corpus.
* Eliminates optical and sensor variability to measure raw algorithmic decoding capability.

### B. Real-Time CameraX Live Stream (`Camera Tested`)
* **Camera Framework:** Jetpack CameraX (`androidx.camera:camera-camera2`, `camera-lifecycle`, `camera-view`).
* **Resolution Configuration:** Target analysis resolution of 1080p (`1920x1080`) or fallback 720p (`1280x720`) with 4:3 / 16:9 aspect ratio matching viewfinder.
* **Frame Pipeline:**
  ```text
  Camera Sensor
        ↓
  CameraX ImageAnalysis.Analyzer
        ↓
  ImageProxy (YUV_420_888)
        ↓
  [Frame Buffer Converter]
        ├── ML Kit: InputImage.fromMediaImage(image, rotationDegrees)
        └── ZXing-C++: Direct luminance plane pointer pass / zero-copy
        ↓
  Engine Decode Execution (Background Executor Thread)
        ↓
  Diagnostic Result Callback (Timestamped, Latency Recorded)
        ↓
  ImageProxy.close() (Immediate buffer release to prevent starvation)
  ```
* **Camera Features Tested:**
  * Tap-to-focus and continuous autofocus.
  * Torch (flashlight) toggle for low-light scanning.
  * Linear zoom control (`setLinearZoom(0.0f..1.0f)`).

---

# 6. DIFFICULT-CONDITION TEST PROTOCOL

To ensure accuracy in real-world scenarios, the Android POC will test the following specific conditions:

### 1. Optical Degradations:
* **Low Light:** Target luminance reduced by 60% and 85%; test with and without torch activation.
* **Specular Glare:** High-intensity white reflection covering 25% to 40% of the barcode area.
* **Motion Blur / Defocus Blur:** Camera motion during hand movement; out-of-focus capture at close macro distance (<10 cm).

### 2. Geometric Distortions:
* **Rotation:** Test at 0°, 45°, 90°, and 180° orientations.
* **Pitch & Yaw (Perspective Skew):** Angles of 15°, 30°, 45° relative to the optical axis.
* **Curved Surfaces:** Barcodes printed on cylindrical surfaces (bottles, cans).

### 3. Physical & Symbology Defects:
* **Partial Occlusion:** 10% to 25% horizontal or vertical obstruction by solid obstacles.
* **Low Contrast / Inverted Polarity:** White symbol on dark background (dark mode).
* **Off-Center Placement:** Barcode located exclusively in peripheral corners of the frame (specifically to test ML Kit Data Matrix center-point limitation).

---

# 7. PDF417 CRITICAL EVALUATION PROTOCOL

PDF417 requires rigorous verification due to high symbol density and multi-byte encoding.

### Mandatory Test Steps:
1. **Raw Byte Fidelity:** Extract raw `byte[]` arrays before any character-set conversion. Verify bit-exact equality against expected byte sequence.
2. **Encoding Compaction Modes:**
   * Text Compaction (Upper, Lower, Mixed, Punctuation submodes).
   * Byte Compaction (arbitrary binary data, 6 bytes per 5 code words).
   * Numeric Compaction (high-density decimal string).
3. **Repeatability:** Execute 20 consecutive decodes of a static PDF417 frame; require 20/20 identical results.
4. **Latency Measurement:** Record millisecond execution time specifically for dense PDF417 frames.
5. **Strict Boundary:** No NID parsing or structure inference will be performed.

---

# 8. MULTIPLE BARCODE & FALSE POSITIVE PROTOCOLS

### Multiple Barcode Protocol:
* **Fixture Setup:** Single frame containing two or three distinct barcodes (e.g., 1x QR Code + 1x Code 128 + 1x EAN-13).
* **Metrics Recorded:**
  * Total barcodes present in frame.
  * Total barcodes detected.
  * Total barcodes correctly decoded.
  * Spatial bounding boxes (`Rect` / corner points) returned for each symbol.
  * Occurrence of cross-contamination or erroneous merges.

### False-Positive Negative-Control Protocol:
* **Negative Controls:**
  1. Dense printed text document page (newspaper / book page).
  2. Random Gaussian noise bitmap.
  3. Geometric checkerboard / high-frequency mesh fabric pattern.
* **Acceptance Requirement:** 0.0% false detections across all negative fixtures. Any detection is flagged as a critical failure.

---

# 9. PERFORMANCE, RESOURCE & PRIVACY PROFILING

### 1. Performance Profiling:
* **Latency:** Timestamp delta between `ImageProxy` acquisition and decode completion (measured in milliseconds across 10 warm runs).
* **Throughput:** Sustained frames per second (FPS) achievable by the analyzer.
* **Thermal & CPU:** Monitor CPU utilization via Android Studio Profiler during 60 seconds of continuous scanning.

### 2. Binary Footprint (APK Size Delta):
* Record uncompressed `.apk` and download size delta:
  * Baseline minimal CameraX app (no engine).
  * App + ML Kit Bundled.
  * App + ML Kit Unbundled.
  * App + ZXing-C++ (`libzxing.so` for all target ABIs).

### 3. Privacy & Network Security:
* **Zero Outbound Traffic:** Execute tests with Android Network Profiler active. Confirm 0 bytes transmitted over cellular/Wi-Fi interfaces during scanning.
* **Offline Operation:** Test scanner functionality in Airplane Mode with Wi-Fi and Cellular radios powered down.
* **Ephemeral Memory:** Verify camera frame buffers are recycled and not cached to internal or external storage.

---

# 10. HARNESS ARCHITECTURE & EXECUTION PLAN

```text
android-poc/
├── app/
│   ├── src/main/
│   │   ├── java/org/universal/scanner/poc/
│   │   │   ├── MainActivity.kt               # POC container (Camera + File tabs)
│   │   │   ├── camera/
│   │   │   │   ├── CameraManager.kt          # CameraX lifecycle, resolution, torch
│   │   │   │   └── FrameAnalyzer.kt          # ImageAnalysis.Analyzer dispatcher
│   │   │   ├── engine/
│   │   │   │   ├── IScannerEngine.kt         # Common POC abstraction
│   │   │   │   ├── MlKitEngine.kt            # Candidate A implementation
│   │   │   │   ├── ZxingCppEngine.kt         # Candidate B implementation
│   │   │   │   └── ZxingJavaEngine.kt        # Candidate C baseline
│   │   │   ├── corpus/
│   │   │   │   ├── AndroidTestCorpus.kt      # Synthetic test bitmap loader
│   │   │   │   └── BenchmarkRunner.kt        # Automated execution & metrics recorder
│   │   │   └── model/
│   │   │       ├── BenchmarkResult.kt        # Per-test result data class
│   │   │       └── EngineMetrics.kt          # Latency, memory, status
│   │   └── assets/
│   │       └── corpus/                       # Synthetic test images (identical to Web)
│   └── build.gradle.kts                      # Candidate dependencies & ABI filters
```

### Execution Steps:
1. **Milestone 1:** Implement `android-poc` test harness with synthetic corpus runner.
2. **Milestone 2:** Execute automated synthetic still-image benchmark for Candidate A, Candidate B, and Candidate C.
3. **Milestone 3:** Deploy to physical Android test device; execute CameraX live-stream benchmark under normal and difficult lighting/geometric conditions.
4. **Milestone 4:** Record empirical metrics into `16_ANDROID_SCANNER_ENGINE_POC_RESULTS.md`.
5. **Milestone 5:** Present comparative Web vs. Android empirical data for final architectural review.

---

# 11. DECISION GATE

* **Current Status:** SPECIFICATION AND EXECUTION PLAN COMPLETED.
* **Android Production Implementation:** NOT AUTHORIZED.
* **Final Engine Decision:** **NOT DECIDED**.
* **Next Action:** Await user authorization before executing the Android POC harness build and empirical benchmark.
