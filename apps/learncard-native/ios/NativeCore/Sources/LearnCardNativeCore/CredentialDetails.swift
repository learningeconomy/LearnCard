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
    public var transcript: CredentialTranscript?
    public init() {}
}

/// A display-only projection of the original CLR credential.
public struct CredentialTranscript: Codable, Hashable, Sendable {
    public var kind: String
    public var learner: String?
    public var partial: Bool?
    public var groups: [CredentialTranscriptGroup]
    public init(kind: String, learner: String? = nil, partial: Bool? = nil, groups: [CredentialTranscriptGroup]) {
        self.kind = kind; self.learner = learner; self.partial = partial; self.groups = groups
    }
}

public struct CredentialTranscriptGroup: Codable, Hashable, Sendable {
    public var kind: String
    public var term: String?
    public var records: [CredentialTranscriptRecord]
    public init(kind: String, term: String? = nil, records: [CredentialTranscriptRecord]) {
        self.kind = kind; self.term = term; self.records = records
    }
}

public struct CredentialTranscriptRecord: Codable, Hashable, Sendable {
    public var name: String
    public var code: String?
    public var credits: CredentialTranscriptCredits?
    public var results: [CredentialTranscriptResult]
    public init(name: String, code: String? = nil, credits: CredentialTranscriptCredits? = nil, results: [CredentialTranscriptResult] = []) {
        self.name = name; self.code = code; self.credits = credits; self.results = results
    }
}

public struct CredentialTranscriptCredits: Codable, Hashable, Sendable {
    public var amount: Double
    public var unit: String?
    public var kind: String
    public init(amount: Double, unit: String? = nil, kind: String) { self.amount = amount; self.unit = unit; self.kind = kind }
}

public struct CredentialTranscriptResult: Codable, Hashable, Sendable {
    public var label: String?
    public var value: String?
    public var status: String?
    public init(label: String? = nil, value: String? = nil, status: String? = nil) {
        self.label = label; self.value = value; self.status = status
    }
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
