package org.universal.scanner.poc.corpus

import org.universal.scanner.poc.model.BarcodeFormat
import org.universal.scanner.poc.model.FixtureCategory
import org.universal.scanner.poc.model.TestFixture

/**
 * Standard test corpus definitions mirroring the Web POC corpus.
 * Guarantees cross-platform test parity and strict payload comparability.
 */
object SyntheticCorpus {

    val ALL_FIXTURES: List<TestFixture> = listOf(
        // --- 1D Formats ---
        TestFixture(
            id = "TC-EAN8",
            format = BarcodeFormat.EAN_8,
            category = FixtureCategory.ONE_D,
            expectedPayload = "96385074",
            condition = "Normal",
            description = "Standard 8-digit EAN retail barcode"
        ),
        TestFixture(
            id = "TC-EAN13",
            format = BarcodeFormat.EAN_13,
            category = FixtureCategory.ONE_D,
            expectedPayload = "5901234123457",
            condition = "Normal",
            description = "Standard 13-digit EAN retail barcode"
        ),
        TestFixture(
            id = "TC-UPCA",
            format = BarcodeFormat.UPC_A,
            category = FixtureCategory.ONE_D,
            expectedPayload = "012345678905",
            condition = "Normal",
            description = "Standard 12-digit UPC-A barcode"
        ),
        TestFixture(
            id = "TC-UPCE",
            format = BarcodeFormat.UPC_E,
            category = FixtureCategory.ONE_D,
            expectedPayload = "01234565",
            condition = "Normal",
            description = "Zero-suppressed UPC-E barcode"
        ),
        TestFixture(
            id = "TC-CODE39",
            format = BarcodeFormat.CODE_39,
            category = FixtureCategory.ONE_D,
            expectedPayload = "TEST39",
            condition = "Normal",
            description = "Alphanumeric Code 39 industrial barcode"
        ),
        TestFixture(
            id = "TC-CODE93",
            format = BarcodeFormat.CODE_93,
            category = FixtureCategory.ONE_D,
            expectedPayload = "CODE93",
            condition = "Normal",
            description = "High-density Code 93 barcode with dual checksums"
        ),
        TestFixture(
            id = "TC-CODE128",
            format = BarcodeFormat.CODE_128,
            category = FixtureCategory.ONE_D,
            expectedPayload = "TEST-CODE128-BATCH-99",
            condition = "Normal",
            description = "Full ASCII Code 128 barcode"
        ),
        TestFixture(
            id = "TC-ITF",
            format = BarcodeFormat.ITF,
            category = FixtureCategory.ONE_D,
            expectedPayload = "123456789012",
            condition = "Normal",
            description = "Interleaved 2 of 5 shipping container barcode"
        ),
        TestFixture(
            id = "TC-CODABAR",
            format = BarcodeFormat.CODABAR,
            category = FixtureCategory.ONE_D,
            expectedPayload = "A123456789B",
            condition = "Normal",
            description = "Codabar format with start/stop characters"
        ),

        // --- 2D Formats ---
        TestFixture(
            id = "TC-QR",
            format = BarcodeFormat.QR_CODE,
            category = FixtureCategory.TWO_D,
            expectedPayload = "https://example.com/scanner-poc-test-01",
            condition = "Normal",
            description = "Standard ISO/IEC 18004 QR Code URL payload"
        ),
        TestFixture(
            id = "TC-DATAMATRIX",
            format = BarcodeFormat.DATA_MATRIX,
            category = FixtureCategory.TWO_D,
            expectedPayload = "SYNTHETIC-DATAMATRIX-ABC-9921",
            condition = "Normal (Centered)",
            description = "ECC200 square Data Matrix"
        ),
        TestFixture(
            id = "TC-DATAMATRIX-OFFCENTER",
            format = BarcodeFormat.DATA_MATRIX,
            category = FixtureCategory.DIFFICULT_CONDITION,
            expectedPayload = "SYNTHETIC-DATAMATRIX-ABC-9921",
            condition = "Off-Center Corner",
            description = "Tests ML Kit documented limitation: Data Matrix off image center"
        ),
        TestFixture(
            id = "TC-AZTEC",
            format = BarcodeFormat.AZTEC,
            category = FixtureCategory.TWO_D,
            expectedPayload = "AZTEC-SYNTHETIC-TOKEN-4491",
            condition = "Normal",
            description = "High-density 2D Aztec token"
        ),

        // --- Critical & Conditional Formats ---
        TestFixture(
            id = "TC-PDF417",
            format = BarcodeFormat.PDF417,
            category = FixtureCategory.PDF417_CRITICAL,
            expectedPayload = "SYNTH-PDF417-ID:ALICE-M-SMITH:DOB-1988-04-12:DOC-7782190",
            condition = "Normal",
            description = "Standard multi-row synthetic PDF417 card fixture"
        ),
        TestFixture(
            id = "TC-MICROQR",
            format = BarcodeFormat.MICRO_QR,
            category = FixtureCategory.MICRO_QR,
            expectedPayload = "MQR-TEST-771",
            condition = "Normal",
            description = "Compact Micro QR symbol (single finder pattern)"
        ),

        // --- Difficult & Degraded Conditions ---
        TestFixture(
            id = "TC-DIFF-ROT90",
            format = BarcodeFormat.CODE_128,
            category = FixtureCategory.DIFFICULT_CONDITION,
            expectedPayload = "TEST-CODE128-BATCH-99",
            condition = "90° Vertical Rotation",
            rotationDegrees = 90,
            description = "Vertical orientation without manual device turn"
        ),
        TestFixture(
            id = "TC-DIFF-PDF417-ROT",
            format = BarcodeFormat.PDF417,
            category = FixtureCategory.DIFFICULT_CONDITION,
            expectedPayload = "SYNTH-PDF417-ID:ALICE-M-SMITH:DOB-1988-04-12:DOC-7782190",
            condition = "90° Vertical Rotation",
            rotationDegrees = 90,
            description = "Vertical PDF417 symbol orientation"
        ),
        TestFixture(
            id = "TC-DIFF-INVERT",
            format = BarcodeFormat.QR_CODE,
            category = FixtureCategory.DIFFICULT_CONDITION,
            expectedPayload = "https://example.com/scanner-poc-test-01",
            condition = "Inverted / Dark Mode",
            description = "White symbol modules on solid dark background"
        ),
        TestFixture(
            id = "TC-DIFF-BLUR",
            format = BarcodeFormat.QR_CODE,
            category = FixtureCategory.DIFFICULT_CONDITION,
            expectedPayload = "https://example.com/scanner-poc-test-01",
            condition = "Simulated Gaussian Blur",
            description = "Defocus blur simulation"
        ),

        // --- Multiple Barcodes ---
        TestFixture(
            id = "TC-MULTI-2BARCODES",
            format = BarcodeFormat.QR_CODE,
            category = FixtureCategory.MULTIPLE_BARCODE,
            expectedPayload = "MULTI-QR-01",
            condition = "Multiple Symbols (QR + Code 128)",
            isMultiBarcode = true,
            expectedCount = 2,
            description = "Two distinct symbologies in single frame"
        ),

        // --- Negative Controls (False-Positive Testing) ---
        TestFixture(
            id = "TC-NEG-TEXT",
            format = BarcodeFormat.QR_CODE,
            category = FixtureCategory.FALSE_POSITIVE_NEGATIVE,
            expectedPayload = "",
            condition = "Dense Text Document",
            isNegativeControl = true,
            expectedCount = 0,
            description = "High-contrast text paragraph with zero barcodes"
        ),
        TestFixture(
            id = "TC-NEG-NOISE",
            format = BarcodeFormat.QR_CODE,
            category = FixtureCategory.FALSE_POSITIVE_NEGATIVE,
            expectedPayload = "",
            condition = "Random Grain Noise",
            isNegativeControl = true,
            expectedCount = 0,
            description = "White/black high-frequency noise bitmap"
        )
    )
}
