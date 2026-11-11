package com.learncard.digitalcredentials

import org.junit.Assert.*
import org.junit.Test

class AuthCallbackSessionTest {
    @Test fun routesOnlyToTheWaitingOwnerAndChecksExactCallbackRoute() {
        val sessions = AuthCallbackSession<String>()
        val token = sessions.begin("provider-a", "com.learncard.app://login", 1000)
        var delivered: String? = null
        for (url in listOf("com.learncard.app://login.evil?code=x", "com.learncard.app://login/other?code=x",
            "other://login?code=x", "com.learncard.app://auth/classlink/callback?code=x")) {
            assertTrue(sessions.route(url, { true }) { delivered = it })
            assertNull(delivered)
        }
        assertTrue(sessions.route("com.learncard.app://login?code=x&state=s", { true }) { delivered = it })
        assertEquals("provider-a", delivered)
        sessions.end(token)
    }

    @Test fun routesClassLinkAndFencesCleanupBySessionToken() {
        val sessions = AuthCallbackSession<String>()
        val old = sessions.begin("old", "com.learncard.app://login", 1000)
        sessions.end(old)
        sessions.begin("new", "com.learncard.app://auth/classlink/callback", 1000)
        sessions.end(old)
        var delivered: String? = null
        assertTrue(sessions.route("com.learncard.app://auth/classlink/callback?code=x", { true }) { delivered = it })
        assertEquals("new", delivered)
    }

    @Test fun expiredOrCanceledProviderNeverReceivesAnAuthResponse() {
        var now = 100L
        val sessions = AuthCallbackSession<String> { now }
        val token = sessions.begin("provider", "com.learncard.app://login", 1000)
        now = 1100
        assertTrue(sessions.route("com.learncard.app://login?code=x", { true }) { fail("expired") })
        sessions.end(token)
        sessions.begin("provider", "com.learncard.app://login", 1000)
        assertTrue(sessions.route("com.learncard.app://login?code=x", { false }) { fail("inactive") })
        sessions.endOwner("provider")
        assertFalse(sessions.route("com.learncard.app://login?code=x", { true }) { fail("destroyed") })
    }
}
