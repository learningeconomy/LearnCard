import Capacitor
import Foundation
import Sentry

/// Own native initialization: the Capacitor SDK's automatic initialization cannot
/// install our native beforeSend callback or honor a persisted opt-out before upload.
enum NativeCrashReporter {
    private static let preferenceKey = "learncard.crashReporting.enabled"
    private static let stateLock = NSLock()
    private static var _privateSession = false
    private static var privateSession: Bool {
        get {
            stateLock.lock()
            defer { stateLock.unlock() }
            return _privateSession
        }
        set {
            stateLock.lock()
            _privateSession = newValue
            stateLock.unlock()
        }
    }
    private static var started = false
    private static var runtimeTags: [String: String] = [:]
    private static let generationKey = "learncard.crashReporting.cacheGeneration"
    private static let cacheRoot = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        .appendingPathComponent("learncard-native-crashes")
    private static var cachePath: String {
        cacheRoot.appendingPathComponent(UserDefaults.standard.string(forKey: generationKey) ?? "initial").path
    }

    static var enabled: Bool {
        // An upgrading user may already have opted out in their account. Until
        // the first JS preference sync, absence is not permission to collect.
        !privateSession && (UserDefaults.standard.object(forKey: preferenceKey) as? Bool ?? false)
    }

    static func inspect(url: URL?) {
        guard let path = url?.path else { return }
        if path == "/s" || path.hasPrefix("/s/") { configure(privateSession: true) }
    }

    static func configure(enabled: Bool? = nil, privateSession: Bool = false, tags: [String: String] = [:]) {
        if let enabled { UserDefaults.standard.set(enabled, forKey: preferenceKey) }
        self.privateSession = self.privateSession || privateSession
        // Never synchronize arbitrary JS scope data, user IDs, or credential payloads.
        for key in ["web_version", "web_sha", "ota_bundle", "route_group"] {
            if let value = tags[key], value.range(of: "^[A-Za-z0-9._-]{1,100}$", options: .regularExpression) != nil {
                runtimeTags[key] = value
            }
        }
        guard self.enabled else {
            // A transport finishing after close may recreate an old cache file.
            // Rotate first so no future opt-in can replay that generation.
            UserDefaults.standard.set(UUID().uuidString, forKey: generationKey)
            if started { SentrySDK.close(); started = false }
            // This directory is exclusively ours; never remove the application's cache.
            try? FileManager.default.removeItem(at: cacheRoot)
            return
        }
        start()
        SentrySDK.configureScope { scope in
            runtimeTags.forEach { scope.setTag(value: $0.value, key: $0.key) }
        }
    }

    static func start() {
        guard !started, enabled,
              let url = Bundle.main.url(forResource: "tenant-config", withExtension: "json", subdirectory: "public"),
              let data = try? Data(contentsOf: url),
              let config = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let observability = config["observability"] as? [String: Any],
              let dsn = observability["sentryDsn"] as? String, !dsn.isEmpty,
              let environment = observability["sentryEnv"] as? String,
              !environment.isEmpty, environment != "development" else { return }

        SentrySDK.start { options in
            options.dsn = dsn
            options.environment = environment
            options.cacheDirectoryPath = cachePath
            options.sendDefaultPii = false
            options.enableAutoSessionTracking = false
            options.enableAutoBreadcrumbTracking = false
            options.enableNetworkTracking = false
            options.enableSwizzling = false
            options.enableAppHangTracking = false
            options.attachScreenshot = false
            options.attachViewHierarchy = false
            options.shutdownTimeInterval = 0
            options.initialScope = { scope in
                scope.setTag(value: config["tenantId"] as? String ?? "unknown", key: "tenant_id")
                scope.setTag(value: "ios", key: "app_platform")
                scope.setTag(value: "native", key: "error_layer")
                return scope
            }
            options.beforeBreadcrumb = { _ in nil }
            options.beforeSend = { event in
                guard enabled else { return nil }
                // Keep native frames, signal/exception types, binary images and device
                // diagnostics. Native exception reasons can contain entered text/URLs.
                event.user = nil
                event.request = nil
                event.extra = nil
                event.breadcrumbs = nil
                event.message = event.tags?["error_kind"] == "webview_termination"
                    ? SentryMessage(formatted: "WKWebView content process terminated") : nil
                event.exceptions?.forEach { $0.value = "Native exception; see stack trace" }
                return event
            }
        }
        started = true
        SentrySDK.configureScope { scope in
            scope.setTag(value: config["tenantId"] as? String ?? "unknown", key: "tenant_id")
            scope.setTag(value: "ios", key: "app_platform")
            scope.setTag(value: "native", key: "error_layer")
        }
    }

    static func webViewTerminated() {
        guard started, enabled else { return }
        SentrySDK.capture(message: "WKWebView content process terminated") { scope in
            scope.setLevel(.warning)
            scope.setTag(value: "webview_termination", key: "error_kind")
        }
    }
}

@objc(NativeCrashReportingPlugin)
public class NativeCrashReportingPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeCrashReportingPlugin"
    public let jsName = "NativeCrashReporting"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "configure", returnType: CAPPluginReturnPromise)
    ]

    @objc func configure(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            NativeCrashReporter.configure(
                enabled: call.getBool("enabled"),
                privateSession: call.getBool("privateSession", false),
                tags: call.getObject("tags") as? [String: String] ?? [:]
            )
            call.resolve(["enabled": NativeCrashReporter.enabled])
        }
    }
}
