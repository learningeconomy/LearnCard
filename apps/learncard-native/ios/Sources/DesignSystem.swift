import SwiftUI
import LearnCardNativeSDK
import LearnCardNativeCore

/// Shared native rhythm. Typography scales with Dynamic Type, never screenshot pixels.
enum NativeLayout {
    static let pageInset: CGFloat = 20
    static let sectionGap: CGFloat = 24
    static let rowGap: CGFloat = 14
    static let surfaceRadius: CGFloat = 24
}

enum Palette {
    static let ink = Color(light: 0x18224E, dark: 0xEFF0F5)
    static let secondary = Color(light: 0x353E64, dark: 0xC5C8D3)
    static let canvas = Color(uiColor: .systemGroupedBackground)
    static let surface = Color(uiColor: .secondarySystemGroupedBackground)
    static let paper = Color(light: 0xEFF0F5, dark: 0x11151C)
    // Neutral page canvases let the Colorful artwork and category panels stand out.
    // Source: learn-card-app/src/theme/schemas/colorful/theme.json + tailwind.config.js.
    static let collectionCanvas = paper
    static let appsCanvas = paper
    static let familiesCanvas = paper
    static let familyDetailCanvas = familiesCanvas
    static let homeCanvas = paper
    static let selection = ink
    static let selectionInk = Color(light: 0xFFFFFF, dark: 0x18224E)
    static let cyanCard = Color(hex: 0x22D3EE) // Experiences: cyan-401
    static let blueCard = Color(hex: 0x93C5FD) // Badges / IDs: blue-300
    static let pinkCard = Color(hex: 0xF9A8D4) // Achievements: pink-300
    static let qualificationCard = Color(hex: 0xFDBA74) // Qualifications: orange-300
    static let otherCard = Color(hex: 0xE2E3E9)
    static let lilacCard = Color(hex: 0xC4B5FD) // Assistance / Skills: violet-300
    static let limeCard = Color(hex: 0xBEF264) // AI Insights: lime-300
    static let studiesCard = Color(hex: 0x34D399) // Studies: emerald-401
    static let portfolioCard = Color(hex: 0xFDE047) // Portfolio: yellow-300
    static let familyCard = Color(hex: 0xFBBF24) // Families: amber-400
    static let tealCard = Color(hex: 0x5EEAD4) // AI Pathways: teal-300
    static let topicCard = Color(hex: 0x67E8F9) // AI Topics: cyan-301
    static let cardInk = Color(red: 24 / 255, green: 34 / 255, blue: 78 / 255)
    static let cardSecondary = Color(red: 53 / 255, green: 62 / 255, blue: 100 / 255)
    static let inboxCanvas = paper
    static let activityCanvas = homeCanvas
    static let mint = Color(light: 0xECFDF5, dark: 0x14352D)
    static let green = Color(light: 0x047857, dark: 0x6EE7B7)
    static let line = Color(light: 0xE2E3E9, dark: 0x353E64)
    static let errorInk = Color(light: 0xB42338, dark: 0xFF9CB0)
    // LearnCard colorful theme: login green and category pink / emerald / blue.
    static let brandGreen = Color(light: 0x058760, dark: 0x80E0C6)
    static let buttonGreen = Color(red: 4 / 255, green: 120 / 255, blue: 87 / 255)

    static func familyTint(_ color: FamilyColor) -> Color {
        switch color { case .amber: familyCard; case .mint: studiesCard; case .blue: blueCard; case .lilac: lilacCard; case .pink: pinkCard }
    }

    static func categoryTint(_ category: CredentialCategory) -> Color {
        switch category {
        case .achievement: pinkCard
        case .qualification: qualificationCard
        case .badge, .id: blueCard
        case .studies: studiesCard
        case .portfolio: portfolioCard
        case .assistance, .skill: lilacCard
        case .experience: cyanCard
        case .family: familyCard
        case .aiTopic: topicCard
        case .aiPathway: tealCard
        case .aiInsight: limeCard
        case .other: otherCard
        }
    }

    static func categoryAccent(_ category: CredentialCategory) -> Color {
        switch category {
        case .achievement: Color(light: 0xBE185D, dark: 0xF9A8D4)
        case .qualification: Color(light: 0x9A3412, dark: 0xFDBA74)
        case .badge, .id: Color(light: 0x1D4ED8, dark: 0x93C5FD)
        case .studies, .aiPathway: green
        case .portfolio: Color(light: 0xA16207, dark: 0xFDE047)
        case .assistance, .skill: Color(light: 0x5B21B6, dark: 0xC4B5FD)
        case .experience, .aiTopic: Color(light: 0x0E7490, dark: 0x67E8F9)
        case .family: Color(light: 0x92400E, dark: 0xFBBF24)
        case .aiInsight: Color(light: 0x3F6212, dark: 0xBEF264)
        case .other: secondary
        }
    }
}

private extension Color {
    init(hex: UInt32) { self.init(light: hex, dark: hex) }
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
    var fill: Color = Palette.green
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                if loading { ProgressView().tint(Palette.selectionInk) }
                Text(title).font(.body.weight(.semibold))
            }
            .frame(maxWidth: .infinity, minHeight: 54)
            .foregroundStyle(disabled ? Palette.secondary : Palette.selectionInk)
            .background(disabled ? Palette.line : fill, in: RoundedRectangle(cornerRadius: 20))
        }
        .buttonStyle(CredentialPressStyle())
        .disabled(disabled || loading)
        .opacity(disabled ? 0.4 : 1)
    }
}

struct CredentialArtwork: View {
    @Environment(\.locale) private var nativeLocale
    let credential: Credential
    var size: CGFloat = 104
    var raised = false

    var body: some View {
        Group {
            if let url = credential.artworkURL, url.isFileURL, let image = UIImage(contentsOfFile: url.path) {
                Image(uiImage: image).resizable().scaledToFill().frame(width: size, height: size)
            } else if let url = credential.artworkURL {
                AsyncImage(url: url) { phase in
                    if let image = phase.image { image.resizable().scaledToFill().frame(width: size, height: size) }
                    else if phase.error != nil { fallback }
                    else { ProgressView().controlSize(.small).tint(Palette.categoryAccent(credential.displayCategory)).frame(width: size, height: size).background(Palette.paper, in: Circle()) }
                }
            } else { fallback }
        }
        .frame(width: size, height: size)
        .background(Palette.surface.opacity(0.9), in: Circle())
        .clipShape(Circle())
        .overlay {
            if raised {
                Circle().fill(LinearGradient(colors: [.white.opacity(0.28), .clear, Palette.cardInk.opacity(0.06)],
                                            startPoint: .topLeading, endPoint: .bottomTrailing))
                Circle().inset(by: 5).stroke(.white.opacity(0.8), lineWidth: 1.2)
            }
        }
        .overlay(Circle().stroke(LinearGradient(colors: [.white, .white.opacity(0.45)], startPoint: .topLeading, endPoint: .bottomTrailing), lineWidth: raised ? 2 : 1.5))
        .background {
            if raised {
                Circle().fill(Palette.categoryTint(credential.displayCategory))
                    .overlay(Circle().fill(Palette.cardInk.opacity(0.12))).offset(y: 3)
            }
        }
        .shadow(color: Palette.cardInk.opacity(raised ? 0.18 : 0.08), radius: raised ? 8 : 10, x: 0, y: raised ? 7 : 4)
        .accessibilityHidden(true)
    }

    private var fallback: some View {
        Image(credential.displayCategory.illustration).resizable().scaledToFit().padding(size * 0.13)
            .frame(width: size, height: size)
            .background(raised ? Palette.categoryTint(credential.displayCategory).mix(with: .white, by: 0.72) : Palette.categoryTint(credential.displayCategory))
    }
}

extension CredentialCategory {
    var illustration: String {
        switch self {
        case .badge: "CategoryBadge"
        case .achievement: "CategoryAchievement"
        case .qualification: "CategoryQualification"
        case .studies: "CategoryStudies"
        case .portfolio: "CategoryPortfolio"
        case .assistance: "CategoryAssistance"
        case .experience: "CategoryExperience"
        case .id: "CategoryID"
        case .family: "CategoryFamily"
        case .skill: "CategorySkill"
        case .aiTopic: "CategoryTopic"
        case .aiPathway: "CategoryPathway"
        case .aiInsight: "CategoryInsight"
        case .other: "DrawnCredential"
        }
    }
}

extension Credential {
    var categoryTitle: String {
        if displayCategory == .other, let category, !category.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { return category }
        return NativeText.text("credentialCategory.\(displayCategory.rawValue)")
    }
}

struct CredentialCard: View {
    @Environment(\.locale) private var nativeLocale
    let credential: Credential
    var featured = false
    var onWhiteSurface = false
    var showsDisclosure = true
    var animatesPresence = true
    var showsStack = true
    var castsShadow = true
    var reflectionPosition: Double? = nil
    @Environment(\.dynamicTypeSize) private var textSize
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var cardText: Color { onWhiteSurface ? Palette.ink : Palette.cardInk }
    private var cardSecondary: Color { onWhiteSurface ? Palette.secondary : Palette.cardSecondary }

    var body: some View {
        Group {
            if featured && !textSize.isAccessibilitySize {
                HStack(spacing: 18) {
                    CredentialArtwork(credential: credential, size: 116, raised: true)
                    VStack(alignment: .leading, spacing: 18) {
                        identity(featured: true)
                        footer
                    }.frame(maxWidth: .infinity, alignment: .leading)
                }.padding(22).frame(minHeight: 200)
            } else {
                VStack(alignment: .leading, spacing: onWhiteSurface ? 0 : 14) {
                    CredentialArtwork(credential: credential, size: textSize.isAccessibilitySize ? 132 : 98, raised: featured)
                        .frame(maxWidth: .infinity).padding(.vertical, onWhiteSurface ? 18 : 4)
                        .background(onWhiteSurface ? Palette.categoryTint(credential.displayCategory) : .clear)
                    VStack(alignment: .leading, spacing: 14) { identity(featured: false); footer }
                        .padding(onWhiteSurface ? 16 : 0)
                }.padding(onWhiteSurface ? 0 : 16).frame(maxWidth: .infinity, minHeight: textSize.isAccessibilitySize ? 0 : 260, alignment: .topLeading)
            }
        }
        .background {
            if onWhiteSurface { Palette.surface }
            else { CredentialCardSurface(tint: Palette.categoryTint(credential.displayCategory), reflectionPosition: reflectionPosition) }
        }
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .overlay {
            RoundedRectangle(cornerRadius: 24).strokeBorder(
                LinearGradient(colors: [.white.opacity(onWhiteSurface ? 0 : 0.9), .white.opacity(onWhiteSurface ? 0 : 0.25)],
                               startPoint: .topLeading, endPoint: .bottomTrailing), lineWidth: 1.2)
        }
        .background {
            if !onWhiteSurface {
                // One same-color lower edge gives the card thickness without a second card.
                RoundedRectangle(cornerRadius: 24).fill(Palette.categoryTint(credential.displayCategory))
                    .overlay(RoundedRectangle(cornerRadius: 24).fill(Palette.cardInk.opacity(0.17)))
                    .offset(y: featured ? 4 : 2)
            }
        }
        .background {
            if featured && showsStack {
                RoundedRectangle(cornerRadius: 24).fill(credential.displayCategory == .achievement ? Palette.portfolioCard : Palette.pinkCard)
                    .rotationEffect(.degrees(reduceMotion ? 0 : -3)).offset(x: -3, y: 8)
                RoundedRectangle(cornerRadius: 24).fill(credential.displayCategory == .experience || credential.displayCategory == .aiTopic ? Palette.studiesCard : Palette.cyanCard)
                    .rotationEffect(.degrees(reduceMotion ? 0 : 2.5)).offset(x: 2, y: 13)
            }
        }
        .shadow(color: .black.opacity(featured && castsShadow ? 0.06 : 0), radius: 2, x: 0, y: 4)
        .shadow(color: .black.opacity(featured && castsShadow ? 0.16 : 0), radius: 18, x: 0, y: 14)
        .padding(.bottom, featured && showsStack ? 15 : 0)
        .modifier(CardPresenceMotion(enabled: featured && animatesPresence))
        .accessibilityElement(children: .combine)
    }

    private var footer: some View {
        HStack(spacing: 4) {
            Text(credential.categoryTitle)
                .font(.caption2.weight(.semibold)).foregroundStyle(onWhiteSurface ? Palette.cardSecondary : cardSecondary)
                .lineLimit(textSize.isAccessibilitySize ? nil : 1).minimumScaleFactor(0.85)
                .padding(.horizontal, onWhiteSurface ? 9 : 0).padding(.vertical, onWhiteSurface ? 5 : 0)
                .background(onWhiteSurface ? Palette.categoryTint(credential.displayCategory) : .clear, in: Capsule())
            Spacer(minLength: 0)
            if showsDisclosure {
                Image(systemName: "chevron.right").font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(cardText).frame(width: 32, height: 32)
                    .background(onWhiteSurface ? Palette.paper : .white.opacity(0.65), in: Circle()).accessibilityHidden(true)
            }
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
        .onScrollVisibilityChange(threshold: 0.1) { visible = $0 }
        .onDisappear { visible = false }
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
    @ScaledMetric(relativeTo: .largeTitle) private var titleSize = 38.0
    var body: some View {
        Text(NativeText.literal(title)).font(.system(size: titleSize, weight: .bold)).tracking(-0.8).foregroundStyle(Palette.ink)
            .accessibilityAddTraits(.isHeader)
            .accessibilityIdentifier("page-title-\(identifier ?? title.lowercased())")
    }
}

extension View {
    func subtleEntrance() -> some View { modifier(SubtleEntrance()) }
    @ViewBuilder func credentialZoom(id: String, namespace: Namespace.ID, reduceMotion: Bool) -> some View {
        if reduceMotion { self }
        else { self.navigationTransition(.zoom(sourceID: id, in: namespace)) }
    }
}

/// One short arrival transition. No looping, scroll scrubbing or offscreen timers.
private struct SubtleEntrance: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var appeared = false
    func body(content: Content) -> some View {
        content.opacity(appeared || reduceMotion ? 1 : 0)
            .offset(y: appeared || reduceMotion ? 0 : 6)
            .onAppear { withAnimation(reduceMotion ? nil : .easeOut(duration: 0.24)) { appeared = true } }
    }
}

struct LearnCardBrand: View {
    @Environment(\.locale) private var nativeLocale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var textSize
    var compact = false
    var section = "Passport"
    private var sectionTitle: String { section == "Inbox" ? NativeText.text("nav.inbox.short") : NativeText.literal(section) }
    var body: some View {
        HStack(spacing: 8) {
            Image("LearnCardPaintedMark").resizable().scaledToFit().frame(width: 36, height: 36)
                .accessibilityHidden(true)
            if !textSize.isAccessibilitySize {
                ZStack(alignment: .leading) {
                    Text("LearnCard").font(.system(size: 20, weight: .bold)).tracking(-0.6)
                        .opacity(compact ? 0 : 1).accessibilityHidden(compact)
                    Text(sectionTitle).font(.system(size: 18, weight: .semibold))
                        .opacity(compact ? 1 : 0).accessibilityHidden(!compact)
                }.foregroundStyle(Palette.ink).lineLimit(1).frame(width: 110, alignment: .leading)
            }
        }.frame(width: textSize.isAccessibilitySize ? 36 : 154, height: 44, alignment: .leading)
            .fixedSize(horizontal: true, vertical: false)
            .animation(reduceMotion ? nil : .easeInOut(duration: 0.22), value: compact)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(compact ? NativeText.literal(section) : "LearnCard")
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
