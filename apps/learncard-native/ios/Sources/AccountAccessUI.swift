import SwiftUI
import LearnCardNativeSDK

enum AccessRecoveryMethod: String, CaseIterable, Identifiable {
    case email, phrase, backup
    var id: String { rawValue }
    var title: String { NativeText.text("access.method.\(rawValue)") }
    var detail: String { NativeText.text("access.method.\(rawValue).detail") }
    var image: String {
        switch self { case .email: "AccessEmailIllustration"; case .phrase: "DrawnSecurity"; case .backup: "DrawnCollection" }
    }
    var tint: Color {
        switch self { case .email: Palette.blueCard; case .phrase: Palette.pinkCard; case .backup: Palette.portfolioCard }
    }
}

struct AccessRecoveryMethodSheet: View {
    @Binding var method: AccessRecoveryMethod
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    PageHeading(title: NativeText.text("access.chooseMethod"), identifier: "recovery-method")
                    Text(NativeText.text("access.chooseMethod.detail")).font(.body).foregroundStyle(Palette.secondary)
                    VStack(spacing: 12) {
                        ForEach(AccessRecoveryMethod.allCases) { choice in
                            Button { method = choice; dismiss() } label: {
                                HStack(spacing: 14) {
                                    Image(choice.image).resizable().scaledToFit().padding(9).frame(width: 48, height: 48)
                                        .background(choice.tint, in: RoundedRectangle(cornerRadius: 14)).accessibilityHidden(true)
                                    VStack(alignment: .leading, spacing: 6) {
                                        Text(choice.title).font(.headline)
                                        Text(choice.detail).font(.subheadline).foregroundStyle(Palette.secondary)
                                    }.frame(maxWidth: .infinity, alignment: .leading)
                                    Image(systemName: method == choice ? "checkmark.circle.fill" : "circle").font(.title3).accessibilityHidden(true)
                                }.padding(16).foregroundStyle(Palette.ink)
                                    .background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                                    .overlay(RoundedRectangle(cornerRadius: 22).stroke(method == choice ? Palette.ink : .clear, lineWidth: 2))
                            }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("recovery-method-\(choice.rawValue)")
                                .accessibilityAddTraits(method == choice ? .isSelected : [])
                        }
                    }
                }.padding(20).frame(maxWidth: 620).frame(maxWidth: .infinity)
            }.background(Palette.paper).accessibilityIdentifier("recovery-method-sheet")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NativeText.literal("Cancel")) { dismiss() }.accessibilityIdentifier("recovery-method-cancel") } }
        }
        .environment(\.locale, NativeLanguage.selected.locale)
        .environment(\.layoutDirection, NativeLanguage.selected.isRightToLeft ? .rightToLeft : .leftToRight)
        #if DEBUG
        .modifier(NativeReviewPreferences())
        #endif
        .presentationDetents([.fraction(0.68), .large]).presentationDragIndicator(.visible).presentationBackground(Palette.paper)
    }
}

struct AccountAccessHero: View {
    let phase: String
    @Environment(\.dynamicTypeSize) private var textSize
    private var signingIn: Bool { ["signIn", "idle"].contains(phase) }
    private var enteringCode: Bool { phase == "code" }
    private var recovering: Bool { ["needs_recovery", "recovery"].contains(phase) }
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            PageHeading(title: NativeText.text(signingIn ? "access.welcome" : enteringCode ? "access.checkEmail" : recovering ? "access.restore" : "access.setup"), identifier: "account-access")
            if signingIn || enteringCode || recovering {
                Image(signingIn ? "AccessPassportIllustration" : enteringCode ? "AccessEmailIllustration" : "AccessRecoveryIllustration")
                    .resizable().scaledToFit().padding(signingIn ? 14 : 0)
                    .frame(maxWidth: .infinity).frame(height: textSize.isAccessibilitySize ? 100 : signingIn ? 190 : 138)
                    .background(signingIn ? Palette.blueCard : .clear, in: RoundedRectangle(cornerRadius: 26))
                    .accessibilityHidden(true).allowsHitTesting(false)
            }
            if signingIn { Text(NativeText.text("access.welcome.detail")).font(.body).foregroundStyle(Palette.secondary) }
        }
    }
}

struct AccountAccessNotice: View {
    let text: String
    var error = false
    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: error ? "exclamationmark.circle" : "qrcode").font(.title3).accessibilityHidden(true)
            Text(text).font(.subheadline).frame(maxWidth: .infinity, alignment: .leading)
        }.foregroundStyle(error ? Palette.errorInk : Palette.ink).padding(16)
            .background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(error ? Palette.errorInk.opacity(0.45) : Palette.line, lineWidth: 1))
            .accessibilityElement(children: .combine)
    }
}
