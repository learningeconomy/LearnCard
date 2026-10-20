import Foundation
import Observation
import LearnCardNativeCore

/// Authentication boundary. Test implementations never contact Firebase or send email.
public protocol AccountSession: Sendable {
    var testEmail: String { get }
    func resume() async throws -> FirebaseUser?
    func sendCode(email: String) async throws
    func verify(code: String) async throws -> FirebaseUser
    func signIn(credential: NativeSignInCredential) async throws -> FirebaseUser
    func signOut() async throws
}

extension FirebaseSession: AccountSession {}
public extension AccountSession {
    func signIn(credential: NativeSignInCredential) async throws -> FirebaseUser { throw NativeSignInError.unavailable }
}

/// Replace only the account backend in tests, retaining the production controller and views.
@MainActor public protocol AccountHost: AnyObject {
    var credentialService: any CredentialService { get }
    var consumerService: any ConsumerAppService { get }
    var familyService: any FamilyService { get }
    var inboxService: any InboxService { get }
    var peopleService: any PeopleService { get }
    var intakeService: any IntakeService { get }
    var learnerService: any LearnerService { get }
    var careerService: any CareerService { get }
    var claimService: (any ClaimService)? { get }
    func initialize() async throws -> AccountState
    func recover(method: String, phrase: String, fileContents: String, password: String, emailShare: String) async throws -> AccountState
    func updateProfile(name: String, bio: String, image: ProfileImageUpdate) async throws -> AccountState
    func resetStagingAccount(email: String) async throws -> AccountState
    func resumeStagingReset() async throws -> AccountState
    func stagingResetStatus() async throws -> AccountState
    func prepareSignup(_ draft: SignupDraft) async throws -> AccountState
    func signupAvailability(_ profileId: String) async throws -> Bool
    func prepareSignupBackup(_ draft: SignupDraft, password: String) async throws -> SignupBackup
    func confirmSignupBackup(id: String, password: String) async throws -> AccountState
    func completeSignup(_ draft: SignupDraft) async throws -> AccountState
    func refreshSignup() async throws -> AccountState
    func sendSignupApproval(email: String) async throws -> AccountState
    func dispose()
}

extension AccountRuntime: AccountHost {
    public var credentialService: any CredentialService { LiveCredentialService(runtime: self) }
    public var consumerService: any ConsumerAppService { LiveConsumerAppService(runtime: self) }
    public var familyService: any FamilyService { LiveFamilyService(runtime: self) }
    public var inboxService: any InboxService { LiveInboxService(runtime: self) }
    public var peopleService: any PeopleService { LivePeopleService(runtime: self) }
    public var intakeService: any IntakeService { LiveIntakeService(runtime: self) }
    public var learnerService: any LearnerService { LiveLearnerService(runtime: self) }
    public var careerService: any CareerService { LiveCareerService(runtime: self) }
    public var claimService: (any ClaimService)? { LiveClaimService(runtime: self) }
}

public extension AccountHost { var consumerService: any ConsumerAppService { UnavailableConsumerAppService() } }
public extension AccountHost { var familyService: any FamilyService { UnavailableFamilyService() } }
public extension AccountHost { var inboxService: any InboxService { UnavailableInboxService() } }
public extension AccountHost { var peopleService: any PeopleService { UnavailablePeopleService() } }
public extension AccountHost { var intakeService: any IntakeService { UnavailableIntakeService() } }
public extension AccountHost { var learnerService: any LearnerService { UnavailableLearnerService() } }
public extension AccountHost { var careerService: any CareerService { UnavailableCareerService() } }
public extension AccountHost { var claimService: (any ClaimService)? { nil } }

public extension AccountHost {
    func resetStagingAccount(email: String) async throws -> AccountState { throw StagingResetError.unavailable }
    func resumeStagingReset() async throws -> AccountState { throw StagingResetError.unavailable }
    func stagingResetStatus() async throws -> AccountState { throw StagingResetError.unavailable }
}

public extension AccountHost {
    func prepareSignup(_ draft: SignupDraft) async throws -> AccountState { throw AccountError.unavailable }
    func signupAvailability(_ profileId: String) async throws -> Bool { throw AccountError.unavailable }
    func prepareSignupBackup(_ draft: SignupDraft, password: String) async throws -> SignupBackup { throw AccountError.unavailable }
    func confirmSignupBackup(id: String, password: String) async throws -> AccountState { throw AccountError.unavailable }
    func completeSignup(_ draft: SignupDraft) async throws -> AccountState { throw AccountError.unavailable }
    func refreshSignup() async throws -> AccountState { try await initialize() }
    func sendSignupApproval(email: String) async throws -> AccountState { throw AccountError.unavailable }
}

public enum AccountActivity: Sendable { case active, inactive, background }

@MainActor @Observable
public final class NativeAccountController {
    public let claims: NativeClaimStore
    public let activation: LearnerActivationStore
    private let session: (any AccountSession)?
    private let signInClient: (any NativeSignInClient)?
    private var providerExchange: Task<FirebaseUser, any Error>?
    private let makeHost: @MainActor (FirebaseUser) throws -> any AccountHost
    private let forgetAccount: @MainActor (String) async throws -> Void
    private let uploadProfilePhoto: @Sendable (Data) async throws -> URL
    private var uploadedPhoto: (jpeg: Data, url: URL)?
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
    public private(set) var signInProvider: NativeSignInProvider?
    public var signInProviders: [NativeSignInProvider] { session == nil ? [] : signInClient?.providers ?? [] }
    public private(set) var uploadingPhoto = false
    public private(set) var signupBackup: SignupBackup?
    public var error: String?
    public var recipientName: String?

    public convenience init(signInClient: (any NativeSignInClient)? = nil) {
        let vault = KeychainVault()
        let firebase = try? FirebaseSession(vault: vault)
        self.init(session: firebase, signInClient: signInClient, makeHost: { user in
            guard let firebase else { throw AccountError.unavailable }
            return AccountRuntime(user: user, vault: vault, firebase: firebase)
        }, forgetAccount: { id in try await vault.forgetAccount(userID: id) },
                  activation: LearnerActivationStore(storage: PreferenceLearnerActivationStorage()))
        if firebase == nil { error = "Couldn't open sign-in. Please try again." }
    }

    public init(session: (any AccountSession)?,
                signInClient: (any NativeSignInClient)? = nil,
                makeHost: @escaping @MainActor (FirebaseUser) throws -> any AccountHost,
                forgetAccount: @escaping @MainActor (String) async throws -> Void,
                claims: NativeClaimStore? = nil,
                activation: LearnerActivationStore = LearnerActivationStore(),
                uploadProfilePhoto: @escaping @Sendable (Data) async throws -> URL = { try await ArtworkUploader.upload(jpeg: $0, filename: "profile-photo.jpg") }) {
        self.claims = claims ?? NativeClaimStore()
        self.activation = activation
        self.session = session; self.makeHost = makeHost; self.forgetAccount = forgetAccount
        self.signInClient = signInClient
        self.uploadProfilePhoto = uploadProfilePhoto
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

    public func signIn(with provider: NativeSignInProvider) async {
        guard ["signIn", "idle"].contains(phase), user == nil, signInProviders.contains(provider) else { return }
        await perform {
            let expected = self.generation
            guard let client = self.signInClient, let session = self.session else { throw NativeSignInError.unavailable }
            self.signInProvider = provider; self.phase = "provider"
            defer { if self.generation == expected { self.signInProvider = nil } }
            do {
                let credential = try await client.signIn(provider)
                try self.check(expected)
                guard credential.provider == provider else { throw NativeSignInError.identity }
                let exchange = Task { try await session.signIn(credential: credential) }
                self.providerExchange = exchange
                defer { if self.generation == expected { self.providerExchange = nil } }
                let user = try await exchange.value
                try self.check(expected)
                self.signedOut = false
                try await self.connect(user, generation: expected)
            } catch {
                try self.check(expected)
                // Firebase may already have succeeded. Retry the saved account
                // connection rather than offering a second provider sign-in.
                if self.user != nil { self.phase = "locked"; throw error }
                self.phase = "signIn"
                if case NativeSignInError.cancelled = error { return }
                throw error
            }
        }
    }

    private func connect(_ user: FirebaseUser, generation expected: Int) async throws {
        self.user = user; accountID = user.id; email = user.email
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
        let expected = generation
        self.state = state; phase = state.phase
        if state.error != nil { throw AccountError.recovery }
        if state.phase != "ready" {
            if let user { activation.observe(accountID: user.id, phase: state.phase) }
            store?.consumer.lock(); store?.families.lock(); store?.inbox.lock(); store?.people.lock(); store?.intake.lock(); store?.learner.lock(); store?.careers.lock(); store = nil; claims.lock()
        }
        if state.phase == "ready", let runtime {
            let store = NativeAppStore(service: runtime.credentialService, isLive: true, consumerService: runtime.consumerService, familyService: runtime.familyService, inboxService: runtime.inboxService, peopleService: runtime.peopleService, intakeService: runtime.intakeService, learnerService: runtime.learnerService, careerService: runtime.careerService)
            self.store = store
            await store.refresh()
            try check(expected)
            if let user {
                // Connect first: an intent bound to another account must be cleared
                // before deciding whether this learner should skip their welcome.
                claims.connect(service: runtime.claimService, accountID: user.id)
                activation.observe(accountID: user.id, phase: state.phase, hasPendingClaim: claims.link != nil)
            }
        }
    }

    public func resetStagingAccount(confirmation: String) async {
        guard let user, FirebaseSession.normalizedEmail(confirmation) == FirebaseSession.normalizedEmail(user.email) else { error = StagingResetError.confirmation.errorDescription; return }
        await runStagingReset(resume: false)
    }
    public func resumeStagingReset() async {
        if state?.reset != nil { await runStagingReset(resume: true) }
        else { await resume() }
    }
    public func openResetRecovery() {
        guard phase == "reset_pending", state?.methods.isEmpty == false, !busy else { return }
        phase = "needs_recovery"
    }
    private func runStagingReset(resume: Bool) async {
        await perform {
            let expected = self.generation
            guard let runtime = self.runtime, let user = self.user else { throw StagingResetError.unavailable }
            self.claims.clear()
            self.store?.consumer.lock(); self.store?.families.lock(); self.store?.inbox.lock(); self.store?.people.lock(); self.store?.intake.lock(); self.store?.learner.lock(); self.store?.careers.lock(); self.store = nil
            self.signupBackup = nil; self.uploadedPhoto = nil; self.phase = "resetting"
            var completed = false
            do {
                let result = try await (resume ? runtime.resumeStagingReset() : runtime.resetStagingAccount(email: user.email))
                try self.check(expected)
                guard result.phase == "reset_complete" else { throw StagingResetError.changed }
                completed = true
                // The old SDK host still holds the deleted identity. Dispose it before opening setup.
                runtime.dispose(); self.runtime = nil; self.state = nil
                try await self.connect(user, generation: expected)
            } catch {
                try self.check(expected)
                if completed {
                    // Cleanup already succeeded. Retry connecting with the fresh-setup marker,
                    // never send another reset through the disposed identity.
                    self.runtime?.dispose(); self.runtime = nil; self.state = nil; self.phase = "locked"
                } else if let status = try? await runtime.stagingResetStatus() {
                    try self.check(expected); try await self.apply(status)
                } else {
                    // A timed-out/disposed host cannot resume commands. Reconnect first;
                    // the protected receipt will reopen reset review without auto-deleting.
                    self.runtime?.dispose(); self.runtime = nil; self.state = nil; self.phase = "locked"
                }
                throw error
            }
        }
    }

    public func prepareSignup(_ draft: SignupDraft) async -> Bool {
        var success = false
        await perform {
            let expected = self.generation
            guard let runtime = self.runtime else { throw AccountError.unavailable }
            let policy = try SignupPolicy.load().eligibility(dob: draft.dob, country: draft.country)
            guard !policy.underage else { throw SignupError.underage }
            let state = try await runtime.prepareSignup(draft); try self.check(expected); try await self.apply(state); success = true
        }; return success
    }
    public func signupAvailability(_ id: String) async throws -> Bool {
        let expected = generation
        guard !busy, let runtime else { throw AccountError.unavailable }
        let value = try await runtime.signupAvailability(id); try check(expected); return value
    }
    public func prepareSignupBackup(_ draft: SignupDraft, password: String, photo: Data?) async -> Bool {
        var success = false
        await perform {
            let expected = self.generation
            guard let runtime = self.runtime else { throw AccountError.unavailable }
            try SignupPolicy.load().validate(draft)
            guard password.count >= 12, password.count <= 256 else { throw SignupError.invalid }
            var value = draft
            if let photo {
                guard !photo.isEmpty, photo.count <= 1_000_000 else { throw AccountError.unavailable }
                if self.uploadedPhoto?.jpeg != photo {
                    self.uploadingPhoto = true
                    defer { if self.generation == expected { self.uploadingPhoto = false } }
                    let url = try await self.uploadProfilePhoto(photo); try self.check(expected); self.uploadedPhoto = (photo, url)
                }
                value.image = self.uploadedPhoto?.url.absoluteString
            }
            let backup = try await runtime.prepareSignupBackup(value, password: password); try self.check(expected)
            self.signupBackup = backup; success = true
        }; return success
    }
    public func confirmSignupBackup(password: String) async {
        await perform {
            let expected = self.generation
            guard let runtime = self.runtime, let backup = self.signupBackup else { throw AccountError.unavailable }
            do {
                let state = try await runtime.confirmSignupBackup(id: backup.id, password: password); try self.check(expected)
                self.signupBackup = nil; self.uploadedPhoto = nil; try await self.apply(state)
            } catch {
                // Confirmation may have succeeded before a username race or profile reply failed.
                // Unlock profile editing without rotating an already-confirmed recovery backup.
                if let resumed = try? await runtime.refreshSignup(), resumed.phase == "finish_setup", resumed.signup?.recoveryConfirmed == true {
                    try self.check(expected); self.signupBackup = nil; try await self.apply(resumed)
                }
                throw error
            }
        }
    }
    public func completeSignup(_ draft: SignupDraft, photo: Data? = nil) async {
        await perform {
            let expected = self.generation
            guard let runtime = self.runtime else { throw AccountError.unavailable }
            var value = draft
            value.image = value.image ?? self.uploadedPhoto?.url.absoluteString ?? self.state?.signup?.draft?.image
            if let photo {
                guard !photo.isEmpty, photo.count <= 1_000_000 else { throw AccountError.unavailable }
                if self.uploadedPhoto?.jpeg != photo {
                    self.uploadingPhoto = true
                    defer { if self.generation == expected { self.uploadingPhoto = false } }
                    let url = try await self.uploadProfilePhoto(photo); try self.check(expected); self.uploadedPhoto = (photo, url)
                }
                value.image = self.uploadedPhoto?.url.absoluteString
            }
            let state = try await runtime.completeSignup(value); try self.check(expected)
            self.uploadedPhoto = nil; try await self.apply(state)
        }
    }
    public func refreshSignup() async {
        await perform {
            let expected = self.generation
            guard let runtime = self.runtime else { throw AccountError.unavailable }
            let state = try await runtime.refreshSignup(); try self.check(expected); try await self.apply(state)
        }
    }
    public func sendSignupApproval(email: String) async {
        await perform {
            let expected = self.generation
            guard let runtime = self.runtime else { throw AccountError.unavailable }
            let state = try await runtime.sendSignupApproval(email: email); try self.check(expected); try await self.apply(state)
        }
    }

    public func updateProfile(name: String, bio: String, photo: ProfilePhotoEdit = .unchanged) async -> Bool {
        var saved = false
        await perform {
            let expected = self.generation
            guard self.phase == "ready", let runtime = self.runtime else { throw AccountError.unavailable }
            let image: ProfileImageUpdate
            switch photo {
            case .unchanged: self.uploadedPhoto = nil; image = .unchanged
            case .remove: self.uploadedPhoto = nil; image = .remove
            case .jpeg(let jpeg):
                guard !jpeg.isEmpty, jpeg.count <= 1_000_000 else { throw AccountError.unavailable }
                if self.uploadedPhoto?.jpeg != jpeg {
                    self.uploadingPhoto = true
                    defer { if self.generation == expected { self.uploadingPhoto = false } }
                    let url = try await self.uploadProfilePhoto(jpeg)
                    try self.check(expected)
                    self.uploadedPhoto = (jpeg, url)
                }
                guard let uploaded = self.uploadedPhoto else { throw AccountError.unavailable }
                image = .replace(uploaded.url)
            }
            try self.check(expected)
            let updated = try await runtime.updateProfile(name: name, bio: bio, image: image)
            try self.check(expected)
            self.state = updated; self.uploadedPhoto = nil; saved = true
        }
        return saved
    }

    /// Sign-out takes priority over connecting/recovery. Dispose before awaiting cleanup so
    /// an earlier reply cannot reopen the account or keep the SDK's keys in memory.
    public func signOut(forget: Bool) async {
        guard !endingSession else { return }
        endingSession = true; signedOut = true
        claims.clear()
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
        signInClient?.cancel(); signInProvider = nil
        providerExchange?.cancel(); providerExchange = nil
        claims.lock()
        runtime?.dispose(); runtime = nil
        activation.lock()
        store?.consumer.lock()
        store?.families.lock()
        store?.inbox.lock(); store?.people.lock()
        store?.intake.lock(); store?.learner.lock(); store?.careers.lock()
        store = nil; state = nil; user = nil; recipientName = nil
        uploadedPhoto = nil; uploadingPhoto = false; signupBackup = nil
        busy = false; phase = "locked"; error = nil
    }

    private func check(_ expected: Int) throws {
        guard generation == expected, !endingSession else { throw AccountError.cancelled }
    }
    private func friendly(_ error: any Error) -> String {
        (error as? NativeSignInError)?.errorDescription ?? (error as? StagingResetError)?.errorDescription ?? (error as? SignupError)?.errorDescription ?? (error as? AccountError)?.errorDescription ?? "Something went wrong. Please try again."
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
