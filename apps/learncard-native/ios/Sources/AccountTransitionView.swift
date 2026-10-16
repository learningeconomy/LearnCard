import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

enum AccountMotionMode: String {
    case launch, reconnect, locked, sending, verifying, recovering, provider
    var titleKey: String {
        switch self {
        case .launch: "motion.launch.title"
        case .reconnect, .locked: "motion.welcome"
        case .sending: "motion.sending.title"
        case .verifying: "motion.verifying.title"
        case .recovering: "motion.recovery.title"
        case .provider: "oauth.loadingTitle"
        }
    }
    var statusKey: String {
        switch self {
        case .launch: "motion.opening"
        case .reconnect: "motion.connecting"
        case .locked: "motion.locked"
        case .sending: "motion.sending"
        case .verifying: "motion.verifying"
        case .recovering: "motion.recovering"
        case .provider: "oauth.loading"
        }
    }
}

/// Artwork follows the account operation; it never holds readiness or changes authentication.
struct AccountTransitionView: View {
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.accessibilityVoiceOverEnabled) private var voiceOver
    @Environment(\.dynamicTypeSize) private var textSize
    @ScaledMetric(relativeTo: .title) private var wordmarkSize = BrandMotion.wordmarkSize
    let mode: AccountMotionMode
    var busy = true
    var error: String?
    var canSignOut = false
    var hasPendingClaim = false
    var retry: () -> Void = {}
    var signOut: () -> Void = {}
    var scan: () -> Void = {}
    @State private var appeared = false
    @State private var began = Date.now
    private var moves: Bool {
        BrandMotion.isAnimated(visible: appeared, active: scenePhase == .active,
                               reduced: reduceMotion || ProcessInfo.processInfo.arguments.contains("--motion-reduced"), voiceOver: voiceOver)
    }
    var body: some View {
        GeometryReader { bounds in
            TimelineView(.animation(minimumInterval: 1.0 / 30, paused: !moves)) { tick in
                let elapsed = max(0, tick.date.timeIntervalSince(began))
                scene(size: bounds.size, insets: bounds.safeAreaInsets, elapsed: elapsed)
            }
        }.accessibilityIdentifier("account-motion-screen")
            .toolbar(.hidden, for: .navigationBar)
            .onAppear { began = .now; appeared = true }
            .onDisappear { appeared = false }
            .onChange(of: scenePhase) { _, phase in if phase == .active { began = .now } }
    }
    private func scene(size: CGSize, insets: EdgeInsets, elapsed: Double) -> some View {
        let markSize: CGFloat = textSize.isAccessibilitySize ? 144 : min(CGFloat(BrandMotion.markMaxWidth), size.width * CGFloat(BrandMotion.markWidthFraction))
        let top: CGFloat = textSize.isAccessibilitySize ? 24 : max(24, (size.height + insets.top + insets.bottom) * CGFloat(BrandMotion.markCenterFraction) - insets.top - markSize / 2)
        return ZStack {
            Palette.paper.ignoresSafeArea()
            PigmentBackdrop(elapsed: moves ? elapsed : 0, animated: moves)
                .allowsHitTesting(false).accessibilityHidden(true).ignoresSafeArea()
            ScrollView {
                VStack(spacing: 24) {
                    VStack(spacing: BrandMotion.wordmarkGap) {
                        PaintedMosaic(size: markSize, elapsed: moves ? elapsed : 0, animated: moves)
                            .frame(height: markSize)
                            .accessibilityElement(children: .ignore).accessibilityLabel("LearnCard")
                            .accessibilityAddTraits(.isImage).accessibilityIdentifier("brand-motion-mark")
                        Text("LearnCard").font(.system(size: wordmarkSize, weight: .bold))
                            .foregroundStyle(Palette.ink).accessibilityHidden(true)
                    }
                    VStack(spacing: 14) {
                        if mode != .launch {
                            Text(NativeText.text(mode.titleKey)).font(.largeTitle.bold()).tracking(-0.8)
                                .foregroundStyle(Palette.ink).multilineTextAlignment(.center).accessibilityAddTraits(.isHeader)
                        }
                        Text(NativeText.text(mode.statusKey)).font(.body).foregroundStyle(Palette.secondary)
                            .multilineTextAlignment(.center).accessibilityIdentifier("account-loading")
                        Text(NativeText.text("motion.longer")).font(.subheadline).foregroundStyle(Palette.secondary)
                            .multilineTextAlignment(.center).opacity(busy && elapsed > 12 ? 1 : 0)
                            .accessibilityHidden(!busy || elapsed <= 12)
                    }.padding(.horizontal, 8).opacity(moves ? min(1, elapsed / 0.4) : 1)
                    if hasPendingClaim {
                        Label(NativeText.text("claims.waitingSignIn"), systemImage: "qrcode")
                            .font(.subheadline).foregroundStyle(Palette.secondary).multilineTextAlignment(.center)
                    }
                    if let error {
                        Label(error, systemImage: "exclamationmark.circle").font(.body).foregroundStyle(Palette.ink)
                            .padding(16).frame(maxWidth: .infinity).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                            .accessibilityIdentifier("account-error")
                    }
                    if !busy && (mode == .locked || error != nil) {
                        PrimaryButton(title: NativeText.text(error == nil ? "common.continue" : "motion.retry"), action: retry)
                            .accessibilityIdentifier("resume-saved-account")
                        if !hasPendingClaim {
                            Button(NativeText.text("claims.title"), action: scan).frame(minHeight: 44).accessibilityIdentifier("signed-out-scan")
                        }
                    }
                    Spacer(minLength: 32)
                    if canSignOut {
                        Button(NativeText.literal("Sign out"), action: signOut)
                            .font(.subheadline.weight(.medium)).foregroundStyle(Palette.secondary).frame(minHeight: 44)
                            .accessibilityIdentifier("account-sign-out")
                    } else { Color.clear.frame(height: 44).accessibilityHidden(true) }
                }.frame(maxWidth: 480).padding(.horizontal, 28).padding(.top, top).padding(.bottom, 24)
                    .frame(maxWidth: .infinity, minHeight: size.height, alignment: .top)
            }.scrollBounceBehavior(.basedOnSize)
        }
    }
}

struct PaintedMosaic: View {
    let size: CGFloat
    var elapsed = 3.0
    var animated = false
    var body: some View {
        ZStack {
            ForEach(0..<9) { index in
                let pose = BrandMotion.tile(index, elapsed: elapsed, animated: animated)
                PigmentTile(index: index)
                    .frame(width: size * (23.0 / 65.0), height: size * (23.0 / 65.0))
                    .scaleEffect(pose.scale).rotationEffect(.degrees(pose.rotation))
                    .offset(x: pose.x * size, y: pose.y * size).opacity(pose.opacity)
            }
        }.frame(width: size, height: size).environment(\.layoutDirection, .leftToRight)
    }
}

private struct PigmentBackdrop: View {
    let elapsed: Double
    let animated: Bool
    var body: some View {
        GeometryReader { size in
            ForEach(BrandMotion.backdrop.indices, id: \.self) { index in
                let block = BrandMotion.backdrop[index]
                let pose = BrandMotion.background(index, elapsed: elapsed, animated: animated)
                PigmentTile(index: block.color)
                    .frame(width: block.size, height: block.size)
                    .rotationEffect(.degrees(pose.rotation))
                    .position(x: size.size.width * pose.x, y: size.size.height * pose.y)
                    .opacity(BrandMotion.backdropOpacity)
            }
        }
    }
}

private struct PigmentTile: View {
    let index: Int
    var body: some View {
        Image("PaintBlock\(index)").resizable().scaledToFit()
            .overlay {
                if index != 4 {
                    Image("PaintPigment").resizable().scaledToFill().rotationEffect(.degrees(Double(index % 4) * 90))
                        .opacity(0.2).blendMode(.multiply)
                        .mask { Image("PaintBlock\(index)").resizable().scaledToFit() }
                }
            }.compositingGroup()
    }
}

#if DEBUG
struct AccountMotionReviewView: View {
    let mode: AccountMotionMode
    var body: some View {
        AccountTransitionView(mode: mode, busy: mode != .locked, canSignOut: mode != .launch)
    }
}
#endif
