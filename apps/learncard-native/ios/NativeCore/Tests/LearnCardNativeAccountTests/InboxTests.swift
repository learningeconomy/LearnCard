import XCTest
import LearnCardNativeCore
@testable import LearnCardNativeSDK

@MainActor private final class InboxGate {
    var entered = false
    var observer: CheckedContinuation<Void, Never>?
    var waiter: CheckedContinuation<Void, Never>?
    func wait() async { entered = true; observer?.resume(); observer = nil; await withCheckedContinuation { waiter = $0 } }
    func started() async { if !entered { await withCheckedContinuation { observer = $0 } } }
    func finish() { waiter?.resume(); waiter = nil }
}
@MainActor private final class DelayedInbox: InboxService {
    let gate = InboxGate()
    var holdRead = false
    var holdAction = false
    var actions = 0
    var value = InboxPage(items: [InboxItem(id: "request", kind: .request, name: "Synthetic person", profileID: "person")])
    func page(cursor: String?) async -> InboxPage { if holdRead { await gate.wait() }; return value }
    func act(id: String, action: InboxAction) async -> InboxOutcome {
        actions += 1; if holdAction { await gate.wait() }
        return InboxOutcome(status: .connected, metadataPending: true)
    }
}

@MainActor final class InboxTests: XCTestCase {
    func testLateInboxReadCannotRepopulateLockedAccount() async {
        let service = DelayedInbox(); service.holdRead = true; let store = InboxStore(service: service)
        let read = Task { await store.load() }; await service.gate.started(); store.lock(); service.gate.finish(); await read.value
        XCTAssertTrue(store.items.isEmpty); XCTAssertTrue(store.postClaimPrompts.isEmpty); XCTAssertFalse(store.loaded); XCTAssertFalse(store.loading); XCTAssertNil(store.error)
    }
    func testLateConnectionActionCannotReopenAccountOrShowSuccess() async throws {
        let service = DelayedInbox(), store = InboxStore(service: service); await store.load(); service.holdAction = true
        let item = try XCTUnwrap(store.items.first), action = Task { await store.act(item, .accept) }
        await service.gate.started(); store.lock(); service.gate.finish()
        let result = await action.value
        XCTAssertFalse(result); XCTAssertTrue(store.items.isEmpty); XCTAssertNil(store.busyID); XCTAssertFalse(store.metadataPending)
        let locked = await store.act(item, .accept); XCTAssertFalse(locked); XCTAssertEqual(service.actions, 1)
    }
    func testDuplicateTapCannotOverlapRelationshipWrite() async throws {
        let service = DelayedInbox(), store = InboxStore(service: service); await store.load(); service.holdAction = true
        let item = try XCTUnwrap(store.items.first), action = Task { await store.act(item, .accept) }
        await service.gate.started(); let duplicate = await store.act(item, .accept); XCTAssertFalse(duplicate)
        service.gate.finish(); let result = await action.value; XCTAssertTrue(result); XCTAssertEqual(service.actions, 1)
    }
    func testSuccessfulPromptSurvivesMetadataFailureAndCachedPendingReload() async throws {
        let service = DelayedInbox()
        let item = InboxItem(id: "prompt", kind: .prompt, name: "Synthetic issuer", promptID: "prompt", surface: "POST_CLAIM")
        service.value = InboxPage(items: [item], postClaimPrompts: [item])
        let store = InboxStore(service: service); await store.load(); let success = await store.act(item, .connect)
        XCTAssertTrue(success); XCTAssertTrue(store.metadataPending); XCTAssertTrue(store.postClaimPrompts.isEmpty)
        await store.load(); XCTAssertEqual(store.items.first?.status, .connected); XCTAssertEqual(store.unreadCount, 0); XCTAssertTrue(store.postClaimPrompts.isEmpty)
    }
    func testMorePageReplacesSyntheticRequestAndRejectsRepeatedCursor() async {
        let service = DelayedInbox(); service.value = InboxPage(items: service.value.items, hasMore: true, cursor: "next")
        let store = InboxStore(service: service); await store.load()
        service.value = InboxPage(items: [InboxItem(id: "notification", kind: .request, name: "Synthetic person", profileID: "person")])
        await store.load(more: true); XCTAssertEqual(store.items.map(\.id), ["notification"]); XCTAssertFalse(store.hasMore)
        service.value = InboxPage(items: [], hasMore: true, cursor: "next"); await store.load()
        await store.load(more: true); XCTAssertNotNil(store.error)
    }
    func testSampleClaimQueuesExplicitPromptAndLiveFallbackNeverExposesSamples() async throws {
        let app = NativeAppStore(); await app.refresh(); let offer = try XCTUnwrap(app.snapshot?.offers.first)
        let claimed = await app.claim(offer); XCTAssertTrue(claimed); XCTAssertEqual(app.inbox.postClaimPrompts.count, 1)
        let prompt = try XCTUnwrap(app.inbox.postClaimPrompts.first), skipped = await app.inbox.act(prompt, .skip)
        XCTAssertTrue(skipped); XCTAssertTrue(app.inbox.postClaimPrompts.isEmpty)
        let live = NativeAppStore(isLive: true); await live.inbox.load(); XCTAssertTrue(live.inbox.items.isEmpty)
    }
    func testInboxErrorsLocalizationAndTransportAreScoped() {
        XCTAssertThrowsError(try AccountReply.decode("{\"ok\":false,\"error\":\"inbox:changed\"}", method: "inboxAction") as Bool) { XCTAssertEqual($0 as? InboxError, .changed) }
        XCTAssertEqual(NativeText.text("inbox.accept", language: .fr), "Accepter")
        XCTAssertFalse(NativeText.format("inbox.prompt.title", "Person", language: .ar).contains("%@"))
        for method in ["notifications.notifications", "notifications.updateNotificationMeta"] {
            let url = URL(string: "https://staging.api.learncard.app/trpc/\(method)")!
            XCTAssertTrue(StagingTransport.permits(url, method: "POST", accountHost: true))
            XCTAssertFalse(StagingTransport.permits(url, method: "POST", accountHost: false))
        }
        XCTAssertFalse(StagingTransport.permits(URL(string: "https://api.learncard.app/trpc/notifications.notifications")!, method: "GET", accountHost: true))
        XCTAssertFalse(StagingTransport.permits(URL(string: "https://staging.api.learncard.app/trpc/notifications.notifications,notifications.queryNotifications")!, method: "GET", accountHost: true))
    }
    func testCredentialArrivalNotificationDoesNotDoubleCountPendingOffer() async {
        let service = DelayedInbox()
        var notice = InboxItem(id: "credential-notice", kind: .notice, type: "BOOST_RECEIVED", name: "Issuer")
        notice.credentialURIs = ["credential-uri"]
        service.value = InboxPage(items: [notice, InboxItem(id: "request", kind: .request, name: "Person")])
        let store = InboxStore(service: service); await store.load()
        XCTAssertEqual(store.updates(excluding: ["credential-uri"]).map(\.id), ["request"])
        XCTAssertEqual(store.updates(excluding: []).count, 2)
    }
}
