import XCTest
@testable import LearnCardNativeSDK

private actor CareerFixture: CareerService {
    var reason = "enabled"
    var failure: CareerError?
    var suspend = false
    var pending: CheckedContinuation<CareerSearchResult, any Error>?
    var searches = 0
    let occupation = CareerOccupation(id: "27-4021.00", title: "Photographers", summary: "Create images.")
    func configure(reason: String = "enabled", failure: CareerError? = nil, suspend: Bool = false) { self.reason = reason; self.failure = failure; self.suspend = suspend }
    func access() throws -> CareerAccess { if let failure { throw failure }; return CareerAccess(reason: reason) }
    func search(_ query: String) async throws -> CareerSearchResult {
        searches += 1
        if suspend { return try await withCheckedThrowingContinuation { pending = $0 } }
        if let failure { throw failure }
        return CareerSearchResult(occupations: [occupation])
    }
    func programs(_ id: String) throws -> CareerProgramsResult { if let failure { throw failure }; return CareerProgramsResult(programs: []) }
    func waiting() -> Bool { pending != nil }
    func resolve() { pending?.resume(returning: CareerSearchResult(occupations: [occupation])); pending = nil }
    func count() -> Int { searches }
}

@MainActor final class CareerTests: XCTestCase {
    func testFailedSearchRetainsLastSuccessfulQueryAndData() async {
        let service = CareerFixture()
        let subject = CareerStore(service: service); await subject.checkAccess(); await subject.search("photo")
        await service.configure(failure: .connection); await subject.search("engineering")
        XCTAssertEqual(subject.query, "photo"); XCTAssertEqual(subject.attemptedQuery, "engineering"); XCTAssertEqual(subject.result?.occupations.count, 1); XCTAssertEqual(subject.error, .connection); XCTAssertFalse(subject.loading)
    }
    func testAccessFailureDoesNotEstablishAnEmptyResultOrAllowSearch() async {
        let service = CareerFixture(); await service.configure(failure: .unavailable)
        let subject = CareerStore(service: service); await subject.checkAccess(); await subject.search("photo")
        XCTAssertNil(subject.result); XCTAssertNil(subject.access); let count = await service.count(); XCTAssertEqual(count, 0)
        XCTAssertEqual(subject.error, .unavailable)
    }
    func testChangedPolicyClearsCachedResultsAndPrograms() async {
        let service = CareerFixture()
        let store = CareerStore(service: service); await store.checkAccess(); await store.search("photo"); await store.loadPrograms("27-4021.00")
        await service.configure(reason: "disabledUser"); await store.checkAccess()
        XCTAssertNil(store.result); XCTAssertTrue(store.programs.isEmpty); XCTAssertEqual(store.error, .disabledUser)
    }
    func testAccountLockDropsLateSearchAndClearsAllState() async {
        let service = CareerFixture(); await service.configure(suspend: true)
        let subject = CareerStore(service: service); await subject.checkAccess()
        let operation = Task { await subject.search("photo") }
        for _ in 0..<1000 { if await service.waiting() { break }; await Task.yield() }
        XCTAssertTrue(subject.loading); subject.lock(); await service.resolve(); await operation.value
        XCTAssertNil(subject.result); XCTAssertNil(subject.access); XCTAssertTrue(subject.query.isEmpty); XCTAssertFalse(subject.loading)
    }
    func testPolicyChangeDuringSearchCannotRestoreOldResults() async {
        let service = CareerFixture(); await service.configure(suspend: true)
        let subject = CareerStore(service: service); await subject.checkAccess()
        let operation = Task { await subject.search("photo") }
        for _ in 0..<1000 { if await service.waiting() { break }; await Task.yield() }
        await service.configure(reason: "disabledMinor"); await subject.checkAccess(); await service.resolve(); await operation.value
        XCTAssertNil(subject.result); XCTAssertEqual(subject.error, .disabledMinor)
    }
    func testResourceFailureIsSeparateFromOccupationDataAndRetryWorks() async {
        let service = CareerFixture()
        let store = CareerStore(service: service); await store.checkAccess(); await store.search("photo")
        await service.configure(failure: .connection); await store.loadPrograms("27-4021.00")
        XCTAssertEqual(store.result?.occupations.count, 1); XCTAssertEqual(store.programErrors["27-4021.00"], .connection); XCTAssertNil(store.error)
        await service.configure(); await store.loadPrograms("27-4021.00"); XCTAssertNil(store.programErrors["27-4021.00"]); XCTAssertNotNil(store.programs["27-4021.00"])
    }
    func testCareerTransportIsNarrowAndNeverForwardsAccountAuthorization() {
        let provider = URL(string: "https://api.learncloud.ai/insights/occupations")!
        XCTAssertTrue(StagingTransport.permits(provider, method: "POST", accountHost: true))
        XCTAssertFalse(StagingTransport.permits(provider, method: "GET", accountHost: true))
        XCTAssertFalse(StagingTransport.permits(provider, method: "POST", accountHost: false))
        for path in ["/insights/salaries", "/insights/courses", "/insights/occupations?token=private"] { XCTAssertFalse(StagingTransport.permits(URL(string: "https://api.learncloud.ai\(path)")!, method: "POST", accountHost: true)) }
        for header in ["Authorization", "Cookie", "X-Auth-Token", "X-Tenant-ID"] { XCTAssertFalse(StagingTransport.permitsHeader(header, url: provider, accountHost: true)) }
        XCTAssertTrue(StagingTransport.permitsHeader("Content-Type", url: provider, accountHost: true))
        XCTAssertTrue(StagingTransport.permits(URL(string: "https://staging.api.learncard.app/trpc/preferences.getPreferencesForDid")!, method: "GET", accountHost: true))
    }
    func testUnsafeSchoolLinksAndUnknownPolicyAreRefusedAndCopyExists() throws {
        for address in ["javascript:alert(1)", "http://example.org", "https://user:password@example.org", "https://127.0.0.1", "https://test.local"] { XCTAssertNil(CareerProgram(id: "one", title: "Course", school: "School", website: address).schoolURL) }
        XCTAssertEqual(CareerAccess(reason: "unknown").error, .unavailable)
        do { let _: CareerAccess = try AccountReply.decode("{\"ok\":false,\"error\":\"career:disabledUser\"}", method: "careerAccess"); XCTFail("Expected policy failure") } catch { XCTAssertEqual(error as? CareerError, .disabledUser) }
        for language in [NativeLanguage.en, .es, .fr, .ar] {
            for key in ["career.title", "career.emptyBody", "career.error.disabledUser", "career.programLimited", "career.provider"] { XCTAssertNotEqual(NativeText.text(key, language: language), key) }
        }
    }
}
