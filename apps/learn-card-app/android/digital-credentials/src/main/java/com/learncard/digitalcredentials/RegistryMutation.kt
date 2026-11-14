package com.learncard.digitalcredentials

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.CompletableDeferred

internal class RegistryRequestLease

/** One process-wide gate shared by every host WebView and provider Activity. */
internal class RegistryAccess {
    private val mutation = Mutex()
    private val requestLock = Any()
    private val requests = mutableSetOf<RegistryRequestLease>()
    private var idle = CompletableDeferred<Unit>().apply { complete(Unit) }
    private var mutating = false

    suspend fun <T> mutate(operation: suspend () -> T): T = mutation.withLock {
        while (true) {
            val waiting = synchronized(requestLock) {
                if (requests.isEmpty()) {
                    mutating = true
                    null
                } else idle
            }
            if (waiting == null) break
            waiting.await()
        }
        try { operation() } finally { synchronized(requestLock) { mutating = false } }
    }

    // onCreate cannot suspend the main thread. A platform mutation already in flight
    // leaves no usable entries; the requester may retry once it finishes.
    fun beginRequest(): RegistryRequestLease? = synchronized(requestLock) {
        if (mutating) return@synchronized null
        if (requests.isEmpty()) idle = CompletableDeferred()
        RegistryRequestLease().also { requests.add(it) }
    }

    fun isActive(lease: RegistryRequestLease): Boolean = synchronized(requestLock) { lease in requests }

    fun <T> withRequest(lease: RegistryRequestLease, operation: () -> T): T = synchronized(requestLock) {
        check(lease in requests) { "Request invalidated" }
        operation()
    }

    fun endRequest(lease: RegistryRequestLease) = synchronized(requestLock) {
        requests.remove(lease)
        if (requests.isEmpty()) idle.complete(Unit)
    }

    // Account/profile invalidation wins immediately, without waiting for consent.
    // Invalidate the generation before releasing a queued registry mutation.
    fun invalidate(operation: () -> Unit) = synchronized(requestLock) {
        operation()
        requests.clear()
        idle.complete(Unit)
    }
}

internal interface RegistryStore {
    val generation: String
    fun replace(ids: Set<String>): String
    fun replaceIfGeneration(ids: Set<String>, expected: String): String?
}

/** Call under the mutation mutex. Immediate clear may invalidate while GMS is suspended. */
internal suspend fun registerRegistry(
    state: RegistryStore,
    ids: Set<String>,
    expectedGeneration: String = state.generation,
    register: suspend () -> Unit,
) {
    // A queued refresh must not resurrect an account cleared while it waited.
    val generation = state.replaceIfGeneration(emptySet(), expectedGeneration)
        ?: error("Registration invalidated")
    register()
    check(state.replaceIfGeneration(ids, generation) != null) { "Registration invalidated" }
}
