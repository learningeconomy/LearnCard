package com.learncard.digitalcredentials

import android.content.Intent
import java.lang.ref.WeakReference

/** Main-thread-only relay; no auth response or credential is persisted/shared between WebViews. */
internal object ProviderAuthCallbacks {
    private val sessions = AuthCallbackSession<WeakReference<DigitalCredentialProviderActivity>>()
    private var active: WeakReference<DigitalCredentialProviderActivity>? = null
    fun attach(activity: DigitalCredentialProviderActivity) { active = WeakReference(activity) }
    private var owner: WeakReference<DigitalCredentialProviderActivity>? = null

    fun begin(activity: DigitalCredentialProviderActivity, callback: String, timeoutMs: Long): String {
        require(activity.pendingRequest() != null)
        val reference = WeakReference(activity)
        val token = sessions.begin(reference, callback, timeoutMs)
        owner = reference
        return token
    }

    fun end(token: String) = sessions.end(token)
    fun endOwner(activity: DigitalCredentialProviderActivity) {
        if (active?.get() === activity) active = null
        owner?.takeIf { it.get() === activity }?.let { sessions.endOwner(it); owner = null }
    }

    fun route(intent: Intent): Boolean {
        val uri = intent.data ?: return false
        val handled = sessions.route(uri.toString(), { ref ->
            ref.get()?.let { !it.isFinishing && !it.isDestroyed && it.pendingRequest() != null } == true
        }) { ref ->
            ref.get()?.let { activity ->
                // Reuse the exact provider in its original task. Never launch MainActivity
                // (singleTask), which may destroy the provider above it. Capacitor delivers
                // onNewIntent to that provider's waiting appUrlOpen listener.
                activity.startActivity(Intent(activity, DigitalCredentialProviderActivity::class.java)
                    .setAction(Intent.ACTION_VIEW).setData(uri)
                    .addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or Intent.FLAG_ACTIVITY_SINGLE_TOP))
            }
        }
        return handled || active?.get()?.let { !it.isFinishing && !it.isDestroyed } == true
    }
}
