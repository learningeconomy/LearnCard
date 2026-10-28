package com.learncard.digitalcredentials

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import androidx.credentials.DigitalCredential
import androidx.credentials.ExperimentalDigitalCredentialApi
import androidx.credentials.GetCredentialResponse
import androidx.credentials.GetDigitalCredentialOption
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialUnknownException
import androidx.credentials.provider.PendingIntentHandler
import androidx.activity.OnBackPressedCallback
import androidx.credentials.registry.provider.selectedCredentialSet
import androidx.credentials.registry.provider.selectedEntryId
import com.getcapacitor.CapConfig
import com.getcapacitor.BridgeActivity
import com.getcapacitor.JSObject
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

/** Owns the platform result. The request is rebuilt from the system intent after process recreation. */
@OptIn(ExperimentalDigitalCredentialApi::class)
class DigitalCredentialProviderActivity : BridgeActivity() {
    private lateinit var registry: RegistryState
    private var pending: JSObject? = null
    private var generation = ""
    private var completed = false

    override fun load() {
        // MainActivity deliberately holds its launch splash until account hydration.
        // A provider must draw/focus immediately so Android Back can terminate its
        // pending result even while the account/JS bundle is still loading.
        config = CapConfig.loadDefault(this)
        config.getPluginConfiguration("SplashScreen").configJSON
            .put("launchShowDuration", 0).put("launchAutoHide", true)
        super.load()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        registry = RegistryState(this)
        var stage = "enabled"
        try {
            require(resources.getBoolean(R.bool.lc_digital_credentials_enabled))
            stage = "platform_request"
            val request = PendingIntentHandler.retrieveProviderGetCredentialRequest(intent) ?: error("Missing request")
            stage = "selected_entry"
            val selected = request.selectedCredentialSet?.credentials?.map { it.credentialId }
                ?: listOfNotNull(request.selectedEntryId)
            require(selected.size == 1 && registry.contains(selected.single()))
            stage = "credential_options"
            val options = request.credentialOptions.filterIsInstance<GetDigitalCredentialOption>()
            require(options.size == 1)
            stage = "protocol"
            val requests = JSONObject(options.single().requestJson).getJSONArray("requests")
            val supported = (0 until requests.length()).map { requests.getJSONObject(it) }
                .filter { it.optString("protocol") == "openid4vp-v1-unsigned" }
            require(supported.size == 1)
            generation = registry.generation
            stage = "caller_identity"
            pending = JSObject().put("requestId", UUID.randomUUID().toString())
                .put("selectedEntryId", selected.single()).put("origin", CallerOrigin.resolve(this, request.callingAppInfo))
                .put("callerPackage", request.callingAppInfo.packageName)
                .put("callerName", runCatching {
                    packageManager.getApplicationLabel(packageManager.getApplicationInfo(request.callingAppInfo.packageName, 0)).toString()
                }.getOrDefault(request.callingAppInfo.packageName))
                .put("request", supported.single()) as JSObject
        } catch (error: Exception) {
            if (applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE != 0) {
                // Never log request data, credentials, keys or identifying caller details.
                android.util.Log.w("LearnCardProvider", "Rejected at $stage (${error.javaClass.simpleName})")
            }
            completed = true
            val result = Intent()
            PendingIntentHandler.setGetCredentialException(result, GetCredentialUnknownException("Request unavailable"))
            setResult(Activity.RESULT_OK, result)
            super.onCreate(savedInstanceState)
            finish()
            return
        }
        registerPlugin(NativeDigitalCredentialsPlugin::class.java)
        super.onCreate(savedInstanceState)
        // Own Android's back dispatcher before the host's JS router can navigate
        // away and strand Credential Manager's pending result (including expired requests).
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (!completed) cancel(null) else finish()
            }
        })
    }

    fun pendingRequest(): JSObject? = if (!completed && registry.generation == generation) pending else null

    fun complete(requestId: String, responseJson: String) {
        require(!completed && pendingRequest()?.getString("requestId") == requestId)
        val response = JSONObject(responseJson)
        require(response.getString("protocol") == "openid4vp-v1-unsigned")
        val data = response.getJSONObject("data")
        require(data.keys().asSequence().toSet() == setOf("vp_token"))
        require(data.getJSONObject("vp_token").length() > 0)
        completed = true
        pending = null
        val result = Intent()
        PendingIntentHandler.setGetCredentialResponse(result, GetCredentialResponse(DigitalCredential(response.toString())))
        setResult(Activity.RESULT_OK, result)
        finish()
    }

    fun cancel(requestId: String?) {
        // Dismissal must still work after registry/account invalidation hides the JS
        // request. It can only terminate this Activity's result, never disclose data.
        require(!completed && pending != null && (requestId == null || pending?.getString("requestId") == requestId))
        completed = true
        pending = null
        val result = Intent()
        PendingIntentHandler.setGetCredentialException(result, GetCredentialCancellationException("Canceled"))
        setResult(Activity.RESULT_OK, result)
        finish()
    }

}
