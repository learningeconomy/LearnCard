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
    private var consumer: ConsumerAppsStore { store.consumer }
    private let categories = ["all", "learning", "ai", "games", "tools", "employment", "credentials", "plugin", "other"]
    private var visibleApps: [ConsumerApp] {
        (discover ? consumer.apps : consumer.installedApps).filter {
            query.isEmpty || $0.title.localizedCaseInsensitiveContains(query) || $0.tagline.localizedCaseInsensitiveContains(query)
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                PageHeading(title: NativeText.text("apps.title"), identifier: "apps")
                Picker(NativeText.text("apps.title"), selection: $discover) {
                    Text(NativeText.text("apps.mine")).tag(false)
                    Text(NativeText.text("apps.discover")).tag(true)
                }.pickerStyle(.segmented).accessibilityIdentifier("apps-segment")
                HStack(spacing: 10) {
                    Image(systemName: "magnifyingglass").foregroundStyle(Palette.secondary)
                    TextField(text: $query, prompt: Text(NativeText.text("apps.search")).foregroundStyle(Palette.secondary)) { Text(NativeText.text("apps.search")) }.autocorrectionDisabled()
                        .accessibilityIdentifier("apps-search")
                }.padding(14).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
                if discover {
                    ScrollView(.horizontal) {
                        HStack(spacing: 8) {
                            ForEach(categories, id: \.self) { value in
                                Button { category = value } label: {
                                    Text(NativeText.text("category.\(value)")).font(.subheadline.weight(.medium))
                                        .padding(.horizontal, 16).padding(.vertical, 12)
                                        .foregroundStyle(category == value ? Palette.selectionInk : Palette.secondary)
                                        .background(category == value ? Palette.selection : Palette.surface, in: Capsule())
                                }.buttonStyle(.plain).accessibilityIdentifier("apps-category-\(value)")
                                    .accessibilityAddTraits(category == value ? .isSelected : [])
                            }
                        }.padding(.horizontal, 20)
                    }.scrollIndicators(.hidden).padding(.horizontal, -20)
                } else {
                    Text(NativeText.text("apps.tools")).font(.title3.bold()).foregroundStyle(Palette.ink)
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

                    HStack {
                        Text(NativeText.text("apps.installed")).font(.title3.bold()).foregroundStyle(Palette.ink)
                        Spacer()
                        Text(NativeText.count("apps.count", consumer.installedApps.count)).font(.caption).foregroundStyle(Palette.secondary)
                    }
                }
                if let error = consumer.error { ConsumerErrorCard(error: error) { Task { await reload() } } }
                if (discover ? consumer.browseBusy : consumer.installedBusy) && visibleApps.isEmpty {
                    ConsumerLoadingRows()
                } else if visibleApps.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        Text(NativeText.text(query.isEmpty && !discover ? "apps.empty" : "apps.noResults")).font(.headline)
                        Text(NativeText.text(query.isEmpty && !discover ? "apps.emptyBody" : "apps.noResultsBody")).font(.subheadline).foregroundStyle(Palette.secondary)
                        if !discover { Button(NativeText.text("apps.discover")) { discover = true }.font(.body.weight(.semibold)).foregroundStyle(Palette.selection) }
                    }.padding(24).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                } else {
                    if discover, let featured = visibleApps.first(where: \.featured) {
                        Text(NativeText.text("apps.featured")).font(.title3.bold()).foregroundStyle(Palette.ink)
                        Button { selected = featured } label: {
                            HStack(spacing: 16) {
                                ConsumerAppIcon(url: featured.iconURL, title: featured.title, size: 96)
                                VStack(alignment: .leading, spacing: 10) {
                                    Text(featured.title).font(.title2.bold()).foregroundStyle(Palette.ink)
                                    Text(featured.tagline).font(.subheadline).foregroundStyle(Palette.secondary).lineLimit(3)
                                    Text(NativeText.text("apps.view"))
                                        .font(.subheadline.weight(.semibold)).padding(.horizontal, 20).padding(.vertical, 11)
                                        .foregroundStyle(Palette.selectionInk).background(Palette.selection, in: RoundedRectangle(cornerRadius: 14))
                                }.frame(maxWidth: .infinity, alignment: .leading)
                            }.padding(16).frame(maxWidth: .infinity, alignment: .leading)
                                .background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))

                        }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("app-\(featured.id)")
                    }
                    LazyVStack(spacing: 12) {
                        ForEach(visibleApps.filter { !discover || !$0.featured || $0.id != visibleApps.first(where: \.featured)?.id }) { app in
                            ConsumerAppRow(app: app, installed: consumer.isInstalled(app.id), busy: consumer.actionBusy || launchingApp != nil, opening: launchingApp == app.id,
                                           detail: { selected = app }, open: { Task { await open(app) } })
                        }
                    }
                }
                if discover ? consumer.hasMoreApps : consumer.hasMoreInstalled {
                    Button(NativeText.text("common.more")) {
                        Task { if discover { await consumer.browse(category: category == "all" ? nil : category, more: true) } else { await consumer.loadInstalled(more: true) } }
                    }.font(.body.weight(.semibold)).foregroundStyle(Palette.selection)
                        .disabled(consumer.browseBusy || consumer.installedBusy)
                }
            }.padding(20)
        }.background(Palette.appsCanvas)
            .navigationTitle("").navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Palette.appsCanvas, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
            .onScrollGeometryChange(for: Bool.self) { $0.contentOffset.y + $0.contentInsets.top > 60 } action: { _, value in scrolled = value; onScrollStateChange(value) }
            .task { await consumer.loadInstalled() }
            .task(id: "\(discover):\(category):\(query)") {
                if discover {
                    if !query.isEmpty { do { try await Task.sleep(for: .milliseconds(300)) } catch { return } }
                    await consumer.browse(category: category == "all" ? nil : category, allPages: !query.isEmpty)
                }
            }
            .refreshable { await reload() }
            .navigationDestination(item: $selected) { app in ConsumerAppDetailView(app: app, store: store, openInbox: openInbox) }
            .fullScreenCover(item: $appLaunch) { next in
                ConsumerBrowserView(launch: next, consumer: consumer, isSample: sampleBrowser, onCredential: { Task { await store.refresh() } }, openInbox: openInbox)
            }
            .fullScreenCover(item: $webTool) { _ in
                ConsumerBrowserView(launch: WebTool.launch, consumer: consumer, isSample: false, onCredential: {}, openInbox: openInbox)
            }
    }
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
        if discover { await consumer.browse(category: category == "all" ? nil : category, allPages: !query.isEmpty) }
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
                HStack(alignment: .top, spacing: 18) {
                    ConsumerAppIcon(url: app.iconURL, title: app.title, size: 84)
                    VStack(alignment: .leading, spacing: 7) {
                        Text(app.title).font(.system(.title, weight: .bold)).foregroundStyle(Palette.ink)
                        Text(app.tagline).font(.subheadline).foregroundStyle(Palette.secondary)
                        Text(consumerCategory(app.category)).font(.caption.weight(.medium)).foregroundStyle(Palette.selection)
                    }
                    Spacer(minLength: 0)
                }
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
                    Text(NativeText.text("apps.about")).font(.headline)
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
                        Text(NativeText.text("apps.access")).font(.headline)
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
                    if let image = phase.image { image.resizable().scaledToFill() }
                    else if phase.error != nil { placeholder }
                    else { placeholder.opacity(0.35).overlay { ProgressView().controlSize(.small).tint(Palette.cardInk) } }
                }
            } else { placeholder }
        }.frame(width: size, height: size).background(Palette.blueCard)
            .clipShape(RoundedRectangle(cornerRadius: size * 0.25)).accessibilityHidden(true)
    }
    private var placeholder: some View {
        Image("AppPlaceholder").resizable().scaledToFit().padding(size * 0.12)
    }
}

private struct ConsumerAppRow: View {
    @Environment(\.locale) private var nativeLocale
    let app: ConsumerApp
    let installed: Bool
    let busy: Bool
    let opening: Bool
    let detail: () -> Void
    let open: () -> Void
    @ScaledMetric(relativeTo: .headline) private var titleSize = 18.0
    var body: some View {
        HStack(spacing: 10) {
            Button(action: detail) {
                HStack(spacing: 14) {
                    ConsumerAppIcon(url: app.iconURL, title: app.title, size: 62)
                    VStack(alignment: .leading, spacing: 5) {
                        Text(app.title).font(.system(size: titleSize, weight: .semibold)).foregroundStyle(Palette.ink)
                        Text(app.tagline).font(.subheadline).foregroundStyle(Palette.secondary).lineLimit(3)
                    }.frame(maxWidth: .infinity, alignment: .leading).multilineTextAlignment(.leading)
                    if !installed { Image(systemName: "chevron.forward").font(.subheadline).foregroundStyle(Palette.secondary) }
                }.contentShape(Rectangle())
            }.accessibilityIdentifier("app-\(app.id)")
            if installed {
                Button(action: open) {
                    HStack(spacing: 6) {
                        if opening { ProgressView().tint(Palette.selection) }
                        Text(NativeText.text(opening ? "apps.opening" : "apps.open"))
                    }.font(.subheadline.weight(.semibold)).foregroundStyle(Palette.selection)
                        .padding(.horizontal, 14).frame(minHeight: 44)
                        .background(Palette.blueCard.opacity(0.12), in: RoundedRectangle(cornerRadius: 14))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Palette.blueCard.opacity(0.6)))
                }.disabled(busy).accessibilityIdentifier("app-open-\(app.id)")
                    .accessibilityLabel(NativeText.format("apps.openNamed", app.title))
            }
        }.padding(12).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22)).buttonStyle(CredentialPressStyle())
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
            Button(NativeText.text("common.retry"), action: retry).font(.subheadline.weight(.semibold)).foregroundStyle(Palette.selection)
        }.padding(18).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
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
