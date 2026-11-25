#if targetEnvironment(simulator)
import AVFoundation
import Capacitor
import Foundation

/// Simulator-only replacement for ML Kit's barcode plugin. Google ML Kit 8 does
/// not ship an arm64-simulator slice, so the real implementation remains device-only.
@objc(BarcodeScannerPlugin)
public class BarcodeScannerPlugin: CAPPlugin {
    private let unavailableMessage = "Barcode scanning requires a physical iOS device."

    @objc func startScan(_ call: CAPPluginCall) { reject(call) }
    @objc func stopScan(_ call: CAPPluginCall) { reject(call) }
    @objc func readBarcodesFromImage(_ call: CAPPluginCall) { reject(call) }
    @objc func scan(_ call: CAPPluginCall) { reject(call) }

    @objc func isSupported(_ call: CAPPluginCall) {
        call.resolve(["supported": false])
    }

    @objc func enableTorch(_ call: CAPPluginCall) { reject(call) }
    @objc func disableTorch(_ call: CAPPluginCall) { reject(call) }
    @objc func toggleTorch(_ call: CAPPluginCall) { reject(call) }

    @objc func isTorchEnabled(_ call: CAPPluginCall) {
        call.resolve(["enabled": false])
    }

    @objc func isTorchAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": false])
    }

    @objc func setZoomRatio(_ call: CAPPluginCall) { reject(call) }
    @objc func getZoomRatio(_ call: CAPPluginCall) { reject(call) }
    @objc func getMinZoomRatio(_ call: CAPPluginCall) { reject(call) }
    @objc func getMaxZoomRatio(_ call: CAPPluginCall) { reject(call) }
    @objc func openSettings(_ call: CAPPluginCall) { reject(call) }
    @objc func isGoogleBarcodeScannerModuleAvailable(_ call: CAPPluginCall) { reject(call) }
    @objc func installGoogleBarcodeScannerModule(_ call: CAPPluginCall) { reject(call) }

    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        call.resolve(["camera": AVCaptureDevice.authorizationStatus(for: .video).authorizationState])
    }

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        AVCaptureDevice.requestAccess(for: .video) { _ in
            self.checkPermissions(call)
        }
    }

    private func reject(_ call: CAPPluginCall) {
        call.unavailable(unavailableMessage)
    }
}

private extension AVAuthorizationStatus {
    var authorizationState: String {
        switch self {
        case .denied, .restricted:
            return "denied"
        case .authorized:
            return "granted"
        case .notDetermined:
            fallthrough
        @unknown default:
            return "prompt"
        }
    }
}
#endif
