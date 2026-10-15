import SwiftUI
import LearnCardNativeSDK
import LearnCardNativeCore

struct ShareCredentialsView: View {
    @Environment(\.locale) private var nativeLocale
    @Environment(\.dismiss) private var dismiss
    let store: AppStore
    @State private var selected = CredentialPickerSelection()
    @State private var query = CredentialPickerQuery()
    @State private var review = false
    @State private var title = "Shared credentials"
    @State private var protect = false
    @State private var passcode = ""
    @State private var requestID = UUID().uuidString
    @State private var result: CredentialShare?
    @State private var error: String?
    private var selectedCredentials: [Credential] { (store.snapshot?.credentials ?? []).filter { selected.ids.contains($0.id) && $0.belongsInCollection && (!store.isLive || $0.signedPayload != nil) } }
    private var ready: Bool { !selected.ids.isEmpty && selected.ids.count == selectedCredentials.count && selected.ids.count <= CredentialPickerSelection.limit && !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && title.count <= 120 && (!protect || (8...64).contains(passcode.count)) }

    var body: some View {
        NavigationStack {
            Group {
                if !review && result == nil {
                    ShareCredentialPicker(store: store, selection: $selected, query: $query) { review = true }
                } else {
                    sharingForm
                }
            }
            .navigationTitle(NativeText.literal("Share credentials")).navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button(NativeText.literal(result?.pending == false ? "Done" : "Cancel")) { passcode = ""; dismiss() }.disabled(review && store.isBusy) }
                if review && result == nil { ToolbarItem(placement: .topBarTrailing) { Button("Back") { review = false }.disabled(store.isBusy) } }
            }
            .onChange(of: selected.ids) { _, _ in requestID = UUID().uuidString }
            .onChange(of: title) { _, _ in requestID = UUID().uuidString }
            .onChange(of: protect) { _, _ in requestID = UUID().uuidString }
            .onChange(of: passcode) { _, _ in requestID = UUID().uuidString }
        }
        .environment(\.locale, NativeLanguage.selected.locale)
        .environment(\.layoutDirection, NativeLanguage.selected.isRightToLeft ? .rightToLeft : .leftToRight)
        #if DEBUG
        .modifier(NativeReviewPreferences())
        #endif
        .interactiveDismissDisabled(review && store.isBusy)
    }

    private var sharingForm: some View {
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
                Section(NativeText.count("sharePicker.selected", selected.ids.count)) {
                    ForEach(selectedCredentials) { credential in row(credential) }
                    if selectedCredentials.count != selected.ids.count {
                        Text(NativeText.text("sharePicker.selectionUnavailable")).foregroundStyle(Palette.errorInk)
                    }
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
            }
            if let error { Text(error).font(.subheadline).foregroundStyle(Palette.secondary) }
        }.scrollContentBackground(.hidden).background(Palette.paper).accessibilityIdentifier("share-review-form")
    }

    private func row(_ credential: Credential) -> some View {
        HStack(spacing: 14) {
            CredentialArtwork(credential: credential, size: 52)
            VStack(alignment: .leading, spacing: 4) {
                Text(credential.title).font(.headline).foregroundStyle(Palette.ink)
                Text(credential.issuer).font(.caption).foregroundStyle(Palette.secondary)
            }
            Spacer()
        }.padding(.vertical, 8)
    }
    @MainActor private func prepare() async {
        error = nil
        do { result = try await store.share(credentialIDs: selectedCredentials.map(\.id), title: title, requestID: requestID, passcode: protect ? passcode : nil) }
        catch { self.error = "Couldn't prepare the link. Your selection is still here; try again." }
    }
}
