#if DEBUG
import Foundation
import LearnCardNativeCore
import LearnCardNativeSDK

/// Deterministic read-only delays and a retryable failure, confined to --demo.
actor CredentialActivityFixture: CredentialService {
    private let demo = DemoCredentialService()
    private var reads = 0
    private let failOnce: Bool
    init(failOnce: Bool) { self.failOnce = failOnce }
    func snapshot() async throws -> CollectionSnapshot {
        reads += 1
        let attempt = reads
        if attempt > 1 { try await Task.sleep(for: .seconds(6)) }
        if failOnce && attempt == 2 { throw AccountError.connection }
        return await demo.snapshot()
    }
    func claim(offerID: String) async throws -> CollectionSnapshot { try await demo.claim(offerID: offerID) }
    func create(title: String, summary: String, kind: CredentialKind) async throws -> CollectionSnapshot { try await demo.create(title: title, summary: summary, kind: kind) }
    func create(draft: CredentialDraft) async throws -> CollectionSnapshot { try await demo.create(draft: draft) }
    func creations(cursor: String?) async throws -> CreationPage { await demo.creations(cursor: cursor) }
    func send(credentialID: String, recipient: String) async throws -> CollectionSnapshot { try await demo.send(credentialID: credentialID, recipient: recipient) }
    func share(credentialIDs: [String], title: String, requestID: String, passcode: String?) async throws -> CredentialShare {
        try await demo.share(credentialIDs: credentialIDs, title: title, requestID: requestID, passcode: passcode)
    }
}
#endif
