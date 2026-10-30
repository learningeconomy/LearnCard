package org.learningeconomy.learncard.lab.storage

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

class KeystoreVaultTest {
    @Test
    fun writeReadUpdateAndRemoveStayInsideOneService() {
        val shared = MemorySecretBytes()
        val first = KeystoreVault("service-a", shared)
        val second = KeystoreVault("service-b", shared)
        first.write("synthetic-share-one".toByteArray(), "user-one")
        assertNull(first.read("user-two"))
        assertNull(second.read("user-one"))
        first.write("synthetic-share-updated".toByteArray(), "user-one")
        assertEquals("synthetic-share-updated", KeystoreVault("service-a", shared).read("user-one")?.decodeToString())
        first.remove("user-one")
        assertNull(first.read("user-one"))
    }

    @Test
    fun forgetAccountClearsOnlyThatPersonsShareSlots() {
        val store = MemorySecretBytes()
        val vault = KeystoreVault("forget", store)
        vault.write("keep".toByteArray(), "other")
        vault.write("share".toByteArray(), AccountStorageScope.key("one", null, "share"))
        vault.write("1".toByteArray(), AccountStorageScope.key("one", null, "version"))
        vault.write("pending".toByteArray(), AccountStorageScope.key("one", "sss-pending-share:sss-device-share:one", "share"))
        vault.write("other-share".toByteArray(), AccountStorageScope.key("two", null, "share"))
        vault.write("{}".toByteArray(), SignupStorage.key("one"))
        vault.forgetAccount("one")
        assertNull(vault.read(AccountStorageScope.key("one", null, "share")))
        assertNull(vault.read(AccountStorageScope.key("one", null, "version")))
        assertNull(vault.read(AccountStorageScope.key("one", "sss-pending-share:sss-device-share:one", "share")))
        assertNull(vault.read(SignupStorage.key("one")))
        assertEquals("other-share", vault.read(AccountStorageScope.key("two", null, "share"))?.decodeToString())
        assertEquals("keep", vault.read("other")?.decodeToString())
    }

    @Test
    fun storageKeysMatchTheIosAccountSlots() {
        assertEquals("signup:learncard:staging:one", SignupStorage.key("one"))
        assertEquals(
            "sss:learncard:staging:one:sss-device-share:one:share",
            AccountStorageScope.key("one", null, "share"),
        )
        assertEquals(
            "sss:learncard:staging:one:sss-pending-share:sss-device-share:one:version",
            AccountStorageScope.key("one", "sss-pending-share:sss-device-share:one", "version"),
        )
    }

}

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class EncryptedVaultTest {
    @Test
    fun aesGcmHidesTheShareAndRejectsAnotherKey() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val preferences = context.getSharedPreferences("vault-test", Context.MODE_PRIVATE)
        val key = javax.crypto.KeyGenerator.getInstance("AES").apply { init(256) }.generateKey()
        val vault = KeystoreVault("service", AesGcmSecretBytes(preferences, key))
        vault.write("synthetic-share-one".toByteArray(), "user-one")
        assertEquals("synthetic-share-one", vault.read("user-one")?.decodeToString())
        val xml = File(context.applicationInfo.dataDir, "shared_prefs/vault-test.xml").readText()
        assertFalse(xml.contains("synthetic-share-one"))
        val other = javax.crypto.KeyGenerator.getInstance("AES").apply { init(256) }.generateKey()
        val impostor = KeystoreVault("service", AesGcmSecretBytes(preferences, other))
        try {
            impostor.read("user-one")
            throw AssertionError("A different key must not read the share")
        } catch (_: Exception) {
            assertEquals(0, context.applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_ALLOW_BACKUP)
        }
    }
}
