import Foundation
import Observation
import LearnCardNativeCore

@MainActor @Observable public final class FamiliesStore {
    private let service: any FamilyService
    private var generation = 0
    private var locked = false
    private var listRequest = 0
    private var detailRequest = 0
    public private(set) var families: [FamilySummary] = []
    public private(set) var details: [String: FamilyDetail] = [:]
    public private(set) var loaded = false
    public private(set) var loading = false
    public private(set) var detailLoading = false
    public private(set) var busy = false
    public var error: String?
    public var notice: String?
    public init(service: any FamilyService) { self.service = service }
    public func load() async {
        guard !locked else { return }
        listRequest += 1
        let expected = generation, request = listRequest; loading = true; error = nil
        defer { if expected == generation && request == listRequest { loading = false } }
        do {
            let values = try await service.families()
            try check(expected); guard request == listRequest else { return }
            families = values; loaded = true
        } catch { if expected == generation && request == listRequest && !Task.isCancelled { self.error = friendly(error) } }
    }
    public func loadDetail(_ id: String) async {
        guard !locked else { return }
        detailRequest += 1
        let expected = generation, request = detailRequest; detailLoading = true; error = nil
        defer { if expected == generation && request == detailRequest { detailLoading = false } }
        do {
            let value = try await service.detail(id); try check(expected)
            guard request == detailRequest, value.id == id else { return }; details[id] = value
        } catch { if expected == generation && request == detailRequest && !Task.isCancelled { self.error = friendly(error) } }
    }
    public func hasPin() async throws -> Bool { let expected = generation; try check(expected); let result = try await service.hasPin(); try check(expected); return result }
    public func create(_ draft: FamilyDraft, pin: String, confirmation: String) async -> FamilyDetail? {
        await action { try await self.service.create(draft, pin: pin, confirmation: confirmation) }
    }
    public func edit(_ id: String, draft: FamilyDraft) async -> FamilyDetail? {
        await action { try await self.service.edit(id, draft: draft) }
    }
    public func invite(_ id: String, recipient: String, requestID: String, pin: String) async -> Bool {
        guard !busy, !locked else { return false }
        let expected = generation; busy = true; error = nil; notice = nil
        defer { if expected == generation { busy = false } }
        do {
            try await service.invite(id, recipient: recipient, requestID: requestID, pin: pin); try check(expected)
            notice = NativeText.text("family.invite.sent"); return true
        } catch { if expected == generation && !Task.isCancelled { self.error = friendly(error) }; return false }
    }
    public func lock() {
        generation += 1; listRequest += 1; detailRequest += 1
        locked = true
        families = []; details = [:]; loaded = false; loading = false; detailLoading = false; busy = false; error = nil; notice = nil
    }
    private func action(_ operation: () async throws -> FamilyDetail) async -> FamilyDetail? {
        guard !busy, !locked else { return nil }
        let expected = generation; busy = true; error = nil
        defer { if expected == generation { busy = false } }
        do {
            let value = try await operation(); try check(expected); details[value.id] = value
            families.removeAll { $0.id == value.id }; families.append(value.summary)
            return value
        } catch { if expected == generation && !Task.isCancelled { self.error = friendly(error) }; return nil }
    }
    private func check(_ expected: Int) throws { guard !locked, expected == generation, !Task.isCancelled else { throw AccountError.cancelled } }
    private func friendly(_ error: any Error) -> String { (error as? FamilyError)?.errorDescription ?? NativeText.text("family.error.connection") }
}
