import SwiftUI
import LearnCardNativeSDK

/// Optional credential intake after account setup. Only working native routes are offered.
struct BuildLearnCardView: View {
    @Environment(\.locale) private var nativeLocale
    let receive: (ClaimEntryMode) -> Void
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                PageHeading(title: NativeText.text("build.title"), identifier: "build")
                Image("BuildIllustration").resizable().scaledToFit().frame(height: 170).frame(maxWidth: .infinity).accessibilityHidden(true)
                Text(NativeText.text("build.intro")).font(.title3).foregroundStyle(Palette.secondary)
                VStack(spacing: 0) {
                    action(.scan, title: "claims.title", body: "build.scanBody", symbol: .scan, tint: Palette.cyanCard)
                    Divider().padding(.leading, 74)
                    action(.link, title: "build.link", body: "build.linkBody", symbol: .sharing, tint: Palette.pinkCard)
                    Divider().padding(.leading, 74)
                    action(.photo, title: "build.photo", body: "build.photoBody", symbol: .credential, tint: Palette.portfolioCard)
                }.buttonStyle(CredentialPressStyle()).background(Palette.surface, in: RoundedRectangle(cornerRadius: 26))
                Text(NativeText.text("claims.beforeAdding")).font(.subheadline).foregroundStyle(Palette.secondary)
            }.padding(20).frame(maxWidth: 620).frame(maxWidth: .infinity)
        }.foregroundStyle(Palette.ink).background(Palette.paper).navigationTitle("").navigationBarTitleDisplayMode(.inline)
    }
    private func action(_ mode: ClaimEntryMode, title: String, body: String, symbol: DrawnSymbol, tint: Color) -> some View {
        Button { receive(mode) } label: { DrawnSettingsRow(title: NativeText.text(title), symbol: symbol, tint: tint, subtitle: NativeText.text(body)) }.accessibilityIdentifier("build-\(mode.rawValue)")
    }
}
