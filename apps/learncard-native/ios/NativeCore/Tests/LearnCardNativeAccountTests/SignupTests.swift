import XCTest
import LearnCardNativeCore
@testable import LearnCardNativeSDK

final class SignupPolicyTests: XCTestCase {
    func testBirthdaysLeapDaysFutureDatesAndMalformedInput() throws {
        let policy = try SignupPolicy.load()
        XCTAssertEqual(try policy.eligibility(dob: "2013-10-17", country: "US", today: "2026-10-16").age, 12)
        XCTAssertEqual(try policy.eligibility(dob: "2013-10-16", country: "US", today: "2026-10-16").age, 13)
        XCTAssertEqual(try policy.eligibility(dob: "2012-02-29", country: "US", today: "2025-02-28").age, 12)
        XCTAssertEqual(try policy.eligibility(dob: "2012-02-29", country: "US", today: "2025-03-01").age, 13)
        for date in ["2026-10-17", "2023-02-29", "2000-02-30", "2000-13-01", "01/02/2000", "1899-01-01"] { XCTAssertThrowsError(try policy.eligibility(dob: date, country: "US", today: "2026-10-16")) }
        XCTAssertThrowsError(try policy.eligibility(dob: "2000-01-01", country: "ZZ"))
    }
    func testGeneratedCountryPolicyIncludesCorrectedIrelandAndCountryBoundaries() throws {
        let policy = try SignupPolicy.load(); XCTAssertEqual(policy.consentAges["IE"], 16); XCTAssertGreaterThan(policy.countries.count, 200)
        for country in policy.eu {
            let limit = policy.consentAges[country] ?? policy.defaultConsentAge
            XCTAssertEqual(try policy.eligibility(dob: "\(2026 - limit + 1)-01-01", country: country, today: "2026-10-16").guardianRequired, limit > 13)
            XCTAssertFalse(try policy.eligibility(dob: "\(2026 - limit)-01-01", country: country, today: "2026-10-16").guardianRequired)
        }
        XCTAssertTrue(try policy.eligibility(dob: "2011-01-01", country: "US", today: "2026-10-16").teenNotice)
    }
    func testEligibilityCannotBeBypassedWithUsernameOrAgreementOnly() throws {
        let policy = try SignupPolicy.load(); var draft = signupDraft(); try policy.validate(draft)
        draft.termsAccepted = false; XCTAssertThrowsError(try policy.validate(draft)); draft.termsAccepted = true
        draft.profileId = "bad name"; XCTAssertThrowsError(try policy.validate(draft)); draft.profileId = "valid-name"
        draft.dob = "2020-01-01"; XCTAssertThrowsError(try policy.validate(draft))
        draft.dob = "\(Calendar.current.component(.year, from: Date()) - 14)-01-01"; draft.country = "IE"
        XCTAssertThrowsError(try policy.validate(draft)); draft.guardianEmail = "parent@example.invalid"; try policy.validate(draft)
    }
    func testEmailEntryNormalizesAndRejectsMalformedAddresses() {
        XCTAssertEqual(FirebaseSession.normalizedEmail(" Person+test@Example.COM "), "person+test@example.com")
        for text in ["", "missing-at.example.com", "a@", "a@host", "a\n@example.com", "a@-example.com", String(repeating: "a", count: 255) + "@example.com"] { XCTAssertNil(FirebaseSession.normalizedEmail(text)) }
    }
    func testForgetClearsOnlyThisAccountsProtectedSetupState() async throws {
        let vault = KeychainVault(service: "signup-tests-\(UUID())")
        try await vault.write(Data("synthetic".utf8), key: SignupStorage.key(userID: "one"))
        try await vault.write(Data("synthetic-two".utf8), key: SignupStorage.key(userID: "two"))
        try await vault.forgetAccount(userID: "one")
        let own = try await vault.read(SignupStorage.key(userID: "one")), other = try await vault.read(SignupStorage.key(userID: "two"))
        XCTAssertNil(own); XCTAssertNotNil(other); try await vault.remove(SignupStorage.key(userID: "two"))
    }
}

private func signupDraft() -> SignupDraft {
    var draft = SignupDraft(); draft.dob = "1995-01-01"; draft.country = "US"; draft.name = "Synthetic Person"; draft.profileId = "synthetic-person"; draft.termsAccepted = true; return draft
}
@MainActor private final class SignupTestHost: AccountHost {
    let credentialService: any CredentialService = DemoCredentialService()
    var phase = "needs_setup"
    var calls: [String] = []
    var failConfirm = false
    var conflictAfterConfirmation = false
    var progress: SignupProgress?
    var delayedBackup: CheckedContinuation<SignupBackup, Never>?
    var delayBackup = false
    var approved = false
    var disposed = false
    func initialize() async throws -> AccountState { AccountState(phase: phase) }
    func recover(method: String, phrase: String, fileContents: String, password: String, emailShare: String) async throws -> AccountState { throw AccountError.unavailable }
    func updateProfile(name: String, bio: String, image: ProfileImageUpdate) async throws -> AccountState { throw AccountError.unavailable }
    func prepareSignup(_ draft: SignupDraft) async throws -> AccountState { calls.append("prepare"); phase = "missing_profile"; return AccountState(phase: phase) }
    func signupAvailability(_ id: String) async throws -> Bool { id != "taken" }
    func prepareSignupBackup(_ draft: SignupDraft, password: String) async throws -> SignupBackup {
        calls.append("backup")
        if delayBackup { return await withCheckedContinuation { delayedBackup = $0 } }
        return SignupBackup(id: "synthetic-file", contents: "{\"encryptedShare\":{\"ciphertext\":\"synthetic\"}}")
    }
    func confirmSignupBackup(id: String, password: String) async throws -> AccountState {
        calls.append("confirm"); if failConfirm { failConfirm = false; throw AccountError.connection }
        if conflictAfterConfirmation {
            progress = SignupProgress(draft: signupDraft(), recoveryConfirmed: true); throw SignupError.taken
        }
        phase = "ready"; return AccountState(phase: phase)
    }
    func completeSignup(_ draft: SignupDraft) async throws -> AccountState { calls.append("complete"); return AccountState(phase: "ready") }
    func refreshSignup() async throws -> AccountState { if let progress { return AccountState(phase: "finish_setup", signup: progress) }; return AccountState(phase: approved ? "ready" : "pending_approval") }
    func dispose() { disposed = true }
}
private actor SignupTestSession: AccountSession {
    let testEmail = "native-test@example.invalid"
    func resume() async throws -> FirebaseUser? { FirebaseUser(id: "signup-test", email: testEmail) }
    func sendCode(email: String) async throws {}
    func verify(code: String) async throws -> FirebaseUser { FirebaseUser(id: "signup-test", email: testEmail) }
    func signOut() async throws {}
}
@MainActor final class SignupLifecycleTests: XCTestCase {
    private func account(_ host: SignupTestHost) -> NativeAccountController { NativeAccountController(session: SignupTestSession(), makeHost: { _ in host }, forgetAccount: { _ in }) }
    func testNewAccountRequiresBackupConfirmationBeforeOpeningCollection() async {
        let host = SignupTestHost(), controller = account(host); await controller.resume()
        XCTAssertEqual(controller.phase, "needs_setup"); XCTAssertNil(controller.store)
        let prepared = await controller.prepareSignup(signupDraft()); XCTAssertTrue(prepared)
        let backup = await controller.prepareSignupBackup(signupDraft(), password: "synthetic-password", photo: nil); XCTAssertTrue(backup)
        XCTAssertNil(controller.store); XCTAssertNotNil(controller.signupBackup); XCTAssertFalse(controller.activation.needsWelcome)
        await controller.confirmSignupBackup(password: "synthetic-password")
        XCTAssertEqual(host.calls, ["prepare", "backup", "confirm"]); XCTAssertEqual(controller.phase, "ready"); XCTAssertNotNil(controller.store); XCTAssertNil(controller.signupBackup); XCTAssertTrue(controller.activation.needsWelcome)
    }
    func testUnderageNeverCallsIdentityPreparation() async {
        let host = SignupTestHost(), controller = account(host); await controller.resume(); var draft = signupDraft(); draft.dob = "2020-01-01"
        let prepared = await controller.prepareSignup(draft); XCTAssertFalse(prepared); XCTAssertTrue(host.calls.isEmpty); XCTAssertNil(controller.store)
    }
    func testLockRejectsLateBackupAndClearsPrivateContent() async {
        let host = SignupTestHost(), controller = account(host); host.delayBackup = true; await controller.resume()
        let task = Task { await controller.prepareSignupBackup(signupDraft(), password: "synthetic-password", photo: nil) }
        for _ in 0..<100 { if host.delayedBackup != nil { break }; await Task.yield() }
        XCTAssertNotNil(host.delayedBackup); controller.lock()
        host.delayedBackup?.resume(returning: SignupBackup(id: "late", contents: "encrypted")); host.delayedBackup = nil
        let result = await task.value; XCTAssertFalse(result); XCTAssertNil(controller.signupBackup); XCTAssertNil(controller.store); XCTAssertEqual(controller.phase, "locked")
    }
    func testFailedConfirmationKeepsEncryptedFileForRetry() async {
        let host = SignupTestHost(), controller = account(host); host.failConfirm = true; await controller.resume()
        _ = await controller.prepareSignupBackup(signupDraft(), password: "synthetic-password", photo: nil)
        await controller.confirmSignupBackup(password: "synthetic-password"); XCTAssertNotNil(controller.error); XCTAssertNil(controller.store); XCTAssertNotNil(controller.signupBackup)
        await controller.confirmSignupBackup(password: "synthetic-password"); XCTAssertEqual(controller.phase, "ready")
    }
    func testUsernameConflictAfterConfirmationCanFinishWithoutAnotherBackup() async {
        let host = SignupTestHost(), controller = account(host); host.conflictAfterConfirmation = true; await controller.resume()
        _ = await controller.prepareSignupBackup(signupDraft(), password: "synthetic-password", photo: nil)
        await controller.confirmSignupBackup(password: "synthetic-password")
        XCTAssertNil(controller.signupBackup); XCTAssertNil(controller.store); XCTAssertEqual(controller.phase, "finish_setup")
        XCTAssertTrue(controller.state?.signup?.recoveryConfirmed == true)
        var updated = signupDraft(); updated.profileId = "another-name"; await controller.completeSignup(updated)
        XCTAssertEqual(controller.phase, "ready"); XCTAssertEqual(host.calls, ["backup", "confirm", "complete"])
    }
    func testPendingApprovalNeverOpensCollectionUntilServerConfirms() async {
        let host = SignupTestHost(); host.phase = "pending_approval"; let controller = account(host); await controller.resume()
        XCTAssertNil(controller.store); await controller.refreshSignup(); XCTAssertEqual(controller.phase, "pending_approval"); XCTAssertNil(controller.store)
        host.approved = true; await controller.refreshSignup(); XCTAssertEqual(controller.phase, "ready"); XCTAssertNotNil(controller.store)
    }
    func testPendingClaimSurvivesRequiredSetupAndBypassesOptionalWelcome() async {
        let host = SignupTestHost(), controller = account(host)
        await controller.claims.receive("https://staging.learncard.app/claim/boost?boostUri=lc%3Anetwork%3Astaging.network.learncard.com%2Ftrpc%3Aboost%3Asample&challenge=synthetic-token")
        await controller.resume()
        XCTAssertEqual(controller.phase, "needs_setup"); XCTAssertNil(controller.store)
        XCTAssertNotNil(controller.claims.link); XCTAssertFalse(controller.activation.needsWelcome)
        await controller.completeSignup(signupDraft())
        XCTAssertEqual(controller.phase, "ready"); XCTAssertNotNil(controller.store)
        XCTAssertNotNil(controller.claims.link); XCTAssertTrue(controller.claims.isPresented)
        XCTAssertFalse(controller.activation.needsWelcome); XCTAssertFalse(controller.activation.takeIntakeRequest())
    }

    func testAnotherAccountsClaimCannotCompleteThisLearnersWelcome() async {
        let claims = NativeClaimStore(journal: MemoryClaimJournal())
        claims.connect(service: nil, accountID: "previous-account")
        await claims.receive("https://staging.learncard.app/claim/boost?boostUri=lc%3Anetwork%3Astaging.network.learncard.com%2Ftrpc%3Aboost%3Asample&challenge=synthetic-token")
        let host = SignupTestHost()
        let controller = NativeAccountController(session: SignupTestSession(), makeHost: { _ in host }, forgetAccount: { _ in }, claims: claims)
        await controller.resume(); await controller.completeSignup(signupDraft())
        XCTAssertEqual(controller.phase, "ready"); XCTAssertNil(claims.link)
        XCTAssertTrue(controller.activation.needsWelcome)
    }

}
