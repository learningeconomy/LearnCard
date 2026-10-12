import SwiftUI

enum CollectionAction { case create, send, share }

struct CollectionActionsMenu: View {
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
                Text(title).font(.subheadline.weight(.medium)).foregroundStyle(Palette.ink)
                Spacer(minLength: 0)
            }.padding(.horizontal, 6).frame(minHeight: 52).contentShape(Rectangle())
        }.buttonStyle(CredentialPressStyle())
    }
}

struct NativeTabTray: View {
    @Binding var selection: Int
    let inboxCount: Int
    private let names = ["Collection", "Inbox", "Apps", "Home"]
    private let icons = ["CollectionTab", "InboxTab", "AppsTab", "HomeTab"]
    var body: some View {
        HStack(spacing: 0) {
            ForEach(0..<4) { tab in
                Button { selection = tab } label: {
                    VStack(spacing: 4) {
                        Image(icons[tab] + (selection == tab ? "Active" : ""))
                            .resizable().scaledToFit().frame(width: 28, height: 28)
                            .overlay(alignment: .topTrailing) {
                                if tab == 1 && inboxCount > 0 {
                                    Text(inboxCount > 99 ? "99+" : "\(inboxCount)").font(.system(size: 9, weight: .bold)).foregroundStyle(.white)
                                        .padding(.horizontal, 4).frame(minWidth: 16, minHeight: 16)
                                        .background(Color.red, in: Capsule()).offset(x: 8, y: -3).accessibilityHidden(true)
                                }
                            }.accessibilityHidden(true)
                        Text(names[tab]).font(.caption2.weight(selection == tab ? .semibold : .regular))
                            .foregroundStyle(selection == tab ? Palette.selection : Palette.secondary)
                    }.frame(maxWidth: .infinity, minHeight: 60).contentShape(Rectangle())
                }.buttonStyle(.plain).accessibilityLabel(names[tab])
                    .accessibilityValue(tab == 1 && inboxCount > 0 ? "\(inboxCount) to review" : "")
                    .accessibilityAddTraits(selection == tab ? .isSelected : [])
                    .accessibilityIdentifier("nav-\(names[tab].lowercased())")
            }
        }.padding(.top, 5).padding(.horizontal, 8)
            .background(Palette.surface.ignoresSafeArea(edges: .bottom))
            .overlay(alignment: .top) { Rectangle().fill(Palette.line.opacity(0.6)).frame(height: 0.5) }
            .accessibilityElement(children: .contain).accessibilityLabel("Bottom navigation")
    }
}
