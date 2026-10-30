package org.learningeconomy.learncard.lab.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.learningeconomy.learncard.lab.design.CredentialCategory
import org.learningeconomy.learncard.lab.design.NativeLayout
import org.learningeconomy.learncard.lab.design.PageHeading
import org.learningeconomy.learncard.lab.design.Palette
import org.learningeconomy.learncard.lab.design.SettingsRow
import org.learningeconomy.learncard.lab.design.catalogCount
import org.learningeconomy.learncard.lab.design.catalogLiteral
import org.learningeconomy.learncard.lab.design.catalogText
import org.learningeconomy.learncard.lab.design.greetingKey

data class HomeCredential(
    val id: String,
    val title: String,
    val issuer: String,
    val category: CredentialCategory,
    val date: Long,
)

data class HomeApp(
    val id: String,
    val title: String,
    val tagline: String,
)

data class HomeModel(
    val profileName: String?,
    val credentials: List<HomeCredential>,
    val offers: List<HomeCredential>,
    val apps: List<HomeApp>,
    val hour: Int,
)

fun latestCredentials(records: List<HomeCredential>): List<HomeCredential> {
    val indexed = records.withIndex().filter { it.value.category != CredentialCategory.Family }
    return indexed
        .sortedWith(compareByDescending<IndexedValue<HomeCredential>> { it.value.date }.thenBy { it.index })
        .map { it.value }
        .distinctBy { it.id }
        .take(5)
}

object HomeFixture {
    private const val SAMPLE_DATE = 1_791_763_200_000L

    fun demo(profileName: String? = null, hour: Int = 9): HomeModel = HomeModel(
        profileName = profileName,
        credentials = listOf(
            HomeCredential("design", "Design for people", "Open Learning Studio", CredentialCategory.Portfolio, SAMPLE_DATE),
            HomeCredential("community", "Community builder", "Neighborhood Collective", CredentialCategory.Achievement, SAMPLE_DATE),
            HomeCredential("member", "A place to belong", "Learning Circle", CredentialCategory.Id, SAMPLE_DATE),
        ),
        offers = listOf(
            HomeCredential("first-aid", "Ready to help", "Community Skills Lab", CredentialCategory.Badge, SAMPLE_DATE),
            HomeCredential("mentor", "Made a difference", "Learning Circle", CredentialCategory.Achievement, SAMPLE_DATE),
        ),
        apps = listOf(HomeApp("sample-earth", "Earth Explorers", "Small steps. A brighter tomorrow.")),
        hour = hour,
    )
}

@Composable
fun HomeGreeting(name: String?, hour: Int) {
    val catalog = org.learningeconomy.learncard.lab.design.LocalCatalog.current
    val language = org.learningeconomy.learncard.lab.design.LocalLanguage.current
    val key = "home.time.${greetingKey(hour)}"
    val trimmed = name?.trim().orEmpty()
    val label = if (catalog == null) key
    else if (trimmed.isEmpty()) catalog.text(key, language)
    else catalog.format("$key.name", language, "\u2068$trimmed\u2069")
    Text(label, color = Palette.secondary(), fontSize = 20.sp, modifier = Modifier.testTag("home-greeting"))
}

@Composable
fun HomeScreen(
    model: HomeModel,
    openInbox: () -> Unit,
    openPassport: () -> Unit,
    openApps: () -> Unit,
    openCreate: () -> Unit,
    openApp: (HomeApp) -> Unit,
) {
    val recent = latestCredentials(model.credentials)
    Column(verticalArrangement = Arrangement.spacedBy(NativeLayout.sectionGap)) {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            PageHeading(catalogLiteral("Home"), identifier = "home", accent = Palette.flairYellow)
            HomeGreeting(model.profileName, model.hour)
        }
        if (model.offers.isNotEmpty()) {
            Column(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(NativeLayout.surfaceRadius))
                    .background(Palette.surface())
                    .clickable(onClick = openInbox)
                    .testTag("home-inbox")
                    .padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(catalogText("learner.incoming"), color = Palette.ink(), fontWeight = FontWeight.Bold, fontSize = 22.sp)
                Text(
                    catalogCount("home.offers", model.offers.size),
                    color = Palette.secondary(),
                    modifier = Modifier.testTag("home-summary-offers"),
                )
                Text(
                    catalogText("home.reviewInbox"),
                    color = Palette.selectionInk(),
                    modifier = Modifier
                        .clip(RoundedCornerShape(14.dp))
                        .background(Palette.selection())
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
        if (recent.isNotEmpty()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(catalogText("learner.recent"), color = Palette.ink(), fontWeight = FontWeight.Bold, fontSize = 22.sp, modifier = Modifier.weight(1f))
                Text(
                    catalogText("sharePicker.all"),
                    color = Palette.ink(),
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier
                        .clickable(onClick = openPassport)
                        .testTag("home-collection")
                        .padding(8.dp),
                )
            }
            LatestCredentialStack(recent)
        }
        Column(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(NativeLayout.surfaceRadius))
                .background(Palette.surface()),
        ) {
            SettingsRow(catalogText("people.title"), catalogText("people.homeBody"), Palette.lilacCard, "home-people") {}
            SettingsRow(catalogText("sharing.title"), catalogText("sharing.intro"), Palette.tealCard, "home-data-sharing") {}
        }
        HomeApps(model.apps, openApps, openApp)
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(catalogText("learner.more"), color = Palette.ink(), fontWeight = FontWeight.Bold, fontSize = 22.sp)
            Column(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(Palette.surface()),
            ) {
                SettingsRow(catalogText("home.create"), catalogText("home.createBody"), Palette.pinkCard, "home-create", openCreate)
            }
        }
    }
}

@Composable
fun HomeApps(apps: List<HomeApp>, openApps: () -> Unit, openApp: (HomeApp) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(catalogText("home.apps"), color = Palette.ink(), fontWeight = FontWeight.Bold, fontSize = 22.sp, modifier = Modifier.weight(1f))
            Text(
                catalogText("home.seeAll"),
                color = Palette.selection(),
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier
                    .clickable(onClick = openApps)
                    .testTag("home-apps")
                    .heightIn(min = 44.dp)
                    .padding(8.dp),
            )
        }
        Column(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(NativeLayout.surfaceRadius))
                .background(Palette.surface()),
        ) {
            apps.take(3).forEach { app ->
                Row(
                    Modifier
                        .fillMaxWidth()
                        .heightIn(min = 74.dp)
                        .clickable { openApp(app) }
                        .testTag("home-app-${app.id}")
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(NativeLayout.rowGap),
                ) {
                    Box(Modifier.size(48.dp).clip(RoundedCornerShape(14.dp)).background(Palette.studiesCard))
                    Column(Modifier.weight(1f)) {
                        Text(app.title, color = Palette.ink(), fontWeight = FontWeight.SemiBold)
                        Text(app.tagline, color = Palette.secondary(), fontSize = 14.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun LatestCredentialStack(credentials: List<HomeCredential>) {
    var index by rememberSaveable { mutableIntStateOf(0) }
    val active = credentials[index.coerceIn(credentials.indices)]
    Column(Modifier.testTag("latest-stack"), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Box(Modifier.fillMaxWidth().height(148.dp)) {
            credentials.forEachIndexed { position, credential ->
                val depth = kotlin.math.abs(position - index)
                if (depth > 2) return@forEachIndexed
                CredentialFace(
                    credential,
                    Modifier
                        .padding(top = (depth * 10).dp)
                        .offset(x = (if (position < index) -4 else 4).dp * depth)
                        .testTag(if (credential.id == active.id) "credential-${credential.id}" else "stack-underlay-${credential.id}"),
                )
            }
        }
        if (credentials.size > 1) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                Text(
                    "‹",
                    modifier = Modifier
                        .clickable(enabled = index > 0) { if (index > 0) index -= 1 }
                        .testTag("stack-newer")
                        .padding(8.dp),
                    color = Palette.ink(),
                    fontSize = 22.sp,
                )
                Spacer(Modifier.weight(1f))
                Text(
                    "${index + 1} / ${credentials.size}",
                    color = Palette.secondary(),
                    modifier = Modifier.testTag("stack-position"),
                )
                Spacer(Modifier.weight(1f))
                Text(
                    "›",
                    modifier = Modifier
                        .testTag("stack-older")
                        .heightIn(min = 44.dp)
                        .clickable { if (index < credentials.lastIndex) index += 1 }
                        .padding(12.dp),
                    color = Palette.ink(),
                    fontSize = 22.sp,
                )
            }
        }
    }
}

@Composable
private fun CredentialFace(credential: HomeCredential, modifier: Modifier) {
    Column(
        modifier
            .fillMaxWidth()
            .height(132.dp)
            .clip(RoundedCornerShape(24.dp))
            .background(Palette.categoryTint(credential.category))
            .padding(16.dp),
        verticalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(credential.title, color = Palette.cardInk, fontWeight = FontWeight.Bold, fontSize = 18.sp)
        Text(credential.issuer, color = Palette.cardInk.copy(alpha = 0.8f), fontSize = 14.sp)
    }
}
