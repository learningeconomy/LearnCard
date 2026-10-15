import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

enum AccountMotionMode: String {
    case launch, reconnect, locked, sending, verifying, recovering
    var titleKey: String {
        switch self {
        case .launch: "motion.launch.title"
        case .reconnect, .locked: "motion.welcome"
        case .sending: "motion.sending.title"
        case .verifying: "motion.verifying.title"
        case .recovering: "motion.recovery.title"
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
        }
    }
}

/// Artwork follows the account operation; it never holds readiness or changes authentication.
struct AccountTransitionView: View {
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.accessibilityVoiceOverEnabled) private var voiceOver
    @Environment(\.dynamicTypeSize) private var textSize
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
    private var drawsMotion: Bool {
        BrandMotion.isAnimated(visible: true, active: scenePhase == .active,
                               reduced: reduceMotion || ProcessInfo.processInfo.arguments.contains("--motion-reduced"), voiceOver: voiceOver)
    }
    var body: some View {
        GeometryReader { bounds in
            TimelineView(.animation(minimumInterval: 1.0 / 30, paused: !moves)) { tick in
                let elapsed = max(0, tick.date.timeIntervalSince(began))
                scene(size: bounds.size, elapsed: elapsed)
            }
        }.accessibilityIdentifier("account-motion-screen")
            .toolbar(.hidden, for: .navigationBar)
            .onAppear { began = Date.now.addingTimeInterval(ProcessInfo.processInfo.arguments.contains("--motion-settled") ? -4 : 0); appeared = true }
            .onDisappear { appeared = false }
            .onChange(of: scenePhase) { _, phase in if phase == .active { began = .now } }
    }
    private func scene(size: CGSize, elapsed: Double) -> some View {
        ZStack {
            Palette.paper.ignoresSafeArea()
            PigmentBackdrop(elapsed: moves ? elapsed : 0, animated: moves)
                .allowsHitTesting(false).accessibilityHidden(true).ignoresSafeArea()
            ScrollView {
                VStack(spacing: 24) {
                    Spacer(minLength: 28)
                    PaintedMosaic(size: min(224, size.width * 0.57), elapsed: elapsed, animated: drawsMotion)
                        .frame(height: textSize.isAccessibilitySize ? 250 : min(300, size.height * 0.4))
                        .accessibilityElement(children: .ignore).accessibilityLabel("LearnCard")
                        .accessibilityAddTraits(.isImage).accessibilityIdentifier("brand-motion-mark")
                    VStack(spacing: 14) {
                        Text(NativeText.text(mode.titleKey)).font(.largeTitle.bold()).tracking(-0.8)
                            .foregroundStyle(Palette.ink).multilineTextAlignment(.center).accessibilityAddTraits(.isHeader)
                        Text(NativeText.text(mode.statusKey)).font(.body).foregroundStyle(Palette.secondary)
                            .multilineTextAlignment(.center).accessibilityIdentifier("account-loading")
                        Text(NativeText.text("motion.longer")).font(.subheadline).foregroundStyle(Palette.secondary)
                            .multilineTextAlignment(.center).opacity(busy && elapsed > 12 ? 1 : 0)
                            .accessibilityHidden(!busy || elapsed <= 12)
                    }.padding(.horizontal, 8)
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
                    }
                }.frame(maxWidth: 480).padding(.horizontal, 28).padding(.vertical, 24)
                    .frame(maxWidth: .infinity, minHeight: size.height)
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
                    .frame(width: size * 0.359, height: size * 0.359)
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
            ForEach(0..<8, id: \.self) { index in
                let color = [0,2,7,3,8,1,6,5][index]
                let pose = BrandMotion.background(index, elapsed: elapsed, animated: animated)
                PigmentTile(index: color)
                    .frame(width: index.isMultiple(of: 3) ? 100 : 65, height: index.isMultiple(of: 3) ? 100 : 65)
                    .rotationEffect(.degrees(pose.rotation))
                    .position(x: size.size.width * pose.x, y: size.size.height * pose.y)
                    .opacity(0.8)
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
