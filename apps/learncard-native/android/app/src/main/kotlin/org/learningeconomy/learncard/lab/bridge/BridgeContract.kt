package org.learningeconomy.learncard.lab.bridge

import org.json.JSONObject

/**
 * Values that cross the account host boundary. Field names match
 * `account-runtime/types.ts` `NativeMessage` and the iOS `AccountBridge` reply.
 */
data class NativeMessage(
    val op: String,
    val id: String? = null,
    val field: String? = null,
    val value: String? = null,
    val forceRefresh: Boolean = false,
) {
    companion object {
        fun parse(json: String): NativeMessage {
            val message = JSONObject(json)
            return NativeMessage(
                op = message.getString("op"),
                id = message.optionalString("id"),
                field = message.optionalString("field"),
                value = message.optionalString("value"),
                forceRefresh = message.optBoolean("forceRefresh", false),
            )
        }
    }
}

data class NativeReply(
    val status: Int,
    val body: String,
    val contentType: String,
)

data class AccountCommandReply(
    val ok: Boolean,
    val error: String?,
    val value: Any?,
)

class QuickJsException(message: String) : RuntimeException(message)

class AccountBridgeException(message: String) : RuntimeException(message)

private fun JSONObject.optionalString(key: String): String? =
    if (has(key) && !isNull(key)) getString(key) else null
