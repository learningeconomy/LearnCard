import XCTest
@testable import LearnCardNativeSDK

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

@MainActor final class IntakeTests: XCTestCase {
    private func file() throws -> IntakeFile { try IntakeFile(name: "credential.json", data: Data("{}".utf8), kind: .rawVC) }
    private func wait(_ condition: () async -> Bool) async { for _ in 0..<1000 { if await condition() { return }; await Task.yield() }; XCTFail("Expected suspended service") }
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
