import SwiftUI
import LearnCardNativeSDK
import LearnCardNativeCore

struct ReceiveView: View {
    @Environment(\.locale) private var nativeLocale
    @Environment(\.dismiss) private var dismiss
    let store: AppStore
    @Binding var selectedOffer: Credential?
    @State private var link = ""
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                if store.isLive {
                    Section("Receive a credential") {
                        Text("Credentials sent to your staging profile appear in Inbox.")
                        Button("Check for Credentials") { Task { await store.refresh(); dismiss() } }.disabled(store.isBusy)
                    }
                } else {
                Section {
                    Label("A new part of your story", systemImage: "arrow.down.to.line")
                        .font(.headline).foregroundStyle(Palette.ink)
                    Text("Open a sample link to review a credential.").foregroundStyle(Palette.secondary)
                }
                Section("Sample claim link") {
                    TextField("Paste a sample link", text: $link)
                        .keyboardType(.URL).textInputAutocapitalization(.never).autocorrectionDisabled()
                        .accessibilityIdentifier("claim-link")
                    Button("Use Sample Link") { link = "learncard-native-demo://claim/first-aid" }
                        .accessibilityIdentifier("use-sample-link")
                }
                if let error {
                    Section { Label(error, systemImage: "exclamationmark.circle").foregroundStyle(.red) }
                }
                Section {
                    PrimaryButton(title: "Review Credential", disabled: link.isEmpty) { review() }
                        .accessibilityIdentifier("review-link")
                } footer: { Text("Camera scanning and real LearnCard links will be added after account integration.") }
                }
            }
            .foregroundStyle(Palette.ink)
            .navigationTitle("Receive")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NativeText.literal("Cancel")) { dismiss() } } }
        }
    }

    private func review() {
        do {
            guard let url = URL(string: link.trimmingCharacters(in: .whitespacesAndNewlines)) else {
                throw ClientError.unsupportedLink
            }
            let parsed = try DemoClaimLink(url: url)
            guard let credential = store.snapshot?.offers.first(where: { $0.id == parsed.offerID }) else {
                throw ClientError.offerUnavailable
            }
            selectedOffer = credential
            dismiss()
        } catch let clientError as ClientError { error = clientError.errorDescription }
        catch { self.error = "This link couldn't be opened. Please try again." }
    }
}
