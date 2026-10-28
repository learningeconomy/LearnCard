package com.learncard.dclab

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.learncard.digitalcredentials.NativeDigitalCredentialsPlugin

/** Separate debug-only identities exercise the actual provider module across app/process boundaries. */
class LabActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(NativeDigitalCredentialsPlugin::class.java)
        registerPlugin(LabVerifierPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
