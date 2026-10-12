import SwiftUI
import LearnCardNativeCore

struct RootView: View {
    @Bindable var store: AppStore
    var account: AccountController? = nil
    @State private var showReceive = false
    @State private var showCreate = false
    @State private var showAccount = false
    @State private var offer: Credential?
    @State private var receivedOffer: Credential?
    @State private var selectedTab = 0
    @State private var compactBrand = false

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                CollectionView(store: store, onScrollStateChange: { compactBrand = $0 })
                    .toolbar {
                        ToolbarItem(placement: .topBarLeading) { LearnCardBrand(compact: compactBrand) }
                        ToolbarItem(placement: .topBarTrailing) {
                            Button { showCreate = true } label: {
                                Image(systemName: "plus").font(.body.weight(.semibold))
                                    .foregroundStyle(Palette.selection).frame(width: 36, height: 36)
                                    .background(Palette.selection.opacity(0.1), in: Circle())
                            }.accessibilityLabel("Create").accessibilityIdentifier("create")
                        }
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("Account", systemImage: "person.crop.circle") { showAccount = true }
                                .labelStyle(.iconOnly)
                        }
                    }
            }
            .tabItem { Label { Text("Collection") } icon: { Image(selectedTab == 0 ? "CollectionTabActive" : "CollectionTab").renderingMode(.original) } }
            .tag(0)
            NavigationStack { InboxView(store: store, selectedOffer: $offer) }
                .tabItem { Label { Text("Inbox") } icon: { Image(selectedTab == 1 ? "InboxTabActive" : "InboxTab").renderingMode(.original) } }
                .badge(store.snapshot?.offers.count ?? 0)
                .tag(1)
            NavigationStack { AppsView() }
                .tabItem { Label { Text("Apps") } icon: { Image(selectedTab == 2 ? "AppsTabActive" : "AppsTab").renderingMode(.original) } }
                .tag(2)
            NavigationStack {
                HomeView(store: store, profileName: account?.state?.profileName,
                         openInbox: { selectedTab = 1 }, create: { showCreate = true },
                         receive: { showReceive = true })
            }
                .tabItem { Label { Text("Home") } icon: { Image(selectedTab == 3 ? "HomeTabActive" : "HomeTab").renderingMode(.original) } }
                .tag(3)
        }
        .task { if store.snapshot == nil { await store.refresh() } }
        .sheet(isPresented: $showReceive, onDismiss: {
            offer = receivedOffer
            receivedOffer = nil
        }) { ReceiveView(store: store, selectedOffer: $receivedOffer) }
        .sheet(isPresented: $showCreate) { CreateView(store: store) }
        .sheet(isPresented: $showAccount) { AccountView(account: account) }
        .sheet(item: $offer) { CredentialDetailView(store: store, credential: $0, isOffer: true) }
        .alert("Something went wrong", isPresented: Binding(get: { store.error != nil }, set: { if !$0 { store.error = nil } })) {
            Button("Done", role: .cancel) { store.error = nil }
        } message: { Text(store.error ?? "Please try again.") }
        .alert("Done", isPresented: Binding(get: { store.notice != nil }, set: { if !$0 { store.notice = nil } })) {
            Button("Done", role: .cancel) { store.notice = nil }
        } message: { Text(store.notice ?? "") }
        .onOpenURL { url in
            guard !store.isLive else { store.error = "Open Inbox to review credentials sent to this account."; return }
            Task {
                do {
                    let link = try DemoClaimLink(url: url)
                    if store.snapshot == nil { await store.refresh() }
                    guard let match = store.snapshot?.offers.first(where: { $0.id == link.offerID }) else {
                        store.error = ClientError.offerUnavailable.errorDescription
                        return
                    }
                    offer = match
                } catch { store.error = ClientError.unsupportedLink.errorDescription }
            }
        }
    }

}

private struct AccountView: View {
    @Environment(\.dismiss) private var dismiss
    var account: AccountController?

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 24) {
                Image(systemName: "person.crop.circle").font(.system(size: 52, weight: .light)).foregroundStyle(Palette.green)
                Text(account?.state?.profileName ?? "A little room to explore.").font(.title.weight(.semibold)).foregroundStyle(Palette.ink)
                Text(account?.email ?? "This experiment uses unsigned samples and resets when you restart.")
                    .foregroundStyle(Palette.secondary)
                if let account {
                    Text("Connected to staging.").font(.subheadline).foregroundStyle(Palette.secondary)
                    Button("Sign Out") { dismiss(); Task { await account.signOut(forget: false) } }.disabled(account.busy)
                    Button("Sign Out and Forget This Device", role: .destructive) {
                        dismiss(); Task { await account.signOut(forget: true) }
                    }.disabled(account.busy)
                }
                Spacer()
            }
            .padding(24)
            .navigationTitle(account == nil ? "About this experiment" : "Your account")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
        .presentationDetents([.medium, .large])
    }
}
