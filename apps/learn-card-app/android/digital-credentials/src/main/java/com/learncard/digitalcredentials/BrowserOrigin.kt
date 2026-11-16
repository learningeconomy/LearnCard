package com.learncard.digitalcredentials

import org.json.JSONObject
import java.net.URI

/** Local release-browser policy, applied in addition to AndroidX getOrigin verification. */
internal object BrowserOrigin {
    fun resolve(packageName: String, certificateHashes: Set<String>, origin: String, allowlist: String): String {
        require(certificateHashes.size == 1) { "Ambiguous browser signing identity" }
        val apps = JSONObject(allowlist).getJSONArray("apps")
        val allowed = (0 until apps.length()).any { i ->
            val app = apps.getJSONObject(i)
            val info = app.getJSONObject("info")
            app.getString("type") == "android" && info.getString("package_name") == packageName &&
                info.getJSONArray("signatures").let { signatures ->
                    (0 until signatures.length()).any { j ->
                        val signature = signatures.getJSONObject(j)
                        signature.getString("build") == "release" &&
                            signature.getString("cert_fingerprint_sha256").replace(":", "").lowercase() in certificateHashes
                    }
                }
        }
        require(allowed) { "Browser signing identity not allowed" }
        val uri = URI(origin)
        require(uri.scheme == "https" && !uri.host.isNullOrEmpty() &&
            uri.rawUserInfo == null && uri.rawQuery == null && uri.rawFragment == null &&
            uri.rawPath.orEmpty() in setOf("", "/") && (uri.port == -1 || uri.port in 1..65535)) {
            "Invalid verified browser origin"
        }
        return URI("https", null, uri.host.lowercase(), if (uri.port == 443) -1 else uri.port, null, null, null).toASCIIString()
    }
}
