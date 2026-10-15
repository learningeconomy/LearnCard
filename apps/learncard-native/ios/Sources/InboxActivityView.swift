import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

struct InboxView: View {
    let store: AppStore
    @Binding var selectedOffer: Credential?
    var onScrollStateChange: (Bool) -> Void = { _ in }
    @State private var scrolled = false
    private var updates: [InboxItem] { store.inbox.updates(excluding: Set((store.snapshot?.offers ?? []).map(\.id))) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                PageHeading(title: "Inbox")
                Text(NativeText.text("inbox.subtitle")).font(.subheadline).foregroundStyle(Palette.secondary)
                if let offers = store.snapshot?.offers, !offers.isEmpty {
                    HStack(spacing: 12) {
                        Image("InboxIllustration").resizable().scaledToFit().frame(width: 100, height: 82).accessibilityHidden(true)
                        VStack(alignment: .leading, spacing: 5) {
                            Text(NativeText.text("inbox.ready")).font(.title3.weight(.bold)).foregroundStyle(Palette.ink)
                            Text(NativeText.count("inbox.waitingCount", offers.count)).font(.subheadline).foregroundStyle(Palette.secondary)
                        }.frame(maxWidth: .infinity, alignment: .leading)
                    }.padding(16).frame(maxWidth: .infinity, alignment: .leading)
                        .background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                    Text(NativeText.text("inbox.waiting")).font(.headline).foregroundStyle(Palette.ink)
                }
                ForEach(store.snapshot?.offers ?? []) { credential in
                    Button { selectedOffer = credential } label: {
                        CredentialListRow(credential: credential)
                    }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("offer-\(credential.id)")
                }
                if !updates.isEmpty {
                    Text(NativeText.text("inbox.updates")).font(.system(.headline, design: .rounded)).foregroundStyle(Palette.ink)
                    ForEach(updates) { item in ConnectionInboxRow(inbox: store.inbox, item: item) }
                }
                if let error = store.inbox.error {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(error).font(.subheadline).foregroundStyle(Palette.ink)
                        Button(NativeText.literal("Try Again")) { Task { await store.inbox.load() } }.disabled(store.inbox.loading)
                    }.padding(16).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
                }
                if store.inbox.metadataPending { Text(NativeText.text("inbox.metadataPending")).font(.caption).foregroundStyle(Palette.secondary) }
                if store.inbox.loading { ProgressView(NativeText.text("inbox.loading")).frame(maxWidth: .infinity).padding(12) }
                if store.inbox.hasMore {
                    Button(NativeText.text("inbox.more")) { Task { await store.inbox.load(more: true) } }
                        .disabled(store.inbox.loading || store.inbox.busyID != nil).frame(maxWidth: .infinity).padding(12)
                }
                if store.snapshot?.offers.isEmpty == true && store.inbox.loaded && updates.isEmpty && store.inbox.error == nil {
                    VStack(spacing: 14) {
                        Image("InboxIllustration").resizable().scaledToFit().frame(width: 160, height: 120).accessibilityHidden(true)
                        Text(NativeText.literal("You're all caught up")).font(.title3.weight(.semibold)).foregroundStyle(Palette.ink)
                        Text(NativeText.text("inbox.empty.detail")).font(.subheadline).foregroundStyle(Palette.secondary)
                    }.multilineTextAlignment(.center).padding(24).frame(maxWidth: .infinity)
                        .background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                } else if store.snapshot == nil {
                    ProgressView(NativeText.text("inbox.loading")).padding(24).frame(maxWidth: .infinity)
                }
            }.padding(20)
        }
        .background(SectionBackground(tint: Palette.inboxCanvas))
        .onScrollGeometryChange(for: Bool.self) { $0.contentOffset.y + $0.contentInsets.top > 60 } action: { _, value in scrolled = value; onScrollStateChange(value) }
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Palette.inboxCanvas, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .task { if !store.inbox.loaded { await store.inbox.load() } }
        .refreshable { await store.refresh(); await store.inbox.load() }
    }
}
