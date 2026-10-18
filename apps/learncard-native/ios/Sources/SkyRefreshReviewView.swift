#if DEBUG
import SwiftUI
import LearnCardNativeCore

/// Isolated drawing review using the production scene renderer. Actual native
/// pull/lifetime/scroll behavior is checked separately with the refresh UI cases.
struct SkyRefreshReviewView: View {
    @Environment(\.accessibilityReduceMotion) private var reduced
    @Environment(\.accessibilityVoiceOverEnabled) private var voiceOver
    @Environment(\.scenePhase) private var scene
    @State private var began = Date.now
    private var moving: Bool { scene == .active && !reduced && !voiceOver && !ProcessInfo.processInfo.arguments.contains("--motion-reduced") }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text("Sky motion review").font(.headline).padding(.horizontal, 20)
                ForEach(LocalDaytime.Sky.allCases, id: \.self) { sky in
                    Text(sky.rawValue).font(.caption).padding(.horizontal, 20)
                    RefreshSkyView(sky: sky, cameo: .none, began: began, moving: moving).frame(height: 72)
                }
                Text("Rare cameo").font(.caption).padding(.horizontal, 20)
                RefreshSkyView(sky: .afternoon, cameo: .twoCows, began: began, moving: moving).frame(height: 72)
            }.padding(.vertical, 20)
        }.background(Palette.paper).accessibilityIdentifier("sky-review")
    }
}
#endif
