import Foundation
import XCTest
import LearnCardNativeCore
@testable import LearnCardNativeSDK

/// Explicit suspension points make races deterministic; no network or timing sleeps.
@MainActor private final class Gate {
    private var continuation: CheckedContinuation<Void, Never>?
    private var observer: CheckedContinuation<Void, Never>?
    private var entered = false
    func wait() async {
        await withCheckedContinuation { continuation in
            self.continuation = continuation; entered = true
            observer?.resume(); observer = nil
        }
    }
    func waitUntilEntered() async {
        if !entered { await withCheckedContinuation { observer = $0 } }
    }
    func release() { continuation?.resume(); continuation = nil }
}

@MainActor private final class SessionStub: AccountSession {
    nonisolated let testEmail = "native-test@example.invalid"
    let fixtureUser = FirebaseUser(id: "fixture-user", email: "native-test@example.invalid")
    var authenticated = true
    var resumeGate: Gate?
    var signOutGate: Gate?
    var signOutError: AccountError?
    var resumes = 0
    var signOuts = 0
    func resume() async throws -> FirebaseUser? {
        resumes += 1
        let result = authenticated ? fixtureUser : nil
        if let resumeGate { await resumeGate.wait() }
        return result
    }
    func sendCode(email: String) async throws {}
    func verify(code: String) async throws -> FirebaseUser {
        guard code == "123456" else { throw AccountError.signIn }
        authenticated = true; return fixtureUser
    }
    func signOut() async throws {
        signOuts += 1
        if let signOutGate { await signOutGate.wait() }
        if let signOutError { throw signOutError }
        authenticated = false
    }
}

@MainActor private final class AccessStub {
    var remembered = true
    var forgets: [String] = []
}

@MainActor private final class HostStub: AccountHost {
    let access: AccessStub
    let credentialService: any CredentialService = DemoCredentialService()
    let inboxService: any InboxService = DemoInboxService()
    var initializeGate: Gate?
    var recoveryGate: Gate?
    var initialState: AccountState?
    var disposed = false
    var recoveries = 0
    init(_ access: AccessStub) { self.access = access }
    func initialize() async throws -> AccountState {
        // Deliberately allow a late backend reply after dispose to test the controller guard.
        let state = initialState ?? currentState()
        if let initializeGate { await initializeGate.wait() }
        return state
    }
    func recover(method: String, phrase: String, fileContents: String, password: String, emailShare: String) async throws -> AccountState {
        recoveries += 1
        if let recoveryGate { await recoveryGate.wait() }
        guard emailShare == "synthetic-recovery-key" else { throw AccountError.identity }
        if !disposed { access.remembered = true }
        return AccountState(phase: "ready", profileName: "Fixture Person", profileId: "fixture")
    }
    func updateProfile(name: String, bio: String) async throws -> AccountState { currentState() }
    func dispose() { disposed = true }
    private func currentState() -> AccountState {
        AccountState(phase: access.remembered ? "ready" : "needs_recovery", methods: ["email"],
                     profileName: access.remembered ? "Fixture Person" : nil, profileId: "fixture")
    }
}

@MainActor private final class Harness {
    let session = SessionStub()
    let access = AccessStub()
    var hosts: [HostStub] = []
    var nextInitializeGate: Gate?
    var nextState: AccountState?
    func controller() -> NativeAccountController {
        NativeAccountController(session: session, makeHost: { user in
            XCTAssertEqual(user.id, self.session.fixtureUser.id)
            let host = HostStub(self.access)
            host.initializeGate = self.nextInitializeGate; self.nextInitializeGate = nil
            host.initialState = self.nextState; self.nextState = nil
            self.hosts.append(host); return host
        }, forgetAccount: { id in self.access.forgets.append(id); self.access.remembered = false })
    }
}

@MainActor final class AccountLifecycleTests: XCTestCase {
    func testInitialRecoveryErrorHasFriendlyFeedbackAndCanRecover() async {
        let harness = Harness(), account = harness.controller()
        harness.access.remembered = false
        harness.nextState = AccountState(phase: "recovery", methods: ["email"], error: "synthetic-internal-error")
        await account.resume()
        XCTAssertEqual(account.phase, "recovery"); XCTAssertNil(account.store)
        XCTAssertEqual(account.error, AccountError.recovery.errorDescription); XCTAssertFalse(account.busy)
        await recover(account)
        XCTAssertEqual(account.phase, "ready"); XCTAssertNil(account.error)
    }

    func testBackgroundInactiveActiveReopensAccountAndCollection() async {
        let harness = Harness(), account = harness.controller()
        await account.resume()
        let first = account.store
        await first?.inbox.load()
        XCTAssertEqual(first?.inbox.items.count, 2)
        XCTAssertEqual(first?.snapshot?.credentials.count, 3)
        await account.activityChanged(.background)
        XCTAssertTrue(harness.hosts[0].disposed)
        XCTAssertNil(account.store); XCTAssertNil(account.state); XCTAssertNil(account.user)
        XCTAssertEqual(account.phase, "locked")
        XCTAssertTrue(first?.inbox.items.isEmpty == true)
        XCTAssertFalse(first?.inbox.loaded == true)
        await account.activityChanged(.inactive)
        XCTAssertEqual(harness.hosts.count, 1)
        await account.activityChanged(.active)
        XCTAssertEqual(account.phase, "ready"); XCTAssertNil(account.error)
        XCTAssertEqual(account.store?.snapshot?.credentials.count, 3)
        XCTAssertFalse(account.store === first)
        XCTAssertEqual(harness.hosts.count, 2)
        await account.store?.inbox.load()
        XCTAssertEqual(account.store?.inbox.items.count, 2)
    }

    func testInactiveInterruptionKeepsAccountAndDoesNotReconnect() async {
        let harness = Harness(), account = harness.controller()
        await account.resume()
        let store = account.store
        await account.activityChanged(.inactive); await account.activityChanged(.active)
        XCTAssertTrue(account.store === store)
        XCTAssertFalse(harness.hosts[0].disposed)
        XCTAssertEqual(harness.session.resumes, 1)
    }

    func testOldInitializationCannotReplaceResumedAccountOrClearItsBusyState() async {
        let harness = Harness(), account = harness.controller()
        let oldGate = Gate(), newGate = Gate()
        harness.nextInitializeGate = oldGate
        let old = Task { await account.resume() }
        await oldGate.waitUntilEntered()
        account.lock()
        harness.nextInitializeGate = newGate
        let fresh = Task { await account.activityChanged(.active) }
        await newGate.waitUntilEntered()
        oldGate.release(); await old.value
        XCTAssertTrue(account.busy); XCTAssertNil(account.store); XCTAssertNil(account.error)
        newGate.release(); await fresh.value
        XCTAssertEqual(account.phase, "ready"); XCTAssertFalse(account.busy)
        XCTAssertTrue(harness.hosts[0].disposed); XCTAssertFalse(harness.hosts[1].disposed)
    }

    func testEmailRecoveryFailureCanRetryAndRelaunchWithoutAnotherRecovery() async {
        let harness = Harness(); harness.access.remembered = false
        let account = harness.controller()
        await account.resume()
        XCTAssertEqual(account.phase, "needs_recovery"); XCTAssertNil(account.store)
        await recover(account, key: "wrong-synthetic-key")
        XCTAssertEqual(account.phase, "needs_recovery"); XCTAssertNotNil(account.error)
        XCTAssertFalse(account.busy); XCTAssertNil(account.store)
        await recover(account)
        XCTAssertEqual(account.phase, "ready"); XCTAssertNil(account.error)
        XCTAssertEqual(account.store?.snapshot?.credentials.count, 3)
        account.lock()
        let restarted = harness.controller(); await restarted.resume()
        XCTAssertEqual(restarted.phase, "ready"); XCTAssertEqual(harness.hosts.last?.recoveries, 0)
        XCTAssertEqual(restarted.user?.id, harness.session.fixtureUser.id)
    }

    func testBackgroundDuringRecoveryDiscardsLateReplyAndReturnsToRecovery() async {
        let harness = Harness(); harness.access.remembered = false
        let account = harness.controller(); await account.resume()
        let gate = Gate(); harness.hosts[0].recoveryGate = gate
        let recovery = Task { await self.recover(account) }
        await gate.waitUntilEntered(); account.lock()
        gate.release(); await recovery.value
        XCTAssertEqual(account.phase, "locked"); XCTAssertNil(account.store); XCTAssertNil(account.error)
        await account.activityChanged(.inactive); await account.activityChanged(.active)
        XCTAssertEqual(account.phase, "needs_recovery"); XCTAssertFalse(account.busy)
    }

    func testSignOutPreservesRememberedAccessButRelaunchNeedsSignIn() async {
        let harness = Harness(), account = harness.controller(); await account.resume()
        let previousInbox = account.store?.inbox
        await previousInbox?.load(); XCTAssertEqual(previousInbox?.items.count, 2)
        await account.signOut(forget: false)
        XCTAssertTrue(previousInbox?.items.isEmpty == true)
        await previousInbox?.load(); XCTAssertTrue(previousInbox?.items.isEmpty == true)
        assertSignedOut(account)
        XCTAssertTrue(harness.access.remembered); XCTAssertTrue(harness.access.forgets.isEmpty)
        XCTAssertTrue(harness.hosts[0].disposed)
        let restarted = harness.controller(); await restarted.resume()
        assertSignedOut(restarted)
        await restarted.sendCode(); await restarted.verify("123456")
        XCTAssertEqual(restarted.phase, "ready"); XCTAssertEqual(harness.hosts.last?.recoveries, 0)
    }

    func testForgetWhileLockedRemovesAccessAndRequiresRecoveryOnNextSignIn() async {
        let harness = Harness(), account = harness.controller(); await account.resume(); account.lock()
        await account.signOut(forget: true)
        assertSignedOut(account)
        XCTAssertEqual(harness.access.forgets, ["fixture-user"])
        let restarted = harness.controller(); await restarted.resume(); await restarted.verify("123456")
        XCTAssertEqual(restarted.phase, "needs_recovery"); XCTAssertNil(restarted.store)
    }

    func testSignOutPreemptsRecoveryAndItsLateReplyCannotReopenAccount() async {
        let harness = Harness(); harness.access.remembered = false
        let account = harness.controller(); await account.resume()
        let gate = Gate(); harness.hosts[0].recoveryGate = gate
        let recovery = Task { await self.recover(account) }; await gate.waitUntilEntered()
        await account.signOut(forget: true)
        assertSignedOut(account); XCTAssertEqual(harness.session.signOuts, 1)
        gate.release(); await recovery.value
        assertSignedOut(account); XCTAssertNil(account.error); XCTAssertFalse(harness.access.remembered)
    }

    func testSignOutPreemptsPendingFirebaseResume() async {
        let harness = Harness(), account = harness.controller(), gate = Gate()
        harness.session.resumeGate = gate
        let resume = Task { await account.resume() }; await gate.waitUntilEntered()
        await account.signOut(forget: false)
        gate.release(); await resume.value
        assertSignedOut(account); XCTAssertTrue(harness.hosts.isEmpty)
        XCTAssertNil(account.error)
    }

    func testForegroundDuringSignOutDoesNotResumeUntilCleanupCompletes() async {
        let harness = Harness(), account = harness.controller(), gate = Gate()
        await account.resume(); harness.session.signOutGate = gate
        let logout = Task { await account.signOut(forget: false) }; await gate.waitUntilEntered()
        await account.activityChanged(.background); await account.activityChanged(.inactive); await account.activityChanged(.active)
        XCTAssertEqual(harness.session.resumes, 1); XCTAssertNil(account.store)
        gate.release(); await logout.value
        assertSignedOut(account)
        await account.activityChanged(.background); await account.activityChanged(.active)
        assertSignedOut(account); XCTAssertEqual(harness.session.resumes, 1)
    }

    func testFailedTokenCleanupStillForgetsAndKeepsPrivateContentClosed() async {
        let harness = Harness(), account = harness.controller(); await account.resume()
        harness.session.signOutError = .storage
        await account.signOut(forget: true)
        assertSignedOut(account); XCTAssertNotNil(account.error)
        XCTAssertFalse(harness.access.remembered)
        account.lock(); await account.resume()
        assertSignedOut(account); XCTAssertEqual(harness.session.resumes, 1)
        harness.session.signOutError = nil
        await account.signOut(forget: true)
        XCTAssertNil(account.error); XCTAssertFalse(harness.session.authenticated)
    }

    func testForgetClearsOnlyThisAccountsPrimaryAndPendingKeychainSlots() async throws {
        let vault = KeychainVault(service: "org.learncard.native.forget-tests.\(UUID())")
        var keys: [String] = []
        for user in ["one", "two"] {
            for id in ["sss-device-share:\(user)", "sss-pending-share:sss-device-share:\(user)"] {
                for field in ["share", "version"] {
                    let key = try AccountStorageScope.key(userID: user, id: id, field: field)
                    keys.append(key); try await vault.write(Data("synthetic".utf8), key: key)
                }
            }
        }
        do {
            try await vault.forgetAccount(userID: "one")
            for key in keys {
                let value = try await vault.read(key)
                XCTAssertEqual(value == nil, key.hasPrefix("sss:learncard:staging:one:"))
            }
        } catch { for key in keys { try? await vault.remove(key) }; throw error }
        for key in keys { try await vault.remove(key) }
    }

    private func recover(_ account: NativeAccountController, key: String = "synthetic-recovery-key") async {
        await account.recover(method: "email", phrase: "", fileContents: "", password: "", emailShare: key)
    }
    private func assertSignedOut(_ account: NativeAccountController, file: StaticString = #filePath, line: UInt = #line) {
        XCTAssertEqual(account.phase, "signIn", file: file, line: line)
        XCTAssertNil(account.store, file: file, line: line); XCTAssertNil(account.state, file: file, line: line)
        XCTAssertNil(account.user, file: file, line: line); XCTAssertFalse(account.busy, file: file, line: line)
    }
}
