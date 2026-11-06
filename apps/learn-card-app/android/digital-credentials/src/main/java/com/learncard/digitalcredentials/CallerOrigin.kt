package com.learncard.digitalcredentials

import android.app.Activity
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
        val launchInfo = pm.getPackageInfo(launchedBy, if (Build.VERSION.SDK_INT >= 28) PackageManager.GET_SIGNING_CERTIFICATES else PackageManager.GET_SIGNATURES)
        val multipleSigners = Build.VERSION.SDK_INT >= 28 && launchInfo.signingInfo?.hasMultipleSigners() == true
        val launchCertificates = if (Build.VERSION.SDK_INT >= 28) launchInfo.signingInfo?.signingCertificateHistory else launchInfo.signatures
        val broker = CallerTrust.isBroker(launchedBy, launchCertificates.orEmpty().map {
            MessageDigest.getInstance("SHA-256").digest(it.toByteArray()).joinToString("") { byte -> "%02x".format(byte) }
        }.toSet(), multipleSigners)
        // The system broker authenticates the requesting app. Android package visibility
        // prevents a provider from independently looking up arbitrary requesters; do not
        // request QUERY_ALL_PACKAGES just to repeat the broker's certificate lookup.
        val claimed = caller.signingInfoCompat.signingCertificateHistory
        CallerTrust.validateRequester(launchedBy, caller.packageName, broker,
            claimed.map { it.toCharsString() }.toSet(), launchCertificates.orEmpty().map { it.toCharsString() }.toSet())
        if (caller.isOriginPopulated()) {
            val allowlist = activity.assets.open("digital_credentials_privileged_callers.json").bufferedReader().use { it.readText() }
            return caller.getOrigin(allowlist) ?: throw SecurityException("Missing browser origin")
        }
        return certificateOrigin(claimed.first().toByteArray())
    }
}
