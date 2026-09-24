# SCANNER ENGINE PROOF OF CONCEPT (POC)

## Universal QR and Barcode Scanner

**Project:** Universal QR and Barcode Scanner
**Platforms:** Android + Web
**Primary Principles:** Accuracy-First, Privacy-First, Offline-First
**Document Status:** POC Specification
**Implementation Status:** POC Authorized / Production Not Authorized
**Depends On:** `01`–`12` Project Documentation
**Previous Document:** `12_SCANNER_ENGINE_VERIFICATION.md`

---

# 1. PURPOSE

This document defines the Proof of Concept (POC) required to experimentally verify the scanner-engine candidates for the Universal QR and Barcode Scanner project.

The POC exists to answer a specific technical question:

> **Can the candidate scanner technology reliably decode the project's required barcode formats on the target platforms, under representative conditions, while satisfying the project's offline, privacy, security, and performance requirements?**

The POC is an experimental verification project.

It is **not the production application**.

---

# 2. POC OBJECTIVES

The POC must determine:

1. Whether each candidate engine can be integrated successfully.
2. Which required barcode formats can actually be detected.
3. Which required barcode formats can actually be decoded.
4. Whether the decoded value is correct.
5. Whether decoding is repeatable.
6. How the engine behaves under difficult image conditions.
7. How PDF417 performs.
8. Whether Android operation works reliably.
9. Whether Web operation works reliably.
10. Whether image/file scanning works.
11. Whether offline operation is possible.
12. Whether unexpected network communication occurs.
13. What performance characteristics exist.
14. What limitations exist.
15. Whether additional image preprocessing is required.
16. Whether the engine is suitable for the next development stage.

---

# 3. POC NON-GOALS

The POC must **not** attempt to build the complete application.

The following are outside the initial POC:

* Production UI
* Complete navigation
* User accounts
* Authentication
* History
* Settings
* Full result-management system
* Cloud synchronization
* Analytics
* Advertising
* Production database
* Final NID parser
* Complete NID data interpretation
* Production release packaging
* Full application branding
* Complete accessibility implementation
* Production architecture implementation

These may be developed only after the scanner-engine decision is finalized.

---

# 4. POC GOVERNANCE

The POC must follow all existing project documentation.

The documentation hierarchy remains:

```text
01_PROJECT_SPECIFICATION.md
        ↓
02_ARCHITECTURE.md
        ↓
03_TECHNICAL_SPECIFICATION.md
        ↓
04_UI_UX_SPECIFICATION.md
        ↓
05_PRIVACY_SECURITY_SPEC.md
        ↓
06_DEVELOPMENT_ROADMAP.md
        ↓
07_BARCODE_SUPPORT.md
        ↓
08_TESTING.md
        ↓
09_MASTER_AI_PROMPT.md
        ↓
10_DOCUMENTATION_INDEX.md
        ↓
11_TECHNOLOGY_DECISIONS.md
        ↓
12_SCANNER_ENGINE_VERIFICATION.md
        ↓
13_SCANNER_ENGINE_POC.md
```

If a conflict is discovered, the AI agent must stop and report the conflict instead of silently changing requirements.

---

# 5. CANDIDATE ENGINES

The initial POC should investigate at least:

### Candidate A

**Google ML Kit Barcode Scanning**

Primary investigation target:

* Android

### Candidate B

**ZXing-C++**

Primary investigation targets:

* Android
* Web / WebAssembly

### Candidate C

**Commercial / Enterprise SDK**

Investigate only if the open-source / platform candidates fail an important project requirement or if additional evidence is needed.

The candidate list is not a ranking.

No final engine decision may be made before the required POC evidence is collected.

---

# 6. POC ARCHITECTURE

The POC should be intentionally small.

Conceptually:

```text
                  POC Application
                        │
          ┌─────────────┴─────────────┐
          │                           │
      Android                         Web
          │                           │
    Camera / Image              Camera / Image
          │                           │
          └─────────────┬─────────────┘
                        │
                 Scanner Adapter
                        │
              ┌─────────┴─────────┐
              │                   │
          Engine A             Engine B
          ML Kit              ZXing-C++
              │                   │
              └─────────┬─────────┘
                        │
                  Raw Scan Result
                        │
                  Verification
                        │
                 Test Result Log
```

The POC must preserve enough abstraction that candidate engines can be tested without rewriting the entire experiment.

---

# 7. POC ENGINE ADAPTER

Where practical, the POC should expose a common conceptual interface.

Example:

```text
ScannerEngine

initialize()
decodeImage()
decodeFrame()
reset()
dispose()
```

The exact API may differ between Android and Web.

The purpose is not to force identical implementation.

The purpose is to make the experimental results comparable.

---

# 8. REQUIRED FORMAT SET

The POC should test all project-required formats supported by the candidate engine.

## 1D

* EAN-8
* EAN-13
* UPC-A
* UPC-E
* Code 39
* Code 93
* Code 128
* ITF
* Codabar

## 2D

* QR Code
* Data Matrix
* Aztec
* PDF417
* Micro QR where supported

---

# 9. FORMAT SUPPORT CATEGORIES

Every format must receive one of the following statuses after testing:

### VERIFIED

The engine successfully decoded the format in the tested environment with correct results.

### PARTIALLY VERIFIED

The engine decoded the format, but important limitations were observed.

### DETECTION ONLY

The symbol could be detected but reliable payload decoding was not demonstrated.

### NOT VERIFIED

The capability has not yet been experimentally tested.

### NOT SUPPORTED

The candidate cannot provide the required capability.

### FAILED

The candidate was tested but failed the defined test requirements.

### CONDITIONAL

The format can remain supported only under explicitly documented conditions.

---

# 10. TEST INPUT TYPES

The POC must test, where technically applicable:

```text
Live Camera
    ↓
Camera Frame
    ↓
Image File
    ↓
Screenshot
    ↓
Captured Photograph
```

At minimum, both camera and image/file decoding should be investigated.

---

# 11. CONTROLLED TEST CORPUS

The POC must use a controlled barcode test corpus.

The corpus should contain known expected values.

Example:

```text
Test ID
Format
Payload
Expected Value
Image File
Condition
Resolution
Notes
```

The expected payload must be known before scanning.

The test system must compare:

```text
Expected Value
        VS
Actual Decoded Value
```

Do not judge accuracy visually.

---

# 12. TEST CORPUS REQUIREMENTS

The corpus should contain multiple examples for each required format.

Where practical, include:

* Short payload
* Medium payload
* Long payload
* Numeric payload
* Alphanumeric payload
* Special characters
* Unicode test payload where supported
* Different barcode sizes

PDF417 should receive additional test cases.

---

# 13. NORMAL CONDITION TEST

Every supported format should first be tested under controlled normal conditions.

Normal condition should use:

* Adequate lighting
* Clear focus
* Good contrast
* Correct orientation
* Adequate resolution
* Minimal glare
* Minimal motion
* Sufficient barcode size

This establishes the baseline.

---

# 14. DIFFICULT IMAGE CONDITIONS

The POC should test the following where practical:

```text
Normal Lighting
Low Light
Bright Light
Glare / Reflection
Blur
Motion Blur
Low Resolution
Compression
Rotation
Tilt
Perspective Distortion
Small Barcode
Large Barcode
Partial Occlusion
Damaged Barcode
Off-Center Barcode
Near Edge
Different Distances
```

Each condition must be recorded separately.

---

# 15. ANDROID CAMERA POC

The Android POC should verify:

* Camera permission
* Camera initialization
* Preview
* Frame acquisition
* Autofocus
* Rear camera
* Torch where supported
* Orientation
* Continuous scanning
* Single-result scanning
* Multiple-result scanning where supported
* Frame processing
* Image scanning
* PDF417
* Performance
* Offline operation

Testing should use more than one Android device where practical.

---

# 16. WEB CAMERA POC

The Web POC should verify:

* Camera permission
* Camera initialization
* Camera selection
* Rear-camera preference where available
* Frame acquisition
* Resolution
* Focus capability where exposed
* Torch capability where exposed
* Orientation
* Continuous scanning
* Image scanning
* PDF417
* Performance
* Offline operation

Initial browser testing:

* Chrome
* Edge
* Firefox

Browser limitations must be recorded rather than hidden.

---

# 17. IMAGE DECODING POC

The engine must be tested against known image files.

For every test:

```text
Input Image
      ↓
Scanner Engine
      ↓
Detection
      ↓
Decode
      ↓
Expected Value Comparison
```

The POC must determine whether image decoding requires:

* Native image objects
* Raw pixel buffers
* Bitmap conversion
* Canvas conversion
* WebAssembly memory buffers
* Platform-specific adapters

---

# 18. PDF417 POC

PDF417 is the highest-priority format for experimental verification.

Minimum PDF417 categories:

```text
Standard PDF417
High-Density PDF417
Small PDF417
Large PDF417
Low-Resolution PDF417
Blurred PDF417
Low-Light PDF417
Glare / Reflection
Rotated PDF417
Tilted PDF417
Perspective Distortion
Partially Damaged PDF417
Camera PDF417
Image File PDF417
```

Each result must record the actual input conditions.

---

# 19. BANGLADESH NID-ORIENTED PDF417 BOUNDARY

The POC may investigate whether PDF417 symbols representative of the Bangladesh NID use case can be detected and decoded.

However:

> **PDF417 detection does not mean NID recognition.**

The POC must maintain the following separation:

```text
PDF417 Symbol
      ↓
PDF417 Detection
      ↓
Raw Payload
      ↓
Payload Integrity
      ↓
Encoding Verification
      ↓
Verified Structure
      ↓
NID Parser
```

The initial scanner-engine POC stops at the raw decoding stage unless a separate, explicitly authorized NID parsing experiment exists.

---

# 20. REAL NID DATA PROHIBITION

The POC must not require real Bangladesh National ID data.

The repository must not contain:

* Real NID card photographs
* Real NID PDF417 payloads
* Real personal information
* Real NID numbers
* Real names
* Real dates of birth
* Real addresses
* Real biometric information

Use:

* Synthetic data
* Anonymized data
* Authorized test fixtures

only.

---

# 21. NID PAYLOAD RULE

The AI agent must not invent a Bangladesh NID payload structure.

Do not assume:

* XML
* JSON
* Binary format
* Field ordering
* Field names
* Encoding
* Encryption
* Compression
* Checksum
* Delimiters
* Personal-data structure

Any future NID parser must be based on verified evidence.

---

# 22. DETECTION TEST

For each test sample:

```text
Was a barcode detected?
```

Record:

```text
YES / NO
```

A detection without correct decoding is not a successful decode.

---

# 23. DECODING TEST

For every detected barcode:

```text
Was the payload decoded?
```

Record:

```text
YES / NO
```

---

# 24. CORRECTNESS TEST

Compare the decoded payload against the known expected payload.

```text
Expected
   VS
Actual
```

Possible result:

```text
CORRECT
INCORRECT
PARTIAL
EMPTY
ERROR
```

Only a complete and correct payload counts as a successful decode.

---

# 25. FALSE POSITIVE TESTING

The POC should include images that:

* Contain no barcode
* Contain text resembling a barcode
* Contain damaged symbols
* Contain unrelated graphical patterns
* Contain multiple unrelated objects

The scanner must not produce unjustified barcode results.

---

# 26. MULTIPLE BARCODE TESTING

Where supported, test:

* Multiple QR codes
* Multiple 1D barcodes
* Multiple mixed formats
* Multiple PDF417 symbols
* QR + PDF417
* 1D + 2D

Record:

* Number of symbols present
* Number detected
* Number decoded
* Which formats were detected
* Whether any result was incorrectly selected

The production application must never silently discard potentially sensitive results.

---

# 27. ROTATION TESTING

Each relevant format should be tested at multiple orientations.

Suggested:

```text
0°
90°
180°
270°
```

Also test moderate tilt/skew where practical.

---

# 28. SIZE TESTING

Test multiple barcode sizes:

```text
Large
Medium
Small
Very Small
```

Record:

* Approximate barcode dimensions
* Image resolution
* Camera distance
* Decode success
* Decode latency

---

# 29. DISTANCE TESTING

Camera tests should investigate:

* Close distance
* Normal scanning distance
* Far distance

The exact physical distances should be recorded during the experiment.

Do not claim a universal minimum distance without measurement.

---

# 30. IMAGE QUALITY TESTING

The POC should investigate the effect of:

* Resolution
* Focus
* Motion
* Compression
* Noise
* Contrast
* Lighting
* Reflection
* Perspective

The purpose is to identify failure boundaries.

---

# 31. IMAGE PREPROCESSING EXPERIMENT

Image preprocessing must be treated as an experiment, not an automatic requirement.

Potential techniques:

* Resize
* Crop
* Grayscale
* Contrast adjustment
* Sharpening
* Rotation
* Perspective correction
* Region-of-interest processing

For each preprocessing technique record:

```text
Before
After
Accuracy Change
Latency Change
CPU/Memory Impact
```

Do not add preprocessing merely because it sounds useful.

---

# 32. OFFLINE TEST

Disable network connectivity and repeat the core scanning tests.

Test:

```text
Network Available
        ↓
Scan

Network Disabled
        ↓
Scan
```

The core scanner must continue to operate offline if the selected engine is intended to satisfy the project's offline requirement.

Any dependency on:

* Cloud APIs
* Remote processing
* Runtime downloads
* Remote configuration

must be documented.

---

# 33. NETWORK OBSERVATION

The POC should investigate unexpected network activity.

Record:

* Network requests
* External domains
* Runtime downloads
* Telemetry
* Analytics
* Crash reporting
* Remote model downloads

Unexpected network communication must be investigated before production approval.

---

# 34. PERFORMANCE TESTING

Measure where practical:

### Initialization

Time required to initialize the scanner.

### First Decode

Time from usable input to first successful decode.

### Repeated Decode

Behavior during repeated scans.

### Image Decode

Time required to decode a static image.

### Camera Processing

Frame-processing behavior during continuous scanning.

### Resource Usage

Record:

* CPU
* Memory
* Battery impact where measurable

---

# 35. LATENCY MEASUREMENT

Do not rely on subjective descriptions such as:

> "Fast"

Use measurements.

Record:

```text
Test ID
Engine
Platform
Input
Condition
Start Time
Decode Time
Latency
```

Where exact timing is unavailable, document the measurement limitation.

---

# 36. ACCURACY METRICS

At minimum calculate:

### Detection Rate

```text
Detected Valid Samples
----------------------
Total Valid Samples
```

### Successful Decode Rate

```text
Correctly Decoded Samples
-------------------------
Total Valid Samples
```

### False Positive Rate

```text
Incorrect Results
-----------------
Negative / Non-Barcode Samples
```

### Repeatability

Repeated scans of the same input should produce consistent results.

---

# 37. TEST RESULT RECORD

Every meaningful test should produce a structured record.

Recommended fields:

```text
Test ID
Date
Engine
Engine Version
Platform
OS Version
Device / Browser
Format
Input Type
Test Image / Fixture
Condition
Image Resolution
Barcode Size
Detected
Decoded
Expected Value
Actual Value
Correct
Latency
CPU
Memory
Network State
Notes
```

---

# 38. SAMPLE RESULT

Example structure:

```text
Test ID: PDF417-ANDROID-CAMERA-001
Engine: [Candidate]
Engine Version: [Version]
Platform: Android
Device: [Device]
Format: PDF417
Input: Camera
Condition: Normal
Detected: YES
Decoded: YES
Expected Value: [Controlled Test Value]
Actual Value: [Controlled Test Value]
Correct: YES
Latency: [Measured]
Network: OFFLINE
Notes: [Observation]
```

This is only an example.

The AI must not fabricate values.

---

# 39. TEST RESULT STORAGE

POC results should be stored separately from production application data.

Recommended structure:

```text
poc/
├── README.md
├── fixtures/
├── test-results/
├── scripts/
├── android/
├── web/
└── reports/
```

The exact structure may be adapted to the selected technology.

---

# 40. TEST FIXTURE POLICY

Test fixtures must not contain sensitive personal information.

Use:

```text
Synthetic
Anonymized
Authorized
```

Do not commit real NID data.

Test fixtures must have known expected outputs.

---

# 41. ENGINE COMPARISON

After testing, prepare a neutral comparison.

Example:

| Criterion           | Engine A   | Engine B   |
| ------------------- | ---------- | ---------- |
| Android Integration | Measured   | Measured   |
| Web Integration     | Measured   | Measured   |
| EAN-8               | Result     | Result     |
| EAN-13              | Result     | Result     |
| UPC-A               | Result     | Result     |
| UPC-E               | Result     | Result     |
| Code 39             | Result     | Result     |
| Code 93             | Result     | Result     |
| Code 128            | Result     | Result     |
| ITF                 | Result     | Result     |
| Codabar             | Result     | Result     |
| QR                  | Result     | Result     |
| Data Matrix         | Result     | Result     |
| Aztec               | Result     | Result     |
| PDF417              | Result     | Result     |
| Micro QR            | Result     | Result     |
| Camera              | Result     | Result     |
| Image               | Result     | Result     |
| Offline             | Result     | Result     |
| Performance         | Measured   | Measured   |
| Limitations         | Documented | Documented |

The table must report evidence.

It must not contain subjective ranking or unsupported scores.

---

# 42. POC ACCEPTANCE CRITERIA

The POC is successful when it provides sufficient evidence to determine:

1. Which required formats work.
2. Which platforms work.
3. Which input types work.
4. PDF417 behavior.
5. Difficult-condition behavior.
6. Performance characteristics.
7. Offline behavior.
8. Privacy implications.
9. Security implications.
10. Important limitations.
11. Integration complexity.
12. Whether the candidate should proceed to the next evaluation stage.

---

# 43. PDF417 ACCEPTANCE GATE

PDF417 receives a separate gate.

Before production scanner implementation, the selected engine must demonstrate:

* PDF417 detection
* Correct PDF417 decoding
* Camera decoding
* Image decoding
* Repeatability
* Representative difficult-condition testing
* Documented limitations
* Offline operation where required

If PDF417 performance is inadequate, the engine must not be approved merely because other formats perform well.

---

# 44. MICRO QR ACCEPTANCE GATE

Micro QR remains conditional.

If Micro QR is required by the final product scope:

* Engine support must be verified.
* Android support must be verified.
* Web support must be verified.
* Camera decoding must be verified.
* Image decoding must be verified.
* Accuracy must be measured.

If these conditions cannot be met reliably, Micro QR remains deferred/conditional.

---

# 45. PRIVACY ACCEPTANCE GATE

The candidate must not be approved if its required architecture violates the project's privacy principles.

The review must confirm:

* Core scanning can be local.
* Camera frames are not unnecessarily uploaded.
* Barcode contents are not unnecessarily transmitted.
* Sensitive data is not automatically logged.
* No unnecessary analytics are required.
* No unnecessary permissions are required.

---

# 46. SECURITY ACCEPTANCE GATE

The POC must verify that decoded content can be treated safely as untrusted data.

At minimum test:

* URLs
* HTML-like content
* Script-like content
* Oversized payloads
* Malformed payloads
* Invalid Unicode
* Unexpected characters
* Binary-looking data

The POC must not automatically execute decoded content.

---

# 47. POC FAILURE CONDITIONS

The POC must be considered unsuccessful for a candidate if:

* Required formats cannot be reliably decoded.
* PDF417 cannot meet the project requirement.
* Required platform integration is not viable.
* Offline operation cannot be achieved where required.
* Privacy requirements cannot be satisfied.
* Security risks cannot be reasonably controlled.
* Performance is impractical.
* Important behavior cannot be measured reliably.

Failure of one candidate does not mean the project has failed.

It means another candidate or technical approach must be investigated.

---

# 48. NO FABRICATED RESULTS

The AI coding agent must never claim:

```text
POC Passed
Accuracy = 99%
PDF417 Works
Offline Works
```

unless the corresponding test was actually performed and the result was recorded.

No estimated test results may be presented as measured results.

No simulated result may be presented as real-world evidence.

---

# 49. AI CODING AGENT RULES FOR POC

The AI agent must:

1. Read documents `01`–`13` before implementation.
2. Inspect the repository before changing files.
3. Explain the planned POC changes.
4. Keep the POC minimal.
5. Avoid production application features.
6. Avoid unnecessary dependencies.
7. Preserve the documented architecture.
8. Avoid undocumented scanner-engine substitutions.
9. Never invent NID data structures.
10. Never add real personal data.
11. Never claim unexecuted tests passed.
12. Record actual failures.
13. Record engine versions.
14. Record platform information.
15. Update documentation when required.
16. Stop when requirements conflict.
17. Ask for clarification only when a decision cannot be derived from the existing documentation.

---

# 50. POC IMPLEMENTATION RULE

The POC should be implemented incrementally.

Recommended sequence:

```text
Step 1
Repository inspection

        ↓

Step 2
POC environment setup

        ↓

Step 3
First candidate integration

        ↓

Step 4
Basic image decoding

        ↓

Step 5
Basic camera decoding

        ↓

Step 6
Required format verification

        ↓

Step 7
PDF417 verification

        ↓

Step 8
Second candidate integration

        ↓

Step 9
Repeat comparable tests

        ↓

Step 10
Difficult-condition tests

        ↓

Step 11
Performance tests

        ↓

Step 12
Offline/privacy/security tests

        ↓

Step 13
POC report
```

---

# 51. POC SHOULD NOT BECOME PRODUCTION

If the POC becomes large enough to resemble the final application, stop and reassess.

The POC should answer technical questions.

It should not gradually become:

> Version 0.1 of the complete application.

Production architecture begins only after the scanner-engine decision.

---

# 52. POC DELIVERABLES

The POC phase should produce:

### Required

```text
13_SCANNER_ENGINE_POC.md
```

### Implementation

A minimal experimental POC.

### Test Corpus

Controlled barcode fixtures.

### Test Results

Structured measured results.

### Accuracy Report

Format-by-format results.

### PDF417 Report

Dedicated PDF417 results.

### Platform Report

Android/Web findings.

### Privacy/Security Findings

Documented observations.

### Final POC Report

A concise summary of:

* What worked
* What failed
* Limitations
* Measurements
* Open questions
* Recommendation for next technical stage

---

# 53. POC RESULT DOCUMENT

After completing the experiment, create:

```text
14_SCANNER_ENGINE_POC_RESULTS.md
```

This document must contain actual measured results.

It must not be written before the POC has been executed.

---

# 54. FINAL ENGINE DECISION

The POC does not itself automatically select an engine.

Instead:

```text
POC Results
     ↓
Evidence Review
     ↓
Technology Decision
     ↓
11_TECHNOLOGY_DECISIONS.md
     ↓
Final Engine Status
```

The final decision must be documented separately.

---

# 55. NEXT DOCUMENT

After the POC is completed, the next document should be:

```text
14_SCANNER_ENGINE_POC_RESULTS.md
```

This document should contain actual experimental evidence.

After that:

```text
Final Scanner Engine Decision
        ↓
Production Architecture
        ↓
Production Coding
```

---

# 56. CURRENT STATUS

**Project:** Universal QR and Barcode Scanner

**Documentation:** `01`–`13` established

**Production Implementation:** Not Yet Authorized

**Scanner Engine:** Not Yet Selected

**Google ML Kit:** POC Candidate

**ZXing-C++:** POC Candidate

**PDF417:** Critical Verification Target

**Micro QR:** Conditional

**NID Parser:** Not Authorized

**Real NID Data:** Prohibited

**POC:** Next implementation milestone

---

# 57. FINAL PRINCIPLE

The purpose of this POC is not to prove that a preferred technology works.

The purpose is to discover the truth through controlled testing.

```text
CLAIM
  ↓
TEST
  ↓
MEASURE
  ↓
RECORD
  ↓
VERIFY
  ↓
DOCUMENT
  ↓
DECIDE
```

The project must prefer **measured evidence over assumptions**.

A scanner engine is not production-approved because:

* it is popular,
* it is recommended by AI,
* its documentation lists the required formats,
* another application uses it,
* or a single test succeeds.

Production approval requires sufficient evidence that the engine satisfies the project's actual requirements.

**Accuracy-First. Privacy-First. Offline-First. Evidence-Driven.**
