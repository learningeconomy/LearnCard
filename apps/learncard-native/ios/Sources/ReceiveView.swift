import SwiftUI
import PhotosUI
import SafariServices
import LearnCardNativeSDK
import LearnCardNativeCore

struct ClaimPresentation: ViewModifier {
    @Environment(\.scenePhase) private var scenePhase
    let flow: NativeClaimStore
    var store: AppStore?
    var enabled = true
    var recipient: String? = nil
    func body(content: Content) -> some View {
        content.fullScreenCover(isPresented: Binding(get: { enabled && flow.isPresented }, set: { flow.isPresented = $0 })) {
            ReceiveView(flow: flow, store: store, recipient: recipient)
        }
        .onOpenURL { url in if enabled { Task { await flow.receive(url.absoluteString) } } }
        .onChange(of: scenePhase) { _, phase in
            if enabled && flow.isDemo {
                if phase == .background { flow.lock() }
                else if phase == .active, let store { flow.connect(service: store.demoClaimService, accountID: "demo") }
            }
        }
        .onChange(of: flow.phase) { _, phase in
            if enabled && phase == "complete", let store { Task { await store.refresh(); await store.inbox.afterClaim() } }
        }
    }
}

struct ReceiveView: View {
    @Environment(\.locale) private var nativeLocale
    let flow: NativeClaimStore
    var store: AppStore?
    var recipient: String?
    @State private var showWeb = false
    @State private var link = ""
    @State private var photo: PhotosPickerItem?
    @State private var photoError: String?
    @State private var showPhotoPicker = false
    @State private var photoTask: Task<Void, Never>?
    @State private var readingPhoto = false
    @FocusState private var typing: Bool
    private var busy: Bool { ["resolving", "claiming"].contains(flow.phase) }
    private var entryTitle: String { NativeText.text(flow.entryMode == .link ? "build.link" : flow.entryMode == .photo ? "build.photo" : "claims.title") }
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    PageHeading(title: flow.phase == "entry" ? entryTitle : NativeText.text(flow.phase == "complete" ? "claims.added" : flow.phase == "review" || flow.phase == "claiming" ? "claims.review" : "claims.title"))
                    switch flow.phase {
                    case "entry": if flow.isPresented { entry }
                    case "signIn":
                        Image("InboxIllustration").resizable().scaledToFit().frame(height: 160).frame(maxWidth: .infinity).accessibilityHidden(true)
                        Text(NativeText.text("claims.waitingSignIn")).font(.title3).foregroundStyle(Palette.ink)
                        PrimaryButton(title: NativeText.literal("Sign in")) { flow.isPresented = false }.accessibilityIdentifier("claim-sign-in")
                    case "resolving": ProgressView(NativeText.text("claims.resolving")).frame(maxWidth: .infinity).padding(48)
                    case "review", "claiming": review
                    case "complete": completion
                    default: failure
                    }
                }.padding(20)
            }.background(Palette.paper)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NativeText.literal(flow.phase == "complete" ? "Done" : "Cancel")) { flow.clear() }.disabled(flow.phase == "claiming") } }
                .interactiveDismissDisabled(busy)
        }
        #if DEBUG
        .modifier(NativeReviewPreferences())
        #endif
        .sheet(isPresented: $showWeb) {
            if let url = flow.link?.webURL { ClaimWebBrowser(url: url) }
        }.photosPicker(isPresented: $showPhotoPicker, selection: $photo, matching: .images)
            .task { if flow.phase == "entry" { if flow.entryMode == .photo { showPhotoPicker = true }; if flow.entryMode == .link { typing = true } } }
            .onDisappear { photoTask?.cancel(); link = "" }
            .onChange(of: photo) { _, value in
                photoTask?.cancel(); photoError = nil
                guard let value else { return }
                photoTask = Task {
                    readingPhoto = true; defer { readingPhoto = false; photo = nil }
                    do {
                        guard let data = try await value.loadTransferable(type: Data.self) else { throw QRImageError.none }
                        let decoded = try await Task.detached(priority: .userInitiated) { try QRImageDecoder.decode(data) }.value
                        guard !Task.isCancelled else { return }; typing = false; link = ""; await flow.receive(decoded)
                    } catch { if !Task.isCancelled { photoError = (error as? QRImageError)?.errorDescription ?? NativeText.text("claims.image.none") } }
                }
            }
    }
    private var entry: some View {
        let photoTitle = NativeText.text(readingPhoto ? "claims.readingPhoto" : "claims.choosePhoto")
        return VStack(alignment: .leading, spacing: 20) {
            Text(NativeText.text("claims.intro")).font(.title3).foregroundStyle(Palette.secondary)
            if flow.entryMode == .scan {
                QRScannerView { value in typing = false; Task { await flow.receive(value) } }
            } else {
                Image("ClaimScanIllustration").resizable().scaledToFit().frame(height: 110).frame(maxWidth: .infinity).accessibilityHidden(true)
            }
            Text(NativeText.text("claims.beforeAdding")).font(.subheadline).foregroundStyle(Palette.secondary)
            Button { showPhotoPicker = true } label: {
                Label(photoTitle, systemImage: "photo")
                    .font(.headline).frame(maxWidth: .infinity, minHeight: 54)
            }.disabled(readingPhoto).background(Palette.surface, in: RoundedRectangle(cornerRadius: 18)).accessibilityIdentifier("claim-photo")
            if let photoError { Text(photoError).font(.subheadline).foregroundStyle(Palette.errorInk) }
            VStack(alignment: .leading, spacing: 12) {
                Text(NativeText.text("claims.paste")).font(.headline)
                TextField(NativeText.text("claims.linkPlaceholder"), text: $link).keyboardType(.URL).textInputAutocapitalization(.never).autocorrectionDisabled()
                    .focused($typing).submitLabel(.done).onSubmit { typing = false }.privacySensitive().accessibilityIdentifier("claim-link")
                if flow.isDemo { Button("Use Sample Link") { link = "learncard-native-demo://claim/first-aid" }.accessibilityIdentifier("use-sample-link") }
                PrimaryButton(title: NativeText.text("claims.review"), disabled: link.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, fill: Palette.selection) {
                    let value = link; link = ""; typing = false; Task { await flow.receive(value) }
                }.accessibilityIdentifier("review-link")
            }.padding(18).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
        }.foregroundStyle(Palette.ink)
    }
    private var review: some View {
        VStack(alignment: .leading, spacing: 20) {
            if let credential = flow.credential {
                CredentialCard(credential: credential, featured: true, showsDisclosure: false, animatesPresence: false, showsStack: false)
                Label(recipient.map { "@\($0)" } ?? NativeText.text("claims.yourAccount"), systemImage: "person.crop.circle")
                    .font(.subheadline.weight(.medium)).padding(14).frame(maxWidth: .infinity, alignment: .leading)
                    .background(Palette.surface, in: RoundedRectangle(cornerRadius: 16))
                VStack(alignment: .leading, spacing: 14) {
                    HStack { Text(NativeText.text("claims.from")); Spacer(); Text(credential.issuer).multilineTextAlignment(.trailing) }
                    Divider()
                    HStack { Text(NativeText.literal("Category")); Spacer(); Text(credential.categoryTitle) }
                    Divider()
                    Text(NativeText.text("claims.about")).font(.headline)
                    Text(credential.summary).font(.body).foregroundStyle(Palette.secondary)
                }.padding(18).foregroundStyle(Palette.ink).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                Text(NativeText.text(flow.isDemo ? "claims.sample" : "claims.templateNote")).font(.footnote).foregroundStyle(Palette.secondary)
                PrimaryButton(title: NativeText.text(flow.phase == "claiming" ? "claims.adding" : "claims.confirm"), loading: flow.phase == "claiming", disabled: busy, fill: Palette.selection) {
                    Task { await flow.confirm() }
                }.accessibilityIdentifier("claim")
            }
        }
    }
    private var completion: some View {
        VStack(spacing: 20) {
            Image("ClaimSuccessIllustration").resizable().scaledToFit().frame(height: 180).accessibilityHidden(true)
            Text(NativeText.text("claims.successBody")).font(.title3).foregroundStyle(Palette.secondary).multilineTextAlignment(.center)
            if let store, let credential = flow.credential {
                NavigationLink { CredentialDetailView(store: store, credential: credential) } label: {
                    Text(NativeText.text("claims.view")).font(.headline).frame(maxWidth: .infinity, minHeight: 54).foregroundStyle(Palette.selectionInk).background(Palette.selection, in: RoundedRectangle(cornerRadius: 20))
                }.accessibilityIdentifier("claim-view")
            }
            Button(NativeText.text("claims.another")) { flow.clear(); flow.open() }.frame(minHeight: 44).accessibilityIdentifier("claim-another")
            Button(NativeText.literal("Done")) { flow.clear() }.frame(minHeight: 44).accessibilityIdentifier("claim-done")
        }.frame(maxWidth: .infinity)
    }
    private var failure: some View {
        VStack(alignment: .leading, spacing: 20) {
            Image("InboxIllustration").resizable().scaledToFit().frame(height: 140).frame(maxWidth: .infinity).accessibilityHidden(true)
            Text(flow.error?.errorDescription ?? NativeText.text("claims.error.unavailable")).font(.title3).foregroundStyle(Palette.ink).accessibilityIdentifier("claim-error")
            if flow.canRetry { PrimaryButton(title: flow.error == .uncertain ? NativeText.text("claims.checkResult") : NativeText.literal("Try Again")) { Task { await flow.resolve() } }.accessibilityIdentifier("claim-retry") }
            if flow.error == .family, flow.link?.webURL != nil {
                Button(NativeText.text("claims.openWeb")) { showWeb = true }.frame(minHeight: 44)
            }
            if flow.error == .uncertain || flow.error == .pending {
                Button(NativeText.text("claims.checkInbox")) { flow.clear(); store?.openInboxRequested = true }.frame(minHeight: 44).accessibilityIdentifier("claim-check-inbox")
            }
            Button(NativeText.text("claims.another")) { flow.clear(); flow.open() }.frame(minHeight: 44).accessibilityIdentifier("claim-another")
        }
    }
}

private struct ClaimWebBrowser: UIViewControllerRepresentable {
    let url: URL
    func makeUIViewController(context: Context) -> SFSafariViewController { SFSafariViewController(url: url) }
    func updateUIViewController(_ controller: SFSafariViewController, context: Context) {}
}
