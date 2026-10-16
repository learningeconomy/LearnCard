import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

struct RootView: View {
    @Environment(\.locale) private var nativeLocale
    @Bindable var store: AppStore
    var account: AccountController? = nil
    @State private var demoClaims = NativeClaimStore(isDemo: true, journal: MemoryClaimJournal())
    private var claims: NativeClaimStore { account?.claims ?? demoClaims }
    @State private var showCreate = false
    @State private var showAccount = false
    @State private var showActions = false
    @State private var requestedAction: CollectionAction?
    @State private var showExisting = false
    @State private var showShare = false
    @State private var offer: Credential?
    @State private var selectedTab = 3
    @State private var discoverApps = false
    @State private var appsEntry = 0
    @State private var compactBrands = Array(repeating: false, count: 4)
    @State private var showFamilyReview = false

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                HomeView(store: store, profileName: account?.state?.profileName,
                         openInbox: { selectedTab = 1 }, create: { showCreate = true },
                         receive: { claims.open() }, intake: { claims.open(mode: $0) }, openCollection: { selectedTab = 0 },
                         openApps: { discoverApps = $0; appsEntry += 1; compactBrands[2] = false; selectedTab = 2 }, onScrollStateChange: { compactBrands[3] = $0 })
                    .toolbar { header(tab: 3) }
            }
                .tabItem { Label { Text(NativeText.literal("Home")) } icon: { Image(selectedTab == 3 ? "HomeTabActive" : "HomeTab").renderingMode(.original) } }
                .tag(3)
            NavigationStack {
                CollectionView(store: store, scan: { claims.open() }, create: { showCreate = true }, onScrollStateChange: { compactBrands[0] = $0 })
                    .toolbar { header(tab: 0) }
            }
            .tabItem { Label { Text(NativeText.literal("Passport")) } icon: { Image(selectedTab == 0 ? "CollectionTabActive" : "CollectionTab").renderingMode(.original) } }
            .tag(0)
            NavigationStack {
                InboxView(store: store, selectedOffer: $offer, scan: { claims.open() }, onScrollStateChange: { compactBrands[1] = $0 })
                    .toolbar { header(tab: 1) }
            }
                .tabItem { Label { Text(NativeText.literal("Inbox")) } icon: { Image(selectedTab == 1 ? "InboxTabActive" : "InboxTab").renderingMode(.original) } }
                .badge(inboxCount)
                .tag(1)
            NavigationStack {
                AppsView(store: store, create: { showCreate = true }, openInbox: { selectedTab = 1 }, discover: $discoverApps, onScrollStateChange: { compactBrands[2] = $0 })
                    .toolbar { header(tab: 2) }
            }
                .id(appsEntry)
                .tabItem { Label { Text(NativeText.literal("Apps")) } icon: { Image(selectedTab == 2 ? "AppsTabActive" : "AppsTab").renderingMode(.original) } }
                .tag(2)
        }
        .onChange(of: store.openInboxRequested) { _, value in if value { selectedTab = 1; store.openInboxRequested = false } }
        .toolbar(.hidden, for: .tabBar)
        .safeAreaInset(edge: .bottom, spacing: 0) { NativeTabTray(selection: $selectedTab, inboxCount: inboxCount) }
        .task { if store.snapshot == nil { await store.refresh() }; if !store.inbox.loaded { await store.inbox.load() } }
        .modifier(ClaimPresentation(flow: demoClaims, store: store, enabled: account == nil))
        .task { if account == nil { demoClaims.connect(service: store.demoClaimService, accountID: "demo") } }
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
    }

    private var inboxCount: Int {
        store.inboxCount
    }
    private var availablePrompt: InboxItem? {
        guard !claims.isPresented, !showCreate, !showAccount, !showActions, !showExisting, !showShare, !showFamilyReview,
              offer == nil, store.notice == nil, store.error == nil else { return nil }
        return store.inbox.postClaimPrompts.first
    }

    @ToolbarContentBuilder private func header(tab: Int) -> some ToolbarContent {
        if #available(iOS 26.0, *) {
            ToolbarItem(placement: .topBarLeading) { brand(tab: tab) }.sharedBackgroundVisibility(.hidden)
            ToolbarItem(placement: .topBarTrailing) { headerControls(tab: tab) }.sharedBackgroundVisibility(.hidden)
        } else {
            ToolbarItem(placement: .topBarLeading) { brand(tab: tab) }
            ToolbarItem(placement: .topBarTrailing) { headerControls(tab: tab) }
        }
    }

    private func brand(tab: Int) -> some View {
        LearnCardBrand(compact: compactBrands[tab], section: ["Passport", "Inbox", "Apps", "Home"][tab])
    }

    private func headerControls(tab: Int) -> some View {
        HStack(spacing: 0) {
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
                            case .scan: claims.open()
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
        }.padding(4).background(Palette.surface, in: Capsule())
            .shadow(color: .black.opacity(0.035), radius: 10, y: 5)
    }
}
