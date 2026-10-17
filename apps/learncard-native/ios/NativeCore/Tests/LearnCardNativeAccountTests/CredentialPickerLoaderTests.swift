import XCTest
import LearnCardNativeCore
@testable import LearnCardNativeSDK

@MainActor private final class PickerPagingFixture: CredentialService {
    let demo = DemoCredentialService(includeSharingSamples: true)
    var calls = 0
    var fail = false
    var hold = false
    var skipFirstPage = false
    var entered = false
    var waiter: CheckedContinuation<Void, Never>?
    var observer: CheckedContinuation<Void, Never>?
    func started() async { if !entered { await withCheckedContinuation { observer = $0 } } }
    func finish() { waiter?.resume(); waiter = nil }
    func snapshot() async -> CollectionSnapshot { await demo.snapshot() }
    func loadMore() async throws -> CollectionSnapshot {
        calls += 1
        if fail { throw AccountError.unavailable }
        if skipFirstPage && calls == 1 { return await demo.snapshot() }
        if hold {
            entered = true; observer?.resume(); observer = nil
            await withCheckedContinuation { waiter = $0 }
        }
        return try await demo.loadMore()
    }
    func claim(offerID: String) async throws -> CollectionSnapshot { try await demo.claim(offerID: offerID) }
    func create(title: String, summary: String, kind: CredentialKind) async throws -> CollectionSnapshot { try await demo.create(title: title, summary: summary, kind: kind) }
    func create(draft: CredentialDraft) async throws -> CollectionSnapshot { try await demo.create(draft: draft) }
    func creations(cursor: String?) async -> CreationPage { await demo.creations(cursor: cursor) }
    func send(credentialID: String, recipient: String) async throws -> CollectionSnapshot { try await demo.send(credentialID: credentialID, recipient: recipient) }
    func share(credentialIDs: [String], title: String, requestID: String, passcode: String?) async throws -> CredentialShare {
        try await demo.share(credentialIDs: credentialIDs, title: title, requestID: requestID, passcode: passcode)
    }
}

@MainActor final class CredentialPickerLoaderTests: XCTestCase {
    func testFilterSearchReachesLastOfHundredsAndDoesNotPublishAnything() async throws {
        let service = PickerPagingFixture(), app = NativeAppStore(service: service)
        await app.refresh(); let loader = CredentialPickerLoader(app: app)
        XCTAssertEqual(app.snapshot?.credentials.count, 3)
        await loader.load(remaining: true)
        XCTAssertEqual(app.snapshot?.credentials.count, 243); XCTAssertEqual(service.calls, 4)
        XCTAssertFalse(loader.loading); XCTAssertFalse(loader.failed); XCTAssertEqual(app.snapshot?.hasMore, false)
        var query = CredentialPickerQuery(); query.text = "Archive 239"
        let result = query.results(in: try XCTUnwrap(app.snapshot).credentials, selected: [], live: false)
        XCTAssertEqual(result.map(\.id), ["share-fixture-239"])
        let share = try await app.share(credentialIDs: result.map(\.id), title: "Samples", requestID: "test-picker", passcode: nil)
        XCTAssertNil(share.url); XCTAssertTrue(share.sampleText?.contains("Archive milestone 239") == true)
        XCTAssertFalse(share.sampleText?.contains("Archive milestone 238") == true)
    }
    func testPageErrorStopsAutomaticSearchAndExplicitRetryContinues() async {
        let service = PickerPagingFixture(), app = NativeAppStore(service: service)
        await app.refresh(); let loader = CredentialPickerLoader(app: app); service.fail = true
        await loader.load(remaining: true)
        XCTAssertTrue(loader.failed); XCTAssertFalse(loader.loading); XCTAssertEqual(service.calls, 1)
        XCTAssertEqual(app.snapshot?.credentials.count, 3); XCTAssertEqual(app.snapshot?.hasMore, true)
        service.fail = false; await loader.load(remaining: true)
        XCTAssertTrue(loader.failed); XCTAssertEqual(service.calls, 1, "A changed filter must not silently retry a failed page")
        await loader.load(remaining: true, retry: true)
        XCTAssertFalse(loader.failed); XCTAssertEqual(app.snapshot?.credentials.count, 243); XCTAssertEqual(service.calls, 5)
    }
    func testChangingToAFilterDuringABrowseReadStillSearchesRemainingPages() async {
        let service = PickerPagingFixture(), app = NativeAppStore(service: service)
        await app.refresh(); let loader = CredentialPickerLoader(app: app); service.hold = true
        let browse = Task { await loader.load() }; await service.started()
        let search = Task { await loader.load(remaining: true) }
        service.hold = false; service.finish(); await browse.value; await search.value
        XCTAssertEqual(service.calls, 4); XCTAssertEqual(app.snapshot?.hasMore, false)
        XCTAssertEqual(app.snapshot?.credentials.count, 243)
    }
    func testDismissalStopsBeforeStartingAnotherPage() async {
        let service = PickerPagingFixture(), app = NativeAppStore(service: service)
        await app.refresh(); let loader = CredentialPickerLoader(app: app); service.hold = true
        let task = Task { await loader.load(remaining: true) }; await service.started(); task.cancel(); service.finish(); await task.value
        XCTAssertEqual(service.calls, 1); XCTAssertFalse(loader.loading); XCTAssertFalse(loader.failed)
        XCTAssertEqual(app.snapshot?.hasMore, true)
    }
    func testBrowseSkipsAnIndexPageContainingNoDisplayRecords() async {
        let service = PickerPagingFixture(), app = NativeAppStore(service: service)
        await app.refresh(); let loader = CredentialPickerLoader(app: app); service.skipFirstPage = true
        await loader.load()
        XCTAssertEqual(service.calls, 2); XCTAssertEqual(app.snapshot?.credentials.count, 63)
        XCTAssertEqual(app.snapshot?.hasMore, true); XCTAssertFalse(loader.failed)
    }
    func testPickerLocalizationCoversPluralsAndDateSortLabelsInEveryLocale() {
        for language in [NativeLanguage.en, .es, .fr, .ar] {
            for key in ["sharePicker.selected", "sharePicker.matches", "sharePicker.filterCount", "sharePicker.limit"] {
                for count in [0, 1, 2, 50, 300] {
                    let value = NativeText.count(key, count, language: language)
                    XCTAssertNotEqual(value, key); XCTAssertFalse(value.contains("%"))
                }
            }
            for key in ["sharePicker.date.custom", "sharePicker.sort.issuer", "sharePicker.filters", "sharePicker.searching"] {
                XCTAssertNotEqual(NativeText.text(key, language: language), key)
            }
        }
    }
    func testPassportMetadataAndBrowseCopyInEveryLocale() {
        for language in [NativeLanguage.en, .es, .fr, .ar] {
            for key in ["credential.issuedBy", "credential.issuedOn"] {
                let text = NativeText.format(key, "Timmy 42", language: language)
                XCTAssertTrue(text.contains("Timmy 42")); XCTAssertFalse(text.contains("%@")); XCTAssertNotEqual(text, "Timmy 42")
            }
            for count in [0, 1, 2, 300] {
                let text = NativeText.count("passport.loadedMatches", count, language: language)
                XCTAssertNotEqual(text, "passport.loadedMatches"); XCTAssertFalse(text.contains("%"))
            }
            for key in ["credential.issuerLabel", "credential.dateUnavailable", "passport.dateTitle", "passport.sortHint", "passport.applyDates",
                        "passport.resetBrowse", "passport.partialFailed", "passport.searchingAll", "passport.partial", "passport.noDatesBody"] {
                XCTAssertNotEqual(NativeText.text(key, language: language), key)
            }
            XCTAssertEqual(NativeText.format("passport.customDates", "START", "END", language: language), "START – END")
        }
    }
}
