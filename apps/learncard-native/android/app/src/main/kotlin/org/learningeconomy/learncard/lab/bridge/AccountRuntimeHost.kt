package org.learningeconomy.learncard.lab.bridge

import org.json.JSONArray
import org.json.JSONObject

/** Runs the bundled `LearnCardAccount.call` contract inside QuickJS. */
class AccountRuntimeHost(
    private val engine: QuickJsEngine,
    private val bridge: AccountNativeBridge,
) : AutoCloseable {
    fun start(bundle: String, prelude: String) {
        engine.setHandler(bridge::handle)
        engine.evaluate(prelude, "prelude.js")
        engine.evaluate(bundle, "account-sdk.js")
    }

    fun call(method: String, inputJson: String = "{}"): AccountCommandReply {
        engine.evaluate(
            """
            globalThis.__lcStatus = '';
            globalThis.__lcResult = '';
            Promise.resolve(globalThis.LearnCardAccount.call(${jsString(method)}, JSON.parse(${jsString(inputJson)}))).then(function(value) {
                globalThis.__lcStatus = 'ok';
                globalThis.__lcResult = value;
            }, function(error) {
                globalThis.__lcStatus = 'throw';
                globalThis.__lcResult = String(error && error.message ? error.message : error);
            });
            """.trimIndent(),
            "call.js",
        )
        val status = engine.evaluate("globalThis.__lcStatus", "status.js")
        val result = engine.evaluate("globalThis.__lcResult", "result.js").orEmpty()
        if (status == "throw") throw QuickJsException(result)
        if (status != "ok") throw QuickJsException("Command did not settle")
        val reply = JSONObject(result)
        val value = if (!reply.has("value") || reply.isNull("value")) null else reply.get("value").normalize()
        return AccountCommandReply(
            ok = reply.optBoolean("ok", false),
            error = if (reply.has("error") && !reply.isNull("error")) reply.getString("error") else null,
            value = value,
        )
    }

    val nativeCalls: Int get() = bridge.calls

    override fun close() {
        engine.close()
    }
}

private fun Any.normalize(): Any = when (this) {
    is JSONArray -> List(length()) { index -> get(index).normalize() }
    is JSONObject -> keys().asSequence().associateWith { key -> get(key).normalize() }
    else -> this
}

internal fun jsString(value: String): String {
    val encoded = StringBuilder(value.length + 2)
    encoded.append('"')
    for (character in value) {
        when (character) {
            '\\' -> encoded.append("\\\\")
            '"' -> encoded.append("\\\"")
            '\n' -> encoded.append("\\n")
            '\r' -> encoded.append("\\r")
            '\u2028' -> encoded.append("\\u2028")
            '\u2029' -> encoded.append("\\u2029")
            else -> if (character.code < 0x20) encoded.append("\\u%04x".format(character.code)) else encoded.append(character)
        }
    }
    encoded.append('"')
    return encoded.toString()
}
