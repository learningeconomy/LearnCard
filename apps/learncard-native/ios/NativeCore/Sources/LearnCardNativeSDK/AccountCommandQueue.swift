import Foundation

/// Serialize facade calls across independent SwiftUI features. Closing the host rejects
/// every waiter; a cancelled read must not later execute as a queued write.
@MainActor final class AccountCommandQueue {
    private var occupied = false
    private var closed = false
    private var waiters: [(UUID, CheckedContinuation<Void, Error>)] = []
    var waitingCount: Int { waiters.count }
    func acquire() async throws {
        guard !closed, !Task.isCancelled else { throw AccountError.cancelled }
        if !occupied { occupied = true; return }
        guard waiters.count < 16 else { throw AccountError.unavailable }
        let id = UUID()
        try await withTaskCancellationHandler {
            try await withCheckedThrowingContinuation { continuation in waiters.append((id, continuation)) }
            guard !Task.isCancelled else { release(); throw AccountError.cancelled }
        } onCancel: {
            Task { @MainActor [weak self] in self?.cancel(id) }
        }
    }
    func release() {
        if !waiters.isEmpty { waiters.removeFirst().1.resume() }
        else { occupied = false }
    }
    func dispose() {
        closed = true
        let pending = waiters; waiters = []
        for (_, waiter) in pending { waiter.resume(throwing: AccountError.cancelled) }
    }
    private func cancel(_ id: UUID) {
        guard let index = waiters.firstIndex(where: { $0.0 == id }) else { return }
        waiters.remove(at: index).1.resume(throwing: AccountError.cancelled)
    }
}
