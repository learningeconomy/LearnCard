import SwiftUI
import UIKit
import LearnCardNativeCore

/// A slow, isolated card tilt. No touch recognizer competes with page scrolling.
struct CredentialDetailCard: View {
    let credential: Credential
    @Environment(\.accessibilityReduceMotion) private var systemReduceMotion
    @Environment(\.scenePhase) private var scenePhase
    @State private var voiceOver = UIAccessibility.isVoiceOverRunning
    @State private var visible = false
    @State private var origin = Date()

    private var reduceMotion: Bool {
        #if DEBUG
        systemReduceMotion || ProcessInfo.processInfo.arguments.contains("--card-reduce-motion")
        #else
        systemReduceMotion
        #endif
    }
    private var moves: Bool { visible && !reduceMotion && !voiceOver && scenePhase == .active }

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 24, paused: !moves)) { tick in
            let wave = moves ? sin(tick.date.timeIntervalSince(origin) * .pi / 4) : 0
            CredentialCard(credential: credential, featured: true, showsDisclosure: false,
                           animatesPresence: false, showsStack: false)
                .overlay {
                    GeometryReader { geometry in
                        Rectangle()
                            .fill(LinearGradient(colors: [.clear, .white.opacity(0.08), .clear], startPoint: .leading, endPoint: .trailing))
                            .frame(width: geometry.size.width * 0.4, height: geometry.size.height * 1.8)
                            .rotationEffect(.degrees(-24))
                            .offset(x: geometry.size.width * (0.3 + wave * 0.14), y: -geometry.size.height * 0.4)
                    }.clipShape(RoundedRectangle(cornerRadius: 24))
                        .opacity(moves ? 1 : 0).allowsHitTesting(false).accessibilityHidden(true)
                }
                .rotation3DEffect(.degrees(wave * 0.65), axis: (x: 1, y: 0, z: 0), perspective: 0.4)
                .rotation3DEffect(.degrees(wave * 2.6), axis: (x: 0, y: 1, z: 0), perspective: 0.4)
                .shadow(color: .black.opacity(0.06), radius: 12, x: 0, y: 8)
        }
        .accessibilityIdentifier("credential-detail-card")
        .onScrollVisibilityChange(threshold: 0.1) { value in
            if value && !visible { origin = Date() }
            visible = value
        }
        .onChange(of: scenePhase) { _, phase in if phase == .active { origin = Date() } }
        .onReceive(NotificationCenter.default.publisher(for: UIAccessibility.voiceOverStatusDidChangeNotification)) { _ in
            voiceOver = UIAccessibility.isVoiceOverRunning
        }
    }
}
