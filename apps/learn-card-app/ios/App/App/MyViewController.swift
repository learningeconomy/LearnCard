import Capacitor

/**
 * Custom bridge view controller (LC-2086 Task 10).
 *
 * `Main.storyboard` instantiates this class instead of the stock
 * `CAPBridgeViewController` so local plugins that live in the App target —
 * `ScreenshotObserverPlugin` — can be registered before the JS runtime
 * resolves them.
 */
class MyViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(ScreenshotObserverPlugin())
    }
}
