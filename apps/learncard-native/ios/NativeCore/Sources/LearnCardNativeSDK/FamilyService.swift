import Foundation
import LearnCardNativeCore

public enum FamilyError: String, Error, LocalizedError, Sendable {
    case connection, unavailable, permission, pin, changed, decision
    public var errorDescription: String? { NativeText.text("family.error.\(rawValue)") }
}

@MainActor public final class LiveFamilyService: FamilyService {
    private let runtime: AccountRuntime
    public init(runtime: AccountRuntime) { self.runtime = runtime }
    public func families() async throws -> [FamilySummary] { try await runtime.command("familiesList") }
    public func detail(_ id: String) async throws -> FamilyDetail { try await runtime.command("familiesDetail", input: ["id": id]) }
    public func hasPin() async throws -> Bool {
        struct Reply: Decodable { let hasPin: Bool }
        let reply: Reply = try await runtime.command("familiesPinStatus"); return reply.hasPin
    }
    public func create(_ draft: FamilyDraft, pin: String, confirmation: String) async throws -> FamilyDetail {
        var input = try fields(draft); input["pin"] = pin; input["confirmPin"] = confirmation
        return try await runtime.command("familiesCreate", input: input)
    }
    public func edit(_ id: String, draft: FamilyDraft) async throws -> FamilyDetail {
        var input = try fields(draft); input.removeValue(forKey: "requestID"); input["id"] = id
        return try await runtime.command("familiesEdit", input: input)
    }
    public func invite(_ id: String, recipient: String, requestID: String, pin: String) async throws {
        let _: Bool = try await runtime.command("familiesInvite", input: ["id": id, "recipient": recipient, "requestID": requestID, "pin": pin])
    }
    private func fields(_ draft: FamilyDraft) throws -> [String: Any] {
        try JSONSerialization.jsonObject(with: JSONEncoder().encode(draft)) as? [String: Any] ?? [:]
    }
}

public actor UnavailableFamilyService: FamilyService {
    public init() {}
    public func families() throws -> [FamilySummary] { throw FamilyError.unavailable }
    public func detail(_ id: String) throws -> FamilyDetail { throw FamilyError.unavailable }
    public func hasPin() throws -> Bool { throw FamilyError.unavailable }
    public func create(_ draft: FamilyDraft, pin: String, confirmation: String) throws -> FamilyDetail { throw FamilyError.unavailable }
    public func edit(_ id: String, draft: FamilyDraft) throws -> FamilyDetail { throw FamilyError.unavailable }
    public func invite(_ id: String, recipient: String, requestID: String, pin: String) throws { throw FamilyError.unavailable }
}

/// Sample state remains in memory and never changes an actual family or sends an invitation.
public actor DemoFamilyService: FamilyService {
    private var values = [FamilyDetail(summary: FamilySummary(id: "sample-family", title: "The Chen family", motto: "Different paths. A brighter tomorrow.", color: .amber),
        guardians: [FamilyMember(id: "avery", name: "Avery Chen", bio: "Making room for little discoveries.", role: "guardian", profileID: "avery"),
                    FamilyMember(id: "jamie", name: "Jamie Chen", role: "guardian", profileID: "jamie")],
        children: [FamilyMember(id: "emma-manager", name: "Emma", bio: "Loves art and nature", role: "child"),
                   FamilyMember(id: "jonas-manager", name: "Jonas", bio: "Curious about everything", role: "child")], canEdit: true, canInvite: true)]
    private var invitations = Set<String>()
    public init() {}
    public func families() -> [FamilySummary] { values.map(\.summary) }
    public func detail(_ id: String) throws -> FamilyDetail { guard let value = values.first(where: { $0.id == id }) else { throw FamilyError.unavailable }; return value }
    public func hasPin() -> Bool { true }
    public func create(_ draft: FamilyDraft, pin: String, confirmation: String) throws -> FamilyDetail {
        guard draft.isValid, pin == "12345" else { throw FamilyError.pin }
        if let value = values.first(where: { $0.id == draft.requestID }) { return value }
        let value = FamilyDetail(summary: FamilySummary(id: draft.requestID, title: draft.name, motto: draft.motto, color: draft.color),
            guardians: [FamilyMember(id: "avery", name: "Avery Chen", role: "guardian", profileID: "avery")], children: [], canEdit: true, canInvite: true)
        values.append(value); return value
    }
    public func edit(_ id: String, draft: FamilyDraft) throws -> FamilyDetail {
        let value = try detail(id)
        guard draft.isValid, value.canEdit else { throw FamilyError.permission }
        let updated = FamilyDetail(summary: FamilySummary(id: id, title: draft.name, motto: draft.motto, color: draft.color), guardians: value.guardians, children: value.children, canEdit: true, canInvite: value.canInvite)
        values = values.map { $0.id == id ? updated : $0 }; return updated
    }
    public func invite(_ id: String, recipient: String, requestID: String, pin: String) throws {
        guard try detail(id).canInvite else { throw FamilyError.permission }
        guard pin == "12345" else { throw FamilyError.pin }
        invitations.insert(requestID)
        // Pending invitation does not fabricate a guardian row or immediate management access.
    }
}
