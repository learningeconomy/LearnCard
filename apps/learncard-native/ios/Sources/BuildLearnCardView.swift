import SwiftUI
import QuickLook
import LearnCardNativeSDK

/// Optional intake: issuer credentials and personal copies have distinct routes.
struct BuildLearnCardView: View {
    @Environment(\.scenePhase) private var scenePhase
    let appStore: AppStore
    let receive: (ClaimEntryMode) -> Void
    var filesOnly = false
    @State private var fileMode: IntakeKind?
    @State private var previewURL: URL?
    @State private var previewFolder: URL?
    @State private var opening: String?
    @State private var openingTask: Task<Void, Never>?
    @State private var documentError: String?
    private var intake: IntakeStore { appStore.intake }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                PageHeading(title: NativeText.text("build.title"), identifier: "build")
                IllustratedIntro(image: "IntakeFolderIllustration", title: NativeText.text("intake.intro"))
                if !filesOnly {
                  Text(NativeText.text("intake.issuerHeading")).font(.title2.bold())
                  VStack(spacing: 0) {
                    action(.scan, title: "claims.title", body: "build.scanBody", symbol: .scan, tint: Palette.cyanCard)
                    Divider().padding(.leading, 74)
                    action(.link, title: "build.link", body: "build.linkBody", symbol: .sharing, tint: Palette.pinkCard)
                    Divider().padding(.leading, 74)
                    action(.photo, title: "build.photo", body: "build.photoBody", symbol: .credential, tint: Palette.portfolioCard)
                  }.buttonStyle(CredentialPressStyle()).background(Palette.surface, in: RoundedRectangle(cornerRadius: 26))
                }
                Text(NativeText.text("intake.filesHeading")).font(.title2.bold())
                VStack(spacing: 0) {
                    Button { fileMode = .certificate } label: { DrawnSettingsRow(title: NativeText.text("intake.documents"), symbol: .collection, tint: Palette.portfolioCard, subtitle: NativeText.text("intake.documentsBody")) }.accessibilityIdentifier("build-documents")
                    Divider().padding(.leading, 74)
                    Button { fileMode = .rawVC } label: { DrawnSettingsRow(title: NativeText.text("intake.credentials"), symbol: .credential, tint: Palette.blueCard, subtitle: NativeText.text("intake.credentialsBody")) }.accessibilityIdentifier("build-credential-file")
                }.buttonStyle(CredentialPressStyle()).background(Palette.surface, in: RoundedRectangle(cornerRadius: 26))
                Text(NativeText.text("claims.beforeAdding")).font(.subheadline).foregroundStyle(Palette.secondary)
                savedDocuments
            }.padding(20).frame(maxWidth: 620).frame(maxWidth: .infinity)
        }.foregroundStyle(Palette.ink).background(Palette.paper).navigationTitle("").navigationBarTitleDisplayMode(.inline)
            .task { await intake.load() }.refreshable { await intake.load() }
            .sheet(item: $fileMode, onDismiss: { intake.clearReview(); Task { await intake.load() } }) { mode in
                IntakeFileView(appStore: appStore, initialKind: mode)
            }
            .quickLookPreview($previewURL)
            .onChange(of: previewURL) { _, new in if new == nil { cleanPreview() } }
            .onChange(of: scenePhase) { _, phase in
                if phase == .background { openingTask?.cancel(); opening = nil; cleanPreview(); intake.lock() }
                else if phase == .active { Task { await intake.load() } }
            }
            .onDisappear { openingTask?.cancel(); cleanPreview() }
    }
    private func action(_ mode: ClaimEntryMode, title: String, body: String, symbol: DrawnSymbol, tint: Color) -> some View {
        Button { receive(mode) } label: { DrawnSettingsRow(title: NativeText.text(title), symbol: symbol, tint: tint, subtitle: NativeText.text(body)) }.accessibilityIdentifier("build-\(mode.rawValue)")
    }
    @ViewBuilder private var savedDocuments: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(NativeText.text("intake.savedHeading")).font(.title2.bold())
            if let documentError { Text(documentError).foregroundStyle(Palette.errorInk) }
            if intake.loading && intake.status == nil { ProgressView(NativeText.text("intake.loading")) }
            else if let status = intake.status {
                if status.documents.isEmpty { Text(NativeText.text("intake.noDocuments")).font(.body).foregroundStyle(Palette.secondary) }
                else {
                    VStack(spacing: 0) {
                        ForEach(status.documents) { document in
                            Button { open(document) } label: {
                                HStack(spacing: 12) {
                                    DrawnTile(symbol: .credential, tint: Palette.portfolioCard, size: 44)
                                    VStack(alignment: .leading, spacing: 5) {
                                        Text(document.name.isEmpty ? document.kind.title : document.name).font(.headline).multilineTextAlignment(.leading)
                                        Text(document.kind.title).font(.subheadline).foregroundStyle(Palette.secondary)
                                    }.frame(maxWidth: .infinity, alignment: .leading)
                                    if opening == document.id { ProgressView() } else { Image(systemName: "arrow.up.right").accessibilityHidden(true) }
                                }.padding(14).contentShape(Rectangle())
                            }.disabled(opening != nil).accessibilityIdentifier("intake-document-\(document.id)")
                        }
                    }.buttonStyle(CredentialPressStyle()).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                }
                Text(NativeText.count("intake.importedCount", status.counts["rawVC"] ?? 0)).font(.subheadline).foregroundStyle(Palette.secondary)
                if status.limited { Text(NativeText.text("intake.limited")).font(.footnote).foregroundStyle(Palette.secondary) }
            }
            if let error = intake.error { VStack(alignment: .leading, spacing: 10) {
                Text(error.localizedDescription).foregroundStyle(Palette.errorInk)
                Button(NativeText.text("intake.retry")) { Task { await intake.load() } }.frame(minHeight: 44)
            } }
        }
    }
    private func open(_ document: IntakeDocument) {
        opening = document.id; documentError = nil
        openingTask = Task { @MainActor in
            defer { if !Task.isCancelled { opening = nil } }
            do {
                let value = try await intake.document(id: document.id)
                guard !Task.isCancelled else { return }
                guard let bytes = Data(base64Encoded: value.base64), bytes.count <= 4_194_304 else { throw IntakeError.size }
                cleanPreview()
                let folder = FileManager.default.temporaryDirectory.appendingPathComponent("lc-intake-\(UUID().uuidString)", isDirectory: true)
                try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true, attributes: [.posixPermissions: 0o700])
                previewFolder = folder
                let name = URL(fileURLWithPath: value.name).lastPathComponent
                guard !name.isEmpty, name != ".", name != ".." else { throw IntakeError.file }
                let url = folder.appendingPathComponent(name)
                try bytes.write(to: url, options: [.atomic, .completeFileProtection]); previewURL = url
            } catch { if !Task.isCancelled { documentError = (error as? IntakeError ?? .connection).localizedDescription; cleanPreview() } }
        }
    }
    private func cleanPreview() { previewURL = nil; if let previewFolder { try? FileManager.default.removeItem(at: previewFolder) }; previewFolder = nil }
}
