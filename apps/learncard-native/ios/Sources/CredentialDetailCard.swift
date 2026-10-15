import SwiftUI
import UIKit
import LearnCardNativeCore
import LearnCardNativeSDK

/// A slow, isolated card tilt. No touch recognizer competes with page scrolling.
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
            CredentialCard(credential: credential, featured: true, showsDisclosure: false,
                           animatesPresence: false, showsStack: false)
                .overlay {
                    GeometryReader { geometry in
                        Rectangle()
                            .fill(LinearGradient(stops: [
                                .init(color: .clear, location: 0),
                                .init(color: .white.opacity(0.05), location: 0.28),
                                .init(color: .white.opacity(0.28), location: 0.5),
                                .init(color: .white.opacity(0.05), location: 0.72),
                                .init(color: .clear, location: 1)
                            ], startPoint: .leading, endPoint: .trailing))
                            .frame(width: geometry.size.width * 0.48, height: geometry.size.height * 1.8)
                            .rotationEffect(.degrees(-24))
                            .offset(x: geometry.size.width * (0.28 + yaw * 0.85), y: -geometry.size.height * 0.4)
                    }.clipShape(RoundedRectangle(cornerRadius: 24))
                        .opacity(moves ? 1 : 0).allowsHitTesting(false).accessibilityHidden(true)
                }
                .compositingGroup()
                .rotation3DEffect(.degrees(pitch * 1.8), axis: (x: 1, y: 0, z: 0), perspective: 0.55)
                .rotation3DEffect(.degrees(yaw * 4.5), axis: (x: 0, y: 1, z: 0), perspective: 0.55)
                .shadow(color: .black.opacity(0.07), radius: 12, x: yaw * 3, y: 9)
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
