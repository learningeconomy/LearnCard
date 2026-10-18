import Foundation

/// Presentation-only fields from the original credential; not a replacement for its signed payload.
public struct CredentialDetails: Codable, Hashable, Sendable {
    public var criteria: [CredentialNarrative] = []
    public var alignments: [CredentialAlignment] = []
    public var evidence: [CredentialNarrative] = []
    public var fields: [CredentialDetailField] = []
    public var results: [CredentialResult] = []
    public var activityStartDate: Date?
    public var activityEndDate: Date?
    public var validUntil: Date?
    public init() {}
}

public struct CredentialNarrative: Codable, Hashable, Sendable {
    public var name: String
    public var text: String
    public var url: URL?
    public init(name: String = "", text: String = "", url: URL? = nil) { self.name = name; self.text = text; self.url = url }
}

public struct CredentialAlignment: Codable, Hashable, Sendable {
    public var name: String
    public var text: String
    public var framework: String
    public var code: String
    public var url: URL?
    public init(name: String, text: String = "", framework: String = "", code: String = "", url: URL? = nil) {
        self.name = name; self.text = text; self.framework = framework; self.code = code; self.url = url
    }
}

public struct CredentialDetailField: Codable, Hashable, Sendable {
    public var kind: String
    public var value: String
    public init(kind: String, value: String) { self.kind = kind; self.value = value }
}

public struct CredentialResult: Codable, Hashable, Sendable {
    public var name: String
    public var value: String
    public var text: String
    public var type: String
    public init(name: String, value: String, text: String = "", type: String = "") {
        self.name = name; self.value = value; self.text = text; self.type = type
    }
}

/// Proof checking alone does not establish issuer trust or revocation status.
public enum CredentialSignatureState: String, Codable, Hashable, Sendable {
    case verified, notVerified, unavailable
}
