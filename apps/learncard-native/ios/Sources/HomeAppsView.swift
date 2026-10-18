import SwiftUI
import LearnCardNativeSDK
import LearnCardNativeCore

/// A personal landing place built from existing account services, not synthetic analytics.
struct HomeView: View {
    @Environment(\.locale) private var nativeLocale
    @Environment(\.dynamicTypeSize) private var textSize
    @State private var recentID: String?
    @Namespace private var recentCards
    let store: AppStore
    var profileName: String?
    let openInbox: () -> Void
    let create: () -> Void
    let receive: () -> Void
    let intake: (ClaimEntryMode) -> Void
    let add: () -> Void
    let share: () -> Void
    let welcome: () -> Void
    let openCollection: () -> Void
    let openApps: (Bool) -> Void
    var onScrollStateChange: (Bool) -> Void = { _ in }
    private var consumer: ConsumerAppsStore { store.consumer }

    private var summary: LearnerHomeSummary { LearnerHomeSummary(snapshot: store.snapshot, hasError: store.error != nil || store.snapshotReadFailed) }

    var body: some View {
        BrandRefreshScrollView(scope: "home", refresh: {
            await store.refresh(); await store.inbox.load(); await consumer.loadInstalled()
        }) {
            VStack(alignment: .leading, spacing: NativeLayout.sectionGap) {
                VStack(alignment: .leading, spacing: 6) {
                    PageHeading(title: "Home", accent: Palette.flairYellow)
                    HomeGreeting(name: profileName)
                }
                if store.inboxCount > 0 || store.snapshot == nil || !store.inbox.loaded || store.inbox.error != nil { inboxCard }
                passportSection
                if summary.content == .records || summary.content == .partial { quickActions }
                VStack(spacing: 0) {
                    NavigationLink { PeopleView(appStore: store) } label: {
                        DrawnSettingsRow(title: NativeText.text("people.title"), symbol: .people, tint: Palette.lilacCard, subtitle: NativeText.text("people.homeBody"))
                    }.accessibilityIdentifier("home-people")
                    rowDivider
                    NavigationLink { DataSharingView(consumer: consumer) } label: {
                        DrawnSettingsRow(title: NativeText.text("sharing.title"), symbol: .sharing, tint: Palette.tealCard, subtitle: NativeText.text("sharing.intro"))
                    }.accessibilityIdentifier("home-data-sharing")
                }.buttonStyle(CredentialPressStyle()).background(Palette.surface, in: RoundedRectangle(cornerRadius: NativeLayout.surfaceRadius))
                appsSection
                VStack(alignment: .leading, spacing: 12) {
                    Text(NativeText.text("learner.more")).font(.title2.bold()).accessibilityAddTraits(.isHeader)
                        .headingFlair(Palette.flairPink)
                    VStack(spacing: 0) {
                        NavigationLink { BuildLearnCardView(appStore: store, receive: intake) } label: {
                            DrawnSettingsRow(title: NativeText.text("build.title"), symbol: .credential, tint: Palette.portfolioCard, subtitle: NativeText.text("build.homeBody"))
                        }.accessibilityIdentifier("home-build")
                        rowDivider
                        NavigationLink { FamiliesView(appStore: store) } label: {
                            DrawnSettingsRow(title: NativeText.text("family.title"), symbol: .family, tint: Palette.familyCard, subtitle: NativeText.text("family.subtitle"))
                        }.accessibilityIdentifier("home-families")
                        rowDivider
                        Button(action: welcome) {
                            DrawnSettingsRow(title: NativeText.text("learner.guide"), symbol: .help, tint: Palette.blueCard)
                        }.accessibilityIdentifier("home-welcome")
                    }.buttonStyle(CredentialPressStyle()).background(Palette.surface, in: RoundedRectangle(cornerRadius: NativeLayout.surfaceRadius))
                    VStack(spacing: 0) {
                        Button(action: create) {
                            DrawnSettingsRow(title: NativeText.text("home.create"), symbol: .pencil, tint: Palette.pinkCard, subtitle: NativeText.text("home.createBody"))
                        }.accessibilityIdentifier("home-create")
                        rowDivider
                        NavigationLink { CreationsView(store: store) } label: {
                            DrawnSettingsRow(title: "Your creations", symbol: .credential, tint: Palette.studiesCard, subtitle: NativeText.text("home.creationsBody"))
                        }.accessibilityIdentifier("home-creations")
                    }.buttonStyle(CredentialPressStyle()).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                    if !(store.snapshot?.activity.isEmpty ?? true) { HomeSessionActivity(items: store.snapshot?.activity ?? []) }
                }
            }.padding(NativeLayout.pageInset).frame(maxWidth: 760).frame(maxWidth: .infinity)
        }.foregroundStyle(Palette.ink)
        .background(SectionBackground(tint: Palette.homeCanvas))
        .onScrollGeometryChange(for: Bool.self) { $0.contentOffset.y + $0.contentInsets.top > 60 } action: { _, value in onScrollStateChange(value) }
        .navigationTitle("").navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Palette.homeCanvas, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
        .task { await consumer.loadInstalled() }
    }

    private var rowDivider: some View { Divider().padding(.leading, 74) }

    @ViewBuilder private var passportSection: some View {
        switch summary.content {
        case .empty:
            VStack(alignment: .leading, spacing: 18) {
                (textSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: 14)) : AnyLayout(HStackLayout(spacing: 12))) {
                    Image("LearnerWelcomeIllustration").resizable().scaledToFit().frame(width: 126, height: 160).accessibilityHidden(true)
                    VStack(alignment: .leading, spacing: 10) {
                        Text(NativeText.text("learner.emptyTitle")).font(.title2.bold()).tracking(-0.4)
                        Text(NativeText.text("learner.emptyBody")).font(.body).foregroundStyle(Palette.secondary)
                    }.frame(maxWidth: .infinity, alignment: .leading)
                }
                PrimaryButton(title: NativeText.text("learner.firstAdd"), fill: Palette.selection, action: add).accessibilityIdentifier("home-first-add")
            }.padding(18).background(Palette.surface, in: RoundedRectangle(cornerRadius: 26))
        case .records:
            VStack(alignment: .leading, spacing: 12) {
                (textSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: 6)) : AnyLayout(HStackLayout(alignment: .firstTextBaseline, spacing: 8))) {
                    Text(NativeText.text("learner.recent")).font(.title2.bold())
                    if !textSize.isAccessibilitySize { Spacer(minLength: 8) }
                    Button(action: openCollection) {
                        Text(NativeText.text("sharePicker.all")).font(.subheadline.weight(.semibold))
                            .frame(minWidth: 44, minHeight: 44).contentShape(Rectangle())
                    }.buttonStyle(.plain).accessibilityIdentifier("home-collection")
                }
                LatestCredentialStack(credentials: summary.recent, store: store, namespace: recentCards,
                                      partial: summary.hasMore, activeID: $recentID)
                if store.error != nil || store.snapshotReadFailed { retryPassport }
            }
        case .loading:
            ProgressView(NativeText.text("learner.loading"))
                .padding(24).frame(maxWidth: .infinity).accessibilityIdentifier("home-loading")
        case .unavailable:
            VStack(alignment: .leading, spacing: 12) {
                Text(NativeText.text("learner.unavailable")).font(.title3.bold())
                retryPassport
            }.padding(20).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
        case .partial:
            VStack(alignment: .leading, spacing: 12) {
                Text(NativeText.text("learner.partialTitle")).font(.title3.bold())
                Text(NativeText.text("learner.partialBody")).font(.body).foregroundStyle(Palette.secondary)
                PrimaryButton(title: NativeText.text("learner.loadMore"), loading: store.isBusy, fill: Palette.selection) { Task { await store.loadMore() } }.accessibilityIdentifier("home-load-more")
            }.padding(20).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
        }
    }
    private var retryPassport: some View {
        PrimaryButton(title: NativeText.text("learner.retry"), loading: store.isBusy, fill: Palette.selection) { Task { await store.refresh() } }
            .accessibilityIdentifier("home-retry")
    }
    private var quickActions: some View {
        (textSize.isAccessibilitySize ? AnyLayout(VStackLayout(spacing: 12)) : AnyLayout(HStackLayout(spacing: 12))) {
            quickAction("claims.title", subtitle: "build.scanBody", image: "DrawnScan", tint: Palette.blueCard, action: receive).accessibilityIdentifier("receive")
            quickAction("learner.share", subtitle: "learner.shareBody", image: "LearnerPlane", tint: Palette.portfolioCard, action: share)
                .disabled(summary.content != .records && summary.content != .partial).opacity(summary.content == .records || summary.content == .partial ? 1 : 0.5).accessibilityIdentifier("home-share")
        }
    }
    private func quickAction(_ title: String, subtitle: String, image: String, tint: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                Image(image).resizable().scaledToFit().frame(height: 48).padding(10).frame(maxWidth: .infinity)
                    .background(tint, in: RoundedRectangle(cornerRadius: 14)).accessibilityHidden(true)
                Text(NativeText.text(title)).font(.headline)
                Text(NativeText.text(subtitle)).font(.subheadline).foregroundStyle(Palette.secondary)
            }.frame(maxWidth: .infinity, minHeight: 154, alignment: .topLeading).padding(16)
                .background(Palette.surface, in: RoundedRectangle(cornerRadius: 24)).contentShape(Rectangle())
        }.buttonStyle(CredentialPressStyle()).multilineTextAlignment(.leading)
    }
    private var inboxCard: some View {
        Button(action: openInbox) {
            (textSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: 12)) : AnyLayout(HStackLayout(spacing: 10))) {
                Image("HomeInboxIllustration").resizable().scaledToFit().frame(width: 96, height: 104).accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 8) {
                    Text(store.inboxCount > 0 ? NativeText.text("learner.incoming") : NativeText.literal("Inbox")).font(.title3.bold()).foregroundStyle(Palette.ink)
                    if let snapshot = store.snapshot {
                        Text(NativeText.count("home.offers", snapshot.offers.count)).font(.subheadline).foregroundStyle(Palette.secondary).accessibilityIdentifier("home-summary-offers")
                        if store.unreadInboxUpdateCount > 0 {
                            Text(NativeText.count("home.updates", store.unreadInboxUpdateCount)).font(.subheadline).foregroundStyle(Palette.secondary).accessibilityIdentifier("home-summary-updates")
                        }
                    }
                    if store.error != nil || store.snapshotReadFailed || store.inbox.error != nil { Text(NativeText.text("home.inboxRetry")).font(.caption).foregroundStyle(Palette.secondary) }
                    else if store.snapshot == nil || !store.inbox.loaded { ProgressView(NativeText.text("inbox.loading")).font(.subheadline) }
                    Text(NativeText.text("home.reviewInbox")).font(.subheadline.weight(.semibold))
                        .foregroundStyle(Palette.selectionInk).padding(.horizontal, 16).padding(.vertical, 12)
                        .background(Palette.selection, in: RoundedRectangle(cornerRadius: 14)).padding(.top, 4)
                }.frame(maxWidth: .infinity, alignment: .leading)
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
