import Foundation
import WebKit

private final class RejectStagingRedirects: NSObject, URLSessionTaskDelegate, @unchecked Sendable {
    func urlSession(_ session: URLSession, task: URLSessionTask,
                    willPerformHTTPRedirection response: HTTPURLResponse,
                    newRequest request: URLRequest,
                    completionHandler: @escaping @Sendable (URLRequest?) -> Void) {
        completionHandler(nil)
    }
}

/// Restricted staging transport. The account host also permits the SSS key-management API.
@MainActor
final class StagingTransport: NSObject, WKScriptMessageHandlerWithReply {
    private(set) var diagnostics: [String] = []
    private let session: URLSession
    private let accountHost: Bool
    private let pageName: String

    init(accountHost: Bool = false) {
        self.accountHost = accountHost
        pageName = accountHost ? "account-index.html" : "live-index.html"
        let config = URLSessionConfiguration.ephemeral
        config.httpShouldSetCookies = false
        config.httpCookieStorage = nil
        config.urlCredentialStorage = nil
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        config.timeoutIntervalForRequest = 20
        config.timeoutIntervalForResource = 30
        session = URLSession(configuration: config, delegate: RejectStagingRedirects(), delegateQueue: nil)
        super.init()
    }

    func stop() { session.invalidateAndCancel() }

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage,
                               replyHandler: @escaping @MainActor @Sendable (Any?, String?) -> Void) {
        guard message.frameInfo.isMainFrame,
              message.frameInfo.request.url?.isFileURL == true,
              message.frameInfo.request.url?.lastPathComponent == pageName,
              let input = message.body as? [String: Any],
              let address = input["url"] as? String, let url = URL(string: address),
              url.scheme == "https",
              url.user == nil, url.password == nil, url.port == nil,
              let method = input["method"] as? String, Self.permits(url, method: method, accountHost: accountHost),
              let headers = input["headers"] as? [String: String] else {
            diagnostics.append("Request refused by transport policy")
            replyHandler(nil, "Staging transport refused the request")
            return
        }
        var request = URLRequest(url: url)
        diagnostics.append("Starting \(method) \(url.host ?? "")\(url.path)")
        request.httpMethod = method
        for (name, value) in headers where Self.permitsHeader(name, url: url, accountHost: accountHost) {
            request.setValue(value, forHTTPHeaderField: name)
        }
        if let body = input["body"] as? String, !body.isEmpty {
            guard body.utf8.count <= 2 * 1024 * 1024 else {
                replyHandler(nil, "Staging request exceeds the test limit")
                return
            }
            request.httpBody = Data(body.utf8)
        }
        Task { @MainActor in
            do {
                let (data, response) = try await session.data(for: request)
                guard let http = response as? HTTPURLResponse,
                      !(300..<400).contains(http.statusCode), data.count <= 8 * 1024 * 1024,
                      let text = String(data: data, encoding: .utf8) else {
                    replyHandler(nil, "Staging returned an unsupported response")
                    return
                }
                replyHandler(["status": http.statusCode, "body": text,
                              "contentType": http.value(forHTTPHeaderField: "Content-Type") ?? "application/json"], nil)
                diagnostics.append("Completed \(http.statusCode) \(url.path)")
            } catch {
                diagnostics.append("Connection failed: \((error as NSError).code) \(url.path)")
                replyHandler(nil, "Staging connection failed")
            }
        }
    }

    nonisolated static func permits(_ url: URL, method: String, accountHost: Bool) -> Bool {
        if ["staging.network.learncard.com", "staging.cloud.learncard.com"].contains(url.host ?? "") {
            return ["GET", "POST"].contains(method)
        }
        guard accountHost, url.host == "staging.api.learncard.app" else { return false }
        if url.path.hasPrefix("/api/keys/") { return ["GET", "POST", "PUT", "DELETE"].contains(method) }
        guard url.path.hasPrefix("/trpc/"), ["GET", "POST"].contains(method) else { return false }
        let actions = url.path.dropFirst("/trpc/".count).split(separator: ",", omittingEmptySubsequences: false)
        let allowed: Set<String> = ["utilities.getChallenges", "pins.hasPin", "pins.createPin", "pins.verifyPin"]
        return !actions.isEmpty && actions.allSatisfy { allowed.contains(String($0)) }
    }

    nonisolated static func permitsHeader(_ name: String, url: URL, accountHost: Bool) -> Bool {
        ["authorization", "content-type", "accept", "x-tenant-id"].contains(name.lowercased()) ||
            (accountHost && url.host == "staging.api.learncard.app" && url.path.hasPrefix("/api/keys/") && name.lowercased() == "x-auth-token")
    }
}
