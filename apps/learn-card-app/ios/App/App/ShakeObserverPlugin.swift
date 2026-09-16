import Capacitor
import Foundation

/**
 * Local, explicitly controlled UIKit shake observer for iOS.
 *
 * UIKit decides what constitutes a shake. This plugin only gates delivery to
 * JavaScript between matching `start` and `stop` calls from the JS hook and
 * retains the native cooldown used by the shared Capacitor contract.
 */
@objc(ShakeObserverPlugin)
public class ShakeObserverPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ShakeObserverPlugin"
    public let jsName = "ShakeObserver"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise)
    ]

    private var cooldownMs = 2_000.0
    private var lastShakeAtMs = -Double.infinity
    private var isObserving = false

    @objc func start(_ call: CAPPluginCall) {
        // Threshold remains part of the cross-platform call shape for Android,
        // but UIKit owns shake sensitivity on iOS.
        let requestedThreshold = call.getDouble("threshold", 2.7)
        let requestedCooldownMs = call.getDouble("cooldownMs", cooldownMs)

        guard requestedThreshold.isFinite, requestedThreshold > 1 else {
            call.reject("threshold must be a finite value greater than 1")
            return
        }
        guard requestedCooldownMs.isFinite, requestedCooldownMs >= 0 else {
            call.reject("cooldownMs must be a non-negative finite value")
            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let self else {
                call.reject("Shake observer is unavailable")
                return
            }

            self.cooldownMs = requestedCooldownMs
            self.lastShakeAtMs = -Double.infinity
            self.isObserving = true
            call.resolve()
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            self?.stopSensing()
            call.resolve()
        }
    }

    /** Forward a UIKit `.motionShake` event when JavaScript has enabled sensing. */
    func handleShakeGesture() {
        guard isObserving else { return }

        let nowMs = ProcessInfo.processInfo.systemUptime * 1_000
        guard nowMs - lastShakeAtMs >= cooldownMs else { return }

        lastShakeAtMs = nowMs
        notifyListeners("shake", data: [:])
    }

    private func stopSensing() {
        isObserving = false
        lastShakeAtMs = -Double.infinity
    }

    deinit {
        stopSensing()
    }
}
