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
        let hostScenario = scenario == "oauth-signup" ? "signup" : scenario == "oauth-approval" ? "pending-approval" : scenario
        let account = AccountController(session: session, signInClient: scenario.hasPrefix("oauth-") ? FixtureSignInClient(scenario: scenario) : nil,
                                 makeHost: { _ in FixtureHost(vault: vault, scenario: hostScenario, approveOnCheck: arguments.contains("--fixture-approve-after-check"), failSaveOnce: arguments.contains("--profile-save-failure")) },
                                 forgetAccount: { _ in try await vault.remove("fixture-remembered") },
                                 claims: NativeClaimStore(journal: KeychainClaimJournal(vault: vault)), uploadProfilePhoto: { data in
                                     let url = FileManager.default.temporaryDirectory.appendingPathComponent("synthetic-profile-photo.jpg")
                                     try data.write(to: url); return url
                                 })
        if scenario == "oauth-cancel" { account.email = "" }
        return account
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
            for key in ["profile-name", "profile-bio", "profile-image", "signup-draft", "signup-prepared", "signup-backup", "signup-confirmed", "signup-parent-sent", "signup-approved", "reset-pending", "reset-failed", "reset-done"] { try await vault.remove(key) }
            if scenario != "sign-in" && !scenario.hasPrefix("oauth-") { try await vault.write(Data("synthetic".utf8), key: "fixture-auth") }
            if scenario == "ready" || scenario.hasPrefix("reset-") { try await vault.write(Data("synthetic".utf8), key: "fixture-remembered") }
            if scenario == "reset-pending" { try await vault.write(Data("synthetic".utf8), key: "reset-pending") }
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
    func signIn(credential: NativeSignInCredential) async throws -> FirebaseUser {
        try await vault.write(Data("synthetic".utf8), key: "fixture-auth")
        if scenario == "oauth-ready" { try await vault.write(Data("synthetic".utf8), key: "fixture-remembered") }
        return user
    }
}

/// No provider requests or system account access in automated UI fixtures.
@MainActor private final class FixtureSignInClient: NativeSignInClient {
    let providers: [NativeSignInProvider] = [.apple, .google]
    let scenario: String
    private var pending: CheckedContinuation<NativeSignInCredential, any Error>?
    init(scenario: String) { self.scenario = scenario }
    func signIn(_ provider: NativeSignInProvider) async throws -> NativeSignInCredential {
        if scenario == "oauth-cancel" { throw NativeSignInError.cancelled }
        if scenario == "oauth-failure" { throw NativeSignInError.differentMethod }
        if scenario == "oauth-delayed" { return try await withCheckedThrowingContinuation { pending = $0 } }
        return NativeSignInCredential(provider: provider, idToken: "synthetic-not-a-provider-token", rawNonce: "synthetic-not-a-real-nonce")
    }
    func cancel() { pending?.resume(throwing: NativeSignInError.cancelled); pending = nil }
}

@MainActor private final class FixtureHost: AccountHost {
    let vault: KeychainVault
    let credentialService: any CredentialService = DemoCredentialService()
    var claimService: (any ClaimService)? { FixtureClaimService(service: credentialService) }
    let consumerService: any ConsumerAppService = DemoConsumerAppService()
    let familyService: any FamilyService = DemoFamilyService()
    private var disposed = false
    private var failSaveOnce: Bool
    private let scenario: String
    private let approveOnCheck: Bool
    private var pendingBackupID: String?
    init(vault: KeychainVault, scenario: String, approveOnCheck: Bool, failSaveOnce: Bool) {
        self.vault = vault; self.scenario = scenario; self.approveOnCheck = approveOnCheck; self.failSaveOnce = failSaveOnce
    }
    private func signupState() async throws -> AccountState? {
        let resetDone = try await vault.read("reset-done") != nil
        guard scenario.hasPrefix("signup") || scenario == "pending-approval" || resetDone else { return nil }
        var draft: SignupDraft?
        if let data = try await vault.read("signup-draft") { draft = try JSONDecoder().decode(SignupDraft.self, from: data) }
        if draft == nil && ["signup-resume", "signup-confirmed", "pending-approval"].contains(scenario) {
            var value = SignupDraft(); value.dob = scenario == "pending-approval" ? "\(Calendar.current.component(.year, from: Date()) - 14)-01-01" : "1995-01-01"
            value.country = scenario == "pending-approval" ? "IE" : "US"; value.guardianEmail = "parent@example.invalid"
            value.name = "New Learner"; value.profileId = "new-learner"; value.termsAccepted = true; draft = value
        }
        let confirmed = try await vault.read("signup-confirmed") != nil || scenario == "signup-confirmed" || scenario == "pending-approval"
        let approved = try await vault.read("signup-approved") != nil
        let sent = try await vault.read("signup-parent-sent") != nil
        let attempted = try await vault.read("signup-backup") != nil
        let progress = SignupProgress(draft: draft, backupNeedsReplacement: !confirmed && (attempted || scenario == "signup-resume"), recoveryConfirmed: confirmed, guardianSent: sent)
        if approved { return AccountState(phase: "ready", profileName: draft?.name ?? "New Learner", profileId: draft?.profileId ?? "new-learner") }
        if scenario == "pending-approval" || (confirmed && draft?.country == "IE") { return AccountState(phase: "pending_approval", signup: progress) }
        if confirmed || draft != nil { return AccountState(phase: "finish_setup", signup: progress) }
        let prepared = try await vault.read("signup-prepared") != nil
        return AccountState(phase: prepared ? "missing_profile" : "needs_setup")
    }
    func prepareSignup(_ draft: SignupDraft) async throws -> AccountState {
        guard !disposed else { throw AccountError.cancelled }
        try await vault.write(Data("synthetic".utf8), key: "signup-prepared"); return try await initialize()
    }
    func signupAvailability(_ profileId: String) async throws -> Bool { profileId != "taken" }
    func prepareSignupBackup(_ draft: SignupDraft, password: String) async throws -> SignupBackup {
        guard !disposed else { throw AccountError.cancelled }
        try await vault.write(JSONEncoder().encode(draft), key: "signup-draft")
        try await vault.write(Data("synthetic".utf8), key: "signup-backup")
        let id = UUID().uuidString; pendingBackupID = id
        // Public synthetic artifact; never a real key, encryption test or network signup.
        return SignupBackup(id: id, contents: "{\"fixture\":true,\"encryptedShare\":{\"ciphertext\":\"synthetic-not-a-key\"}}")
    }
    func confirmSignupBackup(id: String, password: String) async throws -> AccountState {
        guard !disposed, pendingBackupID == id else { throw SignupError.recovery }
        try await vault.write(Data("synthetic".utf8), key: "signup-confirmed")
        if let data = try await vault.read("signup-draft"), try JSONDecoder().decode(SignupDraft.self, from: data).country != "IE" { try await vault.write(Data("synthetic".utf8), key: "signup-approved") }
        return try await initialize()
    }
    func completeSignup(_ draft: SignupDraft) async throws -> AccountState {
        let confirmed = try await vault.read("signup-confirmed") != nil
        guard !disposed, scenario == "signup-confirmed" || confirmed else { throw SignupError.recovery }
        try await vault.write(Data("synthetic".utf8), key: "signup-approved"); return try await initialize()
    }
    func refreshSignup() async throws -> AccountState {
        guard !disposed else { throw AccountError.cancelled }
        if approveOnCheck { try await vault.write(Data("synthetic".utf8), key: "signup-approved") }; return try await initialize()
    }
    func sendSignupApproval(email: String) async throws -> AccountState {
        guard !disposed else { throw AccountError.cancelled }
        try await vault.write(Data("synthetic".utf8), key: "signup-parent-sent"); return try await initialize()
    }
    func initialize() async throws -> AccountState {
        guard !disposed else { throw AccountError.cancelled }
        if try await vault.read("reset-pending") != nil { return AccountState(phase: "reset_pending", reset: StagingResetProgress(stage: "profile", profileId: "fixture")) }
        if let state = try await signupState() { return state }
        guard try await vault.read("fixture-remembered") != nil else { return AccountState(phase: "needs_recovery", methods: ["email"]) }
        let name = try await vault.read("profile-name").flatMap { String(data: $0, encoding: .utf8) } ?? "Fixture Person"
        let bio = try await vault.read("profile-bio").flatMap { String(data: $0, encoding: .utf8) }
        let image = try await vault.read("profile-image").flatMap { String(data: $0, encoding: .utf8) }.flatMap(URL.init(string:))
        return AccountState(phase: "ready", profileName: name, profileId: "fixture", profileImage: image, profileBio: bio)
    }
    func resetStagingAccount(email: String) async throws -> AccountState {
        guard email == "native-test@example.invalid" else { throw StagingResetError.confirmation }
        return try await resumeStagingReset()
    }
    func resumeStagingReset() async throws -> AccountState {
        guard !disposed else { throw AccountError.cancelled }
        try await vault.write(Data("synthetic".utf8), key: "reset-pending")
        if scenario == "reset-interrupted", try await vault.read("reset-failed") == nil {
            try await vault.write(Data("synthetic".utf8), key: "reset-failed"); throw StagingResetError.connection
        }
        try await vault.write(Data("synthetic".utf8), key: "reset-done")
        try await vault.remove("reset-pending"); return AccountState(phase: "reset_complete")
    }
    func stagingResetStatus() async throws -> AccountState { try await initialize() }
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
