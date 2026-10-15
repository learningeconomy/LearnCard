import SwiftUI
import LearnCardNativeSDK
import LearnCardNativeCore

enum CollectionAction { case create, send, share }

struct CollectionActionsMenu: View {
    @Environment(\.locale) private var nativeLocale
    let select: (CollectionAction) -> Void
    var body: some View {
        VStack(spacing: 2) {
            row("Create new", symbol: "plus", tint: Palette.blueCard, action: .create)
            row("Send existing creation", symbol: "paperplane", tint: Palette.cyanCard, action: .send)
            row("Share credentials", symbol: "square.and.arrow.up", tint: Palette.pinkCard, action: .share)
        }.padding(10).frame(width: 282).background(Palette.surface)
    }
    private func row(_ title: String, symbol: String, tint: Color, action: CollectionAction) -> some View {
        Button { select(action) } label: {
            HStack(spacing: 12) {
                Image(systemName: symbol).font(.system(size: 17, weight: .medium)).foregroundStyle(Palette.cardInk)
                    .frame(width: 36, height: 36).background(tint, in: Circle()).accessibilityHidden(true)
                Text(NativeText.literal(title)).font(.subheadline.weight(.medium)).foregroundStyle(Palette.ink)
                Spacer(minLength: 0)
            }.padding(.horizontal, 6).frame(minHeight: 52).contentShape(Rectangle())
        }.buttonStyle(CredentialPressStyle())
    }
}

struct NativeTabTray: View {
    @Environment(\.locale) private var nativeLocale
    @Binding var selection: Int
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Namespace private var highlight
    @State private var availableWidth: CGFloat = 0
    @ScaledMetric(relativeTo: .footnote) private var labelSize = 14.0
    let inboxCount: Int
    private let names = ["Collection", "Inbox", "Apps", "Home"]
    private let icons = ["CollectionTab", "InboxTab", "AppsTab", "HomeTab"]
    private var metrics: NavigationMetrics { NavigationMetrics(availableWidth: availableWidth) }
    var body: some View {
        HStack(spacing: 0) {
            ForEach(0..<4) { tab in
                Button { selection = tab } label: {
                    VStack(spacing: 4) {
                        Image(icons[tab] + (selection == tab ? "Active" : ""))
                            .resizable().scaledToFit().frame(width: metrics.iconSize, height: metrics.iconSize)
                            .overlay(alignment: .topTrailing) {
                                if tab == 1 && inboxCount > 0 {
                                    Text(inboxCount > 99 ? "99+" : "\(inboxCount)").font(.system(size: 9, weight: .bold)).foregroundStyle(.white)
                                        .padding(.horizontal, 4).frame(minWidth: 16, minHeight: 16)
                                        .background(Color.red, in: Capsule()).offset(x: 8, y: -3).accessibilityHidden(true)
                                }
                            }.accessibilityHidden(true)
                        Text(tab == 1 ? NativeText.text("nav.inbox.short") : NativeText.literal(names[tab]))
                            .font(.system(size: min(labelSize, 18), weight: selection == tab ? .semibold : .medium))
                            .lineLimit(2).multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
                            .foregroundStyle(selection == tab ? Palette.selection : Palette.secondary)
                    }.frame(maxWidth: .infinity, minHeight: metrics.minimumItemHeight).contentShape(Rectangle())
                        .overlay(alignment: .bottom) {
                            if selection == tab {
                                Capsule().fill(Palette.selection).frame(width: 32, height: 3)
                                    .matchedGeometryEffect(id: "active-tab", in: highlight)
                            }
                        }
                }.buttonStyle(CredentialPressStyle()).accessibilityLabel(NativeText.literal(names[tab]))
                    .accessibilityValue(tab == 1 && inboxCount > 0 ? "\(inboxCount) to review" : "")
                    .accessibilityAddTraits(selection == tab ? .isSelected : [])
                    .accessibilityIdentifier("nav-\(names[tab].lowercased())")
            }
        }.padding(.top, 6).padding(.bottom, 5).padding(.horizontal, 8)
            .onGeometryChange(for: CGFloat.self) { $0.size.width } action: { availableWidth = $0 }
            .background(Palette.surface.ignoresSafeArea(edges: .bottom))
            .overlay(alignment: .top) { Rectangle().fill(Palette.line.opacity(0.6)).frame(height: 0.5) }
            .animation(reduceMotion ? nil : .spring(response: 0.3, dampingFraction: 0.86), value: selection)
            .sensoryFeedback(.selection, trigger: selection)
            .accessibilityElement(children: .contain).accessibilityLabel("Bottom navigation")
    }
}
