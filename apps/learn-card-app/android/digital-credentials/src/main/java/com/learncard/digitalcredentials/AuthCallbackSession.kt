package com.learncard.digitalcredentials

import java.net.URI
import java.util.UUID

/** One activity owns a browser callback. Tokens fence cleanup from an older sign-in attempt. */
internal class AuthCallbackSession<T>(private val now: () -> Long = System::currentTimeMillis) {
    private data class Session<T>(val token: String, val owner: T, val callback: URI, val expiresAt: Long)
    private var session: Session<T>? = null

    fun begin(owner: T, callback: String, timeoutMs: Long): String {
        check(session == null) { "Sign-in already active" }
        val uri = URI(callback)
        require(uri.scheme != null && uri.rawAuthority != null && uri.rawQuery == null && uri.rawFragment == null)
        require(timeoutMs in 1..600_000)
        val token = UUID.randomUUID().toString()
        session = Session(token, owner, uri, now() + timeoutMs)
        return token
    }

    /** False means this callback belongs to normal app sign-in, not a provider session. */
    fun route(callback: String, isActive: (T) -> Boolean, deliver: (T) -> Unit): Boolean {
        val pending = session ?: return false
        // Drop late/unrelated callbacks while a provider owns sign-in; never redirect
        // them into MainActivity and collapse the activity holding the platform result.
        if (now() >= pending.expiresAt || !isActive(pending.owner)) return true
        val uri = runCatching { URI(callback) }.getOrNull() ?: return true
        if (uri.scheme != pending.callback.scheme || uri.rawAuthority != pending.callback.rawAuthority ||
            uri.rawPath != pending.callback.rawPath) return true
        session = null
        deliver(pending.owner)
        return true
    }

    fun end(token: String) { if (session?.token == token) session = null }
    fun endOwner(owner: T) { if (session?.owner == owner) session = null }
}
