package org.universal.scanner.poc.model

/**
 * Standard test fixture definition for cross-platform comparative testing.
 * Compatible with the Web POC test corpus.
 */
data class TestFixture(
    val id: String,
    val format: BarcodeFormat,
    val category: FixtureCategory,
    val expectedPayload: String,
    val condition: String,
    val description: String,
    val rotationDegrees: Int = 0,
    val isNegativeControl: Boolean = false,
    val isMultiBarcode: Boolean = false,
    val expectedCount: Int = 1
)

enum class FixtureCategory {
    ONE_D,
    TWO_D,
    PDF417_CRITICAL,
    MICRO_QR,
    DIFFICULT_CONDITION,
    MULTIPLE_BARCODE,
    FALSE_POSITIVE_NEGATIVE
}
