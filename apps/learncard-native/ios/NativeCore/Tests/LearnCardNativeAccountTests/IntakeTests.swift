import XCTest
@testable import LearnCardNativeSDK
import LearnCardNativeCore

private actor IntakeFixture: IntakeService {
    var prepares = 0
    var commits = 0
    var waitForPrepare = false
    var waitForCommit = false
    var pendingPrepare: CheckedContinuation<IntakeReview, any Error>?
    var pendingCommit: CheckedContinuation<IntakeResult, any Error>?
    var commitResult = IntakeResult(added: 1)
    let value = IntakeReview(id: "review", kind: .rawVC, name: "credential.json", size: 100, candidates: [IntakeCandidate(id: "valid", title: "Project", issuer: "Sample"), IntakeCandidate(id: "invalid", title: "Altered", issuer: "Sample", signature: "failed", eligible: false)])
    func status() -> IntakeStatus { IntakeStatus(counts: ["rawVC": commits]) }
    func prepare(_ file: IntakeFile, kind: IntakeKind) async throws -> IntakeReview { prepares += 1; if waitForPrepare { return try await withCheckedThrowingContinuation { pendingPrepare = $0 } }; return value }
    func commit(id: String, selected: [String]) async throws -> IntakeResult { commits += 1; if waitForCommit { return try await withCheckedThrowingContinuation { pendingCommit = $0 } }; return commitResult }
    func document(id: String) throws -> IntakeDocumentData { throw IntakeError.changed }
    func configure(prepare: Bool = false, commit: Bool = false, partial: Bool = false) { waitForPrepare = prepare; waitForCommit = commit; if partial { commitResult = IntakeResult(added: 1, failed: 1) } }
    func resolvePrepare() { pendingPrepare?.resume(returning: value); pendingPrepare = nil }
    func resolveCommit() { pendingCommit?.resume(returning: commitResult); pendingCommit = nil }
    func counts() -> (Int, Int) { (prepares, commits) }
    func suspended(prepare: Bool) -> Bool { prepare ? pendingPrepare != nil : pendingCommit != nil }
}

private actor SampleDelayFixture: IntakeService {
    var pending: CheckedContinuation<IntakeResult, any Error>?
    var calls = 0
    var progressCallback: (@Sendable (SampleSyncProgress) async -> Void)?
    func syncSample(id: String, progress: @escaping @Sendable (SampleSyncProgress) async -> Void) async throws -> IntakeResult {
        progressCallback = progress; return try await syncSample(id: id)
    }
    func report(_ progress: SampleSyncProgress) async { await progressCallback?(progress) }
    func status() -> IntakeStatus { IntakeStatus() }
    func samples() -> [SampleCredentialBundle] { [] }
    func syncSample(id: String) async throws -> IntakeResult {
        calls += 1
        return try await withCheckedThrowingContinuation { pending = $0 }
    }
    func waiting() -> Bool { pending != nil }
    func count() -> Int { calls }
    func resolve() { pending?.resume(returning: IntakeResult(added: 4)); pending = nil }
    func reject() { pending?.resume(throwing: ConsumerAppError.connection); pending = nil }
    func prepare(_ file: IntakeFile, kind: IntakeKind) throws -> IntakeReview { throw IntakeError.unavailable }
    func commit(id: String, selected: [String]) throws -> IntakeResult { throw IntakeError.unavailable }
    func document(id: String) throws -> IntakeDocumentData { throw IntakeError.unavailable }
}

@MainActor final class IntakeTests: XCTestCase {
    private func file() throws -> IntakeFile { try IntakeFile(name: "credential.json", data: Data("{}".utf8), kind: .rawVC) }
    private func wait(_ condition: () async -> Bool) async { for _ in 0..<1000 { if await condition() { return }; await Task.yield() }; XCTFail("Expected suspended service") }
    func testSampleSyncIsSingleFlightAndSurvivesFileDismissalButNotAccountLock() async {
        let service = SampleDelayFixture(), store = IntakeStore(service: service)
        store.beginSamplePreparation(id: "sample"); XCTAssertTrue(store.hasSampleNotice)
        store.lock(); store.endSamplePreparation(id: "sample", error: .connection)
        XCTAssertFalse(store.hasSampleNotice); XCTAssertFalse(store.samplePreparing)
        let task = Task { await store.syncSample(id: "sample") }
        await wait { await service.waiting() }
        await service.report(SampleSyncProgress(processed: 1, total: 4))
        XCTAssertEqual(store.sampleProgress, SampleSyncProgress(processed: 1, total: 4)); XCTAssertTrue(store.hasSampleNotice)
        store.clearReview(); await store.syncSample(id: "sample")
        let calls = await service.count(); XCTAssertEqual(calls, 1)
        await service.resolve(); await task.value
        XCTAssertEqual(store.sampleResult?.added, 4)
        store.dismissSampleNotice(); XCTAssertFalse(store.hasSampleNotice)
        let next = Task { await store.syncSample(id: "sample") }
        await wait { await service.waiting() }; store.lock()
        await service.report(SampleSyncProgress(processed: 3, total: 4))
        XCTAssertNil(store.sampleProgress); XCTAssertFalse(store.hasSampleNotice)
        await service.resolve(); await next.value
        XCTAssertNil(store.sampleResult); XCTAssertNil(store.sampleError); XCTAssertFalse(store.sampleBusy)
    }
    func testSampleConsentAndSyncAreExplicitAndRepeatable() async throws {
        let credentials = DemoCredentialService(emptyCollection: true)
        let consumer = DemoConsumerAppService()
        let service = DemoIntakeService(service: credentials, consumer: consumer)
        let store = IntakeStore(service: service)
        await store.loadSamples()
        XCTAssertEqual(store.samples.first?.connected, false)
        await store.syncSample(id: "native-sample-student")
        XCTAssertEqual(store.sampleError, .decision)
        await store.loadSamples()
        XCTAssertEqual(store.sampleSyncError, .decision); XCTAssertTrue(store.hasSampleNotice)
        let before = await credentials.snapshot(); XCTAssertTrue(before.credentials.isEmpty)
        let prepared = try await consumer.review("native-sample-student")
        let review = try XCTUnwrap(prepared)
        XCTAssertEqual(review.writeCredentials.first?.required, false)
        var decision = ConsumerConsentDecision(review: review)
        XCTAssertEqual(decision.writeCategories, ["Achievement"])
        XCTAssertTrue(decision.readCategories.isEmpty); XCTAssertTrue(decision.personalValues.isEmpty)
        XCTAssertTrue(decision.satisfies(review))
        decision.writeCategories = []; XCTAssertFalse(decision.satisfies(review))
        try await consumer.consent(ConsumerConsentDecision(review: review))
        await store.syncSample(id: "native-sample-student")
        XCTAssertEqual(store.sampleResult, IntakeResult(added: 12)); XCTAssertEqual(store.samples.first?.connected, true)
        await store.syncSample(id: "native-sample-student")
        XCTAssertEqual(store.sampleResult, IntakeResult(added: 0, existing: 12))
        store.lock(); XCTAssertTrue(store.samples.isEmpty); XCTAssertNil(store.sampleResult)
    }
    func testPartialSampleNoticeRetriesAndRetainsOriginals() async throws {
        let credentials = DemoCredentialService(), consumer = DemoConsumerAppService()
        let prepared = try await consumer.review("native-sample-student")
        let review = try XCTUnwrap(prepared)
        try await consumer.consent(ConsumerConsentDecision(review: review))
        let store = IntakeStore(service: DemoIntakeService(service: credentials, consumer: consumer, failSampleOnce: true))
        await store.syncSample(id: "native-sample-student")
        XCTAssertEqual(store.sampleResult, IntakeResult(added: 11, failed: 1)); XCTAssertTrue(store.hasSampleNotice)
        XCTAssertEqual(store.sampleProgress, SampleSyncProgress(processed: 12, total: 12))
        await store.syncSample(id: "native-sample-student")
        XCTAssertEqual(store.sampleResult, IntakeResult(added: 1, existing: 11)); XCTAssertTrue(store.hasSampleNotice)
        store.dismissSampleNotice(); XCTAssertFalse(store.hasSampleNotice)
    }
    func testInterruptedSampleSyncRefreshesEarlierAdditionsAndKeepsRetryNotice() async {
        let credentials = DemoCredentialService(), service = SampleDelayFixture()
        let store = NativeAppStore(service: credentials, intakeService: service)
        await store.refresh()
        let task = Task { await store.syncSample(id: "sample") }
        await wait { await service.waiting() }
        await credentials.importSample(id: "partial", title: "Earlier addition", issuer: "Sample")
        await service.report(SampleSyncProgress(processed: 1, total: 4)); await service.reject(); await task.value
        XCTAssertEqual(store.snapshot?.credentials.count, 4)
        XCTAssertEqual(store.intake.sampleSyncError, .connection); XCTAssertTrue(store.intake.hasSampleNotice)
        XCTAssertFalse(store.sampleSyncBusy); XCTAssertNil(store.error)
    }
    func testSharedSampleCoordinatorRefreshesPassportAfterSync() async throws {
        let credentials = DemoCredentialService(), consumer = DemoConsumerAppService()
        let prepared = try await consumer.review("native-sample-student")
        let review = try XCTUnwrap(prepared)
        try await consumer.consent(ConsumerConsentDecision(review: review))
        let store = NativeAppStore(service: credentials, consumerService: consumer,
            intakeService: DemoIntakeService(service: credentials, consumer: consumer))
        await store.refresh(); XCTAssertEqual(store.snapshot?.credentials.count, 3)
        await store.syncSample(id: "native-sample-student")
        XCTAssertEqual(store.snapshot?.credentials.count, 15)
        XCTAssertFalse(store.sampleSyncBusy); XCTAssertFalse(store.snapshotReadFailed); XCTAssertNil(store.error)
        XCTAssertEqual(store.intake.sampleResult?.added, 12)
    }
    func testMilestonesCountSavedDocumentKindsRatherThanFilesOrVisits() async throws {
        let store = IntakeStore(service: DemoIntakeService())
        await store.load(); XCTAssertEqual(store.completedDocumentKinds, 0)
        let file = try IntakeFile(name: "my-learning.txt", data: Data("Personal learning record".utf8), kind: .certificate)
        await store.prepare(file, kind: .certificate); XCTAssertEqual(store.completedDocumentKinds, 0)
        await store.save(); XCTAssertEqual(store.completedDocumentKinds, 1)
        store.clearReview(); await store.load(); XCTAssertEqual(store.completedDocumentKinds, 1)
        await store.prepare(file, kind: .transcript); await store.save(); XCTAssertEqual(store.completedDocumentKinds, 2)
    }
    func testFileLimitsNamesAndBoundedRead() throws {
        XCTAssertThrowsError(try IntakeFile(name: "empty.txt", data: Data(), kind: .certificate))
        XCTAssertThrowsError(try IntakeFile(name: "../private.txt", data: Data([1]), kind: .certificate))
        XCTAssertThrowsError(try IntakeFile(name: "a.exe", data: Data([1]), kind: .certificate))
        XCTAssertThrowsError(try IntakeFile(name: "a.json", data: Data(repeating: 0, count: 1_048_577), kind: .rawVC))
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("intake-\(UUID().uuidString).txt")
        defer { try? FileManager.default.removeItem(at: url) }
        try Data(repeating: 65, count: 4_194_305).write(to: url)
        XCTAssertThrowsError(try IntakeFile.read(url, kind: .transcript))
        try Data("Selected document".utf8).write(to: url)
        XCTAssertEqual(try IntakeFile.read(url, kind: .transcript).data, Data("Selected document".utf8))
    }
    func testReviewSelectionNoWritesUntilExplicitSave() async throws {
        let service = IntakeFixture(), store = IntakeStore(service: service)
        await store.prepare(try file(), kind: .rawVC)
        XCTAssertEqual(store.selected, ["valid"]); XCTAssertTrue(store.canSave)
        let before = await service.counts(); XCTAssertEqual(before.1, 0)
        store.selected = []; await store.save(); let unselected = await service.counts(); XCTAssertEqual(unselected.1, 0)
        store.selected = ["valid"]; await store.save(); XCTAssertEqual(store.result, IntakeResult(added: 1)); XCTAssertEqual(store.status?.counts["rawVC"], 1)
    }
    func testLockDiscardsLateFileReviewAndClearsStatus() async throws {
        let service = IntakeFixture(), store = IntakeStore(service: service); await service.configure(prepare: true)
        let task = Task { await store.prepare(try! file(), kind: .rawVC) }
        await wait { await service.suspended(prepare: true) }; store.lock(); await service.resolvePrepare(); await task.value
        XCTAssertNil(store.review); XCTAssertNil(store.status); XCTAssertNil(store.error); XCTAssertFalse(store.busy); XCTAssertTrue(store.selected.isEmpty)
    }
    func testLockDiscardsLateSaveAndDuplicateTapsDoNotWriteTwice() async throws {
        let service = IntakeFixture(), store = IntakeStore(service: service); await service.configure(commit: true)
        await store.prepare(try file(), kind: .rawVC)
        let task = Task { await store.save() }; await wait { await service.suspended(prepare: false) }
        await store.save(); let calls = await service.counts(); XCTAssertEqual(calls.1, 1)
        store.lock(); await service.resolveCommit(); await task.value; XCTAssertNil(store.result); XCTAssertNil(store.review); XCTAssertNil(store.error)
    }
    func testPartialSaveRetainsReviewSelectionAndRetry() async throws {
        let service = IntakeFixture(), store = IntakeStore(service: service); await service.configure(partial: true)
        await store.prepare(try file(), kind: .rawVC); await store.save()
        XCTAssertEqual(store.result?.failed, 1); XCTAssertNotNil(store.review); XCTAssertEqual(store.selected, ["valid"]); XCTAssertEqual(store.error, .connection); XCTAssertTrue(store.canSave)
        store.clearReview(); XCTAssertNil(store.result); XCTAssertNil(store.error); XCTAssertFalse(store.canSave)
    }
    func testErrorsAndDocumentNamesAreLocalizedInAllFourLanguages() throws {
        let keys = ["intake.privateCopy", "intake.originalProof", "intake.signatureNotice", "intake.chooseFile", "intake.documents", "intake.credentials"] + IntakeKind.allCases.map { "intake.kind.\($0.rawValue)" } + ["signIn", "file", "size", "empty", "changed", "connection", "busy", "unavailable"].map { "intake.error.\($0)" }
        for language in [NativeLanguage.en, .es, .fr, .ar] { for key in keys { XCTAssertNotEqual(NativeText.text(key, language: language), key) } }
    }
    func testOnlyPrivateCloudStorageGetsDocumentSizedRequestLimit() {
        let cloud = URL(string: "https://staging.cloud.learncard.com/trpc/storage.store")!
        XCTAssertEqual(StagingTransport.requestLimit(cloud, method: "POST"), 8 * 1024 * 1024)
        XCTAssertEqual(StagingTransport.requestLimit(cloud, method: "GET"), 2 * 1024 * 1024)
        XCTAssertEqual(StagingTransport.requestLimit(URL(string: "https://staging.network.learncard.com/trpc/storage.store")!, method: "POST"), 2 * 1024 * 1024)
        XCTAssertEqual(StagingTransport.requestLimit(URL(string: "https://staging.cloud.learncard.com/trpc/index.add")!, method: "POST"), 2 * 1024 * 1024)
    }
}
