import XCTest
import LearnCardNativeCore
@testable import LearnCardNativeSDK

@MainActor private final class PeopleGate {
    var entered = false
    var observer: CheckedContinuation<Void, Never>?
    var waiter: CheckedContinuation<Void, Never>?
    func wait() async { entered = true; observer?.resume(); observer = nil; await withCheckedContinuation { waiter = $0 } }
    func started() async { if !entered { await withCheckedContinuation { observer = $0 } } }
    func finish() { waiter?.resume(); waiter = nil }
}
@MainActor private final class PeopleFixture: PeopleService {
    let gate = PeopleGate()
    var holdRead = false, holdAction = false, holdProfile = false
    var value = PeoplePage(items: [LearnCardPerson(id: "person", name: "Person", status: .incoming)])
    var actions = 0
    func page(scope: PeopleScope, query: String, cursor: String?) async -> PeoplePage { let result = value; if holdRead { await gate.wait() }; return result }
    func profile(id: String) async -> LearnCardPerson { if holdProfile { await gate.wait() }; return LearnCardPerson(id: id, name: "Person", status: .incoming) }
    func act(id: String, action: PeopleAction) async -> LearnCardPerson { actions += 1; if holdAction { await gate.wait() }; return LearnCardPerson(id: id, name: "Person", status: .connected) }
}
@MainActor private final class PeopleNoticeFixture: InboxService {
    var actions: [String] = []
    let items = [InboxItem(id: "settled", kind: .request, name: "Alex", profileID: "alex", status: .connected), InboxItem(id: "incoming", kind: .request, name: "Other", profileID: "other"), InboxItem(id: "prompt", kind: .prompt, name: "Alex", profileID: "alex", promptID: "prompt")]
    func page(cursor: String?) -> InboxPage { InboxPage(items: items) }
    func act(id: String, action: InboxAction) -> InboxOutcome { actions.append(id); return InboxOutcome(status: .connected) }
}
@MainActor final class PeopleTests: XCTestCase {
    func testNewSearchWinsAndFormerQueryCannotRepopulateResults() async {
        let service = PeopleFixture(), store = PeopleStore(service: service); service.holdRead = true
        let old = Task { await store.load(query: "old") }; await service.gate.started()
        service.holdRead = false; service.value = PeoplePage(items: [LearnCardPerson(id: "new", name: "New")]); await store.load(query: "new")
        service.gate.finish(); await old.value
        XCTAssertEqual(store.items.map(\.id), ["new"]); XCTAssertEqual(store.query, "new"); XCTAssertFalse(store.loading)
    }
    func testLockClearsListDetailSearchAndLateRead() async {
        let service = PeopleFixture(), store = PeopleStore(service: service); await store.show(id: "person"); service.holdRead = true
        let read = Task { await store.load(query: "private") }; await service.gate.started(); store.lock(); service.gate.finish(); await read.value
        XCTAssertTrue(store.items.isEmpty); XCTAssertNil(store.detail); XCTAssertEqual(store.query, ""); XCTAssertFalse(store.loading); XCTAssertFalse(store.loaded); XCTAssertNil(store.error)
    }
    func testDuplicateActionAndLateSuccessAfterLockAreIsolated() async {
        let service = PeopleFixture(), store = PeopleStore(service: service); await store.show(id: "person"); service.holdAction = true
        let action = Task { await store.act(.accept) }; await service.gate.started()
        let duplicate = await store.act(.accept); XCTAssertFalse(duplicate); store.lock(); service.gate.finish(); let result = await action.value
        XCTAssertFalse(result); XCTAssertNil(store.detail); XCTAssertFalse(store.busy); XCTAssertEqual(service.actions, 1)
    }
    func testRepeatedCursorFailsAndMoreResultsDeduplicate() async {
        let service = PeopleFixture(), store = PeopleStore(service: service); service.value = PeoplePage(items: service.value.items, hasMore: true, cursor: "next")
        await store.load(); service.value = PeoplePage(items: [LearnCardPerson(id: "person", name: "Updated"), LearnCardPerson(id: "other", name: "Other")])
        await store.load(more: true); XCTAssertEqual(store.items.count, 2); XCTAssertEqual(store.items.first?.name, "Updated")
        service.value = PeoplePage(items: [], hasMore: true, cursor: "repeat"); await store.load(); await store.load(more: true); XCTAssertNotNil(store.error)
    }
    func testPeopleAndInboxShareRelationshipChangesInBothDirections() async throws {
        let app = NativeAppStore(); await app.inbox.load(); XCTAssertEqual(app.inbox.unreadCount, 2)
        await app.people.show(id: "alex"); let accepted = await app.people.act(.accept); XCTAssertTrue(accepted)
        XCTAssertEqual(app.inbox.items.first(where: { $0.profileID == "alex" })?.status, .connected)
        await app.people.load(scope: .requests); XCTAssertTrue(app.people.items.isEmpty)
        let another = NativeAppStore(); await another.people.load(scope: .requests); await another.inbox.load()
        let item = try XCTUnwrap(another.inbox.items.first(where: { $0.kind == .request })); let ok = await another.inbox.act(item, .accept); XCTAssertTrue(ok); XCTAssertFalse(another.people.loaded)
        await another.people.load(); XCTAssertTrue(another.people.items.contains(where: { $0.id == "alex" }))
    }
    func testRelationshipReadUpdatesOnlySettledMatchingRequestNotices() async throws {
        let source = PeopleNoticeFixture(), inbox = InboxStore(service: source); await inbox.load(); await inbox.markRelationshipRead(profileID: "alex")
        XCTAssertEqual(source.actions, ["settled"]); XCTAssertTrue(try XCTUnwrap(inbox.items.first(where: { $0.id == "settled" })).read)
        XCTAssertFalse(try XCTUnwrap(inbox.items.first(where: { $0.id == "prompt" })).read)
        XCTAssertFalse(try XCTUnwrap(inbox.items.first(where: { $0.id == "incoming" })).read)
    }
    func testLateProfileCannotRestorePrivateContentAfterLock() async {
        let source = PeopleFixture(), people = PeopleStore(service: source); source.holdProfile = true
        let read = Task { await people.show(id: "private-person") }; await source.gate.started(); people.lock(); source.gate.finish(); await read.value
        XCTAssertNil(people.detail); XCTAssertFalse(people.detailLoading); XCTAssertNil(people.error)
    }
    func testLiveFallbackNeverExposesSampleContactsAndErrorsAreTyped() async {
        let live = NativeAppStore(isLive: true); await live.people.load(); XCTAssertTrue(live.people.items.isEmpty); XCTAssertNotNil(live.people.error)
        XCTAssertThrowsError(try AccountReply.decode("{\"ok\":false,\"error\":\"people:changed\"}", method: "peopleAction") as Bool) { XCTAssertEqual($0 as? PeopleError, .changed) }
        for language in [NativeLanguage.en, .es, .fr, .ar] {
            for key in ["people.title", "people.scope.connections", "people.scope.requests", "people.scope.sent", "people.scope.find", "people.scope.blocked", "people.error.connection", "people.action.accept", "build.title", "build.link", "build.scanBody"] { XCTAssertNotEqual(NativeText.text(key, language: language), key) }
        }
    }
    func testBuildIntakeModeDoesNotChangePendingClaimOrReadiness() async {
        let flow = NativeClaimStore(isDemo: true, journal: MemoryClaimJournal())
        flow.open(mode: .link); XCTAssertEqual(flow.entryMode, .link); XCTAssertEqual(flow.phase, "entry")
        flow.clear(); flow.open(mode: .photo); XCTAssertEqual(flow.entryMode, .photo); XCTAssertNil(flow.credential)
        let app = NativeAppStore(); flow.connect(service: app.demoClaimService, accountID: "demo")
        await flow.receive("learncard-native-demo://claim/first-aid"); XCTAssertEqual(flow.phase, "review")
        let preview = flow.credential?.id; flow.open(mode: .link)
        XCTAssertEqual(flow.phase, "review"); XCTAssertEqual(flow.credential?.id, preview)
        flow.lock(); XCTAssertFalse(flow.isPresented); XCTAssertEqual(flow.entryMode, .scan)
    }
}
