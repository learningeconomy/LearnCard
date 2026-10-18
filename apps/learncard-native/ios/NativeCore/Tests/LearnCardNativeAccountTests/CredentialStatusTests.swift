import Foundation
import XCTest
import LearnCardNativeCore
@testable import LearnCardNativeSDK

private actor StatusReader: CredentialService {
    var results: [CredentialStatusCheck]
    var calls = 0
    let delay: Duration
    init(_ results: [CredentialStatusCheck], delay: Duration = .zero) { self.results = results; self.delay = delay }
    func credentialStatus(credentialID: String) async throws -> CredentialStatusCheck {
        calls += 1
        try await Task.sleep(for: delay)
        return results.removeFirst()
    }
    func snapshot() async throws -> CollectionSnapshot { throw AccountError.unavailable }
    func claim(offerID: String) async throws -> CollectionSnapshot { throw AccountError.unavailable }
    func create(title: String, summary: String, kind: CredentialKind) async throws -> CollectionSnapshot { throw AccountError.unavailable }
    func create(draft: CredentialDraft) async throws -> CollectionSnapshot { throw AccountError.unavailable }
    func creations(cursor: String?) async throws -> CreationPage { throw AccountError.unavailable }
    func send(credentialID: String, recipient: String) async throws -> CollectionSnapshot { throw AccountError.unavailable }
    func share(credentialIDs: [String], title: String, requestID: String, passcode: String?) async throws -> CredentialShare { throw AccountError.unavailable }
}

@MainActor final class CredentialStatusTests: XCTestCase {
    private func confirmed(_ state: CredentialStatusCheck.State) -> CredentialStatusCheck {
        CredentialStatusCheck(state: state, source: .network, checkedAt: Date(timeIntervalSince1970: 1_800_000_000), purposes: [.revocation, .suspension])
    }
    func testStatusWireDecodesFractionalCheckTimeAndScope() throws {
        let result: CredentialStatusCheck = try AccountReply.decode("""
        {"ok":true,"value":{"state":"revoked","source":"statusList","checkedAt":"2026-10-18T03:00:00.123Z","purposes":["revocation"]}}
        """, method: "credentialStatus")
        XCTAssertEqual(result.state, .revoked); XCTAssertEqual(result.purposes, [.revocation]); XCTAssertTrue(result.confirmed)
        XCTAssertNil(CredentialStatusCheck(state: .unavailable).checkedAt)
        XCTAssertFalse(CredentialStatusCheck(state: .active, source: .network, checkedAt: .now).confirmed)
    }
    func testFailedRecheckRetainsLastConfirmedRevocationWithoutClaimingFreshness() async {
        let old = confirmed(.revoked)
        let store = CredentialStatusStore(service: StatusReader([old, CredentialStatusCheck(state: .unavailable), CredentialStatusCheck(state: .notProvided)]), credentialID: "one")
        await store.check(); XCTAssertEqual(store.result, old); XCTAssertFalse(store.refreshFailed)
        await store.check(); XCTAssertEqual(store.result, old); XCTAssertTrue(store.refreshFailed)
        await store.check(); XCTAssertEqual(store.result, old); XCTAssertTrue(store.refreshFailed)
    }
    func testSuccessfulRecheckCanReflectReactivationAfterSuspension() async {
        let store = CredentialStatusStore(service: StatusReader([confirmed(.suspended), confirmed(.active)]), credentialID: "one")
        await store.check(); XCTAssertEqual(store.result?.state, .suspended)
        await store.check(); XCTAssertEqual(store.result?.state, .active); XCTAssertFalse(store.refreshFailed)
    }
    func testDuplicateAndCancelledChecksDoNotPublishLateResults() async throws {
        let service = StatusReader([confirmed(.revoked)], delay: .milliseconds(150))
        let store = CredentialStatusStore(service: service, credentialID: "one")
        let pending = Task { await store.check() }
        try await Task.sleep(for: .milliseconds(20))
        XCTAssertTrue(store.loading); await store.check()
        let calls = await service.calls; XCTAssertEqual(calls, 1)
        pending.cancel(); await pending.value
        XCTAssertNil(store.result); XCTAssertFalse(store.loading)
    }
    func testMissingInformationIsNotAConfirmedActiveStatusAndAllCopyIsLocalized() async {
        let store = CredentialStatusStore(service: StatusReader([CredentialStatusCheck(state: .notProvided), CredentialStatusCheck(state: .unavailable)]), credentialID: "one")
        await store.check(); XCTAssertEqual(store.result?.state, .notProvided); XCTAssertFalse(store.result!.confirmed)
        await store.check(); XCTAssertEqual(store.result?.state, .unavailable); XCTAssertTrue(store.refreshFailed)
        for language in NativeLanguage.allCases {
            XCTAssertTrue(NativeText.format("credential.lifecycle.checked", "test-date", language: language).contains("test-date"))
            for key in ["active", "revoked", "suspended", "unavailable", "notProvided", "checking", "recheck", "stale"] {
                let id = "credential.lifecycle.\(key)"; XCTAssertNotEqual(NativeText.text(id, language: language), id)
            }
        }
    }
}
