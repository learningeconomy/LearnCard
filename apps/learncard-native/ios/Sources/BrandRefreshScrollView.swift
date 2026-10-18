import SwiftUI
import UIKit
import Observation
import LearnCardNativeCore
import LearnCardNativeSDK

/// Retains SwiftUI's refresh action and UIKit's gesture/inset ownership. Only the
/// refresh control's artwork changes; no extra pan recognizer or page spacer.
struct BrandRefreshScrollView<Content: View>: View {
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.accessibilityVoiceOverEnabled) private var voiceOver
    @State private var operation = RefreshOperation()
    @State private var visible = false
    let scope: String
    let refresh: () async -> Void
    @ViewBuilder let content: () -> Content

    var body: some View {
        ScrollView {
            content().background {
                RefreshArtworkHost(operation: operation) { refreshing in
                    RefreshArtworkAttachment(refreshing: refreshing,
                        active: visible && scenePhase == .active,
                        reduced: reduceMotion || voiceOver || ProcessInfo.processInfo.arguments.contains("--motion-reduced"))
                }
                    .allowsHitTesting(false).accessibilityHidden(true)
            }
        }
        .refreshable { [operation, refresh] in
            operation.refreshing = true
            defer { operation.refreshing = false }
            if UIAccessibility.isVoiceOverRunning {
                UIAccessibility.post(notification: .announcement, argument: NativeText.text("refresh.active"))
            }
            await refresh()
        }
        .accessibilityIdentifier("\(scope)-refresh-scroll")
        .onAppear { visible = true }
        .onDisappear { visible = false }
    }
}

@MainActor @Observable private final class RefreshOperation {
    var refreshing = false
}

/// Observe operation changes below the ScrollView/refreshable modifier. Updating
/// its captured value-state can otherwise replace and cancel an active action.
private struct RefreshArtworkHost: View {
    let operation: RefreshOperation
    let content: (Bool) -> RefreshArtworkAttachment
    var body: some View { content(operation.refreshing) }
}

/// An anchor *inside* the scroll content finds its own enclosing UIScrollView.
/// Uses public UIKit types/properties, never global appearance or private names.
private struct RefreshArtworkAttachment: UIViewRepresentable {
    let refreshing: Bool
    let active: Bool
    let reduced: Bool

    func makeUIView(context: Context) -> RefreshAnchor {
        let view = RefreshAnchor()
        view.coordinator = context.coordinator
        return view
    }
    func updateUIView(_ view: RefreshAnchor, context: Context) {
        context.coordinator.configuration = self
        context.coordinator.attach(from: view)
    }
    func makeCoordinator() -> Coordinator { Coordinator(configuration: self) }
    static func dismantleUIView(_ view: RefreshAnchor, coordinator: Coordinator) { coordinator.detach() }

    @MainActor final class Coordinator {
        var configuration: RefreshArtworkAttachment
        private weak var scroll: UIScrollView?
        private weak var control: UIRefreshControl?
        private var offsetObservation: NSKeyValueObservation?
        private var host: (UIView & UIContentView)?
        private var originalTint: UIColor?
        private var began = Date.now
        private var pausedElapsed: TimeInterval = 0
        private var wasRefreshing = false
        private var cycle = RefreshSkyCycle()
        private static var cameoPolicy = SkyCameoPolicy()

        init(configuration: RefreshArtworkAttachment) { self.configuration = configuration }
        func attach(from anchor: UIView) {
            var ancestor = anchor.superview
            while let view = ancestor {
                if let candidate = view as? UIScrollView {
                    if scroll !== candidate {
                        detach(); scroll = candidate
                        offsetObservation = candidate.observe(\.contentOffset, options: [.new]) { [weak self] _, _ in
                            // UIKit scroll offsets change on the main thread.
                            MainActor.assumeIsolated { self?.render() }
                        }
                    }
                    render()
                    return
                }
                ancestor = view.superview
            }
        }
        private func render() {
            guard let scroll else { return }
            guard let next = scroll.refreshControl else { removeArtwork(); return }
            // SwiftUI may install or replace its control after the content mounts.
            // The offset observation also discovers it on the very first pull.
            if control !== next {
                removeArtwork()
                control = next; originalTint = next.tintColor; next.tintColor = .clear
                let host = contentConfiguration(moving: false).makeContentView()
                host.backgroundColor = .clear
                host.isUserInteractionEnabled = false
                host.frame = next.bounds
                host.autoresizingMask = [.flexibleWidth, .flexibleHeight]
                next.addSubview(host)
                self.host = host
            }
            next.tintColor = .clear
            let busy = configuration.refreshing || next.isRefreshing
            let pull = max(0, -(scroll.contentOffset.y + scroll.adjustedContentInset.top))
            if cycle.scene == nil && (busy || scroll.isDragging && pull > 4) {
                began = .now
                pausedElapsed = 0
                let date = SkyReviewClock.date(.now)
                let cameo = SkyReviewClock.cameo ?? Self.cameoPolicy.choose(roll: Int.random(in: 0..<1000), at: .now)
                cycle.begin(sky: LocalDaytime(date: date).sky, cameo: cameo)
            }
            if busy && !wasRefreshing { began = .now; pausedElapsed = 0 }
            if !busy && wasRefreshing { pausedElapsed = max(0, Date.now.timeIntervalSince(began)) }
            wasRefreshing = busy
            let shown = configuration.active && cycle.scene != nil && (busy || pull > 0.5)
            let updateArtwork = shown || host?.isHidden == false
            host?.isHidden = !shown
            // Bounds come from the actual public refresh control. Only its child
            // artwork stretches; content insets/gesture lifetime stay native.
            host?.frame = next.bounds
            if updateArtwork { host?.configuration = contentConfiguration(moving: shown && busy && !configuration.reduced) }
            if !busy && !scroll.isDragging && pull <= 0.5 { cycle.end() }
        }
        private func contentConfiguration(moving: Bool) -> any UIContentConfiguration {
            let scene = cycle.scene
            let began = self.began
            let pausedElapsed = configuration.reduced ? 0 : self.pausedElapsed
            return UIHostingConfiguration {
                RefreshSkyView(sky: scene?.sky ?? .morning, cameo: scene?.cameo ?? .none, began: began, moving: moving, pausedElapsed: pausedElapsed)
            }.margins(.all, 0)
        }
        private func removeArtwork() {
            control?.tintColor = originalTint
            host?.removeFromSuperview()
            host = nil; control = nil; originalTint = nil
        }
        func detach() {
            offsetObservation?.invalidate(); offsetObservation = nil
            removeArtwork(); scroll = nil; wasRefreshing = false; cycle.end()
        }
    }
}

private final class RefreshAnchor: UIView {
    weak var coordinator: RefreshArtworkAttachment.Coordinator?
    override func didMoveToWindow() { super.didMoveToWindow(); coordinator?.attach(from: self) }
    override func layoutSubviews() { super.layoutSubviews(); coordinator?.attach(from: self) }
}
