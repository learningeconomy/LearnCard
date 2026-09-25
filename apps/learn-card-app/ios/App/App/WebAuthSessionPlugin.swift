import AuthenticationServices
import Capacitor
import Foundation
import UIKit

/**
 * Opens a Keycloak (or any OAuth) authorize URL in a system auth sheet and
 * resolves with the custom-scheme callback URL once the OS delivers it.
 *
 * `ASWebAuthenticationSession` intercepts the callback directly through its
 * completion handler — it never routes through `application(_:open:options:)`
 * or Capacitor's `appUrlOpen` listener, so the callback scheme does not need
 * to be registered as a `CFBundleURLTypes` entry for this to work.
 */
@objc(WebAuthSessionPlugin)
public class WebAuthSessionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WebAuthSessionPlugin"
    public let jsName = "WebAuthSession"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancel", returnType: CAPPluginReturnPromise),
    ]

    private var session: ASWebAuthenticationSession?

    @objc func start(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"), let url = URL(string: urlString) else {
            call.reject("A valid url is required", "FAILED")
            return
        }
        guard let callbackScheme = call.getString("callbackScheme"), !callbackScheme.isEmpty else {
            call.reject("A callbackScheme is required", "FAILED")
            return
        }
        let ephemeral = call.getBool("ephemeral", true)

        DispatchQueue.main.async { [weak self] in
            guard let self else {
                call.reject("Web auth session is unavailable", "FAILED")
                return
            }

            // A stale session (e.g. one that never presented) must not block a retry.
            if let stale = self.session {
                stale.cancel()
                self.session = nil
            }

            let session = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: callbackScheme
            ) { [weak self] callbackUrl, error in
                DispatchQueue.main.async {
                    self?.session = nil
                    self?.finish(call, callbackUrl: callbackUrl, error: error)
                }
            }

            session.prefersEphemeralWebBrowserSession = ephemeral
            session.presentationContextProvider = self

            guard session.canStart else {
                call.reject("The sign-in sheet cannot be presented right now", "FAILED")
                return
            }

            // Retain the session for the lifetime of the sheet; ASWebAuthenticationSession
            // does not keep itself alive.
            self.session = session

            if !session.start() {
                self.session = nil
                call.reject("Unable to start the sign-in sheet", "FAILED")
            }
        }
    }

    @objc func cancel(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            // cancel() fires the completion handler with canceledLogin, which
            // rejects the pending start() call and clears `session`.
            self?.session?.cancel()
            call.resolve()
        }
    }

    private func finish(_ call: CAPPluginCall, callbackUrl: URL?, error: Error?) {
        if let authError = error as? ASWebAuthenticationSessionError,
            authError.code == .canceledLogin {
            call.reject("Sign-in was cancelled", "CANCELED")
            return
        }

        if let error {
            call.reject(error.localizedDescription, "FAILED")
            return
        }

        guard let callbackUrl else {
            call.reject("No callback URL was returned", "FAILED")
            return
        }

        call.resolve(["url": callbackUrl.absoluteString])
    }
}

extension WebAuthSessionPlugin: ASWebAuthenticationPresentationContextProviding {
    public func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        // The WebView's window is normally the key window, but during keyboard or
        // sheet transitions it may not be; ASWebAuthenticationSession silently fails
        // to present on a non-key anchor, so prefer the scene's key window.
        let keyWindow = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow }

        return keyWindow ?? bridge?.webView?.window ?? ASPresentationAnchor()
    }
}
