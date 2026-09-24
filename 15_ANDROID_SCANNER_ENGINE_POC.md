# ANDROID SCANNER ENGINE PROOF OF CONCEPT (POC)

## Universal QR and Barcode Scanner

**Project:** Universal QR and Barcode Scanner  
**Document:** `15_ANDROID_SCANNER_ENGINE_POC.md`  
**Platform Target:** Android (API 23+ / Android 6.0 to Android 15+)  
**Document Status:** POC Technical Specification & Verification Record  
**Implementation Status:** Isolated POC Formulated / Android Production Implementation NOT Authorized  
**Authoritative Dependencies:** `00`–`14` Project Documentation (`01_PROJECT_SPECIFICATION.md`, `02_ARCHITECTURE.md`, `03_TECHNICAL_SPECIFICATION.md`, `05_PRIVACY_SECURITY_SPEC.md`, `07_BARCODE_SUPPORT.md`, `08_TESTING.md`, `11_TECHNOLOGY_DECISIONS.md`, `12_SCANNER_ENGINE_VERIFICATION.md`, `13_SCANNER_ENGINE_POC.md`, `14_SCANNER_ENGINE_POC_RESULTS.md`)  
**Scanner Engine Decision Status:** **NOT DECIDED**

---

# 1. PURPOSE AND SCOPE

Following the empirical completion of the Web Scanner Engine POC recorded in `14_SCANNER_ENGINE_POC_RESULTS.md`, this document governs the **isolated Android Scanner Engine Proof of Concept (POC)**.

The primary objective is to define and execute the empirical verification of candidate scanner engines on Android to determine:
1. Actual format coverage across the project's 14 required symbologies.
2. Exact payload fidelity and raw byte integrity (specifically for PDF417).
3. Micro QR support capability.
4. Multiple barcode handling and spatial bounding-box fidelity.
5. Behavior under difficult optical conditions (rotation, glare, low light, blur, inversion).
6. CameraX real-time frame processing feasibility.
7. Offline and privacy compliance (zero network egress).
8. Relative resource utilization, latency, and binary size overhead.

### Absolute Governance Constraints
* **Production Architecture (`00`–`13`) Unmodified:** This POC does not modify production architecture or approve production implementation.
* **Isolation:** All code resides strictly in `/android-poc/` and is completely detached from future production source trees.
* **No Final Engine Decision:** This document does NOT select or approve an engine. `15_FINAL_SCANNER_ENGINE_DECISION.md` is strictly prohibited at this stage.
* **PDF417 / NID Boundary:** No Bangladesh NID parser is implemented, no NID payload structure is inferred, and zero real personal data is utilized.

---

# 2. OFFICIAL UPSTREAM DOCUMENTATION VERIFICATION

In accordance with Section 4 of the project prompt, official documentation for candidate engines was independently verified against primary upstream sources:

### Candidate A: Google ML Kit Barcode Scanning
* **Upstream Authority:** Google Developers (`developers.google.com/ml-kit/vision/barcode-scanning/android`)
* **Current Stable Version:** `com.google.mlkit:barcode-scanning:17.3.0` (bundled) / `com.google.android.gms:play-services-mlkit-barcode-scanning:18.3.1` (unbundled).
* **Android API Requirements:** `minSdkVersion 23` (Android 6.0 Marshmallow) or higher.
* **Supported Formats:**
  * *1D Linear:* Codabar (`FORMAT_CODABAR`), Code 39 (`FORMAT_CODE_39`), Code 93 (`FORMAT_CODE_93`), Code 128 (`FORMAT_CODE_128`), EAN-8 (`FORMAT_EAN_8`), EAN-13 (`FORMAT_EAN_13`), ITF (`FORMAT_ITF`), UPC-A (`FORMAT_UPC_A`), UPC-E (`FORMAT_UPC_E`).
  * *2D Matrix:* Aztec (`FORMAT_AZTEC`), Data Matrix (`FORMAT_DATA_MATRIX`), PDF417 (`FORMAT_PDF417`), QR Code (`FORMAT_QR_CODE`).
* **Micro QR Status:** **NOT SUPPORTED AS A DISTINCT FORMAT**. ML Kit provides no `FORMAT_MICRO_QR` constant. Standard QR decoder does not guarantee ISO/IEC 18004 Micro QR (single finder pattern) decoding.
* **Documented Limitations:**
  1. *Maximum Barcode Cap:* Automatically caps recognition to a maximum of 10 barcodes per image/frame call.
  2. *Data Matrix Central Intersection:* Official documentation notes that Data Matrix codes must intersect the center point of the input image, effectively restricting multi-Data Matrix scanning in a single frame.
  3. *Short 1D Barcodes:* 1D barcodes with only 1 character are unsupported; ITF codes with fewer than 6 digits are unsupported due to checksum omission risks.
  4. *Encoding Submodes:* FNC2, FNC3, FNC4 and QR ECI mode are unsupported.
* **Model Delivery Comparison:**
  * *Bundled (`barcode-scanning`):* Adds ~2.2 MB uncompressed to APK; 100% offline out-of-the-box with zero initial network download.
  * *Unbundled (`play-services-mlkit-barcode-scanning`):* Thinner APK, but relies on Google Play Services dynamic model download; fails or delays if network is unavailable upon first app launch.
* **License:** Google APIs Terms of Service; client libraries Apache 2.0; underlying proprietary ML models.

### Candidate B: ZXing-C++ Native Android Wrapper
* **Upstream Authority:** Official GitHub repository `zxing-cpp/zxing-cpp` (`wrappers/android`)
* **Current Stable Maven Release:** `io.github.zxing-cpp:android:3.1.1` (based on `zxing-cpp` 2.3.0 core)
* **Supported Formats:**
  * *1D Linear:* EAN-8, EAN-13, UPC-A, UPC-E, Code 39, Code 93, Code 128, ITF, Codabar.
  * *2D Matrix:* QR Code, Micro QR (`MICRO_QR_CODE`), Data Matrix, Aztec, PDF417 (`PDF_417`).
* **Micro QR Status:** **OFFICIALLY SUPPORTED**. Natively supported with dedicated format enum `MICRO_QR_CODE`.
* **Multi-Barcode Capability:** Natively supported without a hard 10-symbol cap via `options.maxNumberOfSymbols`.
* **Architecture & Delivery:** Native C++ JNI library (`libzxing.so`) packaged for `arm64-v8a`, `armeabi-v7a`, and `x86_64`.
* **License:** Apache 2.0 (fully open source, permissible for commercial/offline use).

### Candidate C (Baseline): Pure Java ZXing
* **Upstream Authority:** `com.google.zxing:core:3.5.3`
* **License:** Apache 2.0. Historical baseline for performance and feature delta comparison.

---

# 3. ENVIRONMENT AND TOOLCHAIN INSPECTION

Per Section 6 and Section 35, the runtime environment was systematically inspected:

| Environmental Component | Inspected Value / Version | Status / Impact |
|---|---|---|
| **Host OS** | Linux 4.19.0-gvisor x86_64 GNU/Linux | Active containerized environment |
| **Installed JDK** | `java: not found` | Blocked: No Java runtime in container |
| **Android SDK / cmdline-tools** | Not installed (`ANDROID_HOME` unset) | Blocked: No local SDK manager |
| **Gradle** | Not installed | Blocked: No Gradle daemon |
| **NDK / C++ Toolchain** | Not installed | Native compilation blocked locally |
| **Physical Test Device** | None connected (`adb: not found`) | **Camera Test = NOT EXECUTED** |
| **Emulator** | None available (headless environment) | On-device execution blocked locally |
| **JavaScript / Node Runtime** | Node.js v22.14.0 / Bun v1.2.4 / Python 3.11 | Available (used for Web POC & tooling) |

### Environmental Handling Policy (Section 6 & Section 36 Compliance)
Because the headless cloud container lacks the full Android SDK/JDK toolchain and physical camera hardware:
1. The isolated Android POC project structure (`android-poc/`) was authored with complete, production-grade build scripts, CameraX integrations, and candidate engine wrappers.
2. In strict accordance with **Section 6** ("If a required native dependency cannot be built because the environment lacks the necessary NDK/toolchain, document the blocker rather than pretending the test passed") and **Section 19** ("If no physical device is available: `CAMERA TEST = NOT EXECUTED`. Do not fabricate results"), results are classified with empirical precision without fabricating execution.

---

# 4. POC IMPLEMENTATION ARCHITECTURE

The isolated Android POC is structured as follows:

```text
android-poc/
├── README.md                           # POC architectural documentation
├── settings.gradle.kts                 # Maven Central & Google repository setup
├── build.gradle.kts                    # Root build script (AGP 8.4.2, Kotlin 1.9.24)
├── gradle.properties                   # AndroidX & JVM optimization flags
├── app/
│   ├── build.gradle.kts                # Dependencies: CameraX, ML Kit 17.3.0, ZXing-C++ 3.1.1
│   └── src/
│       ├── main/
│       │   ├── AndroidManifest.xml     # CAMERA permission; INTERNET permission strictly omitted
│       │   └── java/org/universal/scanner/poc/
│       │       ├── model/
│       │       │   ├── BarcodeFormat.kt    # 14 standard project symbologies
│       │       │   ├── ScanResult.kt       # Diagnostic result data class
│       │       │   └── TestFixture.kt      # Test fixture specification
│       │       ├── engine/
│       │       │   ├── IScannerEngine.kt       # Common POC abstraction
│       │       │   ├── MlKitScannerEngine.kt   # Candidate A (Google ML Kit)
│       │       │   ├── ZxingCppScannerEngine.kt# Candidate B (ZXing-C++ NDK)
│       │       │   └── ZxingJavaScannerEngine.kt# Candidate C (Java Baseline)
│       │       ├── camera/
│       │       │   ├── CameraXManager.kt   # CameraX lifecycle, resolution, torch
│       │       │   └── FrameAnalyzer.kt    # ImageAnalysis.Analyzer with buffer safety
│       │       ├── corpus/
│       │       │   └── SyntheticCorpus.kt  # Standardized cross-platform fixtures
│       │       ├── benchmark/
│       │       │   └── BenchmarkRunner.kt  # Automated 10-attempt repeatability harness
│       │       └── ui/
│       │           └── MainActivity.kt     # Live diagnostic camera UI
│       └── test/
│           └── java/org/universal/scanner/poc/benchmark/
│               └── CorpusVerificationTest.kt # Corpus structure integrity unit tests
```

---

# 5. TEST METHODOLOGY & METRICS RECORDING

The test plan evaluates every candidate across 21 test fixtures covering:
1. **1D Symbologies:** EAN-8, EAN-13, UPC-A, UPC-E, Code 39, Code 93, Code 128, ITF, Codabar.
2. **2D Symbologies:** QR Code, Data Matrix (centered), Data Matrix (off-center), Aztec.
3. **Critical / Conditional Symbologies:** High-density PDF417 and Micro QR.
4. **Difficult Conditions:** 90° rotation, 45° rotation, low-light simulation, glare bloom, Gaussian blur, inverted polarity.
5. **Multi-Barcode Scenarios:** 2 distinct barcodes in single frame (QR + Code 128).
6. **False-Positive Controls:** Dense printed text and random noise.

### Measurement Protocols
* **Latency:** High-resolution wall-clock duration (`System.nanoTime()`) from frame buffer receipt to decode callback.
* **Repeatability:** Minimum 10 consecutive executions per fixture per engine (`successfulAttempts / attempts`).
* **Byte Exactness:** Direct comparison of raw byte arrays (`rawBytes.contentEquals(expectedBytes)`) to detect encoding distortions.

---

# 6. DECISION GATE

* **Current Document Status:** ANDROID SCANNER ENGINE POC SPECIFICATION COMPLETED.
* **Android Production Implementation:** NOT AUTHORIZED & NOT IMPLEMENTED.
* **Final Engine Decision:** **NOT DECIDED** (awaiting comparative synthesis in `16_ANDROID_SCANNER_ENGINE_POC_RESULTS.md`).
