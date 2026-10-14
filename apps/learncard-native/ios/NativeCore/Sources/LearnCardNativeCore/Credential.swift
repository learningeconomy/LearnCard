import Foundation

public enum CredentialKind: String, Codable, CaseIterable, Sendable {
    case achievement = "Achievements"
    case membership = "Memberships"
    case learning = "Learning"

    public var symbol: String {
        switch self {
        case .achievement: "seal"
        case .membership: "person.crop.rectangle"
        case .learning: "book.closed"
        }
    }
}

/// Original LearnCard category semantics survive the simpler native browsing groups.
/// Unknown partner categories remain displayable instead of failing account decoding.
public enum CredentialCategory: Sendable {
    case badge, achievement, studies, portfolio, assistance, experience, id, family, skill, aiTopic, aiPathway, aiInsight

    public static func resolve(_ category: String?, fallback: CredentialKind) -> Self {
        switch category?.lowercased().filter({ $0.isLetter }) {
        case "socialbadge", "badge", "badges", "boost": .badge
        case "achievement", "achievements": .achievement
        case "learninghistory", "study", "studies", "learning": .studies
        case "accomplishment", "portfolio": .portfolio
        case "accommodation", "assistance": .assistance
        case "workhistory", "experience", "experiences": .experience
        case "id", "ids", "membership", "memberships": .id
        case "family": .family
        case "skill", "skills": .skill
        case "aitopic": .aiTopic
        case "aipathway": .aiPathway
        case "aiinsight": .aiInsight
        default:
            switch fallback { case .achievement: .achievement; case .membership: .id; case .learning: .studies }
        }
    }

    public var symbol: String {
        switch self {
        case .badge: "seal"
        case .achievement: "trophy"
        case .studies: "book.closed"
        case .portfolio: "book.pages"
        case .assistance: "lifepreserver"
        case .experience: "mountain.2"
        case .id: "person.crop.rectangle"
        case .family: "person.2"
        case .skill: "sparkles"
        case .aiTopic: "bubble.left.and.bubble.right"
        case .aiPathway: "point.topleft.down.to.point.bottomright.curvepath"
        case .aiInsight: "lightbulb"
        }
    }
}

/// Display model only. A production adapter must retain the original signed payload separately.
public struct Credential: Identifiable, Codable, Hashable, Sendable {
    public let id: String
    public let title: String
    public let issuer: String
    public let summary: String
    public let kind: CredentialKind
    public let category: String?
    public var displayCategory: CredentialCategory { .resolve(category, fallback: kind) }
    public let date: Date
    public let createdByMe: Bool
    public let isSample: Bool
    public let artworkURL: URL?
    public let issuerLogoURL: URL?
    public let signedPayload: String?
    public let verificationSummary: String?

    public init(id: String, title: String, issuer: String, summary: String,
                kind: CredentialKind, date: Date, createdByMe: Bool = false, isSample: Bool = true,
                artworkURL: URL? = nil, issuerLogoURL: URL? = nil, signedPayload: String? = nil, verificationSummary: String? = nil, category: String? = nil) {
        self.id = id
        self.title = title
        self.issuer = issuer
        self.summary = summary
        self.kind = kind
        self.category = category
        self.date = date
        self.createdByMe = createdByMe
        self.isSample = isSample; self.artworkURL = artworkURL; self.issuerLogoURL = issuerLogoURL
        self.signedPayload = signedPayload; self.verificationSummary = verificationSummary
    }

    /// This prototype exports sample text, never a fabricated signed credential or presentation.
    public var sampleShareText: String {
        "LearnCard sample — unsigned\n\n\(title)\nFrom \(issuer)\n\n\(summary)\n\nThis is sample content from the native client experiment."
    }
}

public struct Activity: Identifiable, Codable, Sendable {
    public let id: UUID
    public let title: String
    public let detail: String
    public let symbol: String
    public let date: Date

    public init(title: String, detail: String, symbol: String, date: Date = .now) {
        id = UUID()
        self.title = title
        self.detail = detail
        self.symbol = symbol
        self.date = date
    }
}

public struct CollectionSnapshot: Codable, Sendable {
    public let credentials: [Credential]
    public let offers: [Credential]
    public let activity: [Activity]
    public let hasMore: Bool

    public init(credentials: [Credential], offers: [Credential], activity: [Activity], hasMore: Bool = false) {
        self.credentials = credentials
        self.offers = offers
        self.activity = activity
        self.hasMore = hasMore
    }
}

public enum ClientError: Error, LocalizedError, Equatable, Sendable {
    case offerUnavailable, invalidDraft, cannotSend, invalidRecipient, unsupportedLink

    public var errorDescription: String? {
        switch self {
        case .offerUnavailable: "This sample has already been added or is no longer available."
        case .invalidDraft: "Add a title and a short description."
        case .cannotSend: "Only samples you created can be sent. Use Share for received samples."
        case .invalidRecipient: "Choose a recipient."
        case .unsupportedLink: "Use a sample link from this experiment."
        }
    }
}
