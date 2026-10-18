import Foundation
import Observation
import LearnCardNativeCore

@MainActor @Observable public final class LearnerStore {
    private let service: any LearnerService
    private var generation = 0
    private var cursor: String?
    private var seenCursors = Set<String>()
    public private(set) var skills: [LearnerSkill] = []
    public private(set) var loading = false
    public private(set) var loaded = false
    public private(set) var hasMore = false
    public private(set) var unavailable = 0
    public private(set) var error: LearnerError?
    public private(set) var goals: LearnerGoals?
    public private(set) var goalsLoading = false
    public private(set) var goalsError: LearnerError?
    public private(set) var saving = false
    public private(set) var saveError: LearnerError?
    public init(service: any LearnerService) { self.service = service }

    public func load(reset: Bool = false) async {
        guard !loading, reset || !loaded || hasMore else { return }
        let expected = generation; loading = true
        defer { if expected == generation { loading = false } }
        do {
            let page = try await service.skills(cursor: reset ? nil : cursor)
            guard expected == generation, !Task.isCancelled else { return }
            if page.hasMore {
                guard let next = page.cursor, !next.isEmpty, reset || !seenCursors.contains(next) else { throw LearnerError.connection }
            }
            var merged = reset ? [] : skills
            for item in page.skills {
                if let index = merged.firstIndex(where: { $0.id == item.id }) {
                    for source in item.sources where !merged[index].sources.contains(where: { $0.id == source.id }) { merged[index].sources.append(source) }
                } else {
                    var unique = item; var ids = Set<String>(); unique.sources = item.sources.filter { ids.insert($0.id).inserted }; merged.append(unique)
                }
            }
            if reset { seenCursors = [] }
            if let next = page.cursor { seenCursors.insert(next) }
            skills = merged; cursor = page.cursor; hasMore = page.hasMore; unavailable = (reset ? 0 : unavailable) + page.unavailable; loaded = true; error = nil
        } catch { if expected == generation, !Task.isCancelled { self.error = error as? LearnerError ?? .connection } }
    }
    public func loadGoals() async {
        guard !goalsLoading, !saving else { return }; let expected = generation; goalsLoading = true
        defer { if expected == generation { goalsLoading = false } }
        do { let next = try await service.goals(); guard expected == generation, !Task.isCancelled else { return }; goals = next; goalsError = nil }
        catch { if expected == generation, !Task.isCancelled { goalsError = error as? LearnerError ?? .connection } }
    }
    public func saveGoals(_ draft: [String], revision: String) async -> Bool {
        guard !saving, goals != nil else { return false }
        let expected = generation; saving = true; saveError = nil
        defer { if expected == generation { saving = false } }
        do { let next = try await service.saveGoals(draft, revision: revision); guard expected == generation else { return false }; goals = next; return true }
        catch { if expected == generation { saveError = error as? LearnerError ?? .connection }; return false }
    }
    public func clearSaveError() { saveError = nil }
    public func source(id: String) async throws -> Credential {
        let expected = generation; let value = try await service.source(id: id)
        guard expected == generation, !Task.isCancelled else { throw LearnerError.signIn }; return value
    }
    public func lock() {
        generation += 1; cursor = nil; seenCursors = []; skills = []; loading = false; loaded = false; hasMore = false; unavailable = 0; error = nil; goals = nil; goalsLoading = false; goalsError = nil; saving = false; saveError = nil
    }
}
