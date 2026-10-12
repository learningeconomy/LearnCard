import SwiftUI
import LearnCardNativeCore

struct CollectionView: View {
    let store: AppStore
    var onScrollStateChange: (Bool) -> Void = { _ in }
    @State private var search = ""
    @State private var kind: CredentialKind?
    @State private var scrolled = false
    @FocusState private var searching: Bool
    @Namespace private var cards
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var textSize

    private var credentials: [Credential] {
        (store.snapshot?.credentials ?? []).filter {
            (kind == nil || $0.kind == kind) &&
            (search.isEmpty || "\($0.title) \($0.issuer) \($0.summary)".localizedCaseInsensitiveContains(search))
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 26) {
                PageHeading(title: "Collection")
                HStack(spacing: 10) {
                    Image(systemName: "magnifyingglass").foregroundStyle(Palette.secondary).accessibilityHidden(true)
                    TextField("Find a credential", text: $search).focused($searching)
                        .submitLabel(.search).onSubmit { searching = false }
                        .accessibilityIdentifier("collection-search")
                    if !search.isEmpty {
                        Button("Clear search", systemImage: "xmark.circle.fill") { search = "" }
                            .labelStyle(.iconOnly).foregroundStyle(Palette.secondary)
                    }
                }
                .padding(.horizontal, 16).frame(minHeight: 50)
                .background(Palette.surface, in: RoundedRectangle(cornerRadius: 18))
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
                        else { Button("Try Again") { Task { await store.refresh() } } }
                    }.frame(maxWidth: .infinity).padding(.vertical, 50)
                } else if credentials.isEmpty {
                    EmptyState(symbol: "rectangle.stack", title: "Your next achievement belongs here",
                               detail: search.isEmpty ? "Receive or create a credential to get started." : "Try another search or category.")
                } else {
                    if let first = credentials.first { link(first, featured: true) }
                    if credentials.count > 1 {
                        HStack(alignment: .firstTextBaseline) {
                            Text("Collected along the way").font(.headline).foregroundStyle(Palette.ink)
                            Spacer()
                            Text("\(credentials.count)\(store.snapshot?.hasMore == true ? "+" : "")")
                                .font(.subheadline.monospacedDigit()).foregroundStyle(Palette.secondary)
                        }
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 14), count: textSize.isAccessibilitySize ? 1 : 2), spacing: 14) {
                            ForEach(credentials.dropFirst()) { credential in link(credential, featured: false) }
                        }
                    }
                }
                if store.snapshot?.hasMore == true {
                    Button { Task { await store.loadMore() } } label: {
                        HStack { if store.isBusy { ProgressView() }; Text(store.isBusy ? "Loading…" : "Load More") }
                            .font(.subheadline.weight(.semibold)).frame(maxWidth: .infinity, minHeight: 48)
                    }.disabled(store.isBusy).buttonStyle(.plain).foregroundStyle(Palette.green)
                }
            }
            .padding(.horizontal, 20).padding(.top, 10).padding(.bottom, 28)
        }
        .background(SectionBackground(tint: Palette.paper))
        .onScrollGeometryChange(for: Bool.self) { geometry in
            geometry.contentOffset.y + geometry.contentInsets.top > 60
        } action: { _, compact in scrolled = compact; onScrollStateChange(compact) }
        .navigationTitle(scrolled ? "Collection" : "")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Palette.paper, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .scrollDismissesKeyboard(.interactively)
        .refreshable { await store.refresh() }
    }

    private func link(_ credential: Credential, featured: Bool) -> some View {
        NavigationLink {
            CredentialDetailView(store: store, credential: credential)
                .credentialZoom(id: credential.id, namespace: cards, reduceMotion: reduceMotion)
        } label: {
            CredentialCard(credential: credential, featured: featured)
                .matchedTransitionSource(id: credential.id, in: cards)
        }
        .buttonStyle(CredentialPressStyle())
        .accessibilityIdentifier("credential-\(credential.id)")
    }

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
