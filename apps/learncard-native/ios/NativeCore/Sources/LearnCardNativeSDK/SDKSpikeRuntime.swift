import Foundation
import WebKit
import JavaScriptCore
import CryptoKit

public enum SpikeCommand: String, Sendable {
    case credentials, encryption, recovery, presentation, transfer
    case exchange
}

public enum SDKRuntimeError: Error, LocalizedError {
    case resourcesMissing, notReady, invalidResponse, loadFailed, timedOut

    public var errorDescription: String? {
        switch self {
        case .resourcesMissing: "Build the SDK spike resources before running."
        case .notReady: "The SDK runtime is not ready."
        case .invalidResponse: "The SDK returned an invalid response."
        case .loadFailed: "The local SDK runtime couldn't load."
        case .timedOut: "The local SDK runtime took too long to respond."
        }
    }
}

/// Compatibility harness using only generated disposable test identities.
/// This is not an account sign-in API. The web view hosts SDK code only; all product UI is SwiftUI.
@MainActor
public final class SDKSpikeRuntime: NSObject, WKNavigationDelegate {
    private let webView: WKWebView
    private let resources: URL
    private var navigation: CheckedContinuation<Void, Error>?
    private var timeout: Task<Void, Never>?
    private var ready = false
    private let stagingTest: Bool
    private let transport: StagingTransport?
    private var pendingCall: CheckedContinuation<String, Error>?
    private var callTimeout: Task<Void, Never>?

    public init(stagingTest: Bool = false) {
        self.stagingTest = stagingTest
        transport = stagingTest ? StagingTransport() : nil
        resources = Bundle.module.resourceURL!
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        configuration.limitsNavigationsToAppBoundDomains = true
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        // This SDK host has no UI window. tRPC batching requires its task queue to run.
        configuration.preferences.inactiveSchedulingPolicy = .none
        if let transport {
            configuration.userContentController.addScriptMessageHandler(transport, contentWorld: .page, name: "stagingTransport")
        }
        webView = WKWebView(frame: .zero, configuration: configuration)
        super.init()
        webView.navigationDelegate = self
    }

    public func initialize() async throws -> String {
        let html = resources.appendingPathComponent(stagingTest ? "live-index.html" : "index.html")
        guard FileManager.default.fileExists(atPath: resources.appendingPathComponent(stagingTest ? "live-sdk.js" : "sdk.js").path) else {
            throw SDKRuntimeError.resourcesMissing
        }
        try await withCheckedThrowingContinuation { continuation in
            navigation = continuation
            timeout = Task { @MainActor [weak self] in
                do { try await Task.sleep(for: .seconds(20)) } catch { return }
                self?.finishNavigation(error: SDKRuntimeError.timedOut)
            }
            webView.loadFileURL(html, allowingReadAccessTo: resources)
        }
        let wasm = try Data(contentsOf: resources.appendingPathComponent("didkit.wasm"))
        let vectorData = try Data(contentsOf: resources.appendingPathComponent(stagingTest ? "live-vectors.json" : "vectors.json"))
        let vectors = try JSONSerialization.jsonObject(with: vectorData)
        let result = try await call("initialize", arguments: ["wasmBase64": wasm.base64EncodedString(), "vectors": vectors])
        ready = true
        guard var output = try JSONSerialization.jsonObject(with: Data(result.utf8)) as? [String: Any] else {
            throw SDKRuntimeError.invalidResponse
        }
        output["inputSha256"] = SHA256.hash(data: vectorData).map { String(format: "%02x", $0) }.joined()
        output["resourcePath"] = resources.path
        return String(data: try JSONSerialization.data(withJSONObject: output), encoding: .utf8)!
    }

    public func run(_ command: SpikeCommand) async throws -> String {
        guard ready else { throw SDKRuntimeError.notReady }
        return try await call(command.rawValue, arguments: [:])
    }

    private func call(_ method: String, arguments: [String: Any]) async throws -> String {
        guard pendingCall == nil else { throw SDKRuntimeError.notReady }
        // Arguments are structured values, never interpolated JavaScript.
        return try await withCheckedThrowingContinuation { continuation in
            pendingCall = continuation
            callTimeout = Task { @MainActor [weak self] in
                do { try await Task.sleep(for: .seconds(120)) } catch { return }
                self?.transport?.stop()
                self?.ready = false
                self?.finishCall(.failure(SDKRuntimeError.timedOut))
            }
            webView.callAsyncJavaScript("return await globalThis.LearnCardSpike.call(method, input)",
                                        arguments: ["method": method, "input": arguments],
                                        in: nil, in: .page) { [weak self] result in
                switch result {
                case .success(let value):
                    guard let json = value as? String else {
                        self?.finishCall(.failure(SDKRuntimeError.invalidResponse))
                        return
                    }
                    self?.finishCall(.success(json))
                case .failure(let error): self?.finishCall(.failure(error))
                }
            }
        }
    }

    private func finishCall(_ result: Result<String, Error>) {
        guard let continuation = pendingCall else { return }
        pendingCall = nil
        callTimeout?.cancel()
        callTimeout = nil
        continuation.resume(with: result)
    }

    public var stagingDiagnostics: String { transport?.diagnostics.joined(separator: "\n") ?? "No native requests" }

    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        finishNavigation()
    }

    public func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        finishNavigation(error: SDKRuntimeError.loadFailed)
    }

    public func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        finishNavigation(error: SDKRuntimeError.loadFailed)
    }

    public func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                        decisionHandler: @escaping @MainActor @Sendable (WKNavigationActionPolicy) -> Void) {
        // No remote navigation, custom schemes, redirects, or arbitrary local files.
        let expected = resources.appendingPathComponent(stagingTest ? "live-index.html" : "index.html").standardizedFileURL
        let allowed = navigationAction.request.url?.standardizedFileURL == expected
        decisionHandler(allowed ? .allow : .cancel)
        if !allowed { finishNavigation(error: SDKRuntimeError.loadFailed) }
    }

    private func finishNavigation(error: Error? = nil) {
        guard let continuation = navigation else { return }
        navigation = nil
        timeout?.cancel()
        timeout = nil
        if let error { continuation.resume(throwing: error) }
        else { continuation.resume() }
    }

    /// Compile the actual SDK WASM under JSContext, then attempt the unadapted SDK bundle.
    /// Success here does not imply minimum-iOS or real-device compatibility.
    public static func javascriptCoreProbe() throws -> String {
        let context = JSContext()!
        let resources = Bundle.module.resourceURL!
        let data = try Data(contentsOf: resources.appendingPathComponent("didkit.wasm"))
        let bytes = UnsafeMutableRawPointer.allocate(byteCount: data.count, alignment: 1)
        data.copyBytes(to: bytes.assumingMemoryBound(to: UInt8.self), count: data.count)
        var exception: JSValueRef?
        guard let object = JSObjectMakeTypedArrayWithBytesNoCopy(context.jsGlobalContextRef,
                    kJSTypedArrayTypeUint8Array, bytes, data.count,
                    { pointer, _ in pointer?.deallocate() }, nil, &exception) else {
            bytes.deallocate()
            throw SDKRuntimeError.invalidResponse
        }
        context.setObject(JSValue(jsValueRef: object, in: context), forKeyedSubscript: "wasmBytes" as NSString)
        let wasmResult = context.evaluateScript("""
            (() => { try { const module = new WebAssembly.Module(wasmBytes);
                return { compiled: true, imports: WebAssembly.Module.imports(module).length };
            } catch (error) { return { compiled: false, error: String(error) }; } })()
            """)!.toDictionary() ?? [:]
        context.exception = nil
        let sdk = try String(contentsOf: resources.appendingPathComponent("sdk.js"), encoding: .utf8)
        context.evaluateScript(sdk)
        let result: [String: Any] = ["wasm": wasmResult,
            "unadaptedSDKLoaded": context.exception == nil,
            "sdkError": context.exception?.toString() ?? "",
            "notice": "Simulator-only capability probe; no real account data used."]
        return String(data: try JSONSerialization.data(withJSONObject: result, options: [.sortedKeys]), encoding: .utf8)!
    }
}
