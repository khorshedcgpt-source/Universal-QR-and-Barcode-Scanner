package org.universal.scanner.poc.model

/**
 * Standard project barcode symbologies to verify across candidate engines.
 * Covers all 14 project formats defined in 07_BARCODE_SUPPORT.md.
 */
enum class BarcodeFormat(val standardName: String) {
    // 1D Retail & Industrial
    EAN_8("EAN-8"),
    EAN_13("EAN-13"),
    UPC_A("UPC-A"),
    UPC_E("UPC-E"),
    CODE_39("Code 39"),
    CODE_93("Code 93"),
    CODE_128("Code 128"),
    ITF("ITF (Interleaved 2 of 5)"),
    CODABAR("Codabar"),

    // 2D Matrix
    QR_CODE("QR Code"),
    DATA_MATRIX("Data Matrix"),
    AZTEC("Aztec"),

    // 2D Stacked / Conditional
    PDF417("PDF417"),
    MICRO_QR("Micro QR");

    companion object {
        fun allFormats(): Set<BarcodeFormat> = entries.toSet()
        fun oneDFormats(): Set<BarcodeFormat> = setOf(EAN_8, EAN_13, UPC_A, UPC_E, CODE_39, CODE_93, CODE_128, ITF, CODABAR)
        fun twoDFormats(): Set<BarcodeFormat> = setOf(QR_CODE, DATA_MATRIX, AZTEC, PDF417, MICRO_QR)
    }
}
