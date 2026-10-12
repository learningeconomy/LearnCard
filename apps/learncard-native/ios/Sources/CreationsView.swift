import SwiftUI
import LearnCardNativeCore

struct CreationsView: View {
    let store: AppStore
    var sendOnSelect = false
    @State private var send: Credential?
    @State private var items: [Credential] = []
    @State private var cursor: String?
    @State private var hasMore = false
    @State private var loading = false
    @State private var error: String?
    @State private var loaded = false
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Credentials you can give again.").font(.subheadline).foregroundStyle(Palette.secondary)
                if loading { ProgressView("Loading your creations…").frame(maxWidth: .infinity) }
                if let error { Text(error).foregroundStyle(Palette.secondary); Button("Try Again") { Task { await load(more: false) } } }
                if loaded && items.isEmpty { EmptyState(symbol: "sparkles", title: "Make something worth giving", detail: "Credentials you create will appear here.") }
                ForEach(items) { credential in
                    if sendOnSelect {
                        Button { send = credential } label: { CredentialCard(credential: credential, featured: true) }
                            .buttonStyle(CredentialPressStyle()).accessibilityIdentifier("creation-\(credential.id)")
                    } else {
                        NavigationLink { CredentialDetailView(store: store, credential: credential, isCreation: true) } label: {
                            CredentialCard(credential: credential, featured: true)
                        }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("creation-\(credential.id)")
                    }
                }
                if hasMore { Button("Load More") { Task { await load(more: true) } }.disabled(loading) }
            }.padding(20)
        }.background(Palette.paper).navigationTitle("Your creations").navigationBarTitleDisplayMode(.inline)
            .sheet(item: $send) { SendView(store: store, credential: $0) }
            .task { if !loaded { await load(more: false) } }
            .refreshable { await load(more: false) }
    }
    @MainActor private func load(more: Bool) async {
        guard !loading else { return }
        loading = true; error = nil
        defer { loading = false }
        do {
            let page = try await store.creations(cursor: more ? cursor : nil)
            if more { items += page.credentials.filter { candidate in !items.contains { $0.id == candidate.id } } }
            else { items = page.credentials }
            cursor = page.cursor; hasMore = page.hasMore; loaded = true
        } catch { self.error = "Couldn't load your creations. Try again." }
    }
}
