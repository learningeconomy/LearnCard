import SwiftUI
import LearnCardNativeCore

struct InboxView: View {
    let store: AppStore
    @Binding var selectedOffer: Credential?
    @State private var scrolled = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                PageHeading(title: "Inbox")
                Text("Ready when you are. Review before adding to your collection.").font(.subheadline).foregroundStyle(Palette.secondary)
                ForEach(store.snapshot?.offers ?? []) { credential in
                    Button { selectedOffer = credential } label: {
                        HStack(spacing: 14) {
                            CredentialArtwork(credential: credential, size: 64)
                            VStack(alignment: .leading, spacing: 6) {
                                Text(credential.title).font(.headline).foregroundStyle(Palette.ink).multilineTextAlignment(.leading)
                                Text(credential.issuer).font(.caption).foregroundStyle(Palette.secondary).multilineTextAlignment(.leading)
                                Text(credential.kind.rawValue).font(.caption2.weight(.medium)).foregroundStyle(Palette.cardInk)
                                    .padding(.horizontal, 8).padding(.vertical, 4).background(Palette.categoryTint(credential.kind), in: Capsule())
                            }.frame(maxWidth: .infinity, alignment: .leading)
                            Image(systemName: "chevron.right").font(.caption.weight(.semibold)).foregroundStyle(Palette.secondary)
                                .frame(width: 30, height: 30).background(Palette.paper, in: Circle()).accessibilityHidden(true)
                        }.padding(16).frame(maxWidth: .infinity, minHeight: 104)
                            .background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                            .overlay(RoundedRectangle(cornerRadius: 22).stroke(Palette.line.opacity(0.55), lineWidth: 0.5))
                    }.buttonStyle(.plain).accessibilityIdentifier("offer-\(credential.id)")
                }
                if store.snapshot?.offers.isEmpty == true {
                    EmptyState(symbol: "tray", title: "You're all caught up", detail: "New credentials will appear here.")
                }
            }.padding(20)
        }
        .background(SectionBackground(tint: Palette.inboxCanvas))
        .onScrollGeometryChange(for: Bool.self) { $0.contentOffset.y + $0.contentInsets.top > 60 } action: { _, value in scrolled = value }
        .navigationTitle(scrolled ? "Inbox" : "")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Palette.inboxCanvas, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .refreshable { await store.refresh() }
    }
}
