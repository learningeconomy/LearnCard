import Foundation
import Security

public enum AccountError: Error, LocalizedError, Sendable {
    case connection, signIn, expired, storage, recovery, identity, unavailable, cancelled
    public var errorDescription: String? {
        switch self {
        case .connection: "Connection issue. Please check your internet and try again."
        case .signIn: "The code is incorrect or expired. Try again or request a new code."
        case .expired: "Sign in again to continue."
        case .storage: "Couldn't save access on this device. Please try again."
        case .recovery: "Couldn't restore access. Check your recovery information and try again."
        case .identity: "This recovery information doesn't match the account. Try another method."
        case .unavailable: "This action isn't available for this account yet."
        case .cancelled: "This request was cancelled. Please try again."
        }
    }
}

/// Foreground-only, device-bound storage. Never synchronizes recovery material through iCloud.
public actor KeychainVault {
    private let service: String
    public init(service: String = "org.learningeconomy.learncard.native.experiment.staging") { self.service = service }

    private func query(_ key: String) -> [String: Any] {
        [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service,
         kSecAttrAccount as String: key, kSecAttrSynchronizable as String: false]
    }

    public func read(_ key: String) throws -> Data? {
        var request = query(key)
        request[kSecReturnData as String] = true
        request[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        let status = SecItemCopyMatching(request as CFDictionary, &result)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess, let data = result as? Data else { throw AccountError.storage }
        return data
    }

    public func write(_ data: Data, key: String) throws {
        let attributes: [String: Any] = [kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly]
        let status = SecItemUpdate(query(key) as CFDictionary, attributes as CFDictionary)
        if status == errSecItemNotFound {
            let added = query(key).merging(attributes) { _, new in new }
            guard SecItemAdd(added as CFDictionary, nil) == errSecSuccess else { throw AccountError.storage }
        } else if status != errSecSuccess { throw AccountError.storage }
    }

    public func remove(_ key: String) throws {
        let status = SecItemDelete(query(key) as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else { throw AccountError.storage }
    }
}
