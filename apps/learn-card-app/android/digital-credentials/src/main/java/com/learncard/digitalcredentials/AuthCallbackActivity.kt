package com.learncard.digitalcredentials

import android.app.Activity
import android.content.Intent
import android.os.Bundle

/** Single entry for the tenant scheme; OAuth returns to the activity that opened it. */
class AuthCallbackActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val uri = intent.data
        val isAuthCallback = uri?.let {
            (it.host == "login" && it.path.isNullOrEmpty()) ||
                (it.host == "auth" && it.path == "/classlink/callback")
        } == true
        if (intent.action == Intent.ACTION_VIEW && uri != null &&
            (!isAuthCallback || !ProviderAuthCallbacks.route(intent))) {
            // Ordinary/cold-start login retains the existing MainActivity callback behavior.
            packageManager.getLaunchIntentForPackage(packageName)?.let { launch ->
                startActivity(launch.setAction(Intent.ACTION_VIEW).setData(intent.data))
            }
        }
        finish()
    }
}
