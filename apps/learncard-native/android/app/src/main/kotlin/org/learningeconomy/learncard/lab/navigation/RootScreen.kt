package org.learningeconomy.learncard.lab.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import org.learningeconomy.learncard.lab.design.NativeLayout
import org.learningeconomy.learncard.lab.design.PageHeading
import org.learningeconomy.learncard.lab.design.Palette
import org.learningeconomy.learncard.lab.design.catalogLiteral
import org.learningeconomy.learncard.lab.design.catalogText
import org.learningeconomy.learncard.lab.home.HomeApp
import org.learningeconomy.learncard.lab.home.HomeModel
import org.learningeconomy.learncard.lab.home.HomeScreen

private val tabOrder = listOf(3, 0, 1, 2)
private val tabNames = listOf("Passport", "Inbox", "Apps", "Home")
private val tabIds = listOf("collection", "inbox", "apps", "home")

@Composable
fun RootScreen(model: HomeModel) {
    var tab by rememberSaveable { mutableIntStateOf(3) }
    var detail by rememberSaveable { mutableStateOf<String?>(null) }
    var creating by rememberSaveable { mutableStateOf(false) }
    Column(Modifier.fillMaxSize().background(Palette.paper())) {
        Column(
            Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(NativeLayout.pageInset),
        ) {
            when {
                detail != null -> Text(
                    detail!!,
                    color = Palette.ink(),
                    fontWeight = FontWeight.Bold,
                    fontSize = 28.sp,
                    modifier = Modifier.testTag("app-detail-title"),
                )
                tab == 3 -> HomeScreen(
                    model = model,
                    openInbox = { tab = 1 },
                    openPassport = { tab = 0 },
                    openApps = { tab = 2 },
                    openCreate = { creating = true },
                    openApp = { detail = it.title },
                )
                tab == 0 -> PageHeading(catalogLiteral("Passport"), identifier = "collection", accent = Palette.flairBlue)
                tab == 1 -> InboxPage(model)
                else -> AppsPage(model)
            }
        }
        NativeTabTray(selection = tab, inboxCount = model.offers.size, onSelect = { tab = it; detail = null })
    }
    if (creating) {
        Dialog(onDismissRequest = { creating = false }) {
            Column(
                Modifier
                    .clip(RoundedCornerShape(24.dp))
                    .background(Palette.surface())
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text(catalogText("home.create"), color = Palette.ink(), fontWeight = FontWeight.Bold)
                TextField(value = "", onValueChange = {}, modifier = Modifier.fillMaxWidth().testTag("draft-title"))
            }
        }
    }
}

@Composable
private fun InboxPage(model: HomeModel) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        PageHeading(catalogLiteral("Inbox"), identifier = "inbox", accent = Palette.flairPink)
        model.offers.forEach { offer ->
            Text(
                offer.title,
                color = Palette.ink(),
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(Palette.surface())
                    .clickable { }
                    .testTag("offer-${offer.id}")
                    .padding(16.dp),
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}

@Composable
private fun AppsPage(model: HomeModel) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        PageHeading(catalogText("apps.title"), identifier = "apps", accent = Palette.flairTeal)
        model.apps.forEach { app ->
            AppRow(app)
        }
    }
}

@Composable
private fun AppRow(app: HomeApp) {
    Text(
        app.title,
        color = Palette.ink(),
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(Palette.surface())
            .testTag("app-${app.id}")
            .padding(16.dp),
        fontWeight = FontWeight.SemiBold,
    )
}

@Composable
fun NativeTabTray(selection: Int, inboxCount: Int, onSelect: (Int) -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .background(Palette.surface())
            .testTag("bottom-navigation")
            .padding(horizontal = 8.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        tabOrder.forEach { tab ->
            val selected = selection == tab
            Column(
                Modifier
                    .weight(1f)
                    .heightIn(min = 56.dp)
                    .clickable { onSelect(tab) }
                    .testTag("nav-${tabIds[tab]}")
                    .semantics { this.selected = selected }
                    .padding(vertical = 4.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(
                    Modifier
                        .size(28.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (selected) Palette.selection() else Palette.line()),
                )
                Text(
                    if (tab == 1) catalogText("nav.inbox.short") else catalogLiteral(tabNames[tab]),
                    color = if (selected) Palette.selection() else Palette.secondary(),
                    fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium,
                    fontSize = 13.sp,
                )
                if (tab == 1 && inboxCount > 0) {
                    Text(inboxCount.toString(), color = Palette.secondary(), fontSize = 11.sp)
                }
            }
        }
    }
}
