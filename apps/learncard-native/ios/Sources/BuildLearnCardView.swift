import SwiftUI
import QuickLook
import LearnCardNativeSDK
import LearnCardNativeCore

/// Optional intake: issuer credentials and personal copies have distinct routes.
struct BuildLearnCardView: View {
    @Environment(\.scenePhase) private var scenePhase
    let appStore: AppStore
    let receive: (ClaimEntryMode) -> Void
    var filesOnly = false
    @State private var sampleReview: ConsumerConsentReview?
    @State private var reviewingSample = false
    @State private var sampleReviewError: ConsumerAppError?
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
                if !filesOnly { sampleCredentials }
                documentMilestones
                Text(NativeText.text("intake.credentials")).font(.title2.bold())
                VStack(spacing: 0) {
                    Button { fileMode = .rawVC } label: { DrawnSettingsRow(title: NativeText.text("intake.credentials"), symbol: .credential, tint: Palette.blueCard, subtitle: NativeText.text("intake.credentialsBody")) }.accessibilityIdentifier("build-credential-file")
                }.buttonStyle(CredentialPressStyle()).background(Palette.surface, in: RoundedRectangle(cornerRadius: 26))
                Text(NativeText.text("claims.beforeAdding")).font(.subheadline).foregroundStyle(Palette.secondary)
                savedDocuments
            }.padding(20).frame(maxWidth: 620).frame(maxWidth: .infinity)
        }.foregroundStyle(Palette.ink).background(Palette.paper).navigationTitle("").navigationBarTitleDisplayMode(.inline)
            .task { await intake.load(); if !filesOnly { await intake.loadSamples() } }.refreshable { await intake.load(); if !filesOnly { await intake.loadSamples() } }
            .sheet(item: $fileMode, onDismiss: { intake.clearReview(); Task { await intake.load() } }) { mode in
                IntakeFileView(appStore: appStore, initialKind: mode)
            }
            .sheet(item: $sampleReview) { review in
                NativeConsentView(appTitle: review.title, iconURL: nil, review: review, consumer: appStore.consumer, activityChanged: { active in
                    if active { intake.beginSamplePreparation(id: review.listingID) }
                    else { intake.endSamplePreparation(id: review.listingID, error: appStore.consumer.error) }
                }) {
                    Task { await appStore.syncSample(id: review.listingID) }
                }
            }
            .quickLookPreview($previewURL)
            .onChange(of: previewURL) { _, new in if new == nil { cleanPreview() } }
            .onChange(of: scenePhase) { _, phase in
                if phase == .background { openingTask?.cancel(); opening = nil; cleanPreview(); intake.lock() }
                else if phase == .active { Task { await intake.load(); if !filesOnly { await intake.loadSamples() } } }
            }
            .onDisappear { openingTask?.cancel(); cleanPreview() }
    }
    private var documentMilestones: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(NativeText.text("build.stepsTitle")).font(.title2.bold()).headingFlair(Palette.flairYellow)
            Text(NativeText.text("build.stepsBody")).font(.subheadline).foregroundStyle(Palette.secondary)
            if intake.status != nil {
                Text(NativeText.format("build.stepsProgress", "\(intake.completedDocumentKinds)"))
                    .font(.subheadline.weight(.semibold)).accessibilityIdentifier("build-progress")
                HStack(spacing: 6) {
                    ForEach(0..<4) { index in
                        Capsule().fill(index < intake.completedDocumentKinds ? Palette.selection : Palette.line).frame(height: 6)
                    }
                }.accessibilityHidden(true)
            } else if intake.loading { ProgressView(NativeText.text("intake.loading")) }
            VStack(spacing: 10) {
                ForEach(Array(IntakeKind.allCases.filter { $0 != .rawVC }.enumerated()), id: \.element) { index, kind in
                    let count = intake.status?.counts[kind.rawValue] ?? 0
                    Button { fileMode = kind } label: {
                        HStack(spacing: 14) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 14).fill(count > 0 ? Palette.tealCard : Palette.portfolioCard).frame(width: 46, height: 46)
                                if count > 0 { Image(systemName: "checkmark").font(.headline) }
                                else { Text("\(index + 1)").font(.title3.bold()) }
                            }.foregroundStyle(Palette.cardInk).accessibilityHidden(true)
                            VStack(alignment: .leading, spacing: 5) {
                                Text(kind.title).font(.headline)
                                Text(count > 0 ? NativeText.count("intake.addedCount", count) : NativeText.text("build.addDocument"))
                                    .font(.subheadline).foregroundStyle(Palette.secondary)
                            }.frame(maxWidth: .infinity, alignment: .leading)
                            Image(systemName: "chevron.right").accessibilityHidden(true)
                        }.foregroundStyle(Palette.ink).padding(16).contentShape(RoundedRectangle(cornerRadius: 22))
                            .background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
                    }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier(kind == .certificate ? "build-documents" : "build-document-\(kind.rawValue)")
                }
            }
        }.accessibilityElement(children: .contain)
    }

    private var sampleCredentials: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(NativeText.text("build.samplesTitle")).font(.title2.bold()).headingFlair(Palette.flairBlue)
            Text(NativeText.text("build.samplesBody")).font(.subheadline).foregroundStyle(Palette.secondary)
            if (intake.samplesLoading && !intake.sampleBusy) || reviewingSample {
                ProgressView(NativeText.text(intake.sampleBusy ? "build.samplesSyncing" : "build.samplesLoading"))
            }
            ForEach(intake.samples) { bundle in
                Button {
                    if bundle.connected {
                        Task { await appStore.syncSample(id: bundle.id) }
                    } else {
                        Task {
                            reviewingSample = true; sampleReviewError = nil; appStore.consumer.error = nil; defer { reviewingSample = false }
                            do { sampleReview = try await appStore.consumer.review(id: bundle.id) }
                            catch { sampleReviewError = error as? ConsumerAppError ?? .connection }
                        }
                    }
                } label: {
                    DrawnSettingsRow(title: NativeText.text(bundle.connected ? "build.samplesSync" : "build.samplesReview"),
                                     symbol: .credential, tint: Palette.pinkCard,
                                     subtitle: bundle.title)
                }.buttonStyle(CredentialPressStyle()).disabled(appStore.sampleSyncBusy || reviewingSample || bundle.expected == 0)
                    .accessibilityIdentifier("build-sample-\(bundle.id)")
            }
            if let result = intake.sampleResult, !appStore.sampleSyncBusy {
                Text(result.failed > 0 ? NativeText.text("build.samplesPartial") : NativeText.format("build.samplesSaved", "\(result.added + result.existing)"))
                    .font(.subheadline.weight(.medium)).accessibilityIdentifier("build-sample-result")
            }
            if let error = intake.sampleSyncError ?? intake.sampleError ?? sampleReviewError {
                Text(error.localizedDescription).font(.subheadline).foregroundStyle(Palette.errorInk)
                Button(NativeText.literal("Try Again")) { Task { sampleReviewError = nil; await intake.loadSamples() } }
                    .frame(minHeight: 44).accessibilityIdentifier("build-samples-retry")
            }
        }.padding(18).background(Palette.surface, in: RoundedRectangle(cornerRadius: 26))
            .accessibilityElement(children: .contain)
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
