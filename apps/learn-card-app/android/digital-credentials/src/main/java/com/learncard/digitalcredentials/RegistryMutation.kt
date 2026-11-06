package com.learncard.digitalcredentials

internal interface RegistryStore {
    val generation: String
    fun replace(ids: Set<String>): String
    fun replaceIfGeneration(ids: Set<String>, expected: String): Boolean
}

/** Call under the mutation mutex. Immediate clear may invalidate while GMS is suspended. */
internal suspend fun registerRegistry(state: RegistryStore, ids: Set<String>, register: suspend () -> Unit) {
    val generation = state.replace(emptySet())
    register()
    check(state.replaceIfGeneration(ids, generation)) { "Registration invalidated" }
}
