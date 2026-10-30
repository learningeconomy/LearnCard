package org.learningeconomy.learncard.lab.signin

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import org.learningeconomy.learncard.lab.design.NativeCatalog
import org.learningeconomy.learncard.lab.storage.KeystoreVault

enum class SignInProvider { Apple, Google }

class SignInCancelled : Exception()
class SignInDifferentMethod : Exception()

class AccountController(
    private val session: FixtureSession,
    private val signInClient: FixtureSignInClient?,
    private val host: FixtureHost,
    private val catalog: NativeCatalog,
    initialEmail: String,
) {
    var phase by mutableStateOf("signIn")
    var email by mutableStateOf(initialEmail)
    var error by mutableStateOf<String?>(null)
    var busy by mutableStateOf(false)
    var profileName by mutableStateOf<String?>(null)
    var code by mutableStateOf("")
    var birthdateChosen by mutableStateOf(false)
    var language: String = "en"

    val providers: List<SignInProvider> = signInClient?.providers.orEmpty()

    suspend fun resume() {
        if (session.resume() == null) {
            phase = "signIn"
            return
        }
        apply(host.initialize())
    }

    suspend fun signIn(provider: SignInProvider) {
        val client = signInClient ?: return
        error = null
        busy = true
        phase = "provider"
        try {
            client.signIn(provider)
            session.signIn(remember = session.scenario == "oauth-ready")
            apply(host.initialize())
        } catch (_: SignInCancelled) {
            phase = "signIn"
            error = null
        } catch (_: SignInDifferentMethod) {
            phase = "signIn"
            error = catalog.text("oauth.differentMethod", language)
        } finally {
            busy = false
        }
    }

    suspend fun sendCode() {
        if (normalizedEmail(email) == null) return
        session.sendCode()
        phase = "code"
        error = null
    }

    suspend fun verify(code: String) {
        try {
            session.verify(code)
            apply(host.initialize())
        } catch (_: IllegalArgumentException) {
            error = "The code is incorrect or expired. Try again or request a new code."
            phase = "code"
        }
    }

    suspend fun recover(emailShare: String) {
        busy = true
        try {
            apply(host.recover(emailShare))
            error = null
        } catch (_: IllegalArgumentException) {
            error = "This recovery information doesn't match the account. Try another method."
            phase = "needs_recovery"
        } finally {
            busy = false
        }
    }

    fun chooseBirthdate() {
        birthdateChosen = true
        host.birthdateChosen = true
    }

    private fun apply(next: String) {
        phase = next
        if (next == "ready") profileName = host.profileName
    }
}

class FixtureSession(
    val scenario: String,
    private val vault: KeystoreVault,
    private var reset: Boolean,
) {
    fun resume(): String? {
        if (reset) {
            reset = false
            vault.remove("fixture-auth")
            vault.remove("fixture-remembered")
            if (scenario != "sign-in" && !scenario.startsWith("oauth-")) {
                vault.write("synthetic".toByteArray(), "fixture-auth")
            }
            if (scenario == "ready") vault.write("synthetic".toByteArray(), "fixture-remembered")
        }
        return if (vault.read("fixture-auth") == null) null else "fixture-user"
    }

    fun sendCode() = Unit

    fun verify(code: String) {
        if (code != "123456") throw IllegalArgumentException("sign-in")
        vault.write("synthetic".toByteArray(), "fixture-auth")
    }

    fun signIn(remember: Boolean) {
        vault.write("synthetic".toByteArray(), "fixture-auth")
        if (remember) vault.write("synthetic".toByteArray(), "fixture-remembered")
    }
}

class FixtureSignInClient(private val scenario: String) {
    val providers = listOf(SignInProvider.Apple, SignInProvider.Google)

    suspend fun signIn(provider: SignInProvider) {
        when (scenario) {
            "oauth-cancel" -> throw SignInCancelled()
            "oauth-failure" -> throw SignInDifferentMethod()
            else -> Unit
        }
        if (provider == SignInProvider.Apple || provider == SignInProvider.Google) return
    }
}

class FixtureHost(private val scenario: String, private val vault: KeystoreVault) {
    var birthdateChosen: Boolean = false
    val profileName: String = "Fixture Person"

    fun initialize(): String {
        if (scenario == "oauth-signup" || scenario == "signup") {
            return if (birthdateChosen) "finish_setup" else "needs_setup"
        }
        if (vault.read("fixture-remembered") == null) return "needs_recovery"
        return "ready"
    }

    fun recover(emailShare: String): String {
        if (emailShare != "synthetic-recovery-key") throw IllegalArgumentException("identity")
        vault.write("synthetic".toByteArray(), "fixture-remembered")
        return initialize()
    }
}

fun normalizedEmail(value: String): String? {
    val email = value.trim().lowercase()
    if (email.toByteArray().size > 254) return null
    if (!EMAIL.matches(email)) return null
    return email
}

private val EMAIL = Regex(
    """^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+$""",
    RegexOption.IGNORE_CASE,
)

object AccountFixture {
    const val TEST_EMAIL = "native-test@example.invalid"

    fun controller(
        scenario: String,
        vault: KeystoreVault,
        catalog: NativeCatalog,
        reset: Boolean = true,
    ): AccountController {
        val client = if (scenario.startsWith("oauth-")) FixtureSignInClient(scenario) else null
        val hostScenario = if (scenario == "oauth-signup") "signup" else scenario
        return AccountController(
            session = FixtureSession(scenario, vault, reset),
            signInClient = client,
            host = FixtureHost(hostScenario, vault),
            catalog = catalog,
            initialEmail = if (scenario == "oauth-cancel") "" else TEST_EMAIL,
        )
    }
}
