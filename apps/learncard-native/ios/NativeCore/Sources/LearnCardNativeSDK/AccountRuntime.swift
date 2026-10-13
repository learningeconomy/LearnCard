import Foundation
import WebKit
import LearnCardNativeCore

public struct AccountState: Decodable, Sendable {
    public let phase: String
    public let methods: [String]
    public let error: String?
    public let profileName: String?
    public let profileId: String?
    public let profileImage: URL?
    public let profileBio: String?
    public let signingDid: String?
    public let profileDid: String?
    public init(phase: String, methods: [String] = [], error: String? = nil, profileName: String? = nil,
                profileId: String? = nil, profileImage: URL? = nil, profileBio: String? = nil,
                signingDid: String? = nil, profileDid: String? = nil) {
        self.phase = phase; self.methods = methods; self.error = error; self.profileName = profileName
        self.profileId = profileId; self.profileImage = profileImage; self.profileBio = profileBio
        self.signingDid = signingDid; self.profileDid = profileDid
    }
}

/// Bundled, windowless SDK host. Signing/recovery keys never appear in native command replies.
@MainActor
public final class AccountRuntime: NSObject, WKNavigationDelegate {
    private let webView: WKWebView
    private let bridge: AccountBridge
    private let transport = StagingTransport(accountHost: true)
    private let resources = Bundle.module.resourceURL!
    private var loading: CheckedContinuation<Void, Error>?
    private var pending: CheckedContinuation<String, Error>?
    private var deadline: Task<Void, Never>?
    private var disposed = false
    private var ready = false
    private let commands = AccountCommandQueue()

    public init(user: FirebaseUser, vault: KeychainVault, firebase: FirebaseSession) {
        bridge = AccountBridge(user: user, vault: vault, firebase: firebase)
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .nonPersistent()
        config.limitsNavigationsToAppBoundDomains = true
        config.preferences.inactiveSchedulingPolicy = .none
        config.userContentController.addScriptMessageHandler(bridge, contentWorld: .page, name: "accountNative")
        config.userContentController.addScriptMessageHandler(transport, contentWorld: .page, name: "accountTransport")
        webView = WKWebView(frame: .zero, configuration: config)
        super.init()
        webView.navigationDelegate = self
    }

    public func initialize() async throws -> AccountState {
        guard !disposed else { throw AccountError.cancelled }
        let page = resources.appendingPathComponent("account-index.html")
        guard FileManager.default.fileExists(atPath: resources.appendingPathComponent("account-sdk.js").path) else { throw AccountError.unavailable }
        try await withCheckedThrowingContinuation { continuation in
            loading = continuation
            deadline = Task { @MainActor [weak self] in
                do { try await Task.sleep(for: .seconds(20)) } catch { return }
                self?.dispose()
            }
            webView.loadFileURL(page, allowingReadAccessTo: resources)
        }
        let wasm = try Data(contentsOf: resources.appendingPathComponent("didkit.wasm"))
        let user = try JSONSerialization.jsonObject(with: JSONEncoder().encode(bridge.user))
        let state: AccountState = try await command("initialize", input: ["user": user, "wasmBase64": wasm.base64EncodedString()])
        ready = state.phase == "ready"
        return state
    }

    public func recover(method: String, phrase: String = "", fileContents: String = "", password: String = "", emailShare: String = "") async throws -> AccountState {
        let state: AccountState = try await command("recover", input: ["method": method, "phrase": phrase, "fileContents": fileContents, "password": password, "emailShare": emailShare])
        ready = state.phase == "ready"
        return state
    }

    public func snapshot(more: Bool = false) async throws -> CollectionSnapshot {
        guard ready else { throw AccountError.unavailable }
        return try await command(more ? "more" : "snapshot")
    }
    public func claim(_ uri: String) async throws -> CollectionSnapshot { try await command("claim", input: ["uri": uri]) }
    public func create(title: String, summary: String, kind: CredentialKind) async throws -> CollectionSnapshot {
        try await command("create", input: ["title": title, "summary": summary, "kind": kind.rawValue])
    }
    public func create(draft: CredentialDraft) async throws -> CollectionSnapshot {
        let input = try JSONSerialization.jsonObject(with: JSONEncoder().encode(draft)) as? [String: Any] ?? [:]
        return try await command("createDraft", input: input)
    }
    public func creations(cursor: String? = nil) async throws -> CreationPage {
        try await command("creations", input: cursor.map { ["cursor": $0] } ?? [:])
    }
    public func searchRecipients(_ query: String) async throws -> [AccountRecipient] { try await command("searchRecipients", input: ["query": query]) }
    public func send(_ uri: String, recipient: String) async throws -> CollectionSnapshot { try await command("send", input: ["uri": uri, "recipient": recipient]) }
    public func recipient(_ profileId: String) async throws -> AccountRecipient { try await command("recipient", input: ["profileId": profileId]) }
    public func share(credentialIDs: [String], title: String, requestID: String, passcode: String?) async throws -> CredentialShare {
        var input: [String: Any] = ["uris": credentialIDs, "title": title, "requestID": requestID]
        if let passcode, !passcode.isEmpty { input["passcode"] = passcode }
        return try await command("share", input: input)
    }
    public func updateProfile(name: String, bio: String) async throws -> AccountState {
        try await command("updateProfile", input: ["name": name, "bio": bio])
    }
    public func signOut(forget: Bool) async throws { let _: AccountState = try await command(forget ? "forget" : "signOut"); dispose() }

    public func dispose() {
        guard !disposed else { return }
        disposed = true; ready = false
        commands.dispose()
        deadline?.cancel(); deadline = nil
        bridge.invalidate(); transport.stop()
        webView.configuration.userContentController.removeAllScriptMessageHandlers()
        webView.stopLoading()
        loading?.resume(throwing: AccountError.cancelled); loading = nil
        pending?.resume(throwing: AccountError.cancelled); pending = nil
        webView.navigationDelegate = nil
        webView.loadHTMLString("", baseURL: nil)
    }

    func command<T: Decodable>(_ method: String, input: [String: Any] = [:]) async throws -> T {
        try await commands.acquire()
        defer { commands.release() }
        guard !disposed, pending == nil else { throw AccountError.cancelled }
        let text: String = try await withCheckedThrowingContinuation { continuation in
            pending = continuation
            deadline = Task { @MainActor [weak self] in
                do { try await Task.sleep(for: .seconds(120)) } catch { return }
                self?.dispose()
            }
            webView.callAsyncJavaScript("return await globalThis.LearnCardAccount.call(method, input)",
                arguments: ["method": method, "input": input], in: nil, in: .page) { [weak self] result in
                    guard let self, let continuation = self.pending else { return }
                    self.pending = nil; self.deadline?.cancel(); self.deadline = nil
                    switch result {
                    case .success(let value):
                        if let value = value as? String, value.utf8.count <= 16 * 1024 * 1024 { continuation.resume(returning: value) }
                        else { continuation.resume(throwing: AccountError.unavailable) }
                    case .failure: continuation.resume(throwing: AccountError.connection)
                    }
                }
        }
        return try AccountReply.decode(text, method: method)
    }

    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        deadline?.cancel(); deadline = nil
        loading?.resume(); loading = nil
    }
    public func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { dispose() }
    public func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { dispose() }
    public func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { dispose() }
    public func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                        decisionHandler: @escaping @MainActor @Sendable (WKNavigationActionPolicy) -> Void) {
        decisionHandler(!disposed && action.request.url?.standardizedFileURL == resources.appendingPathComponent("account-index.html").standardizedFileURL ? .allow : .cancel)
    }
}

public struct AccountRecipient: Decodable, Sendable, Identifiable, Hashable {
    public let id: String; public let name: String
    public init(id: String, name: String) { self.id = id; self.name = name }
}

@MainActor
public final class LiveCredentialService: CredentialService {
    private let runtime: AccountRuntime
    public init(runtime: AccountRuntime) { self.runtime = runtime }
    public func snapshot() async throws -> CollectionSnapshot { try await runtime.snapshot() }
    public func loadMore() async throws -> CollectionSnapshot { try await runtime.snapshot(more: true) }
    public func claim(offerID: String) async throws -> CollectionSnapshot { try await runtime.claim(offerID) }
    public func create(title: String, summary: String, kind: CredentialKind) async throws -> CollectionSnapshot { try await runtime.create(title: title, summary: summary, kind: kind) }
    public func create(draft: CredentialDraft) async throws -> CollectionSnapshot { try await runtime.create(draft: draft) }
    public func creations(cursor: String? = nil) async throws -> CreationPage { try await runtime.creations(cursor: cursor) }
    public func searchRecipients(_ query: String) async throws -> [AccountRecipient] { try await runtime.searchRecipients(query) }
    public func send(credentialID: String, recipient: String) async throws -> CollectionSnapshot { try await runtime.send(credentialID, recipient: recipient) }
    public func recipient(_ profileId: String) async throws -> AccountRecipient { try await runtime.recipient(profileId) }
    public func share(credentialIDs: [String], title: String, requestID: String, passcode: String?) async throws -> CredentialShare {
        try await runtime.share(credentialIDs: credentialIDs, title: title, requestID: requestID, passcode: passcode)
    }
}
