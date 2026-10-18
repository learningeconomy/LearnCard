import Foundation
import LearnCardNativeCore

public enum LearnerError: String, Error, LocalizedError, Sendable {
    case signIn, connection, unavailable, changed, invalid, busy, uncertain
    public var errorDescription: String? { NativeText.text("skills.error.\(rawValue)") }
}
public struct SkillSource: Codable, Identifiable, Hashable, Sendable {
    public let id: String
    public let title: String
    public let issuer: String
    public let selfReported: Bool
    public init(id: String, title: String, issuer: String, selfReported: Bool = false) { self.id = id; self.title = title; self.issuer = issuer; self.selfReported = selfReported }
}
public struct LearnerSkill: Codable, Identifiable, Hashable, Sendable {
    public let id: String
    public let name: String
    public let description: String
    public let framework: String
    public var sources: [SkillSource]
    public init(id: String, name: String, description: String = "", framework: String = "", sources: [SkillSource]) { self.id = id; self.name = name; self.description = description; self.framework = framework; self.sources = sources }
}
public struct SkillsPage: Codable, Sendable {
    public let skills: [LearnerSkill]
    public let unavailable: Int
    public let hasMore: Bool
    public let cursor: String?
    public init(skills: [LearnerSkill], unavailable: Int = 0, hasMore: Bool = false, cursor: String? = nil) { self.skills = skills; self.unavailable = unavailable; self.hasMore = hasMore; self.cursor = cursor }
}
public struct LearnerGoals: Codable, Equatable, Sendable {
    public let goals: [String]
    public let revision: String
    public init(goals: [String], revision: String) { self.goals = goals; self.revision = revision }
    /// Matches web's UTF-16 limit, without truncating or splitting Unicode input.
    public static func acceptsNewGoal(_ value: String) -> Bool {
        !value.isEmpty && value == value.trimmingCharacters(in: .whitespacesAndNewlines) && value.utf16.count <= 35 && !value.unicodeScalars.contains { $0.value < 32 || $0.value == 127 }
    }
}
public protocol LearnerService: Sendable {
    func skills(cursor: String?) async throws -> SkillsPage
    func source(id: String) async throws -> Credential
    func goals() async throws -> LearnerGoals
    func saveGoals(_ goals: [String], revision: String) async throws -> LearnerGoals
}
@MainActor public final class LiveLearnerService: LearnerService {
    private let runtime: AccountRuntime
    public init(runtime: AccountRuntime) { self.runtime = runtime }
    public func skills(cursor: String?) async throws -> SkillsPage { try await runtime.command("skillsPage", input: cursor.map { ["cursor": $0] } ?? [:]) }
    public func source(id: String) async throws -> Credential { try await runtime.command("skillsSource", input: ["id": id]) }
    public func goals() async throws -> LearnerGoals { try await runtime.command("goalsRead") }
    public func saveGoals(_ goals: [String], revision: String) async throws -> LearnerGoals { try await runtime.command("goalsSave", input: ["goals": goals, "revision": revision]) }
}
public actor UnavailableLearnerService: LearnerService {
    public init() {}
    public func skills(cursor: String?) throws -> SkillsPage { throw LearnerError.unavailable }
    public func source(id: String) throws -> Credential { throw LearnerError.unavailable }
    public func goals() throws -> LearnerGoals { throw LearnerError.unavailable }
    public func saveGoals(_ goals: [String], revision: String) throws -> LearnerGoals { throw LearnerError.unavailable }
}
/// Unsigned, local review data. Does not issue credentials, upload data or create consent.
public actor DemoLearnerService: LearnerService {
    private let credentials: any CredentialService
    private var value = LearnerGoals(goals: [], revision: "demo-0")
    public init(credentials: any CredentialService) { self.credentials = credentials }
    public func skills(cursor: String?) async throws -> SkillsPage {
        let records = try await credentials.snapshot().credentials
        let names = ["Communication", "Teamwork", "Creative thinking"]
        return SkillsPage(skills: records.prefix(3).enumerated().map { index, record in
            LearnerSkill(id: "https://example.invalid/frameworks/sample/skills/\(index)", name: names[index], framework: "Sample skills", sources: [SkillSource(id: record.id, title: record.title, issuer: record.issuer, selfReported: index == 2)])
        })
    }
    public func source(id: String) async throws -> Credential {
        guard let record = try await credentials.snapshot().credentials.first(where: { $0.id == id }) else { throw LearnerError.unavailable }; return record
    }
    public func goals() -> LearnerGoals { value }
    public func saveGoals(_ goals: [String], revision: String) throws -> LearnerGoals {
        if value.goals == goals { return value }
        guard value.revision == revision else { throw LearnerError.changed }
        guard goals.allSatisfy({ value.goals.contains($0) || LearnerGoals.acceptsNewGoal($0) }) else { throw LearnerError.invalid }
        value = LearnerGoals(goals: goals, revision: UUID().uuidString); return value
    }
}
