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
    @State private var compactBrands = Array(repeating: false, count: 4)
    @State private var showFamilyReview = false

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                CollectionView(store: store, onScrollStateChange: { compactBrands[0] = $0 })
                    .toolbar { header(tab: 0) }
            }
            .tabItem { Label { Text(NativeText.literal("Collection")) } icon: { Image(selectedTab == 0 ? "CollectionTabActive" : "CollectionTab").renderingMode(.original) } }
            .tag(0)
            NavigationStack {
                InboxView(store: store, selectedOffer: $offer, onScrollStateChange: { compactBrands[1] = $0 })
                    .toolbar { header(tab: 1) }
            }
                .tabItem { Label { Text(NativeText.literal("Inbox")) } icon: { Image(selectedTab == 1 ? "InboxTabActive" : "InboxTab").renderingMode(.original) } }
                .badge(inboxCount)
                .tag(1)
            NavigationStack {
                AppsView(store: store, create: { showCreate = true }, openInbox: { selectedTab = 1 }, onScrollStateChange: { compactBrands[2] = $0 })
                    .toolbar { header(tab: 2) }
            }
                .tabItem { Label { Text(NativeText.literal("Apps")) } icon: { Image(selectedTab == 2 ? "AppsTabActive" : "AppsTab").renderingMode(.original) } }
                .tag(2)
            NavigationStack {
                HomeView(store: store, profileName: account?.state?.profileName,
                         openInbox: { selectedTab = 1 }, create: { showCreate = true },
                         receive: { showReceive = true }, onScrollStateChange: { compactBrands[3] = $0 })
                    .toolbar { header(tab: 3) }
            }
                .tabItem { Label { Text(NativeText.literal("Home")) } icon: { Image(selectedTab == 3 ? "HomeTabActive" : "HomeTab").renderingMode(.original) } }
                .tag(3)
        }
        .toolbar(.hidden, for: .tabBar)
        .safeAreaInset(edge: .bottom, spacing: 0) { NativeTabTray(selection: $selectedTab, inboxCount: inboxCount) }
        .task { if store.snapshot == nil { await store.refresh() }; if !store.inbox.loaded { await store.inbox.load() } }
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
        .sheet(item: Binding(get: { availablePrompt }, set: { _ in })) { item in
            ConnectionPromptView(inbox: store.inbox, item: item).interactiveDismissDisabled()
        }
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

    private var inboxCount: Int {
        let offers = store.snapshot?.offers ?? []
        return offers.count + store.inbox.updates(excluding: Set(offers.map(\.id))).filter { !$0.read }.count
    }
    private var availablePrompt: InboxItem? {
        guard !showReceive, !showCreate, !showAccount, !showActions, !showExisting, !showShare, !showFamilyReview,
              offer == nil, store.notice == nil, store.error == nil else { return nil }
        return store.inbox.postClaimPrompts.first
    }

    @ToolbarContentBuilder private func header(tab: Int) -> some ToolbarContent {
        if #available(iOS 26.0, *) {
            ToolbarItem(placement: .topBarLeading) { LearnCardBrand(compact: compactBrands[tab]) }
                .sharedBackgroundVisibility(.hidden)
        } else {
            ToolbarItem(placement: .topBarLeading) { LearnCardBrand(compact: compactBrands[tab]) }
        }
        ToolbarItemGroup(placement: .topBarTrailing) {
            Button { showActions = true } label: {
                Image(systemName: "plus").font(.system(size: 21, weight: .semibold))
                    .foregroundStyle(Palette.cardInk).frame(width: 34, height: 34)
                    .background(Palette.blueCard, in: RoundedRectangle(cornerRadius: 12))
                    .frame(width: 44, height: 44).contentShape(Rectangle())
            }.buttonStyle(.plain).accessibilityLabel(NativeText.literal("Actions")).accessibilityIdentifier("create")
                .popover(isPresented: Binding(get: { showActions && selectedTab == tab }, set: { if selectedTab == tab { showActions = $0 } }), arrowEdge: .top) {
                    CollectionActionsMenu { action in requestedAction = action; showActions = false }
                        .presentationCompactAdaptation(.popover).presentationBackground(Palette.surface)
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
            Button { showAccount = true } label: {
                ProfileArtwork(url: account?.state?.profileImage)
                    .frame(width: 44, height: 44).contentShape(Rectangle())
            }.buttonStyle(.plain).accessibilityLabel(NativeText.literal("Account")).accessibilityIdentifier("account")
        }
    }
}
