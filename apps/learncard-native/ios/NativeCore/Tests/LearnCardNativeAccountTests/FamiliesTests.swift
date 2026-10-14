import XCTest
import LearnCardNativeCore
@testable import LearnCardNativeSDK

@MainActor private final class FamilyGate {
    private var entered = false
    private var observer: CheckedContinuation<Void, Never>?
    private var waiter: CheckedContinuation<Void, Never>?
    func wait() async { entered = true; observer?.resume(); observer = nil; await withCheckedContinuation { waiter = $0 } }
    func started() async { if !entered { await withCheckedContinuation { observer = $0 } } }
    func finish() { waiter?.resume(); waiter = nil }
}

@MainActor private final class DelayedFamilyService: FamilyService {
    let gate = FamilyGate()
    var holdList = false
    var holdCreate = false
    var invites = 0
    let value = FamilyDetail(summary: FamilySummary(id: "family", title: "Synthetic family"), guardians: [], children: [], canEdit: true, canInvite: true)
    func families() async -> [FamilySummary] { if holdList { await gate.wait() }; return [value.summary] }
    func detail(_ id: String) async -> FamilyDetail { value }
    func hasPin() async -> Bool { true }
    func create(_ draft: FamilyDraft, pin: String, confirmation: String) async -> FamilyDetail { if holdCreate { await gate.wait() }; return value }
    func edit(_ id: String, draft: FamilyDraft) async -> FamilyDetail { value }
    func invite(_ id: String, recipient: String, requestID: String, pin: String) async { invites += 1 }
}

@MainActor final class FamiliesTests: XCTestCase {
    func testLateFamilyReadCannotRepopulateLockedAccount() async {
        let service = DelayedFamilyService(); service.holdList = true
        let store = FamiliesStore(service: service)
        let read = Task { await store.load() }; await service.gate.started()
        XCTAssertTrue(store.loading); store.lock(); service.gate.finish(); await read.value
        XCTAssertTrue(store.families.isEmpty); XCTAssertTrue(store.details.isEmpty); XCTAssertFalse(store.loaded); XCTAssertNil(store.error)
    }
    func testLateCreationCannotReopenFamilyAfterAccountLock() async {
        let service = DelayedFamilyService(); service.holdCreate = true
        let store = FamiliesStore(service: service)
        let create = Task { await store.create(FamilyDraft(name: "Synthetic family"), pin: "12345", confirmation: "") }
        await service.gate.started(); XCTAssertTrue(store.busy); store.lock(); service.gate.finish()
        let result = await create.value
        XCTAssertNil(result); XCTAssertTrue(store.families.isEmpty); XCTAssertTrue(store.details.isEmpty); XCTAssertFalse(store.busy)
    }
    func testLockedFamilyStoreRefusesNewActionsAndPINReads() async {
        let service = DelayedFamilyService(), store = FamiliesStore(service: service); store.lock()
        let invited = await store.invite("family", recipient: "person", requestID: UUID().uuidString, pin: "12345")
        XCTAssertFalse(invited); XCTAssertEqual(service.invites, 0)
        do { _ = try await store.hasPin(); XCTFail("Locked account exposed PIN capability") } catch { XCTAssertEqual(error as? AccountError, .cancelled) }
    }
    func testInvitationKeepsRosterPendingAndLiveFallbackNeverShowsSamples() async throws {
        let service = DemoFamilyService(), store = FamiliesStore(service: service)
        await store.load(); let family = try XCTUnwrap(store.families.first); await store.loadDetail(family.id)
        let before = store.details[family.id]?.guardians
        let invited = await store.invite(family.id, recipient: "someone", requestID: UUID().uuidString, pin: "12345")
        XCTAssertTrue(invited); await store.loadDetail(family.id); XCTAssertEqual(store.details[family.id]?.guardians, before)
        let live = NativeAppStore(isLive: true); await live.families.load()
        XCTAssertTrue(live.families.families.isEmpty); XCTAssertFalse(live.families.loaded); XCTAssertNotNil(live.families.error)
    }
    func testFamilyErrorsTranslationsAndTransportStayScoped() throws {
        XCTAssertThrowsError(try AccountReply.decode("{\"ok\":false,\"error\":\"family:pin\"}", method: "familiesInvite") as Bool) { XCTAssertEqual($0 as? FamilyError, .pin) }
        XCTAssertEqual(NativeText.text("family.title", language: .fr), "Familles")
        XCTAssertEqual(NativeText.text("family.title", language: .ar), "العائلات")
        XCTAssertEqual(NativeText.literal("Inbox", language: .fr), "Boîte de réception")
        XCTAssertEqual(NativeText.text("nav.inbox.short", language: .fr), "Réception")
        XCTAssertFalse(NativeText.format("family.invite.review", "Person", language: .ar).contains("%@"))
        let challenge = try XCTUnwrap(URL(string: "https://staging.api.learncard.app/trpc/utilities.getChallenges"))
        let pin = try XCTUnwrap(URL(string: "https://staging.api.learncard.app/trpc/pins.hasPin,pins.verifyPin"))
        let other = try XCTUnwrap(URL(string: "https://staging.api.learncard.app/trpc/pins.hasPin,utilities.getEncryptionKey"))
        XCTAssertTrue(StagingTransport.permits(challenge, method: "POST", accountHost: true))
        XCTAssertTrue(StagingTransport.permits(pin, method: "GET", accountHost: true))
        XCTAssertFalse(StagingTransport.permits(pin, method: "GET", accountHost: false))
        XCTAssertFalse(StagingTransport.permits(other, method: "GET", accountHost: true))
        XCTAssertFalse(StagingTransport.permits(pin, method: "DELETE", accountHost: true))
        XCTAssertFalse(StagingTransport.permitsHeader("X-Auth-Token", url: pin, accountHost: true))
    }
}
