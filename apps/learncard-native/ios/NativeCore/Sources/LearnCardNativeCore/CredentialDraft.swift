import Foundation

public struct CredentialDraft: Codable, Sendable {
    public let requestID: String
    public let title: String
    public let summary: String
    public let kind: CredentialKind
    public let achievementType: String
    public let criteria: String
    public let artworkURL: URL?
    public let recipient: String?

    public init(requestID: String = UUID().uuidString, title: String, summary: String, kind: CredentialKind,
                achievementType: String = "Badge", criteria: String = "", artworkURL: URL? = nil, recipient: String? = nil) {
        self.requestID = requestID; self.title = title; self.summary = summary; self.kind = kind
        self.achievementType = achievementType; self.criteria = criteria; self.artworkURL = artworkURL; self.recipient = recipient
    }
}

public struct CreationPage: Decodable, Sendable {
    public let credentials: [Credential]
    public let hasMore: Bool
    public let cursor: String?
    public init(credentials: [Credential], hasMore: Bool = false, cursor: String? = nil) {
        self.credentials = credentials; self.hasMore = hasMore; self.cursor = cursor
    }
}

public struct CredentialShare: Codable, Sendable {
    public let url: URL?
    public let sampleText: String?
    public let pending: Bool
    public init(url: URL? = nil, sampleText: String? = nil, pending: Bool = false) { self.url = url; self.sampleText = sampleText; self.pending = pending }
}
