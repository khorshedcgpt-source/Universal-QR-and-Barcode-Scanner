# Isolated Android Scanner Engine Proof of Concept (POC)

**Project:** Universal QR and Barcode Scanner  
**Document Context:** Isolated Android POC Test Harness  
**Status:** POC Experimental Harness (Production Implementation NOT Authorized)  
**Governance:** Production Architecture `00`–`13` remains the source of truth. This directory is strictly isolated from production code.

---

## 1. Objectives

This directory contains the self-contained Android Proof of Concept application to empirically evaluate and benchmark candidate barcode scanning engines on Android:
* **Candidate A:** Google ML Kit Barcode Scanning (`com.google.mlkit:barcode-scanning`)
* **Candidate B:** ZXing-C++ Android Native (`io.github.zxing-cpp:android`)
* **Candidate C (Baseline):** Pure Java ZXing (`com.google.zxing:core`)

## 2. Directory Structure

```text
android-poc/
├── README.md
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
├── app/
│   ├── build.gradle.kts
│   └── src/main/
│       ├── AndroidManifest.xml
│       └── java/org/universal/scanner/poc/
│           ├── model/
│           │   ├── BarcodeFormat.kt
│           │   ├── ScanResult.kt
│           │   └── TestFixture.kt
│           ├── engine/
│           │   ├── IScannerEngine.kt
│           │   ├── MlKitScannerEngine.kt
│           │   ├── ZxingCppScannerEngine.kt
│           │   └── ZxingJavaScannerEngine.kt
│           ├── camera/
│           │   ├── CameraXManager.kt
│           │   └── FrameAnalyzer.kt
│           ├── corpus/
│           │   └── SyntheticCorpus.kt
│           ├── benchmark/
│           │   └── BenchmarkRunner.kt
│           └── ui/
│               └── MainActivity.kt
├── benchmark/
└── results/
```

## 3. Privacy & Offline Policy

* **Zero Network Access:** The `android.permission.INTERNET` permission is **explicitly omitted** from `AndroidManifest.xml`.
* **Zero Telemetry:** No analytics, crash reporters, ad SDKs, or cloud services are included.
* **No Real NID / PII:** Synthetic payloads only; no real government identification or sensitive personal data is used or stored.
* **No Production Code:** This code is strictly diagnostic and will not be incorporated into the production application tree.
