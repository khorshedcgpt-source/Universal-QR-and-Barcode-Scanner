package org.universal.scanner.poc.model

/**
 * Diagnostic decode result returned by candidate engines during benchmark.
 * Captures raw bytes and exact string representations without normalization.
 */
data class ScanResult(
    val engineName: String,
    val isSuccess: Boolean,
    val format: BarcodeFormat?,
    val rawFormatString: String,
    val rawPayload: String,
    val rawBytes: ByteArray?,
    val latencyMs: Double,
    val boundingBox: String? = null,
    val orientationDegrees: Int = 0,
    val errorMessage: String? = null,
    val exactMatch: Boolean? = null,
    val notes: String? = null
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as ScanResult
        if (engineName != other.engineName) return false
        if (isSuccess != other.isSuccess) return false
        if (format != other.format) return false
        if (rawPayload != other.rawPayload) return false
        if (rawBytes != null) {
            if (other.rawBytes == null) return false
            if (!rawBytes.contentEquals(other.rawBytes)) return false
        } else if (other.rawBytes != null) return false

        return true
    }

    override fun hashCode(): Int {
        var result = engineName.hashCode()
        result = 31 * result + isSuccess.hashCode()
        result = 31 * result + (format?.hashCode() ?: 0)
        result = 31 * result + rawPayload.hashCode()
        result = 31 * result + (rawBytes?.contentHashCode() ?: 0)
        return result
    }
}
