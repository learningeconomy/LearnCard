package com.learncard.digitalcredentials

import android.content.Context
import kotlinx.coroutines.sync.Mutex
import java.util.UUID

/** Persists only opaque IDs and a generation. Credential-to-storage mappings stay in the host. */
internal class RegistryState(context: Context) {
    private val preferences = context.getSharedPreferences("lc-digital-credentials-v1", Context.MODE_PRIVATE)
    val generation: String get() = preferences.getString("generation", "") ?: ""
    val entryIds: Set<String> get() = preferences.getStringSet("entries", emptySet())!!.toSet()
    fun contains(id: String): Boolean = preferences.getStringSet("entries", emptySet())!!.contains(id)
    fun replace(ids: Set<String>) {
        check(preferences.edit().putString("generation", UUID.randomUUID().toString()).putStringSet("entries", ids).commit())
    }
    companion object {
        const val REGISTRY_ID = "learncard-openid4vp-sdjwt-v1"
        val mutation = Mutex()
    }
}
