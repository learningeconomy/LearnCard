import SwiftUI
import LearnCardNativeSDK
import LearnCardNativeCore

struct CollectionView: View {
    @Environment(\.locale) private var nativeLocale
    let store: AppStore
    let scan: () -> Void
    let create: () -> Void
    var onScrollStateChange: (Bool) -> Void = { _ in }
    @State private var search = ""
    @State private var appliedQuery = ""
    @State private var category: CredentialCategory?
    @State private var latestActiveID: String?
    @State private var scrolled = false
    @FocusState private var searching: Bool
    @Namespace private var cards
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var textSize
    @Environment(\.horizontalSizeClass) private var sizeClass

    private var query: String { search.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var searchMode: Bool { searching || !query.isEmpty }
    private var filtering: Bool { !query.isEmpty && query != appliedQuery }

    private var credentials: [Credential] {
        (store.snapshot?.credentials ?? []).filter {
            $0.belongsInCollection && (category == nil || $0.displayCategory == category) &&
            (query.isEmpty || "\($0.title) \($0.issuer) \($0.summary)".localizedCaseInsensitiveContains(appliedQuery))
        }.sorted { $0.date > $1.date }
    }
    private var featuredID: String? {
        let latest = RecentCredentialDeck.latest(in: credentials)
        return latest.contains(where: { $0.id == latestActiveID }) ? latestActiveID : latest.first?.id
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                PageHeading(title: "Passport", identifier: "collection", accent: Palette.flairBlue)
                if !searchMode { Text(NativeText.literal("My credentials")).font(.subheadline.weight(.medium)).foregroundStyle(Palette.secondary) }
                HStack(spacing: 10) {
                    Image(systemName: "magnifyingglass").foregroundStyle(searchMode ? Palette.green : Palette.secondary)
                        .symbolEffect(.pulse, options: .repeating, isActive: filtering && !reduceMotion).accessibilityHidden(true)
                    TextField(NativeText.literal("Find a credential"), text: $search).focused($searching)
                        .font(.system(.subheadline, design: .rounded))
                        .autocorrectionDisabled().textInputAutocapitalization(.never)
                        .submitLabel(.search).onSubmit { searching = false }
                        .accessibilityIdentifier("collection-search")
                    if !search.isEmpty {
                        Button("Clear search", systemImage: "xmark.circle.fill") { search = "" }
                            .labelStyle(.iconOnly).foregroundStyle(Palette.secondary).accessibilityIdentifier("collection-search-clear")
                    }
                }
                .padding(.horizontal, 16).frame(minHeight: 50)
                .background(Palette.surface, in: RoundedRectangle(cornerRadius: 18))
                .overlay(RoundedRectangle(cornerRadius: 18).stroke(searchMode ? Palette.green.opacity(0.6) : .clear, lineWidth: 1.5))
                ScrollViewReader { proxy in
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            filter("All", value: nil)
                            ForEach(CredentialCategory.collectionCategories, id: \.self) { filter(NativeText.text("credentialCategory.\($0.rawValue)"), value: $0) }
                            if store.snapshot?.credentials.contains(where: { $0.displayCategory == .other }) == true {
                                filter(NativeText.text("credentialCategory.other"), value: .other)
                            }
                        }.padding(.vertical, 2).padding(.horizontal, 20)
                    }.accessibilityIdentifier("collection-categories")
                        .onChange(of: category) { _, value in
                            withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.2)) {
                                proxy.scrollTo(value?.rawValue ?? "all", anchor: .center)
                            }
                        }
                }
                .padding(.horizontal, -20)
                if store.snapshot == nil {
                    VStack(spacing: 16) {
                        if store.isBusy { ProgressView(NativeText.text("collection.loading")) }
                        else { Button(NativeText.literal("Try Again")) { Task { await store.refresh() } } }
                    }.frame(maxWidth: .infinity).padding(.vertical, 50)
                } else if filtering {
                    HStack(spacing: 12) {
                        ProgressView().tint(Palette.green)
                        Text(NativeText.text("collection.filtering")).font(.subheadline).foregroundStyle(Palette.secondary)
                    }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
                        .background(Palette.surface, in: RoundedRectangle(cornerRadius: 20)).accessibilityIdentifier("collection-filtering")
                } else if credentials.isEmpty {
                    if !query.isEmpty { searchEmptyState }
                    else { collectionEmptyState }
                } else {
                    if !searchMode {
                        LatestCredentialStack(credentials: RecentCredentialDeck.latest(in: credentials), store: store, namespace: cards,
                                              partial: store.snapshot?.hasMore == true, activeID: $latestActiveID)
                            .id(category?.rawValue ?? "all")
                    }
                    if searchMode || credentials.count > 1 {
                        HStack(alignment: .firstTextBaseline) {
                            Text(searchMode ? NativeText.text("collection.results") : NativeText.literal("In this view"))
                                .font(.headline).foregroundStyle(Palette.ink)
                            Spacer()
                            if searchMode {
                                Text(NativeText.count("collection.matches", credentials.count)).font(.caption).foregroundStyle(Palette.secondary)
                            } else {
                                Text("\(credentials.count)\(category == nil && store.snapshot?.hasMore == true ? "+" : "")")
                                    .font(.subheadline.monospacedDigit()).foregroundStyle(Palette.secondary)
                            }
                        }
                        if sizeClass == .regular && !textSize.isAccessibilitySize && !searchMode {
                            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 14), count: 2), spacing: 14) {
                                ForEach(credentials.filter { $0.id != featuredID }) { credential in link(credential, featured: false, row: false) }
                            }
                        } else {
                            LazyVStack(spacing: 12) {
                                ForEach(searchMode ? credentials : credentials.filter { $0.id != featuredID }) { credential in
                                    link(credential, featured: false, row: true)
                                }
                            }
                        }
                    }
                }
                if store.snapshot?.hasMore == true, searchMode || category != nil {
                    Text(NativeText.text(searchMode ? "collection.partialResults" : "collection.partialCategory"))
                        .font(.caption).foregroundStyle(Palette.secondary)
                }
                if searchMode, store.snapshot != nil {
                    Button(NativeText.text("collection.cancelSearch")) { resetSearch() }
                        .font(.subheadline.weight(.medium)).foregroundStyle(Palette.green).accessibilityIdentifier("collection-search-cancel")
                }
                if store.snapshot?.hasMore == true {
                    Button { Task { await store.loadMore() } } label: {
                        HStack { if store.isBusy { ProgressView() }; Text(store.isBusy ? NativeText.literal("Loading…") : searchMode ? NativeText.text("collection.searchMore") : NativeText.literal("Load More")) }
                            .font(.subheadline.weight(.semibold)).frame(maxWidth: .infinity, minHeight: 48)
                    }.disabled(store.isBusy).buttonStyle(.plain).foregroundStyle(Palette.selection)
                }
            }
            .padding(.horizontal, 20).padding(.top, 10).padding(.bottom, 28)
        }
        .background(SectionBackground(tint: Palette.collectionCanvas))
        .onScrollGeometryChange(for: Bool.self) { geometry in
            geometry.contentOffset.y + geometry.contentInsets.top > 60
        } action: { _, compact in scrolled = compact; onScrollStateChange(compact) }
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Palette.collectionCanvas, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .scrollDismissesKeyboard(.interactively)
        .refreshable { await store.refresh() }
        .task(id: query) {
            guard !query.isEmpty else { appliedQuery = ""; return }
            do { try await Task.sleep(for: .milliseconds(180)) } catch { return }
            guard !Task.isCancelled else { return }
            appliedQuery = query
        }
    }

    private func link(_ credential: Credential, featured: Bool, row: Bool) -> some View {
        NavigationLink {
            CredentialDetailView(store: store, credential: credential)
                .credentialZoom(id: credential.id, namespace: cards, reduceMotion: reduceMotion)
        } label: {
            Group {
                if row { CredentialListRow(credential: credential) }
                else { CredentialCard(credential: credential, featured: featured, onWhiteSurface: !featured) }
            }.matchedTransitionSource(id: credential.id, in: cards)
        }
        .buttonStyle(CredentialPressStyle())
        .accessibilityIdentifier("credential-\(credential.id)")
    }

    private var searchEmptyState: some View {
        VStack(spacing: 14) {
            Image("SearchEmptyIllustration").resizable().scaledToFit().frame(width: 180, height: 135).accessibilityHidden(true)
            Text(NativeText.text(store.snapshot?.hasMore == true ? "collection.noLoadedMatches" : "collection.noMatches"))
                .font(.title3.weight(.semibold)).foregroundStyle(Palette.ink)
                .accessibilityIdentifier("collection-empty-search")
            Text(NativeText.text("collection.noMatchesBody")).font(.subheadline).foregroundStyle(Palette.secondary)
            Button(NativeText.text("collection.resetSearch")) { resetSearch() }
                .font(.subheadline.weight(.semibold)).foregroundStyle(Palette.green)
                .padding(.horizontal, 22).frame(minHeight: 44)
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Palette.line)).accessibilityIdentifier("collection-search-reset")
        }.multilineTextAlignment(.center).padding(24).frame(maxWidth: .infinity)
            .background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
    }

    private var collectionEmptyState: some View {
        let partial = store.snapshot?.hasMore == true
        return VStack(spacing: 18) {
            if let category {
                ZStack {
                    Image("CollectionCategoryEmptyIllustration").resizable().scaledToFit()
                    Image(category.illustration).resizable().scaledToFit().frame(width: 58, height: 58)
                        .padding(12).background(Palette.categoryTint(category), in: RoundedRectangle(cornerRadius: 20))
                        .rotationEffect(.degrees(8)).offset(x: 64, y: 22)
                }.frame(width: 224, height: 164).accessibilityHidden(true)
            } else {
                Image("CollectionEmptyIllustration").resizable().scaledToFit()
                    .frame(maxWidth: 250).frame(height: textSize.isAccessibilitySize ? 130 : 190).accessibilityHidden(true)
            }
            VStack(spacing: 10) {
                Text(NativeText.text(partial ? "collection.empty.loadedTitle" : category == nil ? "collection.empty.title" : "collection.empty.categoryTitle"))
                    .font(.title2.bold()).foregroundStyle(Palette.ink)
                    .accessibilityIdentifier(category == nil ? "collection-empty-all" : "collection-empty-category")
                Text(partial ? NativeText.text("collection.empty.loadedBody") : category.map {
                    NativeText.format("collection.empty.categoryBody", NativeText.text("credentialCategory.\($0.rawValue)"))
                } ?? NativeText.text("collection.empty.body"))
                    .font(.subheadline).foregroundStyle(Palette.secondary).fixedSize(horizontal: false, vertical: true)
            }
            if category != nil {
                Button { category = nil; latestActiveID = nil } label: {
                    Text(NativeText.text("collection.empty.viewAll")).font(.body.weight(.semibold))
                        .frame(maxWidth: .infinity, minHeight: 50).foregroundStyle(Palette.ink)
                        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Palette.line, lineWidth: 1.5))
                }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("collection-empty-view-all")
            } else if !partial {
                VStack(spacing: 8) {
                    PrimaryButton(title: NativeText.text("claims.title"), fill: Palette.selection, action: scan)
                        .accessibilityIdentifier("collection-empty-scan")
                    Button(NativeText.literal("Create a credential"), action: create)
                        .font(.body.weight(.semibold)).frame(maxWidth: .infinity, minHeight: 48)
                        .foregroundStyle(Palette.ink).buttonStyle(CredentialPressStyle())
                        .accessibilityIdentifier("collection-empty-create")
                }
            }
        }.multilineTextAlignment(.center).padding(24).frame(maxWidth: .infinity)
            .background(Palette.surface, in: RoundedRectangle(cornerRadius: 28))
    }

    private func resetSearch() { search = ""; appliedQuery = ""; category = nil; searching = false }

    private func filter(_ title: String, value: CredentialCategory?) -> some View {
        Button {
            withAnimation(reduceMotion ? nil : .snappy(duration: 0.25)) { category = value; latestActiveID = nil }
        } label: {
            Text(NativeText.literal(title)).font(.subheadline.weight(.medium))
                .foregroundStyle(category == value ? Palette.selectionInk : Palette.secondary)
                .padding(.horizontal, 16).padding(.vertical, 11)
                .background(category == value ? Palette.selection : Palette.surface, in: Capsule())

        }
        .buttonStyle(.plain)
        .id(value?.rawValue ?? "all")
        .accessibilityAddTraits(category == value ? [.isSelected] : [])
        .accessibilityIdentifier("collection-category-\(value?.rawValue ?? "all")")
    }
}
