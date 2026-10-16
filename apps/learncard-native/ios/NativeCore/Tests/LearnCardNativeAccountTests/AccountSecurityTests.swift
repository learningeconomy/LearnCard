import Foundation
import XCTest
import Security
@testable import LearnCardNativeSDK

private final class FirebaseStub: URLProtocol, @unchecked Sendable {
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func stopLoading() {}
    override func startLoading() {
        let path = request.url!.path
        let payload: String
        if path.hasSuffix("send-login-verification-code") { payload = "{\"success\":true}" }
        else if path.hasSuffix("verify-login-code") { payload = "{\"success\":true,\"token\":\"synthetic-custom-token\"}" }
        else if path.hasSuffix("accounts:signInWithCustomToken") {
            payload = "{\"idToken\":\"synthetic-id-token\",\"refreshToken\":\"synthetic-refresh-token\",\"expiresIn\":\"0\"}"
        } else if path.hasSuffix("accounts:lookup") {
            let email = request.value(forHTTPHeaderField: "X-Test-Email") ?? (try? AccountConfiguration.load())?.testEmail ?? "native-test@example.invalid"
            payload = String(data: try! JSONSerialization.data(withJSONObject: ["users": [["localId": "synthetic-user", "email": email, "createdAt": "1600000000000"]]]), encoding: .utf8)!
        } else if path == "/v1/token" {
            payload = "{\"id_token\":\"synthetic-refreshed-token\",\"refresh_token\":\"synthetic-refresh-token-2\",\"expires_in\":\"3600\",\"user_id\":\"synthetic-user\",\"project_id\":\"776298253175\"}"
        } else { XCTFail("Unexpected test endpoint"); payload = "{}" }
        let send: @Sendable () -> Void = {
            let response = HTTPURLResponse(url: self.request.url!, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: ["Content-Type": "application/json"])!
            self.client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            self.client?.urlProtocol(self, didLoad: Data(payload.utf8))
            self.client?.urlProtocolDidFinishLoading(self)
        }
        if request.value(forHTTPHeaderField: "X-Test-Delay") != nil, path.hasSuffix("verify-login-code") {
            DispatchQueue.global().asyncAfter(deadline: .now() + 0.3, execute: send)
        } else { send() }
    }
}

final class AccountSecurityTests: XCTestCase {
    func testSSSRecoveryTokenHeaderOnlyGoesToAccountAPI() {
        let api = URL(string: "https://staging.api.learncard.app/api/keys/recovery")!
        let cloud = URL(string: "https://staging.cloud.learncard.com/trpc")!
        XCTAssertTrue(StagingTransport.permitsHeader("X-Auth-Token", url: api, accountHost: true))
        XCTAssertFalse(StagingTransport.permitsHeader("X-Auth-Token", url: api, accountHost: false))
        XCTAssertFalse(StagingTransport.permitsHeader("X-Auth-Token", url: cloud, accountHost: true))
        XCTAssertFalse(StagingTransport.permitsHeader("Cookie", url: api, accountHost: true))
    }
    func testAccountAndPendingSharesCannotCrossUIDScope() throws {
        let a = try AccountStorageScope.key(userID: "one", id: nil, field: "share")
        let b = try AccountStorageScope.key(userID: "two", id: nil, field: "share")
        XCTAssertNotEqual(a, b)
        XCTAssertThrowsError(try AccountStorageScope.key(userID: "one", id: "sss-device-share:two", field: "share"))
        XCTAssertThrowsError(try AccountStorageScope.key(userID: "one", id: "sss-pending-share:sss-device-share:two", field: "share"))
        XCTAssertThrowsError(try AccountStorageScope.key(userID: "one", id: nil, field: "privateKey"))
        XCTAssertNoThrow(try AccountStorageScope.key(userID: "one", id: "sss-pending-share:sss-device-share:one", field: "share"))
    }

    func testKeychainRoundTripIsolationAndDeviceOnlyAccessibility() async throws {
        let service = "org.learncard.native.security-tests.\(UUID())"
        let vault = KeychainVault(service: service)
        try await vault.write(Data("public-test-share".utf8), key: "account-one")
        let one = try await vault.read("account-one")
        let two = try await vault.read("account-two")
        XCTAssertEqual(one, Data("public-test-share".utf8)); XCTAssertNil(two)
        let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service, kSecAttrAccount as String: "account-one", kSecReturnAttributes as String: true]
        var result: CFTypeRef?
        XCTAssertEqual(SecItemCopyMatching(query as CFDictionary, &result), errSecSuccess)
        // macOS's legacy login keychain omits iOS accessibility attributes.
        #if os(iOS)
        XCTAssertEqual((result as? [String: Any])?[kSecAttrAccessible as String] as? String, kSecAttrAccessibleWhenUnlockedThisDeviceOnly as String)
        #endif
        try await vault.remove("account-one")
        let removed = try await vault.read("account-one")
        XCTAssertNil(removed)
    }

    func testFirebaseCustomTokenRefreshRestartAndSignOut() async throws {
        let vault = KeychainVault(service: "org.learncard.native.firebase-tests.\(UUID())")
        let config = URLSessionConfiguration.ephemeral; config.protocolClasses = [FirebaseStub.self]
        let http = URLSession(configuration: config)
        let firebase = try FirebaseSession(vault: vault, http: http)
        let user = try await firebase.verify(code: "123456")
        XCTAssertEqual(user.id, "synthetic-user")
        let refreshed = try await firebase.idToken()
        XCTAssertEqual(refreshed, "synthetic-refreshed-token")
        let restarted = try FirebaseSession(vault: vault, http: http)
        let resumed = try await restarted.resume()
        XCTAssertEqual(resumed?.id, user.id)
        try await restarted.signOut()
        let signedOut = try await FirebaseSession(vault: vault, http: http).resume()
        XCTAssertNil(signedOut)
    }

    func testGeneralEmailSignInAndResumeUseVerifiedAccountInsteadOfConfiguredPrefill() async throws {
        let vault = KeychainVault(service: "org.learncard.native.general-email-tests.\(UUID())")
        let config = URLSessionConfiguration.ephemeral; config.protocolClasses = [FirebaseStub.self]
        config.httpAdditionalHeaders = ["X-Test-Email": "another@example.com"]
        let http = URLSession(configuration: config)
        let firebase = try FirebaseSession(vault: vault, http: http)
        try await firebase.sendCode(email: " Another@Example.com ")
        let user = try await firebase.verify(code: "123456"); XCTAssertEqual(user.email, "another@example.com")
        let restarted = try FirebaseSession(vault: vault, http: http)
        let resumed = try await restarted.resume(); XCTAssertEqual(resumed?.email, user.email)
        try await restarted.signOut()
    }
    func testGeneralEmailExchangeCannotSaveAnotherAccountsLookup() async throws {
        let vault = KeychainVault(service: "org.learncard.native.mismatch-email-tests.\(UUID())")
        let config = URLSessionConfiguration.ephemeral; config.protocolClasses = [FirebaseStub.self]
        config.httpAdditionalHeaders = ["X-Test-Email": "someone-else@example.com"]
        let http = URLSession(configuration: config), firebase = try FirebaseSession(vault: vault, http: http)
        try await firebase.sendCode(email: "intended@example.com")
        do { _ = try await firebase.verify(code: "123456"); XCTFail("Mismatched identity must be refused") }
        catch { XCTAssertEqual(error as? AccountError, .identity) }
        let resumed = try await FirebaseSession(vault: vault, http: http).resume(); XCTAssertNil(resumed)
    }

    func testSignOutCannotBeUndoneByAnEarlierSignInResponse() async throws {
        let vault = KeychainVault(service: "org.learncard.native.race-tests.\(UUID())")
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [FirebaseStub.self]
        config.httpAdditionalHeaders = ["X-Test-Delay": "true"]
        let firebase = try FirebaseSession(vault: vault, http: URLSession(configuration: config))
        let login = Task { try await firebase.verify(code: "123456") }
        try await Task.sleep(for: .milliseconds(100))
        try await firebase.signOut()
        do { _ = try await login.value; XCTFail("Old sign-in must be cancelled") }
        catch { XCTAssertEqual(error as? AccountError, .cancelled) }
        let resumed = try await FirebaseSession(vault: vault).resume()
        XCTAssertNil(resumed)
    }
}
