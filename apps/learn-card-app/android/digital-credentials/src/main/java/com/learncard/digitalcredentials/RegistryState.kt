package com.learncard.digitalcredentials

import android.content.Context
import kotlinx.coroutines.sync.Mutex
import java.util.UUID

/** Persists only opaque IDs and a generation. Credential-to-storage mappings stay in the host. */
internal class RegistryState(context: Context) : RegistryStore {
    private val preferences = context.getSharedPreferences("lc-digital-credentials-v1", Context.MODE_PRIVATE)
    override val generation: String get() = preferences.getString("generation", "") ?: ""
    val entryIds: Set<String> get() = preferences.getStringSet("entries", emptySet())!!.toSet()
    fun contains(id: String): Boolean = preferences.getStringSet("entries", emptySet())!!.contains(id)
    override fun replace(ids: Set<String>): String = synchronized(stateLock) {
        val next = UUID.randomUUID().toString()
        check(preferences.edit().putString("generation", next).putStringSet("entries", ids).commit())
        next
    }
    override fun replaceIfGeneration(ids: Set<String>, expected: String): Boolean = synchronized(stateLock) {
        if (generation != expected) return@synchronized false
        replace(ids)
        true
    }
    companion object {
        const val REGISTRY_ID = "learncard-openid4vp-sdjwt-v1"
        val mutation = Mutex()
        private val stateLock = Any()
    }
}
