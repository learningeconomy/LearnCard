import Foundation
import Observation

@MainActor @Observable public final class CareerStore {
    private let service: any CareerService
    private var generation = 0
    public private(set) var access: CareerAccess?
    public private(set) var checking = false
    public private(set) var loading = false
    public private(set) var error: CareerError?
    public private(set) var query = ""
    public private(set) var attemptedQuery = ""
    public private(set) var result: CareerSearchResult?
    public private(set) var programs: [String: CareerProgramsResult] = [:]
    public private(set) var programErrors: [String: CareerError] = [:]
    public private(set) var loadingProgram: String?
    public init(service: any CareerService) { self.service = service }
    public func checkAccess() async {
        guard !checking else { return }; let expected = generation; checking = true
        defer { if expected == generation { checking = false } }
        do {
            let value = try await service.access(); guard expected == generation, !Task.isCancelled else { return }
            access = value; error = value.error
            if !value.enabled { clearContent() }
        } catch { if expected == generation, !Task.isCancelled { access = nil; self.error = error as? CareerError ?? .connection; clearContent() } }
    }
    public func search(_ text: String) async {
        let input = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !loading, !checking, input.count >= 2, input.utf16.count <= 100, access?.enabled == true else { return }
        generation += 1; let expected = generation; loading = true; loadingProgram = nil; attemptedQuery = input; error = nil
        defer { if expected == generation { loading = false } }
        do {
            let next = try await service.search(input); guard expected == generation, !Task.isCancelled, access?.enabled == true else { return }
            result = next; query = input; programs = [:]; programErrors = [:]
        } catch { if expected == generation, !Task.isCancelled { handle(error) } }
    }
    public func loadPrograms(_ id: String) async {
        guard loadingProgram == nil, access?.enabled == true, result?.occupations.contains(where: { $0.id == id }) == true else { return }
        let expected = generation; loadingProgram = id; programErrors[id] = nil
        defer { if expected == generation { loadingProgram = nil } }
        do { let next = try await service.programs(id); guard expected == generation, !Task.isCancelled, access?.enabled == true else { return }; programs[id] = next }
        catch { if expected == generation, !Task.isCancelled { let failure = error as? CareerError ?? .connection; programErrors[id] = failure; if failure.blocksAccess { handle(failure) } } }
    }
    public func clearSearch() { generation += 1; checking = false; loading = false; loadingProgram = nil; attemptedQuery = ""; error = access?.error; clearContent() }
    public func lock() { generation += 1; access = nil; checking = false; loading = false; loadingProgram = nil; error = nil; attemptedQuery = ""; clearContent() }
    private func clearContent() { query = ""; result = nil; programs = [:]; programErrors = [:] }
    private func handle(_ error: any Error) {
        let failure = error as? CareerError ?? .connection; self.error = failure
        if failure.blocksAccess { access = CareerAccess(reason: failure.rawValue); clearContent() }
    }
}
