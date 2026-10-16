import SwiftUI
import UniformTypeIdentifiers
import LearnCardNativeSDK

struct IntakeFileView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.dynamicTypeSize) private var textSize
    let appStore: AppStore
    let initialKind: IntakeKind
    @State private var kind = IntakeKind.certificate
    @State private var choosingFile = false
    @State private var readingFile = false
    @State private var visible = false
    @State private var readTask: Task<Void, Never>?
    private var intake: IntakeStore { appStore.intake }
    private var complete: Bool { intake.result != nil && intake.result?.failed == 0 }
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text(NativeText.text(complete ? "intake.doneTitle" : kind == .rawVC ? "intake.reviewCredentials" : "intake.keepDocument"))
                        .font(.largeTitle.bold()).tracking(-0.5).accessibilityIdentifier("intake-file-title")
                    Image(complete ? "LearnerWelcomeIllustration" : "IntakeFolderIllustration").resizable().scaledToFit()
                        .frame(height: textSize.isAccessibilitySize ? 85 : 130).frame(maxWidth: .infinity).accessibilityHidden(true)
                    if complete, let result = intake.result {
                        Text(NativeText.count("intake.addedCount", result.added)).font(.title2.bold()).accessibilityIdentifier("intake-complete")
                        if result.existing > 0 { Text(NativeText.count("intake.existingCount", result.existing)).font(.body) }
                        Text(NativeText.text(kind == .rawVC ? "intake.credentialsSaved" : "intake.documentSaved")).foregroundStyle(Palette.secondary)
                    } else {
                        if let review = intake.review { fileSummary(review) }
                        else if kind != .rawVC { documentKinds }
                        Text(NativeText.text(kind == .rawVC ? "intake.originalProof" : "intake.privateCopy")).font(.body).foregroundStyle(Palette.secondary)
                        if kind == .rawVC, let review = intake.review {
                            Text(NativeText.count("intake.foundCount", review.candidates.count)).font(.title2.bold())
                            ForEach(review.candidates) { candidate in candidateRow(candidate) }
                            if review.rejected > 0 { Text(NativeText.count("intake.rejectedCount", review.rejected)).foregroundStyle(Palette.secondary) }
                            Text(NativeText.text("intake.signatureNotice")).font(.footnote).foregroundStyle(Palette.secondary)
                        }
                        if intake.review == nil { Text(NativeText.text(kind == .rawVC ? "intake.credentialLimit" : "intake.documentLimit")).font(.subheadline).foregroundStyle(Palette.secondary) }
                        #if DEBUG
                        if !appStore.isLive, intake.review == nil, ProcessInfo.processInfo.arguments.contains("--intake-file-fixture") {
                            Button("Read synthetic file") {
                                let source = kind == .rawVC ? "[{\"name\":\"Imported project\",\"issuer\":{\"name\":\"Sample Learning Centre\"},\"credentialSubject\":{}},{\"name\":\"Imported course\",\"issuer\":{\"name\":\"Sample School\"},\"credentialSubject\":{}}]" : "Synthetic personal document for native regression checks."
                                let file = try! IntakeFile(name: kind == .rawVC ? "sample-credentials.json" : "sample-certificate.txt", data: Data(source.utf8), kind: kind)
                                Task { await intake.prepare(file, kind: kind) }
                            }.accessibilityIdentifier("intake-synthetic-file")
                        }
                        #endif
                        if let result = intake.result, result.failed > 0 {
                            Text(String(format: NativeText.text("intake.partialCount"), locale: NativeLanguage.selected.locale, arguments: [Int64(result.added), Int64(result.failed)])).font(.body).accessibilityIdentifier("intake-partial")
                        }
                        if let error = intake.error { Text(error.localizedDescription).foregroundStyle(Palette.errorInk).accessibilityIdentifier("intake-file-error") }
                        if intake.busy || readingFile { ProgressView(NativeText.text(intake.review == nil ? "intake.preparing" : "intake.saving")).accessibilityIdentifier("intake-file-progress") }
                        if intake.review != nil && !intake.busy { Button(NativeText.text("intake.chooseDifferent")) { intake.clearReview(); choosingFile = true }.frame(minHeight: 44).accessibilityIdentifier("intake-file-replace") }
                    }
                }.padding(24).frame(maxWidth: 620).frame(maxWidth: .infinity)
            }.background(Palette.paper).foregroundStyle(Palette.ink)
                .safeAreaInset(edge: .bottom, spacing: 0) {
                    PrimaryButton(title: NativeText.text(complete ? "common.done" : intake.review == nil ? "intake.chooseFile" : intake.review?.replacesResume == true ? "intake.replaceResume" : kind == .rawVC ? "intake.addSelected" : "intake.saveCopy"), disabled: intake.busy || readingFile || (intake.review != nil && !intake.canSave), fill: Palette.selection) {
                        if complete { dismiss() }
                        else if intake.review == nil { choosingFile = true }
                        else { Task { await intake.save(); if intake.result != nil { await appStore.refresh() } } }
                    }.accessibilityIdentifier("intake-file-action").padding(20).frame(maxWidth: 620).frame(maxWidth: .infinity).background(Palette.surface)
                }
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NativeText.text("common.cancel")) { dismiss() } } }
        }.environment(\.locale, NativeLanguage.selected.locale)
            .environment(\.layoutDirection, NativeLanguage.selected.isRightToLeft ? .rightToLeft : .leftToRight)
            .presentationDragIndicator(.visible)
            .onAppear { visible = true; kind = initialKind; intake.clearReview() }
            .onDisappear { visible = false; readTask?.cancel(); intake.clearReview() }
            .onChange(of: scenePhase) { _, phase in if phase == .background { readTask?.cancel(); choosingFile = false; readingFile = false; intake.lock() } }
            .fileImporter(isPresented: $choosingFile, allowedContentTypes: kind == .rawVC ? [.json] : [.pdf, .plainText, .png, .jpeg, UTType(filenameExtension: "docx")!, UTType(filenameExtension: "webp")!]) { result in
                guard visible, scenePhase != .background else { return }
                switch result {
                case .success(let url): read(url)
                case .failure(let error): if (error as NSError).code != NSUserCancelledError { intake.report(IntakeError.file) }
                }
            }
    }
    private var documentKinds: some View {
        LazyVGrid(columns: textSize.isAccessibilitySize ? [GridItem(.flexible())] : [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            ForEach(IntakeKind.allCases.filter { $0 != .rawVC }) { item in
                Button { kind = item } label: {
                    HStack { Text(item.title).font(.headline); Spacer(minLength: 4); Image(systemName: item == kind ? "checkmark.circle.fill" : "circle").accessibilityHidden(true) }
                        .padding(16).frame(maxWidth: .infinity, minHeight: 62).background(Palette.surface, in: RoundedRectangle(cornerRadius: 18))
                        .overlay(RoundedRectangle(cornerRadius: 18).strokeBorder(item == kind ? Palette.ink : Palette.secondary.opacity(0.22), lineWidth: item == kind ? 2 : 1))
                }.buttonStyle(.plain).accessibilityAddTraits(item == kind ? [.isSelected] : []).accessibilityIdentifier("intake-kind-\(item.rawValue)")
            }
        }.disabled(readingFile || intake.busy)
    }
    private func fileSummary(_ review: IntakeReview) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(review.name).font(.headline).accessibilityIdentifier("intake-file-name")
            Text(ByteCountFormatter.string(fromByteCount: Int64(review.size), countStyle: .file)).font(.subheadline).foregroundStyle(Palette.secondary)
            if review.kind != .rawVC { Text(review.kind.title).font(.body.weight(.medium)) }
            if review.replacesResume { Text(NativeText.text("intake.resumeNotice")).font(.subheadline).foregroundStyle(Palette.secondary) }
        }.padding(18).frame(maxWidth: .infinity, alignment: .leading).background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
    }
    private func candidateRow(_ candidate: IntakeCandidate) -> some View {
        Button {
            if intake.selected.contains(candidate.id) { intake.selected.remove(candidate.id) } else { intake.selected.insert(candidate.id) }
        } label: {
            HStack(alignment: .top, spacing: 14) {
                DrawnTile(symbol: .credential, tint: candidate.eligible ? Palette.blueCard : Palette.pinkCard, size: 42)
                VStack(alignment: .leading, spacing: 8) {
                    Text(candidate.title).font(.headline)
                    Text(candidate.issuer).font(.subheadline).foregroundStyle(Palette.secondary)
                    Text(NativeText.text("intake.signature.\(candidate.signature)")).font(.subheadline.weight(.medium)).foregroundStyle(candidate.eligible ? Palette.secondary : Palette.errorInk)
                }.frame(maxWidth: .infinity, alignment: .leading)
                Image(systemName: intake.selected.contains(candidate.id) ? "checkmark.circle.fill" : "circle").accessibilityHidden(true)
            }.multilineTextAlignment(.leading).padding(16).frame(maxWidth: .infinity).background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
        }.buttonStyle(.plain).disabled(!candidate.eligible || intake.busy).accessibilityAddTraits(intake.selected.contains(candidate.id) ? [.isSelected] : [])
            .accessibilityIdentifier("intake-candidate-\(candidate.id)")
    }
    private func read(_ url: URL) {
        let selectedKind = kind; readingFile = true
        readTask = Task { @MainActor in
            do {
                let file = try await Task.detached(priority: .userInitiated) { try IntakeFile.read(url, kind: selectedKind) }.value
                guard !Task.isCancelled else { return }
                readingFile = false; await intake.prepare(file, kind: selectedKind)
            } catch { if !Task.isCancelled { readingFile = false; intake.report(error) } }
        }
    }
}
