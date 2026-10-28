package com.learncard.digitalcredentials

import androidx.credentials.registry.digitalcredentials.openid4vp.OpenId4VpRegistry
import androidx.credentials.registry.provider.ClearCredentialRegistryRequest
import androidx.credentials.registry.provider.RegistryManager
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
import kotlinx.coroutines.sync.withLock

/** Android transport only. The host owns credential access, eligibility, consent and signing. */
@CapacitorPlugin(name = "NativeDigitalCredentials")
class NativeDigitalCredentialsPlugin : Plugin() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    @PluginMethod fun status(call: PluginCall) {
        call.resolve(JSObject().put("enabled", context.resources.getBoolean(R.bool.lc_digital_credentials_enabled))
            .put("registeredEntryIds", org.json.JSONArray(RegistryState(context).entryIds.toList())) as JSObject)
    }

    @PluginMethod fun register(call: PluginCall) {
        scope.launch {
            RegistryState.mutation.withLock {
                try {
                    require(context.resources.getBoolean(R.bool.lc_digital_credentials_enabled))
                    val entries = RegistryProjection.map(call.getArray("entries") ?: error("Missing entries"))
                    val state = RegistryState(context)
                    state.replace(emptySet())
                    RegistryManager.create(context).registerCredentials(OpenId4VpRegistry(
                        credentialEntries = entries, id = RegistryState.REGISTRY_ID,
                        supportedProtocols = listOf(OpenId4VpRegistry.PROTOCOL_OPENID4VP_1_0_UNSIGNED),
                    ))
                    state.replace(entries.map { it.id }.toSet())
                    call.resolve(JSObject().put("registered", entries.size) as JSObject)
                } catch (_: Exception) { call.reject("Could not register credentials", "registration_failed") }
            }
        }
    }

    @PluginMethod fun clear(call: PluginCall) {
        // Invalidate before waiting for the asynchronous platform mutation or any other registration.
        RegistryState(context).replace(emptySet())
        scope.launch {
            RegistryState.mutation.withLock {
                try {
                    RegistryState(context).replace(emptySet())
                    RegistryManager.create(context).clearCredentialRegistry(ClearCredentialRegistryRequest(true))
                    call.resolve(JSObject().put("cleared", true) as JSObject)
                } catch (_: Exception) { call.reject("Could not clear credentials", "clear_failed") }
            }
        }
    }

    @PluginMethod fun getPendingRequest(call: PluginCall) {
        activity.runOnUiThread {
            val result = JSObject()
            result.put("isProvider", activity is DigitalCredentialProviderActivity)
            (activity as? DigitalCredentialProviderActivity)?.pendingRequest()?.let { result.put("pending", it) }
            call.resolve(result)
        }
    }

    @PluginMethod fun complete(call: PluginCall) {
        activity.runOnUiThread {
        try {
            val provider = activity as? DigitalCredentialProviderActivity ?: error("No provider request")
            provider.complete(call.getString("requestId") ?: error("Missing id"), call.getString("responseJson") ?: error("Missing response"))
            call.resolve()
        } catch (_: Exception) { call.reject("Could not complete request", "request_unavailable") }
        }
    }

    @PluginMethod fun cancel(call: PluginCall) {
        activity.runOnUiThread {
        try {
            val provider = activity as? DigitalCredentialProviderActivity ?: error("No provider request")
            provider.cancel(call.getString("requestId"))
            call.resolve()
        } catch (_: Exception) { call.reject("Could not cancel request", "request_unavailable") }
        }
    }

    override fun handleOnDestroy() { scope.cancel() }
}
