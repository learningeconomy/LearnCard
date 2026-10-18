import SwiftUI
import CoreImage.CIFilterBuiltins
import LearnCardNativeCore
import LearnCardNativeSDK

/// A single-record entry to the existing encrypted presentation-link publication flow.
struct CredentialShareView: View {
    let store: AppStore
    let credential: Credential
    let requestID: String
    @Binding var result: CredentialShare?
    @Environment(\.dismiss) private var dismiss
    @State private var working = false
    @State private var error = false
    @State private var copied = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    HStack(spacing: 14) {
                        CredentialArtwork(credential: credential, size: 64)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(credential.title).font(.headline).foregroundStyle(Palette.ink)
                            Text(NativeText.format("credential.issuedBy", credential.issuer)).font(.subheadline).foregroundStyle(Palette.secondary)
                        }
                    }.padding(18).frame(maxWidth: .infinity, alignment: .leading)
                        .background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                    if let url = result?.url, result?.pending == false {
                        ready(url)
                    } else if let sample = result?.sampleText, result?.pending == false {
                        Text(NativeText.text("credential.details.sampleShareNotice")).font(.subheadline).foregroundStyle(Palette.secondary)
                        ShareLink(item: sample) { actionLabel("credential.details.shareSample", symbol: "square.and.arrow.up") }
                            .accessibilityIdentifier("credential-share-system")
                    } else {
                        VStack(alignment: .leading, spacing: 12) {
                            Text(NativeText.text("credential.details.shareIntro")).font(.title2.weight(.bold)).foregroundStyle(Palette.ink)
                            Text(NativeText.text(store.isLive ? "credential.details.shareDisclosure" : "credential.details.sampleShareNotice"))
                                .font(.subheadline).foregroundStyle(Palette.secondary).fixedSize(horizontal: false, vertical: true)
                            if result?.pending == true {
                                Label(NativeText.text("credential.details.sharePending"), systemImage: "clock")
                                    .font(.subheadline).foregroundStyle(Palette.secondary).accessibilityIdentifier("credential-share-pending")
                            }
                        }
                        PrimaryButton(title: NativeText.text(working ? "credential.details.preparing" : result?.pending == true ? "credential.details.checkLink" : store.isLive ? "credential.details.createLink" : "credential.details.prepareSample"), loading: working, disabled: store.isBusy && !working, fill: Palette.selection) {
                            Task { await prepare() }
                        }.accessibilityIdentifier("credential-share-create")
                    }
                    if error {
                        Label(NativeText.text("credential.details.shareError"), systemImage: "exclamationmark.circle")
                            .font(.subheadline).foregroundStyle(Palette.errorInk).accessibilityIdentifier("credential-share-error")
                    }
                }.padding(20)
            }.background(Palette.paper).accessibilityIdentifier("credential-share-sheet")
                .navigationTitle(NativeText.text("credential.details.shareTitle")).navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button(NativeText.text(result?.pending == false ? "common.done" : "common.cancel")) { dismiss() }
                            .disabled(working).accessibilityIdentifier("credential-share-close")
                    }
                }
        }.interactiveDismissDisabled(working)
            .environment(\.locale, NativeLanguage.selected.locale)
            .environment(\.layoutDirection, NativeLanguage.selected.isRightToLeft ? .rightToLeft : .leftToRight)
            #if DEBUG
            .modifier(NativeReviewPreferences())
            #endif
    }

    private func ready(_ url: URL) -> some View {
        VStack(spacing: 18) {
            Label(NativeText.text("credential.details.linkReady"), systemImage: "checkmark.circle.fill")
                .font(.title3.weight(.semibold)).foregroundStyle(Palette.green).accessibilityIdentifier("credential-share-ready")
            if let image = credentialQRCode(url) {
                Image(uiImage: image).interpolation(.none).resizable().scaledToFit()
                    .padding(20).frame(maxWidth: 280).background(.white, in: RoundedRectangle(cornerRadius: 20))
                    .accessibilityLabel(NativeText.text("credential.details.qrLabel")).accessibilityIdentifier("credential-share-qr")
            }
            Text(NativeText.text("credential.details.qrHint")).font(.subheadline).foregroundStyle(Palette.secondary)
                .multilineTextAlignment(.center)
            Text(NativeText.text("credential.details.linkScope")).font(.footnote).foregroundStyle(Palette.secondary)
                .multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
            ShareLink(item: url) { actionLabel("credential.details.shareLink", symbol: "square.and.arrow.up") }
                .accessibilityIdentifier("credential-share-system")
            Button {
                UIPasteboard.general.url = url; copied = true
            } label: {
                Label(NativeText.text(copied ? "credential.details.copied" : "credential.details.copyLink"), systemImage: copied ? "checkmark" : "doc.on.doc")
                    .font(.body.weight(.semibold)).frame(maxWidth: .infinity, minHeight: 50).foregroundStyle(Palette.ink)
            }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("credential-share-copy")
        }.frame(maxWidth: .infinity)
    }
    private func actionLabel(_ key: String, symbol: String) -> some View {
        Label(NativeText.text(key), systemImage: symbol).font(.body.weight(.semibold))
            .frame(maxWidth: .infinity, minHeight: 54).foregroundStyle(Palette.selectionInk)
            .background(Palette.selection, in: RoundedRectangle(cornerRadius: 20))
    }
    @MainActor private func prepare() async {
        guard !working else { return }
        working = true; error = false
        defer { working = false }
        do {
            let response = try await store.share(credentialIDs: [credential.id], title: String(credential.title.prefix(120)), requestID: requestID, passcode: nil)
            guard response.pending || response.url != nil || response.sampleText != nil else { throw AccountError.unavailable }
            result = response
        } catch { self.error = true }
    }
}

/// The QR and copy/share actions carry precisely the same presentation URL, including its fragment key.
private func credentialQRCode(_ url: URL) -> UIImage? {
    let filter = CIFilter.qrCodeGenerator()
    filter.message = Data(url.absoluteString.utf8); filter.correctionLevel = "M"
    guard let output = filter.outputImage,
          let image = CIContext().createCGImage(output, from: output.extent) else { return nil }
    return UIImage(cgImage: image)
}
