import Foundation
import Observation
import LearnCardNativeCore

@MainActor @Observable public final class PeopleStore {
    private let service: any PeopleService
    private var generation = 0
    private var request = 0
    private var profileRequest = 0
    private var locked = false
    private var cursor: String?
    private var seenCursors: Set<String> = []
    public private(set) var scope = PeopleScope.connections
    public private(set) var query = ""
    public private(set) var items: [LearnCardPerson] = []
    public private(set) var detail: LearnCardPerson?
    public private(set) var loading = false
    public private(set) var detailLoading = false
    public private(set) var loaded = false
    public private(set) var hasMore = false
    public private(set) var limited = false
    public private(set) var busy = false
    public private(set) var revision = 0
    public var error: String?
    public var didChange: (@MainActor (LearnCardPerson) async -> Void)?
    public init(service: any PeopleService) { self.service = service }
    public func load(scope: PeopleScope = .connections, query: String = "", more: Bool = false) async {
        guard !locked, !busy, !more || (hasMore && !loading && scope == self.scope && query == self.query) else { return }
        request += 1; let token = request, expected = generation
        self.scope = scope; self.query = String(query.prefix(100)); loading = true; error = nil
        if !more { items = []; cursor = nil; seenCursors = []; loaded = false; hasMore = false; limited = false }
        defer { if expected == generation && token == request { loading = false } }
        do {
            let page = try await service.page(scope: scope, query: self.query, cursor: more ? cursor : nil)
            try check(expected); guard token == request else { return }
            if page.hasMore && (page.cursor == nil || seenCursors.contains(page.cursor!)) { throw PeopleError.connection }
            if let cursor = page.cursor, page.hasMore { seenCursors.insert(cursor) }
            var result = more ? items : []
            for person in page.items { result.removeAll { $0.id == person.id }; result.append(person) }
            items = result; cursor = page.cursor; hasMore = page.hasMore; limited = page.limited; loaded = true
        } catch { if expected == generation && token == request && !Task.isCancelled { self.error = friendly(error) } }
    }
    public func show(id: String) async {
        guard !locked, !busy else { return }
        profileRequest += 1; let sequence = profileRequest, expected = generation
        detail = nil; detailLoading = true; error = nil
        defer { if expected == generation && sequence == profileRequest { detailLoading = false } }
        do { let person = try await service.profile(id: id); try check(expected); if sequence == profileRequest { detail = person } }
        catch { if expected == generation && sequence == profileRequest && !Task.isCancelled { self.error = friendly(error) } }
    }
    public func act(_ action: PeopleAction) async -> Bool {
        guard !locked, !busy, !loading, !detailLoading, let detail else { return false }
        let expected = generation; busy = true; error = nil
        defer { if expected == generation { busy = false } }
        do {
            let next = try await service.act(id: detail.id, action: action); try check(expected)
            guard next.id == detail.id else { throw PeopleError.changed }
            self.detail = next; items.removeAll { $0.id == next.id }; loaded = false; revision += 1
            await didChange?(next); try check(expected)
            return true
        } catch { if expected == generation && !Task.isCancelled { self.error = friendly(error) }; return false }
    }
    public func invalidate() { guard !locked else { return }; generation += 1; busy = false; request += 1; profileRequest += 1; items = []; detail = nil; loading = false; detailLoading = false; loaded = false; hasMore = false; limited = false; error = nil; cursor = nil; seenCursors = []; revision += 1 }
    public func lock() {
        generation += 1; locked = true; request += 1; profileRequest += 1
        items = []; detail = nil; query = ""; cursor = nil; seenCursors = []; loading = false; detailLoading = false; busy = false; loaded = false; hasMore = false; limited = false; error = nil
    }
    private func check(_ expected: Int) throws { guard !locked, expected == generation, !Task.isCancelled else { throw AccountError.cancelled } }
    private func friendly(_ error: any Error) -> String { (error as? PeopleError)?.errorDescription ?? NativeText.text("people.error.connection") }
}
