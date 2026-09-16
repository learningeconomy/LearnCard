import Capacitor
import UIKit

/**
 * Local iOS-only plugin (LC-2086 Task 10).
 *
 * Forwards UIKit's `userDidTakeScreenshotNotification` to the JS side as a
 * `screenshotTaken` event. The event is informational only: no screenshot
 * image is read or persisted here — the JS feedback flow renders its own
 * privacy-safe HTML capture of the current viewport.
 */
@objc(ScreenshotObserverPlugin)
public class ScreenshotObserverPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ScreenshotObserverPlugin"
    public let jsName = "ScreenshotObserver"
    public let pluginMethods: [CAPPluginMethod] = []

    private var observer: NSObjectProtocol?

    public override func load() {
        observer = NotificationCenter.default.addObserver(
            forName: UIApplication.userDidTakeScreenshotNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.notifyListeners(
                "screenshotTaken",
                data: ["capturedAt": ISO8601DateFormatter().string(from: Date())]
            )
        }
    }

    deinit {
        if let observer { NotificationCenter.default.removeObserver(observer) }
    }
}
