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
                Text("Review what's arrived before adding it to your collection.").font(.subheadline).foregroundStyle(Palette.secondary)
                ForEach(store.snapshot?.offers ?? []) { credential in
                    Button { selectedOffer = credential } label: {
                        VStack(alignment: .leading, spacing: 14) {
                            CredentialCard(credential: credential, onWhiteSurface: true)
                            HStack {
                                Text("Review & add").font(.subheadline.weight(.semibold))
                                Spacer()
                                Image(systemName: "arrow.right")
                            }.foregroundStyle(Palette.green).padding(.horizontal, 20).padding(.bottom, 4)
                        }
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
