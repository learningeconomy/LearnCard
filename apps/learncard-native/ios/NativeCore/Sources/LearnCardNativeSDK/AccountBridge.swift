import Foundation
import WebKit

/// Only this verified Firebase UID can use the host's scoped native storage and session.
@MainActor
final class AccountBridge: NSObject, WKScriptMessageHandlerWithReply {
    let user: FirebaseUser
    let vault: KeychainVault
    let firebase: FirebaseSession
    private var active = true

    init(user: FirebaseUser, vault: KeychainVault, firebase: FirebaseSession) {
        self.user = user; self.vault = vault; self.firebase = firebase
    }
    func invalidate() { active = false }

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage,
                               replyHandler: @escaping @MainActor @Sendable (Any?, String?) -> Void) {
        guard active, message.frameInfo.isMainFrame, message.frameInfo.request.url?.isFileURL == true,
              message.frameInfo.request.url?.lastPathComponent == "account-index.html",
              let input = message.body as? [String: Any], let op = input["op"] as? String else {
            replyHandler(nil, "Request refused"); return
        }
        Task { @MainActor in
            do {
                guard active else { throw AccountError.cancelled }
                if op == "idToken" {
                    let value = try await firebase.idToken(forceRefresh: input["forceRefresh"] as? Bool ?? false)
                    guard active else { throw AccountError.cancelled }
                    replyHandler(value, nil); return
                }
                if op == "signOut" { try await firebase.signOut(); replyHandler(NSNull(), nil); return }
                guard ["get", "set", "remove"].contains(op), let field = input["field"] as? String,
                      ["share", "version"].contains(field) else { throw AccountError.unavailable }
                let key = try AccountStorageScope.key(userID: user.id, id: input["id"] as? String, field: field)
                switch op {
                case "get":
                    let data = try await vault.read(key)
                    guard active else { throw AccountError.cancelled }
                    replyHandler(data.flatMap { String(data: $0, encoding: .utf8) } ?? NSNull() as Any, nil)
                case "set":
                    guard let value = input["value"] as? String, value.utf8.count <= 65536 else { throw AccountError.storage }
                    if field == "version" { guard let version = Int(value), version >= 1 else { throw AccountError.storage } }
                    try await vault.write(Data(value.utf8), key: key)
                    replyHandler(NSNull(), nil)
                default:
                    try await vault.remove(key)
                    replyHandler(NSNull(), nil)
                }
            } catch { replyHandler(nil, "Native account request failed") }
        }
    }
}
