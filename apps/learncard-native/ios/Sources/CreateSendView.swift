import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

struct CreateView: View {
    @Environment(\.dismiss) private var dismiss
    let store: AppStore
    @State private var title = ""
    @State private var summary = ""
    @State private var kind = CredentialKind.achievement

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text("Recognize a skill, a milestone, or a little act of kindness.")
                        .foregroundStyle(Palette.secondary)
                }
                Section("The basics") {
                    TextField("Give it a title", text: $title).accessibilityIdentifier("draft-title")
                    TextField("What makes it special?", text: $summary, axis: .vertical)
                        .lineLimit(3...6).accessibilityIdentifier("draft-summary")
                    Picker("Category", selection: $kind) {
                        ForEach(CredentialKind.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                    }
                }
                Section {
                    PrimaryButton(title: store.isBusy ? "Creating…" : store.isLive ? "Create Credential" : "Create Sample", loading: store.isBusy,
                                  disabled: title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ||
                                            summary.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ||
                                            title.count > 100 || summary.count > 1_000) {
                        Task { if await store.create(title: title, summary: summary, kind: kind) { dismiss() } }
                    }.accessibilityIdentifier("create-confirm")
                } footer: { Text(store.isLive ? "Signs a credential for your account and saves it privately to your collection." : "Creates an unsigned sample in this app. Nothing is published.") }
            }
            .foregroundStyle(Palette.ink)
            .navigationTitle("Create a credential")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } } }
            .scrollDismissesKeyboard(.interactively)
        }
        .interactiveDismissDisabled(store.isBusy)
    }
}

struct SendView: View {
    @Environment(\.dismiss) private var dismiss
    let store: AppStore
    let credential: Credential
    @State private var recipient = "Alex Morgan"
    @State private var profileId = ""
    @State private var verifiedRecipient: AccountRecipient?
    @State private var lookingUp = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                Section { CredentialCard(credential: credential) }.listRowBackground(Color.clear)
                if store.isLive {
                    Section("Choose a recipient") {
                        TextField("LearnCard username", text: $profileId).textInputAutocapitalization(.never).autocorrectionDisabled()
                            .onChange(of: profileId) { _, _ in verifiedRecipient = nil }
                        Button(lookingUp ? "Looking up…" : "Review Recipient") {
                            lookingUp = true; error = nil
                            let requested = profileId
                            Task {
                                defer { lookingUp = false }
                                do {
                                    let recipient = try await store.recipient(requested)
                                    if profileId == requested { verifiedRecipient = recipient }
                                }
                                catch { if profileId == requested { self.error = "Couldn't find that recipient. Check the username and try again." } }
                            }
                        }.disabled(lookingUp || profileId.isEmpty)
                        if let verifiedRecipient { Text("Send to \(verifiedRecipient.name) (@\(verifiedRecipient.id))") }
                        if let error { Text(error).foregroundStyle(Palette.ink) }
                    }
                } else { Section("Choose a sample recipient") {
                    Picker("To", selection: $recipient) {
                        Text("Alex Morgan").tag("Alex Morgan")
                        Text("Jordan Lee").tag("Jordan Lee")
                    }
                } }
                Section {
                    PrimaryButton(title: store.isBusy ? "Sending…" : store.isLive ? "Send Credential" : "Record Sample Send", loading: store.isBusy,
                                  disabled: store.isLive && verifiedRecipient == nil) {
                        Task { if await store.send(credential, to: store.isLive ? verifiedRecipient?.id ?? "" : recipient) { dismiss() } }
                    }.accessibilityIdentifier("send-confirm")
                } footer: { Text(store.isLive ? "Delivers this credential to the confirmed recipient." : "Records this action in Activity. No credential is delivered.") }
            }
            .foregroundStyle(Palette.ink)
            .navigationTitle(store.isLive ? "Send a credential" : "Send a sample")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } } }
        }
        .interactiveDismissDisabled(store.isBusy)
    }
}
