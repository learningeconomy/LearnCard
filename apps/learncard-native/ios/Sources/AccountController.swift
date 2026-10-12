import SwiftUI
import LearnCardNativeSDK

@MainActor @Observable
final class AccountController {
    let vault = KeychainVault()
    private let firebase: FirebaseSession?
    private var runtime: AccountRuntime?
    private var generation = 0
    var store: AppStore?
    var state: AccountState?
    var user: FirebaseUser?
    var phase = "loading"
    var email = ""
    var busy = false
    var error: String?
    var recipientName: String?

    init() {
        do { let session = try FirebaseSession(vault: vault); firebase = session; email = session.testEmail }
        catch { firebase = nil; self.error = "Couldn't open sign-in. Please try again." }
    }

    func resume() async {
        await perform {
            let expected = self.generation
            guard let firebase = self.firebase else { throw AccountError.unavailable }
            let user = try await firebase.resume()
            guard self.generation == expected else { throw AccountError.cancelled }
            if let user { self.user = user; try await self.connect(user) }
            else { self.user = nil; self.phase = "signIn" }
        }
    }

    func sendCode() async {
        await perform {
            let expected = self.generation
            guard let firebase = self.firebase else { throw AccountError.unavailable }
            try await firebase.sendCode(email: self.email)
            guard self.generation == expected else { throw AccountError.cancelled }
            self.phase = "code"
        }
    }

    func verify(_ code: String) async {
        await perform {
            let expected = self.generation
            guard let firebase = self.firebase else { throw AccountError.unavailable }
            let user = try await firebase.verify(code: code)
            guard self.generation == expected else { throw AccountError.cancelled }
            self.user = user
            try await self.connect(user)
        }
    }

    private func connect(_ user: FirebaseUser) async throws {
        guard let firebase else { throw AccountError.unavailable }
        let expected = generation
        runtime?.dispose()
        let host = AccountRuntime(user: user, vault: vault, firebase: firebase)
        runtime = host
        let state = try await host.initialize()
        guard generation == expected else { host.dispose(); throw AccountError.cancelled }
        try await apply(state)
    }

    func recover(method: String, phrase: String, fileContents: String, password: String, emailShare: String) async {
        await perform {
            let expected = self.generation
            guard let runtime = self.runtime else { throw AccountError.unavailable }
            let state = try await runtime.recover(method: method, phrase: phrase, fileContents: fileContents, password: password, emailShare: emailShare)
            guard self.generation == expected else { throw AccountError.cancelled }
            try await self.apply(state)
        }
    }

    private func apply(_ state: AccountState) async throws {
        self.state = state
        phase = state.phase
        if state.phase == "ready", let runtime {
            let store = AppStore(service: LiveCredentialService(runtime: runtime), isLive: true)
            self.store = store
            await store.refresh()
        } else if state.error != nil { throw AccountError.recovery }
    }

    func signOut(forget: Bool) async {
        await perform {
            let expected = self.generation
            if let runtime = self.runtime { try await runtime.signOut(forget: forget) }
            else { try await self.firebase?.signOut() }
            guard self.generation == expected else { throw AccountError.cancelled }
            self.runtime = nil; self.store = nil; self.state = nil; self.user = nil; self.phase = "signIn"
        }
    }

    func lock() {
        generation += 1
        runtime?.dispose(); runtime = nil
        store = nil; state = nil
        busy = false; phase = "locked"; error = nil
    }

    private func perform(_ operation: () async throws -> Void) async {
        guard !busy else { return }
        let expected = generation
        busy = true; error = nil
        defer { if generation == expected { busy = false } }
        do { try await operation() }
        catch { if generation == expected { self.error = (error as? AccountError)?.errorDescription ?? "Something went wrong. Please try again." } }
    }
}
