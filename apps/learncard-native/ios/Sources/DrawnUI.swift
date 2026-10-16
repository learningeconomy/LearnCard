import SwiftUI
import LearnCardNativeSDK

enum DrawnSymbol: String {
    case family = "DrawnFamily", sharing = "DrawnSharing", security = "DrawnSecurity"
    case language = "DrawnLanguage", notifications = "DrawnBell", help = "DrawnHelp"
    case signOut = "DrawnSignOut", forget = "DrawnForget", external = "DrawnExternal"
    case credential = "DrawnCredential", add = "DrawnAdd", key = "DrawnKey"
    case collection = "DrawnCollection", pencil = "DrawnPencil"
    case scan = "DrawnScan", people = "DrawnPeople"
}

/// Original vector drawings use navy ink on the Colorful theme's opaque tiles.
struct DrawnTile: View {
    let symbol: DrawnSymbol
    let tint: Color
    var size: CGFloat = 48
    var body: some View {
        Image(symbol.rawValue).resizable().scaledToFit().padding(size * 0.17)
            .frame(width: size, height: size)
            .background(tint, in: RoundedRectangle(cornerRadius: size * 0.25))
            .accessibilityHidden(true)
    }
}

struct DrawnSettingsRow: View {
    let title: String
    let symbol: DrawnSymbol
    let tint: Color
    var subtitle: String? = nil
    var web = false
    var destructive = false
    @ScaledMetric(relativeTo: .headline) private var titleSize = 18.0
    var body: some View {
        HStack(spacing: 14) {
            DrawnTile(symbol: symbol, tint: tint)
            VStack(alignment: .leading, spacing: 4) {
                Text(NativeText.literal(title)).font(.system(size: titleSize, weight: .semibold))
                    .foregroundStyle(destructive ? Palette.errorInk : Palette.ink)
                if let subtitle { Text(subtitle).font(.subheadline).foregroundStyle(Palette.secondary) }
            }.frame(maxWidth: .infinity, alignment: .leading)
            Image(systemName: web ? "arrow.up.right" : "chevron.forward")
                .font(.subheadline.weight(.medium)).foregroundStyle(Palette.secondary).accessibilityHidden(true)
        }.padding(.horizontal, 12).padding(.vertical, 9).frame(minHeight: 68)
            .contentShape(Rectangle()).multilineTextAlignment(.leading)
    }
}

struct IllustratedIntro: View {
    let image: String
    let title: String
    var body: some View {
        HStack(spacing: 14) {
            Image(image).resizable().scaledToFit().frame(width: 100, height: 82).accessibilityHidden(true)
            Text(title).font(.headline).foregroundStyle(Palette.ink).frame(maxWidth: .infinity, alignment: .leading)
        }.padding(16).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
    }
}
