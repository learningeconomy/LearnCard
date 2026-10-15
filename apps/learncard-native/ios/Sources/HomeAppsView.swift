import SwiftUI
import LearnCardNativeSDK
import LearnCardNativeCore

/// A personal landing place built from existing account services, not synthetic analytics.
struct HomeView: View {
    @Environment(\.locale) private var nativeLocale
    @Environment(\.dynamicTypeSize) private var textSize
    let store: AppStore
    var profileName: String?
    let openInbox: () -> Void
    let create: () -> Void
    let receive: () -> Void
    let openCollection: () -> Void
    let openApps: (Bool) -> Void
    var onScrollStateChange: (Bool) -> Void = { _ in }
    private var consumer: ConsumerAppsStore { store.consumer }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: NativeLayout.sectionGap) {
                VStack(alignment: .leading, spacing: 8) {
                    PageHeading(title: "Home")
                    Text(profileName.flatMap { $0.isEmpty ? nil : NativeText.format("home.greetingName", $0) } ?? NativeText.text("home.greeting"))
                        .font(.title3).foregroundStyle(Palette.secondary)
                }
                inboxCard
                VStack(spacing: 0) {
                    Button(action: openCollection) {
                        DrawnSettingsRow(title: NativeText.text("home.collection"), symbol: .collection, tint: Palette.blueCard,
                                         subtitle: NativeText.text("home.collectionBody"))
                    }.accessibilityIdentifier("home-collection")
                    rowDivider
                    Button(action: create) {
                        DrawnSettingsRow(title: NativeText.text("home.create"), symbol: .pencil, tint: Palette.pinkCard,
                                         subtitle: NativeText.text("home.createBody"))
                    }.accessibilityIdentifier("home-create")
                    rowDivider
                    NavigationLink { CreationsView(store: store) } label: {
                        DrawnSettingsRow(title: "Your creations", symbol: .credential, tint: Palette.studiesCard,
                                         subtitle: NativeText.text("home.creationsBody"))
                    }.accessibilityIdentifier("home-creations")
                }.buttonStyle(CredentialPressStyle()).background(Palette.surface, in: RoundedRectangle(cornerRadius: NativeLayout.surfaceRadius))
                appsSection
                VStack(spacing: 0) {
                    NavigationLink { FamiliesView(appStore: store) } label: {
                        DrawnSettingsRow(title: NativeText.text("family.title"), symbol: .family, tint: Palette.familyCard,
                                         subtitle: NativeText.text("family.subtitle"))
                    }.accessibilityIdentifier("home-families")
                    rowDivider
                    NavigationLink { DataSharingView(consumer: consumer) } label: {
                        DrawnSettingsRow(title: NativeText.text("sharing.title"), symbol: .sharing, tint: Palette.tealCard,
                                         subtitle: NativeText.text("sharing.intro"))
                    }.accessibilityIdentifier("home-data-sharing")
                }.buttonStyle(CredentialPressStyle()).background(Palette.surface, in: RoundedRectangle(cornerRadius: NativeLayout.surfaceRadius))
                Button(NativeText.text("claims.title"), action: receive).accessibilityIdentifier("receive")
                        .font(.subheadline.weight(.medium)).foregroundStyle(Palette.selection).frame(minHeight: 44)
                HomeSessionActivity(items: store.snapshot?.activity ?? [])
            }.padding(NativeLayout.pageInset)
        }
        .background(SectionBackground(tint: Palette.homeCanvas))
        .onScrollGeometryChange(for: Bool.self) { $0.contentOffset.y + $0.contentInsets.top > 60 } action: { _, value in onScrollStateChange(value) }
        .navigationTitle("").navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Palette.homeCanvas, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
        .task { await consumer.loadInstalled() }
        .refreshable { await store.refresh(); await store.inbox.load(); await consumer.loadInstalled() }
    }

    private var rowDivider: some View { Divider().padding(.leading, 74) }

    private var inboxCard: some View {
        Button(action: openInbox) {
            (textSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: 12)) : AnyLayout(HStackLayout(spacing: 10))) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(NativeText.text("home.ready")).font(.title3.bold()).foregroundStyle(Palette.ink)
                    if store.snapshot == nil || !store.inbox.loaded {
                        if store.error != nil || store.inbox.error != nil {
                            Text(NativeText.text("home.inboxRetry")).font(.subheadline).foregroundStyle(Palette.secondary)
                        } else { ProgressView(NativeText.text("inbox.loading")).font(.subheadline) }
                    } else {
                        Text(NativeText.count("home.offers", store.snapshot?.offers.count ?? 0)).font(.subheadline)
                            .foregroundStyle(Palette.secondary).accessibilityIdentifier("home-summary-offers")
                        if store.unreadInboxUpdateCount > 0 {
                            Text(NativeText.count("home.updates", store.unreadInboxUpdateCount)).font(.subheadline)
                                .foregroundStyle(Palette.secondary).accessibilityIdentifier("home-summary-updates")
                        }
                        if store.inbox.error != nil { Text(NativeText.text("home.inboxRetry")).font(.caption).foregroundStyle(Palette.secondary) }
                    }
                    HStack(spacing: 6) {
                        Text(NativeText.text("home.reviewInbox"))
                        Image(systemName: "arrow.forward").accessibilityHidden(true)
                    }.font(.subheadline.weight(.semibold)).foregroundStyle(Palette.green).padding(.top, 6)
                }.frame(maxWidth: .infinity, alignment: .leading)
                Image("HomeInboxIllustration").resizable().scaledToFit().frame(width: 98, height: 104).accessibilityHidden(true)
            }.padding(18).frame(maxWidth: .infinity, alignment: .leading)
                .background(Palette.surface, in: RoundedRectangle(cornerRadius: NativeLayout.surfaceRadius))
        }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("home-inbox")
    }

    private var appsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(NativeText.text("home.apps")).font(.title2.bold()).foregroundStyle(Palette.ink)
                Spacer(minLength: 8)
                Button(NativeText.text("home.seeAll")) { openApps(false) }.font(.subheadline.weight(.semibold))
                    .foregroundStyle(Palette.selection).frame(minHeight: 44).accessibilityIdentifier("home-apps")
            }
            if consumer.installedApps.isEmpty && (consumer.installedBusy || !consumer.installedLoaded && consumer.error == nil) {
                ProgressView(NativeText.text("home.loadingApps")).padding(20).frame(maxWidth: .infinity)
            } else if let error = consumer.error, consumer.installedApps.isEmpty {
                ConsumerErrorCard(error: error) { Task { consumer.error = nil; await consumer.loadInstalled() } }
            } else if consumer.installedApps.isEmpty {
                Button { openApps(true) } label: {
                    DrawnSettingsRow(title: NativeText.text("home.discover"), symbol: .add, tint: Palette.lilacCard,
                                     subtitle: NativeText.text("home.discoverBody"))
                }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("home-discover")
                    .background(Palette.surface, in: RoundedRectangle(cornerRadius: NativeLayout.surfaceRadius))
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(consumer.installedApps.prefix(3).enumerated()), id: \.element.id) { index, app in
                        if index > 0 { rowDivider }
                        NavigationLink { ConsumerAppDetailView(app: app, store: store, openInbox: openInbox) } label: {
                            HStack(spacing: NativeLayout.rowGap) {
                                ConsumerAppIcon(url: app.iconURL, title: app.title, size: 48)
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(app.title).font(.headline).foregroundStyle(Palette.ink)
                                    Text(app.tagline).font(.subheadline).foregroundStyle(Palette.secondary)
                                }.frame(maxWidth: .infinity, alignment: .leading)
                                Image(systemName: "chevron.forward").font(.subheadline).foregroundStyle(Palette.secondary).accessibilityHidden(true)
                            }.padding(12).frame(minHeight: 74).contentShape(Rectangle())
                        }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("home-app-\(app.id)")
                    }
                }.background(Palette.surface, in: RoundedRectangle(cornerRadius: NativeLayout.surfaceRadius))
            }
        }
    }
}

private struct HomeSessionActivity: View {
    @Environment(\.locale) private var nativeLocale
    let items: [Activity]
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(NativeText.text("home.activity")).font(.title2.bold()).foregroundStyle(Palette.ink)
            Text(NativeText.text("home.activityBody")).font(.subheadline).foregroundStyle(Palette.secondary)
            if items.isEmpty { Text(NativeText.text("home.emptyActivity")).font(.body).foregroundStyle(Palette.secondary) }
            ForEach(items) { item in
                HStack(alignment: .top, spacing: NativeLayout.rowGap) {
                    DrawnTile(symbol: .credential, tint: Palette.blueCard, size: 40)
                    VStack(alignment: .leading, spacing: 5) {
                        Text(item.title).font(.headline).foregroundStyle(Palette.ink)
                        Text(item.detail).font(.subheadline).foregroundStyle(Palette.secondary)
                        Text(item.date, style: .relative).font(.caption).foregroundStyle(Palette.secondary)
                    }.frame(maxWidth: .infinity, alignment: .leading)
                }.padding(.vertical, 4)
            }
        }.padding(18).frame(maxWidth: .infinity, alignment: .leading)
            .background(Palette.surface, in: RoundedRectangle(cornerRadius: NativeLayout.surfaceRadius))
    }
}
