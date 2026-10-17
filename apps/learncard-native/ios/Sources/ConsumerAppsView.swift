import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

struct AppsView: View {
    @Environment(\.locale) private var nativeLocale
    let store: AppStore
    let create: () -> Void
    let openInbox: () -> Void
    @Binding var discover: Bool
    var onScrollStateChange: (Bool) -> Void = { _ in }
    @State private var category = "all"
    @State private var query = ""
    @State private var selected: ConsumerApp?
    @State private var scrolled = false
    @State private var webTool: WebTool?
    @State private var appLaunch: ConsumerAppLaunch?
    @State private var launchingApp: String?
    @State private var catalogRequested = false
    @State private var searchPending = false
    @FocusState private var searchFocused: Bool
    private var consumer: ConsumerAppsStore { store.consumer }
    private let categories = ["all", "learning", "ai", "games", "tools", "employment", "credentials", "plugin", "other"]
    private var visibleApps: [ConsumerApp] {
        (discover ? consumer.apps : consumer.installedApps).filter {
            searchQuery.isEmpty || $0.title.localizedCaseInsensitiveContains(searchQuery) || $0.tagline.localizedCaseInsensitiveContains(searchQuery)
        }
    }

    private var searchQuery: String { query.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var loading: Bool {
        discover ? !catalogRequested || searchPending || consumer.browseBusy : consumer.installedBusy || !consumer.installedLoaded && consumer.error == nil
    }

    var body: some View {
        BrandRefreshScrollView(scope: "apps", refresh: { await reload() }) {
            VStack(alignment: .leading, spacing: NativeLayout.sectionGap) {
                PageHeading(title: NativeText.text("apps.title"), identifier: "apps", accent: Palette.flairTeal)
                Picker(NativeText.text("apps.title"), selection: $discover) {
                    Text(NativeText.text("apps.mine")).tag(false)
                    Text(NativeText.text("apps.discover")).tag(true)
                }.pickerStyle(.segmented).accessibilityIdentifier("apps-segment")
                searchField
                if discover { categoryPicker }
                if !discover, !consumer.installedApps.isEmpty { installedHeading }
                if let error = consumer.error { ConsumerErrorCard(error: error) { Task { await reload() } } }
                appContent
                if discover ? consumer.hasMoreApps : consumer.hasMoreInstalled {
                    Button {
                        Task {
                            if discover { await consumer.browse(category: category == "all" ? nil : category, more: true) }
                            else { await consumer.loadInstalled(more: true) }
                        }
                    } label: {
                        HStack(spacing: 8) {
                            if consumer.browseBusy || consumer.installedBusy { ProgressView() }
                            Text(NativeText.text("common.more"))
                        }.font(.body.weight(.semibold)).frame(minHeight: 44)
                    }.foregroundStyle(Palette.selection).disabled(consumer.browseBusy || consumer.installedBusy)
                }
                if !discover {
                    if !consumer.installedApps.isEmpty { AppsDiscoverRow(action: showDiscover) }
                    learnCardTools
                }
            }.padding(NativeLayout.pageInset)
        }.background(Palette.appsCanvas).scrollDismissesKeyboard(.interactively)
            .navigationTitle("").navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Palette.appsCanvas, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
            .onScrollGeometryChange(for: Bool.self) { $0.contentOffset.y + $0.contentInsets.top > 60 } action: { _, value in scrolled = value; onScrollStateChange(value) }
            .task { await consumer.loadInstalled() }
            .task(id: "\(discover):\(category):\(searchQuery)") {
                guard discover else { searchPending = false; return }
                catalogRequested = true; searchPending = true
                if !searchQuery.isEmpty { do { try await Task.sleep(for: .milliseconds(300)) } catch { return } }
                await consumer.browse(category: category == "all" ? nil : category, allPages: !searchQuery.isEmpty)
                if !Task.isCancelled { searchPending = false }
            }
            .navigationDestination(item: $selected) { app in ConsumerAppDetailView(app: app, store: store, openInbox: openInbox) }
            .fullScreenCover(item: $appLaunch) { next in
                ConsumerBrowserView(launch: next, consumer: consumer, isSample: sampleBrowser, onCredential: { Task { await store.refresh() } }, openInbox: openInbox)
            }
            .fullScreenCover(item: $webTool) { _ in
                ConsumerBrowserView(launch: WebTool.launch, consumer: consumer, isSample: false, onCredential: {}, openInbox: openInbox)
            }
    }
    private var searchField: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass").foregroundStyle(Palette.secondary).accessibilityHidden(true)
            TextField(text: $query, prompt: Text(NativeText.text("apps.search")).foregroundStyle(Palette.secondary)) { Text(NativeText.text("apps.search")) }
                .autocorrectionDisabled().textInputAutocapitalization(.never).focused($searchFocused)
                .submitLabel(.search).onSubmit { searchFocused = false }.accessibilityIdentifier("apps-search")
            if !query.isEmpty {
                Button { clearSearch() } label: { Image(systemName: "xmark.circle.fill").foregroundStyle(Palette.secondary).frame(width: 44, height: 44) }
                    .accessibilityLabel(NativeText.text("apps.clearSearch")).accessibilityIdentifier("apps-search-clear")
            }
        }.padding(.leading, 16).padding(.trailing, query.isEmpty ? 16 : 4).padding(.vertical, 10)
            .frame(minHeight: 58).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
    }
    private var categoryPicker: some View {
        ScrollView(.horizontal) {
            HStack(spacing: 8) {
                ForEach(categories, id: \.self) { value in
                    Button { searchFocused = false; category = value } label: {
                        Text(NativeText.text("category.\(value)")).font(.subheadline.weight(.medium))
                            .padding(.horizontal, 16).padding(.vertical, 12)
                            .foregroundStyle(category == value ? Palette.selectionInk : Palette.secondary)
                            .background(category == value ? Palette.selection : Palette.surface, in: Capsule())
                    }.buttonStyle(.plain).accessibilityIdentifier("apps-category-\(value)")
                        .accessibilityAddTraits(category == value ? .isSelected : [])
                }
            }.padding(.horizontal, NativeLayout.pageInset)
        }.scrollIndicators(.hidden).padding(.horizontal, -NativeLayout.pageInset)
    }
    private var installedHeading: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(NativeText.text("apps.installed")).font(.title2.bold()).foregroundStyle(Palette.ink)
                .accessibilityAddTraits(.isHeader).accessibilityIdentifier("apps-installed-heading").headingFlair(Palette.flairPink)
            Spacer(minLength: 8)
            if consumer.installedLoaded {
                Text(NativeText.count("apps.count", consumer.installedApps.count)).font(.caption).foregroundStyle(Palette.secondary)
            }
        }
    }
    @ViewBuilder private var appContent: some View {
        if loading && visibleApps.isEmpty {
            ConsumerLoadingRows().accessibilityIdentifier("apps-loading")
        } else if visibleApps.isEmpty {
            if consumer.error == nil {
                if !discover && searchQuery.isEmpty && consumer.installedLoaded {
                    AppsEmptyCard(discover: showDiscover)
                } else {
                    AppsNoResultsCard(canClear: !searchQuery.isEmpty || category != "all") { clearSearch(); category = "all" }
                }
            }
        } else {
            if loading { ProgressView(NativeText.text("apps.searching")).font(.subheadline).accessibilityIdentifier("apps-searching") }
            if discover, let featured = visibleApps.first(where: \.featured) {
                Text(NativeText.text("apps.featured")).font(.title3.bold()).foregroundStyle(Palette.ink).accessibilityAddTraits(.isHeader)
                Button { selected = featured } label: {
                    ConsumerFeaturedApp(app: featured)
                }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("app-\(featured.id)")
            }
            LazyVStack(spacing: 16) {
                ForEach(visibleApps.filter { !discover || !$0.featured || $0.id != visibleApps.first(where: \.featured)?.id }) { app in
                    ConsumerAppRow(app: app, installed: consumer.isInstalled(app.id), busy: consumer.actionBusy || launchingApp != nil, opening: launchingApp == app.id,
                                   detail: { selected = app }, open: { Task { await open(app) } })
                }
            }
        }
    }
    private var learnCardTools: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(NativeText.text("apps.tools")).font(.title3.bold()).foregroundStyle(Palette.ink)
                .accessibilityAddTraits(.isHeader).accessibilityIdentifier("apps-tools-heading")
            VStack(spacing: 0) {
                NavigationLink { FamiliesView(appStore: store) } label: {
                    ConsumerToolRow(title: NativeText.text("family.title"), subtitle: NativeText.text("family.subtitle"), symbol: .family, tint: Palette.familyCard)
                }.accessibilityIdentifier("apps-families")
                Divider().padding(.leading, 78)
                NavigationLink { DataSharingView(consumer: consumer) } label: {
                    ConsumerToolRow(title: NativeText.text("sharing.title"), subtitle: NativeText.text("sharing.subtitle"), symbol: .sharing, tint: Palette.pinkCard)
                }.accessibilityIdentifier("apps-data-sharing")
                Divider().padding(.leading, 78)
                Button { webTool = WebTool() } label: {
                    ConsumerToolRow(title: NativeText.text("apps.resume"), subtitle: NativeText.text("apps.resumeBody"), symbol: .external, tint: Palette.blueCard, web: true)
                }.accessibilityIdentifier("apps-resume")
            }.buttonStyle(CredentialPressStyle()).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
        }
    }
    private func clearSearch() { query = ""; searchFocused = false }
    private func showDiscover() { clearSearch(); discover = true }
    private func open(_ app: ConsumerApp) async {
        guard launchingApp == nil else { return }
        launchingApp = app.id
        defer { launchingApp = nil }
        do { consumer.error = nil; appLaunch = try await consumer.launch(app) }
        catch {
            guard consumer.installedApps.contains(where: { $0.id == app.id }) else { return }
            consumer.fail(error); selected = app
        }
    }
    private var sampleBrowser: Bool {
        #if DEBUG
        !store.isLive || ProcessInfo.processInfo.arguments.contains("--account-fixture")
        #else
        !store.isLive
        #endif
    }
    private func reload() async {
        await consumer.loadInstalled()
        if discover { await consumer.browse(category: category == "all" ? nil : category, allPages: !searchQuery.isEmpty) }
    }
    private struct WebTool: Identifiable {
        let id = UUID()
        static var launch: ConsumerAppLaunch {
            // Web-only first-party tool; its own web sign-in stays inside the browser.
            try! JSONDecoder().decode(ConsumerAppLaunch.self, from: Data("{\"id\":\"resume-builder\",\"title\":\"Résumé builder\",\"url\":\"https://staging.learncard.app/resume-builder\",\"embedded\":false}".utf8))
        }
    }
}

struct ConsumerAppDetailView: View {
    @Environment(\.locale) private var nativeLocale
    @Environment(\.dynamicTypeSize) private var textSize
    @AppStorage(NativeLanguage.preferenceKey) private var language = "system"
    let app: ConsumerApp
    let store: AppStore
    let openInbox: () -> Void
    @State private var review: ConsumerConsentReview?
    @State private var reviewing = false
    @State private var launch: ConsumerAppLaunch?
    @State private var confirmRemove = false
    private var consumer: ConsumerAppsStore { store.consumer }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                (textSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: 16)) : AnyLayout(HStackLayout(alignment: .top, spacing: 18))) {
                    ConsumerAppIcon(url: app.iconURL, title: app.title, size: textSize.isAccessibilitySize ? 64 : 84)
                    VStack(alignment: .leading, spacing: 7) {
                        Text(app.title).font(.system(.title, weight: .bold)).foregroundStyle(Palette.ink)
                        Text(app.tagline).font(.subheadline).foregroundStyle(Palette.secondary)
                        Text(consumerCategory(app.category)).font(.caption.weight(.semibold)).foregroundStyle(Palette.ink)
                            .padding(.horizontal, 10).padding(.vertical, 6)
                            .background(Palette.surface, in: Capsule())
                    }
                    Spacer(minLength: 0)
                }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
                    .background(AppPanelSurface(accent: Palette.tealCard)).accessibilityIdentifier("app-detail-identity")
                if let error = consumer.error { ConsumerErrorCard(error: error) { consumer.error = nil } }
                if !app.launchable { Text(ConsumerAppError.unsupported.errorDescription ?? "").font(.subheadline).foregroundStyle(Palette.secondary) }
                ConsumerActionButton(title: NativeText.text(consumer.error == .changed && consumer.isInstalled(app.id) ? "consent.title" : consumer.isInstalled(app.id) ? "apps.open" : "apps.add"), busy: reviewing || consumer.actionBusy, disabled: !app.launchable) {
                    Task {
                        let reviewAccess = consumer.error == .changed
                        consumer.error = nil; reviewing = true; defer { reviewing = false }
                        do {
                            if consumer.isInstalled(app.id) && !reviewAccess { launch = try await consumer.launch(app) }
                            else if let next = try await consumer.review(app) { review = next }
                            else { _ = await consumer.add(app) }
                        } catch { consumer.fail(error) }
                    }
                }.accessibilityIdentifier("app-detail-action")
                if let host = app.host { Text(host).font(.caption).foregroundStyle(Palette.secondary).environment(\.layoutDirection, .leftToRight) }
                VStack(alignment: .leading, spacing: 12) {
                    Text(NativeText.text("apps.about")).font(.title3.bold()).foregroundStyle(Palette.ink)
                    Text(app.description).font(.body).foregroundStyle(Palette.secondary)
                }.padding(20).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                if !app.screenshots.isEmpty {
                    ScrollView(.horizontal) {
                        HStack(spacing: 12) {
                            ForEach(app.screenshots.prefix(8), id: \.self) { url in
                                AsyncImage(url: url) { phase in
                                    if let image = phase.image { image.resizable().scaledToFit() }
                                    else if phase.error != nil { Image(systemName: "photo").foregroundStyle(Palette.secondary) }
                                    else { ProgressView() }
                                }.frame(width: 210, height: 340).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20)).clipShape(RoundedRectangle(cornerRadius: 20))
                            }
                        }
                    }.scrollIndicators(.hidden)
                }
                if !app.permissions.isEmpty || app.contractURI != nil {
                    VStack(alignment: .leading, spacing: 14) {
                        Text(NativeText.text("apps.access")).font(.title3.bold()).foregroundStyle(Palette.ink)
                        Text(NativeText.text("apps.requestsBody")).font(.subheadline).foregroundStyle(Palette.secondary)
                        ForEach(app.permissions, id: \.self) { permission in
                            HStack(spacing: 14) {
                                DrawnTile(symbol: permission == "request_identity" ? .family : .credential,
                                          tint: permission == "request_identity" ? Palette.portfolioCard : Palette.cyanCard)
                                Text(NativeText.text(permissionKey(permission))).font(.body.weight(.medium)).foregroundStyle(Palette.ink)
                            }
                        }
                    }.padding(20).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                }
                if let age = app.ageRating { LabeledContent(NativeText.text("apps.ageRating"), value: age).font(.caption).foregroundStyle(Palette.secondary) }
                VStack(alignment: .leading, spacing: 16) {
                    if let url = app.privacyURL { Link(NativeText.text("apps.privacy"), destination: url) }
                    if let url = app.termsURL { Link(NativeText.text("apps.terms"), destination: url) }
                    NavigationLink { DataSharingView(consumer: consumer) } label: { Label(NativeText.text("sharing.title"), systemImage: "lock") }
                }.font(.subheadline).foregroundStyle(Palette.selection)
                if consumer.isInstalled(app.id) {
                    Button(NativeText.text("apps.remove"), role: .destructive) { confirmRemove = true }
                        .accessibilityIdentifier("app-remove").disabled(consumer.actionBusy)
                }
            }.padding(20)
        }.background(Palette.paper).navigationTitle(app.title).navigationBarTitleDisplayMode(.inline)
            .sheet(item: $review) { next in
                NativeConsentView(appTitle: app.title, iconURL: app.iconURL, review: next, consumer: consumer, addApp: true) { review = nil }
                    .environment(\.locale, (NativeLanguage(rawValue: language) ?? .system).locale)
                    .environment(\.layoutDirection, (NativeLanguage(rawValue: language) ?? .system).isRightToLeft ? .rightToLeft : .leftToRight)
            }
            .fullScreenCover(item: $launch) { next in
                ConsumerBrowserView(launch: next, consumer: consumer, isSample: sampleBrowser, onCredential: { Task { await store.refresh() } }, openInbox: openInbox)
            }
            .confirmationDialog(NativeText.text("apps.removeTitle"), isPresented: $confirmRemove, titleVisibility: .visible) {
                Button(NativeText.text("apps.remove"), role: .destructive) { Task { _ = await consumer.remove(app) } }
                Button(NativeText.text("common.cancel"), role: .cancel) {}
            } message: { Text(NativeText.text("apps.removeMessage")) }
    }
    private var sampleBrowser: Bool {
        #if DEBUG
        return !store.isLive || ProcessInfo.processInfo.arguments.contains("--account-fixture")
        #else
        return !store.isLive
        #endif
    }
    private func permissionKey(_ permission: String) -> String {
        switch permission {
        case "request_identity": "apps.identity"
        case "send_credential", "template_issuance": "apps.receive"
        case "credential_search", "credential_specific": "apps.requestCredentials"
        case "request_consent", "learner_context": "apps.requestData"
        case "launch_feature": "apps.requestFeature"
        default: "apps.otherPermission"
        }
    }
}

struct ConsumerActionButton: View {
    @Environment(\.locale) private var nativeLocale
    let title: String
    var busy = false
    var disabled = false
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) { if busy { ProgressView().tint(disabled ? Palette.secondary : Palette.selectionInk) }; Text(title).font(.body.weight(.semibold)) }
                .padding(.horizontal, 20).padding(.vertical, 16).frame(maxWidth: .infinity, minHeight: 54)
                .foregroundStyle(disabled ? Palette.secondary : Palette.selectionInk).background(disabled ? Palette.line : Palette.selection, in: RoundedRectangle(cornerRadius: 20))
        }.buttonStyle(CredentialPressStyle()).disabled(busy || disabled)
    }
}

struct ConsumerAppIcon: View {
    @Environment(\.locale) private var nativeLocale
    let url: URL?
    let title: String
    var size: CGFloat = 58
    var body: some View {
        Group {
            if let url {
                AsyncImage(url: url) { phase in
                    if let image = phase.image { image.resizable().scaledToFit() }
                    else if phase.error != nil { placeholder }
                    else { placeholder.opacity(0.35).overlay { ProgressView().controlSize(.small).tint(Palette.cardInk) } }
                }
            } else { placeholder }
        }.frame(width: size, height: size).background(url == nil ? Palette.blueCard : Palette.surface)
            .clipShape(RoundedRectangle(cornerRadius: size * 0.25))
            .overlay(RoundedRectangle(cornerRadius: size * 0.25).strokeBorder(Palette.line.opacity(0.7), lineWidth: 0.7))
            .background(RoundedRectangle(cornerRadius: size * 0.25).fill(Palette.line).offset(y: 2))
            .shadow(color: .black.opacity(0.10), radius: 3, x: 0, y: 3).accessibilityHidden(true)
    }
    private var placeholder: some View {
        Image("AppPlaceholder").resizable().scaledToFit().padding(size * 0.12)
    }
}

private struct ConsumerToolRow: View {
    let title: String
    let subtitle: String
    let symbol: DrawnSymbol
    let tint: Color
    var web = false
    var body: some View {
        DrawnSettingsRow(title: title, symbol: symbol, tint: tint, subtitle: subtitle, web: web)
    }
}

struct ConsumerErrorCard: View {
    @Environment(\.locale) private var nativeLocale
    let error: ConsumerAppError
    let retry: () -> Void
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(error.errorDescription ?? "", systemImage: "exclamationmark.circle").font(.subheadline).foregroundStyle(Palette.ink)
            Button(NativeText.text("common.retry"), action: retry).font(.subheadline.weight(.semibold)).foregroundStyle(Palette.selection).frame(minHeight: 44)
        }.padding(18).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier("consumer-error")
    }
}

struct ConsumerLoadingRows: View {
    @Environment(\.locale) private var nativeLocale
    var body: some View {
        VStack(spacing: 12) {
            ForEach(0..<3) { _ in
                HStack(spacing: 14) {
                    RoundedRectangle(cornerRadius: 16).fill(Palette.line).frame(width: 58, height: 58)
                    VStack(alignment: .leading, spacing: 10) {
                        RoundedRectangle(cornerRadius: 4).fill(Palette.line).frame(height: 14)
                        RoundedRectangle(cornerRadius: 4).fill(Palette.line.opacity(0.5)).frame(height: 10)
                    }
                }.padding(16).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
            }
            ProgressView(NativeText.text("common.loading")).font(.subheadline)
        }.accessibilityElement(children: .ignore).accessibilityLabel(NativeText.text("common.loading"))
    }
}

private func consumerCategory(_ id: String) -> String {
    let key = "category.\(id)", translated = NativeText.text(key)
    return translated == key ? id.capitalized : translated
}
