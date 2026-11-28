import SwiftUI
import UIKit
import LearnCardNativeCore
import LearnCardNativeSDK

struct RootView: View {
    @Environment(\.locale) private var nativeLocale
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Bindable var store: AppStore
    var account: AccountController? = nil
    private let credentialPush = NativeCredentialPush.shared
    @State private var demoClaims = NativeClaimStore(isDemo: true, journal: MemoryClaimJournal())
    private var claims: NativeClaimStore { account?.claims ?? demoClaims }
    @State private var showCreate = false
    @State private var showAccount = false
    @State private var showActions = false
    @State private var requestedAction: CollectionAction?
    @State private var requestedIntake: ClaimEntryMode?
    @State private var showWelcome = false
    @State private var reopenIntake = false
    @State private var showExisting = false
    @State private var showShare = false
    @State private var offer: Credential?
    @State private var selectedTab = 3
    @State private var discoverApps = false
    @State private var appsEntry = 0
    @State private var passportEntry = 0
    @State private var compactBrands = Array(repeating: false, count: 4)
    @State private var showFamilyReview = false
    @State private var dockedKeyboardVisible = false

    var body: some View {
        // Reserve the tray's real height outside TabView. An inset around TabView
        // leaves its nested scroll views extending under the custom tray on iOS.
        VStack(spacing: 0) {
            TabView(selection: $selectedTab) {
                NavigationStack {
                    HomeView(store: store, profileName: account?.state?.profileName,
                             openInbox: { selectedTab = 1 }, create: { showCreate = true },
                             receive: { claims.open() }, intake: { claims.open(mode: $0) }, add: { showActions = true },
                             share: { showShare = true }, welcome: { showWelcome = true }, openCollection: openPassport,
                             openApps: { discoverApps = $0; appsEntry += 1; compactBrands[2] = false; selectedTab = 2 }, onScrollStateChange: { compactBrands[3] = $0 })
                        .toolbar { header(tab: 3) }
                }
                    .toolbar(.hidden, for: .tabBar)
                    .tabItem { Label { Text(NativeText.literal("Home")) } icon: { Image(selectedTab == 3 ? "HomeTabActive" : "HomeTab").renderingMode(.original) } }
                    .tag(3)
                NavigationStack {
                    CollectionView(store: store, scan: { claims.open() }, create: { showCreate = true }, onScrollStateChange: { compactBrands[0] = $0 })
                        .toolbar { header(tab: 0) }
                }
                .id(passportEntry)
                .toolbar(.hidden, for: .tabBar)
                .tabItem { Label { Text(NativeText.literal("Passport")) } icon: { Image(selectedTab == 0 ? "CollectionTabActive" : "CollectionTab").renderingMode(.original) } }
                .tag(0)
                NavigationStack {
                    InboxView(store: store, selectedOffer: $offer, scan: { claims.open() }, onScrollStateChange: { compactBrands[1] = $0 })
                        .toolbar { header(tab: 1) }
                }
                    .toolbar(.hidden, for: .tabBar)
                    .tabItem { Label { Text(NativeText.literal("Inbox")) } icon: { Image(selectedTab == 1 ? "InboxTabActive" : "InboxTab").renderingMode(.original) } }
                    .badge(inboxCount)
                    .tag(1)
                NavigationStack {
                    AppsView(store: store, create: { showCreate = true }, openInbox: { selectedTab = 1 }, discover: $discoverApps, onScrollStateChange: { compactBrands[2] = $0 })
                        .toolbar { header(tab: 2) }
                }
                    .id(appsEntry)
                    .toolbar(.hidden, for: .tabBar)
                    .tabItem { Label { Text(NativeText.literal("Apps")) } icon: { Image(selectedTab == 2 ? "AppsTabActive" : "AppsTab").renderingMode(.original) } }
                    .tag(2)
            }
            if store.intake.hasSampleNotice {
                SampleSyncBanner(store: store, viewPassport: openPassport)
            }
            if !dockedKeyboardVisible {
                NativeTabTray(selection: $selectedTab, inboxCount: inboxCount)
            }
        }
        .overlay(alignment: .top) {
            ZStack {
                if let arrival = visibleCredentialArrival {
                    CredentialArrivalToast(credential: arrival, openInbox: {
                        selectedTab = 1
                        dismissCredentialArrival(id: arrival.id)
                    }, dismiss: {
                        dismissCredentialArrival(id: arrival.id)
                    })
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                    .transition(reduceMotion ? .identity : .move(edge: .top).combined(with: .opacity))
                }
            }
            .animation(reduceMotion ? nil : .easeOut(duration: 0.22), value: visibleCredentialArrival?.id)
        }
        .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillChangeFrameNotification)) { notification in
            // Remove the tray before keyboard avoidance lifts the bottom of this stack.
            if keyboardCoversBottom(in: notification) == true { dockedKeyboardVisible = true }
        }
        .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardDidChangeFrameNotification)) { notification in
            // Restore it once the keyboard has cleared the bottom of the window.
            if let coversBottom = keyboardCoversBottom(in: notification) { dockedKeyboardVisible = coversBottom }
        }
        .onChange(of: store.openInboxRequested) { _, value in if value { selectedTab = 1; store.openInboxRequested = false } }
        .onChange(of: selectedTab) { _, tab in
            if tab == 1 { store.dismissCredentialArrival() }
        }
        .task { if store.snapshot == nil { await store.refresh() }; if !store.inbox.loaded { await store.inbox.load() } }
        .onChange(of: credentialPush.arrivalRevision) { _, _ in
            // Isolated demo builds have no account root.
            if account == nil, scenePhase == .active { store.requestCredentialOfferRefresh() }
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active {
                if account != nil { store.requestCredentialOfferRefresh() }
            } else {
                store.cancelCredentialOfferRefresh()
                store.dismissCredentialArrival()
            }
        }
        .onDisappear { store.cancelCredentialOfferRefresh() }
        .modifier(ClaimPresentation(flow: demoClaims, store: store, enabled: account == nil))
        .task { if account == nil { demoClaims.connect(service: store.demoClaimService, accountID: "demo") } }
        .sheet(isPresented: $showActions, onDismiss: performRequestedAction) {
            LearnerIntakeSheet(appStore: store, select: { requestedIntake = $0; showActions = false },
                               tool: { requestedAction = $0; showActions = false })
        }
        .sheet(isPresented: $showWelcome, onDismiss: performRequestedAction) {
            LearnerWelcomeView(add: { requestedIntake = nil; reopenIntake = true; showWelcome = false },
                               explore: { showWelcome = false })
        }
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
        .onChange(of: claims.link) { _, link in
            if link != nil {
                requestedAction = nil; requestedIntake = nil; reopenIntake = false
                showActions = false; showWelcome = false
            }
        }
        .onAppear {
            if account?.activation.takeIntakeRequest() == true { showActions = true }
            #if DEBUG
            if ProcessInfo.processInfo.arguments.contains("--review-families") { showFamilyReview = true }
            #endif
        }
    }

    private var inboxCount: Int {
        store.inboxCount
    }

    private func keyboardCoversBottom(in notification: Notification) -> Bool? {
        guard notification.userInfo?[UIResponder.keyboardIsLocalUserInfoKey] as? Bool != false,
              let endFrame = notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect else { return nil }

        let keyboardScreen = notification.object as? UIScreen
        guard let window = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .filter({ keyboardScreen == nil || $0.screen === keyboardScreen })
            .flatMap(\.windows).first(where: \.isKeyWindow),
              let screen = window.windowScene?.screen else { return nil }

        let overlap = window.bounds.intersection(screen.coordinateSpace.convert(endFrame, to: window))
        return !overlap.isNull && overlap.maxY >= window.bounds.maxY - 1 && overlap.height > window.safeAreaInsets.bottom
    }

    private func openPassport() {
        // An explicit All credentials/View Passport action returns to the full list.
        passportEntry += 1; compactBrands[0] = false; selectedTab = 0
    }

    private var hasPresentedSheetOrAlert: Bool {
        claims.isPresented || showWelcome || showCreate || showAccount || showActions || showExisting
            || showShare || showFamilyReview || offer != nil || store.notice != nil || store.error != nil
    }

    private var availablePrompt: InboxItem? {
        hasPresentedSheetOrAlert ? nil : store.inbox.postClaimPrompts.first
    }

    private var visibleCredentialArrival: Credential? {
        guard scenePhase == .active, !hasPresentedSheetOrAlert, availablePrompt == nil else { return nil }
        return store.latestCredentialArrival
    }

    private func dismissCredentialArrival(id: String) {
        if store.latestCredentialArrival?.id == id { store.dismissCredentialArrival() }
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
                HStack(spacing: 5) {
                    Image(systemName: "plus").font(.system(size: 19, weight: .semibold))
                    Text(NativeText.text("learner.add")).font(.subheadline.weight(.semibold))
                }.foregroundStyle(Palette.cardInk).padding(.horizontal, 11).frame(minHeight: 40)
                    .background(Palette.blueCard, in: RoundedRectangle(cornerRadius: 14))
                    .padding(2).contentShape(Rectangle())
            }.buttonStyle(.plain).accessibilityLabel(NativeText.text("learner.addTitle")).accessibilityIdentifier("create")
            Button { showAccount = true } label: {
                ProfileArtwork(url: account?.state?.profileImage)
                    .frame(width: 44, height: 44).contentShape(Rectangle())
            }.buttonStyle(.plain).accessibilityLabel(NativeText.literal("Account")).accessibilityIdentifier("account")
        }.padding(4).background(Palette.surface, in: Capsule())
            .shadow(color: .black.opacity(0.035), radius: 10, y: 5)
    }
    private func performRequestedAction() {
        let mode = requestedIntake, action = requestedAction, reopen = reopenIntake
        requestedIntake = nil; requestedAction = nil; reopenIntake = false
        guard account == nil || account?.phase == "ready", claims.link == nil else { return }
        if reopen { showActions = true }
        else if let mode { claims.open(mode: mode) }
        else if let action {
            switch action {
            case .scan: claims.open()
            case .create: showCreate = true
            case .send: showExisting = true
            case .share: showShare = true
            }
        }
    }

}

private struct CredentialArrivalToast: View {
    @Environment(\.locale) private var nativeLocale
    @Environment(\.accessibilityVoiceOverEnabled) private var voiceOver
    let credential: Credential
    let openInbox: () -> Void
    let dismiss: () -> Void

    private var heading: String { NativeText.text("learner.incoming") }

    var body: some View {
        HStack(alignment: .top, spacing: 4) {
            Button(action: openInbox) {
                HStack(alignment: .top, spacing: 12) {
                    Image("InboxTabActive").resizable().scaledToFit().padding(8)
                        .frame(width: 44, height: 44)
                        .background(Palette.pinkCard, in: RoundedRectangle(cornerRadius: 14))
                        .accessibilityHidden(true)
                    VStack(alignment: .leading, spacing: 3) {
                        Text(heading).font(.headline).foregroundStyle(Palette.ink)
                        Text(credential.title).font(.subheadline.weight(.semibold))
                            .foregroundStyle(Palette.ink).lineLimit(2)
                        if !credential.issuer.isEmpty {
                            Text(NativeText.format("credential.issuedBy", credential.issuer))
                                .font(.subheadline).foregroundStyle(Palette.secondary).lineLimit(2)
                        }
                        Text(NativeText.text("browser.inbox")).font(.footnote.weight(.semibold))
                            .foregroundStyle(Palette.selection).padding(.top, 2)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(.vertical, 6)
                .contentShape(Rectangle())
                .multilineTextAlignment(.leading)
            }
            .buttonStyle(.plain)
            .accessibilityIdentifier("credential-arrival-open-inbox")
            Button(action: dismiss) {
                Image(systemName: "xmark")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Palette.secondary)
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(NativeText.text("inbox.dismiss"))
            .accessibilityIdentifier("credential-arrival-dismiss")
        }
        .padding(.leading, 12)
        .padding(.vertical, 6)
        .frame(maxWidth: 520)
        .background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
        .overlay {
            RoundedRectangle(cornerRadius: 22).strokeBorder(Palette.line.opacity(0.7), lineWidth: 1)
                .allowsHitTesting(false)
        }
        .shadow(color: .black.opacity(0.12), radius: 14, y: 5)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("credential-arrival-toast")
        .task(id: credential.id) {
            if voiceOver {
                UIAccessibility.post(notification: .announcement, argument: "\(heading). \(credential.title)")
                return
            }
            do { try await Task.sleep(for: .seconds(6)) } catch { return }
            if !Task.isCancelled { dismiss() }
        }
    }
}
