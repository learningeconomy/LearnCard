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
    private var elastic: Bool { ProcessInfo.processInfo.arguments.contains("--sky-elastic-review") }
    private var moving: Bool { scene == .active && !reduced && !voiceOver && !ProcessInfo.processInfo.arguments.contains("--motion-reduced") }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text("Sky motion review").font(.headline).padding(.horizontal, 20)
                if elastic {
                    Text("Same artwork size · 60 / 180 point sky").font(.caption).padding(.horizontal, 20)
                    ForEach([60.0, 180.0], id: \.self) { height in
                        RefreshSkyView(sky: .afternoon, cameo: .twoCows, began: began, moving: moving, artworkHeight: 60).frame(height: height)
                    }
                    ForEach([60.0, 180.0], id: \.self) { height in
                        RefreshSkyView(sky: .night, cameo: .none, began: began, moving: moving, artworkHeight: 60).frame(height: height)
                    }
                } else {
                    ForEach(LocalDaytime.Sky.allCases, id: \.self) { sky in
                        Text(sky.rawValue).font(.caption).padding(.horizontal, 20)
                        RefreshSkyView(sky: sky, cameo: .none, began: began, moving: moving).frame(height: 72)
                    }
                    Text("Rare cameo").font(.caption).padding(.horizontal, 20)
                    RefreshSkyView(sky: .afternoon, cameo: .twoCows, began: began, moving: moving).frame(height: 72)
                }
            }.padding(.vertical, 20)
        }.background(Palette.paper).accessibilityIdentifier("sky-review")
    }
}
#endif
