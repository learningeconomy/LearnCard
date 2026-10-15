import Foundation
import Observation

/// Read-only collection paging for the sharing picker. Stops on failure/cancellation; never retries in a loop.
@MainActor @Observable public final class CredentialPickerLoader {
    public private(set) var loading = false
    public private(set) var failed = false
    private let app: NativeAppStore
    public init(app: NativeAppStore) { self.app = app }

    public func load(remaining: Bool = false, retry: Bool = false) async {
        // A filter can be applied while the bottom row is already fetching a page.
        // Wait for that read rather than losing the request to search the remaining pages.
        while loading || app.isBusy {
            do { try await Task.sleep(for: .milliseconds(50)) } catch { return }
        }
        guard !Task.isCancelled, !failed || retry else { return }
        loading = true; failed = false
        let initialCount = app.snapshot?.credentials.count
        defer { loading = false }
        repeat {
            guard !Task.isCancelled, app.snapshot?.hasMore == true else { return }
            let success = await app.loadMore()
            guard success else { failed = !Task.isCancelled; return }
            // Give cancellation and changed search modes a chance to stop between pages.
            await Task.yield()
        } while remaining || app.snapshot?.credentials.count == initialCount
    }
}
