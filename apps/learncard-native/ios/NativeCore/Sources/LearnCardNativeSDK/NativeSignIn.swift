import Foundation
import CryptoKit
import Security

public enum NativeSignInProvider: String, Sendable, CaseIterable {
    case apple, google
    var firebaseID: String { "\(rawValue).com" }
}

/// Ephemeral provider proof. Never serialized, logged or included in navigation.
public struct NativeSignInCredential: Sendable {
    let provider: NativeSignInProvider
    let idToken: String
    let rawNonce: String?
    public init(provider: NativeSignInProvider, idToken: String, rawNonce: String? = nil) {
        self.provider = provider; self.idToken = idToken; self.rawNonce = rawNonce
    }
}

public enum NativeSignInError: Error, LocalizedError, Sendable, Equatable {
    case cancelled, unavailable, failed, differentMethod, identity
    public var errorDescription: String? {
        let key = switch self {
        case .cancelled: "oauth.cancelled"
        case .unavailable: "oauth.unavailable"
        case .failed: "oauth.failed"
        case .differentMethod: "oauth.differentMethod"
        case .identity: "oauth.identity"
        }
        return NativeText.text(key)
    }
}

@MainActor public protocol NativeSignInClient: AnyObject {
    var providers: [NativeSignInProvider] { get }
    func signIn(_ provider: NativeSignInProvider) async throws -> NativeSignInCredential
    func cancel()
}

public struct NativeOAuthConfiguration: Decodable, Sendable {
    public let bundleID: String
    public let appleEnabled: Bool
    public let googleClientID: String?
    public var googleScheme: String? {
        googleClientID.map { "com.googleusercontent.apps." + $0.replacingOccurrences(of: ".apps.googleusercontent.com", with: "") }
    }
    /// The system authentication session owns these URLs, including malformed or
    /// stale callbacks. They must never replace a pending credential claim.
    public func handlesCallback(_ url: URL) -> Bool {
        guard let googleScheme else { return false }
        return url.scheme?.lowercased() == googleScheme.lowercased()
    }
    public static func load() throws -> Self {
        guard let url = Bundle.module.url(forResource: "native-oauth", withExtension: "json") else { throw NativeSignInError.unavailable }
        let value = try JSONDecoder().decode(Self.self, from: Data(contentsOf: url))
        guard !value.bundleID.isEmpty else { throw NativeSignInError.unavailable }
        if let clientID = value.googleClientID, let scheme = value.googleScheme {
            _ = try GoogleSignInAttempt(clientID: clientID, scheme: scheme)
        }
        return value
    }
}

/// Google installed-app authorization-code flow. Only the system browser sees login pages.
/// State, nonce and S256 PKCE bind the callback and code exchange to one attempt.
public struct GoogleSignInAttempt: Sendable {
    public let state: String
    public let nonce: String
    public let verifier: String
    public let clientID: String
    public let redirectURI: String
    public var challenge: String { Self.base64URL(Data(SHA256.hash(data: Data(verifier.utf8)))) }
    public init(clientID: String, scheme: String) throws {
        guard clientID.range(of: #"^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$"#, options: .regularExpression) != nil, scheme == "com.googleusercontent.apps." + clientID.replacingOccurrences(of: ".apps.googleusercontent.com", with: "") else { throw NativeSignInError.unavailable }
        self.clientID = clientID; redirectURI = "\(scheme):/oauth2redirect"
        state = try Self.random(); nonce = try Self.random(); verifier = try Self.random()
    }
    public var authorizationURL: URL {
        var url = URLComponents(string: "https://accounts.google.com/o/oauth2/v2/auth")!
        url.queryItems = ["client_id": clientID, "redirect_uri": redirectURI,
            "response_type": "code", "scope": "openid email profile", "prompt": "select_account",
            "state": state, "nonce": nonce, "code_challenge": challenge, "code_challenge_method": "S256"]
            .sorted { $0.key < $1.key }.map { URLQueryItem(name: $0.key, value: $0.value) }
        return url.url!
    }
    public func authorizationCode(from url: URL) throws -> String {
        guard url.absoluteString.utf8.count <= 16_384,
              let expected = URLComponents(string: redirectURI), let reply = URLComponents(url: url, resolvingAgainstBaseURL: false),
              reply.scheme == expected.scheme, reply.host == nil, reply.path == expected.path, reply.fragment == nil,
              reply.user == nil, reply.password == nil, reply.port == nil else { throw NativeSignInError.identity }
        let items = reply.queryItems ?? []
        guard items.filter({ $0.name == "state" }).count == 1,
              items.first(where: { $0.name == "state" })?.value == state else { throw NativeSignInError.identity }
        if items.contains(where: { $0.name == "error" }) {
            throw items.first(where: { $0.name == "error" })?.value == "access_denied" ? NativeSignInError.cancelled : .failed
        }
        guard items.filter({ $0.name == "code" }).count == 1,
              let code = items.first(where: { $0.name == "code" })?.value, !code.isEmpty, code.utf8.count <= 4096 else { throw NativeSignInError.identity }
        return code
    }
    public func tokenBody(code: String) -> Data {
        Data(Self.form(["client_id": clientID, "code": code, "redirect_uri": redirectURI,
                        "code_verifier": verifier, "grant_type": "authorization_code"]).utf8)
    }
    public func exchange(code: String, http: URLSession? = nil) async throws -> NativeSignInCredential {
        try Task.checkCancellation()
        let settings = URLSessionConfiguration.ephemeral
        settings.httpCookieStorage = nil; settings.urlCredentialStorage = nil; settings.timeoutIntervalForRequest = 25
        let session = http ?? URLSession(configuration: settings, delegate: RejectAccountRedirects(), delegateQueue: nil)
        var request = URLRequest(url: URL(string: "https://oauth2.googleapis.com/token")!)
        request.httpMethod = "POST"; request.httpBody = tokenBody(code: code)
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        let (data, response) = try await session.data(for: request)
        try Task.checkCancellation()
        guard (response as? HTTPURLResponse)?.statusCode == 200, data.count <= 65_536 else { throw NativeSignInError.failed }
        struct Reply: Decodable { let id_token: String }
        guard let reply = try? JSONDecoder().decode(Reply.self, from: data) else { throw NativeSignInError.failed }
        return try credential(idToken: reply.id_token)
    }
    /// Checks attempt binding, not signature authenticity; Firebase verifies the proof.
    public func credential(idToken: String, now: Date = .now) throws -> NativeSignInCredential {
        let pieces = idToken.split(separator: ".", omittingEmptySubsequences: false)
        guard idToken.utf8.count <= 32_768, pieces.count == 3 else { throw NativeSignInError.identity }
        var body = String(pieces[1]).replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
        body += String(repeating: "=", count: (4 - body.count % 4) % 4)
        guard let data = Data(base64Encoded: body), let claims = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              claims["nonce"] as? String == nonce, claims["aud"] as? String == clientID,
              ["accounts.google.com", "https://accounts.google.com"].contains(claims["iss"] as? String ?? ""),
              let expiry = claims["exp"] as? Double, expiry > now.timeIntervalSince1970 else { throw NativeSignInError.identity }
        return NativeSignInCredential(provider: .google, idToken: idToken)
    }
    public static func random() throws -> String {
        var bytes = [UInt8](repeating: 0, count: 32)
        guard SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes) == errSecSuccess else { throw NativeSignInError.unavailable }
        return base64URL(Data(bytes))
    }
    public static func sha256(_ value: String) -> String { SHA256.hash(data: Data(value.utf8)).map { String(format: "%02x", $0) }.joined() }
    static func form(_ fields: [String: String]) -> String {
        fields.sorted { $0.key < $1.key }.map {
            "\($0.key.addingPercentEncoding(withAllowedCharacters: .alphanumerics)!)=\($0.value.addingPercentEncoding(withAllowedCharacters: .alphanumerics)!)"
        }.joined(separator: "&")
    }
    private static func base64URL(_ data: Data) -> String {
        data.base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
    }
}
