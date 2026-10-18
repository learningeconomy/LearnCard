import Foundation

/// Independent of signature validity, issuer trust and expiry. Successful results are point-in-time reads.
public struct CredentialStatusCheck: Codable, Hashable, Sendable {
    public enum State: String, Codable, Sendable { case active, revoked, suspended, unavailable, notProvided }
    public enum Source: String, Codable, Sendable { case network, statusList }
    public enum Purpose: String, Codable, Sendable { case revocation, suspension }
    public var state: State
    public var source: Source?
    public var checkedAt: Date?
    public var purposes: [Purpose]
    public var confirmed: Bool {
        guard source != nil, checkedAt != nil else { return false }
        switch state {
        case .active: return !purposes.isEmpty
        case .revoked: return purposes.contains(.revocation)
        case .suspended: return purposes.contains(.suspension)
        case .unavailable, .notProvided: return false
        }
    }
    public init(state: State, source: Source? = nil, checkedAt: Date? = nil, purposes: [Purpose] = []) {
        self.state = state; self.source = source; self.checkedAt = checkedAt; self.purposes = purposes
    }
}
