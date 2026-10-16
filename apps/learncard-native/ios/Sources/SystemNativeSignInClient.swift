import UIKit
import AuthenticationServices
import LearnCardNativeSDK

/// Owns exactly one system authorization surface. Authentication stays outside
/// the credential WebKit host; cancellation invalidates every later callback.
@MainActor final class SystemNativeSignInClient: NSObject, NativeSignInClient,
    ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding,
    ASWebAuthenticationPresentationContextProviding {
    private let config = try? NativeOAuthConfiguration.load()
    private var continuation: CheckedContinuation<NativeSignInCredential, any Error>?
    private var apple: ASAuthorizationController?
    private var browser: ASWebAuthenticationSession?
    private var exchange: Task<Void, Never>?
    private var window: UIWindow?
    private var nonce: String?
    private var state: String?
    private var attemptID: UUID?
    var providers: [NativeSignInProvider] {
        guard let config, config.bundleID == Bundle.main.bundleIdentifier else { return [] }
        return (config.appleEnabled ? [.apple] : []) + (config.googleClientID == nil ? [] : [.google])
    }
    func signIn(_ provider: NativeSignInProvider) async throws -> NativeSignInCredential {
        guard continuation == nil, providers.contains(provider),
              let window = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).flatMap(\.windows).first(where: \.isKeyWindow) else { throw NativeSignInError.unavailable }
        self.window = window
        let id = UUID(); attemptID = id
        return try await withCheckedThrowingContinuation { continuation in
            self.continuation = continuation
            do {
                switch provider {
                case .apple:
                    let nonce = try GoogleSignInAttempt.random(), state = try GoogleSignInAttempt.random()
                    self.nonce = nonce; self.state = state
                    let request = ASAuthorizationAppleIDProvider().createRequest()
                    request.requestedScopes = [.email]
                    request.nonce = GoogleSignInAttempt.sha256(nonce); request.state = state
                    let controller = ASAuthorizationController(authorizationRequests: [request])
                    apple = controller; controller.delegate = self; controller.presentationContextProvider = self
                    controller.performRequests()
                case .google:
                    guard let clientID = config?.googleClientID, let scheme = config?.googleScheme else { throw NativeSignInError.unavailable }
                    let attempt = try GoogleSignInAttempt(clientID: clientID, scheme: scheme)
                    let browser = ASWebAuthenticationSession(url: attempt.authorizationURL, callbackURLScheme: scheme) { [weak self] url, error in
                        Task { @MainActor in
                            guard let self, self.attemptID == id else { return }
                            if let error {
                                self.finish(.failure((error as? ASWebAuthenticationSessionError)?.code == .canceledLogin ? NativeSignInError.cancelled : .failed), id: id)
                            } else if let url { self.exchangeGoogle(attempt, url: url, id: id) }
                            else { self.finish(.failure(NativeSignInError.failed), id: id) }
                        }
                    }
                    self.browser = browser; browser.presentationContextProvider = self
                    // Reuse the system browser's Google session, while still showing
                    // account selection. Never ask for Google offline/refresh access.
                    browser.prefersEphemeralWebBrowserSession = false
                    if !browser.start() { throw NativeSignInError.unavailable }
                }
            } catch { finish(.failure(error), id: id) }
        }
    }
    private func exchangeGoogle(_ attempt: GoogleSignInAttempt, url: URL, id: UUID) {
        exchange = Task { [weak self] in
            do {
                let code = try attempt.authorizationCode(from: url)
                let credential = try await attempt.exchange(code: code)
                guard !Task.isCancelled else { return }
                self?.finish(.success(credential), id: id)
            } catch { self?.finish(.failure(error), id: id) }
        }
    }
    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard controller === apple, let id = attemptID else { return }
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              credential.state == state, let nonce, let data = credential.identityToken,
              let token = String(data: data, encoding: .utf8) else { finish(.failure(NativeSignInError.identity), id: id); return }
        finish(.success(NativeSignInCredential(provider: .apple, idToken: token, rawNonce: nonce)), id: id)
    }
    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: any Error) {
        guard controller === apple, let id = attemptID else { return }
        finish(.failure((error as? ASAuthorizationError)?.code == .canceled ? NativeSignInError.cancelled : .failed), id: id)
    }
    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor { window ?? ASPresentationAnchor() }
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor { window ?? ASPresentationAnchor() }
    func cancel() {
        guard let id = attemptID else { return }
        exchange?.cancel(); browser?.cancel(); apple?.cancel()
        finish(.failure(NativeSignInError.cancelled), id: id)
    }
    private func finish(_ result: Result<NativeSignInCredential, any Error>, id: UUID) {
        guard attemptID == id else { return }
        let continuation = continuation
        self.continuation = nil; attemptID = nil; nonce = nil; state = nil
        apple = nil; browser = nil; exchange = nil; window = nil
        continuation?.resume(with: result)
    }
}
