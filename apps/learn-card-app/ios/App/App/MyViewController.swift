import Capacitor
import WebKit

/**
 * Custom bridge view controller (LC-2086 Task 10).
 *
 * `Main.storyboard` instantiates this class instead of the stock
 * `CAPBridgeViewController` so local plugins that live in the App target —
 * `ScreenshotObserverPlugin` and `ShakeObserverPlugin` — can be registered
 * before the JS runtime resolves them.
 */
class MyViewController: CAPBridgeViewController {
    private let shakeObserverPlugin = ShakeObserverPlugin()
    private let webAuthSessionPlugin = WebAuthSessionPlugin()
    private var crashNavigationObserver: CrashNavigationObserver?

    override var canBecomeFirstResponder: Bool {
        true
    }

    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(ScreenshotObserverPlugin())
        bridge?.registerPluginInstance(shakeObserverPlugin)
        bridge?.registerPluginInstance(webAuthSessionPlugin)
        bridge?.registerPluginInstance(NativeCrashReportingPlugin())
        if let webView, let delegate = webView.navigationDelegate {
            let observer = CrashNavigationObserver(delegate: delegate)
            crashNavigationObserver = observer
            webView.navigationDelegate = observer
        }
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        becomeFirstResponder()
    }

    override func motionBegan(_ motion: UIEvent.EventSubtype, with event: UIEvent?) {
        if motion == .motionShake {
            shakeObserverPlugin.handleShakeGesture()
        }

        super.motionBegan(motion, with: event)
    }
}

/// Forward every navigation callback to Capacitor, including its existing reload
/// after a WebKit process termination. This diagnostic is not a fatal app crash.
private class CrashNavigationObserver: NSObject, WKNavigationDelegate {
    private let delegate: WKNavigationDelegate

    init(delegate: WKNavigationDelegate) { self.delegate = delegate }

    override func responds(to selector: Selector!) -> Bool {
        super.responds(to: selector) || delegate.responds(to: selector)
    }

    override func forwardingTarget(for selector: Selector!) -> Any? { delegate }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        NativeCrashReporter.webViewTerminated()
        delegate.webViewWebContentProcessDidTerminate?(webView)
    }
}
