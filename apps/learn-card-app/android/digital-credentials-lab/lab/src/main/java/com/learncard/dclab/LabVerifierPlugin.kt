package com.learncard.dclab

import android.content.pm.PackageManager
import android.util.Base64
import androidx.credentials.CredentialManager
import androidx.credentials.DigitalCredential
import androidx.credentials.ExperimentalDigitalCredentialApi
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetDigitalCredentialOption
import androidx.credentials.exceptions.GetCredentialCancellationException
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.security.MessageDigest

@OptIn(ExperimentalDigitalCredentialApi::class)
@CapacitorPlugin(name = "LabVerifier")
class LabVerifierPlugin : Plugin() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var requesting = false

    @PluginMethod fun request(call: PluginCall) {
        if (requesting) { call.reject("Request already active", "busy"); return }
        requesting = true
        scope.launch {
            try {
                val json = call.getString("requestJson") ?: error("Missing request")
                val result = CredentialManager.create(context).getCredential(activity, GetCredentialRequest(listOf(GetDigitalCredentialOption(json))))
                val credential = result.credential as? DigitalCredential ?: error("Unexpected credential")
                val cert = context.packageManager.getPackageInfo(context.packageName, PackageManager.GET_SIGNING_CERTIFICATES).signingInfo!!.signingCertificateHistory.first()
                val origin = "android:apk-key-hash:" + Base64.encodeToString(MessageDigest.getInstance("SHA-256").digest(cert.toByteArray()), Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
                call.resolve(JSObject().put("responseJson", credential.credentialJson).put("origin", origin) as JSObject)
            } catch (_: GetCredentialCancellationException) { call.reject("Canceled", "canceled") }
            catch (error: Exception) { call.reject("Credential request failed: ${error.javaClass.simpleName}", "request_failed") }
            finally { requesting = false }
        }
    }

    override fun handleOnDestroy() { scope.cancel() }
}
