import Capacitor
import CoreMotion
import Foundation

/**
 * Local, explicitly controlled shake observer for iOS.
 *
 * Construction and plugin loading do not start Core Motion. The accelerometer
 * is active only between matching `start` and `stop` calls from the JS hook.
 */
@objc(ShakeObserverPlugin)
public class ShakeObserverPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ShakeObserverPlugin"
    public let jsName = "ShakeObserver"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise)
    ]

    private let motionManager = CMMotionManager()
    private var threshold = 2.7
    private var cooldownMs = 2_000.0
    private var lastShakeAtMs = -Double.infinity

    @objc func start(_ call: CAPPluginCall) {
        let requestedThreshold = call.getDouble("threshold", threshold)
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

            self.threshold = requestedThreshold
            self.cooldownMs = requestedCooldownMs

            guard self.motionManager.isAccelerometerAvailable else {
                call.unavailable("Accelerometer is unavailable")
                return
            }

            // Idempotent: a repeated start only refreshes tuning values.
            guard !self.motionManager.isAccelerometerActive else {
                call.resolve()
                return
            }

            self.lastShakeAtMs = -Double.infinity
            self.motionManager.accelerometerUpdateInterval = 1.0 / 50.0
            self.motionManager.startAccelerometerUpdates(to: .main) { [weak self] data, _ in
                guard let self, let acceleration = data?.acceleration else { return }

                let magnitude = sqrt(
                    acceleration.x * acceleration.x +
                        acceleration.y * acceleration.y +
                        acceleration.z * acceleration.z
                )
                let nowMs = ProcessInfo.processInfo.systemUptime * 1_000

                guard magnitude >= self.threshold else { return }
                guard nowMs - self.lastShakeAtMs >= self.cooldownMs else { return }

                self.lastShakeAtMs = nowMs
                self.notifyListeners("shake", data: [:])
            }

            call.resolve()
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            self?.stopSensing()
            call.resolve()
        }
    }

    private func stopSensing() {
        // Core Motion's stop method is safe to call repeatedly.
        motionManager.stopAccelerometerUpdates()
        lastShakeAtMs = -Double.infinity
    }

    deinit {
        motionManager.stopAccelerometerUpdates()
    }
}
