import Foundation
import Observation
import LearnCardNativeCore

@MainActor @Observable
public final class NativeAppStore {
    public enum CredentialActivity: Equatable, Sendable { case refreshing, receiving, loadingMore }
    private let service: any CredentialService
    public var snapshot: CollectionSnapshot?
    public var isBusy = false
    public var error: String?
    /// Dismissing the transient alert does not establish an empty Passport.
    public private(set) var snapshotReadFailed = false
    public private(set) var credentialActivity: CredentialActivity?
    /// Read failures stay beside the cached content instead of interrupting navigation.
    public private(set) var refreshError: String?
    public var notice: String?
    public var openInboxRequested = false
    public let isLive: Bool
    public let consumer: ConsumerAppsStore
    public let families: FamiliesStore
    public let inbox: InboxStore
    public let people: PeopleStore
    public let intake: IntakeStore
    public private(set) var sampleRefreshBusy = false
    public private(set) var sampleRefreshFailed = false
    public var sampleSyncBusy: Bool { intake.samplePreparing || intake.sampleBusy || sampleRefreshBusy }
    /// Shared across navigation; refresh Passport before presenting completion.
    public func syncSample(id: String) async {
        guard !sampleSyncBusy else { return }
        sampleRefreshFailed = false
        sampleRefreshBusy = true
        defer { sampleRefreshBusy = false }
        await intake.syncSample(id: id)
        guard intake.syncingSampleID == id,
              intake.sampleResult != nil || (intake.sampleProgress?.processed ?? 0) > 0 else { return }
        while isBusy {
            do { try await Task.sleep(for: .milliseconds(50)) } catch { return }
            guard intake.syncingSampleID == id else { return }
        }
        guard intake.syncingSampleID == id else { return }
        await refresh()
        sampleRefreshFailed = refreshError != nil
    }
    public var demoClaimService: any ClaimService { DemoClaimService(service: service) }
    /// Matches the tray and Home; credential arrival notices must not count twice.
    public var unreadInboxUpdateCount: Int {
        inbox.updates(excluding: Set((snapshot?.offers ?? []).map(\.id))).filter { !$0.read }.count
    }
    public var inboxCount: Int { (snapshot?.offers.count ?? 0) + unreadInboxUpdateCount }

    public init(service: any CredentialService = DemoCredentialService(), isLive: Bool = false, consumerService: (any ConsumerAppService)? = nil, familyService: (any FamilyService)? = nil, inboxService: (any InboxService)? = nil, peopleService: (any PeopleService)? = nil, intakeService: (any IntakeService)? = nil) {
        self.service = service
        self.isLive = isLive
        let demoConsumer = consumerService as? DemoConsumerAppService ?? DemoConsumerAppService()
        intake = IntakeStore(service: intakeService ?? (isLive ? UnavailableIntakeService() : DemoIntakeService(service: service, consumer: demoConsumer)))
        consumer = ConsumerAppsStore(service: consumerService ?? (isLive ? UnavailableConsumerAppService() : demoConsumer))
        families = FamiliesStore(service: familyService ?? (isLive ? UnavailableFamilyService() : DemoFamilyService()))
        let demoPeople = DemoPeopleService()
        inbox = InboxStore(service: inboxService ?? (isLive ? UnavailableInboxService() : DemoInboxService(people: demoPeople)))
        people = PeopleStore(service: peopleService ?? (isLive ? UnavailablePeopleService() : demoPeople))
        people.didChange = { [weak inbox] person in
            guard let inbox else { return }
            await inbox.load()
            await inbox.markRelationshipRead(profileID: person.id)
        }
        inbox.relationshipsChanged = { [weak people] in people?.invalidate() }
    }

    public func refresh() async {
        guard !isBusy else { return }
        refreshError = nil
        let success = await perform(activity: .refreshing, reportsError: false) { try await self.service.snapshot() }
        if !Task.isCancelled { snapshotReadFailed = !success }
        if success { sampleRefreshFailed = false }
    }

    /// Offers and notifications come from separate reads; an Inbox check needs both.
    public func refreshInbox() async {
        guard !isBusy, !inbox.loading, inbox.busyID == nil else { return }
        await refresh()
        guard !Task.isCancelled else { return }
        await inbox.load()
    }

    public func claim(_ credential: Credential) async -> Bool {
        let success = await perform(activity: .receiving) { try await self.service.claim(offerID: credential.id) }
        if success {
            notice = isLive ? "Credential added to your collection." : "Sample added to your collection."
            await inbox.afterClaim()
        }
        return success
    }

    public func create(title: String, summary: String, kind: CredentialKind) async -> Bool {
        let success = await perform { try await self.service.create(title: title, summary: summary, kind: kind) }
        if success { notice = isLive ? "Credential created and saved to your collection." : "Sample created. Open it to try sending." }
        return success
    }

    public func create(draft: CredentialDraft) async -> Bool {
        let success = await perform { try await self.service.create(draft: draft) }
        if success { notice = draft.recipient == nil ? (isLive ? "Credential created and added to your collection." : "Sample created. Open it to try sending.") : (isLive ? "Credential created and sent." : "Sample send recorded. No message was delivered.") }
        return success
    }

    public func creations(cursor: String? = nil) async throws -> CreationPage { try await service.creations(cursor: cursor) }
    public func credentialStatusStore(id: String) -> CredentialStatusStore { CredentialStatusStore(service: service, credentialID: id) }
    public func searchRecipients(_ query: String) async throws -> [AccountRecipient] {
        if let live = service as? LiveCredentialService { return try await live.searchRecipients(query) }
        return [AccountRecipient(id: "Alex Morgan", name: "Alex Morgan"), AccountRecipient(id: "Jordan Lee", name: "Jordan Lee")]
    }

    public func send(_ credential: Credential, to recipient: String) async -> Bool {
        let success = await perform { try await self.service.send(credentialID: credential.id, recipient: recipient) }
        if success { notice = isLive ? "Credential sent." : "Sample send recorded. No message was delivered." }
        return success
    }

    public func share(credentialIDs: [String], title: String, requestID: String, passcode: String?) async throws -> CredentialShare {
        guard !isBusy else { throw AccountError.unavailable }
        isBusy = true; defer { isBusy = false }
        return try await service.share(credentialIDs: credentialIDs, title: title, requestID: requestID, passcode: passcode)
    }

    @discardableResult public func loadMore() async -> Bool {
        guard !isBusy else { return false }
        let success = await perform(activity: .loadingMore) { try await self.service.loadMore() }
        snapshotReadFailed = !success
        return success
    }

    public func recipient(_ profileId: String) async throws -> AccountRecipient {
        guard let service = service as? LiveCredentialService else { throw AccountError.unavailable }
        return try await service.recipient(profileId)
    }

    private func perform(activity: CredentialActivity? = nil, reportsError: Bool = true,
                         _ operation: () async throws -> CollectionSnapshot) async -> Bool {
        guard !isBusy else { return false }
        isBusy = true
        credentialActivity = activity
        error = nil
        defer { isBusy = false; credentialActivity = nil }
        do {
            snapshot = try await operation()
            snapshotReadFailed = false
            return true
        } catch is CancellationError {
            return false
        } catch {
            let message = (error as? ClientError)?.errorDescription ?? (error as? AccountError)?.errorDescription
                ?? "Something went wrong. Please try again."
            if reportsError { self.error = message }
            if activity == .refreshing { refreshError = message }
        }
        return false
    }
}
