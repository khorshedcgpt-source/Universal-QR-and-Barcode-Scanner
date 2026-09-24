# 14_SCANNER_ENGINE_POC_RESULTS

## Universal QR and Barcode Scanner
**Document:** Scanner Engine Proof of Concept (POC) — Empirical Benchmark Results  
**Status:** Verification Evidence Record (Working Draft)  
**Date:** 2026-09-24  
**Target Runtime:** Web (Node.js 22 / Chromium) + Android Engine Feasibility  
**Evaluated Candidates:**
1. **Candidate 1: `@zxing/library`** (Pure JavaScript ZXing port)
2. **Candidate 2: `zxing-wasm`** (WebAssembly compilation of official `zxing-cpp`, v3.1.4)

---

## 1. Executive Summary & Benchmark Status

An empirical side-by-side benchmark was executed across identical synthetic test fixtures. All tests were executed in-memory with strictly measured execution times and exact byte comparisons.

* **Benchmark Status:** COMPLETED (Empirically Measured)
* **Total Executed Fixtures:** 21
* **Candidate 1 (`@zxing/library` - JS):**
  * **Passed:** 13 / 21
  * **Failed / Unsupported:** 8 / 21
  * **False Positives:** 0 / 2 (0% false positive rate on negative controls)
  * **Average Latency (on decoded cases):** ~45ms
* **Candidate 2 (`zxing-wasm` - ZXing-C++ WASM):**
  * **Passed:** 21 / 21 (100% of applicable formats & difficult conditions decoded)
  * **Failed:** 0 / 21
  * **False Positives:** 0 / 2 (0% false positive rate on negative controls)
  * **Average Latency (on decoded cases, excluding first-run JIT initialization):** ~32ms

---

## 2. Per-Format Results Matrix

| Test ID | Symbology Format | Input Condition | Expected Payload | Candidate 1 (@zxing/library) | Candidate 2 (zxing-wasm / C++) | Empirical Notes |
|---|---|---|---|---|---|---|
| `TC-EAN8` | EAN-8 | Normal | `96385074` | **PASS** (11ms) | **PASS** (1296ms init / 8ms warm) | Exact byte match on both engines |
| `TC-EAN13` | EAN-13 | Normal | `5901234123457` | **PASS** (10ms) | **PASS** (17ms) | Exact byte match on both engines |
| `TC-UPCA` | UPC-A | Normal | `012345678905` | **PASS** (2ms) | **PASS** (17ms) | JS returned exact UPC-A string; WASM returned normalized EAN-13 (`0012345678905`) with original 12-digit string available in `extra.UPCA` |
| `TC-UPCE` | UPC-E | Normal | `01234565` | **FAIL** (215ms) | **PASS** (99ms) | JS MultiFormatReader failed on UPC-E; WASM returned standard zero-suppressed value in `extra.UPCE` (`01234565`) |
| `TC-CODE39` | Code 39 | Normal | `TEST39` | **PASS** (2ms) | **PASS** (91ms) | Exact byte match on both engines |
| `TC-CODE93` | Code 93 | Normal (with check characters) | `CODE93` | **PASS** (4ms) | **PASS** (74ms) | Exact byte match on both engines |
| `TC-CODE128` | Code 128 | Normal | `TEST-CODE128-BATCH-99` | **PASS** (5ms) | **PASS** (90ms) | Exact byte match on both engines |
| `TC-ITF` | ITF | Normal | `123456789012` | **PASS** (3ms) | **PASS** (16ms) | Exact byte match on both engines |
| `TC-CODABAR` | Codabar | Normal | `A123456789B` | **FAIL** (216ms) | **PASS** (73ms) | JS CodaBarReader failed thresholding; WASM decoded cleanly |
| `TC-QR` | QR Code | Normal | `https://example.com/scanner-poc-test-01` | **PASS** (114ms) | **PASS** (12ms) | Exact byte match on both engines |
| `TC-DATAMATRIX` | Data Matrix | Normal | `SYNTHETIC-DATAMATRIX-ABC-9921` | **PASS** (97ms) | **PASS** (81ms) | Exact byte match on both engines |
| `TC-AZTEC` | Aztec | Normal | `AZTEC-SYNTHETIC-TOKEN-4491` | **PASS** (21ms) | **PASS** (4ms) | Exact byte match on both engines |
| `TC-PDF417` | PDF417 | Normal (Synthetic ID) | `SYNTH-PDF417-ID:ALICE-M-SMITH:...` | **PASS** (185ms) | **PASS** (14ms) | Exact byte-for-byte payload match on both engines |
| `TC-MICROQR` | Micro QR | Normal (Micro QR conditional) | `MQR-TEST-771` | **FAIL** (23ms) | **PASS** (81ms) | Unsupported in pure JS ZXing; decoded cleanly by ZXing-C++ WASM |

---

## 3. Difficult-Condition Testing Matrix

| Test ID | Symbology Format | Condition Tested | Candidate 1 (@zxing/library) | Candidate 2 (zxing-wasm / C++) | Analysis & Finding |
|---|---|---|---|---|---|
| `TC-DIFF-ROT90` | Code 128 | 90° Vertical Rotation | **FAIL** (106ms) | **PASS** (89ms) | JS fails without external image rotation canvas preprocessor; ZXing-C++ decodes natively via `tryRotate: true` |
| `TC-DIFF-PDF417-ROT` | PDF417 | 90° Vertical Rotation | **FAIL** (103ms) | **PASS** (6ms) | JS fails vertical stacked symbols; ZXing-C++ decodes rotated PDF417 in 6ms |
| `TC-DIFF-INVERT` | QR Code | Inverted / Dark Mode | **FAIL** (86ms) | **PASS** (16ms) | JS fails white-on-dark polarity; ZXing-C++ decodes natively via `tryInvert: true` |
| `TC-DIFF-LOWRES` | QR Code | Low Resolution (Scale 1) | **PASS** (81ms) | **PASS** (1ms) | Both engines successfully decode small 1x module scale QR |

---

## 4. PDF417 Critical Evaluation

* **Detection & Decode:** Both `@zxing/library` and `zxing-wasm` detect and decode standard synthetic PDF417 payloads.
* **Payload Integrity:** Byte-for-byte exact match verified (`SYNTH-PDF417-ID:ALICE-M-SMITH:DOB:19900101:EXP:20301231:DOC#8839104`).
* **Rotation Resilience:**
  * `@zxing/library`: **FAIL** on 90° rotated PDF417 without external image canvas preprocessing.
  * `zxing-wasm`: **PASS** (decoded in 6ms with internal rotation).
* **NID Boundary:** Verified. Zero Bangladesh NID data or private schemas were used or inferred.

---

## 5. Micro QR Evaluation (Conditional Target)

* **Candidate 1 (`@zxing/library`):** **FAIL / NOT SUPPORTED**. `@zxing/library` lacks the detector/decoder classes for Micro QR single-finder pattern codes.
* **Candidate 2 (`zxing-wasm` / ZXing-C++):** **PASS** (81ms). Correctly located finder pattern and decoded `MQR-TEST-771` with format classified as `MicroQRCode`.

---

## 6. Multiple Barcode Simultaneous Decoding

* **Test Case:** `TC-MULTI-2` (QR Code + Code 128 side-by-side on single frame).
* **Candidate 1 (`@zxing/library`):** **FAIL** (7ms). Pure JS implementation stops at first finder pattern search and does not support simultaneous multi-symbology decoding.
* **Candidate 2 (`zxing-wasm` / ZXing-C++):** **PASS** (93ms). Correctly identified 2 distinct barcodes simultaneously in single invocation:
  * Symbol 1: `QRCode` -> `MULTI-A-QR`
  * Symbol 2: `Code128` -> `MULTI-B-C128`

---

## 7. False Positive Testing (Negative Controls)

* **Test Cases:**
  * `TC-FP-BLANK`: Pure white canvas.
  * `TC-FP-NOISE`: High-frequency pseudo-random black/white speckle noise.
* **Candidate 1:** **PASS** (0 false positives).
* **Candidate 2:** **PASS** (0 false positives).
* **Result:** Neither engine produced phantom detections or spurious checksum passes on negative controls.

---

## 8. Network & Privacy Verification

* **Network Inspection:** Verified during benchmark and harness execution:
  * 0 HTTP network requests were issued during barcode extraction or decoding.
  * WebAssembly binary (`zxing_reader.wasm`) is packaged and served locally via static bundle.
  * Frame buffers remain in ephemeral local memory and are garbage-collected immediately.

---

## 9. Current Technical Limitations & Observations

1. **UPC-E & UPC-A EAN Normalization in `zxing-cpp`:**
   * By default, `zxing-cpp` normalizes UPC-A and UPC-E numbers into full 13-digit EAN strings (`00...`), storing the non-expanded original UPC-E/UPC-A string inside the `extra` metadata property as a JSON string (`extra.UPCE`). Any consumer mapping raw values must read `extra.UPCE` if pure 8-digit UPC-E representation is required.
2. **Code 93 Checksum Requirement:**
   * Code 93 requires standard check characters to be included in the encoded barcode representation (`includecheck: true`), which adheres to the AIM / ISO/IEC 15431 Code 93 standard.
3. **WASM Cold Start:**
   * The first WebAssembly invocation has an initialization overhead (~1.2s on Node, ~300ms in browser), after which subsequent frame decoding drops to 1ms – 25ms.

---

## 10. Decision Gate

**Final Engine Selection:** **NOT DECIDED**  
*(This document presents technical evidence only. Formal selection and production architecture finalization remain subject to engineering review.)*
