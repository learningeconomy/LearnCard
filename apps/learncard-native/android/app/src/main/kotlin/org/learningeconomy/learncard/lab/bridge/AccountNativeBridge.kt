package org.learningeconomy.learncard.lab.bridge

import org.json.JSONObject
import org.learningeconomy.learncard.lab.storage.AccountStorageScope
import org.learningeconomy.learncard.lab.storage.KeystoreVault
import org.learningeconomy.learncard.lab.storage.SignupStorage
import org.learningeconomy.learncard.lab.storage.StagingResetStorage

/**
 * Kotlin side of `webkit.messageHandlers.accountNative`. Replies are strings or null;
 * failures reject the JavaScript promise and never return key material.
 */
class AccountNativeBridge(
    private val userId: String,
    private val vault: KeystoreVault,
    private val idToken: (forceRefresh: Boolean) -> String? = { null },
) {
    var calls: Int = 0
        private set

    fun handle(json: String): String {
        calls += 1
        return try {
            val value = dispatch(NativeMessage.parse(json))
            JSONObject().put("value", value ?: JSONObject.NULL).toString()
        } catch (_: Exception) {
            JSONObject().put("error", "Native account request failed").toString()
        }
    }

    private fun dispatch(message: NativeMessage): String? {
        when (message.op) {
            "transport" -> throw AccountBridgeException("Service refused")
            "idToken" -> return idToken(message.forceRefresh) ?: throw AccountBridgeException("Sign in first")
            "signOut" -> return null
            "resetFinish" -> {
                finishStagingReset(userId)
                return null
            }
            "resetRead" -> return vault.read(StagingResetStorage.key(userId))?.decodeToString()
            "resetWrite" -> {
                val value = message.value ?: throw AccountBridgeException("Storage")
                if (value.toByteArray().size > 8192) throw AccountBridgeException("Storage")
                val receipt = JSONObject(value)
                if (receipt.optString("uid") != userId || receipt.optString("environment") != "staging" || receipt.optString("tenant") != "learncard") {
                    throw AccountBridgeException("Storage")
                }
                vault.write(value.toByteArray(), StagingResetStorage.key(userId))
                return null
            }
            "signupRead" -> return vault.read(SignupStorage.key(userId))?.decodeToString()
            "signupWrite" -> {
                val value = message.value ?: throw AccountBridgeException("Storage")
                if (value.toByteArray().size > 16_384) throw AccountBridgeException("Storage")
                JSONObject(value)
                vault.write(value.toByteArray(), SignupStorage.key(userId))
                return null
            }
            "signupClear" -> {
                vault.remove(SignupStorage.key(userId))
                return null
            }
        }
        if (message.op !in setOf("get", "set", "remove") || message.field !in setOf("share", "version")) {
            throw AccountBridgeException("Unavailable")
        }
        val key = AccountStorageScope.key(userId, message.id, message.field!!)
        return when (message.op) {
            "get" -> vault.read(key)?.decodeToString()
            "set" -> {
                val value = message.value ?: throw AccountBridgeException("Storage")
                if (value.toByteArray().size > 65536) throw AccountBridgeException("Storage")
                if (message.field == "version") {
                    val version = value.toIntOrNull() ?: throw AccountBridgeException("Storage")
                    if (version < 1) throw AccountBridgeException("Storage")
                }
                vault.write(value.toByteArray(), key)
                null
            }
            else -> {
                vault.remove(key)
                null
            }
        }
    }

    private fun finishStagingReset(userId: String) {
        val raw = vault.read(StagingResetStorage.key(userId)) ?: throw AccountBridgeException("Storage")
        val receipt = JSONObject(raw.decodeToString())
        if (receipt.optInt("version") != 1 || receipt.optString("uid") != userId ||
            receipt.optString("environment") != "staging" || receipt.optString("tenant") != "learncard" ||
            receipt.optString("stage") != "local"
        ) {
            throw AccountBridgeException("Storage")
        }
        vault.forgetAccount(userId)
        val fresh = JSONObject().put("version", 1).put("fresh", true)
        vault.write(fresh.toString().toByteArray(), SignupStorage.key(userId))
        vault.remove(StagingResetStorage.key(userId))
    }
}
