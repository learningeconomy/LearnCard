import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

@main
struct LearnCardNativeApp: App {
    @State private var store = AppStore()

    var body: some Scene {
        WindowGroup {
            Group {
                #if DEBUG
                if ProcessInfo.processInfo.arguments.contains("--keychain-probe") { KeychainProbeView() }
                else { client }
                #else
                client
                #endif
            }
                .tint(Palette.brandGreen)
                .preferredColorScheme(ProcessInfo.processInfo.arguments.contains("--preview-dark") ? .dark : nil)
        }
    }

    @ViewBuilder private var client: some View {
                if ProcessInfo.processInfo.arguments.contains("--demo") { RootView(store: store) }
                else { AccountRootView() }
    }
}

@MainActor @Observable
final class AppStore {
    private let service: any CredentialService
    var snapshot: CollectionSnapshot?
    var isBusy = false
    var error: String?
    var notice: String?
    let isLive: Bool

    init(service: any CredentialService = DemoCredentialService(), isLive: Bool = false) {
        self.service = service
        self.isLive = isLive
    }

    func refresh() async {
        _ = await perform { try await self.service.snapshot() }
    }

    func claim(_ credential: Credential) async -> Bool {
        let success = await perform { try await self.service.claim(offerID: credential.id) }
        if success { notice = isLive ? "Credential added to your collection." : "Sample added to your collection." }
        return success
    }

    func create(title: String, summary: String, kind: CredentialKind) async -> Bool {
        let success = await perform { try await self.service.create(title: title, summary: summary, kind: kind) }
        if success { notice = isLive ? "Credential created and saved to your collection." : "Sample created. Open it to try sending." }
        return success
    }

    func create(draft: CredentialDraft) async -> Bool {
        let success = await perform { try await self.service.create(draft: draft) }
        if success { notice = draft.recipient == nil ? (isLive ? "Credential created and added to your collection." : "Sample created. Open it to try sending.") : (isLive ? "Credential created and sent." : "Sample send recorded. No message was delivered.") }
        return success
    }

    func creations(cursor: String? = nil) async throws -> CreationPage { try await service.creations(cursor: cursor) }
    func searchRecipients(_ query: String) async throws -> [AccountRecipient] {
        if let live = service as? LiveCredentialService { return try await live.searchRecipients(query) }
        return [AccountRecipient(id: "Alex Morgan", name: "Alex Morgan"), AccountRecipient(id: "Jordan Lee", name: "Jordan Lee")]
    }

    func send(_ credential: Credential, to recipient: String) async -> Bool {
        let success = await perform { try await self.service.send(credentialID: credential.id, recipient: recipient) }
        if success { notice = isLive ? "Credential sent." : "Sample send recorded. No message was delivered." }
        return success
    }

    func share(credentialIDs: [String], title: String, requestID: String, passcode: String?) async throws -> CredentialShare {
        guard !isBusy else { throw AccountError.unavailable }
        isBusy = true; defer { isBusy = false }
        return try await service.share(credentialIDs: credentialIDs, title: title, requestID: requestID, passcode: passcode)
    }

    func loadMore() async { _ = await perform { try await self.service.loadMore() } }

    func recipient(_ profileId: String) async throws -> AccountRecipient {
        guard let service = service as? LiveCredentialService else { throw AccountError.unavailable }
        return try await service.recipient(profileId)
    }

    private func perform(_ operation: () async throws -> CollectionSnapshot) async -> Bool {
        guard !isBusy else { return false }
        isBusy = true
        error = nil
        defer { isBusy = false }
        do {
            snapshot = try await operation()
            return true
        } catch is CancellationError {
            return false
        } catch let clientError as ClientError {
            error = clientError.errorDescription
        } catch let accountError as AccountError {
            error = accountError.errorDescription
        } catch {
            self.error = "Something went wrong. Please try again."
        }
        return false
    }
}
