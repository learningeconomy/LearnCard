import Foundation

public enum StagingResetError: String, Error, LocalizedError, Sendable {
    case confirmation, changed, connection, storage, recovery, unavailable
    public var errorDescription: String? { NativeText.text("reset.error.\(rawValue)") }
}
public struct StagingResetProgress: Decodable, Sendable, Equatable {
    public let stage: String
    public let profileId: String
    public init(stage: String, profileId: String) { self.stage = stage; self.profileId = profileId }
}
public enum StagingResetStorage {
    public static func key(userID: String) -> String { "reset:learncard:staging:\(userID)" }
}
public extension KeychainVault {
    /// Receipt remains until both old local access is removed and fresh-setup permission is saved.
    /// A partial Keychain failure is therefore retryable. Firebase credentials are never touched.
    func finishStagingReset(userID: String, now: Date = Date()) throws {
        guard let data = try read(StagingResetStorage.key(userID: userID)),
              let receipt = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              receipt["version"] as? Int == 1, receipt["uid"] as? String == userID,
              receipt["environment"] as? String == "staging", receipt["tenant"] as? String == "learncard",
              receipt["stage"] as? String == "local" else { throw StagingResetError.storage }
        try forgetAccount(userID: userID)
        let fresh = try JSONSerialization.data(withJSONObject: ["version": 1, "started": now.timeIntervalSince1970 * 1000, "fresh": true])
        try write(fresh, key: SignupStorage.key(userID: userID))
        try remove(StagingResetStorage.key(userID: userID))
    }
}
