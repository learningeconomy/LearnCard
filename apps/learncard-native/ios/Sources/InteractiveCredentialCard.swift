import SwiftUI
import UIKit
import LearnCardNativeCore
import LearnCardNativeSDK

/// Deliberate hold-and-drag interaction; quick swipes remain page scrolling.
struct InteractiveCredentialCard: View {
    let credential: Credential
    @Environment(\.accessibilityReduceMotion) private var systemReduceMotion
    @Environment(\.scenePhase) private var scenePhase
    @State private var voiceOver = UIAccessibility.isVoiceOverRunning
    @State private var touch = CardTouch()

    private var reduceMotion: Bool {
        #if DEBUG
        systemReduceMotion || ProcessInfo.processInfo.arguments.contains("--card-reduce-motion")
        #else
        systemReduceMotion
        #endif
    }

    private var available: Bool { !reduceMotion && !voiceOver && scenePhase == .active }
    private var engaged: Bool { available && touch.active }
    private var horizontal: Double { engaged ? max(-1, min(1, touch.translation.width / 90)) : 0 }
    private var vertical: Double { engaged ? max(-1, min(1, touch.translation.height / 90)) : 0 }

    var body: some View {
        VStack(spacing: 8) {
            CredentialCard(credential: credential, featured: true, showsDisclosure: false, animatesPresence: false)
                .overlay {
                    // A faint reflected light moves with the touch; text stays fully opaque.
                    GeometryReader { geometry in
                        Rectangle()
                            .fill(LinearGradient(colors: [.clear, .white.opacity(0.14), .clear], startPoint: .leading, endPoint: .trailing))
                            .frame(width: geometry.size.width * 0.4, height: geometry.size.height * 1.8)
                            .rotationEffect(.degrees(-24))
                            .offset(x: geometry.size.width * (0.3 + horizontal * 0.3), y: -geometry.size.height * 0.4)
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 24))
                    .opacity(engaged ? 1 : 0)
                    .allowsHitTesting(false)
                    .accessibilityHidden(true)
                }
                .overlay {
                    CardHoldSurface(enabled: available) { touch = $0 }
                        .allowsHitTesting(available)
                }
                .rotation3DEffect(.degrees(-vertical * 5), axis: (x: 1, y: 0, z: 0), perspective: 0.45)
                .rotation3DEffect(.degrees(horizontal * 7), axis: (x: 0, y: 1, z: 0), perspective: 0.45)
                .scaleEffect(engaged ? 1.012 : 1)
                .shadow(color: .black.opacity(engaged ? 0.10 : 0), radius: 16, x: -horizontal * 5, y: 10)
                .animation(reduceMotion ? nil : .spring(response: engaged ? 0.20 : 0.46, dampingFraction: engaged ? 0.88 : 0.76), value: touch)
                .sensoryFeedback(.selection, trigger: engaged) { _, value in value }
                .accessibilityIdentifier("credential-interactive-card")
                .accessibilityHint(available ? NativeText.text("credential.tiltHint") : "")
            if available {
                Label(NativeText.text("credential.tiltHint"), systemImage: "hand.draw")
                    .font(.caption2).foregroundStyle(Palette.secondary)
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: UIAccessibility.voiceOverStatusDidChangeNotification)) { _ in
            voiceOver = UIAccessibility.isVoiceOverRunning
        }
    }
}

private struct CardTouch: Equatable {
    var active = false
    var translation: CGSize = .zero
}

/// UIKit arbitrates the hold against native scroll/sheet pans before SwiftUI renders the pose.
/// Quick movement fails the hold; once it begins, other pans wait for it to finish.
private struct CardHoldSurface: UIViewRepresentable {
    let enabled: Bool
    let onChange: (CardTouch) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(onChange: onChange) }
    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.isAccessibilityElement = false
        let hold = UILongPressGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.changed(_:)))
        hold.minimumPressDuration = 0.35
        hold.allowableMovement = 8
        hold.delegate = context.coordinator
        view.addGestureRecognizer(hold)
        return view
    }
    func updateUIView(_ view: UIView, context: Context) {
        context.coordinator.onChange = onChange
        view.isUserInteractionEnabled = enabled
        if let hold = view.gestureRecognizers?.first, hold.isEnabled != enabled { hold.isEnabled = enabled }
    }
    static func dismantleUIView(_ view: UIView, coordinator: Coordinator) {
        view.gestureRecognizers?.forEach { $0.isEnabled = false }
    }

    final class Coordinator: NSObject, UIGestureRecognizerDelegate {
        var onChange: (CardTouch) -> Void
        private var origin: CGPoint?
        init(onChange: @escaping (CardTouch) -> Void) { self.onChange = onChange }

        @objc func changed(_ recognizer: UILongPressGestureRecognizer) {
            let point = recognizer.location(in: recognizer.view?.window)
            let value: CardTouch
            switch recognizer.state {
            case .began:
                origin = point; value = CardTouch(active: true)
            case .changed:
                let start = origin ?? point
                value = CardTouch(active: true, translation: CGSize(width: point.x - start.x, height: point.y - start.y))
            default:
                origin = nil; value = CardTouch()
            }
            // Cancellation can occur during updateUIView; publish after that render transaction.
            DispatchQueue.main.async { [weak self] in self?.onChange(value) }
        }

        func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldBeRequiredToFailBy otherGestureRecognizer: UIGestureRecognizer) -> Bool {
            otherGestureRecognizer is UIPanGestureRecognizer
        }
    }
}
