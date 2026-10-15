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
        return AccountController(session: session, makeHost: { _ in FixtureHost(vault: vault, failSaveOnce: arguments.contains("--profile-save-failure")) },
                                 forgetAccount: { _ in try await vault.remove("fixture-remembered") },
                                 claims: NativeClaimStore(journal: KeychainClaimJournal(vault: vault)), uploadProfilePhoto: { data in
                                     let url = FileManager.default.temporaryDirectory.appendingPathComponent("synthetic-profile-photo.jpg")
                                     try data.write(to: url); return url
                                 })
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
            for key in ["profile-name", "profile-bio", "profile-image"] { try await vault.remove(key) }
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
    var claimService: (any ClaimService)? { FixtureClaimService(service: credentialService) }
    let consumerService: any ConsumerAppService = DemoConsumerAppService()
    let familyService: any FamilyService = DemoFamilyService()
    private var disposed = false
    private var failSaveOnce: Bool
    init(vault: KeychainVault, failSaveOnce: Bool) { self.vault = vault; self.failSaveOnce = failSaveOnce }
    func initialize() async throws -> AccountState {
        guard !disposed else { throw AccountError.cancelled }
        guard try await vault.read("fixture-remembered") != nil else { return AccountState(phase: "needs_recovery", methods: ["email"]) }
        let name = try await vault.read("profile-name").flatMap { String(data: $0, encoding: .utf8) } ?? "Fixture Person"
        let bio = try await vault.read("profile-bio").flatMap { String(data: $0, encoding: .utf8) }
        let image = try await vault.read("profile-image").flatMap { String(data: $0, encoding: .utf8) }.flatMap(URL.init(string:))
        return AccountState(phase: "ready", profileName: name, profileId: "fixture", profileImage: image, profileBio: bio)
    }
    func recover(method: String, phrase: String, fileContents: String, password: String, emailShare: String) async throws -> AccountState {
        guard !disposed else { throw AccountError.cancelled }
        guard method == "email", emailShare == "synthetic-recovery-key" else { throw AccountError.identity }
        try await vault.write(Data("synthetic".utf8), key: "fixture-remembered")
        return try await initialize()
    }
    func updateProfile(name: String, bio: String, image: ProfileImageUpdate) async throws -> AccountState {
        guard !disposed else { throw AccountError.cancelled }
        if failSaveOnce { failSaveOnce = false; throw AccountError.connection }
        try await vault.write(Data(name.utf8), key: "profile-name")
        try await vault.write(Data(bio.utf8), key: "profile-bio")
        switch image {
        case .unchanged: break
        case .remove: try await vault.remove("profile-image")
        case .replace(let url): try await vault.write(Data(url.absoluteString.utf8), key: "profile-image")
        }
        return try await initialize()
    }
    func dispose() { disposed = true }
}
private actor FixtureClaimService: ClaimService {
    let demo: DemoClaimService
    init(service: any CredentialService) { demo = DemoClaimService(service: service) }
    func preview(_ link: NativeClaimLink) async throws -> Credential { try await demo.preview(NativeClaimLink("learncard-native-demo://claim/first-aid", allowDemo: true)) }
    func issue(_ link: NativeClaimLink) async throws -> ClaimReceipt { try await demo.issue(NativeClaimLink("learncard-native-demo://claim/first-aid", allowDemo: true)) }
    func finish(_ receipt: ClaimReceipt) async throws -> Credential { try await demo.finish(receipt) }
}
#endif
