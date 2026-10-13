import Foundation
import Observation
import LearnCardNativeCore

/// Authentication boundary. Test implementations never contact Firebase or send email.
public protocol AccountSession: Sendable {
    var testEmail: String { get }
    func resume() async throws -> FirebaseUser?
    func sendCode(email: String) async throws
    func verify(code: String) async throws -> FirebaseUser
    func signOut() async throws
}

extension FirebaseSession: AccountSession {}

/// Replace only the account backend in tests, retaining the production controller and views.
@MainActor public protocol AccountHost: AnyObject {
    var credentialService: any CredentialService { get }
    var consumerService: any ConsumerAppService { get }
    func initialize() async throws -> AccountState
    func recover(method: String, phrase: String, fileContents: String, password: String, emailShare: String) async throws -> AccountState
    func updateProfile(name: String, bio: String) async throws -> AccountState
    func dispose()
}

extension AccountRuntime: AccountHost {
    public var credentialService: any CredentialService { LiveCredentialService(runtime: self) }
    public var consumerService: any ConsumerAppService { LiveConsumerAppService(runtime: self) }
}

public extension AccountHost { var consumerService: any ConsumerAppService { UnavailableConsumerAppService() } }

public enum AccountActivity: Sendable { case active, inactive, background }

@MainActor @Observable
public final class NativeAccountController {
    private let session: (any AccountSession)?
    private let makeHost: @MainActor (FirebaseUser) throws -> any AccountHost
    private let forgetAccount: @MainActor (String) async throws -> Void
    private var runtime: (any AccountHost)?
    private var generation = 0
    private var endingSession = false
    private var signedOut = false
    private var accountID: String?
    public private(set) var store: NativeAppStore?
    public private(set) var state: AccountState?
    public private(set) var user: FirebaseUser?
    public private(set) var phase = "loading"
    public var email = ""
    public private(set) var busy = false
    public var error: String?
    public var recipientName: String?

    public convenience init() {
        let vault = KeychainVault()
        let firebase = try? FirebaseSession(vault: vault)
        self.init(session: firebase, makeHost: { user in
            guard let firebase else { throw AccountError.unavailable }
            return AccountRuntime(user: user, vault: vault, firebase: firebase)
        }, forgetAccount: { id in try await vault.forgetAccount(userID: id) })
        if firebase == nil { error = "Couldn't open sign-in. Please try again." }
    }

    public init(session: (any AccountSession)?,
                makeHost: @escaping @MainActor (FirebaseUser) throws -> any AccountHost,
                forgetAccount: @escaping @MainActor (String) async throws -> Void) {
        self.session = session; self.makeHost = makeHost; self.forgetAccount = forgetAccount
        email = session?.testEmail ?? ""
    }

    public func resume() async {
        guard !endingSession else { return }
        if signedOut { phase = "signIn"; return }
        await perform {
            let expected = self.generation
            guard let session = self.session else { throw AccountError.unavailable }
            let user = try await session.resume()
            try self.check(expected)
            if let user { try await self.connect(user, generation: expected) }
            else { self.user = nil; self.phase = "signIn" }
        }
    }

    public func sendCode() async {
        await perform {
            let expected = self.generation
            guard let session = self.session else { throw AccountError.unavailable }
            try await session.sendCode(email: self.email)
            try self.check(expected)
            self.phase = "code"
        }
    }

    public func verify(_ code: String) async {
        await perform {
            let expected = self.generation
            guard let session = self.session else { throw AccountError.unavailable }
            let user = try await session.verify(code: code)
            try self.check(expected)
            self.signedOut = false
            try await self.connect(user, generation: expected)
        }
    }

    private func connect(_ user: FirebaseUser, generation expected: Int) async throws {
        self.user = user; accountID = user.id
        runtime?.dispose()
        let host = try makeHost(user)
        runtime = host
        let state = try await host.initialize()
        try check(expected)
        try await apply(state)
    }

    public func recover(method: String, phrase: String, fileContents: String, password: String, emailShare: String) async {
        await perform {
            let expected = self.generation
            guard let runtime = self.runtime else { throw AccountError.unavailable }
            let state = try await runtime.recover(method: method, phrase: phrase, fileContents: fileContents, password: password, emailShare: emailShare)
            try self.check(expected)
            if state.error != nil { throw AccountError.recovery }
            try await self.apply(state)
        }
    }

    private func apply(_ state: AccountState) async throws {
        self.state = state; phase = state.phase
        if state.error != nil { throw AccountError.recovery }
        if state.phase == "ready", let runtime {
            let store = NativeAppStore(service: runtime.credentialService, isLive: true, consumerService: runtime.consumerService)
            self.store = store
            await store.refresh()
        }
    }

    public func updateProfile(name: String, bio: String) async -> Bool {
        var saved = false
        await perform {
            let expected = self.generation
            guard let runtime = self.runtime else { throw AccountError.unavailable }
            let updated = try await runtime.updateProfile(name: name, bio: bio)
            try self.check(expected)
            self.state = updated; saved = true
        }
        return saved
    }

    /// Sign-out takes priority over connecting/recovery. Dispose before awaiting cleanup so
    /// an earlier reply cannot reopen the account or keep the SDK's keys in memory.
    public func signOut(forget: Bool) async {
        guard !endingSession else { return }
        endingSession = true; signedOut = true
        lock(); busy = true; phase = "signIn"
        defer { endingSession = false; busy = false; phase = "signIn" }
        do {
            guard let session else { throw AccountError.unavailable }
            // Forget local access even when token cleanup fails, and attempt both cleanups.
            var failure: (any Error)?
            do { try await session.signOut() } catch { failure = error }
            if forget, let accountID {
                do { try await forgetAccount(accountID) } catch { failure = error }
            }
            if let failure { throw failure }
        } catch { self.error = friendly(error) }
    }

    public func activityChanged(_ activity: AccountActivity) async {
        switch activity {
        case .background: lock()
        case .active: if phase == "locked" { await resume() }
        case .inactive: break
        }
    }

    public func lock() {
        generation += 1
        runtime?.dispose(); runtime = nil
        store?.consumer.lock()
        store = nil; state = nil; user = nil; recipientName = nil
        busy = false; phase = "locked"; error = nil
    }

    private func check(_ expected: Int) throws {
        guard generation == expected, !endingSession else { throw AccountError.cancelled }
    }
    private func friendly(_ error: any Error) -> String {
        (error as? AccountError)?.errorDescription ?? "Something went wrong. Please try again."
    }
    private func perform(_ operation: () async throws -> Void) async {
        guard !busy, !endingSession else { return }
        let expected = generation
        busy = true; error = nil
        defer { if generation == expected { busy = false } }
        do { try await operation() }
        catch { if generation == expected { self.error = friendly(error) } }
    }
}
