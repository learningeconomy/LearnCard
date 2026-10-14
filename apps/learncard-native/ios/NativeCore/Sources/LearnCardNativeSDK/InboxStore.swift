import Foundation
import Observation
import LearnCardNativeCore

@MainActor @Observable public final class InboxStore {
    private let service: any InboxService
    private var generation = 0
    private var request = 0
    private var locked = false
    private var cursor: String?
    private var receipts: [String: InboxItem.Status] = [:]
    public private(set) var items: [InboxItem] = []
    public private(set) var postClaimPrompts: [InboxItem] = []
    public private(set) var hasMore = false
    public private(set) var loaded = false
    public private(set) var loading = false
    public private(set) var busyID: String?
    public var error: String?
    public var metadataPending = false
    public var unreadCount: Int { items.filter { !$0.read }.count }
    public func updates(excluding pendingCredentialIDs: Set<String>) -> [InboxItem] {
        items.filter { item in
            !["CREDENTIAL_RECEIVED", "BOOST_RECEIVED"].contains(item.type) ||
                Set(item.credentialURIs ?? []).isDisjoint(with: pendingCredentialIDs)
        }
    }
    public init(service: any InboxService) { self.service = service }
    public func load(more: Bool = false) async {
        guard !locked, busyID == nil, !loading, !more || hasMore else { return }
        request += 1; let expected = generation, sequence = request
        loading = true; error = nil
        defer { if expected == generation && sequence == request { loading = false } }
        do {
            let page = try await service.page(cursor: more ? cursor : nil); try check(expected)
            guard sequence == request else { return }
            if page.hasMore && (page.cursor == nil || (more && page.cursor == cursor)) { throw InboxError.connection }
            var values = more ? items : []
            for item in page.items {
                // A later notification replaces a synthetic request, and prompt notifications
                // replace their server-only row rather than doubling the badge.
                values.removeAll { $0.id == item.id || (item.promptID != nil && $0.promptID == item.promptID) ||
                    (item.kind == .request && $0.kind == .request && $0.profileID == item.profileID) }
                values.append(reconciled(item))
            }
            items = values; postClaimPrompts = page.postClaimPrompts.map(reconciled).filter(\.actionable)
            hasMore = page.hasMore; cursor = page.cursor; loaded = true
        } catch { if expected == generation && !Task.isCancelled { self.error = friendly(error) } }
    }
    public func act(_ item: InboxItem, _ action: InboxAction) async -> Bool {
        guard !locked, !loading, busyID == nil, items.contains(where: { $0.id == item.id }) || postClaimPrompts.contains(where: { $0.id == item.id }) else { return false }
        let expected = generation; busyID = item.id; error = nil
        defer { if expected == generation { busyID = nil } }
        do {
            let outcome = try await service.act(id: item.id, action: action); try check(expected)
            metadataPending = outcome.metadataPending
            if action == .connect || action == .skip || action == .accept { receipts[item.promptID ?? item.id] = outcome.status }
            items = items.compactMap { value in
                guard value.id == item.id || (item.promptID != nil && value.promptID == item.promptID) else { return value }
                if outcome.dismissed { return nil }; var next = value; next.read = true; next.status = outcome.status; return next
            }
            postClaimPrompts.removeAll { $0.id == item.id || (item.promptID != nil && $0.promptID == item.promptID) }
            return true
        } catch { if expected == generation && !Task.isCancelled { self.error = friendly(error) }; return false }
    }
    public func afterClaim() async {
        if let demo = service as? DemoInboxService { await demo.afterClaim() }
        await load()
    }
    public func lock() {
        generation += 1; request += 1; locked = true; items = []; postClaimPrompts = []; receipts = [:]
        cursor = nil; loaded = false; loading = false; hasMore = false; busyID = nil; error = nil; metadataPending = false
    }
    private func reconciled(_ item: InboxItem) -> InboxItem {
        var value = item
        if value.status == .pending, let status = receipts[value.promptID ?? value.id] { value.status = status; value.read = true }
        return value
    }
    private func check(_ expected: Int) throws { guard !locked, expected == generation, !Task.isCancelled else { throw AccountError.cancelled } }
    private func friendly(_ error: any Error) -> String { (error as? InboxError)?.errorDescription ?? NativeText.text("inbox.error.connection") }
}
