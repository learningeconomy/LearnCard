package com.learncard.digitalcredentials

import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

class BrowserOriginTest {
    private val policy = javaClass.classLoader!!.getResourceAsStream("digital_credentials_privileged_callers.json")!!
        .bufferedReader().use { it.readText() }
    // Google's published release identity, not a debug key or a package-name-only grant.
    private val release = "f0fd6c5b410f25cb25c3b53346c8972fae30f8ee7411df910480ad6b2d60db83"
    private fun resolve(origin: String, pkg: String = "com.android.chrome", certificates: Set<String> = setOf(release)) =
        BrowserOrigin.resolve(pkg, certificates, origin, policy)

    @Test fun packagedPolicyContainsOnlyStableChromeRelease() {
        val apps = JSONObject(policy).getJSONArray("apps")
        assertEquals(1, apps.length())
        assertEquals("com.android.chrome", apps.getJSONObject(0).getJSONObject("info").getString("package_name"))
        assertEquals(1, apps.getJSONObject(0).getJSONObject("info").getJSONArray("signatures").length())
        assertEquals("https://verifier.example", resolve("https://verifier.example"))
        assertEquals("https://verifier.example", resolve("https://verifier.example:443/"))
        assertEquals("https://verifier.example:8443", resolve("https://verifier.example:8443"))
    }

    @Test fun defaultBrowserOrGoogleCertificateAloneDoesNotGrantWebsiteDelegation() {
        for (pkg in listOf("example.default.browser", "com.chrome.beta", "com.google.android.gms")) {
            assertThrows(IllegalArgumentException::class.java) { resolve("https://verifier.example", pkg) }
        }
        for (certificates in listOf(emptySet(), setOf("debug"), setOf(release, "other"))) {
            assertThrows(IllegalArgumentException::class.java) { resolve("https://verifier.example", certificates = certificates) }
        }
    }

    @Test fun rejectsNonOriginAndInsecureValuesEvenFromTrustedBrowser() {
        for (origin in listOf("http://verifier.example", "null", "https://user@verifier.example",
            "https://verifier.example/path", "https://verifier.example?query", "https://verifier.example#fragment",
            "https://verifier.example:0", "https://verifier.example:65536")) {
            assertThrows(IllegalArgumentException::class.java) { resolve(origin) }
        }
    }
}
