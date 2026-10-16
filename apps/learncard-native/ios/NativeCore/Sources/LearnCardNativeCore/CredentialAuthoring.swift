import Foundation

/// The web consumer creator's categories, separate from legacy transport kinds and browse-only AI records.
public enum CreationCategory: String, Codable, CaseIterable, Sendable {
    case badge = "Social Badge", achievement = "Achievement", qualification = "Qualifications", studies = "Learning History"
    case portfolio = "Accomplishment", assistance = "Accommodation", experience = "Work History", id = "ID"

    public static let ordered: [Self] = [.badge, .achievement, .qualification, .studies, .portfolio, .assistance, .experience, .id]
    public var displayCategory: CredentialCategory { .resolve(rawValue, fallback: .achievement) }
    public var legacyKind: CredentialKind { self == .id ? .membership : self == .studies ? .learning : .achievement }
    public var defaultFormat: CredentialDisplayFormat { self == .id ? .id : self == .portfolio ? .media : .certificate }
    public var formats: [CredentialDisplayFormat] { self == .id ? [.id] : [.badge, .award, .certificate, .media] }
    public var types: [CredentialTypeOption] { CredentialAuthoringCatalog.current?.categories.first { $0.category == rawValue }?.types ?? [] }
}

public enum CredentialDisplayFormat: String, Codable, CaseIterable, Sendable {
    case badge, award, certificate, media, id, course
}

public struct CredentialTypeOption: Codable, Hashable, Sendable, Identifiable {
    public let title: String
    public let type: String
    public var id: String { type }
}

public struct CredentialAuthoringCatalog: Decodable, Sendable {
    public struct Category: Decodable, Sendable {
        public let id: String
        public let category: String
        public let types: [CredentialTypeOption]
    }
    public let sourceRevision: String
    public let formats: [String]
    public let categories: [Category]
    public static let current: Self? = {
        guard let url = Bundle.module.url(forResource: "credential-authoring", withExtension: "json"), let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(Self.self, from: data)
    }()
}
