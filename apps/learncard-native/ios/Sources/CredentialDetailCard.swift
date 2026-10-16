import SwiftUI
import UIKit
import LearnCardNativeCore
import LearnCardNativeSDK

/// A slow, isolated card tilt with a moving reflection and cast shadow.
/// No touch recognizer competes with page scrolling.
struct CredentialDetailCard: View {
    let credential: Credential
    var isVisible = true
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
    private var moves: Bool { visible && isVisible && !reduceMotion && !voiceOver && scenePhase == .active }

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 24, paused: !moves)) { tick in
            let phase = tick.date.timeIntervalSince(origin) * .pi / 4.5
            let yaw = moves ? sin(phase) : 0
            let pitch = moves ? cos(phase) : 0
            let light = (sin(phase - 0.65) + 1) / 2
            CredentialCard(credential: credential, featured: true, showsDisclosure: false,
                           animatesPresence: false, showsStack: false, castsShadow: false,
                           reflectionPosition: moves ? light : nil)
                .compositingGroup()
                .rotation3DEffect(.degrees(pitch * 3.2), axis: (x: 1, y: 0, z: 0), perspective: 0.4)
                .rotation3DEffect(.degrees(yaw * 7), axis: (x: 0, y: 1, z: 0), perspective: 0.4)
                .shadow(color: .black.opacity(0.08), radius: 3, x: yaw * -2, y: 5)
                .shadow(color: .black.opacity(0.22), radius: 18 + pitch * 2, x: yaw * -8, y: 17 + pitch * 3)
        }
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("credential-detail-card")
        .accessibilityValue(NativeText.text(moves ? "card.motion.animated" : "card.motion.static"))
        .onAppear { origin = Date(); visible = true }
        .onDisappear { visible = false }
        .onChange(of: isVisible) { _, value in if value { origin = Date() } }
        .onChange(of: scenePhase) { _, phase in if phase == .active { origin = Date() } }
        .onReceive(NotificationCenter.default.publisher(for: UIAccessibility.voiceOverStatusDidChangeNotification)) { _ in
            voiceOver = UIAccessibility.isVoiceOverRunning
        }
    }
}
