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
    @State private var showShare = false
    @State private var shareRequestID = UUID().uuidString
    @State private var shareResult: CredentialShare?
    @State private var showExport = false
    @State private var cardHeight: CGFloat = 240
    @State private var cardVisible = true

    var body: some View {
        Group {
            if isOffer { NavigationStack { content } }
            else { content }
        }
        .sheet(isPresented: $showSend) { SendView(store: store, credential: credential) }
        .sheet(isPresented: $showShare) { CredentialShareView(store: store, credential: credential, requestID: shareRequestID, result: $shareResult) }
    }

    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                CredentialDetailCard(credential: credential, isVisible: cardVisible)
                    .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { cardHeight = $0 }
                CredentialVerificationView(credential: credential)
                if !credential.summary.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        Text(NativeText.text("credential.details.about")).font(.headline).foregroundStyle(Palette.ink)
                        CredentialExpandableText(text: credential.summary, identifier: "credential-about")
                    }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
                        .background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                }
                VStack(alignment: .leading, spacing: 14) {
                    Text(NativeText.text("credential.details.information")).font(.headline).foregroundStyle(Palette.ink)
                    metadata(NativeText.text("credential.issuerLabel"), value: credential.issuer, identifier: "from")
                    metadata(NativeText.literal("Category"), value: credential.categoryTitle)
                    metadata(NativeText.text("sharePicker.dateHeading"), value: credential.issueDate.map {
                        $0.formatted(.dateTime.month(.abbreviated).day().year().locale(nativeLocale))
                    } ?? NativeText.text("credential.dateUnavailable"), identifier: "date")
                    metadata(NativeText.literal("Status"), value: isOffer ? NativeText.text("credential.details.pendingOffer") : isCreation ? NativeText.literal("Reusable creation") : credential.isSample ? NativeText.literal("Sample · unsigned") : NativeText.text(credential.createdByMe ? "credential.issuedInPassport" : "credential.inPassport"))
                    if let details = credential.details {
                        ForEach(Array(details.fields.enumerated()), id: \.offset) { _, field in
                            metadata(NativeText.text("credential.details.\(field.kind)"), value: field.value)
                        }
                        if let start = details.activityStartDate { metadata(NativeText.text("credential.details.activityStart"), value: formatted(start)) }
                        if let end = details.activityEndDate { metadata(NativeText.text("credential.details.activityEnd"), value: formatted(end)) }
                        if let expiry = details.validUntil { metadata(NativeText.text("credential.details.expires"), value: formatted(expiry)) }
                    }
                }.padding(20).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                if let details = credential.details { CredentialOptionalDetails(details: details) }
                if credential.sampleBundleID != nil {
                    Text(NativeText.text("build.sampleNotice")).font(.subheadline).foregroundStyle(Palette.secondary)
                }
                if !isCreation && !isOffer, let payload = credential.signedPayload {
                    VStack(alignment: .leading, spacing: 10) {
                        Button { showExport.toggle() } label: {
                            HStack {
                                Text(NativeText.text("credential.details.moreOptions"))
                                Spacer()
                                Image(systemName: showExport ? "chevron.up" : "chevron.down").accessibilityHidden(true)
                            }.frame(minHeight: 44).contentShape(Rectangle())
                        }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("credential-more-options")
                            .accessibilityHint(NativeText.text(showExport ? "credential.details.showLess" : "credential.details.showMore"))
                        if showExport {
                            Text(NativeText.text("credential.details.exportNotice")).font(.footnote)
                            ShareLink(item: payload) {
                                Label(NativeText.text("credential.details.export"), systemImage: "square.and.arrow.up")
                                    .font(.subheadline.weight(.semibold)).frame(minHeight: 44)
                            }.accessibilityIdentifier("credential-export")
                        }
                    }.font(.subheadline).foregroundStyle(Palette.secondary).tint(Palette.secondary)
                }
            }.padding(20)
        }.accessibilityIdentifier("credential-detail-scroll")
        .safeAreaInset(edge: .bottom, spacing: 0) {
            if isOffer || isCreation || credential.isSample || credential.signedPayload != nil {
                primaryAction.padding(.horizontal, 20).padding(.vertical, 12).background(Palette.surface)
            }
        }
        .background(SectionBackground(tint: Palette.paper))
        .onScrollGeometryChange(for: Bool.self) { geometry in
            let offset = geometry.contentOffset.y + geometry.contentInsets.top
            return offset < cardHeight + 24 && offset + geometry.containerSize.height > 24
        } action: { _, value in cardVisible = value }
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

    @ViewBuilder private var primaryAction: some View {
        if isOffer {
            PrimaryButton(title: NativeText.literal(store.isBusy ? "Adding…" : "Add to Passport"), loading: store.isBusy) {
                Task { if await store.claim(credential) { dismiss() } }
            }.accessibilityIdentifier("claim")
        } else if isCreation || credential.isSample && credential.createdByMe {
            PrimaryButton(title: NativeText.literal(credential.isSample ? "Send Sample" : "Send Credential")) { showSend = true }.accessibilityIdentifier("send")
        } else if credential.isSample || credential.signedPayload != nil {
            PrimaryButton(title: NativeText.text("credential.details.share"), fill: Palette.selection) { showShare = true }.accessibilityIdentifier("share")
        }
    }

    private func formatted(_ date: Date) -> String { date.formatted(.dateTime.month(.abbreviated).day().year().locale(nativeLocale)) }

    private func metadata(_ title: String, value: String, identifier: String? = nil) -> some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title).foregroundStyle(Palette.secondary)
            Spacer(minLength: 16)
            Text(value).foregroundStyle(Palette.ink).multilineTextAlignment(.trailing)
                .accessibilityIdentifier("credential-metadata-\(identifier ?? title.lowercased())")
        }.font(.subheadline)
    }
}
