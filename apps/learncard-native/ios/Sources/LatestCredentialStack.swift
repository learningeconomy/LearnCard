import SwiftUI
import UIKit
import LearnCardNativeCore
import LearnCardNativeSDK

/// Interactive browsing of actual recent records. Only the active card participates in navigation/accessibility.
struct LatestCredentialStack: View {
    let credentials: [Credential]
    let store: AppStore
    let namespace: Namespace.ID
    var partial = false
    @Binding var activeID: String?
    @State private var cursor = RecentCredentialDeck()
    @State private var translation = CGSize.zero
    @State private var preview: CredentialDeckStep?
    @State private var outgoing: String?
    @State private var animating = false
    @State private var generation = UUID()
    @State private var width: CGFloat = 320
    @Environment(\.accessibilityReduceMotion) private var systemReduceMotion
    @Environment(\.layoutDirection) private var layoutDirection
    @Environment(\.locale) private var locale
    @Environment(\.scenePhase) private var scenePhase

    private var entries: [Credential] { RecentCredentialDeck.latest(in: credentials) }
    private var ids: [String] { entries.map(\.id) }
    private var current: Credential? { entries.first(where: { $0.id == cursor.activeID }) ?? entries.first }
    private var reduceMotion: Bool {
        #if DEBUG
        systemReduceMotion || ProcessInfo.processInfo.arguments.contains("--card-reduce-motion")
        #else
        systemReduceMotion
        #endif
    }
    private var rightToLeft: Bool { layoutDirection == .rightToLeft }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                Text(NativeText.literal("Latest issued")).font(.headline).foregroundStyle(Palette.ink)
                Spacer()
                if let current, current.date.timeIntervalSince1970 > 0 {
                    Text(current.date, format: .dateTime.month(.abbreviated).day().year().locale(locale))
                        .font(.caption).foregroundStyle(Palette.secondary).accessibilityIdentifier("stack-issue-date")
                }
            }
            ZStack(alignment: .top) {
                ForEach(Array(entries.enumerated()), id: \.element.id) { position, credential in
                    card(credential, position: position)
                }
            }
            .frame(maxWidth: .infinity)
            .onGeometryChange(for: CGFloat.self) { $0.size.width } action: { width = $0 }
            .padding(.bottom, entries.count > 1 ? 18 : 0)
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier("latest-stack")
            .accessibilityValue(NativeText.format("collection.stackPosition", (cursor.index + 1).formatted(.number.locale(locale)), entries.count.formatted(.number.locale(locale))))
            if entries.count > 1 {
                HStack(spacing: 8) {
                    stepButton(.newer)
                    Spacer(minLength: 0)
                    VStack(spacing: 5) {
                        Text(NativeText.format("collection.stackPosition", (cursor.index + 1).formatted(.number.locale(locale)), entries.count.formatted(.number.locale(locale))))
                            .font(.caption.monospacedDigit().weight(.medium)).foregroundStyle(Palette.secondary)
                            .accessibilityIdentifier("stack-position")
                        HStack(spacing: 5) {
                            ForEach(entries.indices, id: \.self) { index in
                                Capsule().fill(index == cursor.index ? Palette.selection : Palette.line)
                                    .frame(width: index == cursor.index ? 16 : 5, height: 5)
                            }
                        }.accessibilityHidden(true)
                    }
                    Spacer(minLength: 0)
                    stepButton(.older)
                }
            }
            if partial || entries.count > 1 {
                Text(NativeText.text(partial ? "collection.stackPartial" : "collection.stackHint"))
                    .font(.caption).foregroundStyle(Palette.secondary)
            }
        }
        .onAppear { synchronize() }
        .onChange(of: ids) { _, _ in synchronize() }
        .onChange(of: scenePhase) { _, phase in if phase != .active { resetMotion() } }
        .onChange(of: reduceMotion) { _, _ in resetMotion() }
        .onScrollVisibilityChange(threshold: 0.1) { visible in if !visible { resetMotion() } }
        .onDisappear { resetMotion() }
    }

    private func card(_ credential: Credential, position: Int) -> some View {
        let active = credential.id == (cursor.activeID ?? entries.first?.id)
        let flying = credential.id == outgoing
        let moving = flying || (active && outgoing == nil)
        let depth = active ? 0 : preview == .newer ? cursor.index - position : position - cursor.index
        let visible = active || flying || (1...2).contains(depth)
        return NavigationLink {
            CredentialDetailView(store: store, credential: credential)
                .credentialZoom(id: credential.id, namespace: namespace, reduceMotion: reduceMotion)
        } label: {
            CredentialCard(credential: credential, featured: true, animatesPresence: false, showsStack: false)
                .overlay {
                    if !active && !flying { sleeve(depth: depth).clipShape(RoundedRectangle(cornerRadius: 24)) }
                }
                .modifier(StackTransitionSource(active: active, id: credential.id, namespace: namespace))
        }
        .buttonStyle(CredentialPressStyle())
        .accessibilityIdentifier(active ? "credential-\(credential.id)" : "stack-underlay-\(credential.id)")
        .accessibilityHidden(!active)
        .accessibilityHint(NativeText.text("collection.stackOpenHint"))
        .accessibilityAction(named: Text(NativeText.text("collection.stackOlder"))) { move(.older) }
        .accessibilityAction(named: Text(NativeText.text("collection.stackNewer"))) { move(.newer) }
        .allowsHitTesting(active && !animating)
        .gesture(HorizontalStackPan(enabled: active && entries.count > 1 && !animating) { offset in
            let direction: CredentialDeckStep = (rightToLeft ? offset.width > 0 : offset.width < 0) ? .older : .newer
            let allowed = cursor.target(for: direction) != nil
            preview = allowed ? direction : nil
            translation = reduceMotion ? .zero : CGSize(width: offset.width * (allowed ? 1 : 0.15), height: max(-18, min(offset.height * 0.15, 18)))
        } ended: { offset, velocity in
            if let step = RecentCredentialDeck.swipe(x: offset.width, y: offset.height, velocity: velocity, width: width, rightToLeft: rightToLeft), cursor.target(for: step) != nil {
                move(step)
            } else { settleBack() }
        } cancelled: { settleBack() })
        .scaleEffect(active || flying ? 1 : 1 - CGFloat(max(0, min(depth, 2))) * 0.025, anchor: .top)
        .rotationEffect(.degrees(reduceMotion ? 0 : moving ? max(-15, min(translation.width / 24, 15)) : active ? 0 : depth == 1 ? -2 : 2))
        .offset(x: moving ? translation.width : active ? 0 : depth == 1 ? -3 : 3,
                y: moving ? translation.height : active ? 0 : CGFloat(max(0, min(depth, 2))) * 9)
        .opacity(visible ? 1 : 0)
        .zIndex(active || flying ? 20 : Double(10 - depth))
    }

    private func sleeve(depth: Int) -> Color {
        let category = current?.displayCategory
        let accents: [CredentialCategory] = [.portfolio, .experience, .studies, .assistance, .badge]
        let options = accents.filter { $0 != category && !(category == .id && $0 == .badge) && !(category == .aiTopic && $0 == .experience) }
        return Palette.categoryTint(options[max(0, depth - 1) % options.count])
    }
    private func stepButton(_ step: CredentialDeckStep) -> some View {
        Button { move(step) } label: {
            Label(NativeText.text(step == .older ? "collection.stackOlder" : "collection.stackNewer"), systemImage: step == .older ? "chevron.forward" : "chevron.backward")
                .font(.caption.weight(.semibold)).padding(.horizontal, 12).frame(minHeight: 44)
                .background(Palette.surface, in: Capsule())
        }.buttonStyle(.plain).foregroundStyle(Palette.ink)
            .disabled(cursor.target(for: step) == nil || animating)
            .opacity(cursor.target(for: step) == nil ? 0.4 : 1)
            .accessibilityIdentifier(step == .older ? "stack-older" : "stack-newer")
    }
    private func synchronize() {
        resetMotion(); cursor.reconcile(ids: ids); activeID = cursor.activeID
    }
    private func resetMotion() {
        generation = UUID()
        var transaction = Transaction(); transaction.disablesAnimations = true
        withTransaction(transaction) { translation = .zero; outgoing = nil; preview = nil; animating = false }
    }
    private func settleBack() {
        guard !animating else { return }
        if reduceMotion { resetMotion() }
        else {
            withAnimation(.spring(response: 0.32, dampingFraction: 0.8)) { translation = .zero; preview = nil }
        }
    }
    private func move(_ step: CredentialDeckStep) {
        guard !animating, cursor.target(for: step) != nil else { settleBack(); return }
        guard !reduceMotion else {
            resetMotion(); cursor.move(step); activeID = cursor.activeID; return
        }
        animating = true; preview = step; outgoing = cursor.activeID
        let token = UUID(); generation = token
        let exitsLeft = rightToLeft ? step == .newer : step == .older
        withAnimation(.easeIn(duration: 0.22), completionCriteria: .logicallyComplete) {
            translation = CGSize(width: (exitsLeft ? -1 : 1) * (width + 160), height: -26)
        } completion: {
            guard generation == token else { return }
            withAnimation(.spring(response: 0.32, dampingFraction: 0.84), completionCriteria: .logicallyComplete) {
                cursor.move(step); activeID = cursor.activeID
            } completion: {
                guard generation == token else { return }
                resetMotion()
            }
        }
    }
}

private struct StackTransitionSource: ViewModifier {
    let active: Bool
    let id: String
    let namespace: Namespace.ID
    @ViewBuilder func body(content: Content) -> some View {
        if active { content.matchedTransitionSource(id: id, in: namespace) }
        else { content }
    }
}

/// Reject vertical intent before recognition, so the enclosing ScrollView keeps its native pan.
private struct HorizontalStackPan: UIGestureRecognizerRepresentable {
    let enabled: Bool
    let changed: (CGSize) -> Void
    let ended: (CGSize, CGFloat) -> Void
    let cancelled: () -> Void
    func makeCoordinator(converter: CoordinateSpaceConverter) -> Coordinator { Coordinator() }
    func makeUIGestureRecognizer(context: Context) -> UIPanGestureRecognizer {
        let pan = UIPanGestureRecognizer(); pan.maximumNumberOfTouches = 1
        pan.delegate = context.coordinator; pan.isEnabled = enabled
        return pan
    }
    func updateUIGestureRecognizer(_ recognizer: UIPanGestureRecognizer, context: Context) { recognizer.isEnabled = enabled }
    func handleUIGestureRecognizerAction(_ recognizer: UIPanGestureRecognizer, context: Context) {
        let value = recognizer.translation(in: nil)
        let offset = CGSize(width: value.x, height: value.y)
        switch recognizer.state {
        case .began, .changed: changed(offset)
        case .ended: ended(offset, recognizer.velocity(in: nil).x)
        case .cancelled, .failed: cancelled()
        default: break
        }
    }
    final class Coordinator: NSObject, UIGestureRecognizerDelegate {
        func gestureRecognizerShouldBegin(_ recognizer: UIGestureRecognizer) -> Bool {
            guard let pan = recognizer as? UIPanGestureRecognizer else { return false }
            let velocity = pan.velocity(in: nil)
            return RecentCredentialDeck.horizontalIntent(x: velocity.x, y: velocity.y)
        }
    }
}
