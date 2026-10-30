package org.learningeconomy.learncard.lab.signin

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import org.learningeconomy.learncard.lab.design.BrandProgress
import org.learningeconomy.learncard.lab.design.PageHeading
import org.learningeconomy.learncard.lab.design.Palette
import org.learningeconomy.learncard.lab.design.PrimaryButton
import org.learningeconomy.learncard.lab.design.catalogText

@Composable
fun AccountSignInScreen(account: AccountController) {
    val scope = rememberCoroutineScope()
    val signingIn = account.phase == "signIn" || account.phase == "idle"
    val recovering = account.phase == "needs_recovery" || account.phase == "recovery"
    Column(
        Modifier
            .fillMaxSize()
            .background(Palette.paper())
            .testTag("account-access-form"),
    ) {
        Column(
            Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            Text("LearnCard", color = Palette.ink(), fontWeight = FontWeight.Bold, fontSize = 20.sp, modifier = Modifier.testTag("learncard-brand-full"))
            val title = when {
                signingIn -> catalogText("access.welcome")
                account.phase == "code" -> catalogText("access.checkEmail")
                recovering -> catalogText("access.restore")
                else -> catalogText("access.setup")
            }
            PageHeading(title, identifier = "account-access")
            if (signingIn) Text(catalogText("access.welcome.detail"), color = Palette.secondary(), fontSize = 16.sp)
            account.error?.let { message ->
                Text(
                    message,
                    color = Palette.errorInk,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color(0xFFFFF1F2))
                        .padding(14.dp)
                        .testTag("account-error"),
                )
            }
            when {
                account.busy && account.phase == "provider" -> BrandProgress(catalogText("oauth.loading"))
                account.phase == "needs_setup" -> SignupBirthGate(account)
                signingIn -> {
                    if (account.providers.isNotEmpty()) NativeSignInButtons(account)
                    EmailPanel(account)
                }
                account.phase == "code" -> CodePanel(account)
                recovering -> RecoveryPanel(account)
            }
            Row(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(22.dp))
                    .background(Palette.surface())
                    .clickable { }
                    .testTag("signed-out-scan")
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    Modifier
                        .height(44.dp)
                        .clip(RoundedCornerShape(13.dp))
                        .background(Palette.blueCard)
                        .padding(horizontal = 14.dp),
                    contentAlignment = Alignment.Center,
                ) { Text("QR", color = Palette.cardInk, fontWeight = FontWeight.Bold) }
                Text(catalogText("claims.title"), modifier = Modifier.padding(start = 14.dp), color = Palette.ink(), fontWeight = FontWeight.SemiBold)
            }
        }
        if (signingIn || account.phase == "code" || recovering) {
            Column(Modifier.background(Palette.surface()).padding(20.dp)) {
                if (signingIn) {
                    PrimaryButton(
                        title = catalogText("access.sendCode"),
                        tag = "send-sign-in-code",
                        enabled = normalizedEmail(account.email) != null && !account.busy,
                    ) { scope.launch { account.sendCode() } }
                } else if (account.phase == "code") {
                    PrimaryButton(
                        title = catalogText("access.signIn"),
                        tag = "verify-sign-in-code",
                        enabled = account.code.length == 6 && !account.busy,
                    ) { scope.launch { account.verify(account.code) } }
                } else {
                    PrimaryButton(
                        title = catalogText("access.recover"),
                        tag = "recover-account",
                        enabled = !account.busy,
                    ) { scope.launch { account.recover(account.email) } }
                }
            }
        }
    }
}

@Composable
private fun NativeSignInButtons(account: AccountController) {
    val scope = rememberCoroutineScope()
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (SignInProvider.Apple in account.providers) {
            Box(
                Modifier
                    .fillMaxWidth()
                    .heightIn(min = 54.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color.Black)
                    .clickable(enabled = !account.busy) { scope.launch { account.signIn(SignInProvider.Apple) } }
                    .testTag("sign-in-apple"),
                contentAlignment = Alignment.Center,
            ) {
                Text(catalogText("oauth.apple").let { if (it == "oauth.apple") "Continue with Apple" else it }, color = Color.White, fontWeight = FontWeight.SemiBold)
            }
        }
        if (SignInProvider.Google in account.providers) {
            Box(
                Modifier
                    .fillMaxWidth()
                    .heightIn(min = 54.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color.White)
                    .border(1.dp, Palette.line(), RoundedCornerShape(16.dp))
                    .clickable(enabled = !account.busy) { scope.launch { account.signIn(SignInProvider.Google) } }
                    .testTag("sign-in-google"),
                contentAlignment = Alignment.Center,
            ) {
                Text(catalogText("oauth.google"), color = Color(0xFF1F1F1F), fontWeight = FontWeight.SemiBold)
            }
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.weight(1f).height(1.dp).background(Palette.line()))
            Text(catalogText("oauth.orEmail"), modifier = Modifier.padding(horizontal = 12.dp), color = Palette.secondary(), fontSize = 14.sp)
            Box(Modifier.weight(1f).height(1.dp).background(Palette.line()))
        }
    }
}

@Composable
private fun EmailPanel(account: AccountController) {
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(Palette.surface())
            .padding(20.dp),
    ) {
        Text(catalogText("access.email"), color = Palette.ink(), fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
        Spacer(Modifier.height(8.dp))
        BasicTextField(
            value = account.email,
            onValueChange = { account.email = it },
            textStyle = TextStyle(color = Palette.ink(), fontSize = 16.sp, fontWeight = FontWeight.Medium),
            cursorBrush = SolidColor(Palette.ink()),
            modifier = Modifier
                .fillMaxWidth()
                .testTag("account-email"),
            decorationBox = { inner ->
                if (account.email.isEmpty()) Text(catalogText("signup.emailPlaceholder"), color = Color(0xFFA8ACBD))
                inner()
            },
        )
    }
}

@Composable
private fun CodePanel(account: AccountController) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(catalogText("access.codeSent"), color = Palette.secondary())
        BasicTextField(
            value = account.code,
            onValueChange = { account.code = it.filter { character -> character.isDigit() }.take(6) },
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 48.dp)
                .testTag("sign-in-code"),
            textStyle = TextStyle(color = Palette.ink(), fontSize = 24.sp),
        )
    }
}

@Composable
private fun RecoveryPanel(account: AccountController) {
    var share = androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf("") }
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(Palette.surface())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(catalogText("access.emailKey"), color = Palette.ink(), fontWeight = FontWeight.SemiBold)
        BasicTextField(
            value = share.value,
            onValueChange = {
                share.value = it
                account.email = it
            },
            visualTransformation = PasswordVisualTransformation(),
            textStyle = TextStyle(color = Palette.ink(), fontSize = 16.sp),
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 48.dp)
                .testTag("email-recovery-key"),
        )
    }
}

@Composable
private fun SignupBirthGate(account: AccountController) {
    val scope = rememberCoroutineScope()
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Box(
            Modifier
                .fillMaxWidth()
                .heightIn(min = 54.dp)
                .clip(RoundedCornerShape(20.dp))
                .background(Palette.surface())
                .clickable { account.chooseBirthdate() }
                .testTag("signup-birth-date")
                .padding(16.dp),
        ) { Text(catalogText("signup.birthDate"), color = Palette.ink(), fontWeight = FontWeight.SemiBold) }
        PrimaryButton(
            title = catalogText("signup.continue"),
            tag = "signup-continue",
            enabled = account.birthdateChosen,
        ) { scope.launch { } }
    }
}
