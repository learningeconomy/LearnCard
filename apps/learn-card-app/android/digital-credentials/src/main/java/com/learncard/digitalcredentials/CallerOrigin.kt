package com.learncard.digitalcredentials

import android.app.Activity
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import android.util.Base64
import androidx.credentials.provider.CallingAppInfo
import java.security.MessageDigest

internal object CallerOrigin {
    fun certificateOrigin(certificate: ByteArray): String = "android:apk-key-hash:" + Base64.encodeToString(
        MessageDigest.getInstance("SHA-256").digest(certificate), Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING,
    )

    /** Match platform identity against the installed package; do not trust a parcel or JS string alone. */
    @Suppress("DEPRECATION")
    fun resolve(activity: Activity, caller: CallingAppInfo): String {
        val launchedBy = activity.callingPackage ?: throw SecurityException("Missing platform caller")
        val pm = activity.packageManager
        val broker = pm.getApplicationInfo(launchedBy, 0)
        val systemBroker = broker.flags and (ApplicationInfo.FLAG_SYSTEM or ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0
        require(systemBroker || launchedBy == caller.packageName) { "Caller mismatch" }
        val actual = if (Build.VERSION.SDK_INT >= 28) {
            pm.getPackageInfo(caller.packageName, PackageManager.GET_SIGNING_CERTIFICATES).signingInfo!!.signingCertificateHistory.toList()
        } else pm.getPackageInfo(caller.packageName, PackageManager.GET_SIGNATURES).signatures!!.toList()
        val claimed = caller.signingInfoCompat.signingCertificateHistory
        require(actual.map { it.toCharsString() }.toSet() == claimed.map { it.toCharsString() }.toSet()) { "Certificate mismatch" }
        if (caller.isOriginPopulated()) {
            val allowlist = activity.assets.open("digital_credentials_privileged_callers.json").bufferedReader().use { it.readText() }
            return caller.getOrigin(allowlist) ?: throw SecurityException("Missing browser origin")
        }
        require(actual.size == 1) { "Multiple signing certificates unsupported in this profile" }
        return certificateOrigin(actual.first().toByteArray())
    }
}
