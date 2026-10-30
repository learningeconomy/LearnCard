package org.learningeconomy.learncard.lab.storage

import android.content.Context
import android.content.SharedPreferences
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import org.learningeconomy.learncard.lab.bridge.AccountBridgeException

interface SecretBytes {
    fun read(key: String): ByteArray?
    fun write(key: String, value: ByteArray)
    fun remove(key: String)
}

/**
 * Device-bound account storage. Slots match the iOS Keychain account names so the
 * bundled runtime can forget one person without touching another.
 */
class KeystoreVault(
    private val service: String,
    private val store: SecretBytes,
) {
    fun read(key: String): ByteArray? = store.read(scoped(key))

    fun write(data: ByteArray, key: String) {
        store.write(scoped(key), data)
    }

    fun remove(key: String) {
        store.remove(scoped(key))
    }

    fun forgetAccount(userId: String) {
        remove(SignupStorage.key(userId))
        for (id in listOf("sss-device-share:$userId", "sss-pending-share:sss-device-share:$userId")) {
            for (field in listOf("share", "version")) {
                remove(AccountStorageScope.key(userId, id, field))
            }
        }
    }

    private fun scoped(key: String): String = "$service\u0000$key"

    companion object {
        const val DEFAULT_SERVICE = "org.learningeconomy.learncard.native.experiment.staging"

        fun encrypted(context: Context, service: String = DEFAULT_SERVICE): KeystoreVault {
            val digest = MessageDigest.getInstance("SHA-256").digest(service.toByteArray())
            val name = "lc-vault-" + digest.take(8).joinToString("") { "%02x".format(it) }
            val preferences = context.getSharedPreferences(name, Context.MODE_PRIVATE)
            return KeystoreVault(service, AesGcmSecretBytes(preferences, keystoreKey(name)))
        }

        private fun keystoreKey(alias: String): SecretKey {
            val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
            (keyStore.getKey(alias, null) as? SecretKey)?.let { return it }
            val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
            val spec = KeyGenParameterSpec.Builder(
                alias,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .setRandomizedEncryptionRequired(true)
                .build()
            generator.init(spec)
            return generator.generateKey()
        }
    }
}

/** AES-GCM values. The device key lives in Android Keystore and is not exportable. */
class AesGcmSecretBytes(
    private val preferences: SharedPreferences,
    private val key: SecretKey,
) : SecretBytes {
    override fun read(key: String): ByteArray? {
        val encoded = preferences.getString(key, null) ?: return null
        return try {
            val payload = Base64.decode(encoded, Base64.DEFAULT)
            if (payload.size <= 12) throw AccountBridgeException("Couldn't save access on this device. Please try again.")
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, this.key, GCMParameterSpec(128, payload.copyOfRange(0, 12)))
            cipher.doFinal(payload.copyOfRange(12, payload.size))
        } catch (error: AccountBridgeException) {
            throw error
        } catch (_: Exception) {
            throw AccountBridgeException("Couldn't save access on this device. Please try again.")
        }
    }

    override fun write(key: String, value: ByteArray) {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, this.key, SecureRandom())
        val payload = cipher.iv + cipher.doFinal(value)
        preferences.edit().putString(key, Base64.encodeToString(payload, Base64.NO_WRAP)).commit()
    }

    override fun remove(key: String) {
        preferences.edit().remove(key).commit()
    }
}

object SignupStorage {
    fun key(userId: String): String = "signup:learncard:staging:$userId"
}

object StagingResetStorage {
    fun key(userId: String): String = "reset:learncard:staging:$userId"
}

object AccountStorageScope {
    fun key(userId: String, id: String?, field: String): String {
        if (userId.isEmpty() || field !in setOf("share", "version")) {
            throw AccountBridgeException("Identity mismatch")
        }
        val base = "sss-device-share:$userId"
        val value = id ?: base
        if (value != base && value != "sss-pending-share:$base") {
            throw AccountBridgeException("Identity mismatch")
        }
        return "sss:learncard:staging:$userId:$value:$field"
    }
}

class MemorySecretBytes : SecretBytes {
    private val values = linkedMapOf<String, ByteArray>()

    override fun read(key: String): ByteArray? = values[key]?.copyOf()

    override fun write(key: String, value: ByteArray) {
        values[key] = value.copyOf()
    }

    override fun remove(key: String) {
        values.remove(key)
    }
}

