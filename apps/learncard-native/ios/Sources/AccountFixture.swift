#if DEBUG
import Foundation
import LearnCardNativeCore
import LearnCardNativeSDK

/// Only fake account boundaries: the production controller, collection store and screens
/// still run. Public synthetic markers have a separate Keychain service for each UI test.
@MainActor enum AccountFixture {
    static func controller(arguments: [String]) -> AccountController? {
        guard let index = arguments.firstIndex(of: "--account-fixture"), arguments.count > index + 2,
              let id = UUID(uuidString: arguments[index + 2]) else { return nil }
        let scenario = arguments[index + 1]
        let vault = KeychainVault(service: "org.learncard.native.account-ui-tests.\(id.uuidString)")
        let session = FixtureSession(vault: vault, scenario: scenario, reset: arguments.contains("--fixture-reset"))
        return AccountController(session: session, makeHost: { _ in FixtureHost(vault: vault) },
                                 forgetAccount: { _ in try await vault.remove("fixture-remembered") })
    }
}

@MainActor private final class FixtureSession: AccountSession {
    nonisolated let testEmail = "native-test@example.invalid"
    let vault: KeychainVault
    let scenario: String
    var reset: Bool
    let user = FirebaseUser(id: "fixture-user", email: "native-test@example.invalid")
    init(vault: KeychainVault, scenario: String, reset: Bool) {
        self.vault = vault; self.scenario = scenario; self.reset = reset
    }
    func resume() async throws -> FirebaseUser? {
        if reset {
            reset = false
            try await vault.remove("fixture-auth"); try await vault.remove("fixture-remembered")
            if scenario != "sign-in" { try await vault.write(Data("synthetic".utf8), key: "fixture-auth") }
            if scenario == "ready" { try await vault.write(Data("synthetic".utf8), key: "fixture-remembered") }
        }
        return try await vault.read("fixture-auth") == nil ? nil : user
    }
    func sendCode(email: String) async throws {}
    func verify(code: String) async throws -> FirebaseUser {
        guard code == "123456" else { throw AccountError.signIn }
        try await vault.write(Data("synthetic".utf8), key: "fixture-auth")
        return user
    }
    func signOut() async throws { try await vault.remove("fixture-auth") }
}

@MainActor private final class FixtureHost: AccountHost {
    let vault: KeychainVault
    let credentialService: any CredentialService = DemoCredentialService()
    private var disposed = false
    init(vault: KeychainVault) { self.vault = vault }
    func initialize() async throws -> AccountState {
        guard !disposed else { throw AccountError.cancelled }
        return try await vault.read("fixture-remembered") == nil
            ? AccountState(phase: "needs_recovery", methods: ["email"])
            : AccountState(phase: "ready", profileName: "Fixture Person", profileId: "fixture")
    }
    func recover(method: String, phrase: String, fileContents: String, password: String, emailShare: String) async throws -> AccountState {
        guard !disposed else { throw AccountError.cancelled }
        guard method == "email", emailShare == "synthetic-recovery-key" else { throw AccountError.identity }
        try await vault.write(Data("synthetic".utf8), key: "fixture-remembered")
        return try await initialize()
    }
    func updateProfile(name: String, bio: String) async throws -> AccountState {
        AccountState(phase: "ready", profileName: name, profileId: "fixture", profileBio: bio)
    }
    func dispose() { disposed = true }
}
#endif
