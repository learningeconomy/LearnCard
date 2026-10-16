import Foundation
import CryptoKit
import XCTest
import LearnCardNativeCore
@testable import LearnCardNativeSDK

private let clientID = "776298253175-synthetic.apps.googleusercontent.com"
private let scheme = "com.googleusercontent.apps.776298253175-synthetic"

final class GoogleSignInTests: XCTestCase {
    func testProviderCallbacksCannotFallThroughIntoCredentialClaimRouting() throws {
        let data = try JSONSerialization.data(withJSONObject: ["bundleID": "native.test", "appleEnabled": false, "googleClientID": clientID])
        let config = try JSONDecoder().decode(NativeOAuthConfiguration.self, from: data)
        XCTAssertTrue(config.handlesCallback(URL(string: "\(scheme):/oauth2redirect?code=synthetic&state=stale")!))
        XCTAssertTrue(config.handlesCallback(URL(string: "\(scheme):/malformed")!))
        XCTAssertFalse(config.handlesCallback(URL(string: "learncard-lab://claim?boostUri=synthetic&challenge=synthetic")!))
        XCTAssertFalse(config.handlesCallback(URL(string: "https://staging.learncard.app/claim/boost")!))
    }
    func testInstalledFlowUsesIndependentStateNonceAndS256WithoutOfflineAccess() throws {
        let one = try GoogleSignInAttempt(clientID: clientID, scheme: scheme)
        let two = try GoogleSignInAttempt(clientID: clientID, scheme: scheme)
        XCTAssertEqual(Set([one.state, one.nonce, one.verifier, two.state, two.nonce, two.verifier]).count, 6)
        for value in [one.state, one.nonce, one.verifier] {
            XCTAssertEqual(value.count, 43)
            XCTAssertNotNil(value.range(of: #"^[A-Za-z0-9_-]+$"#, options: .regularExpression))
        }
        let fields = Dictionary(uniqueKeysWithValues: URLComponents(url: one.authorizationURL, resolvingAgainstBaseURL: false)!.queryItems!.map { ($0.name, $0.value!) })
        XCTAssertEqual(fields["code_challenge_method"], "S256")
        let digest = Data(SHA256.hash(data: Data(one.verifier.utf8))).base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
        XCTAssertEqual(fields["code_challenge"], digest)
        XCTAssertEqual(fields["scope"], "openid email profile")
        XCTAssertEqual(fields["prompt"], "select_account")
        XCTAssertEqual(fields["response_type"], "code")
        XCTAssertNil(fields["access_type"]); XCTAssertNil(fields["client_secret"])
        XCTAssertFalse(one.authorizationURL.absoluteString.contains(one.verifier))
        XCTAssertThrowsError(try GoogleSignInAttempt(clientID: clientID, scheme: "wrong-scheme"))
        XCTAssertThrowsError(try GoogleSignInAttempt(clientID: "https://evil.apps.googleusercontent.com", scheme: "com.googleusercontent.apps.https://evil"))
    }

    func testCallbackRequiresExactRouteAndSingleMatchingStateAndCode() throws {
        let attempt = try GoogleSignInAttempt(clientID: clientID, scheme: scheme)
        let valid = "\(attempt.redirectURI)?state=\(attempt.state)&code=synthetic%2Bcode"
        XCTAssertEqual(try attempt.authorizationCode(from: URL(string: valid)!), "synthetic+code")
        for invalid in [valid + "&state=\(attempt.state)", valid + "&code=second", valid + "#fragment",
                        valid.replacingOccurrences(of: attempt.state, with: "wrong"),
                        valid.replacingOccurrences(of: "/oauth2redirect", with: "//evil/oauth2redirect"),
                        valid.replacingOccurrences(of: scheme, with: "other"),
                        "\(attempt.redirectURI)?state=\(attempt.state)&code="] {
            XCTAssertThrowsError(try attempt.authorizationCode(from: URL(string: invalid)!))
        }
        XCTAssertThrowsError(try attempt.authorizationCode(from: URL(string: "\(attempt.redirectURI)?state=\(attempt.state)&error=access_denied")!)) {
            XCTAssertEqual($0 as? NativeSignInError, .cancelled)
        }
    }

    func testIdentityProofMustMatchAttemptAudienceIssuerAndExpiry() throws {
        let attempt = try GoogleSignInAttempt(clientID: clientID, scheme: scheme)
        let now = Date(timeIntervalSince1970: 1_700_000_000)
        let claims: [String: Any] = ["nonce": attempt.nonce, "aud": clientID, "iss": "https://accounts.google.com", "exp": now.timeIntervalSince1970 + 300]
        let proof = try attempt.credential(idToken: token(claims), now: now)
        XCTAssertEqual(proof.provider, .google); XCTAssertNil(proof.rawNonce)
        for patch: [String: Any] in [["nonce": "other"], ["aud": "other-client"], ["iss": "https://evil.invalid"], ["exp": now.timeIntervalSince1970]] {
            XCTAssertThrowsError(try attempt.credential(idToken: token(claims.merging(patch) { _, new in new }), now: now))
        }
        XCTAssertThrowsError(try attempt.credential(idToken: "invalid", now: now))
    }

    func testTokenExchangeFormKeepsProofsOutOfTheURLAndEncodesCode() throws {
        let attempt = try GoogleSignInAttempt(clientID: clientID, scheme: scheme)
        let encoded = String(data: attempt.tokenBody(code: "code+&= value"), encoding: .utf8)!
        let fields = URLComponents(string: "https://test.invalid/?\(encoded)")!.queryItems!
        XCTAssertEqual(fields.first { $0.name == "code" }?.value, "code+&= value")
        XCTAssertEqual(fields.first { $0.name == "code_verifier" }?.value, attempt.verifier)
        XCTAssertFalse(encoded.contains("client_secret")); XCTAssertFalse(encoded.contains("refresh_token"))
    }

    func testCodeExchangeUsesOnlyGoogleTokenEndpointAndRejectsForeignProof() async throws {
        let attempt = try GoogleSignInAttempt(clientID: clientID, scheme: scheme)
        for matching in [true, false] {
            let claims: [String: Any] = ["nonce": matching ? attempt.nonce : "foreign", "aud": clientID, "iss": "https://accounts.google.com", "exp": Date.now.timeIntervalSince1970 + 300]
            let config = URLSessionConfiguration.ephemeral
            config.protocolClasses = [GoogleTokenHTTP.self]; config.httpAdditionalHeaders = ["X-Synthetic-Token": token(claims)]
            do {
                let proof = try await attempt.exchange(code: "synthetic-code", http: URLSession(configuration: config))
                XCTAssertTrue(matching); XCTAssertEqual(proof.provider, .google)
            } catch { XCTAssertFalse(matching); XCTAssertEqual(error as? NativeSignInError, .identity) }
        }
    }

    private func token(_ claims: [String: Any]) -> String {
        let body = try! JSONSerialization.data(withJSONObject: claims).base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
        return "synthetic.\(body).not-a-signature"
    }
}

private final class GoogleTokenHTTP: URLProtocol, @unchecked Sendable {
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func stopLoading() {}
    override func startLoading() {
        XCTAssertEqual(request.url?.absoluteString, "https://oauth2.googleapis.com/token")
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/x-www-form-urlencoded")
        let token = request.value(forHTTPHeaderField: "X-Synthetic-Token")!
        client?.urlProtocol(self, didReceive: HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: try! JSONSerialization.data(withJSONObject: ["id_token": token]))
        client?.urlProtocolDidFinishLoading(self)
    }
}

/// All replies are synthetic; unexpected destinations fail before any network access.
private final class ProviderHTTP: URLProtocol, @unchecked Sendable {
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func stopLoading() {}
    override func startLoading() {
        let scenario = request.value(forHTTPHeaderField: "X-Scenario") ?? "google"
        let provider = scenario == "apple" ? "apple.com" : "google.com"
        var status = 200
        let payload: [String: Any]
        let path = request.url!.path
        if path.hasSuffix("accounts:signInWithIdp") {
            XCTAssertEqual(request.url?.host, "identitytoolkit.googleapis.com")
            let fields = try! JSONSerialization.jsonObject(with: body()) as! [String: Any]
            XCTAssertNil(fields["idToken"], "Sign-in must not silently link another credential")
            XCTAssertEqual(fields["returnIdpCredential"] as? Bool, false)
            let form = URLComponents(string: "https://test.invalid/?\(fields["postBody"] as! String)")!.queryItems!
            XCTAssertEqual(form.first { $0.name == "providerId" }?.value, provider)
            if scenario == "apple" { XCTAssertEqual(form.first { $0.name == "nonce" }?.value, String(repeating: "n", count: 43)) }
            if scenario == "collision" { status = 400; payload = ["error": ["message": "EMAIL_EXISTS"]] }
            else if scenario == "confirm" { payload = ["needConfirmation": true] }
            else { payload = ["idToken": "synthetic-firebase", "refreshToken": "synthetic-refresh", "expiresIn": "3600", "localId": "existing-firebase-uid", "providerId": provider] }
        } else if path.hasSuffix("accounts:lookup") {
            payload = ["users": [["localId": scenario == "mismatch" ? "other-uid" : "existing-firebase-uid",
                                   "email": scenario == "apple" ? "relay@privaterelay.appleid.com" : "canonical@example.com",
                                   "providerUserInfo": [["providerId": scenario == "unlinked" ? "password" : provider]]]]]
        } else if path == "/v1/token" {
            payload = ["id_token": "synthetic-refreshed", "refresh_token": "synthetic-refresh-2", "expires_in": "3600", "user_id": "existing-firebase-uid", "project_id": "776298253175"]
        } else { XCTFail("Unexpected provider endpoint"); status = 400; payload = [:] }
        let data = try! JSONSerialization.data(withJSONObject: payload), responseStatus = status
        let reply: @Sendable () -> Void = {
            self.client?.urlProtocol(self, didReceive: HTTPURLResponse(url: self.request.url!, statusCode: responseStatus, httpVersion: nil, headerFields: nil)!, cacheStoragePolicy: .notAllowed)
            self.client?.urlProtocol(self, didLoad: data); self.client?.urlProtocolDidFinishLoading(self)
        }
        if scenario == "delay", path.hasSuffix("accounts:signInWithIdp") { DispatchQueue.global().asyncAfter(deadline: .now() + 0.3, execute: reply) }
        else { reply() }
    }
    private func body() -> Data {
        if let data = request.httpBody { return data }
        guard let stream = request.httpBodyStream else { return Data() }
        stream.open(); defer { stream.close() }
        var data = Data(), buffer = [UInt8](repeating: 0, count: 4096)
        while stream.hasBytesAvailable { let count = stream.read(&buffer, maxLength: buffer.count); if count <= 0 { break }; data.append(contentsOf: buffer.prefix(count)) }
        return data
    }
}

final class FirebaseProviderTests: XCTestCase {
    private func fixture(_ scenario: String) throws -> (KeychainVault, FirebaseSession, URLSession) {
        let vault = KeychainVault(service: "org.learncard.native.oauth-tests.\(UUID())")
        let config = URLSessionConfiguration.ephemeral; config.protocolClasses = [ProviderHTTP.self]; config.httpAdditionalHeaders = ["X-Scenario": scenario]
        let http = URLSession(configuration: config)
        return (vault, try FirebaseSession(vault: vault, http: http), http)
    }
    func testGoogleUsesVerifiedUIDAndSameRefreshRestartSignOutSession() async throws {
        let (vault, firebase, http) = try fixture("google")
        let user = try await firebase.signIn(credential: .init(provider: .google, idToken: "synthetic-google-proof"))
        XCTAssertEqual(user.id, "existing-firebase-uid"); XCTAssertEqual(user.email, "canonical@example.com")
        let refreshed = try await firebase.idToken(forceRefresh: true); XCTAssertEqual(refreshed, "synthetic-refreshed")
        let restarted = try FirebaseSession(vault: vault, http: http)
        let resumed = try await restarted.resume(); XCTAssertEqual(resumed, user)
        try await restarted.signOut()
        let empty = try await FirebaseSession(vault: vault, http: http).resume(); XCTAssertNil(empty)
    }
    func testAppleAcceptsVerifiedRelayAddressAndTransmitsRawNonce() async throws {
        let (_, firebase, _) = try fixture("apple")
        let user = try await firebase.signIn(credential: .init(provider: .apple, idToken: "synthetic-apple-proof", rawNonce: String(repeating: "n", count: 43)))
        XCTAssertEqual(user.id, "existing-firebase-uid"); XCTAssertEqual(user.email, "relay@privaterelay.appleid.com")
        try await firebase.signOut()
    }
    func testCollisionAndNeedConfirmationNeverSaveOrLinkAccount() async throws {
        for scenario in ["collision", "confirm"] {
            let (vault, firebase, http) = try fixture(scenario)
            do { _ = try await firebase.signIn(credential: .init(provider: .google, idToken: "synthetic")); XCTFail("Collision must fail closed") }
            catch { XCTAssertEqual(error as? NativeSignInError, .differentMethod) }
            let resumed = try await FirebaseSession(vault: vault, http: http).resume(); XCTAssertNil(resumed)
        }
    }
    func testLookupMustConfirmSameUIDAndLinkedProvider() async throws {
        for scenario in ["mismatch", "unlinked"] {
            let (vault, firebase, http) = try fixture(scenario)
            do { _ = try await firebase.signIn(credential: .init(provider: .google, idToken: "synthetic")); XCTFail("Identity mismatch must fail closed") }
            catch { XCTAssertEqual(error as? NativeSignInError, .identity) }
            let resumed = try await FirebaseSession(vault: vault, http: http).resume(); XCTAssertNil(resumed)
        }
    }
    func testAppleMissingNonceIsRejectedBeforeExchange() async throws {
        let (vault, firebase, http) = try fixture("apple")
        do { _ = try await firebase.signIn(credential: .init(provider: .apple, idToken: "synthetic")); XCTFail("Nonce required") }
        catch { XCTAssertEqual(error as? NativeSignInError, .identity) }
        let resumed = try await FirebaseSession(vault: vault, http: http).resume(); XCTAssertNil(resumed)
    }
    func testLateProviderExchangeCannotUndoSignOut() async throws {
        let (vault, firebase, http) = try fixture("delay")
        let task = Task { try await firebase.signIn(credential: .init(provider: .google, idToken: "synthetic")) }
        try await Task.sleep(for: .milliseconds(100)); try await firebase.signOut()
        do { _ = try await task.value; XCTFail("Old exchange must not persist") }
        catch { XCTAssertEqual(error as? AccountError, .cancelled) }
        let resumed = try await FirebaseSession(vault: vault, http: http).resume(); XCTAssertNil(resumed)
    }
    func testCancellingAnInFlightExchangeCannotPersistItsLaterReply() async throws {
        let (vault, firebase, http) = try fixture("delay")
        let task = Task { try await firebase.signIn(credential: .init(provider: .google, idToken: "synthetic")) }
        try await Task.sleep(for: .milliseconds(100)); task.cancel()
        do { _ = try await task.value; XCTFail("Cancelled exchange must not persist") } catch {}
        let resumed = try await FirebaseSession(vault: vault, http: http).resume(); XCTAssertNil(resumed)
    }
}

@MainActor private final class ProviderGate: NativeSignInClient {
    var providers: [NativeSignInProvider] = [.apple, .google]
    var reply: CheckedContinuation<NativeSignInCredential, any Error>?
    var calls = 0, cancellations = 0
    func signIn(_ provider: NativeSignInProvider) async throws -> NativeSignInCredential {
        calls += 1
        return try await withCheckedThrowingContinuation { reply = $0 }
    }
    func cancel() { cancellations += 1 } // Deliberately permits a late result to challenge the controller guard.
    func finish(_ result: Result<NativeSignInCredential, any Error>) { reply?.resume(with: result); reply = nil }
}
@MainActor private final class ProviderSession: AccountSession {
    nonisolated let testEmail = "native-test@example.invalid"
    let user = FirebaseUser(id: "same-uid", email: "canonical@example.com")
    var exchanges = 0
    var authenticated = false
    var pauseExchange = false
    var exchangeReply: CheckedContinuation<Void, Never>?
    func resume() async throws -> FirebaseUser? { authenticated ? user : nil }
    func sendCode(email: String) async throws {}
    func verify(code: String) async throws -> FirebaseUser { user }
    func signIn(credential: NativeSignInCredential) async throws -> FirebaseUser {
        exchanges += 1
        if pauseExchange { await withCheckedContinuation { exchangeReply = $0 } }
        try Task.checkCancellation()
        authenticated = true; return user
    }
    func signOut() async throws { authenticated = false }
}
@MainActor private final class ProviderHost: AccountHost {
    let credentialService: any CredentialService = DemoCredentialService()
    let phase: String
    let fails: Bool
    init(_ phase: String, fails: Bool = false) { self.phase = phase; self.fails = fails }
    func initialize() async throws -> AccountState {
        if fails { throw AccountError.connection }
        return AccountState(phase: phase, methods: ["email"], profileName: "Person", profileId: "person")
    }
    func recover(method: String, phrase: String, fileContents: String, password: String, emailShare: String) async throws -> AccountState { AccountState(phase: "ready", profileId: "person") }
    func updateProfile(name: String, bio: String, image: ProfileImageUpdate) async throws -> AccountState { try await initialize() }
    func dispose() {}
}

@MainActor final class ProviderLifecycleTests: XCTestCase {
    func testProviderSuccessEntersExistingReadyRecoverySignupAndApprovalGates() async {
        for phase in ["ready", "needs_recovery", "needs_setup", "pending_approval"] {
            let provider = ProviderGate(), session = ProviderSession()
            let account = NativeAccountController(session: session, signInClient: provider, makeHost: { user in
                XCTAssertEqual(user.id, "same-uid"); return ProviderHost(phase)
            }, forgetAccount: { _ in })
            await account.resume()
            let task = Task { await account.signIn(with: .google) }; await entered(provider)
            XCTAssertTrue(account.busy); XCTAssertEqual(account.signInProvider, .google)
            provider.finish(.success(.init(provider: .google, idToken: "synthetic"))); await task.value
            XCTAssertEqual(account.phase, phase); XCTAssertEqual(account.user?.id, session.user.id)
            XCTAssertEqual(account.store != nil, phase == "ready"); XCTAssertFalse(account.busy)
        }
    }
    func testDuplicateTapCannotStartAnotherProviderAndInactiveDoesNotCancel() async {
        let provider = ProviderGate(), session = ProviderSession(), account = controller(provider, session)
        await account.resume()
        let task = Task { await account.signIn(with: .apple) }; await entered(provider)
        await account.signIn(with: .google); await account.activityChanged(.inactive)
        XCTAssertEqual(provider.calls, 1); XCTAssertEqual(provider.cancellations, 0)
        provider.finish(.success(.init(provider: .apple, idToken: "synthetic", rawNonce: "nonce"))); await task.value
        XCTAssertEqual(account.phase, "needs_recovery"); XCTAssertEqual(session.exchanges, 1)
    }
    func testCancellationPreservesEmailAndDoesNotBecomeAnError() async {
        let provider = ProviderGate(), session = ProviderSession(), account = controller(provider, session)
        await account.resume(); account.email = "typed@example.com"
        let task = Task { await account.signIn(with: .google) }; await entered(provider)
        provider.finish(.failure(NativeSignInError.cancelled)); await task.value
        XCTAssertEqual(account.phase, "signIn"); XCTAssertEqual(account.email, "typed@example.com")
        XCTAssertNil(account.error); XCTAssertFalse(account.busy); XCTAssertEqual(session.exchanges, 0)
    }
    func testAccountConnectionFailureRetriesSameVerifiedSessionWithoutAnotherProvider() async {
        let provider = ProviderGate(), session = ProviderSession()
        var fails = true
        let account = NativeAccountController(session: session, signInClient: provider, makeHost: { _ in ProviderHost("needs_recovery", fails: fails) }, forgetAccount: { _ in })
        await account.resume()
        let task = Task { await account.signIn(with: .google) }; await entered(provider)
        provider.finish(.success(.init(provider: .google, idToken: "synthetic"))); await task.value
        XCTAssertEqual(account.phase, "locked"); XCTAssertNotNil(account.error); XCTAssertEqual(session.exchanges, 1)
        fails = false; await account.resume()
        XCTAssertEqual(account.phase, "needs_recovery"); XCTAssertEqual(session.exchanges, 1); XCTAssertEqual(provider.calls, 1)
    }
    func testFailureAndWrongProviderRemainOnEmailFallbackWithoutExchange() async {
        for result: Result<NativeSignInCredential, any Error> in [.failure(NativeSignInError.failed), .success(.init(provider: .apple, idToken: "wrong-provider"))] {
            let provider = ProviderGate(), session = ProviderSession(), account = controller(provider, session)
            await account.resume()
            let task = Task { await account.signIn(with: .google) }; await entered(provider)
            provider.finish(result); await task.value
            XCTAssertEqual(account.phase, "signIn"); XCTAssertNotNil(account.error); XCTAssertEqual(session.exchanges, 0)
        }
    }
    func testBackgroundOrSignOutRejectsLateProviderCallbackBeforeExchange() async {
        for signOut in [false, true] {
            let provider = ProviderGate(), session = ProviderSession(), account = controller(provider, session)
            await account.resume()
            let task = Task { await account.signIn(with: .google) }; await entered(provider)
            if signOut { await account.signOut(forget: false) } else { await account.activityChanged(.background) }
            XCTAssertEqual(provider.cancellations, 1)
            provider.finish(.success(.init(provider: .google, idToken: "late"))); await task.value
            XCTAssertNil(account.store); XCTAssertNil(account.user); XCTAssertEqual(session.exchanges, 0)
            await account.activityChanged(.active); XCTAssertEqual(account.phase, "signIn"); XCTAssertNil(account.error)
        }
    }
    func testBackgroundCancelsAlreadyStartedFirebaseExchange() async {
        let provider = ProviderGate(), session = ProviderSession(), account = controller(provider, session)
        session.pauseExchange = true
        await account.resume()
        let task = Task { await account.signIn(with: .google) }; await entered(provider)
        provider.finish(.success(.init(provider: .google, idToken: "synthetic")))
        while session.exchangeReply == nil { await Task.yield() }
        await account.activityChanged(.background)
        session.exchangeReply?.resume(); session.exchangeReply = nil; await task.value
        XCTAssertFalse(session.authenticated); XCTAssertNil(account.user); XCTAssertNil(account.store)
        await account.activityChanged(.active); XCTAssertEqual(account.phase, "signIn")
    }
    func testUnconfiguredProviderCannotStartAndAllCopyIsLocalized() async {
        let provider = ProviderGate(), session = ProviderSession(), account = controller(provider, session)
        provider.providers = []
        await account.resume(); await account.signIn(with: .google)
        XCTAssertEqual(provider.calls, 0); XCTAssertEqual(account.phase, "signIn")
        for language in ["en", "es", "fr", "ar"] {
            for key in ["oauth.google", "oauth.orEmail", "oauth.loadingTitle", "oauth.loading", "oauth.cancelled", "oauth.unavailable", "oauth.failed", "oauth.differentMethod", "oauth.identity"] {
                XCTAssertNotEqual(NativeText.text(key, language: NativeLanguage(rawValue: language)!), key)
            }
        }
    }
    private func controller(_ provider: ProviderGate, _ session: ProviderSession) -> NativeAccountController {
        NativeAccountController(session: session, signInClient: provider, makeHost: { _ in ProviderHost("needs_recovery") }, forgetAccount: { _ in })
    }
    private func entered(_ provider: ProviderGate) async { while provider.reply == nil { await Task.yield() } }
}
