import XCTest
import LearnCardNativeCore
@testable import LearnCardNativeSDK

@MainActor final class LearnerHomeLoadingTests: XCTestCase {
    func testDismissingReadErrorDoesNotBecomeEmptyOrIndefiniteLoadingAndRetryClearsFailure() async {
        let service = RetryPassportService(), store = NativeAppStore(service: service)
        await store.refresh(); XCTAssertNil(store.snapshot); XCTAssertTrue(store.snapshotReadFailed)
        store.error = nil
        XCTAssertEqual(LearnerHomeSummary(snapshot: store.snapshot, hasError: store.snapshotReadFailed).content, .unavailable)
        await service.setFailure(false); await store.refresh()
        XCTAssertFalse(store.snapshotReadFailed)
        XCTAssertEqual(LearnerHomeSummary(snapshot: store.snapshot, hasError: store.snapshotReadFailed).content, .empty)
    }
    func testFailedPaginationRetainsPartialPageAndItsRetryStateAfterAlertDismissal() async throws {
        let service = RetryPassportService(), store = NativeAppStore(service: service)
        await service.setFailure(false); await store.refresh()
        store.snapshot = CollectionSnapshot(credentials: [], offers: [], activity: [], hasMore: true)
        await service.setFailure(true)
        let failed = await store.loadMore(); XCTAssertFalse(failed); XCTAssertTrue(store.snapshotReadFailed)
        store.error = nil; XCTAssertTrue(try XCTUnwrap(store.snapshot).hasMore)
        XCTAssertNotEqual(LearnerHomeSummary(snapshot: store.snapshot, hasError: store.snapshotReadFailed).content, .empty)
        await service.setFailure(false)
        let retried = await store.loadMore(); XCTAssertTrue(retried); XCTAssertFalse(store.snapshotReadFailed)
    }
}
private actor RetryPassportService: CredentialService {
    var fail = true
    func setFailure(_ value: Bool) { fail = value }
    func snapshot() throws -> CollectionSnapshot {
        if fail { throw AccountError.connection }
        return CollectionSnapshot(credentials: [], offers: [], activity: [])
    }
    func claim(offerID: String) throws -> CollectionSnapshot { throw AccountError.unavailable }
    func create(title: String, summary: String, kind: CredentialKind) throws -> CollectionSnapshot { throw AccountError.unavailable }
    func create(draft: CredentialDraft) throws -> CollectionSnapshot { throw AccountError.unavailable }
    func creations(cursor: String?) throws -> CreationPage { throw AccountError.unavailable }
    func send(credentialID: String, recipient: String) throws -> CollectionSnapshot { throw AccountError.unavailable }
    func share(credentialIDs: [String], title: String, requestID: String, passcode: String?) throws -> CredentialShare { throw AccountError.unavailable }
}
