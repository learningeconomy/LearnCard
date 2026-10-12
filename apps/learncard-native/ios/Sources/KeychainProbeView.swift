#if DEBUG
import SwiftUI
import Security
import LearnCardNativeSDK

/// Test-only app-process probe. Uses disposable synthetic values and its own service.
struct KeychainProbeView: View {
    @State private var result = "Checking device storage…"
    var body: some View {
        Text(result).accessibilityIdentifier("keychain-probe-result").task { await check() }
    }

    @MainActor private func check() async {
        let service = "org.learncard.native.ios-keychain-tests.\(UUID())"
        let vault = KeychainVault(service: service)
        do {
            try await vault.write(Data("synthetic-share-one".utf8), key: "user-one")
            guard try await vault.read("user-two") == nil else { throw AccountError.storage }
            let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
                kSecAttrService as String: service, kSecAttrAccount as String: "user-one",
                kSecReturnAttributes as String: true]
            var attributes: CFTypeRef?
            guard SecItemCopyMatching(query as CFDictionary, &attributes) == errSecSuccess,
                  (attributes as? [String: Any])?[kSecAttrAccessible as String] as? String == kSecAttrAccessibleWhenUnlockedThisDeviceOnly as String else { throw AccountError.storage }
            try await vault.write(Data("synthetic-share-updated".utf8), key: "user-one")
            guard try await KeychainVault(service: service).read("user-one") == Data("synthetic-share-updated".utf8) else { throw AccountError.storage }
            try await vault.remove("user-one")
            guard try await vault.read("user-one") == nil else { throw AccountError.storage }
            result = "Device-only storage verified"
        } catch {
            try? await vault.remove("user-one")
            result = "Device storage check failed"
        }
    }
}
#endif
