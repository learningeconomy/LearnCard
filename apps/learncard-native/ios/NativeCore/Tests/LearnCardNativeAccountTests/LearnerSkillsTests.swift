import XCTest
@testable import LearnCardNativeSDK
import LearnCardNativeCore

private actor LearnerFixture: LearnerService {
    var pages = [SkillsPage(skills: [])]
    var offset = 0
    var failRead = false
    var failSave = false
    var suspendSave = false
    var pending: CheckedContinuation<LearnerGoals, any Error>?
    var value = LearnerGoals(goals: ["Explore"], revision: "first")
    var saves = 0
    func configure(pages: [SkillsPage]? = nil, failRead: Bool = false, failSave: Bool = false, suspend: Bool = false) { if let pages { self.pages = pages; offset = 0 }; self.failRead = failRead; self.failSave = failSave; suspendSave = suspend }
    func skills(cursor: String?) throws -> SkillsPage { if failRead { throw LearnerError.connection }; let page = pages[min(offset, pages.count - 1)]; offset += 1; return page }
    func source(id: String) throws -> Credential { throw LearnerError.unavailable }
    func goals() throws -> LearnerGoals { if failRead { throw LearnerError.connection }; return value }
    func saveGoals(_ goals: [String], revision: String) async throws -> LearnerGoals {
        saves += 1
        if suspendSave { return try await withCheckedThrowingContinuation { pending = $0 } }
        if failSave { throw LearnerError.uncertain }
        value = LearnerGoals(goals: goals, revision: "next"); return value
    }
    func waiting() -> Bool { pending != nil }
    func resolve() { pending?.resume(returning: LearnerGoals(goals: ["Late private goal"], revision: "late")); pending = nil }
    func count() -> Int { saves }
}

@MainActor final class LearnerSkillsTests: XCTestCase {
    func testPagesMergeIdentityAndDeduplicateSourcesWithoutMergingNames() async {
        let source = SkillSource(id: "one", title: "Project", issuer: "School")
        let another = SkillSource(id: "two", title: "Another", issuer: "School", selfReported: true)
        let service = LearnerFixture()
        await service.configure(pages: [SkillsPage(skills: [LearnerSkill(id: "a", name: "Same name", sources: [source, source])], hasMore: true, cursor: "second"), SkillsPage(skills: [LearnerSkill(id: "a", name: "Same name", sources: [source, another]), LearnerSkill(id: "b", name: "Same name", sources: [source])], unavailable: 1)])
        let subject = LearnerStore(service: service)
        await subject.load(); await subject.load()
        XCTAssertEqual(subject.skills.count, 2); XCTAssertEqual(subject.skills[0].sources.map(\.id), ["one", "two"])
        XCTAssertEqual(subject.unavailable, 1); XCTAssertFalse(subject.hasMore)
    }
    func testRepeatingCursorAndFailedRefreshRetainLoadedSkills() async {
        let skill = LearnerSkill(id: "a", name: "Communication", sources: [])
        let service = LearnerFixture(); await service.configure(pages: [SkillsPage(skills: [skill], hasMore: true, cursor: "loop"), SkillsPage(skills: [], hasMore: true, cursor: "loop")])
        let store = LearnerStore(service: service); await store.load(); await store.load()
        XCTAssertEqual(store.error, .connection); XCTAssertEqual(store.skills, [skill])
        await service.configure(failRead: true); await store.load(reset: true)
        XCTAssertEqual(store.skills, [skill]); XCTAssertFalse(store.loading)
    }
    func testFailedGoalReadCannotEnableAnEmptyOverwrite() async {
        let service = LearnerFixture(); await service.configure(failRead: true)
        let store = LearnerStore(service: service); await store.loadGoals()
        XCTAssertNil(store.goals); XCTAssertEqual(store.goalsError, .connection)
        let saved = await store.saveGoals([], revision: "bad"); XCTAssertFalse(saved)
        let calls = await service.count(); XCTAssertEqual(calls, 0)
    }
    func testUncertainSaveRetainsSnapshotAndSuccessfulRetryUpdatesIt() async {
        let service = LearnerFixture()
        let subject = LearnerStore(service: service); await subject.loadGoals(); await service.configure(failSave: true)
        let first = await subject.saveGoals(["Study"], revision: "first")
        XCTAssertFalse(first); XCTAssertEqual(subject.saveError, .uncertain); XCTAssertEqual(subject.goals?.goals, ["Explore"])
        await service.configure(); let second = await subject.saveGoals(["Study"], revision: "first")
        XCTAssertTrue(second); XCTAssertEqual(subject.goals?.goals, ["Study"]); XCTAssertNil(subject.saveError)
    }
    func testAccountLockDropsLateSaveReceiptAndClearsPersonalState() async {
        let service = LearnerFixture()
        let subject = LearnerStore(service: service); await subject.loadGoals(); await service.configure(suspend: true)
        let operation = Task { await subject.saveGoals(["Study"], revision: "first") }
        for _ in 0..<1000 { if await service.waiting() { break }; await Task.yield() }
        XCTAssertTrue(subject.saving); subject.lock(); await service.resolve()
        let result = await operation.value; XCTAssertFalse(result); XCTAssertNil(subject.goals); XCTAssertFalse(subject.saving); XCTAssertNil(subject.saveError)
    }
    func testGoalLimitPreservesUnicodeWithoutSilentlyTruncating() {
        XCTAssertTrue(LearnerGoals.acceptsNewGoal("تعلّم مهارة جديدة")); XCTAssertTrue(LearnerGoals.acceptsNewGoal(String(repeating: "🌟", count: 17)))
        XCTAssertFalse(LearnerGoals.acceptsNewGoal(String(repeating: "🌟", count: 18))); XCTAssertFalse(LearnerGoals.acceptsNewGoal("two\nlines")); XCTAssertFalse(LearnerGoals.acceptsNewGoal(" trailing "))
    }
    func testLiveReplyMapsLearnerFailuresWithoutRawErrorMessages() throws {
        do { let _: LearnerGoals = try AccountReply.decode("{\"ok\":false,\"error\":\"learner:uncertain\"}", method: "goalsSave"); XCTFail("Expected failure") }
        catch { XCTAssertEqual(error as? LearnerError, .uncertain) }
    }
    func testLearnerCopyExistsInEveryLanguage() {
        for language in [NativeLanguage.en, .es, .fr, .ar] {
            for key in ["skills.title", "skills.empty", "skills.partial", "goals.heading", "goals.count", "goals.sharingNotice", "skills.error.uncertain", "skills.error.changed"] {
                let value = NativeText.text(key, language: language); XCTAssertNotEqual(value, key); XCTAssertFalse(value.isEmpty)
            }
        }
    }
}
