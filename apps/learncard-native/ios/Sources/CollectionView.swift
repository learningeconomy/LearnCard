import SwiftUI
import LearnCardNativeSDK
import LearnCardNativeCore

struct CollectionView: View {
    @Environment(\.locale) private var nativeLocale
    let store: AppStore
    var onScrollStateChange: (Bool) -> Void = { _ in }
    @State private var search = ""
    @State private var appliedQuery = ""
    @State private var kind: CredentialKind?
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
            (kind == nil || $0.kind == kind) &&
            (query.isEmpty || "\($0.title) \($0.issuer) \($0.summary)".localizedCaseInsensitiveContains(appliedQuery))
        }.sorted { $0.date > $1.date }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                PageHeading(title: "Collection")
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
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        filter("All", value: nil)
                        ForEach(CredentialKind.allCases, id: \.self) { filter($0.rawValue, value: $0) }
                    }.padding(.vertical, 2).padding(.horizontal, 20)
                }
                .padding(.horizontal, -20)
                if store.snapshot == nil {
                    VStack(spacing: 16) {
                        if store.isBusy { ProgressView("Loading your collection…") }
                        else { Button(NativeText.literal("Try Again")) { Task { await store.refresh() } } }
                    }.frame(maxWidth: .infinity).padding(.vertical, 50)
                } else if filtering {
                    HStack(spacing: 12) {
                        ProgressView().tint(Palette.green)
                        Text(NativeText.text("collection.filtering")).font(.subheadline).foregroundStyle(Palette.secondary)
                    }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
                        .background(Palette.surface, in: RoundedRectangle(cornerRadius: 20)).accessibilityIdentifier("collection-filtering")
                } else if credentials.isEmpty {
                    if searchMode || kind != nil { searchEmptyState }
                    else {
                        EmptyState(symbol: "rectangle.stack", title: "Your next achievement belongs here",
                                   detail: "Receive or create a credential to get started.")
                    }
                } else {
                    if !searchMode, let first = credentials.first {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text("Latest issued").font(.headline).foregroundStyle(Palette.ink)
                                Spacer()
                                if first.date.timeIntervalSince1970 > 0 {
                                    Text(first.date, format: .dateTime.month(.abbreviated).day().year())
                                        .font(.caption).foregroundStyle(Palette.secondary)
                                }
                            }
                            link(first, featured: true, row: false)
                        }
                    }
                    if searchMode || credentials.count > 1 {
                        HStack(alignment: .firstTextBaseline) {
                            Text(searchMode ? NativeText.text("collection.results") : NativeText.literal("In this view"))
                                .font(.headline).foregroundStyle(Palette.ink)
                            Spacer()
                            if searchMode {
                                Text(NativeText.count("collection.matches", credentials.count)).font(.caption).foregroundStyle(Palette.secondary)
                            } else {
                                Text("\(credentials.count)\(store.snapshot?.hasMore == true ? "+" : "")")
                                    .font(.subheadline.monospacedDigit()).foregroundStyle(Palette.secondary)
                            }
                        }
                        if sizeClass == .regular && !textSize.isAccessibilitySize && !searchMode {
                            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 14), count: 2), spacing: 14) {
                                ForEach(credentials.dropFirst()) { credential in link(credential, featured: false, row: false) }
                            }
                        } else {
                            LazyVStack(spacing: 12) {
                                ForEach(searchMode ? credentials : Array(credentials.dropFirst())) { credential in
                                    link(credential, featured: false, row: true)
                                }
                            }
                        }
                    }
                }
                if searchMode, store.snapshot != nil {
                    if store.snapshot?.hasMore == true {
                        Text(NativeText.text("collection.partialResults")).font(.caption).foregroundStyle(Palette.secondary)
                    }
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
        .navigationTitle(scrolled ? "Collection" : "")
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
            Text(NativeText.text("collection.noMatchesBody")).font(.subheadline).foregroundStyle(Palette.secondary)
            Button(NativeText.text("collection.resetSearch")) { resetSearch() }
                .font(.subheadline.weight(.semibold)).foregroundStyle(Palette.green)
                .padding(.horizontal, 22).frame(minHeight: 44)
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Palette.line)).accessibilityIdentifier("collection-search-reset")
        }.multilineTextAlignment(.center).padding(24).frame(maxWidth: .infinity)
            .background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
    }

    private func resetSearch() { search = ""; appliedQuery = ""; kind = nil; searching = false }

    private func filter(_ title: String, value: CredentialKind?) -> some View {
        Button {
            withAnimation(reduceMotion ? nil : .snappy(duration: 0.25)) { kind = value }
        } label: {
            Text(title).font(.subheadline.weight(.medium))
                .foregroundStyle(kind == value ? Palette.selectionInk : Palette.secondary)
                .padding(.horizontal, 16).padding(.vertical, 11)
                .background(kind == value ? Palette.selection : Palette.surface, in: Capsule())

        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(kind == value ? [.isSelected] : [])
    }
}
