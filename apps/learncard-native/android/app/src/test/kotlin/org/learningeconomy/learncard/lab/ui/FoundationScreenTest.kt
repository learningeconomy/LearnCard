package org.learningeconomy.learncard.lab.ui

import android.graphics.Bitmap
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.assertTextEquals
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.unit.LayoutDirection
import kotlinx.coroutines.runBlocking
import java.io.File
import java.io.FileOutputStream
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.learningeconomy.learncard.lab.design.LocalCatalog
import org.learningeconomy.learncard.lab.design.LocalDark
import org.learningeconomy.learncard.lab.design.LocalLanguage
import org.learningeconomy.learncard.lab.design.NativeCatalog
import org.learningeconomy.learncard.lab.home.HomeFixture
import org.learningeconomy.learncard.lab.home.latestCredentials
import org.learningeconomy.learncard.lab.navigation.RootScreen
import org.learningeconomy.learncard.lab.signin.AccountFixture
import org.learningeconomy.learncard.lab.signin.AccountRoot
import org.learningeconomy.learncard.lab.signin.SignInProvider
import org.learningeconomy.learncard.lab.storage.KeystoreVault
import org.learningeconomy.learncard.lab.storage.MemorySecretBytes

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33])
class FoundationScreenTest {
    @get:Rule
    val compose = createComposeRule()

    private val catalog = NativeCatalog.parse(File(requireNotNull(System.getProperty("learncard.catalog"))).readText())

    @Test
    fun googleSignInOpensHomeAndAppleRecoveryStaysOffHome() {
        val ready = controller("oauth-ready")
        show(ready, "en", dark = false) { AccountRoot(ready) }
        compose.onNodeWithTag("sign-in-apple").fetchSemanticsNode()
        compose.onNodeWithTag("sign-in-google").fetchSemanticsNode()
        capture("sign-in-providers")
        compose.onNodeWithTag("sign-in-google").performClick()
        compose.waitForIdle()
        node("page-title-home")
        assertEquals("ready", ready.phase)
    }

    @Test
    fun appleRecoveryReturnsHomeOnlyAfterTheKey() {
        val recovery = controller("oauth-recovery")
        show(recovery, "en", dark = false) { AccountRoot(recovery) }
        compose.onNodeWithTag("sign-in-apple").performClick()
        compose.waitForIdle()
        compose.onNodeWithTag("email-recovery-key").fetchSemanticsNode()
        assertEquals(0, compose.onAllNodesWithTag("page-title-home").fetchSemanticsNodes().size)
        compose.onNodeWithTag("email-recovery-key").performTextInput("synthetic-recovery-key")
        compose.onNodeWithTag("recover-account").performClick()
        compose.waitForIdle()
        compose.onNodeWithTag("page-title-home").fetchSemanticsNode()
    }

    @Test
    fun newAccountShowsBirthdayGateAndCancelKeepsTheTypedEmail() {
        val signup = controller("oauth-signup")
        show(signup, "en", dark = false) { AccountRoot(signup) }
        compose.onNodeWithTag("sign-in-google").performClick()
        compose.waitForIdle()
        compose.onNodeWithTag("signup-birth-date").fetchSemanticsNode()
        compose.onNodeWithTag("signup-continue").assertIsNotEnabled()
        assertEquals(0, compose.onAllNodesWithTag("page-title-home").fetchSemanticsNodes().size)
    }

    @Test
    fun cancelledProviderKeepsTheTypedEmail() {
        val cancel = controller("oauth-cancel")
        show(cancel, "en", dark = false) { AccountRoot(cancel) }
        compose.onNodeWithTag("account-email").performTextInput("typed@example.com")
        compose.onNodeWithTag("sign-in-google").performClick()
        compose.waitForIdle()
        compose.onNodeWithTag("account-email").assertTextEquals("typed@example.com")
        compose.onNodeWithTag("send-sign-in-code").assertIsEnabled()
        assertEquals(0, compose.onAllNodesWithTag("account-error").fetchSemanticsNodes().size)
    }

    @Test
    fun conflictingProviderShowsEmailFallbackAndEmailOnlyHidesProviders() {
        val failure = controller("oauth-failure")
        show(failure, "en", dark = false) { AccountRoot(failure) }
        compose.onNodeWithTag("sign-in-apple").performClick()
        compose.waitForIdle()
        compose.onNodeWithTag("account-error").fetchSemanticsNode()
        compose.onNodeWithTag("send-sign-in-code").assertIsEnabled()
        capture("sign-in-provider-conflict")
    }

    @Test
    fun emailOnlySignInHidesProviders() {
        val emailOnly = controller("sign-in")
        show(emailOnly, "en", dark = false) { AccountRoot(emailOnly) }
        compose.onNodeWithTag("send-sign-in-code").fetchSemanticsNode()
        assertEquals(0, compose.onAllNodesWithTag("sign-in-apple").fetchSemanticsNodes().size)
        assertEquals(0, compose.onAllNodesWithTag("sign-in-google").fetchSemanticsNodes().size)
    }

    @Test
    fun arabicGoogleButtonUsesTheCatalogLabel() {
        val cancel = controller("oauth-cancel")
        cancel.language = "ar"
        show(cancel, "ar", dark = true) { AccountRoot(cancel) }
        compose.onNodeWithTag("sign-in-google").assertTextEquals("المتابعة باستخدام Google")
        capture("sign-in-arabic-dark")
    }

    @Test
    fun homeIsFirstAndOffersOpenInbox() {
        showHome("en", dark = false)
        compose.onNodeWithTag("nav-home").assertIsSelected()
        compose.onNodeWithTag("page-title-home").fetchSemanticsNode()
        val home = compose.onNodeWithTag("nav-home").fetchSemanticsNode().boundsInRoot.left
        val passport = compose.onNodeWithTag("nav-collection").fetchSemanticsNode().boundsInRoot.left
        val inbox = compose.onNodeWithTag("nav-inbox").fetchSemanticsNode().boundsInRoot.left
        val apps = compose.onNodeWithTag("nav-apps").fetchSemanticsNode().boundsInRoot.left
        assertTrue(home < passport && passport < inbox && inbox < apps)
        node("home-summary-offers").assertTextEquals("2 credentials to review")
        compose.onNodeWithTag("home-greeting").assertTextEquals("Good morning")
        compose.onNodeWithTag("credential-design").fetchSemanticsNode()
        capture("home-english")
        compose.onNodeWithTag("home-inbox").performClick()
        compose.onNodeWithTag("offer-first-aid").fetchSemanticsNode()
        compose.onNodeWithTag("nav-home").performClick()
        compose.onNodeWithTag("home-collection").performClick()
        compose.onNodeWithTag("page-title-collection").fetchSemanticsNode()
        compose.onNodeWithTag("nav-home").performClick()
        node("home-create").performScrollTo().performClick()
        compose.waitForIdle()
        node("draft-title").fetchSemanticsNode()
    }

    @Test
    fun homeAppsAndFrenchArabicNavigation() {
        showHome("en", dark = false)
        node("home-app-sample-earth").performScrollTo().performClick()
        compose.waitForIdle()
        node("app-detail-title").assertTextEquals("Earth Explorers")
        compose.onNodeWithTag("nav-home").performClick()
        node("home-apps").performScrollTo().performClick()
        compose.waitForIdle()
        node("page-title-apps").fetchSemanticsNode()
        node("app-sample-earth").fetchSemanticsNode()
    }

    @Test
    fun frenchHomeTitleUsesTheCatalog() {
        showHome("fr", dark = true)
        compose.onNodeWithTag("page-title-home").assertTextEquals("Accueil")
        capture("home-french-dark")
    }

    @Test
    fun arabicTabsReadRightToLeft() {
        showHome("ar", dark = true)
        val home = compose.onNodeWithTag("nav-home").fetchSemanticsNode().boundsInRoot.left
        val passport = compose.onNodeWithTag("nav-collection").fetchSemanticsNode().boundsInRoot.left
        assertTrue(home > passport)
        assertTrue(compose.onNodeWithTag("nav-home").fetchSemanticsNode().boundsInRoot.height >= 44f)
        capture("home-arabic-dark")
    }

    @Test
    fun latestStackKeepsTheDemoOrderAndStepsOlder() {
        val recent = latestCredentials(HomeFixture.demo().credentials)
        assertEquals(listOf("design", "community", "member"), recent.map { it.id })
        showHome("en", dark = false)
        node("stack-position").assertTextEquals("1 / 3")
        node("stack-older").performScrollTo().performClick()
        compose.waitForIdle()
        node("stack-position").assertTextEquals("2 / 3")
        compose.onNodeWithTag("credential-community").fetchSemanticsNode()
    }

    @Test
    fun readyFixtureSurvivesANewControllerOnTheSameVault() {
        val vault = KeystoreVault("relaunch", MemorySecretBytes())
        val first = AccountFixture.controller("oauth-ready", vault, catalog)
        runBlocking { first.signIn(SignInProvider.Google) }
        assertEquals("ready", first.phase)
        val second = AccountFixture.controller("oauth-ready", vault, catalog, reset = false)
        runBlocking { second.resume() }
        assertEquals("ready", second.phase)
        assertEquals("Fixture Person", second.profileName)
    }

    private fun controller(scenario: String) =
        AccountFixture.controller(scenario, KeystoreVault(scenario + System.nanoTime(), MemorySecretBytes()), catalog)

    private fun show(account: org.learningeconomy.learncard.lab.signin.AccountController, language: String, dark: Boolean, content: @Composable () -> Unit) {
        account.language = language
        compose.setContent {
            CompositionLocalProvider(
                LocalCatalog provides catalog,
                LocalLanguage provides language,
                LocalDark provides dark,
                LocalLayoutDirection provides if (language == "ar") LayoutDirection.Rtl else LayoutDirection.Ltr,
            ) { content() }
        }
    }

    private fun showHome(language: String, dark: Boolean) {
        compose.setContent {
            CompositionLocalProvider(
                LocalCatalog provides catalog,
                LocalLanguage provides language,
                LocalDark provides dark,
                LocalLayoutDirection provides if (language == "ar") LayoutDirection.Rtl else LayoutDirection.Ltr,
            ) {
                RootScreen(HomeFixture.demo(hour = 9))
            }
        }
    }

    private fun node(tag: String) = compose.onNodeWithTag(tag, useUnmergedTree = true)

    private fun capture(name: String) {
        val directory = File(System.getProperty("learncard.screenshots") ?: return)
        directory.mkdirs()
        try {
            val image = compose.onRoot().captureToImage()
            val bitmap = image.asAndroidBitmap()
            FileOutputStream(File(directory, "$name.png")).use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        } catch (_: Throwable) {
            File(directory, "$name.txt").writeText("screenshot capture unavailable")
        }
    }
}
