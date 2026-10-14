import SwiftUI
import LearnCardNativeSDK
import LearnCardNativeCore

struct CredentialDetailView: View {
    @Environment(\.locale) private var nativeLocale
    @Environment(\.dismiss) private var dismiss
    let store: AppStore
    let credential: Credential
    var isOffer = false
    var isCreation = false
    @State private var showSend = false

    var body: some View {
        Group {
            if isOffer { NavigationStack { content } }
            else { content }
        }
        .sheet(isPresented: $showSend) { SendView(store: store, credential: credential) }
    }

    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 28) {
                CredentialDetailCard(credential: credential)
                VStack(alignment: .leading, spacing: 10) {
                    Text("About this credential").font(.headline).foregroundStyle(Palette.ink)
                    Text(credential.summary).foregroundStyle(Palette.secondary).lineSpacing(4)
                }
                VStack(spacing: 16) {
                    metadata("From", value: credential.issuer)
                    metadata("Category", value: credential.kind.rawValue)
                    metadata("Date", value: credential.date.formatted(date: .abbreviated, time: .omitted))
                    metadata("Status", value: isCreation ? "Reusable creation" : credential.isSample ? "Sample · unsigned" : credential.createdByMe ? "Issued by you · In your collection" : "In your collection")
                }
                Text(credential.isSample ? "Sample content for exploring the native app." : credential.verificationSummary ?? "Verification unavailable.")
                    .font(.caption).foregroundStyle(Palette.secondary)
                if isOffer {
                    PrimaryButton(title: store.isBusy ? "Adding…" : "Add to Collection", loading: store.isBusy) {
                        Task { if await store.claim(credential) { dismiss() } }
                    }.accessibilityIdentifier("claim")
                } else {
                    if isCreation || credential.isSample && credential.createdByMe {
                        PrimaryButton(title: credential.isSample ? "Send Sample" : "Send Credential") { showSend = true }.accessibilityIdentifier("send")
                    }
                    if !isCreation && (credential.isSample || credential.signedPayload != nil) {
                    ShareLink(item: credential.isSample ? credential.sampleShareText : credential.signedPayload ?? "") {
                        Label(credential.isSample ? "Share Sample" : "Export Credential", systemImage: "square.and.arrow.up")
                            .font(.body.weight(.semibold)).frame(maxWidth: .infinity, minHeight: 54)
                            .foregroundStyle(Palette.ink)
                            .background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
                            .overlay(RoundedRectangle(cornerRadius: 20).stroke(Palette.line))
                    }
                    .accessibilityIdentifier("share")
                    Text(credential.isSample ? "Shares sample text through the iOS share sheet." : "Exports the complete signed credential as JSON. It may contain personal information.").font(.caption).foregroundStyle(Palette.secondary)
                    }
                }
            }.padding(24)
        }
        .background(SectionBackground(tint: Palette.paper))
        #if DEBUG
        .modifier(NativeReviewPreferences())
        #endif
        .navigationTitle(isOffer ? "Review credential" : "Credential")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if isOffer {
                ToolbarItem(placement: .cancellationAction) { Button(NativeText.literal("Cancel")) { dismiss() } }
            }
        }
    }

    private func metadata(_ title: String, value: String) -> some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title).foregroundStyle(Palette.secondary)
            Spacer(minLength: 16)
            Text(value).foregroundStyle(Palette.ink).multilineTextAlignment(.trailing)
        }.font(.subheadline)
    }
}
