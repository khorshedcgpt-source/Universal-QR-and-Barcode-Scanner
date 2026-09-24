package org.universal.scanner.poc.benchmark

import org.junit.Assert.*
import org.junit.Test
import org.universal.scanner.poc.corpus.SyntheticCorpus
import org.universal.scanner.poc.model.BarcodeFormat

class CorpusVerificationTest {

    @Test
    fun testCorpusContainsAllRequiredFormats() {
        val fixtures = SyntheticCorpus.ALL_FIXTURES
        val formatsInCorpus = fixtures.map { it.format }.toSet()

        // Verify all 14 required project formats are present in corpus
        BarcodeFormat.allFormats().forEach { requiredFormat ->
            assertTrue(
                "Missing required format: ${requiredFormat.standardName}",
                formatsInCorpus.contains(requiredFormat)
            )
        }
    }

    @Test
    fun testPdf417FixtureValidity() {
        val pdf417Fixture = SyntheticCorpus.ALL_FIXTURES.first { it.format == BarcodeFormat.PDF417 }
        assertNotNull(pdf417Fixture)
        assertTrue(pdf417Fixture.expectedPayload.isNotEmpty())
        assertTrue(pdf417Fixture.expectedPayload.startsWith("SYNTH-PDF417-ID"))
    }

    @Test
    fun testMicroQrFixtureValidity() {
        val microQrFixture = SyntheticCorpus.ALL_FIXTURES.first { it.format == BarcodeFormat.MICRO_QR }
        assertNotNull(microQrFixture)
        assertEquals("MQR-TEST-771", microQrFixture.expectedPayload)
    }

    @Test
    fun testNegativeControlsPresent() {
        val negativeControls = SyntheticCorpus.ALL_FIXTURES.filter { it.isNegativeControl }
        assertEquals(2, negativeControls.size)
    }
}
