import SwiftUI
import LearnCardNativeCore

struct ShareCredentialsView: View {
    @Environment(\.dismiss) private var dismiss
    let store: AppStore
    @State private var selected = Set<String>()
    @State private var review = false
    @State private var title = "Shared credentials"
    @State private var protect = false
    @State private var passcode = ""
    @State private var requestID = UUID().uuidString
    @State private var result: CredentialShare?
    @State private var error: String?
    @State private var search = ""
    private var choices: [Credential] {
        (store.snapshot?.credentials ?? []).filter { (!store.isLive || $0.signedPayload != nil) && (search.isEmpty || "\($0.title) \($0.issuer)".localizedCaseInsensitiveContains(search)) }
    }
    private var selectedCredentials: [Credential] { (store.snapshot?.credentials ?? []).filter { selected.contains($0.id) } }
    private var ready: Bool { !selected.isEmpty && selected.count <= 50 && !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && title.count <= 120 && (!protect || (8...64).contains(passcode.count)) }

    var body: some View {
        NavigationStack {
            List {
                if let result, !result.pending {
                    Section {
                        Label(store.isLive ? "Your link is ready" : "Sample selection ready", systemImage: "checkmark.circle.fill").font(.title3.weight(.semibold)).foregroundStyle(Palette.green)
                        Text(store.isLive ? "This link expires in 30 days. Anyone with the link can view the selected credentials\(protect ? " after entering the passcode" : "")." : "This shares unsigned sample text. No online link was created.")
                            .font(.subheadline).foregroundStyle(Palette.secondary)
                        if let url = result.url {
                            ShareLink(item: url) { Label("Share Link", systemImage: "square.and.arrow.up") }.accessibilityIdentifier("share-bundle")
                        } else if let text = result.sampleText {
                            ShareLink(item: text) { Label("Share Sample Selection", systemImage: "square.and.arrow.up") }.accessibilityIdentifier("share-bundle")
                        }
                    }
                } else if review {
                    Section("Selected credentials · \(selected.count)") {
                        ForEach(selectedCredentials) { credential in row(credential, selectable: false) }
                    }
                    Section("Link details") {
                        TextField("Title", text: $title).accessibilityIdentifier("share-title")
                        if store.isLive {
                            Text("Expires in 30 days").font(.subheadline).foregroundStyle(Palette.secondary)
                            Toggle("Require a passcode", isOn: $protect)
                            if protect { SecureField("8–64 characters", text: $passcode).textInputAutocapitalization(.never).autocorrectionDisabled() }
                        }
                    }.disabled(result?.pending == true)
                    Section {
                        Text(store.isLive ? "Shares the complete selected credentials and their public endorsements. Anyone with the link can view them. You can stop the link from LearnCard's web privacy settings." : "Shares sample text through iOS. Nothing is published online.")
                            .font(.subheadline).foregroundStyle(Palette.secondary)
                        PrimaryButton(title: store.isBusy ? "Preparing…" : result?.pending == true ? "Check Link Status" : store.isLive ? "Create Share Link" : "Prepare Sample Selection", loading: store.isBusy, disabled: !ready) {
                            Task { await prepare() }
                        }.accessibilityIdentifier("share-confirm")
                    }
                    if result?.pending == true { Text("The link is still being prepared. Check its status before sharing.").foregroundStyle(Palette.secondary) }
                } else {
                    Section {
                        Text("Choose one or several credentials.").font(.subheadline).foregroundStyle(Palette.secondary)
                        TextField("Find a credential", text: $search).accessibilityIdentifier("share-search")
                    }
                    ForEach(choices) { credential in
                        Button {
                            if selected.contains(credential.id) { selected.remove(credential.id) }
                            else if selected.count < 50 { selected.insert(credential.id) }
                        } label: { row(credential, selectable: true) }
                        .accessibilityIdentifier("share-select-\(credential.id)")
                        .accessibilityAddTraits(selected.contains(credential.id) ? .isSelected : [])
                    }
                    if choices.isEmpty { Text("No matching credentials.").foregroundStyle(Palette.secondary) }
                    if store.snapshot?.hasMore == true {
                        Button(store.isBusy ? "Loading…" : "Load More") { Task { await store.loadMore() } }.disabled(store.isBusy)
                    }
                    Section {
                        PrimaryButton(title: "Review \(selected.count) \(selected.count == 1 ? "Credential" : "Credentials")", disabled: selected.isEmpty) { review = true }
                            .accessibilityIdentifier("share-review")
                    }
                }
                if let error { Text(error).font(.subheadline).foregroundStyle(Palette.secondary) }
            }
            .scrollContentBackground(.hidden).background(Palette.paper)
            .navigationTitle("Share credentials").navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button(result?.pending == false ? "Done" : "Cancel") { passcode = ""; dismiss() }.disabled(store.isBusy) }
                if review && result == nil { ToolbarItem(placement: .topBarTrailing) { Button("Back") { review = false }.disabled(store.isBusy) } }
            }
            .onChange(of: selected) { _, _ in requestID = UUID().uuidString }
            .onChange(of: title) { _, _ in requestID = UUID().uuidString }
            .onChange(of: protect) { _, _ in requestID = UUID().uuidString }
            .onChange(of: passcode) { _, _ in requestID = UUID().uuidString }
        }.interactiveDismissDisabled(store.isBusy)
    }

    private func row(_ credential: Credential, selectable: Bool) -> some View {
        HStack(spacing: 14) {
            CredentialArtwork(credential: credential, size: 52)
            VStack(alignment: .leading, spacing: 4) {
                Text(credential.title).font(.headline).foregroundStyle(Palette.ink)
                Text(credential.issuer).font(.caption).foregroundStyle(Palette.secondary)
            }
            Spacer()
            if selectable {
                Image(systemName: selected.contains(credential.id) ? "checkmark.circle.fill" : "circle")
                    .font(.title3).foregroundStyle(selected.contains(credential.id) ? Palette.green : Palette.secondary)
            }
        }.padding(.vertical, 8)
    }
    @MainActor private func prepare() async {
        error = nil
        do { result = try await store.share(credentialIDs: selectedCredentials.map(\.id), title: title, requestID: requestID, passcode: protect ? passcode : nil) }
        catch { self.error = "Couldn't prepare the link. Your selection is still here; try again." }
    }
}
