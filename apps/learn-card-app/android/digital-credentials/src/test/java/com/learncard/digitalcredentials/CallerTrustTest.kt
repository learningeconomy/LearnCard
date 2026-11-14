package com.learncard.digitalcredentials

import org.junit.Assert.*
import org.junit.Test

class CallerTrustTest {
    @Test fun onlyPinnedSingleSignerGmsMayDelegate() {
        assertTrue(CallerTrust.isBroker(CallerTrust.BROKER_PACKAGE, setOf(CallerTrust.BROKER_CERTIFICATE), false))
        assertTrue(CallerTrust.isBroker(CallerTrust.BROKER_PACKAGE, setOf("rotated", CallerTrust.BROKER_CERTIFICATE), false))
        assertFalse(CallerTrust.isBroker("com.example.systemapp", setOf(CallerTrust.BROKER_CERTIFICATE), false))
        assertFalse(CallerTrust.isBroker(CallerTrust.BROKER_PACKAGE, setOf("test-key"), false))
        assertFalse(CallerTrust.isBroker(CallerTrust.BROKER_PACKAGE, emptySet(), false))
        assertFalse(CallerTrust.isBroker(CallerTrust.BROKER_PACKAGE, setOf(CallerTrust.BROKER_CERTIFICATE, "other"), true))
    }

    @Test fun directRequesterMustMatchInstalledPackageAndCertificate() {
        CallerTrust.validateRequester("app", "app", false, setOf("cert"), setOf("cert"))
        assertThrows(IllegalArgumentException::class.java) {
            CallerTrust.validateRequester("system.app", "victim", false, setOf("victim-cert"), setOf("system-cert"))
        }
        assertThrows(IllegalArgumentException::class.java) {
            CallerTrust.validateRequester("app", "app", false, setOf("forged"), setOf("cert"))
        }
    }

    @Test fun brokerStillRequiresAnUnambiguousRequesterCertificate() {
        CallerTrust.validateRequester(CallerTrust.BROKER_PACKAGE, "requester", true, setOf("cert"), emptySet())
        for (certificates in listOf(emptySet(), setOf("a", "b"))) {
            assertThrows(IllegalArgumentException::class.java) {
                CallerTrust.validateRequester(CallerTrust.BROKER_PACKAGE, "requester", true, certificates, emptySet())
            }
        }
    }
}
