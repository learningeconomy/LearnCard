package org.learningeconomy.learncard.lab

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import java.util.Calendar
import org.learningeconomy.learncard.lab.design.LocalCatalog
import org.learningeconomy.learncard.lab.design.LocalDark
import org.learningeconomy.learncard.lab.design.LocalLanguage
import org.learningeconomy.learncard.lab.design.NativeCatalog
import org.learningeconomy.learncard.lab.home.HomeFixture
import org.learningeconomy.learncard.lab.navigation.RootScreen
import org.learningeconomy.learncard.lab.signin.AccountFixture
import org.learningeconomy.learncard.lab.signin.AccountRoot
import org.learningeconomy.learncard.lab.storage.KeystoreVault

class LearnCardActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val demo = intent?.getBooleanExtra("demo", false) ?: false
        val scenario = intent?.getStringExtra("accountFixture")
        val language = intent?.getStringExtra("language") ?: "en"
        val dark = intent?.getBooleanExtra("dark", false) ?: false
        val catalog = NativeCatalog.parse(assets.open("Localizable.xcstrings").bufferedReader().readText())
        setContent {
            CompositionLocalProvider(
                LocalCatalog provides catalog,
                LocalLanguage provides language,
                LocalDark provides dark,
                LocalLayoutDirection provides if (language == "ar") LayoutDirection.Rtl else LayoutDirection.Ltr,
            ) {
                if (demo) {
                    RootScreen(HomeFixture.demo(hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)))
                } else {
                    val controller = remember(scenario) {
                        AccountFixture.controller(
                            scenario ?: "sign-in",
                            KeystoreVault.encrypted(this@LearnCardActivity),
                            catalog,
                        ).also { it.language = language }
                    }
                    AccountRoot(controller, Modifier.fillMaxSize())
                }
            }
        }
    }
}
