import Foundation
import WebKit
import Observation
import LearnCardNativeCore

public struct ConsumerIdentityRequest: Identifiable {
    public let id: String
    public let challenge: String?
}

/// A separate nonpersistent browser; the key-bearing AccountRuntime is never its document.
@MainActor @Observable public final class ConsumerBrowserSession: NSObject, WKScriptMessageHandler, WKNavigationDelegate, WKUIDelegate {
    public let webView: WKWebView
    public let launch: ConsumerAppLaunch
    public private(set) var loading = true
    public private(set) var failed = false
    public private(set) var canGoBack = false
    public var identity: ConsumerIdentityRequest?
    public var consent: ConsumerConsentReview?
    public var offeredCredential = false
    public var error: ConsumerAppError?
    private let consumer: ConsumerAppsStore
    private let isSample: Bool
    private let onCredential: () -> Void
    private var disposed = false
    private var request: String?
    private var seen = Set<String>()
    private var tasks: [Task<Void, Never>] = []
    private var generation = 0
    private var loadDeadline: Task<Void, Never>?
    private static let host = URL(string: "https://staging.learncard.app/native-consumer-host")!

    public init(launch: ConsumerAppLaunch, consumer: ConsumerAppsStore, isSample: Bool, onCredential: @escaping () -> Void) {
        self.launch = launch; self.consumer = consumer; self.isSample = isSample; self.onCredential = onCredential
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        webView = WKWebView(frame: .zero, configuration: configuration)
        super.init()
        webView.navigationDelegate = self; webView.uiDelegate = self
        if launch.embedded { configuration.userContentController.add(self, name: "consumerNative") }
        load()
    }
    public func load() {
        guard !disposed, launch.origin != nil else { failed = true; loading = false; return }
        generation += 1; tasks.forEach { $0.cancel() }; tasks = []; request = nil; identity = nil; consent = nil; seen = []
        loadDeadline?.cancel()
        loadDeadline = Task { @MainActor [weak self] in
            do { try await Task.sleep(for: .seconds(30)) } catch { return }
            guard let self, !self.disposed, self.loading else { return }; self.failed = true; self.loading = false
        }
        loading = true; failed = false
        if launch.embedded {
            guard let scriptURL = Bundle.module.url(forResource: "consumer-host", withExtension: "js"), let script = try? String(contentsOf: scriptURL, encoding: .utf8) else { failed = true; loading = false; return }
            var config: [String: String] = ["url": launch.url.absoluteString, "origin": launch.origin!]
            if isSample {
                guard let fixtureURL = Bundle.module.url(forResource: "consumer-fixture", withExtension: "js"), let fixture = try? String(contentsOf: fixtureURL, encoding: .utf8) else { failed = true; loading = false; return }
                config["origin"] = "https://staging.learncard.app"
                config["fixture"] = "<html><meta name='viewport' content='width=device-width,initial-scale=1'><body style='font:17px system-ui;padding:24px'><h1>Sample app</h1><p id='status'>Connecting…</p><p><button id='identity'>Connect account</button></p><p><button id='consent'>Review access</button></p><p><button id='unsupported'>Request unsupported feature</button></p><script>\(fixture.replacingOccurrences(of: "</script", with: "<\\/script"))</script></body></html>"
            }
            let data = try! JSONSerialization.data(withJSONObject: config, options: [.sortedKeys])
            let encoded = data.base64EncodedString()
            let html = "<html><meta name='viewport' content='width=device-width,initial-scale=1'><style>html,body{height:100%;margin:0;background:transparent}</style><body><script>window.nativeAppConfig=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob('\(encoded)'),c=>c.charCodeAt(0))));\(script.replacingOccurrences(of: "</script", with: "<\\/script"))</script></body></html>"
            webView.loadHTMLString(html, baseURL: Self.host)
        } else { webView.load(URLRequest(url: launch.url)) }
    }
    public func dispose() {
        guard !disposed else { return }
        disposed = true; tasks.forEach { $0.cancel() }; tasks = []; request = nil; identity = nil; consent = nil
        loadDeadline?.cancel(); loadDeadline = nil
        webView.configuration.userContentController.removeAllScriptMessageHandlers()
        webView.navigationDelegate = nil; webView.uiDelegate = nil; webView.stopLoading(); webView.loadHTMLString("", baseURL: nil)
    }
    public func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        let origin = message.frameInfo.securityOrigin
        guard !disposed, launch.embedded, message.frameInfo.isMainFrame, origin.protocol == "https", origin.host == Self.host.host, origin.port == 0 || origin.port == 443,
              let body = message.body as? [String: Any] else { return }
        if body["protocol"] as? String == "NATIVE_UI", body["kind"] as? String == "loaded" { loading = false; loadDeadline?.cancel(); return }
        guard body["protocol"] as? String == "LEARNCARD_V1",
              let id = body["requestId"] as? String, !id.isEmpty, id.count <= 256, !seen.contains(id), seen.count < 1000,
              let action = body["action"] as? String, let payload = body["payload"],
              let encoded = try? JSONSerialization.data(withJSONObject: payload, options: [.fragmentsAllowed]), encoded.count <= 256_000 else { return }
        seen.insert(id)
        if action == "GET_SYNC_STATUS" {
            reply(id, data: .object(["status": .string("ready"), "progress": .object(["totalCredentials": .number(0), "completedCredentials": .number(0), "failedCredentials": .number(0), "retryCount": .number(0)])]))
            return
        }
        guard request == nil else { reply(id, code: "LC_BUSY"); return }
        request = id
        let data = body["payload"] as? [String: Any] ?? [:]
        switch action {
        case "REQUEST_IDENTITY":
            if let challenge = data["challenge"], !(challenge is String) { reply(id, code: "LC_INVALID_REQUEST"); request = nil; return }
            identity = ConsumerIdentityRequest(id: id, challenge: data["challenge"] as? String)
        case "REQUEST_CONSENT":
            guard let uri = launch.contractURI, data["redirect"] as? Bool != true, data["contractUri"] == nil || data["contractUri"] as? String == uri else { reply(id, code: "LC_UNSUPPORTED_ACTION"); request = nil; return }
            perform(id) { [self] in
                guard let review = try await consumer.service.review(launch.id), review.contractURI == uri else { throw ConsumerAppError.changed }
                if !disposed, request == id { consent = review }
            }
        case "APP_EVENT":
            perform(id) { [self] in
                let event = try JSONDecoder().decode(PartnerValue.self, from: encoded)
                let result = try await consumer.service.event(launch.id, event: event)
                guard !disposed, request == id else { return }
                reply(id, data: result); request = nil
                if data["type"] as? String == "send-credential", case .object(let fields) = result, case .string = fields["credentialUri"] { offeredCredential = true; onCredential() }
            }
        default: reply(id, code: "LC_UNSUPPORTED_ACTION"); request = nil
        }
    }
    public func acceptIdentity() {
        guard let identity else { return }
        self.identity = nil
        perform(identity.id) { [self] in
            let value = try await consumer.service.identity(launch.id, origin: launch.origin!, challenge: identity.challenge)
            guard !disposed, request == identity.id else { return }; reply(identity.id, data: value); request = nil
        }
    }
    public func consentCompleted() { if let request { reply(request, data: .object(["granted": .bool(true)])) }; request = nil; consent = nil }
    public func decline() { if let request { reply(request, code: "LC_USER_CANCELLED") }; request = nil; identity = nil; consent = nil }
    private func perform(_ id: String, operation: @escaping @MainActor () async throws -> Void) {
        let expected = generation
        tasks.removeAll { $0.isCancelled }
        let task = Task { @MainActor [weak self] in
            do { try await operation() }
            catch { guard let self, !self.disposed, self.generation == expected, self.request == id else { return }; self.error = error as? ConsumerAppError ?? .connection; self.reply(id, code: "LC_REQUEST_FAILED"); self.request = nil }
        }
        tasks.append(task)
    }
    private func reply(_ id: String, data: PartnerValue? = nil, code: String? = nil) {
        guard !disposed else { return }
        var response: [String: PartnerValue] = ["protocol": .string("LEARNCARD_V1"), "requestId": .string(id), "type": .string(code == nil ? "SUCCESS" : "ERROR")]
        if let data { response["data"] = data }
        if let code { response["error"] = .object(["code": .string(code), "message": .string(NativeText.text(code == "LC_USER_CANCELLED" ? "common.cancel" : "error.unsupported"))]) }
        guard let json = try? JSONEncoder().encode(PartnerValue.object(response)), let raw = try? JSONSerialization.jsonObject(with: json) else { return }
        webView.callAsyncJavaScript("window.consumerReply(reply)", arguments: ["reply": raw], in: nil, in: .page) { _ in }
    }
    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { if !launch.embedded { loading = false; loadDeadline?.cancel() }; canGoBack = webView.canGoBack }
    public func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: any Error) { failed = true; loading = false }
    public func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: any Error) { failed = true; loading = false }
    public func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping @MainActor (WKNavigationActionPolicy) -> Void) {
        guard !disposed, let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        if navigationAction.targetFrame?.isMainFrame == true, launch.embedded {
            decisionHandler(url.absoluteString == Self.host.absoluteString || url.absoluteString == "about:blank" ? .allow : .cancel)
        } else { decisionHandler(AppWebOrigin(url: url) != nil || url.scheme == "about" ? .allow : .cancel) }
    }
    public func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        // Keep top-level web links in this browser. Embedded popups do not inherit account access.
        if !launch.embedded, let url = navigationAction.request.url, AppWebOrigin(url: url) != nil { webView.load(URLRequest(url: url)) }
        return nil
    }
}
