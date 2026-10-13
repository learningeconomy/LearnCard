import Foundation
import XCTest
import LearnCardNativeCore
@testable import LearnCardNativeSDK

@MainActor private final class ConsumerGate {
    var entered = false
    var continuation: CheckedContinuation<Void, Never>?
    var observer: CheckedContinuation<Void, Never>?
    func wait() async { await withCheckedContinuation { continuation = $0; entered = true; observer?.resume(); observer = nil } }
    func started() async { if !entered { await withCheckedContinuation { observer = $0 } } }
    func arrive() { entered = true; observer?.resume(); observer = nil }
    func release() { continuation?.resume(); continuation = nil }
}
@MainActor private final class DelayedConsumer: ConsumerAppService {
    let demo = DemoConsumerAppService(), gate = ConsumerGate()
    var installedCalls = 0
    var pauseRead = false
    func browse(category: String?, cursor: String?) async throws -> ConsumerAppPage { let page = try await demo.browse(category: category, cursor: cursor); if category == nil { await gate.wait() }; return page }
    func installed(cursor: String?) async throws -> ConsumerAppPage { installedCalls += 1; return try await demo.installed(cursor: cursor) }
    func install(_ id: String) async throws { await gate.wait(); try await demo.install(id) }
    func remove(_ id: String) async throws { await demo.remove(id) }
    func review(_ id: String) async throws -> ConsumerConsentReview? { try await demo.review(id) }
    func consent(_ decision: ConsumerConsentDecision) async throws { try await demo.consent(decision) }
    func launch(_ id: String) async throws -> ConsumerAppLaunch { try await demo.launch(id) }
    func identity(_ id: String, origin: String, challenge: String?) async throws -> PartnerValue { try await demo.identity(id, origin: origin, challenge: challenge) }
    func event(_ id: String, event: PartnerValue) async throws -> PartnerValue { try await demo.event(id, event: event) }
    func dataSharing(connectionsCursor: String?, linksCursor: String?, more: Bool) async throws -> DataSharingPage { try await demo.dataSharing(connectionsCursor: connectionsCursor, linksCursor: linksCursor, more: more) }
    func withdraw(_ id: String) async throws { try await demo.withdraw(id) }
    func stopLink(_ link: ManagedCredentialLink) async throws -> Bool { try await demo.stopLink(link) }
    func linkURL(_ id: String) async throws -> URL { try await demo.linkURL(id) }
}

@MainActor final class ConsumerAppsTests: XCTestCase {
    func testLockDiscardsLateCatalogRead() async {
        let service = DelayedConsumer(), store = ConsumerAppsStore(service: service)
        let task = Task { await store.browse() }; await service.gate.started(); store.lock(); service.gate.release(); await task.value
        XCTAssertTrue(store.apps.isEmpty); XCTAssertFalse(store.browseBusy); XCTAssertNil(store.error)
    }
    func testSwitchingCategoriesDiscardsAnEarlierCatalogReply() async {
        let service = DelayedConsumer(), store = ConsumerAppsStore(service: service)
        let earlier = Task { await store.browse() }; await service.gate.started()
        await store.browse(category: "tools"); service.gate.release(); await earlier.value
        XCTAssertEqual(store.apps.map(\.id), ["sample-studio"]); XCTAssertFalse(store.browseBusy)
    }
    func testLateInstallDoesNotStartAnotherReadAfterLock() async throws {
        let service = DelayedConsumer(), store = ConsumerAppsStore(service: service)
        let app = try await service.demo.browse(category: nil, cursor: nil).records[0]
        let task = Task { await store.add(app) }; await service.gate.started(); store.lock(); service.gate.release()
        let succeeded = await task.value
        XCTAssertFalse(succeeded); XCTAssertEqual(service.installedCalls, 0); XCTAssertTrue(store.installedApps.isEmpty)
    }
    func testInstallRemovalAndWithdrawalAreIndependent() async throws {
        let store = ConsumerAppsStore(service: DemoConsumerAppService())
        await store.browse(); let app = try XCTUnwrap(store.apps.first { $0.id == "sample-studio" })
        let result = try await store.review(app)
        let review = try XCTUnwrap(result), decision = ConsumerConsentDecision(review: review)
        XCTAssertTrue(decision.readCategories.isEmpty); XCTAssertEqual(decision.selectedCount, 0); XCTAssertEqual(decision.writeCategories, ["Achievement"])
        let added = await store.add(app, decision: decision); XCTAssertTrue(added); XCTAssertTrue(store.isInstalled(app.id))
        let connection = try XCTUnwrap(store.connections.first)
        let removed = await store.remove(app); XCTAssertTrue(removed)
        XCTAssertEqual(store.connections.first?.status, "live")
        let stopped = await store.withdraw(connection); XCTAssertTrue(stopped); XCTAssertEqual(store.connections.first?.status, "withdrawn")
    }
    func testResponseFragmentsAndFriendlyConsumerErrors() throws {
        let success: Bool = try AccountReply.decode("{\"ok\":true,\"value\":true}", method: "appsInstall"); XCTAssertTrue(success)
        let absent: ConsumerConsentReview? = try AccountReply.decode("{\"ok\":true,\"value\":null}", method: "appsReview"); XCTAssertNil(absent)
        let array: [String] = try AccountReply.decode("{\"ok\":true,\"value\":[]}", method: "appsInstalled"); XCTAssertTrue(array.isEmpty)
        XCTAssertThrowsError(try AccountReply.decode("{\"ok\":false,\"error\":\"consumer:guardian\"}", method: "appsInstall") as Bool) { XCTAssertEqual($0 as? ConsumerAppError, .guardian) }
    }
    func testCommandQueueOrdersWaitersAndDropsCancelledCommands() async throws {
        let queue = AccountCommandQueue(); try await queue.acquire()
        var executed: [Int] = []
        let firstStarted = ConsumerGate(), cancelledStarted = ConsumerGate(), thirdStarted = ConsumerGate()
        let first = Task { firstStarted.arrive(); try await queue.acquire(); executed.append(1); queue.release() }
        await firstStarted.started(); XCTAssertEqual(queue.waitingCount, 1)
        let cancelled = Task { cancelledStarted.arrive(); try await queue.acquire(); executed.append(2); queue.release() }
        await cancelledStarted.started(); XCTAssertEqual(queue.waitingCount, 2)
        let third = Task { thirdStarted.arrive(); try await queue.acquire(); executed.append(3); queue.release() }
        await thirdStarted.started(); XCTAssertEqual(queue.waitingCount, 3)
        cancelled.cancel()
        do { try await cancelled.value; XCTFail("A cancelled command ran") } catch { XCTAssertEqual(error as? AccountError, .cancelled) }
        XCTAssertEqual(queue.waitingCount, 2)
        queue.release(); try await first.value; try await third.value
        XCTAssertEqual(executed, [1, 3])
    }
    func testDisposedCommandQueueRejectsAllWaitersAndFutureCalls() async throws {
        let queue = AccountCommandQueue(); try await queue.acquire()
        let started = ConsumerGate()
        let waiter = Task { started.arrive(); try await queue.acquire() }; await started.started(); XCTAssertEqual(queue.waitingCount, 1); queue.dispose()
        do { try await waiter.value; XCTFail("A disposed waiter ran") } catch { XCTAssertEqual(error as? AccountError, .cancelled) }
        do { try await queue.acquire(); XCTFail("A disposed queue reopened") } catch { XCTAssertEqual(error as? AccountError, .cancelled) }
    }
    func testTranslationsPluralsAndRTLUseNativeResources() {
        XCTAssertEqual(NativeText.text("apps.title", language: .es), "Apps")
        XCTAssertEqual(NativeText.text("apps.discover", language: .fr), "Découvrir")
        XCTAssertNotEqual(NativeText.text("apps.discover", language: .ar), "Discover")
        XCTAssertTrue(NativeLanguage.ar.isRightToLeft); XCTAssertFalse(NativeLanguage.fr.isRightToLeft)
        XCTAssertEqual(NativeText.count("apps.count", 1, language: .en), "1 app")
        XCTAssertEqual(NativeText.count("apps.count", 2, language: .en), "2 apps")
        XCTAssertFalse(NativeText.format("consent.identityTitle", "Publisher", language: .ar).contains("%@"))
        for number in [0, 1, 2, 3, 11, 100] { XCTAssertFalse(NativeText.count("sharing.count", number, language: .ar).contains("%")) }
    }
}
