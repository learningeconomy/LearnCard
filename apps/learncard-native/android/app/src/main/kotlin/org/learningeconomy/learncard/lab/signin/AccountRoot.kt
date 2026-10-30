package org.learningeconomy.learncard.lab.signin

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import java.util.Calendar
import org.learningeconomy.learncard.lab.home.HomeFixture
import org.learningeconomy.learncard.lab.navigation.RootScreen

@Composable
fun AccountRoot(account: AccountController, modifier: Modifier = Modifier) {
    LaunchedEffect(account) { account.resume() }
    Box(modifier.fillMaxSize()) {
        if (account.phase == "ready") {
            RootScreen(HomeFixture.demo(profileName = account.profileName, hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)))
        } else {
            AccountSignInScreen(account)
        }
    }
}
