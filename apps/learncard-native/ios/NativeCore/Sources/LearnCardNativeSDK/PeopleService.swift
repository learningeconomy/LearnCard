import Foundation
import LearnCardNativeCore

public enum PeopleScope: String, Codable, CaseIterable, Sendable { case connections, requests, sent, find, blocked }
public enum PersonStatus: String, Codable, Sendable { case connected, incoming, outgoing, blocked, none }
public enum PeopleAction: String, Sendable { case connect, accept, cancel, disconnect, block, unblock }
public struct LearnCardPerson: Identifiable, Codable, Hashable, Sendable {
    public let id: String
    public let name: String
    public var bio: String?
    public var imageURL: URL?
    public var status: PersonStatus
    public init(id: String, name: String, bio: String? = nil, imageURL: URL? = nil, status: PersonStatus = .none) {
        self.id = id; self.name = name; self.bio = bio; self.imageURL = imageURL; self.status = status
    }
}
public struct PeoplePage: Codable, Sendable {
    public let items: [LearnCardPerson]
    public let hasMore: Bool
    public let cursor: String?
    public let limited: Bool
    public init(items: [LearnCardPerson], hasMore: Bool = false, cursor: String? = nil, limited: Bool = false) { self.items = items; self.hasMore = hasMore; self.cursor = cursor; self.limited = limited }
}
public enum PeopleError: String, Error, LocalizedError, Sendable {
    case connection, changed, signIn, unavailable, restricted
    public var errorDescription: String? { NativeText.text("people.error.\(rawValue)") }
}
public protocol PeopleService: Sendable {
    func page(scope: PeopleScope, query: String, cursor: String?) async throws -> PeoplePage
    func profile(id: String) async throws -> LearnCardPerson
    func act(id: String, action: PeopleAction) async throws -> LearnCardPerson
}
@MainActor public final class LivePeopleService: PeopleService {
    private let runtime: AccountRuntime
    public init(runtime: AccountRuntime) { self.runtime = runtime }
    public func page(scope: PeopleScope, query: String, cursor: String?) async throws -> PeoplePage {
        var input = ["scope": scope.rawValue, "query": query]; if let cursor { input["cursor"] = cursor }
        return try await runtime.command("peopleList", input: input)
    }
    public func profile(id: String) async throws -> LearnCardPerson { try await runtime.command("peopleProfile", input: ["id": id]) }
    public func act(id: String, action: PeopleAction) async throws -> LearnCardPerson { try await runtime.command("peopleAction", input: ["id": id, "action": action.rawValue]) }
}
public actor UnavailablePeopleService: PeopleService {
    public init() {}
    public func page(scope: PeopleScope, query: String, cursor: String?) throws -> PeoplePage { throw PeopleError.unavailable }
    public func profile(id: String) throws -> LearnCardPerson { throw PeopleError.unavailable }
    public func act(id: String, action: PeopleAction) throws -> LearnCardPerson { throw PeopleError.unavailable }
}
/// Disposable relationships only; no message or invitation is delivered.
public actor DemoPeopleService: PeopleService {
    private var people = [LearnCardPerson(id: "alex", name: "Alex Morgan", bio: "Learning something new every day.", status: .incoming), LearnCardPerson(id: "jordan", name: "Jordan Lee", status: .connected), LearnCardPerson(id: "sam", name: "Sam Rivera", status: .outgoing), LearnCardPerson(id: "robin", name: "Robin Chen")]
    public init() {}
    public func page(scope: PeopleScope, query: String, cursor: String?) -> PeoplePage {
        let wanted: PersonStatus = scope == .connections ? .connected : scope == .requests ? .incoming : scope == .sent ? .outgoing : .blocked
        return PeoplePage(items: people.filter { scope == .find ? query.count >= 2 && $0.status != .blocked : $0.status == wanted }.filter { query.isEmpty || "\($0.name) \($0.id)".localizedCaseInsensitiveContains(query) })
    }
    public func profile(id: String) throws -> LearnCardPerson { guard let person = people.first(where: { $0.id == id }) else { throw PeopleError.changed }; return person }
    public func act(id: String, action: PeopleAction) throws -> LearnCardPerson {
        guard let index = people.firstIndex(where: { $0.id == id }) else { throw PeopleError.changed }
        people[index].status = action == .accept ? .connected : action == .connect ? .outgoing : action == .block ? .blocked : .none
        return people[index]
    }
}
