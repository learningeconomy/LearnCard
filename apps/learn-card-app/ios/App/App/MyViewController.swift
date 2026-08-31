import Capacitor

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

    override var canBecomeFirstResponder: Bool {
        true
    }

    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(ScreenshotObserverPlugin())
        bridge?.registerPluginInstance(shakeObserverPlugin)
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
