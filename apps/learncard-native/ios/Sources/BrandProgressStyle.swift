import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

/// Contextual labels sit beside a quiet three-tile wave rather than underneath
/// an isolated spinner. Real fractional progress keeps the system linear bar.
struct BrandProgressStyle: ProgressViewStyle {
    @ViewBuilder func makeBody(configuration: Configuration) -> some View {
        if let fraction = configuration.fractionCompleted {
            ProgressView(value: fraction) { configuration.label } currentValueLabel: { configuration.currentValueLabel }
                .progressViewStyle(.linear)
        } else if let label = configuration.label {
            HStack(alignment: .center, spacing: 10) {
                InlineLoadingGlyph().accessibilityHidden(true)
                label.fixedSize(horizontal: false, vertical: true).multilineTextAlignment(.leading)
            }.accessibilityElement(children: .combine)
        } else {
            InlineLoadingGlyph().accessibilityLabel(NativeText.text("common.loading"))
        }
    }
}

private struct InlineLoadingGlyph: View {
    @Environment(\.controlSize) private var controlSize
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.accessibilityVoiceOverEnabled) private var voiceOver
    @State private var visible = false
    @State private var began = Date.now
    private var small: Bool { controlSize == .mini || controlSize == .small }
    private var still: Bool { reduceMotion || voiceOver || ProcessInfo.processInfo.arguments.contains("--motion-reduced") }
    private var moving: Bool { visible && scenePhase == .active && !still }

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 20, paused: !moving)) { tick in
            Canvas { context, size in
                let unit = small ? 4.5 : 6.0
                for (index, color) in [Palette.tealCard, Palette.pinkCard, Palette.portfolioCard].enumerated() {
                    let pose = InlineLoadingMotion.pose(index: index, elapsed: tick.date.timeIntervalSince(began), animated: moving)
                    var tile = context
                    tile.translateBy(x: size.width * Double(index * 2 + 1) / 6, y: size.height / 2 + pose.lift * (small ? 0.7 : 1))
                    tile.rotate(by: .degrees(pose.tilt))
                    let path = Path(roundedRect: CGRect(x: -unit / 2, y: -unit / 2, width: unit, height: unit), cornerRadius: 1.2)
                    tile.fill(path, with: .color(color))
                    tile.stroke(path, with: .color(Palette.cardInk.opacity(0.75)), lineWidth: 0.65)
                }
            }
        }.frame(width: small ? 19 : 26, height: small ? 14 : 20)
            .environment(\.layoutDirection, .leftToRight)
            .onAppear { began = .now; visible = true }
            .onDisappear { visible = false }
    }
}
