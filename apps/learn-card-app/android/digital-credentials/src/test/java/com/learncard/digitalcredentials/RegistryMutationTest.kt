package com.learncard.digitalcredentials

import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.async
import org.junit.Assert.*
import org.junit.Test

class RegistryMutationTest {
    private class Store : RegistryStore {
        var ids = setOf("old")
        var revision = 0
        override val generation: String get() = revision.toString()
        override fun replace(ids: Set<String>): String { this.ids = ids; revision++; return generation }
        override fun replaceIfGeneration(ids: Set<String>, expected: String): String? {
            if (generation != expected) return null
            return replace(ids)
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

    @Test fun refreshWaitsForOpenConsentWithoutChangingItsGeneration() = runBlocking {
        val state = Store()
        val access = RegistryAccess()
        val lease = access.beginRequest()!!
        val selectedGeneration = state.generation
        var platformCalls = 0
        val refresh = async(start = CoroutineStart.UNDISPATCHED) {
            access.mutate {
                registerRegistry(state, setOf("new"), selectedGeneration) { platformCalls++ }
            }
        }
        assertFalse(refresh.isCompleted)
        assertEquals(selectedGeneration, state.generation)
        assertEquals(setOf("old"), state.ids)
        assertEquals(0, platformCalls)
        access.withRequest(lease) { assertEquals(selectedGeneration, state.generation) }
        access.endRequest(lease)
        refresh.await()
        assertEquals(1, platformCalls)
        assertEquals(setOf("new"), state.ids)
    }

    @Test fun accountClearInvalidatesConsentAndRejectsQueuedOldRefresh() = runBlocking {
        val state = Store()
        val access = RegistryAccess()
        val lease = access.beginRequest()!!
        val selectedGeneration = state.generation
        var platformCalls = 0
        val refresh = async(start = CoroutineStart.UNDISPATCHED) {
            runCatching {
                access.mutate {
                    registerRegistry(state, setOf("old-account"), selectedGeneration) { platformCalls++ }
                }
            }
        }
        access.invalidate { state.replace(emptySet()) }
        assertFalse(access.isActive(lease))
        assertThrows(IllegalStateException::class.java) { access.withRequest(lease) { fail("Stale consent") } }
        assertTrue(refresh.await().isFailure)
        assertEquals(0, platformCalls)
        assertTrue(state.ids.isEmpty())
        access.mutate { registerRegistry(state, setOf("new-account")) { platformCalls++ } }
        assertEquals(setOf("new-account"), state.ids)
        assertEquals(1, platformCalls)
    }

    @Test fun lateCleanupOfInvalidatedConsentCannotUnlockANewerRequest() = runBlocking {
        val access = RegistryAccess()
        val old = access.beginRequest()!!
        access.invalidate { }
        val current = access.beginRequest()!!
        val refresh = async(start = CoroutineStart.UNDISPATCHED) { access.mutate { } }
        access.endRequest(old)
        assertTrue(access.isActive(current))
        assertFalse(refresh.isCompleted)
        access.endRequest(current)
        refresh.await()
        val next = access.beginRequest()!!
        access.endRequest(next)
    }

    @Test fun overlappingConsentsBothRemainUsableUntilTheyFinish() = runBlocking {
        val state = Store()
        val access = RegistryAccess()
        val first = access.beginRequest()!!
        val second = access.beginRequest()!!
        val expected = state.generation
        val refresh = async(start = CoroutineStart.UNDISPATCHED) {
            access.mutate { registerRegistry(state, setOf("new"), expected) { } }
        }
        access.withRequest(first) { assertEquals(expected, state.generation) }
        access.endRequest(first)
        assertFalse(refresh.isCompleted)
        access.withRequest(second) { assertEquals(expected, state.generation) }
        access.endRequest(second)
        refresh.await()
        assertEquals(setOf("new"), state.ids)
    }

    @Test fun requestCannotEnterAnUnfinishedPlatformMutation() = runBlocking {
        val state = Store()
        val access = RegistryAccess()
        val platform = CompletableDeferred<Unit>()
        val refresh = async(start = CoroutineStart.UNDISPATCHED) {
            access.mutate { registerRegistry(state, setOf("new")) { platform.await() } }
        }
        assertTrue(state.ids.isEmpty())
        assertNull(access.beginRequest())
        platform.complete(Unit)
        refresh.await()
        val lease = access.beginRequest()!!
        access.withRequest(lease) { assertEquals(setOf("new"), state.ids) }
        access.endRequest(lease)
    }

    @Test fun clearDoesNotWaitForAnUnfinishedPlatformMutation() = runBlocking {
        val state = Store()
        val access = RegistryAccess()
        val platform = CompletableDeferred<Unit>()
        val refresh = async(start = CoroutineStart.UNDISPATCHED) {
            runCatching {
                access.mutate { registerRegistry(state, setOf("old-account")) { platform.await() } }
            }
        }
        val registeringGeneration = state.generation
        access.invalidate { state.replace(emptySet()) }
        assertNotEquals(registeringGeneration, state.generation)
        assertTrue(state.ids.isEmpty())
        assertFalse(refresh.isCompleted)
        platform.complete(Unit)
        assertTrue(refresh.await().isFailure)
        assertTrue(state.ids.isEmpty())
        access.mutate { registerRegistry(state, setOf("new-account")) { } }
        assertEquals(setOf("new-account"), state.ids)
    }

    @Test fun failedOrCancelledMutationReleasesItsGate() = runBlocking {
        val access = RegistryAccess()
        try {
            access.mutate { error("platform unavailable") }
            fail("Expected failure")
        } catch (_: IllegalStateException) { }
        val lease = access.beginRequest()!!
        access.endRequest(lease)
        val held = CompletableDeferred<Unit>()
        val mutation = async(start = CoroutineStart.UNDISPATCHED) { access.mutate { held.await() } }
        mutation.cancel()
        mutation.join()
        val afterCancellation = access.beginRequest()!!
        access.endRequest(afterCancellation)
    }
}
