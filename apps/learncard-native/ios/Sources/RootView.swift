import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

struct RootView: View {
    @Environment(\.locale) private var nativeLocale
    @Bindable var store: AppStore
    var account: AccountController? = nil
    @State private var showReceive = false
    @State private var showCreate = false
    @State private var showAccount = false
    @State private var showActions = false
    @State private var requestedAction: CollectionAction?
    @State private var showExisting = false
    @State private var showShare = false
    @State private var offer: Credential?
    @State private var receivedOffer: Credential?
    @State private var selectedTab = 0
    @State private var compactBrand = false
    @State private var showFamilyReview = false

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                CollectionView(store: store, onScrollStateChange: { compactBrand = $0 })
                    .toolbar {
                        ToolbarItem(placement: .topBarLeading) { LearnCardBrand(compact: compactBrand) }
                        ToolbarItem(placement: .topBarTrailing) {
                            Button { showActions = true } label: {
                                Image(systemName: "plus").font(.body.weight(.semibold))
                                    .foregroundStyle(Palette.selection).frame(width: 36, height: 36)
                                    .background(Palette.selection.opacity(0.1), in: Circle())
                            }.accessibilityLabel("Actions").accessibilityIdentifier("create")
                            .popover(isPresented: $showActions, arrowEdge: .top) {
                                CollectionActionsMenu { action in requestedAction = action; showActions = false }
                                    .presentationCompactAdaptation(.popover)
                                    .presentationBackground(Palette.surface)
                                    .onDisappear {
                                        guard let action = requestedAction else { return }
                                        requestedAction = nil
                                        switch action {
                                        case .create: showCreate = true
                                        case .send: showExisting = true
                                        case .share: showShare = true
                                        }
                                    }
                            }
                        }
                        ToolbarItem(placement: .topBarTrailing) {
                            Button(NativeText.literal("Account"), systemImage: "person.crop.circle") { showAccount = true }
                                .labelStyle(.iconOnly)
                        }
                    }
            }
            .tabItem { Label { Text(NativeText.literal("Collection")) } icon: { Image(selectedTab == 0 ? "CollectionTabActive" : "CollectionTab").renderingMode(.original) } }
            .tag(0)
            NavigationStack { InboxView(store: store, selectedOffer: $offer) }
                .tabItem { Label { Text(NativeText.literal("Inbox")) } icon: { Image(selectedTab == 1 ? "InboxTabActive" : "InboxTab").renderingMode(.original) } }
                .badge(store.snapshot?.offers.count ?? 0)
                .tag(1)
            NavigationStack { AppsView(store: store, create: { showCreate = true }, openInbox: { selectedTab = 1 }) }
                .tabItem { Label { Text(NativeText.literal("Apps")) } icon: { Image(selectedTab == 2 ? "AppsTabActive" : "AppsTab").renderingMode(.original) } }
                .tag(2)
            NavigationStack {
                HomeView(store: store, profileName: account?.state?.profileName,
                         openInbox: { selectedTab = 1 }, create: { showCreate = true },
                         receive: { showReceive = true })
            }
                .tabItem { Label { Text(NativeText.literal("Home")) } icon: { Image(selectedTab == 3 ? "HomeTabActive" : "HomeTab").renderingMode(.original) } }
                .tag(3)
        }
        .toolbar(.hidden, for: .tabBar)
        .safeAreaInset(edge: .bottom, spacing: 0) { NativeTabTray(selection: $selectedTab, inboxCount: store.snapshot?.offers.count ?? 0) }
        .task { if store.snapshot == nil { await store.refresh() } }
        .sheet(isPresented: $showReceive, onDismiss: {
            offer = receivedOffer
            receivedOffer = nil
        }) { ReceiveView(store: store, selectedOffer: $receivedOffer) }
        .sheet(isPresented: $showExisting) {
            NavigationStack { CreationsView(store: store, sendOnSelect: true)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NativeText.literal("Done")) { showExisting = false } } } }
        }
        .sheet(isPresented: $showShare) { ShareCredentialsView(store: store) }
        .sheet(isPresented: $showCreate) { CreateView(store: store) }
        .sheet(isPresented: $showAccount) { AccountView(account: account, store: store) }
        .sheet(isPresented: $showFamilyReview) {
            NavigationStack {
                FamiliesView(appStore: store)
                    .toolbar { ToolbarItem(placement: .confirmationAction) { Button(NativeText.text("common.done")) { showFamilyReview = false } } }
            }.presentationDetents([.large])
        }
        .sheet(item: $offer) { CredentialDetailView(store: store, credential: $0, isOffer: true) }
        .alert("Something went wrong", isPresented: Binding(get: { store.error != nil }, set: { if !$0 { store.error = nil } })) {
            Button(NativeText.literal("Done"), role: .cancel) { store.error = nil }
        } message: { Text(store.error ?? "Please try again.") }
        .alert("Done", isPresented: Binding(get: { store.notice != nil }, set: { if !$0 { store.notice = nil } })) {
            Button(NativeText.literal("Done"), role: .cancel) { store.notice = nil }
        } message: { Text(store.notice ?? "") }
        .onAppear {
            #if DEBUG
            if ProcessInfo.processInfo.arguments.contains("--review-families") { showFamilyReview = true }
            #endif
        }
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
