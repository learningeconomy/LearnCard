package com.learncard.digitalcredentials

import org.junit.Assert.*
import org.junit.Test

class AuthCallbackSessionTest {
    @Test fun honorsJsonIntegerTimeoutsIncludingInteractiveSignInAndRejectsInvalidInput() {
        assertEquals(1000L, authCallbackTimeout(org.json.JSONObject("{\"timeoutMs\":1000}").get("timeoutMs")))
        assertEquals(600_000L, authCallbackTimeout(org.json.JSONObject("{\"timeoutMs\":600000}").get("timeoutMs")))
        for (invalid in listOf(null, "1000", 1000.5, 0, -1, 600_001)) {
            assertTrue(runCatching { authCallbackTimeout(invalid) }.isFailure)
        }
    }

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

    @Test fun expiredSessionCanBeReplacedAndOldCleanupCannotClearItsSuccessor() {
        var now = 0L
        val sessions = AuthCallbackSession<String> { now }
        val old = sessions.begin("old", "com.learncard.app://login", 1000)
        now = 1000
        sessions.begin("new", "com.learncard.app://login", 1000)
        sessions.end(old)
        var delivered: String? = null
        assertTrue(sessions.route("com.learncard.app://login?code=x", { true }) { delivered = it })
        assertEquals("new", delivered)
    }

    @Test fun expiredOrCanceledProviderNeverReceivesAnAuthResponse() {
        var now = 100L
        val sessions = AuthCallbackSession<String> { now }
        val token = sessions.begin("provider", "com.learncard.app://login", 1000)
        now = 1100
        assertFalse(sessions.route("com.learncard.app://login?code=x", { true }) { fail("expired") })
        sessions.end(token)
        sessions.begin("provider", "com.learncard.app://login", 1000)
        assertFalse(sessions.route("com.learncard.app://login?code=x", { false }) { fail("inactive") })
        sessions.endOwner("provider")
        assertFalse(sessions.route("com.learncard.app://login?code=x", { true }) { fail("destroyed") })
    }
}
