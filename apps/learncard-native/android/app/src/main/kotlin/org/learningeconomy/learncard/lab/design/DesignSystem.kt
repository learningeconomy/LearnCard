package org.learningeconomy.learncard.lab.design

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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

val LocalDark = staticCompositionLocalOf { false }
val LocalLanguage = staticCompositionLocalOf { "en" }
val LocalCatalog = staticCompositionLocalOf<NativeCatalog?> { null }

object NativeLayout {
    val pageInset = 20.dp
    val sectionGap = 24.dp
    val rowGap = 14.dp
    val surfaceRadius = 24.dp
}

object Palette {
    val inkLight = Color(0xFF18224E)
    val inkDark = Color(0xFFEFF0F5)
    val secondaryLight = Color(0xFF353E64)
    val secondaryDark = Color(0xFFC5C8D3)
    val paperLight = Color(0xFFEFF0F5)
    val paperDark = Color(0xFF11151C)
    val surfaceLight = Color(0xFFFFFFFF)
    val surfaceDark = Color(0xFF202732)
    val lineLight = Color(0xFFE2E3E9)
    val lineDark = Color(0xFF353E64)
    val selectionInkLight = Color(0xFFFFFFFF)
    val selectionInkDark = Color(0xFF18224E)
    val cyanCard = Color(0xFF22D3EE)
    val blueCard = Color(0xFF93C5FD)
    val pinkCard = Color(0xFFF9A8D4)
    val qualificationCard = Color(0xFFFDBA74)
    val otherCard = Color(0xFFE2E3E9)
    val lilacCard = Color(0xFFC4B5FD)
    val limeCard = Color(0xFFBEF264)
    val studiesCard = Color(0xFF34D399)
    val portfolioCard = Color(0xFFFDE047)
    val familyCard = Color(0xFFFBBF24)
    val tealCard = Color(0xFF5EEAD4)
    val topicCard = Color(0xFF67E8F9)
    val cardInk = Color(0xFF18224E)
    val green = Color(0xFF047857)
    val flairYellow = Color(0xFFFACC15)
    val flairPink = Color(0xFFEC4899)
    val flairBlue = Color(0xFF3B82F6)
    val flairTeal = Color(0xFF14B8A6)
    val errorInk = Color(0xFFB42338)

    @Composable fun ink(): Color = if (LocalDark.current) inkDark else inkLight
    @Composable fun secondary(): Color = if (LocalDark.current) secondaryDark else secondaryLight
    @Composable fun paper(): Color = if (LocalDark.current) paperDark else paperLight
    @Composable fun surface(): Color = if (LocalDark.current) surfaceDark else surfaceLight
    @Composable fun line(): Color = if (LocalDark.current) lineDark else lineLight
    @Composable fun selection(): Color = ink()
    @Composable fun selectionInk(): Color = if (LocalDark.current) selectionInkDark else selectionInkLight

    fun categoryTint(category: CredentialCategory): Color = when (category) {
        CredentialCategory.Achievement -> pinkCard
        CredentialCategory.Qualification -> qualificationCard
        CredentialCategory.Badge, CredentialCategory.Id -> blueCard
        CredentialCategory.Studies -> studiesCard
        CredentialCategory.Portfolio -> portfolioCard
        CredentialCategory.Assistance, CredentialCategory.Skill -> lilacCard
        CredentialCategory.Experience -> cyanCard
        CredentialCategory.Family -> familyCard
        CredentialCategory.AiTopic -> topicCard
        CredentialCategory.AiPathway -> tealCard
        CredentialCategory.AiInsight -> limeCard
        CredentialCategory.Other -> otherCard
    }
}

enum class CredentialCategory {
    Badge, Achievement, Qualification, Studies, Portfolio, Assistance, Experience, Id, Family, Skill, AiTopic, AiPathway, AiInsight, Other;

    companion object {
        fun resolve(category: String?, kind: String): CredentialCategory {
            val letters = category?.lowercase()?.filter { it.isLetter() }
            return when (letters) {
                "socialbadge", "meritbadge", "badge", "badges", "boost" -> Badge
                "achievement", "achievements" -> Achievement
                "qualification", "qualifications" -> Qualification
                "learninghistory", "course", "courses", "study", "studies", "learning" -> Studies
                "accomplishment", "accomplishments", "portfolio" -> Portfolio
                "accommodation", "accommodations", "assistance" -> Assistance
                "workhistory", "resume", "experience", "experiences" -> Experience
                "id", "ids", "membership", "memberships" -> Id
                "family" -> Family
                "skill", "skills" -> Skill
                "aitopic", "aisession" -> AiTopic
                "aipathway" -> AiPathway
                "aiinsight" -> AiInsight
                null, "" -> when (kind) {
                    "Memberships" -> Id
                    "Learning" -> Studies
                    else -> Achievement
                }
                else -> Other
            }
        }
    }
}

@Composable
fun catalogText(key: String): String {
    val catalog = LocalCatalog.current
    val language = LocalLanguage.current
    return catalog?.text(key, language) ?: key
}

@Composable
fun catalogLiteral(source: String): String {
    val catalog = LocalCatalog.current
    val language = LocalLanguage.current
    return catalog?.literal(source, language) ?: source
}

@Composable
fun catalogCount(key: String, count: Int): String {
    val catalog = LocalCatalog.current
    val language = LocalLanguage.current
    return catalog?.count(key, count, language) ?: key
}

@Composable
fun PrimaryButton(
    title: String,
    tag: String,
    enabled: Boolean = true,
    onClick: () -> Unit,
) {
    val fill = if (enabled) Palette.selection() else Palette.line()
    val ink = if (enabled) Palette.selectionInk() else Palette.secondary()
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 54.dp)
            .clip(RoundedCornerShape(20.dp))
            .background(fill)
            .clickable(enabled = enabled, onClick = onClick)
            .testTag(tag)
            .padding(horizontal = 16.dp, vertical = 14.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(title, color = ink, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
    }
}

@Composable
fun PageHeading(title: String, identifier: String? = null, accent: Color = Palette.flairYellow) {
    val id = identifier ?: title.lowercase()
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(
            title,
            modifier = Modifier
                .testTag("page-title-$id")
                .semantics { heading() },
            color = Palette.ink(),
            fontSize = 34.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = (-0.8).sp,
        )
        Spacer(Modifier.width(8.dp))
        Box(
            Modifier
                .size(28.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(accent),
        )
    }
}

@Composable
fun SurfaceCard(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Column(
        modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(NativeLayout.surfaceRadius))
            .background(Palette.surface())
            .padding(16.dp),
    ) { content() }
}

@Composable
fun SettingsRow(title: String, subtitle: String?, tint: Color, tag: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 68.dp)
            .clickable(onClick = onClick)
            .testTag(tag)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Box(
            Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(tint),
        )
        Column(Modifier.weight(1f)) {
            Text(title, color = Palette.ink(), fontWeight = FontWeight.SemiBold, fontSize = 18.sp)
            if (subtitle != null) {
                Spacer(Modifier.height(4.dp))
                Text(subtitle, color = Palette.secondary(), fontSize = 14.sp)
            }
        }
        Text("›", color = Palette.secondary(), fontSize = 18.sp)
    }
}
