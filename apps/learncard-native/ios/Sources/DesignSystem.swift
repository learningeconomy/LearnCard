import SwiftUI
import LearnCardNativeSDK
import LearnCardNativeCore

enum Palette {
    static let ink = Color(light: 0x18224E, dark: 0xEFF0F5)
    static let secondary = Color(light: 0x52597A, dark: 0xC5C8D3)
    static let canvas = Color(uiColor: .systemGroupedBackground)
    static let surface = Color(uiColor: .secondarySystemGroupedBackground)
    static let paper = Color(light: 0xF7F8FA, dark: 0x11151C)
    static let selection = Color(light: 0x0969FF, dark: 0x3ED9ED)
    static let selectionInk = Color(light: 0xFFFFFF, dark: 0x18224E)
    static let cyanCard = Color(light: 0xA6F5ED, dark: 0x59E6DF)
    static let blueCard = Color(light: 0xBCE6FF, dark: 0x4B83F5)
    static let pinkCard = Color(light: 0xFFC5E0, dark: 0xF579B8)
    static let cardInk = Color(red: 24 / 255, green: 34 / 255, blue: 78 / 255)
    static let cardSecondary = Color(red: 53 / 255, green: 62 / 255, blue: 100 / 255)
    static let inboxCanvas = paper
    static let activityCanvas = paper
    static let mint = Color(light: 0xECFDF5, dark: 0x14352D)
    static let green = Color(light: 0x047857, dark: 0x6EE7B7)
    static let line = Color(light: 0xE2E3E9, dark: 0x353E64)
    // LearnCard colorful theme: login green and category pink / emerald / blue.
    static let brandGreen = Color(light: 0x058760, dark: 0x80E0C6)
    static let buttonGreen = Color(red: 4 / 255, green: 120 / 255, blue: 87 / 255)

    static func categoryTint(_ kind: CredentialKind) -> Color {
        switch kind {
        case .achievement: pinkCard
        case .membership: blueCard
        case .learning: cyanCard
        }
    }

    static func categoryAccent(_ kind: CredentialKind) -> Color {
        switch kind {
        case .achievement: Color(light: 0xBE185D, dark: 0xF9A8D4)
        case .membership: Color(light: 0x1D4ED8, dark: 0x93C5FD)
        case .learning: green
        }
    }
}

private extension Color {
    init(light: UInt32, dark: UInt32) {
        self.init(uiColor: UIColor { traits in
            let hex = traits.userInterfaceStyle == .dark ? dark : light
            return UIColor(red: CGFloat((hex >> 16) & 255) / 255,
                           green: CGFloat((hex >> 8) & 255) / 255,
                           blue: CGFloat(hex & 255) / 255, alpha: 1)
        })
    }
}

struct PrimaryButton: View {
    @Environment(\.locale) private var nativeLocale
    let title: String
    var loading = false
    var disabled = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                if loading { ProgressView().tint(.white) }
                Text(title).font(.body.weight(.semibold))
            }
            .frame(maxWidth: .infinity, minHeight: 54)
            .foregroundStyle(.white)
            .background(Palette.buttonGreen, in: RoundedRectangle(cornerRadius: 20))
        }
        .buttonStyle(.plain)
        .disabled(disabled || loading)
        .opacity(disabled ? 0.4 : 1)
    }
}

struct CredentialArtwork: View {
    @Environment(\.locale) private var nativeLocale
    let credential: Credential
    var size: CGFloat = 104

    var body: some View {
        Group {
            if let url = credential.artworkURL, url.isFileURL, let image = UIImage(contentsOfFile: url.path) {
                Image(uiImage: image).resizable().scaledToFill().frame(width: size, height: size)
            } else if let url = credential.artworkURL {
                AsyncImage(url: url) { phase in
                    if let image = phase.image { image.resizable().scaledToFill().frame(width: size, height: size) }
                    else if phase.error != nil { fallback }
                    else { ProgressView().controlSize(.small).tint(Palette.categoryAccent(credential.kind)).frame(width: size, height: size).background(Palette.paper, in: Circle()) }
                }
            } else { fallback }
        }
        .frame(width: size, height: size)
        .background(Palette.surface.opacity(0.9), in: Circle())
        .clipShape(Circle())
        .overlay(Circle().stroke(.white.opacity(0.65), lineWidth: 3))
        .shadow(color: Palette.categoryAccent(credential.kind).opacity(0.12), radius: 15, x: 0, y: 8)
        .accessibilityHidden(true)
    }

    private var fallback: some View {
        Image(systemName: credential.kind.symbol)
            .font(.system(size: size * 0.36, weight: .light))
            .foregroundStyle(Palette.categoryAccent(credential.kind))
    }
}

struct CredentialCard: View {
    @Environment(\.locale) private var nativeLocale
    let credential: Credential
    var featured = false
    var onWhiteSurface = false
    @Environment(\.dynamicTypeSize) private var textSize
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var cardText: Color { onWhiteSurface ? Palette.ink : Palette.cardInk }
    private var cardSecondary: Color { onWhiteSurface ? Palette.secondary : Palette.cardSecondary }

    var body: some View {
        Group {
            if featured && !textSize.isAccessibilitySize {
                HStack(spacing: 18) {
                    CredentialArtwork(credential: credential, size: 116)
                    VStack(alignment: .leading, spacing: 18) {
                        identity(featured: true)
                        footer
                    }.frame(maxWidth: .infinity, alignment: .leading)
                }.padding(22).frame(minHeight: 200)
            } else {
                VStack(alignment: .leading, spacing: 14) {
                    CredentialArtwork(credential: credential, size: textSize.isAccessibilitySize ? 132 : 98)
                        .frame(maxWidth: .infinity).padding(.vertical, 4)
                    identity(featured: false)
                    footer
                }.padding(16).frame(maxWidth: .infinity, minHeight: textSize.isAccessibilitySize ? 0 : 260, alignment: .topLeading)
            }
        }
        .background(onWhiteSurface ? Palette.surface : Palette.categoryTint(credential.kind), in: RoundedRectangle(cornerRadius: 24))
        .background {
            if featured {
                RoundedRectangle(cornerRadius: 24).fill(credential.kind == .membership ? Palette.pinkCard : Palette.blueCard)
                    .rotationEffect(.degrees(reduceMotion ? 0 : -3)).offset(x: -3, y: 8)
                RoundedRectangle(cornerRadius: 24).fill(credential.kind == .learning ? Palette.pinkCard : Palette.cyanCard)
                    .rotationEffect(.degrees(reduceMotion ? 0 : 2.5)).offset(x: 2, y: 13)
            }
        }
        .shadow(color: .black.opacity(featured ? 0.07 : 0), radius: 10, x: 0, y: 7)
        .padding(.bottom, featured ? 15 : 0)
        .modifier(CardPresenceMotion(enabled: featured))
        .accessibilityElement(children: .combine)
    }

    private var footer: some View {
        HStack(spacing: 4) {
            Text(credential.isSample ? "Sample" : credential.kind.rawValue)
                .font(.caption2.weight(.semibold)).foregroundStyle(cardSecondary)
                .lineLimit(textSize.isAccessibilitySize ? nil : 1).minimumScaleFactor(0.85)
            Spacer(minLength: 0)
            Image(systemName: "chevron.right").font(.system(size: 14, weight: .semibold))
                .foregroundStyle(cardText).frame(width: 32, height: 32)
                .background(.white.opacity(0.65), in: Circle()).accessibilityHidden(true)
        }
    }

    private func identity(featured: Bool) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(credential.title).font(featured ? .title3.weight(.semibold) : .headline)
                .foregroundStyle(cardText).lineLimit(textSize.isAccessibilitySize ? nil : featured ? 3 : 2)
                .frame(maxWidth: .infinity, alignment: .leading)
            Text(credential.issuer).font(.caption).foregroundStyle(cardSecondary)
                .lineLimit(textSize.isAccessibilitySize ? nil : 2)
        }
    }
}

/// A gentle featured-card drift. Offscreen, background, and Reduce Motion states are static.
private struct CardPresenceMotion: ViewModifier {
    let enabled: Bool
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase
    @State private var visible = false

    func body(content: Content) -> some View {
        let moves = enabled && !reduceMotion && visible && scenePhase == .active
        TimelineView(.animation(minimumInterval: 1.0 / 24, paused: !moves)) { tick in
            let wave = moves ? sin(tick.date.timeIntervalSinceReferenceDate / 3.5) : 0
            content.rotation3DEffect(.degrees(wave * 1.4), axis: (x: 0, y: 1, z: 0), perspective: 0.4)
        }
        .onAppear { visible = true }.onDisappear { visible = false }
    }
}

struct CredentialPressStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed && !reduceMotion ? 0.975 : 1)
            .opacity(configuration.isPressed ? 0.86 : 1)
            .animation(reduceMotion ? nil : .spring(response: 0.28, dampingFraction: 0.78), value: configuration.isPressed)
    }
}

struct SectionBackground: View {
    @Environment(\.locale) private var nativeLocale
    let tint: Color
    var body: some View {
        tint.ignoresSafeArea()
    }
}

struct PageHeading: View {
    @Environment(\.locale) private var nativeLocale
    let title: String
    var identifier: String? = nil
    var body: some View {
        Text(NativeText.literal(title)).font(.largeTitle.bold()).foregroundStyle(Palette.ink)
            .accessibilityAddTraits(.isHeader)
            .accessibilityIdentifier("page-title-\(identifier ?? title.lowercased())")
    }
}

extension View {
    @ViewBuilder func credentialZoom(id: String, namespace: Namespace.ID, reduceMotion: Bool) -> some View {
        if reduceMotion { self }
        else { self.navigationTransition(.zoom(sourceID: id, in: namespace)) }
    }
}

struct LearnCardBrand: View {
    @Environment(\.locale) private var nativeLocale
    var compact = false
    var body: some View {
        Image("LearnCardMark").resizable().scaledToFit()
            .frame(width: compact ? 28 : 34, height: compact ? 28 : 34)
            .accessibilityLabel("LearnCard")
            .accessibilityIdentifier(compact ? "learncard-brand-compact" : "learncard-brand-full")
    }
}

struct EmptyState: View {
    @Environment(\.locale) private var nativeLocale
    let symbol: String
    let title: String
    let detail: String

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: symbol).font(.system(size: 36, weight: .light)).foregroundStyle(Palette.green)
                .accessibilityHidden(true)
            Text(title).font(.title3.weight(.semibold)).foregroundStyle(Palette.ink)
            Text(detail).font(.subheadline).foregroundStyle(Palette.secondary).multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 56)
        .padding(.horizontal, 24)
    }
}
