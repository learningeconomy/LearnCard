import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

/// Static material for app chrome. Publisher artwork is never tinted or relit.
struct AppRaisedPanel: View {
    @Environment(\.colorScheme) private var scheme
    var accent: Color = Palette.blueCard
    var colorful = false
    var radius: CGFloat = NativeLayout.surfaceRadius

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)
        shape.fill(colorful ? accent : Palette.line).offset(y: 3)
            .overlay {
                ZStack {
                    if colorful { CredentialCardSurface(tint: accent) }
                    else {
                        Palette.surface
                        LinearGradient(colors: [accent.opacity(scheme == .dark ? 0.12 : 0.22), .clear],
                                       startPoint: .topLeading, endPoint: .bottomTrailing)
                        AppCornerLines().stroke(accent.opacity(scheme == .dark ? 0.25 : 0.32), lineWidth: 1)
                    }
                }.clipShape(shape)
                    .overlay(shape.strokeBorder(.white.opacity(scheme == .dark ? 0.08 : 0.7), lineWidth: 1))
            }
            .shadow(color: .black.opacity(scheme == .dark ? 0.16 : 0.07), radius: 9, x: 0, y: 7)
            .accessibilityHidden(true).allowsHitTesting(false)
    }
}

private struct AppCornerLines: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        for radius in [CGFloat(28), 37] {
            path.addArc(center: CGPoint(x: rect.maxX, y: rect.minY), radius: radius,
                        startAngle: .degrees(90), endAngle: .degrees(180), clockwise: false)
        }
        return path
    }
}

struct AppsEmptyCard: View {
    @Environment(\.dynamicTypeSize) private var textSize
    let discover: () -> Void
    var body: some View {
        (textSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: 12)) : AnyLayout(HStackLayout(spacing: 8))) {
            Image("AppsLaunchIllustration").resizable().scaledToFit()
                .frame(width: textSize.isAccessibilitySize ? 92 : 118, height: textSize.isAccessibilitySize ? 92 : 154)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 12) {
                Text(NativeText.text("apps.empty")).font(.title2.bold()).foregroundStyle(Palette.cardInk)
                Text(NativeText.text("apps.emptyBody")).font(.subheadline).foregroundStyle(Palette.cardSecondary)
                Button(action: discover) {
                    HStack(spacing: 6) {
                        Text(NativeText.text("apps.discoverAction")).font(.subheadline.weight(.semibold))
                        Image(systemName: "chevron.forward").font(.caption.bold()).accessibilityHidden(true)
                    }.padding(.horizontal, 16).padding(.vertical, 13).frame(minHeight: 48)
                        .foregroundStyle(.white).background(Palette.cardInk, in: RoundedRectangle(cornerRadius: 16))
                }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("apps-empty-discover")
            }.frame(maxWidth: .infinity, alignment: .leading)
        }.padding(18).frame(maxWidth: .infinity, alignment: .leading)
            .background(AppRaisedPanel(accent: Palette.tealCard, colorful: true))
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier("apps-empty")
    }
}

struct AppsNoResultsCard: View {
    let canClear: Bool
    let clear: () -> Void
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(NativeText.text("apps.noResults")).font(.title3.bold()).foregroundStyle(Palette.ink)
            Text(NativeText.text("apps.noResultsBody")).font(.subheadline).foregroundStyle(Palette.secondary)
            if canClear {
                Button(NativeText.text("apps.clearSearch"), action: clear).font(.body.weight(.semibold))
                    .foregroundStyle(Palette.selection).frame(minHeight: 44).accessibilityIdentifier("apps-clear-search")
            }
        }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
            .background(Palette.surface, in: RoundedRectangle(cornerRadius: NativeLayout.surfaceRadius))
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier("apps-no-results")
    }
}

struct AppsDiscoverRow: View {
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image("AppsLaunchIllustration").resizable().scaledToFit().frame(width: 48, height: 48).accessibilityHidden(true)
                Text(NativeText.text("apps.discoverMore")).font(.headline).foregroundStyle(Palette.ink)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Image(systemName: "chevron.forward").font(.subheadline).foregroundStyle(Palette.secondary).accessibilityHidden(true)
            }.padding(16).frame(minHeight: 76).contentShape(Rectangle())
                .background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
        }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("apps-discover-more")
    }
}

struct ConsumerAppRow: View {
    @Environment(\.dynamicTypeSize) private var textSize
    let app: ConsumerApp
    let installed: Bool
    let busy: Bool
    let opening: Bool
    let detail: () -> Void
    let open: () -> Void
    @ScaledMetric(relativeTo: .headline) private var titleSize = 20.0

    var body: some View {
        (textSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: 12)) : AnyLayout(HStackLayout(spacing: 12))) {
            Button(action: detail) {
                HStack(alignment: .top, spacing: 14) {
                    ConsumerAppIcon(url: app.iconURL, title: app.title, size: textSize.isAccessibilitySize ? 54 : 72)
                    VStack(alignment: .leading, spacing: 6) {
                        Text(app.title).font(.system(size: titleSize, weight: .bold)).foregroundStyle(Palette.ink)
                        Text(app.tagline).font(.subheadline).foregroundStyle(Palette.secondary)
                    }.frame(maxWidth: .infinity, alignment: .leading)
                }.frame(maxWidth: .infinity, alignment: .leading).contentShape(Rectangle())
            }.multilineTextAlignment(.leading).accessibilityIdentifier("app-\(app.id)")
            if installed {
                Button(action: open) {
                    HStack(spacing: 6) {
                        if opening { ProgressView().tint(Palette.selection) }
                        Text(NativeText.text(opening ? "apps.opening" : "apps.open"))
                    }.font(.subheadline.weight(.semibold)).foregroundStyle(Palette.selection)
                        .padding(.horizontal, 16).padding(.vertical, 10).frame(minHeight: 44)
                        .background(Palette.surface, in: RoundedRectangle(cornerRadius: 14))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Palette.blueCard.opacity(0.7)))
                }.disabled(busy).accessibilityIdentifier("app-open-\(app.id)")
                    .accessibilityLabel(NativeText.format("apps.openNamed", app.title))
            } else {
                Button(action: detail) {
                    HStack(spacing: 5) {
                        Text(NativeText.text("apps.view")).font(.subheadline.weight(.semibold))
                        Image(systemName: "chevron.forward").font(.caption.bold()).accessibilityHidden(true)
                    }.foregroundStyle(Palette.selection).frame(minHeight: 44)
                }.accessibilityLabel(NativeText.format("apps.viewNamed", app.title))
            }
        }.padding(16).frame(maxWidth: .infinity, alignment: .leading)
            .background(AppRaisedPanel()).buttonStyle(CredentialPressStyle())
    }
}

struct ConsumerFeaturedApp: View {
    @Environment(\.dynamicTypeSize) private var textSize
    let app: ConsumerApp
    var body: some View {
        (textSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: 16)) : AnyLayout(HStackLayout(spacing: 18))) {
            ConsumerAppIcon(url: app.iconURL, title: app.title, size: textSize.isAccessibilitySize ? 64 : 100)
            VStack(alignment: .leading, spacing: 12) {
                Text(app.title).font(.title2.bold()).foregroundStyle(Palette.ink)
                Text(app.tagline).font(.subheadline).foregroundStyle(Palette.secondary)
                HStack(spacing: 8) {
                    Text(NativeText.text("apps.view")).font(.subheadline.weight(.semibold))
                    Image(systemName: "chevron.forward").font(.caption.bold()).accessibilityHidden(true)
                }.padding(.horizontal, 18).padding(.vertical, 13).frame(minHeight: 44)
                    .foregroundStyle(Palette.selectionInk).background(Palette.selection, in: RoundedRectangle(cornerRadius: 16))
            }.frame(maxWidth: .infinity, alignment: .leading)
        }.padding(20).frame(maxWidth: .infinity, alignment: .leading).multilineTextAlignment(.leading)
            .background(AppRaisedPanel(accent: Palette.tealCard))
    }
}
