package org.learningeconomy.learncard.lab.design

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun BrandProgress(label: String, tag: String = "brand-progress") {
    val transition = rememberInfiniteTransition(label = "brand-progress")
    val phase by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(900, easing = LinearEasing), RepeatMode.Restart),
        label = "phase",
    )
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.testTag(tag)) {
        Canvas(Modifier.size(width = 26.dp, height = 20.dp)) {
            val colors = listOf(Palette.tealCard, Palette.pinkCard, Palette.portfolioCard)
            colors.forEachIndexed { index, color ->
                val lift = kotlin.math.sin((phase + index * 0.2f) * Math.PI * 2).toFloat() * 4.dp.toPx()
                val left = size.width * (index * 2 + 1) / 6f
                drawRoundRect(
                    color = color,
                    topLeft = Offset(left - 3.dp.toPx(), size.height / 2f - 3.dp.toPx() + lift),
                    size = Size(6.dp.toPx(), 6.dp.toPx()),
                    cornerRadius = CornerRadius(1.2.dp.toPx(), 1.2.dp.toPx()),
                )
            }
        }
        Text(label, color = Palette.secondary(), fontSize = 16.sp)
    }
}

fun greetingKey(hour: Int): String = when (hour) {
    in 6..11 -> "morning"
    in 12..17 -> "afternoon"
    in 0..5 -> "hello"
    else -> "evening"
}
