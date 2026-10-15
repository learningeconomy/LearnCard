import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

struct ShareCredentialPicker: View {
    let store: AppStore
    @Binding var selection: CredentialPickerSelection
    let onReview: () -> Void
    @Binding var query: CredentialPickerQuery
    @State private var loader: CredentialPickerLoader
    @State private var showFilters = false
    @State private var showSort = false
    @Environment(\.locale) private var locale
    @FocusState private var searching: Bool

    init(store: AppStore, selection: Binding<CredentialPickerSelection>, query: Binding<CredentialPickerQuery>, onReview: @escaping () -> Void) {
        self.store = store; _selection = selection; _query = query; self.onReview = onReview
        _loader = State(initialValue: CredentialPickerLoader(app: store))
    }
    private var records: [Credential] { store.snapshot?.credentials ?? [] }
    private var matches: [Credential] { query.results(in: records, selected: selection.ids, live: store.isLive, locale: locale) }
    private var hasMore: Bool { store.snapshot?.hasMore == true }
    private var filterTitle: String {
        query.filterCount == 0 ? NativeText.text("sharePicker.filters") : NativeText.count("sharePicker.filterCount", query.filterCount)
    }

    var body: some View {
        let results = matches
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 16) {
                controls
                HStack(alignment: .firstTextBaseline) {
                    Text(NativeText.count("sharePicker.matches", results.count)).font(.headline).foregroundStyle(Palette.ink)
                    Spacer()
                    if hasMore && !query.selectedOnly {
                        HStack(spacing: 6) {
                            if loader.loading { ProgressView().controlSize(.small) }
                            Text(NativeText.text(query.needsCompleteCollection && !loader.failed ? "sharePicker.searching" : "sharePicker.partial"))
                                .font(.caption).foregroundStyle(Palette.secondary)
                        }
                    }
                }.accessibilityIdentifier("share-result-count")
                if loader.failed && hasMore && !query.selectedOnly { pagingState }
                if results.isEmpty { emptyState }
                ForEach(results) { credential in
                    Button { selection.toggle(credential.id) } label: {
                        SharePickerRow(credential: credential, selected: selection.ids.contains(credential.id))
                    }.buttonStyle(.plain)
                        .disabled(!selection.ids.contains(credential.id) && selection.ids.count == CredentialPickerSelection.limit)
                        .accessibilityIdentifier("share-select-\(credential.id)")
                        .accessibilityAddTraits(selection.ids.contains(credential.id) ? .isSelected : [])
                }
                if !query.selectedOnly && hasMore && !loader.failed {
                    pagingState
                        .task(id: records.count) {
                            if !query.needsCompleteCollection && !loader.failed { await loader.load() }
                        }
                }
                if store.isLive && records.contains(where: { $0.belongsInCollection && $0.signedPayload == nil }) {
                    Text(NativeText.text("sharePicker.unavailable")).font(.footnote).foregroundStyle(Palette.secondary)
                }
            }.padding(20)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Palette.paper)
        .safeAreaInset(edge: .bottom, spacing: 0) { selectionBar }
        .task(id: query.needsCompleteCollection) {
            if query.needsCompleteCollection { await loader.load(remaining: true) }
        }
        .sheet(isPresented: $showFilters) { SharePickerFilters(query: $query) }
        .confirmationDialog(NativeText.text("sharePicker.sort"), isPresented: $showSort, titleVisibility: .visible) {
            ForEach(CredentialPickerSort.allCases, id: \.self) { order in
                Button(NativeText.text("sharePicker.sort.\(order.rawValue)")) { query.sort = order }
            }
            Button(NativeText.text("common.cancel"), role: .cancel) {}
        }
    }

    private var controls: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 12) {
                DrawnTile(symbol: .sharing, tint: Palette.pinkCard, size: 44)
                Text(NativeText.text("sharePicker.intro")).font(.subheadline.weight(.medium)).foregroundStyle(Palette.secondary)
            }
            if !query.selectedOnly {
            HStack(spacing: 10) {
                Image(systemName: "magnifyingglass").foregroundStyle(Palette.secondary).accessibilityHidden(true)
                TextField(NativeText.text("sharePicker.search"), text: $query.text)
                    .focused($searching).autocorrectionDisabled().textInputAutocapitalization(.never)
                    .submitLabel(.search).onSubmit { searching = false }.accessibilityIdentifier("share-search")
                if !query.text.isEmpty {
                    Button { query.text = "" } label: { Image(systemName: "xmark.circle.fill") }
                        .accessibilityLabel(NativeText.text("sharePicker.clearSearch"))
                        .accessibilityIdentifier("share-search-clear").frame(minWidth: 44, minHeight: 44)
                }
            }.font(.body).foregroundStyle(Palette.ink).padding(.horizontal, 14).frame(minHeight: 54)
                .background(Palette.surface, in: RoundedRectangle(cornerRadius: 18))
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 10) { filterButton; sortButton }
                VStack(alignment: .leading, spacing: 8) { filterButton; sortButton }
            }
            if query.filterCount > 0 {
                HStack(alignment: .top, spacing: 8) {
                    Text(filterSummary).font(.footnote).foregroundStyle(Palette.secondary).frame(maxWidth: .infinity, alignment: .leading)
                    Button(NativeText.text("sharePicker.resetFilters")) { query.resetFilters() }
                        .font(.footnote.weight(.semibold)).frame(minHeight: 44).accessibilityIdentifier("share-filter-reset")
                }
            }
            }
            Picker(NativeText.text("sharePicker.scope"), selection: $query.selectedOnly) {
                Text(NativeText.text("sharePicker.all")).tag(false)
                Text(NativeText.count("sharePicker.selected", selection.ids.count)).tag(true)
            }.pickerStyle(.segmented).accessibilityIdentifier("share-scope")
        }
    }
    private var filterSummary: String {
        let categories = (CredentialCategory.collectionCategories + [.other]).filter { query.categories.contains($0) }
            .map { NativeText.text("credentialCategory.\($0.rawValue)") }
        var parts = categories
        if query.dateRange == .custom {
            parts.append("\(query.from.formatted(.dateTime.year().month(.abbreviated).day().locale(locale))) – \(query.through.formatted(.dateTime.year().month(.abbreviated).day().locale(locale)))")
        } else if query.dateRange != .any { parts.append(NativeText.text("sharePicker.date.\(query.dateRange.rawValue)")) }
        return parts.joined(separator: " · ")
    }
    private var filterButton: some View {
        Button { searching = false; showFilters = true } label: {
            Label(filterTitle, systemImage: "line.3.horizontal.decrease")
                .font(.subheadline.weight(.semibold)).padding(.horizontal, 14).frame(minHeight: 44)
                .background(query.filterCount > 0 ? Palette.blueCard : Palette.surface, in: Capsule())
                .foregroundStyle(query.filterCount > 0 ? Palette.cardInk : Palette.ink)
        }.buttonStyle(.plain).accessibilityIdentifier("share-filters")
    }
    private var sortButton: some View {
        Button { searching = false; showSort = true } label: {
            Label(NativeText.text("sharePicker.sort.\(query.sort.rawValue)"), systemImage: "arrow.up.arrow.down")
                .font(.subheadline.weight(.medium)).padding(.horizontal, 14).frame(minHeight: 44)
                .background(Palette.surface, in: Capsule()).foregroundStyle(Palette.ink)
        }.buttonStyle(.plain).accessibilityLabel(NativeText.format("sharePicker.sortLabel", NativeText.text("sharePicker.sort.\(query.sort.rawValue)")))
            .accessibilityIdentifier("share-sort")
    }
    private var selectionBar: some View {
        VStack(spacing: 10) {
            HStack {
                Text(NativeText.count(selection.ids.count == CredentialPickerSelection.limit ? "sharePicker.limit" : "sharePicker.selected", selection.ids.count))
                    .font(.subheadline.weight(.semibold)).foregroundStyle(Palette.ink).accessibilityIdentifier("share-selection-count")
                Spacer()
                if !selection.ids.isEmpty {
                    Button(NativeText.text("sharePicker.clearSelection")) { selection.clear() }
                        .font(.subheadline).frame(minHeight: 44).accessibilityIdentifier("share-selection-clear")
                }
            }
            PrimaryButton(title: NativeText.text("sharePicker.review"), disabled: selection.ids.isEmpty, fill: Palette.selection) {
                searching = false; onReview()
            }.accessibilityIdentifier("share-review")
        }.padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 10)
            .background(Palette.surface).overlay(alignment: .top) { Rectangle().fill(Palette.line).frame(height: 1) }
    }
    @ViewBuilder private var pagingState: some View {
        if loader.failed {
            VStack(spacing: 10) {
                Text(NativeText.text("sharePicker.pageError")).font(.subheadline).foregroundStyle(Palette.secondary)
                Button(NativeText.text("sharePicker.retry")) { Task { await loader.load(remaining: query.needsCompleteCollection, retry: true) } }
                    .frame(minHeight: 44).accessibilityIdentifier("share-load-retry")
            }.padding(16).frame(maxWidth: .infinity).background(Palette.surface, in: RoundedRectangle(cornerRadius: 18))
        } else {
            HStack(spacing: 12) {
                ProgressView()
                Text(NativeText.text(query.needsCompleteCollection ? "sharePicker.searching" : "sharePicker.loading"))
                    .font(.subheadline).foregroundStyle(Palette.secondary)
            }.frame(maxWidth: .infinity).padding(16).accessibilityIdentifier("share-loading")
        }
    }
    private var emptyState: some View {
        VStack(spacing: 12) {
            Image("SearchEmptyIllustration").resizable().scaledToFit().frame(width: 128, height: 100).accessibilityHidden(true)
            Text(NativeText.text(query.selectedOnly ? "sharePicker.noneSelected" : hasMore ? "sharePicker.searching" : "sharePicker.noMatches"))
                .font(.title3.weight(.semibold)).foregroundStyle(Palette.ink)
            if !query.selectedOnly {
                Text(NativeText.text(hasMore ? "sharePicker.moreHint" : "sharePicker.emptyHint"))
                    .font(.subheadline).foregroundStyle(Palette.secondary).multilineTextAlignment(.center)
            }
        }.frame(maxWidth: .infinity).padding(24).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
            .accessibilityIdentifier("share-empty")
    }
}

struct SharePickerRow: View {
    let credential: Credential
    var selected: Bool = false
    @Environment(\.locale) private var locale
    @Environment(\.dynamicTypeSize) private var textSize
    @ScaledMetric(relativeTo: .headline) private var titleSize = 18.0
    var body: some View {
        Group {
            if textSize.isAccessibilitySize {
                VStack(alignment: .leading, spacing: 12) {
                    HStack { artwork; Spacer(); selectionMark }
                    details
                }
            } else {
                HStack(spacing: 12) { artwork; details; selectionMark }
            }
        }.multilineTextAlignment(.leading).padding(14).frame(maxWidth: .infinity, minHeight: 104)
            .fixedSize(horizontal: false, vertical: true)
            .background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
            .overlay(RoundedRectangle(cornerRadius: 22).stroke(selected ? Palette.selection : .clear, lineWidth: 2))
            .accessibilityElement(children: .combine)
    }
    private var artwork: some View {
        CredentialArtwork(credential: credential, size: textSize.isAccessibilitySize ? 44 : 52)
            .padding(6).background(Palette.categoryTint(credential.displayCategory), in: RoundedRectangle(cornerRadius: 16))
    }
    private var selectionMark: some View {
        Image(systemName: selected ? "checkmark.circle.fill" : "circle")
            .font(.title2).foregroundStyle(selected ? Palette.selection : Palette.secondary).accessibilityHidden(true)
    }
    private var details: some View {
        VStack(alignment: .leading, spacing: 5) {
                Text(credential.title).font(.system(size: titleSize, weight: .semibold)).foregroundStyle(Palette.ink)
                    .lineLimit(textSize.isAccessibilitySize ? nil : 3)
                Text(credential.issuer).font(.subheadline).foregroundStyle(Palette.secondary)
                Text(credential.categoryTitle).font(.footnote.weight(.medium)).foregroundStyle(Palette.categoryAccent(credential.displayCategory))
                if credential.date.timeIntervalSince1970 > 0 {
                    Text(credential.date, format: .dateTime.month(.abbreviated).day().year().locale(locale)).font(.caption).foregroundStyle(Palette.secondary)
                }
            }.frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct SharePickerFilters: View {
    @Binding var query: CredentialPickerQuery
    @State private var draft: CredentialPickerQuery
    @Environment(\.dismiss) private var dismiss
    init(query: Binding<CredentialPickerQuery>) { _query = query; _draft = State(initialValue: query.wrappedValue) }
    var body: some View {
        NavigationStack {
            Form {
                Section {
                    ForEach(CredentialPickerDate.allCases, id: \.self) { range in
                        Button { draft.dateRange = range } label: {
                            HStack {
                                Text(NativeText.text("sharePicker.date.\(range.rawValue)"))
                                Spacer()
                                if draft.dateRange == range { Image(systemName: "checkmark").accessibilityHidden(true) }
                            }.foregroundStyle(Palette.ink).frame(minHeight: 32).contentShape(Rectangle())
                        }.accessibilityIdentifier("share-date-\(range.rawValue)")
                            .accessibilityAddTraits(draft.dateRange == range ? .isSelected : [])
                    }
                    if draft.dateRange == .custom {
                        DatePicker(NativeText.text("sharePicker.from"), selection: $draft.from, displayedComponents: .date)
                            .accessibilityIdentifier("share-date-from")
                            .onChange(of: draft.from) { _, value in if value > draft.through { draft.through = value } }
                        DatePicker(NativeText.text("sharePicker.through"), selection: $draft.through, in: draft.from..., displayedComponents: .date)
                            .accessibilityIdentifier("share-date-through")
                    }
                } header: { Text(NativeText.text("sharePicker.dateHeading")) }
                  footer: { Text(NativeText.text("sharePicker.dateHint")) }
                Section {
                    ForEach(CredentialCategory.collectionCategories + [.other], id: \.self) { category in
                        Button {
                            if draft.categories.contains(category) { draft.categories.remove(category) }
                            else { draft.categories.insert(category) }
                        } label: {
                            HStack(spacing: 12) {
                                RoundedRectangle(cornerRadius: 6).fill(Palette.categoryTint(category)).frame(width: 22, height: 22).accessibilityHidden(true)
                                Text(NativeText.text("credentialCategory.\(category.rawValue)"))
                                Spacer()
                                Image(systemName: draft.categories.contains(category) ? "checkmark.circle.fill" : "circle")
                                    .foregroundStyle(draft.categories.contains(category) ? Palette.selection : Palette.secondary).accessibilityHidden(true)
                            }.foregroundStyle(Palette.ink).frame(minHeight: 36).contentShape(Rectangle())
                        }.accessibilityIdentifier("share-filter-\(category.rawValue)")
                            .accessibilityAddTraits(draft.categories.contains(category) ? .isSelected : [])
                    }
                } header: { Text(NativeText.text("sharePicker.categoryHeading")) }
                  footer: { Text(NativeText.text("sharePicker.categoryHint")) }
            }.scrollContentBackground(.hidden).background(Palette.paper)
                .navigationTitle(NativeText.text("sharePicker.filters")).navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) { Button(NativeText.text("common.cancel")) { dismiss() } }
                    ToolbarItem(placement: .confirmationAction) { Button(NativeText.text("sharePicker.apply")) {
                        query.categories = draft.categories; query.dateRange = draft.dateRange
                        query.from = draft.from; query.through = draft.through; dismiss()
                    }.fontWeight(.semibold).accessibilityIdentifier("share-filter-apply") }
                }
                .safeAreaInset(edge: .bottom) {
                    Button(NativeText.text("sharePicker.resetFilters")) { draft.resetFilters() }
                        .frame(maxWidth: .infinity, minHeight: 44).padding(10).background(Palette.surface)
                }
        }
        .environment(\.locale, NativeLanguage.selected.locale)
        .environment(\.layoutDirection, NativeLanguage.selected.isRightToLeft ? .rightToLeft : .leftToRight)
        #if DEBUG
        .modifier(NativeReviewPreferences())
        #endif
    }
}
