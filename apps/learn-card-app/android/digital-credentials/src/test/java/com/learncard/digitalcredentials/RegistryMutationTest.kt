package com.learncard.digitalcredentials

import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

class RegistryMutationTest {
    private class Store : RegistryStore {
        var ids = setOf("old")
        var revision = 0
        override val generation: String get() = revision.toString()
        override fun replace(ids: Set<String>): String { this.ids = ids; revision++; return generation }
        override fun replaceIfGeneration(ids: Set<String>, expected: String): Boolean {
            if (generation != expected) return false
            replace(ids)
            return true
        }
    }

    @Test fun advertisesOnlyAfterPlatformSuccess() = runBlocking {
        val state = Store()
        registerRegistry(state, setOf("new")) { assertTrue(state.ids.isEmpty()) }
        assertEquals(setOf("new"), state.ids)
    }

    @Test fun failedRegisterLeavesOldEntriesUnavailableAndAllowsRetry() = runBlocking {
        val state = Store()
        try {
            registerRegistry(state, setOf("new")) { error("platform unavailable") }
            fail("Expected failure")
        } catch (_: IllegalStateException) { }
        assertTrue(state.ids.isEmpty())
        registerRegistry(state, setOf("new")) { }
        assertEquals(setOf("new"), state.ids)
    }

    @Test fun clearDuringPlatformRegisterCannotRepublishOldAccount() = runBlocking {
        val state = Store()
        try {
            registerRegistry(state, setOf("old-account")) { state.replace(emptySet()) }
            fail("Expected invalidation")
        } catch (_: IllegalStateException) { }
        assertTrue(state.ids.isEmpty())
        registerRegistry(state, setOf("new-account")) { }
        assertEquals(setOf("new-account"), state.ids)
    }
}
