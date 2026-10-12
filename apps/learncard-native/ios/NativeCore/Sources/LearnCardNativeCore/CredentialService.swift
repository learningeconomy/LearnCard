import Foundation

/// Native UI boundary shared by demo and live staging services.
public protocol CredentialService: Sendable {
    func snapshot() async throws -> CollectionSnapshot
    func claim(offerID: String) async throws -> CollectionSnapshot
    func create(title: String, summary: String, kind: CredentialKind) async throws -> CollectionSnapshot
    func create(draft: CredentialDraft) async throws -> CollectionSnapshot
    func creations(cursor: String?) async throws -> CreationPage
    func send(credentialID: String, recipient: String) async throws -> CollectionSnapshot
    func share(credentialIDs: [String], title: String, requestID: String, passcode: String?) async throws -> CredentialShare
    func loadMore() async throws -> CollectionSnapshot
}

public extension CredentialService {
    func loadMore() async throws -> CollectionSnapshot { try await snapshot() } }

/// In-memory, unsigned samples. Restarting the app resets the experiment.
public actor DemoCredentialService: CredentialService {
    private var credentials: [Credential]
    private var offers: [Credential]
    private var activity: [Activity] = []
    private var templates: [Credential] = []

    public init() {
        let date = Date(timeIntervalSince1970: 1_791_763_200)
        credentials = [
            Credential(id: "design", title: "Design for people", issuer: "Open Learning Studio",
                       summary: "Exploring thoughtful design through research, prototyping, and real conversations.",
                       kind: .learning, date: date),
            Credential(id: "community", title: "Community builder", issuer: "Neighborhood Collective",
                       summary: "Recognizing the time and care you put into bringing people together.",
                       kind: .achievement, date: date),
            Credential(id: "member", title: "A place to belong", issuer: "Learning Circle",
                       summary: "A member of a community that learns and grows together.",
                       kind: .membership, date: date),
        ]
        offers = [
            Credential(id: "first-aid", title: "Ready to help", issuer: "Community Skills Lab",
                       summary: "Completed a hands-on introduction to first aid and everyday emergency preparedness.",
                       kind: .learning, date: date),
            Credential(id: "mentor", title: "Made a difference", issuer: "Learning Circle",
                       summary: "Thank you for helping someone find their next step.",
                       kind: .achievement, date: date),
        ]
    }

    public func snapshot() -> CollectionSnapshot {
        CollectionSnapshot(credentials: credentials, offers: offers, activity: activity)
    }

    public func claim(offerID: String) throws -> CollectionSnapshot {
        guard let index = offers.firstIndex(where: { $0.id == offerID }) else {
            throw ClientError.offerUnavailable
        }
        let credential = offers.remove(at: index)
        credentials.insert(credential, at: 0)
        activity.insert(Activity(title: "Added to your collection", detail: credential.title,
                                 symbol: "tray.and.arrow.down"), at: 0)
        return snapshot()
    }

    public func create(title: String, summary: String, kind: CredentialKind) throws -> CollectionSnapshot {
        let cleanTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        let cleanSummary = summary.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanTitle.isEmpty, !cleanSummary.isEmpty, cleanTitle.count <= 100,
              cleanSummary.count <= 1_000 else { throw ClientError.invalidDraft }
        credentials.insert(Credential(id: UUID().uuidString, title: cleanTitle, issuer: "You",
                                      summary: cleanSummary, kind: kind, date: .now, createdByMe: true), at: 0)
        activity.insert(Activity(title: "Created a sample", detail: cleanTitle, symbol: "sparkles"), at: 0)
        return snapshot()
    }

    public func create(draft: CredentialDraft) throws -> CollectionSnapshot {
        let cleanTitle = draft.title.trimmingCharacters(in: .whitespacesAndNewlines)
        let cleanSummary = draft.summary.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanTitle.isEmpty, !cleanSummary.isEmpty, cleanTitle.count <= 100, cleanSummary.count <= 1_000 else { throw ClientError.invalidDraft }
        let credential = Credential(id: UUID().uuidString, title: cleanTitle, issuer: "You", summary: cleanSummary,
                                    kind: draft.kind, date: .now, createdByMe: true, artworkURL: draft.artworkURL)
        templates.insert(credential, at: 0)
        if let recipient = draft.recipient {
            activity.insert(Activity(title: "Sample send recorded", detail: "\(cleanTitle) → \(recipient)", symbol: "paperplane"), at: 0)
        } else {
            credentials.insert(credential, at: 0)
            activity.insert(Activity(title: "Created a sample", detail: cleanTitle, symbol: "sparkles"), at: 0)
        }
        return snapshot()
    }

    public func creations(cursor: String? = nil) -> CreationPage { CreationPage(credentials: templates) }

    public func share(credentialIDs: [String], title: String, requestID: String, passcode: String?) throws -> CredentialShare {
        let chosen = credentials.filter { credentialIDs.contains($0.id) }
        guard !chosen.isEmpty, chosen.count == credentialIDs.count, chosen.count <= 50 else { throw ClientError.invalidDraft }
        return CredentialShare(sampleText: chosen.map(\.sampleShareText).joined(separator: "\n\n—\n\n"))
    }

    public func send(credentialID: String, recipient: String) throws -> CollectionSnapshot {
        guard let credential = (credentials + templates).first(where: { $0.id == credentialID }),
              credential.createdByMe else { throw ClientError.cannotSend }
        let cleanRecipient = recipient.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanRecipient.isEmpty, cleanRecipient.count <= 100 else { throw ClientError.invalidRecipient }
        activity.insert(Activity(title: "Sample send recorded", detail: "\(credential.title) → \(cleanRecipient)",
                                 symbol: "paperplane"), at: 0)
        return snapshot()
    }
}
