import XCTest
@testable import LearnCardNativeSDK

@MainActor final class LearnerActivationTests: XCTestCase {
    func testExistingAccountDoesNotGetWelcomeEvenWithEmptyPassport() {
        let activation = LearnerActivationStore()
        activation.observe(accountID: "existing", phase: "needs_recovery")
        activation.observe(accountID: "existing", phase: "ready")
        XCTAssertFalse(activation.needsWelcome)
    }
    func testSignupAndGuardianGatesCannotBeCompletedByOptionalWelcome() {
        for phase in ["needs_setup", "missing_profile", "finish_setup", "pending_approval"] {
            let activation = LearnerActivationStore()
            activation.observe(accountID: "new", phase: phase)
            activation.finish(openIntake: true)
            XCTAssertFalse(activation.needsWelcome); XCTAssertFalse(activation.takeIntakeRequest())
            activation.observe(accountID: "new", phase: "ready")
            XCTAssertTrue(activation.needsWelcome)
        }
    }
    func testPendingWelcomeSurvivesLockAndProcessRecreation() {
        let storage = MemoryLearnerActivationStorage()
        let first = LearnerActivationStore(storage: storage)
        first.observe(accountID: "new", phase: "needs_setup"); first.lock()
        XCTAssertFalse(first.needsWelcome)
        let resumed = LearnerActivationStore(storage: storage)
        resumed.observe(accountID: "new", phase: "ready")
        XCTAssertTrue(resumed.needsWelcome)
        resumed.finish()
        let relaunched = LearnerActivationStore(storage: storage)
        relaunched.observe(accountID: "new", phase: "ready")
        XCTAssertFalse(relaunched.needsWelcome)
    }
    func testAddRequestIsConsumedOnceAndNeverLeaksAcrossLockOrAccountSwitch() {
        let activation = LearnerActivationStore()
        activation.observe(accountID: "one", phase: "needs_setup")
        activation.observe(accountID: "one", phase: "ready"); activation.finish(openIntake: true)
        XCTAssertTrue(activation.takeIntakeRequest()); XCTAssertFalse(activation.takeIntakeRequest())
        activation.finish(openIntake: true); activation.lock()
        XCTAssertFalse(activation.takeIntakeRequest())
        activation.observe(accountID: "one", phase: "ready"); activation.finish(openIntake: true)
        activation.observe(accountID: "two", phase: "ready")
        XCTAssertFalse(activation.takeIntakeRequest()); XCTAssertFalse(activation.needsWelcome)
    }
    func testClaimSkipsOptionalWelcomeOnlyAfterReadyAndDoesNotOpenIntake() {
        let activation = LearnerActivationStore()
        activation.observe(accountID: "new", phase: "pending_approval", hasPendingClaim: true)
        XCTAssertFalse(activation.needsWelcome)
        activation.observe(accountID: "new", phase: "ready", hasPendingClaim: true)
        XCTAssertFalse(activation.needsWelcome); XCTAssertFalse(activation.takeIntakeRequest())
        activation.observe(accountID: "new", phase: "ready")
        XCTAssertFalse(activation.needsWelcome)
    }
    func testARealNewSetupAfterAccountResetCanShowWelcomeAgain() {
        let activation = LearnerActivationStore()
        activation.observe(accountID: "same-login", phase: "needs_setup")
        activation.observe(accountID: "same-login", phase: "ready"); activation.finish()
        activation.observe(accountID: "same-login", phase: "ready"); XCTAssertFalse(activation.needsWelcome)
        activation.observe(accountID: "same-login", phase: "needs_setup")
        activation.observe(accountID: "same-login", phase: "ready"); XCTAssertTrue(activation.needsWelcome)
    }
    func testCompletionBelongsToAnAccountAndStoresOnlyAHashedMarker() {
        let suite = "learner-activation-tests-\(UUID())"
        // Each test gets isolated preferences; nothing is written to production defaults.
        let isolated = UserDefaults(suiteName: suite)!
        defer { isolated.removePersistentDomain(forName: suite) }
        let storage = PreferenceLearnerActivationStorage(preferences: isolated)
        let activation = LearnerActivationStore(storage: storage)
        activation.observe(accountID: "private-account-id", phase: "needs_setup")
        activation.observe(accountID: "private-account-id", phase: "ready"); activation.finish()
        activation.observe(accountID: "another", phase: "needs_setup")
        activation.observe(accountID: "another", phase: "ready"); XCTAssertTrue(activation.needsWelcome)
        let values = isolated.persistentDomain(forName: suite) ?? [:]
        XCTAssertEqual(values.count, 2)
        XCTAssertTrue(values.keys.allSatisfy { !$0.contains("private-account-id") && !$0.contains("another") })
        XCTAssertEqual(Set(values.values.compactMap { $0 as? String }), Set(["finished", "pending"]))
    }
}
