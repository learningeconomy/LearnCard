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
    @Environment(\.locale) private var locale
    @Environment(\.layoutDirection) private var direction
    @Environment(\.dynamicTypeSize) private var textSize
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
                        reduced: reduceMotion || voiceOver || ProcessInfo.processInfo.arguments.contains("--motion-reduced"),
                        locale: locale, direction: direction, textSize: textSize)
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
    let locale: Locale
    let direction: LayoutDirection
    let textSize: DynamicTypeSize

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
        private var wasRefreshing = false

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
                let host = contentConfiguration(progress: 0).makeContentView()
                host.backgroundColor = .clear
                host.isUserInteractionEnabled = false
                host.frame = next.bounds
                host.autoresizingMask = [.flexibleWidth, .flexibleHeight]
                next.addSubview(host)
                self.host = host
            }
            next.tintColor = .clear
            if configuration.refreshing && !wasRefreshing { began = .now }
            wasRefreshing = configuration.refreshing
            let pull = max(0, -(scroll.contentOffset.y + scroll.adjustedContentInset.top))
            let shown = configuration.active && (configuration.refreshing || (scroll.isDragging && pull > 4))
            let updateArtwork = shown || host?.isHidden == false
            host?.isHidden = !shown
            if updateArtwork { host?.configuration = contentConfiguration(progress: min(1, pull / 96)) }
        }
        private func contentConfiguration(progress: Double) -> any UIContentConfiguration {
            let content = artwork(progress: progress)
            return UIHostingConfiguration { content }.margins(.all, 0)
        }
        private func artwork(progress: Double) -> RefreshArtwork {
            RefreshArtwork(progress: progress,
                refreshing: configuration.refreshing, active: configuration.active,
                reduced: configuration.reduced, began: began,
                locale: configuration.locale, direction: configuration.direction, textSize: configuration.textSize)
        }
        private func removeArtwork() {
            control?.tintColor = originalTint
            host?.removeFromSuperview()
            host = nil; control = nil; originalTint = nil
        }
        func detach() {
            offsetObservation?.invalidate(); offsetObservation = nil
            removeArtwork(); scroll = nil; wasRefreshing = false
        }
    }
}

private final class RefreshAnchor: UIView {
    weak var coordinator: RefreshArtworkAttachment.Coordinator?
    override func didMoveToWindow() { super.didMoveToWindow(); coordinator?.attach(from: self) }
    override func layoutSubviews() { super.layoutSubviews(); coordinator?.attach(from: self) }
}

private struct RefreshArtwork: View {
    let progress: Double
    let refreshing: Bool
    let active: Bool
    let reduced: Bool
    let began: Date
    let locale: Locale
    let direction: LayoutDirection
    let textSize: DynamicTypeSize
    private var moves: Bool { refreshing && active && !reduced }

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30, paused: !moves)) { tick in
            HStack(spacing: 10) {
                ZStack {
                    ForEach(0..<9) { index in
                        let pose = RefreshMotion.tile(index, pull: progress,
                            elapsed: tick.date.timeIntervalSince(began), refreshing: refreshing, animated: !reduced)
                        PigmentTile(index: index)
                            .frame(width: 10, height: 10)
                            .scaleEffect(pose.scale).rotationEffect(.degrees(pose.rotation))
                            .offset(x: pose.x, y: pose.y)
                    }
                }.frame(width: 44, height: 44).environment(\.layoutDirection, .leftToRight)
                    .accessibilityHidden(true)
                Text(NativeText.text(refreshing ? "refresh.active" : "refresh.pull"))
                    .font(.caption.weight(.medium)).foregroundStyle(Palette.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }.padding(.horizontal, 16).frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .environment(\.locale, locale)
        .environment(\.layoutDirection, direction)
        // A refresh control has a native, bounded height. Reading content still
        // scales fully; its compact status caps at the largest ordinary size.
        .environment(\.dynamicTypeSize, min(textSize, .xxxLarge))
        .accessibilityHidden(true)
    }
}
