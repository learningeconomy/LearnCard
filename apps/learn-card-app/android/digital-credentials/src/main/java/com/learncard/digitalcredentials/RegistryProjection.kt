package com.learncard.digitalcredentials

import android.graphics.Bitmap
import android.graphics.Color
import androidx.credentials.registry.digitalcredentials.sdjwt.SdJwtClaim
import androidx.credentials.registry.digitalcredentials.sdjwt.SdJwtEntry
import androidx.credentials.registry.provider.digitalcredentials.VerificationEntryDisplayProperties
import androidx.credentials.registry.provider.digitalcredentials.VerificationFieldDisplayProperties
import org.json.JSONArray
import org.json.JSONObject

/** Metadata only: values and credential/storage/key material are never accepted by this boundary. */
internal object RegistryProjection {
    private val opaqueId = Regex("[A-Za-z0-9_-]{16,64}")

    fun validate(entry: JSONObject) {
        require(entry.keys().asSequence().toSet() == setOf("id", "vct", "title", "claims"))
        require(opaqueId.matches(entry.getString("id")))
        require(entry.getString("vct").length in 1..512)
        require(entry.getString("title").length in 1..100)
        val claims = entry.getJSONArray("claims")
        require(claims.length() in 1..32)
        for (i in 0 until claims.length()) {
            val claim = claims.getJSONObject(i)
            require(claim.keys().asSequence().toSet() == setOf("path", "displayName"))
            require(claim.getString("displayName").length in 1..100)
            val path = claim.getJSONArray("path")
            require(path.length() in 1..8)
            for (j in 0 until path.length()) require(path.get(j) is String && path.getString(j).length in 1..100)
        }
    }

    fun map(entries: JSONArray): List<SdJwtEntry> {
        require(entries.length() in 1..100)
        val ids = mutableSetOf<String>()
        return (0 until entries.length()).map { index ->
            val entry = entries.getJSONObject(index)
            validate(entry)
            require(ids.add(entry.getString("id")))
            val icon = Bitmap.createBitmap(40, 40, Bitmap.Config.ARGB_8888).apply { eraseColor(Color.rgb(24, 34, 78)) }
            val fields = entry.getJSONArray("claims")
            SdJwtEntry(
                verifiableCredentialType = entry.getString("vct"),
                id = entry.getString("id"),
                entryDisplayPropertySet = setOf(VerificationEntryDisplayProperties(entry.getString("title"), "LearnCard", icon)),
                claims = (0 until fields.length()).map { i ->
                    val field = fields.getJSONObject(i)
                    val path = field.getJSONArray("path")
                    SdJwtClaim(
                        path = (0 until path.length()).map { path.getString(it) },
                        value = null,
                        fieldDisplayPropertySet = setOf(VerificationFieldDisplayProperties(field.getString("displayName"))),
                        isSelectivelyDisclosable = true,
                    )
                },
            )
        }
    }
}
