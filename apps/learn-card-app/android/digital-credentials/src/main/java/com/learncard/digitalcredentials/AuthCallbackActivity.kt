package com.learncard.digitalcredentials

import android.app.Activity
import android.content.Intent
import android.os.Bundle

/** Exact OAuth routes enter here before MainActivity's broad singleTask scheme filter. */
class AuthCallbackActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (intent.action == Intent.ACTION_VIEW && !ProviderAuthCallbacks.route(intent)) {
            // Ordinary/cold-start login retains the existing MainActivity callback behavior.
            packageManager.getLaunchIntentForPackage(packageName)?.let { launch ->
                startActivity(launch.setAction(Intent.ACTION_VIEW).setData(intent.data))
            }
        }
        finish()
    }
}
