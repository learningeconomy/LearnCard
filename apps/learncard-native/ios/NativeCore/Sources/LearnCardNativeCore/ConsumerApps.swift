import Foundation

/// Consumer metadata only. Publisher text is kept verbatim; no admin configuration is exposed.
public struct ConsumerApp: Codable, Identifiable, Hashable, Sendable {
    public let id: String
    public let title: String
    public let tagline: String
    public let description: String
    public let category: String
    public let iconURL: URL?
    public let screenshots: [URL]
    public let launchType: String
    public let host: String?
    public let permissions: [String]
    public let contractURI: String?
    public let ageRating: String?
    public let minimumAge: Int?
    public let privacyURL: URL?
    public let termsURL: URL?
    public let featured: Bool
    public let launchable: Bool
    public var installedAt: Date?
}

public struct ConsumerAppPage: Codable, Sendable {
    public let records: [ConsumerApp]
    public let hasMore: Bool
    public let cursor: String?
}

public struct ConsumerAppLaunch: Codable, Identifiable, Sendable {
    public let id: String
    public let title: String
    public let url: URL
    public let embedded: Bool
    public let contractURI: String?
    public var origin: String? { AppWebOrigin(url: url)?.value }
}

/// Exact HTTPS origin comparison, shared by the browser bridge and regression suite.
public struct AppWebOrigin: Equatable, Sendable {
    public let value: String
    public init?(url: URL) {
        guard url.scheme?.lowercased() == "https", let host = url.host?.lowercased(),
              !host.isEmpty, url.user == nil, url.password == nil,
              host != "localhost", !host.hasSuffix(".localhost"), !host.hasSuffix(".local"), !host.contains(":"),
              host.range(of: "^\\d+\\.\\d+\\.\\d+\\.\\d+$", options: .regularExpression) == nil else { return nil }
        value = "https://\(host)" + (url.port.flatMap { $0 == 443 ? nil : ":\($0)" } ?? "")
    }
    public func contains(_ url: URL) -> Bool { AppWebOrigin(url: url) == self }
}

public struct ConsentAudienceMember: Codable, Identifiable, Hashable, Sendable {
    public let id: String
    public let name: String
    public let imageURL: URL?
}

public struct ConsentCredentialChoice: Codable, Identifiable, Hashable, Sendable {
    public let id: String
    public let title: String
    public let artworkURL: URL?
}

public struct ConsentPermission: Codable, Identifiable, Hashable, Sendable {
    public let id: String
    public let required: Bool
    public let choices: [ConsentCredentialChoice]
}

public struct ConsumerConsentReview: Codable, Identifiable, Sendable {
    public let id: String
    public let listingID: String
    public let contractURI: String
    public let title: String
    public let description: String?
    public let recipients: [ConsentAudienceMember]
    public let readCredentials: [ConsentPermission]
    public let readPersonal: [ConsentPermission]
    public let writeCredentials: [ConsentPermission]
    public let writePersonal: [ConsentPermission]
    public let allowsAnonymous: Bool
    public let blockReason: String?
}

public struct ConsumerConsentDecision: Codable, Sendable {
    public let reviewID: String
    public let listingID: String
    public var readCategories: [String]
    public var selectedCredentials: [String: [String]]
    public var personalValues: [String: String]
    public var writeCategories: [String]
    public var writePersonal: [String]
    public var anonymize: Bool
    public init(review: ConsumerConsentReview) {
        reviewID = review.id; listingID = review.listingID
        readCategories = review.readCredentials.filter(\.required).map(\.id)
        selectedCredentials = [:]; personalValues = [:]
        writeCategories = review.writeCredentials.filter(\.required).map(\.id)
        writePersonal = review.writePersonal.filter(\.required).map(\.id)
        anonymize = false
    }
    public var selectedCount: Int { selectedCredentials.values.reduce(0) { $0 + $1.count } }
    public func satisfies(_ review: ConsumerConsentReview) -> Bool {
        guard reviewID == review.id, listingID == review.listingID, review.blockReason == nil else { return false }
        return review.readCredentials.filter(\.required).allSatisfy { readCategories.contains($0.id) }
            && review.readPersonal.filter(\.required).allSatisfy { !(personalValues[$0.id] ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
            && review.writeCredentials.filter(\.required).allSatisfy { writeCategories.contains($0.id) }
            && review.writePersonal.filter(\.required).allSatisfy { writePersonal.contains($0.id) }
    }
}

public struct DataDisclosure: Codable, Identifiable, Hashable, Sendable {
    public let id: String
    public let direction: String
    public let label: String
    public let detail: String?
    public let count: Int?
}

public struct DataConnection: Codable, Identifiable, Sendable {
    public let id: String
    public let contractURI: String
    public let title: String
    public let imageURL: URL?
    public let status: String
    public let recipients: [ConsentAudienceMember]
    public let disclosures: [DataDisclosure]
    public let expiresAt: Date?
}

public struct ManagedCredentialLink: Codable, Identifiable, Sendable {
    public let id: String
    public let title: String
    public let selectedCount: Int
    public let version: Int
    public let status: String
    public let contentState: String
    public let createdAt: Date
    public let expiresAt: Date?
    public let passcodeProtected: Bool
    public var canShare: Bool { status == "active" && contentState == "finalized" && (expiresAt.map { $0 > .now } ?? true) }
}

public struct DataSharingPage: Codable, Sendable {
    public let connections: [DataConnection]
    public let links: [ManagedCredentialLink]
    public let connectionsCursor: String?
    public let linksCursor: String?
    public let hasMoreConnections: Bool
    public let hasMoreLinks: Bool
}

/// Opaque JSON for the partner protocol. Signing keys and Firebase tokens never use this plane.
public enum PartnerValue: Codable, Sendable, Equatable {
    case string(String), number(Double), bool(Bool), array([PartnerValue]), object([String: PartnerValue]), null
    public init(from decoder: any Decoder) throws {
        let value = try decoder.singleValueContainer()
        if value.decodeNil() { self = .null }
        else if let x = try? value.decode(Bool.self) { self = .bool(x) }
        else if let x = try? value.decode(String.self) { self = .string(x) }
        else if let x = try? value.decode(Double.self) { self = .number(x) }
        else if let x = try? value.decode([PartnerValue].self) { self = .array(x) }
        else { self = .object(try value.decode([String: PartnerValue].self)) }
    }
    public func encode(to encoder: any Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let x): try container.encode(x)
        case .number(let x): try container.encode(x)
        case .bool(let x): try container.encode(x)
        case .array(let x): try container.encode(x)
        case .object(let x): try container.encode(x)
        case .null: try container.encodeNil()
        }
    }
}

public protocol ConsumerAppService: Sendable {
    func browse(category: String?, cursor: String?) async throws -> ConsumerAppPage
    func installed(cursor: String?) async throws -> ConsumerAppPage
    func install(_ id: String) async throws
    func remove(_ id: String) async throws
    func review(_ id: String) async throws -> ConsumerConsentReview?
    func consent(_ decision: ConsumerConsentDecision) async throws
    func launch(_ id: String) async throws -> ConsumerAppLaunch
    func identity(_ id: String, origin: String, challenge: String?) async throws -> PartnerValue
    func event(_ id: String, event: PartnerValue) async throws -> PartnerValue
    func dataSharing(connectionsCursor: String?, linksCursor: String?, more: Bool) async throws -> DataSharingPage
    func withdraw(_ id: String) async throws
    func stopLink(_ link: ManagedCredentialLink) async throws -> Bool
    func linkURL(_ id: String) async throws -> URL
}
