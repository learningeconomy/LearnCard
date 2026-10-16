import Foundation
import Observation
import LearnCardNativeCore

@MainActor @Observable
public final class NativeAppStore {
    private let service: any CredentialService
    public var snapshot: CollectionSnapshot?
    public var isBusy = false
    public var error: String?
    /// Dismissing the transient alert does not establish an empty Passport.
    public private(set) var snapshotReadFailed = false
    public var notice: String?
    public var openInboxRequested = false
    public let isLive: Bool
    public let consumer: ConsumerAppsStore
    public let families: FamiliesStore
    public let inbox: InboxStore
    public let people: PeopleStore
    public var demoClaimService: any ClaimService { DemoClaimService(service: service) }
    /// Matches the tray and Home; credential arrival notices must not count twice.
    public var unreadInboxUpdateCount: Int {
        inbox.updates(excluding: Set((snapshot?.offers ?? []).map(\.id))).filter { !$0.read }.count
    }
    public var inboxCount: Int { (snapshot?.offers.count ?? 0) + unreadInboxUpdateCount }

    public init(service: any CredentialService = DemoCredentialService(), isLive: Bool = false, consumerService: (any ConsumerAppService)? = nil, familyService: (any FamilyService)? = nil, inboxService: (any InboxService)? = nil, peopleService: (any PeopleService)? = nil) {
        self.service = service
        self.isLive = isLive
        consumer = ConsumerAppsStore(service: consumerService ?? (isLive ? UnavailableConsumerAppService() : DemoConsumerAppService()))
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
        let success = await perform { try await self.service.snapshot() }
        snapshotReadFailed = !success
    }

    public func claim(_ credential: Credential) async -> Bool {
        let success = await perform { try await self.service.claim(offerID: credential.id) }
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
        let success = await perform { try await self.service.loadMore() }
        snapshotReadFailed = !success
        return success
    }

    public func recipient(_ profileId: String) async throws -> AccountRecipient {
        guard let service = service as? LiveCredentialService else { throw AccountError.unavailable }
        return try await service.recipient(profileId)
    }

    private func perform(_ operation: () async throws -> CollectionSnapshot) async -> Bool {
        guard !isBusy else { return false }
        isBusy = true
        error = nil
        defer { isBusy = false }
        do {
            snapshot = try await operation()
            snapshotReadFailed = false
            return true
        } catch is CancellationError {
            return false
        } catch let clientError as ClientError {
            error = clientError.errorDescription
        } catch let accountError as AccountError {
            error = accountError.errorDescription
        } catch {
            self.error = "Something went wrong. Please try again."
        }
        return false
    }
}
