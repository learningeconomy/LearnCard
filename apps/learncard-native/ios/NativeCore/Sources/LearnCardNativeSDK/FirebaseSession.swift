import Foundation

public struct FirebaseUser: Codable, Sendable, Equatable {
    public let id: String
    public let email: String
    public let displayName: String?
    public let createdAt: String?
    public init(id: String, email: String, displayName: String? = nil, createdAt: String? = nil) {
        self.id = id; self.email = email; self.displayName = displayName; self.createdAt = createdAt
    }
}

private struct IdentityProviderFailure: Decodable {
    struct Detail: Decodable { let message: String }
    let error: Detail
}

private struct SavedSession: Codable, Sendable {
    let user: FirebaseUser
    var idToken: String
    var refreshToken: String
    var expires: Date
}

struct AccountConfiguration: Decodable, Sendable {
    let apiKey: String
    let projectID: String
    let projectNumber: String
    let testEmail: String
    static func load() throws -> Self {
        let url = Bundle.module.url(forResource: "account-config", withExtension: "json")
        guard let url else { throw AccountError.unavailable }
        let config = try JSONDecoder().decode(Self.self, from: Data(contentsOf: url))
        guard config.projectID == "learncard", config.projectNumber == "776298253175" else { throw AccountError.unavailable }
        return config
    }
}

/// Native implementation of Firebase's documented custom-token and refresh REST endpoints.
/// Tokens stay in Keychain or memory; the custom token is never persisted.
public actor FirebaseSession {
    private let vault: KeychainVault
    private var saved: SavedSession?
    private let http: URLSession
    private let config: AccountConfiguration
    private let slot = "firebase:learncard:staging:session"
    private var refresh: Task<SavedSession, Error>?
    private var persistence: Task<Void, Error>?
    private var generation = 0
    private var signingOut = false
    private var verificationEmail: String

    public init(vault: KeychainVault, http: URLSession? = nil) throws {
        self.vault = vault
        config = try AccountConfiguration.load()
        verificationEmail = config.testEmail
        let settings = URLSessionConfiguration.ephemeral
        settings.httpCookieStorage = nil
        settings.urlCredentialStorage = nil
        settings.timeoutIntervalForRequest = 25
        self.http = http ?? URLSession(configuration: settings, delegate: RejectAccountRedirects(), delegateQueue: nil)
    }

    public nonisolated var testEmail: String { config.testEmail }

    public func resume() async throws -> FirebaseUser? {
        guard !signingOut else { throw AccountError.cancelled }
        let expected = generation
        guard let data = try await vault.read(slot) else { return nil }
        guard generation == expected else { throw AccountError.cancelled }
        let candidate = try JSONDecoder().decode(SavedSession.self, from: data)
        guard Self.normalizedEmail(candidate.user.email) != nil else { throw AccountError.identity }
        saved = candidate
        _ = try await idToken()
        return saved?.user
    }

    public nonisolated static func normalizedEmail(_ value: String) -> String? {
        let email = value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard email.utf8.count <= 254, email.range(of: #"^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+$"#, options: [.regularExpression, .caseInsensitive]) != nil else { return nil }
        return email
    }
    public func sendCode(email: String) async throws {
        guard !signingOut, let target = Self.normalizedEmail(email), !target.hasSuffix(".invalid") else { throw AccountError.signIn }
        let expected = generation
        struct Reply: Decodable, Sendable { let success: Bool }
        let language = NativeLanguage.selected.locale.language.languageCode?.identifier ?? "en"
        let response: Reply = try await post("https://staging.api.learncard.app/api/send-login-verification-code", body: ["email": target, "locale": language])
        guard generation == expected, !signingOut else { throw AccountError.cancelled }
        guard response.success else { throw AccountError.connection }
        verificationEmail = target
    }

    public func verify(code: String) async throws -> FirebaseUser {
        guard !signingOut else { throw AccountError.cancelled }
        let expected = generation
        let target = verificationEmail
        guard code.utf8.count == 6, code.utf8.allSatisfy({ (48...57).contains($0) }) else { throw AccountError.signIn }
        struct OTP: Decodable, Sendable { let success: Bool; let token: String? }
        let otp: OTP = try await post("https://staging.api.learncard.app/api/verify-login-code", body: ["email": target, "code": code])
        guard otp.success, let token = otp.token else { throw AccountError.signIn }
        struct Exchange: Decodable, Sendable { let idToken: String; let refreshToken: String; let expiresIn: String }
        let exchange: Exchange = try await post("https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=\(config.apiKey)", body: ["token": token, "returnSecureToken": true])
        struct Lookup: Decodable, Sendable {
            struct User: Decodable, Sendable { let localId: String; let email: String; let displayName: String?; let createdAt: String? }
            let users: [User]
        }
        let lookup: Lookup = try await post("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=\(config.apiKey)", body: ["idToken": exchange.idToken])
        guard lookup.users.count == 1, let user = lookup.users.first,
              user.email.lowercased() == target.lowercased(), !user.localId.isEmpty else { throw AccountError.identity }
        let result = FirebaseUser(id: user.localId, email: user.email, displayName: user.displayName, createdAt: user.createdAt)
        let session = SavedSession(user: result, idToken: exchange.idToken, refreshToken: exchange.refreshToken,
            expires: Date().addingTimeInterval(Double(exchange.expiresIn) ?? 0))
        try await save(session, generation: expected)
        return result
    }

    public func idToken(forceRefresh: Bool = false) async throws -> String {
        guard !signingOut else { throw AccountError.cancelled }
        let expected = generation
        guard let current = saved else { throw AccountError.expired }
        if !forceRefresh && current.expires.timeIntervalSinceNow > 90 { return current.idToken }
        if let refresh {
            let result = try await refresh.value
            guard generation == expected else { throw AccountError.cancelled }
            return result.idToken
        }
        let task = Task { try await self.refreshSession(current) }
        refresh = task
        defer { if generation == expected { refresh = nil } }
        let result = try await task.value
        guard generation == expected, saved?.user.id == result.user.id else { throw AccountError.cancelled }
        try await save(result, generation: expected)
        return result.idToken
    }

    /// Provider proofs enter the existing Firebase session. No independent Google/
    /// Apple session is persisted and no credentials are linked on the client.
    public func signIn(credential: NativeSignInCredential) async throws -> FirebaseUser {
        try Task.checkCancellation()
        guard !signingOut else { throw AccountError.cancelled }
        let expected = generation
        guard !credential.idToken.isEmpty, credential.idToken.utf8.count <= 32_768 else { throw NativeSignInError.identity }
        var fields = ["providerId": credential.provider.firebaseID, "id_token": credential.idToken]
        if credential.provider == .apple {
            guard let nonce = credential.rawNonce, (16...128).contains(nonce.utf8.count) else { throw NativeSignInError.identity }
            fields["nonce"] = nonce
        }
        struct Exchange: Decodable, Sendable {
            let idToken: String?; let refreshToken: String?; let expiresIn: String?
            let localId: String?; let providerId: String?; let needConfirmation: Bool?
        }
        let exchange: Exchange = try await post("https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=\(config.apiKey)", body: [
            "postBody": GoogleSignInAttempt.form(fields), "requestUri": "https://staging.learncard.app",
            "returnSecureToken": true, "returnIdpCredential": false,
        ])
        try Task.checkCancellation()
        guard generation == expected, !signingOut else { throw AccountError.cancelled }
        guard exchange.needConfirmation != true else { throw NativeSignInError.differentMethod }
        guard let token = exchange.idToken, !token.isEmpty, let refreshToken = exchange.refreshToken, !refreshToken.isEmpty,
              let id = exchange.localId, !id.isEmpty, exchange.providerId == credential.provider.firebaseID,
              let seconds = exchange.expiresIn.flatMap(Double.init), (1...86_400).contains(seconds) else { throw NativeSignInError.identity }
        struct Lookup: Decodable, Sendable {
            struct User: Decodable, Sendable {
                struct Provider: Decodable, Sendable { let providerId: String }
                let localId: String; let email: String; let displayName: String?; let createdAt: String?
                let providerUserInfo: [Provider]?
            }
            let users: [User]
        }
        let lookup: Lookup = try await post("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=\(config.apiKey)", body: ["idToken": token])
        try Task.checkCancellation()
        guard generation == expected, !signingOut else { throw AccountError.cancelled }
        guard lookup.users.count == 1, let found = lookup.users.first, found.localId == id,
              let email = Self.normalizedEmail(found.email),
              found.providerUserInfo?.contains(where: { $0.providerId == credential.provider.firebaseID }) == true else { throw NativeSignInError.identity }
        let user = FirebaseUser(id: id, email: email, displayName: found.displayName, createdAt: found.createdAt)
        try await save(SavedSession(user: user, idToken: token, refreshToken: refreshToken, expires: .now.addingTimeInterval(seconds)), generation: expected)
        return user
    }

    private func refreshSession(_ current: SavedSession) async throws -> SavedSession {
        struct Refresh: Decodable, Sendable { let id_token: String; let refresh_token: String; let expires_in: String; let user_id: String; let project_id: String }
        let body = "grant_type=refresh_token&refresh_token=\(current.refreshToken.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? "")"
        let result: Refresh = try await request("https://securetoken.googleapis.com/v1/token?key=\(config.apiKey)", data: Data(body.utf8), contentType: "application/x-www-form-urlencoded")
        guard result.user_id == current.user.id, [config.projectID, config.projectNumber].contains(result.project_id) else { throw AccountError.identity }
        return SavedSession(user: current.user, idToken: result.id_token, refreshToken: result.refresh_token,
            expires: Date().addingTimeInterval(Double(result.expires_in) ?? 0))
    }

    public func signOut() async throws {
        guard !signingOut else { throw AccountError.cancelled }
        signingOut = true
        generation += 1
        defer { signingOut = false }
        let pending = refresh
        refresh = nil
        pending?.cancel()
        saved = nil; verificationEmail = config.testEmail
        if let pending { _ = try? await pending.value }
        if let persistence { _ = try? await persistence.value }
        try await vault.remove(slot)
        saved = nil
    }

    private func save(_ value: SavedSession, generation expected: Int) async throws {
        guard generation == expected, !signingOut else { throw AccountError.cancelled }
        let previous = persistence
        let data = try JSONEncoder().encode(value)
        let vault = vault, slot = slot
        let write = Task {
            if let previous { _ = try? await previous.value }
            try await vault.write(data, key: slot)
        }
        persistence = write
        try await write.value
        guard generation == expected, !signingOut else { throw AccountError.cancelled }
        saved = value
    }

    private func post<T: Decodable & Sendable>(_ address: String, body: [String: any Sendable]) async throws -> T {
        try await request(address, data: JSONSerialization.data(withJSONObject: body), contentType: "application/json")
    }

    private func request<T: Decodable & Sendable>(_ address: String, data: Data, contentType: String) async throws -> T {
        guard let url = URL(string: address), url.scheme == "https",
              ["staging.api.learncard.app", "identitytoolkit.googleapis.com", "securetoken.googleapis.com"].contains(url.host) else { throw AccountError.unavailable }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = data
        request.setValue(contentType, forHTTPHeaderField: "Content-Type")
        request.setValue("learncard", forHTTPHeaderField: "X-Tenant-Id")
        do {
            let (response, metadata) = try await http.data(for: request)
            guard let http = metadata as? HTTPURLResponse else { throw AccountError.connection }
            guard http.statusCode == 200 else {
                if url.path.hasSuffix("accounts:signInWithIdp") {
                    let code = (try? JSONDecoder().decode(IdentityProviderFailure.self, from: response).error.message)?.split(separator: " ").first.map(String.init)
                    if ["EMAIL_EXISTS", "ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL", "FEDERATED_USER_ID_ALREADY_LINKED"].contains(code ?? "") { throw NativeSignInError.differentMethod }
                    if http.statusCode == 400 || http.statusCode == 401 { throw NativeSignInError.failed }
                    throw AccountError.connection
                }
                throw http.statusCode == 400 || http.statusCode == 401 ? AccountError.signIn : AccountError.connection
            }
            return try JSONDecoder().decode(T.self, from: response)
        } catch let error as AccountError { throw error }
        catch let error as NativeSignInError { throw error }
        catch { throw AccountError.connection }
    }
}

final class RejectAccountRedirects: NSObject, URLSessionTaskDelegate, @unchecked Sendable {
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse,
                    newRequest request: URLRequest, completionHandler: @escaping @Sendable (URLRequest?) -> Void) { completionHandler(nil) }
}
