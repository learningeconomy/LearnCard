import Foundation
import LearnCardNativeCore

public struct InboxItem: Identifiable, Codable, Hashable, Sendable {
    public enum Kind: String, Codable, Sendable { case request, connection, prompt, notice }
    public enum Status: String, Codable, Sendable { case pending = "PENDING", connected = "CONNECTED", skipped = "SKIPPED", stale = "STALE", read = "READ" }
    public let id: String
    public let kind: Kind
    public let type: String
    public let name: String
    public var title: String?
    public var body: String?
    public var profileID: String?
    public var imageURL: URL?
    public var date: Date?
    public var read: Bool
    public var status: Status
    public var promptID: String?
    public var surface: String?
    public var dismissible: Bool
    public var credentialURIs: [String]?
    public var actionable: Bool { status == .pending && (kind == .request || kind == .prompt) }
    public init(id: String, kind: Kind, type: String = "CONNECTION_REQUEST", name: String, profileID: String? = nil,
                status: Status = .pending, promptID: String? = nil, surface: String? = nil, dismissible: Bool = true) {
        self.id = id; self.kind = kind; self.type = type; self.name = name; self.profileID = profileID
        self.status = status; self.promptID = promptID; self.surface = surface; self.dismissible = dismissible; read = false
    }
}
public struct InboxPage: Codable, Sendable {
    public let items: [InboxItem]
    public let postClaimPrompts: [InboxItem]
    public let hasMore: Bool
    public let cursor: String?
    public init(items: [InboxItem], postClaimPrompts: [InboxItem] = [], hasMore: Bool = false, cursor: String? = nil) {
        self.items = items; self.postClaimPrompts = postClaimPrompts; self.hasMore = hasMore; self.cursor = cursor
    }
}
public enum InboxAction: String, Sendable { case accept, connect, skip, read, dismiss }
public struct InboxOutcome: Codable, Sendable {
    public let status: InboxItem.Status
    public let metadataPending: Bool
    public let dismissed: Bool
    public init(status: InboxItem.Status, metadataPending: Bool = false, dismissed: Bool = false) {
        self.status = status; self.metadataPending = metadataPending; self.dismissed = dismissed
    }
}
public enum InboxError: String, Error, LocalizedError, Sendable {
    case connection, changed, unavailable, signIn
    public var errorDescription: String? { NativeText.text("inbox.error.\(rawValue)") }
}
public protocol InboxService: Sendable {
    func page(cursor: String?) async throws -> InboxPage
    func act(id: String, action: InboxAction) async throws -> InboxOutcome
}
@MainActor public final class LiveInboxService: InboxService {
    private let runtime: AccountRuntime
    public init(runtime: AccountRuntime) { self.runtime = runtime }
    public func page(cursor: String?) async throws -> InboxPage { try await runtime.command("inboxList", input: cursor.map { ["cursor": $0] } ?? [:]) }
    public func act(id: String, action: InboxAction) async throws -> InboxOutcome { try await runtime.command("inboxAction", input: ["id": id, "action": action.rawValue]) }
}
public actor UnavailableInboxService: InboxService {
    public init() {}
    public func page(cursor: String?) -> InboxPage { InboxPage(items: []) }
    public func act(id: String, action: InboxAction) throws -> InboxOutcome { throw InboxError.unavailable }
}
/// All example relationships stay in memory. No invitation or message is delivered.
public actor DemoInboxService: InboxService {
    private var items = [InboxItem(id: "sample-request", kind: .request, name: "Alex Morgan", profileID: "alex"),
        InboxItem(id: "sample-connection", kind: .connection, type: "CONNECTION_ACCEPTED", name: "Jordan Lee", status: .connected)]
    private var prompts: [InboxItem] = []
    public init() {}
    public func page(cursor: String?) -> InboxPage { InboxPage(items: items + prompts, postClaimPrompts: prompts.filter { $0.status == .pending }) }
    public func afterClaim() {
        if prompts.isEmpty { prompts = [InboxItem(id: "sample-prompt", kind: .prompt, type: "CONNECTION_PROMPT", name: "LearnCard Demo Partner", status: .pending, promptID: "sample-prompt", surface: "POST_CLAIM", dismissible: false)] }
    }
    public func act(id: String, action: InboxAction) throws -> InboxOutcome {
        guard let item = (items + prompts).first(where: { $0.id == id }) else { throw InboxError.changed }
        let status: InboxItem.Status = action == .accept || action == .connect ? .connected : action == .skip ? .skipped : item.status
        items = items.compactMap { value in
            guard value.id == id else { return value }; if action == .dismiss { return nil }
            var next = value; next.status = status; next.read = true; return next
        }
        prompts = prompts.map { value in var next = value; if value.id == id { next.status = status; next.read = true }; return next }
        return InboxOutcome(status: status, dismissed: action == .dismiss)
    }
}
