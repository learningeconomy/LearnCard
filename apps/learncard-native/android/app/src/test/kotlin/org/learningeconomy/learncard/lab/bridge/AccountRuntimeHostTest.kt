package org.learningeconomy.learncard.lab.bridge

import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.learningeconomy.learncard.lab.storage.KeystoreVault
import org.learningeconomy.learncard.lab.storage.MemorySecretBytes

class AccountRuntimeHostTest {
    @Test
    fun signedOutCommandsMatchTheRuntimeContract() {
        val cases = listOf(
            "initialize" to "connection",
            "recover" to "recovery",
            "snapshot" to "unavailable",
            "credentialStatus" to "unavailable",
            "more" to "unavailable",
            "claim" to "unavailable",
            "create" to "unavailable",
            "createDraft" to "unavailable",
            "creations" to "unavailable",
            "send" to "unavailable",
            "recipient" to "unavailable",
            "share" to "unavailable",
            "updateProfile" to "unavailable",
            "signOut" to "unavailable",
            "forget" to "unavailable",
        )
        val host = signedOutHost()
        try {
            for ((method, error) in cases) {
                val reply = host.call(method)
                assertFalse(method, reply.ok)
                assertEquals(method, error, reply.error)
            }
            val search = host.call("searchRecipients", """{"query":"someone"}""")
            assertTrue(search.ok)
            assertEquals(emptyList<Any>(), search.value)
            for (method in listOf("unknown", "constructor", "toString", "__proto__")) {
                val thrown = runCatching { host.call(method) }.exceptionOrNull()
                assertTrue(method, thrown is QuickJsException && thrown.message?.contains("Command refused") == true)
            }
            for (method in listOf("resetStart", "resetResume", "resetStatus")) {
                assertEquals(method, AccountCommandReply(false, "reset:unavailable", null), host.call(method))
            }
            assertEquals(0, host.nativeCalls)
        } finally {
            host.close()
        }
    }

    @Test
    fun featureCommandsStayRegisteredWhenSignedOut() {
        val host = signedOutHost()
        try {
            for (method in listOf(
                "appsBrowse", "appsInstalled", "appsInstall", "appsRemove", "appsReview", "appsConsent",
                "appsLaunch", "appsIdentity", "appsEvent", "privacySnapshot", "privacyWithdraw",
                "privacyStopLink", "privacyLinkURL",
            )) {
                val reply = host.call(method)
                assertFalse(reply.ok)
                assertTrue(reply.error in setOf("consumer:signIn", "consumer:connection"))
            }
            for (method in listOf("familiesList", "familiesDetail", "familiesPinStatus", "familiesCreate", "familiesEdit", "familiesInvite")) {
                val reply = host.call(method)
                assertFalse(reply.ok)
                assertTrue(reply.error in setOf("family:unavailable", "family:decision"))
            }
            for (method in listOf("inboxList", "inboxAction")) {
                val reply = host.call(method)
                assertFalse(reply.ok)
                assertTrue(reply.error in setOf("inbox:signIn", "inbox:connection"))
            }
            for (method in listOf("claimsPreview", "claimsIssue", "claimsFinish", "claimsReconcile")) {
                val reply = host.call(method)
                assertFalse(reply.ok)
                assertTrue(reply.error!!.startsWith("claims:"))
            }
            for (method in listOf("signupPrepare", "signupAvailability", "signupBackup", "signupConfirmBackup", "signupComplete", "signupApproval", "signupStatus")) {
                val reply = host.call(method)
                assertFalse(reply.ok)
                assertTrue(reply.error!!.startsWith("signup:"))
            }
            for (method in listOf("peopleList", "peopleProfile", "peopleAction")) {
                val input = when (method) {
                    "peopleList" -> """{"scope":"connections"}"""
                    "peopleProfile" -> """{"id":"alex"}"""
                    else -> """{"id":"alex","action":"connect"}"""
                }
                assertEquals(AccountCommandReply(false, "people:signIn", null), host.call(method, input))
            }
            for (method in listOf("intakeStatus", "intakePrepare", "intakeCommit", "intakeDocument", "intakeDiscard")) {
                assertEquals(AccountCommandReply(false, "intake:signIn", null), host.call(method))
            }
            for (method in listOf("skillsPage", "skillsSource", "goalsRead", "goalsSave")) {
                assertEquals(AccountCommandReply(false, "learner:signIn", null), host.call(method))
            }
            for (method in listOf("careerAccess", "careerSearch", "careerPrograms")) {
                assertEquals(AccountCommandReply(false, "career:signIn", null), host.call(method))
            }
            assertEquals(0, host.nativeCalls)
        } finally {
            host.close()
        }
    }

    @Test
    fun shareSlotRoundTripsThroughTheNativeMessageContract() {
        val vault = KeystoreVault("bridge-round-trip", MemorySecretBytes())
        val bridge = AccountNativeBridge("fixture-user", vault)
        val engine = QuickJsEngine()
        val host = AccountRuntimeHost(engine, bridge)
        try {
            host.start("globalThis.LearnCardAccount = { call: function(){ return 'unused'; } };", prelude())
            engine.evaluate(
                """
                globalThis.__lcStatus = '';
                globalThis.__lcResult = '';
                webkit.messageHandlers.accountNative.postMessage({op:'set', field:'share', value:'synthetic-share-one'}).then(function() {
                    return webkit.messageHandlers.accountNative.postMessage({op:'get', field:'share'});
                }).then(function(value) {
                    globalThis.__lcStatus = 'ok';
                    globalThis.__lcResult = value;
                }, function(error) {
                    globalThis.__lcStatus = 'throw';
                    globalThis.__lcResult = String(error && error.message ? error.message : error);
                });
                """.trimIndent(),
                "round-trip.js",
            )
            assertEquals("ok", engine.evaluate("globalThis.__lcStatus"))
            assertEquals("synthetic-share-one", engine.evaluate("globalThis.__lcResult"))
            assertEquals("synthetic-share-one", vault.read("sss:learncard:staging:fixture-user:sss-device-share:fixture-user:share")?.decodeToString())
            assertEquals(2, bridge.calls)
        } finally {
            host.close()
        }
    }

    private fun signedOutHost(): AccountRuntimeHost {
        val host = AccountRuntimeHost(
            QuickJsEngine(),
            AccountNativeBridge("fixture-user", KeystoreVault("signed-out", MemorySecretBytes())),
        )
        host.start(File(System.getProperty("learncard.account.bundle")).readText(), prelude())
        return host
    }

    private fun prelude(): String = File(System.getProperty("learncard.prelude")).readText()
}
