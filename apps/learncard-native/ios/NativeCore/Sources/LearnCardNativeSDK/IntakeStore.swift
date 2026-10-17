import Foundation
import Observation

@MainActor @Observable public final class IntakeStore {
    private let service: any IntakeService
    private var generation = 0
    private var sampleGeneration = 0
    public private(set) var status: IntakeStatus?
    public private(set) var review: IntakeReview?
    public private(set) var result: IntakeResult?
    public private(set) var samples: [SampleCredentialBundle] = []
    public private(set) var samplesLoading = false
    public private(set) var sampleBusy = false
    public private(set) var samplePreparing = false
    public func beginSamplePreparation(id: String) {
        guard !sampleBusy, !samplePreparing else { return }
        samplePreparing = true; syncingSampleID = id; sampleNoticeDismissed = false
        sampleResult = nil; sampleSyncError = nil; sampleError = nil; sampleProgress = nil
    }
    public func endSamplePreparation(id: String, error: ConsumerAppError?) {
        guard samplePreparing, syncingSampleID == id else { return }
        samplePreparing = false
        if let error { sampleSyncError = error; sampleError = error }
    }
    public private(set) var sampleError: ConsumerAppError?
    public private(set) var sampleSyncError: ConsumerAppError?
    public private(set) var sampleResult: IntakeResult?
    public private(set) var sampleProgress: SampleSyncProgress?
    public private(set) var syncingSampleID: String?
    public private(set) var sampleNoticeDismissed = false
    public var hasSampleNotice: Bool { !sampleNoticeDismissed && (samplePreparing || sampleBusy || sampleResult != nil || sampleSyncError != nil) }
    public func dismissSampleNotice() { if !samplePreparing && !sampleBusy { sampleNoticeDismissed = true } }
    public var selected = Set<String>()
    public private(set) var busy = false
    public private(set) var loading = false
    public private(set) var error: IntakeError?
    public init(service: any IntakeService) { self.service = service }
    public var canSave: Bool { !busy && review != nil && (review?.kind != .rawVC || !selected.isEmpty) }
    public func load() async {
        guard !loading else { return }; let expected = generation; loading = true
        defer { if expected == generation { loading = false } }
        do { let value = try await service.status(); guard expected == generation else { return }; status = value; error = nil }
        catch { if expected == generation { self.error = error as? IntakeError ?? .connection } }
    }
    public func loadSamples() async {
        guard !samplesLoading else { return }; let expected = sampleGeneration; samplesLoading = true; sampleError = nil
        defer { if expected == sampleGeneration { samplesLoading = false } }
        do { let value = try await service.samples(); guard expected == sampleGeneration, !Task.isCancelled else { return }; samples = value }
        catch { if expected == sampleGeneration, !Task.isCancelled { sampleError = error as? ConsumerAppError ?? .connection } }
    }
    public func syncSample(id: String) async {
        guard !sampleBusy else { return }; let expected = sampleGeneration; sampleBusy = true; sampleError = nil; sampleSyncError = nil; sampleResult = nil; sampleNoticeDismissed = false; syncingSampleID = id
        sampleProgress = SampleSyncProgress(processed: 0, total: samples.first(where: { $0.id == id })?.expected ?? 0)
        defer { if expected == sampleGeneration { sampleBusy = false } }
        do {
            let value = try await service.syncSample(id: id, progress: { [weak self] value in
                await self?.receiveSampleProgress(value, generation: expected)
            }); guard expected == sampleGeneration else { return }
            sampleResult = value
            await loadSamples()
        } catch { if expected == sampleGeneration { sampleSyncError = error as? ConsumerAppError ?? .connection; sampleError = sampleSyncError } }
    }
    private func receiveSampleProgress(_ value: SampleSyncProgress, generation: Int) {
        guard generation == sampleGeneration, sampleBusy else { return }
        sampleProgress = value
    }
    public var completedDocumentKinds: Int {
        IntakeKind.allCases.filter { $0 != .rawVC && (status?.counts[$0.rawValue] ?? 0) > 0 }.count
    }
    public func prepare(_ file: IntakeFile, kind: IntakeKind) async {
        guard !busy else { return }; let expected = generation; busy = true; error = nil; review = nil; result = nil; selected = []
        defer { if expected == generation { busy = false } }
        do { let value = try await service.prepare(file, kind: kind); guard expected == generation else { await service.discard(id: value.id); return }; review = value; selected = Set(value.candidates.filter(\.eligible).map(\.id)) }
        catch { if expected == generation { self.error = error as? IntakeError ?? .connection } }
    }
    public func save() async {
        guard canSave, let review else { return }; let expected = generation; busy = true; error = nil
        defer { if expected == generation { busy = false } }
        do {
            let value = try await service.commit(id: review.id, selected: selected.sorted()); guard expected == generation else { return }
            result = value
            if value.failed > 0 { error = .connection }
            await load()
            guard expected == generation else { return }
            if value.failed > 0 { error = .connection }
        } catch { if expected == generation { self.error = error as? IntakeError ?? .connection } }
    }
    public func document(id: String) async throws -> IntakeDocumentData {
        let expected = generation; let value = try await service.document(id: id)
        guard expected == generation else { throw IntakeError.changed }; return value
    }
    public func report(_ error: any Error) { self.error = error as? IntakeError ?? .file }
    public func clearReview() {
        if let id = review?.id { let service = service; Task { await service.discard(id: id) } }
        generation += 1; busy = false; loading = false; review = nil; result = nil; selected = []; error = nil
    }
    public func lock() { sampleGeneration += 1; samplesLoading = false; sampleBusy = false; samplePreparing = false; clearReview(); status = nil; samples = []; sampleResult = nil; sampleError = nil; sampleSyncError = nil; sampleProgress = nil; syncingSampleID = nil; sampleNoticeDismissed = false }
}
