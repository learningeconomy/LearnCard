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
    @State private var browse = CredentialPickerQuery()
    @State private var sheet: PassportBrowseSheet?
    @State private var loader: CredentialPickerLoader
    @State private var visible = false
    @State private var scrolled = false
    @FocusState private var searching: Bool
    @Namespace private var cards
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var textSize

    init(store: AppStore, scan: @escaping () -> Void, create: @escaping () -> Void,
         onScrollStateChange: @escaping (Bool) -> Void = { _ in }) {
        self.store = store; self.scan = scan; self.create = create; self.onScrollStateChange = onScrollStateChange
        _loader = State(initialValue: CredentialPickerLoader(app: store))
    }

    private var query: String { search.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var searchMode: Bool { searching || !query.isEmpty }
    private var filtering: Bool { !query.isEmpty && query != appliedQuery }
    private var resultsMode: Bool { searchMode || browse.dateRange != .any || browse.sort != .newest }
    private var hasMore: Bool { store.snapshot?.hasMore == true }
    private var resultQuery: CredentialPickerQuery {
        var result = browse; result.text = appliedQuery; result.categories = category.map { [$0] } ?? []
        return result
    }
    private var searchesRemainingPages: Bool { visible && !filtering && resultQuery.needsCompleteCollection }

    private var credentials: [Credential] {
        // Browsing must retain unreadable records too; only sharing requires a signed payload.
        resultQuery.results(in: store.snapshot?.credentials ?? [], selected: [], live: false, locale: nativeLocale)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                PageHeading(title: "Passport", identifier: "collection", accent: Palette.flairBlue)
                CredentialActivityStatus(store: store)
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
                browseControls
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
                    // The status beside the title owns first-load progress and retry.
                    Color.clear.frame(height: 50).accessibilityHidden(true)
                } else if filtering {
                    HStack(spacing: 12) {
                        ProgressView().tint(Palette.green)
                        Text(NativeText.text("collection.filtering")).font(.subheadline).foregroundStyle(Palette.secondary)
                    }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
                        .background(Palette.surface, in: RoundedRectangle(cornerRadius: 20)).accessibilityIdentifier("collection-filtering")
                } else if credentials.isEmpty {
                    if !query.isEmpty || browse.dateRange != .any { searchEmptyState }
                    else { collectionEmptyState }
                } else {
                    Group {
                        HStack(alignment: .firstTextBaseline) {
                            Text(searchMode ? NativeText.text("collection.results") : NativeText.literal("In this view"))
                                .font(.headline).foregroundStyle(Palette.ink)
                            Spacer()
                            if resultsMode {
                                Text(NativeText.count(hasMore ? "passport.loadedMatches" : "collection.matches", credentials.count)).font(.caption).foregroundStyle(Palette.secondary)
                            } else {
                                Text("\(credentials.count)\(hasMore ? "+" : "")")
                                    .font(.subheadline.monospacedDigit()).foregroundStyle(Palette.secondary)
                            }
                        }
                        LazyVStack(spacing: 12) {
                            ForEach(credentials) { credential in
                                link(credential)
                            }
                        }
                    }
                }
                if searchMode, store.snapshot != nil {
                    Button(NativeText.text("collection.cancelSearch")) { resetSearch() }
                        .font(.subheadline.weight(.medium)).foregroundStyle(Palette.green).accessibilityIdentifier("collection-search-cancel")
                }
                if hasMore { pagingState }
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
        .sheet(item: $sheet) { PassportBrowseOptions(selection: $0, query: $browse) }
        .onAppear { visible = true }
        .onDisappear { visible = false }
        .task(id: searchesRemainingPages && hasMore) {
            // A refresh can replace a completed search with a new first page.
            if searchesRemainingPages && hasMore { await loader.load(remaining: true) }
        }
        .task(id: query) {
            guard !query.isEmpty else { appliedQuery = ""; return }
            do { try await Task.sleep(for: .milliseconds(180)) } catch { return }
            guard !Task.isCancelled else { return }
            appliedQuery = query
        }
    }

    private var browseControls: some View {
        VStack(alignment: .leading, spacing: 10) {
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 10) { dateButton; sortButton; resetButton }
                VStack(alignment: .leading, spacing: 10) { dateButton; HStack(spacing: 10) { sortButton; resetButton } }
            }
            if browse.dateRange != .any {
                Text(dateSummary).font(.caption).foregroundStyle(Palette.secondary)
                    .fixedSize(horizontal: false, vertical: true).accessibilityIdentifier("passport-date-summary")
            }

        }.accessibilityElement(children: .contain)
    }

    @ViewBuilder private var resetButton: some View {
        if browse.dateRange != .any || browse.sort != .newest {
            Button { resetBrowse() } label: {
                Image(systemName: "arrow.counterclockwise").font(.body.weight(.semibold))
                    .frame(width: 44, height: 44).foregroundStyle(Palette.ink)
                    .background(Palette.surface, in: Circle())
                    .overlay(Circle().stroke(Palette.line, lineWidth: 1))
            }.buttonStyle(CredentialPressStyle())
                .accessibilityLabel(NativeText.text("passport.resetBrowse"))
                .accessibilityIdentifier("passport-reset-browse")
        }
    }

    private var dateSummary: String {
        if browse.dateRange == .custom {
            let style = Date.FormatStyle.dateTime.month(.abbreviated).day().year().locale(nativeLocale)
            return NativeText.format("passport.customDates", browse.from.formatted(style), browse.through.formatted(style))
        }
        return NativeText.text("sharePicker.date.\(browse.dateRange.rawValue)")
    }

    private var dateButton: some View {
        browseButton(title: NativeText.text("sharePicker.dateHeading"), symbol: "calendar", active: browse.dateRange != .any, id: "passport-dates") {
            searching = false; sheet = .date
        }
    }

    private var sortButton: some View {
        browseButton(title: NativeText.format("sharePicker.sortLabel", NativeText.text("sharePicker.sort.\(browse.sort.rawValue)")),
                     symbol: "arrow.up.arrow.down", active: browse.sort != .newest, id: "passport-sort") {
            searching = false; sheet = .sort
        }
    }

    private func browseButton(title: String, symbol: String, active: Bool, id: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Label(title, systemImage: symbol).font(.subheadline.weight(.medium))
                .fixedSize(horizontal: false, vertical: true).padding(.horizontal, 14).padding(.vertical, 10).frame(minHeight: 44)
                .foregroundStyle(Palette.ink).background(Palette.surface, in: Capsule())
                .overlay(Capsule().stroke(active ? Palette.selection : Palette.line, lineWidth: active ? 1.5 : 1))
        }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier(id)
            .accessibilityAddTraits(active ? .isSelected : [])
    }

    private var pagingState: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(NativeText.text(loader.failed ? "passport.partialFailed" : loader.loading ? "passport.searchingAll" : "passport.partial"))
                .font(.caption).foregroundStyle(Palette.secondary).accessibilityIdentifier("passport-paging-status")
            if loader.loading { ProgressView().tint(Palette.green).frame(maxWidth: .infinity, minHeight: 44) }
            else {
                Button { Task { await loader.load(remaining: resultQuery.needsCompleteCollection, retry: true) } } label: {
                    Text(loader.failed ? NativeText.literal("Try Again") : NativeText.literal("Load More"))
                        .font(.subheadline.weight(.semibold)).frame(maxWidth: .infinity, minHeight: 48)
                }.disabled(store.isBusy).buttonStyle(.plain).foregroundStyle(Palette.selection)
                    .accessibilityIdentifier("passport-load-more")
            }
        }
    }

    private func link(_ credential: Credential) -> some View {
        NavigationLink {
            CredentialDetailView(store: store, credential: credential)
                .credentialZoom(id: credential.id, namespace: cards, reduceMotion: reduceMotion)
        } label: {
            CredentialListRow(credential: credential).matchedTransitionSource(id: credential.id, in: cards)
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
            Text(NativeText.text(browse.dateRange == .any ? "collection.noMatchesBody" : "passport.noDatesBody")).font(.subheadline).foregroundStyle(Palette.secondary)
            Button(NativeText.text(browse.dateRange == .any ? "collection.resetSearch" : "passport.resetBrowse")) {
                if browse.dateRange == .any { resetSearch() } else { resetBrowse() }
            }
                .font(.subheadline.weight(.semibold)).foregroundStyle(Palette.green)
                .padding(.horizontal, 22).frame(minHeight: 44)
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Palette.line)).accessibilityIdentifier("collection-search-reset")
        }.multilineTextAlignment(.center).padding(24).frame(maxWidth: .infinity)
            .background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
    }

    private var collectionEmptyState: some View {
        let partial = store.snapshot?.hasMore == true
        return VStack(spacing: 18) {
            Image(category == nil ? "CollectionEmptyIllustration" : "CollectionCategoryEmptyIllustration")
                .resizable().scaledToFit().frame(maxWidth: 224)
                .frame(height: textSize.isAccessibilitySize ? 130 : 164).accessibilityHidden(true)
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
                Button { category = nil } label: {
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

    private func resetBrowse() { browse.resetFilters(); browse.sort = .newest; category = nil }
    private func resetSearch() { search = ""; appliedQuery = ""; resetBrowse(); searching = false }

    private func filter(_ title: String, value: CredentialCategory?) -> some View {
        Button {
            withAnimation(reduceMotion ? nil : .snappy(duration: 0.25)) { category = value }
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
