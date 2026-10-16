import XCTest
import LearnCardNativeCore
@testable import LearnCardNativeSDK

final class StagingResetStorageTests: XCTestCase {
    func testResetScopeProgressAndErrorsAreTranslated() {
        let keys = ["reset.title", "reset.scope", "reset.kept", "reset.copies", "reset.confirm", "reset.action", "reset.pending", "reset.resume", "reset.restore"] + ["collection", "profile", "recovery", "local"].map { "reset.stage.\($0)" } + ["confirmation", "changed", "connection", "storage", "recovery", "unavailable"].map { "reset.error.\($0)" }
        for language in [NativeLanguage.en, .es, .fr, .ar] { for key in keys { XCTAssertNotEqual(NativeText.text(key, language: language), key) } }
    }
    func testLocalHandoffClearsOnlyOldAccountAccessAndKeepsFirebaseAndOtherUsers() async throws {
        let vault = KeychainVault(service: "reset-tests-\(UUID())")
        let receipt = StagingResetStorage.key(userID: "one")
        let own = try AccountStorageScope.key(userID: "one", id: nil, field: "share")
        let other = try AccountStorageScope.key(userID: "two", id: nil, field: "share")
        for key in [own, other, "firebase-session", SignupStorage.key(userID: "one")] { try await vault.write(Data("synthetic".utf8), key: key) }
        let json: [String: Any] = ["version": 1, "uid": "one", "environment": "staging", "tenant": "learncard", "stage": "local"]
        try await vault.write(JSONSerialization.data(withJSONObject: json), key: receipt)
        try await vault.finishStagingReset(userID: "one", now: Date(timeIntervalSince1970: 1_000))
        let removed = try await vault.read(own), progress = try await vault.read(receipt)
        XCTAssertNil(removed); XCTAssertNil(progress)
        for key in [other, "firebase-session"] { let data = try await vault.read(key); XCTAssertEqual(data, Data("synthetic".utf8)); try await vault.remove(key) }
        let data = try await vault.read(SignupStorage.key(userID: "one"))
        let fresh = try XCTUnwrap(JSONSerialization.jsonObject(with: XCTUnwrap(data)) as? [String: Any])
        XCTAssertEqual(fresh["fresh"] as? Bool, true); XCTAssertEqual(fresh["started"] as? Double, 1_000_000)
        try await vault.remove(SignupStorage.key(userID: "one"))
    }
    func testIncompleteForeignOrMissingReceiptCannotGrantFreshSetupAndForgetKeepsResetProgress() async throws {
        let vault = KeychainVault(service: "reset-receipt-tests-\(UUID())"), key = StagingResetStorage.key(userID: "one")
        for stage in ["collection", "profile", "recovery", "missing"] {
            if stage != "missing" { try await vault.write(JSONSerialization.data(withJSONObject: ["version": 1, "uid": "one", "environment": "staging", "tenant": "learncard", "stage": stage]), key: key) }
            else { try await vault.remove(key) }
            do { try await vault.finishStagingReset(userID: "one"); XCTFail("Incomplete cleanup granted signup") } catch { XCTAssertTrue(error is StagingResetError) }
            let marker = try await vault.read(SignupStorage.key(userID: "one")); XCTAssertNil(marker)
        }
        try await vault.write(Data("pending-reset".utf8), key: key); try await vault.forgetAccount(userID: "one")
        let receipt = try await vault.read(key); XCTAssertNotNil(receipt); try await vault.remove(key)
    }
    func testSignupPreferencesRouteIsAllowedOnlyOnAccountTransport() {
        let url = URL(string: "https://staging.api.learncard.app/trpc/preferences.updatePreferences")!
        XCTAssertTrue(StagingTransport.permits(url, method: "POST", accountHost: true))
        XCTAssertFalse(StagingTransport.permits(url, method: "POST", accountHost: false))
        XCTAssertFalse(StagingTransport.permits(URL(string: "https://staging.api.learncard.app/trpc/preferences.deletePreferences")!, method: "POST", accountHost: true))
        XCTAssertFalse(StagingTransport.permits(URL(string: "https://identitytoolkit.googleapis.com/v1/accounts:delete")!, method: "POST", accountHost: true))
    }
}

@MainActor private final class ResetSession: AccountSession {
    nonisolated let testEmail = "native-test@example.invalid"
    var signOuts = 0
    func resume() async throws -> FirebaseUser? { FirebaseUser(id: "one", email: testEmail) }
    func sendCode(email: String) async throws {}
    func verify(code: String) async throws -> FirebaseUser { FirebaseUser(id: "one", email: testEmail) }
    func signOut() async throws { signOuts += 1 }
}
@MainActor private final class ResetHost: AccountHost {
    let credentialService: any CredentialService = DemoCredentialService()
    var phase = "ready", calls = 0, disposed = false, fail = false, delay = false, failInitialize = false, failStatus = false
    var continuation: CheckedContinuation<Void, Never>?
    func initialize() async throws -> AccountState {
        if failInitialize { throw AccountError.connection }
        return AccountState(phase: phase, reset: phase == "reset_pending" ? StagingResetProgress(stage: "profile", profileId: "learner") : nil)
    }
    func recover(method: String, phrase: String, fileContents: String, password: String, emailShare: String) async throws -> AccountState { AccountState(phase: "reset_pending", reset: StagingResetProgress(stage: "profile", profileId: "learner")) }
    func updateProfile(name: String, bio: String, image: ProfileImageUpdate) async throws -> AccountState { throw AccountError.unavailable }
    func resetStagingAccount(email: String) async throws -> AccountState { try await resumeStagingReset() }
    func resumeStagingReset() async throws -> AccountState {
        calls += 1; phase = "reset_pending"
        if delay { await withCheckedContinuation { continuation = $0 } }
        if fail { throw StagingResetError.connection }
        return AccountState(phase: "reset_complete")
    }
    func stagingResetStatus() async throws -> AccountState { if failStatus { throw AccountError.cancelled }; return AccountState(phase: phase, methods: ["email"], reset: StagingResetProgress(stage: "profile", profileId: "learner")) }
    func dispose() { disposed = true }
}
@MainActor final class StagingResetLifecycleTests: XCTestCase {
    private func controller(_ hosts: [ResetHost], session: ResetSession = ResetSession()) -> NativeAccountController {
        var index = 0
        return NativeAccountController(session: session, makeHost: { _ in defer { index += 1 }; return hosts[min(index, hosts.count - 1)] }, forgetAccount: { _ in XCTFail("Reset must use its protected handoff") })
    }
    func testWrongEmailLeavesCollectionAndAccountUntouched() async {
        let host = ResetHost(), account = controller([host]); await account.resume()
        await account.resetStagingAccount(confirmation: "other@example.invalid")
        XCTAssertEqual(host.calls, 0); XCTAssertEqual(account.phase, "ready"); XCTAssertNotNil(account.store); XCTAssertNotNil(account.error)
    }
    func testSuccessfulResetDisposesOldHostBeforeOpeningFreshSetupWithSameLogin() async {
        let old = ResetHost(), fresh = ResetHost(), session = ResetSession(); fresh.phase = "needs_setup"
        let account = controller([old, fresh], session: session); await account.resume()
        await account.resetStagingAccount(confirmation: session.testEmail)
        XCTAssertTrue(old.disposed); XCTAssertFalse(fresh.disposed); XCTAssertEqual(account.user?.id, "one")
        XCTAssertEqual(account.phase, "needs_setup"); XCTAssertNil(account.store); XCTAssertEqual(session.signOuts, 0)
    }
    func testFailureKeepsCollectionClosedAndRetryUsesReceipt() async {
        let old = ResetHost(), fresh = ResetHost(); old.fail = true; fresh.phase = "needs_setup"
        let account = controller([old, fresh]); await account.resume()
        await account.resetStagingAccount(confirmation: "native-test@example.invalid")
        XCTAssertEqual(account.phase, "reset_pending"); XCTAssertNil(account.store); XCTAssertNotNil(account.error)
        account.openResetRecovery(); XCTAssertEqual(account.phase, "needs_recovery")
        await account.recover(method: "email", phrase: "", fileContents: "", password: "", emailShare: "synthetic")
        XCTAssertEqual(account.phase, "reset_pending"); XCTAssertNil(account.store)
        old.fail = false; await account.resumeStagingReset()
        XCTAssertEqual(old.calls, 2); XCTAssertEqual(account.phase, "needs_setup"); XCTAssertNil(account.error)
    }
    func testFailedFreshConnectionRetriesSignupWithoutDeletingAgain() async {
        let old = ResetHost(), failed = ResetHost(), fresh = ResetHost(); failed.failInitialize = true; fresh.phase = "needs_setup"
        let account = controller([old, failed, fresh]); await account.resume()
        await account.resetStagingAccount(confirmation: "native-test@example.invalid")
        XCTAssertEqual(account.phase, "locked"); XCTAssertNil(account.store); XCTAssertTrue(failed.disposed)
        await account.resumeStagingReset(); XCTAssertEqual(account.phase, "needs_setup"); XCTAssertEqual(old.calls, 1); XCTAssertEqual(fresh.calls, 0)
    }
    func testUnavailableHostReconnectsToPendingReceiptWithoutRepeatingDeletion() async {
        let old = ResetHost(), resumed = ResetHost(); old.fail = true; old.failStatus = true; resumed.phase = "reset_pending"
        let account = controller([old, resumed]); await account.resume()
        await account.resetStagingAccount(confirmation: "native-test@example.invalid")
        XCTAssertEqual(account.phase, "locked"); XCTAssertTrue(old.disposed); XCTAssertNil(account.store)
        await account.resumeStagingReset()
        XCTAssertEqual(account.phase, "reset_pending"); XCTAssertNotNil(account.state?.reset); XCTAssertNil(account.store)
        XCTAssertEqual(old.calls, 1); XCTAssertEqual(resumed.calls, 0)
    }
    func testBackgroundAndSignOutDiscardLateCompletionWithoutOpeningSetup() async {
        for signOut in [false, true] {
            let old = ResetHost(), fresh = ResetHost(); fresh.phase = "needs_setup"; old.delay = true
            let account = controller([old, fresh]); await account.resume()
            let pending = Task { await account.resetStagingAccount(confirmation: "native-test@example.invalid") }
            for _ in 0..<100 { if old.continuation != nil { break }; await Task.yield() }
            XCTAssertNotNil(old.continuation); XCTAssertNil(account.store)
            if signOut { await account.signOut(forget: false) } else { account.lock() }
            old.continuation?.resume(); await pending.value
            XCTAssertTrue(old.disposed); XCTAssertEqual(account.phase, signOut ? "signIn" : "locked"); XCTAssertNil(account.store); XCTAssertNil(account.error)
        }
    }
}
