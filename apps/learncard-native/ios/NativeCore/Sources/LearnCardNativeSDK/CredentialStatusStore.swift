import Foundation
import Observation
import LearnCardNativeCore

/// Owned by one detail destination. Reads do not block the Passport or replace signed source data.
@MainActor @Observable public final class CredentialStatusStore {
    private let service: any CredentialService
    private let credentialID: String
    public private(set) var result: CredentialStatusCheck?
    public private(set) var loading = false
    public private(set) var refreshFailed = false
    public init(service: any CredentialService, credentialID: String) {
        self.service = service; self.credentialID = credentialID
    }
    public func check() async {
        guard !loading else { return }
        loading = true
        defer { loading = false }
        let next: CredentialStatusCheck
        do { next = try await service.credentialStatus(credentialID: credentialID) }
        catch { next = CredentialStatusCheck(state: .unavailable) }
        guard !Task.isCancelled else { return }
        if !next.confirmed, result?.confirmed == true {
            // An outage must not erase a previously confirmed revocation or imply reactivation.
            refreshFailed = true
        } else {
            result = next; refreshFailed = next.state == .unavailable
        }
    }
}
