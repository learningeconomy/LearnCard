import SwiftUI
import LearnCardNativeSDK
import LearnCardNativeCore

struct CreationsView: View {
    @Environment(\.locale) private var nativeLocale
    @Environment(\.dismiss) private var dismiss
    let store: AppStore
    var sendOnSelect = false
    var initialRecipient: AccountRecipient? = nil
    @State private var showCreate = false
    @State private var completed = false
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
                if let initialRecipient {
                    VStack(alignment: .leading, spacing: 5) {
                        Text(NativeText.format("builder.forPerson", initialRecipient.name)).font(.title2.bold())
                        Text("@\(initialRecipient.id)").font(.subheadline).foregroundStyle(Palette.secondary)
                            .environment(\.layoutDirection, .leftToRight)
                    }.accessibilityElement(children: .combine).accessibilityIdentifier("creations-recipient")
                }
                if sendOnSelect {
                    Button { showCreate = true } label: {
                        DrawnSettingsRow(title: NativeText.text("home.create"), symbol: .pencil, tint: Palette.pinkCard,
                                         subtitle: NativeText.text("home.createBody"))
                    }.buttonStyle(CredentialPressStyle()).background(Palette.surface, in: RoundedRectangle(cornerRadius: 24))
                        .accessibilityIdentifier("creations-create")
                }
                Text("Credentials you can give again.").font(.subheadline).foregroundStyle(Palette.secondary)
                if loading { ProgressView("Loading your creations…").frame(maxWidth: .infinity) }
                if let error { Text(error).foregroundStyle(Palette.secondary); Button(NativeText.literal("Try Again")) { Task { await load(more: false) } } }
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
        }.background(Palette.paper).foregroundStyle(Palette.ink)
            .navigationTitle(NativeText.literal("Your creations")).navigationBarTitleDisplayMode(.inline)
            .sheet(item: $send, onDismiss: finishOrReload) {
                SendView(store: store, credential: $0, initialRecipient: initialRecipient, onComplete: { completed = true })
            }
            .sheet(isPresented: $showCreate, onDismiss: finishOrReload) {
                CreateView(store: store, initialRecipient: initialRecipient, onComplete: { completed = true })
            }
            .task { if !loaded { await load(more: false) } }
            .refreshable { await load(more: false) }
            #if DEBUG
            .modifier(NativeReviewPreferences())
            #endif
    }
    private func finishOrReload() {
        if completed { completed = false; dismiss() }
        else { Task { await load(more: false) } }
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
