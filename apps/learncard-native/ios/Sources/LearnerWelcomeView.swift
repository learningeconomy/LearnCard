import SwiftUI
import LearnCardNativeSDK

/// An optional introduction after account setup, also available again from Home.
struct LearnerWelcomeView: View {
    let add: () -> Void
    let explore: () -> Void
    @Environment(\.dynamicTypeSize) private var textSize
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                LearnCardBrand(compact: false, section: "Home").padding(.bottom, 8)
                Text(NativeText.text("learner.welcomeTitle")).font(.largeTitle.bold()).tracking(-0.6)
                    .accessibilityAddTraits(.isHeader).accessibilityIdentifier("learner-welcome")
                Text(NativeText.text("learner.welcomeBody")).font(.title3).foregroundStyle(Palette.secondary)
                Image("LearnerWelcomeIllustration").resizable().scaledToFit()
                    .frame(maxHeight: textSize.isAccessibilitySize ? 110 : 150)
                    .frame(maxWidth: .infinity).accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 16) {
                    benefit("learner.receive", symbol: .credential, tint: Palette.pinkCard)
                    benefit("learner.keep", symbol: .collection, tint: Palette.blueCard)
                    benefit("learner.choose", symbol: .sharing, tint: Palette.portfolioCard)
                }.padding(18).frame(maxWidth: .infinity, alignment: .leading)
                    .background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
            }.padding(20).frame(maxWidth: 620).frame(maxWidth: .infinity)
        }.background(Palette.paper).foregroundStyle(Palette.ink)
            .safeAreaInset(edge: .bottom, spacing: 0) {
                VStack(spacing: 6) {
                    PrimaryButton(title: NativeText.text("learner.firstAdd"), fill: Palette.selection, action: add)
                        .accessibilityIdentifier("learner-welcome-add")
                    Button(NativeText.text("learner.explore"), action: explore).font(.body.weight(.semibold))
                        .frame(maxWidth: .infinity, minHeight: 48).accessibilityIdentifier("learner-welcome-explore")
                }.padding(.horizontal, 24).padding(.vertical, 12).frame(maxWidth: 620).frame(maxWidth: .infinity)
                    .background(Palette.surface)
            }
            .environment(\.locale, NativeLanguage.selected.locale)
            .environment(\.layoutDirection, NativeLanguage.selected.isRightToLeft ? .rightToLeft : .leftToRight)
    }
    private func benefit(_ key: String, symbol: DrawnSymbol, tint: Color) -> some View {
        HStack(spacing: 14) {
            DrawnTile(symbol: symbol, tint: tint, size: 42)
            Text(NativeText.text(key)).font(.body.weight(.medium))
        }
    }
}

/// Choosing a route does not request camera access or change a pending claim.
struct LearnerIntakeSheet: View {
    let select: (ClaimEntryMode) -> Void
    let tool: (CollectionAction) -> Void
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text(NativeText.text("learner.addTitle")).font(.largeTitle.bold()).tracking(-0.6)
                        .accessibilityAddTraits(.isHeader).accessibilityIdentifier("learner-intake")
                    Text(NativeText.text("learner.addBody")).font(.title3).foregroundStyle(Palette.secondary)
                    Image("LearnerAddIllustration").resizable().scaledToFit().frame(height: 125)
                        .frame(maxWidth: .infinity).accessibilityHidden(true)
                    VStack(spacing: 4) {
                        route(.scan, title: "claims.title", body: "build.scanBody", symbol: .scan, tint: Palette.cyanCard)
                        route(.link, title: "build.link", body: "build.linkBody", symbol: .sharing, tint: Palette.pinkCard)
                        route(.photo, title: "build.photo", body: "build.photoBody", symbol: .credential, tint: Palette.portfolioCard)
                    }
                    Text(NativeText.text("claims.beforeAdding")).font(.subheadline).foregroundStyle(Palette.secondary)
                    NavigationLink {
                        ScrollView {
                            VStack(alignment: .leading, spacing: 20) {
                                PageHeading(title: NativeText.text("learner.tools"), identifier: "credential-tools")
                                CollectionActionsMenu(select: tool)
                            }.padding(20)
                        }.background(Palette.paper).navigationBarTitleDisplayMode(.inline)
                    } label: {
                        Label(NativeText.text("learner.tools"), systemImage: "ellipsis.circle")
                            .font(.body.weight(.medium)).frame(minHeight: 44)
                    }.accessibilityIdentifier("learner-more-tools")
                }.padding(24).frame(maxWidth: 620).frame(maxWidth: .infinity)
            }.background(Palette.paper).foregroundStyle(Palette.ink)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NativeText.text("common.cancel")) { dismiss() } } }
        }.environment(\.locale, NativeLanguage.selected.locale)
            .environment(\.layoutDirection, NativeLanguage.selected.isRightToLeft ? .rightToLeft : .leftToRight)
            .presentationDetents([.large]).presentationDragIndicator(.visible)
    }
    private func route(_ mode: ClaimEntryMode, title: String, body: String, symbol: DrawnSymbol, tint: Color) -> some View {
        Button { select(mode) } label: {
            DrawnSettingsRow(title: NativeText.text(title), symbol: symbol, tint: tint, subtitle: NativeText.text(body))
        }.buttonStyle(CredentialPressStyle()).padding(.vertical, 3)
            .background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
            .accessibilityIdentifier("learner-intake-\(mode.rawValue)")
    }
}
