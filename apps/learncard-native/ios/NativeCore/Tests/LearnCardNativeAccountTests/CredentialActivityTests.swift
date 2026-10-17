import XCTest
import LearnCardNativeCore
@testable import LearnCardNativeSDK

@MainActor private final class ActivityGate {
    private var continuation: CheckedContinuation<Void, Never>?
    var entered: Bool { continuation != nil }
    func wait() async { await withCheckedContinuation { continuation = $0 } }
    func finish() { continuation?.resume(); continuation = nil }
}
@MainActor private final class ActivityCredentials: CredentialService {
    let gate = ActivityGate()
    var fail = false
    var reads = 0
    private let demo = DemoCredentialService()
    func snapshot() async throws -> CollectionSnapshot {
        reads += 1; await gate.wait()
        if fail { throw AccountError.connection }
        return await demo.snapshot()
    }
    func claim(offerID: String) async throws -> CollectionSnapshot { await gate.wait(); return try await demo.claim(offerID: offerID) }
    func loadMore() async throws -> CollectionSnapshot { await gate.wait(); return await demo.snapshot() }
    func create(title: String, summary: String, kind: CredentialKind) async throws -> CollectionSnapshot {
        await gate.wait(); return try await demo.create(title: title, summary: summary, kind: kind)
    }
    func create(draft: CredentialDraft) async throws -> CollectionSnapshot { try await demo.create(draft: draft) }
    func creations(cursor: String?) async throws -> CreationPage { await demo.creations(cursor: cursor) }
    func send(credentialID: String, recipient: String) async throws -> CollectionSnapshot { throw AccountError.unavailable }
    func share(credentialIDs: [String], title: String, requestID: String, passcode: String?) async throws -> CredentialShare { throw AccountError.unavailable }
}
@MainActor private final class ActivityInbox: InboxService {
    let gate = ActivityGate()
    var fail = false
    var reads = 0
    func page(cursor: String?) async throws -> InboxPage {
        reads += 1; await gate.wait()
        if fail { throw InboxError.connection }
        return InboxPage(items: [InboxItem(id: "update", kind: .notice, name: "Sample issuer")])
    }
    func act(id: String, action: InboxAction) throws -> InboxOutcome { throw InboxError.unavailable }
}

@MainActor final class CredentialActivityTests: XCTestCase {
    private func entered(_ gate: ActivityGate) async {
        for _ in 0..<100 where !gate.entered { await Task.yield() }
        XCTAssertTrue(gate.entered)
    }
    func testRefreshTracksRealWorkRetainsContentOnFailureAndClearsOnRetry() async {
        let service = ActivityCredentials(), store = NativeAppStore(service: service)
        let first = Task { await store.refresh() }; await entered(service.gate)
        XCTAssertEqual(store.credentialActivity, .refreshing); XCTAssertTrue(store.isBusy)
        await store.refresh(); XCTAssertEqual(service.reads, 1)
        service.gate.finish(); await first.value
        let originalIDs = store.snapshot?.credentials.map(\.id)
        XCTAssertNil(store.credentialActivity); XCTAssertFalse(store.isBusy); XCTAssertNil(store.refreshError)
        service.fail = true
        let failed = Task { await store.refresh() }; await entered(service.gate)
        XCTAssertEqual(store.snapshot?.credentials.map(\.id), originalIDs)
        service.gate.finish(); await failed.value
        XCTAssertNotNil(store.refreshError); XCTAssertTrue(store.snapshotReadFailed); XCTAssertNil(store.error)
        XCTAssertNil(store.credentialActivity); XCTAssertEqual(store.snapshot?.credentials.map(\.id), originalIDs)
        service.fail = false
        let retry = Task { await store.refresh() }; await entered(service.gate)
        XCTAssertNil(store.refreshError)
        service.gate.finish(); await retry.value
        XCTAssertFalse(store.snapshotReadFailed); XCTAssertNil(store.credentialActivity)
    }
    func testReceivingPagingAndCreationDoNotMasqueradeAsIncomingChecks() async throws {
        let service = ActivityCredentials(), store = NativeAppStore(service: service)
        let demo = DemoCredentialService(), snapshot = await demo.snapshot()
        store.snapshot = snapshot
        let offer = try XCTUnwrap(snapshot.offers.first)
        let receive = Task { await store.claim(offer) }; await entered(service.gate)
        XCTAssertEqual(store.credentialActivity, .receiving)
        service.gate.finish(); let received = await receive.value
        XCTAssertTrue(received); XCTAssertNil(store.credentialActivity)
        let more = Task { await store.loadMore() }; await entered(service.gate)
        XCTAssertEqual(store.credentialActivity, .loadingMore)
        service.gate.finish(); _ = await more.value
        let create = Task { await store.create(title: "A good day", summary: "A moment of learning", kind: .achievement) }
        await entered(service.gate); XCTAssertTrue(store.isBusy); XCTAssertNil(store.credentialActivity)
        service.gate.finish(); _ = await create.value
        XCTAssertNil(store.credentialActivity)
    }
    func testInboxCheckReadsOffersThenUpdatesAndPreservesIndependentFailure() async {
        let service = ActivityCredentials(), inbox = ActivityInbox()
        let store = NativeAppStore(service: service, inboxService: inbox)
        service.fail = true
        let check = Task { await store.refreshInbox() }; await entered(service.gate)
        XCTAssertEqual(store.credentialActivity, .refreshing); XCTAssertEqual(inbox.reads, 0)
        await store.refreshInbox(); XCTAssertEqual(service.reads, 1)
        service.gate.finish(); await entered(inbox.gate)
        XCTAssertNil(store.credentialActivity); XCTAssertTrue(store.inbox.loading); XCTAssertNotNil(store.refreshError)
        await store.refreshInbox(); XCTAssertEqual(inbox.reads, 1)
        inbox.gate.finish(); await check.value
        XCTAssertTrue(store.inbox.loaded); XCTAssertFalse(store.inbox.loading); XCTAssertNotNil(store.refreshError)
        inbox.fail = true
        let failed = Task { await store.inbox.load() }; await entered(inbox.gate); inbox.gate.finish(); await failed.value
        XCTAssertNotNil(store.inbox.loadError); XCTAssertEqual(store.inbox.items.count, 1)
        store.inbox.lock(); XCTAssertNil(store.inbox.loadError)
    }
    func testSavedSamplesDoNotShowCleanCompletionWhenFinalPassportReadFails() async throws {
        let service = ActivityCredentials(), consumer = DemoConsumerAppService()
        let prepared = try await consumer.review("native-sample-student")
        let review = try XCTUnwrap(prepared)
        try await consumer.consent(ConsumerConsentDecision(review: review))
        let store = NativeAppStore(service: service, consumerService: consumer,
            intakeService: DemoIntakeService(service: DemoCredentialService(), consumer: consumer))
        service.fail = true
        let sync = Task { await store.syncSample(id: "native-sample-student") }; await entered(service.gate)
        XCTAssertTrue(store.sampleSyncBusy); XCTAssertEqual(store.credentialActivity, .refreshing)
        service.gate.finish(); await sync.value
        XCTAssertEqual(store.intake.sampleResult?.added, 12); XCTAssertTrue(store.sampleRefreshFailed)
        XCTAssertNotNil(store.refreshError); XCTAssertFalse(store.sampleSyncBusy); XCTAssertNil(store.error)
        service.fail = false
        let retry = Task { await store.syncSample(id: "native-sample-student") }; await entered(service.gate)
        XCTAssertFalse(store.sampleRefreshFailed)
        service.gate.finish(); await retry.value
        XCTAssertFalse(store.sampleRefreshFailed); XCTAssertNil(store.refreshError)
    }
}
