package com.learncard.digitalcredentials

/** Package names and system-app flags alone never authorize delegation. */
internal object CallerTrust {
    const val BROKER_PACKAGE = "com.google.android.gms"
    // Google release certificate. No debug/test keys or other Google packages are brokers.
    const val BROKER_CERTIFICATE = "f0fd6c5b410f25cb25c3b53346c8972fae30f8ee7411df910480ad6b2d60db83"

    fun isBroker(packageName: String, certificateHistory: Set<String>, multipleSigners: Boolean): Boolean =
        packageName == BROKER_PACKAGE && !multipleSigners && BROKER_CERTIFICATE in certificateHistory

    fun validateRequester(
        launchedBy: String,
        requester: String,
        trustedBroker: Boolean,
        claimed: Set<String>,
        installed: Set<String>,
    ) {
        require(claimed.size == 1) { "Unsupported requester signing certificates" }
        require(trustedBroker || (launchedBy == requester && installed == claimed)) { "Caller mismatch" }
    }
}
