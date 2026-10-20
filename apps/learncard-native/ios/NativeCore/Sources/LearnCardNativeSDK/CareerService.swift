import Foundation

public enum CareerError: String, Error, LocalizedError, Sendable {
    case signIn, connection, unavailable, invalid, disabledUser, disabledMinor
    public var errorDescription: String? { NativeText.text("career.error.\(rawValue)") }
    public var blocksAccess: Bool { self == .disabledUser || self == .disabledMinor || self == .signIn }
}
public struct CareerAccess: Codable, Equatable, Sendable {
    public let reason: String
    public init(reason: String) { self.reason = reason }
    public var enabled: Bool { reason == "enabled" }
    public var error: CareerError? { enabled ? nil : CareerError(rawValue: reason) ?? .unavailable }
}
public struct CareerSkill: Codable, Identifiable, Hashable, Sendable {
    public let id: String
    public let name: String
    public let description: String
    public init(id: String, name: String, description: String) { self.id = id; self.name = name; self.description = description }
}
public struct CareerOccupation: Codable, Identifiable, Hashable, Sendable {
    public let id: String
    public let title: String
    public let summary: String
    public let education: String
    public let experience: String
    public let training: String
    public let skills: [CareerSkill]
    public let tasks: [String]
    public init(id: String, title: String, summary: String, education: String = "", experience: String = "", training: String = "", skills: [CareerSkill] = [], tasks: [String] = []) {
        self.id = id; self.title = title; self.summary = summary; self.education = education; self.experience = experience; self.training = training; self.skills = skills; self.tasks = tasks
    }
}
public struct CareerSearchResult: Codable, Sendable {
    public let occupations: [CareerOccupation]
    public let limited: Bool
    public init(occupations: [CareerOccupation], limited: Bool = false) { self.occupations = occupations; self.limited = limited }
}
public struct CareerProgram: Codable, Identifiable, Hashable, Sendable {
    public let id: String
    public let title: String
    public let school: String
    public let location: String
    public let formats: [String]
    public let lengths: [String]
    public let website: String?
    public init(id: String, title: String, school: String, location: String = "", formats: [String] = [], lengths: [String] = [], website: String? = nil) {
        self.id = id; self.title = title; self.school = school; self.location = location; self.formats = formats; self.lengths = lengths; self.website = website
    }
    public var schoolURL: URL? {
        guard let website, let url = URL(string: website), url.scheme == "https", let host = url.host, !host.isEmpty, url.user == nil, url.password == nil, !host.contains(":"), host != "localhost", !host.hasSuffix(".local"), !host.hasSuffix(".localhost"), host.range(of: #"^\d+\.\d+\.\d+\.\d+$"#, options: .regularExpression) == nil else { return nil }
        return url
    }
}
public struct CareerProgramsResult: Codable, Sendable {
    public let programs: [CareerProgram]
    public let unavailable: Int
    public let limited: Bool
    public init(programs: [CareerProgram], unavailable: Int = 0, limited: Bool = false) { self.programs = programs; self.unavailable = unavailable; self.limited = limited }
}
public protocol CareerService: Sendable {
    func access() async throws -> CareerAccess
    func search(_ query: String) async throws -> CareerSearchResult
    func programs(_ id: String) async throws -> CareerProgramsResult
}
@MainActor public final class LiveCareerService: CareerService {
    private let runtime: AccountRuntime
    public init(runtime: AccountRuntime) { self.runtime = runtime }
    public func access() async throws -> CareerAccess { try await runtime.command("careerAccess") }
    public func search(_ query: String) async throws -> CareerSearchResult { try await runtime.command("careerSearch", input: ["query": query]) }
    public func programs(_ id: String) async throws -> CareerProgramsResult { try await runtime.command("careerPrograms", input: ["id": id]) }
}
public actor UnavailableCareerService: CareerService {
    public init() {}
    public func access() throws -> CareerAccess { throw CareerError.unavailable }
    public func search(_ query: String) throws -> CareerSearchResult { throw CareerError.unavailable }
    public func programs(_ id: String) throws -> CareerProgramsResult { throw CareerError.unavailable }
}
/// Labeled sample data for disposable UI review; never contacts providers or saves personal data.
public actor DemoCareerService: CareerService {
    private var failedOnce = false
    public init() {}
    public func access() -> CareerAccess { CareerAccess(reason: ProcessInfo.processInfo.arguments.contains("--career-disabled") ? "disabledUser" : "enabled") }
    public func search(_ query: String) throws -> CareerSearchResult {
        if query.lowercased() == "empty" { return CareerSearchResult(occupations: []) }
        if query.lowercased() == "offline" { throw CareerError.connection }
        return CareerSearchResult(occupations: [CareerOccupation(id: "27-4021.00", title: "Photographers", summary: "Create photographs of people, places and ideas.", education: "High school diploma or equivalent", skills: [CareerSkill(id: "communication", name: "Communication", description: "Understand a brief and explain your ideas."), CareerSkill(id: "creative", name: "Creative thinking", description: "Explore different ways to tell a story.")], tasks: ["Plan and compose a photograph.", "Edit and prepare images."])])
    }
    public func programs(_ id: String) throws -> CareerProgramsResult {
        if ProcessInfo.processInfo.arguments.contains("--career-resource-retry"), !failedOnce { failedOnce = true; throw CareerError.connection }
        return CareerProgramsResult(programs: [CareerProgram(id: "sample", title: "Photography and visual storytelling", school: "Sample school", location: "Sample location", formats: ["In-person"], lengths: ["Example program"])])
    }
}
