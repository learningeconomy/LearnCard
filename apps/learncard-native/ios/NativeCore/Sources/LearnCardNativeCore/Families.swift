import Foundation

public enum FamilyColor: String, Codable, CaseIterable, Sendable, Identifiable {
    case amber, mint, blue, lilac, pink
    public var id: String { rawValue }
}

public struct FamilySummary: Codable, Identifiable, Sendable, Hashable {
    public let id: String
    public let title: String
    public let motto: String
    public let color: FamilyColor
    public let artworkURL: URL?
    public init(id: String, title: String, motto: String = "", color: FamilyColor = .amber, artworkURL: URL? = nil) {
        self.id = id; self.title = title; self.motto = motto; self.color = color; self.artworkURL = artworkURL
    }
}

/// A child row describes a family profile manager; it grants no account-signing capability.
public struct FamilyMember: Codable, Identifiable, Sendable, Hashable {
    public let id: String
    public let name: String
    public let imageURL: URL?
    public let bio: String
    public let role: String
    public let profileID: String?
    public init(id: String, name: String, imageURL: URL? = nil, bio: String = "", role: String, profileID: String? = nil) {
        self.id = id; self.name = name; self.imageURL = imageURL; self.bio = bio; self.role = role; self.profileID = profileID
    }
}

public struct FamilyDetail: Codable, Identifiable, Sendable {
    public let id: String
    public let title: String
    public let motto: String
    public let color: FamilyColor
    public let artworkURL: URL?
    public let guardians: [FamilyMember]
    public let children: [FamilyMember]
    public let canEdit: Bool
    public let canInvite: Bool
    public var summary: FamilySummary { FamilySummary(id: id, title: title, motto: motto, color: color, artworkURL: artworkURL) }
    public init(summary: FamilySummary, guardians: [FamilyMember], children: [FamilyMember], canEdit: Bool, canInvite: Bool) {
        id = summary.id; title = summary.title; motto = summary.motto; color = summary.color; artworkURL = summary.artworkURL
        self.guardians = guardians; self.children = children; self.canEdit = canEdit; self.canInvite = canInvite
    }
}

public struct FamilyDraft: Codable, Sendable {
    public let requestID: String
    public var name: String
    public var motto: String
    public var color: FamilyColor
    public var changeColor = false
    public init(requestID: String = UUID().uuidString, name: String = "", motto: String = "", color: FamilyColor = .amber) {
        self.requestID = requestID; self.name = name; self.motto = motto; self.color = color
    }
    public var isValid: Bool { !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && name.count <= 100 && motto.count <= 500 }
}

public protocol FamilyService: Sendable {
    func families() async throws -> [FamilySummary]
    func detail(_ id: String) async throws -> FamilyDetail
    func hasPin() async throws -> Bool
    func create(_ draft: FamilyDraft, pin: String, confirmation: String) async throws -> FamilyDetail
    func edit(_ id: String, draft: FamilyDraft) async throws -> FamilyDetail
    func invite(_ id: String, recipient: String, requestID: String, pin: String) async throws
}
