import SwiftUI
import VisionKit
import AVFoundation
import LearnCardNativeSDK

struct QRScannerView: View {
    @Environment(\.scenePhase) private var scenePhase
    @State private var permission = AVCaptureDevice.authorizationStatus(for: .video)
    @State private var failed = false
    let receive: (String) -> Void
    var body: some View {
        ZStack {
            Palette.cardInk
            if permission == .authorized, DataScannerViewController.isSupported, DataScannerViewController.isAvailable, !failed {
                CameraScanner(active: scenePhase == .active, receive: receive, unavailable: { failed = true }).frame(height: 270)
            } else {
                VStack(spacing: 16) {
                    Image("ClaimScanIllustration").resizable().scaledToFit().frame(width: 90, height: 90).accessibilityHidden(true)
                    Text(NativeText.text(permission == .denied || permission == .restricted ? "claims.cameraDenied" : "claims.cameraUnavailable"))
                        .font(.body).foregroundStyle(.white).multilineTextAlignment(.center)
                    if permission == .denied {
                        Link(NativeText.text("claims.openSettings"), destination: URL(string: UIApplication.openSettingsURLString)!).foregroundStyle(Palette.cyanCard)
                    }
                }.padding(24)
            }
        }.frame(minHeight: 270).clipShape(RoundedRectangle(cornerRadius: 28))
            .overlay(RoundedRectangle(cornerRadius: 28).stroke(Palette.cyanCard.opacity(0.6), lineWidth: 2))
            .accessibilityIdentifier("claim-camera")
            .task {
                if permission == .notDetermined && DataScannerViewController.isSupported { _ = await AVCaptureDevice.requestAccess(for: .video); permission = AVCaptureDevice.authorizationStatus(for: .video) }
            }
            .onChange(of: scenePhase) { _, phase in if phase == .active { permission = AVCaptureDevice.authorizationStatus(for: .video) } }
    }
}

private struct CameraScanner: UIViewControllerRepresentable {
    let active: Bool
    let receive: (String) -> Void
    let unavailable: () -> Void
    func makeCoordinator() -> Coordinator { Coordinator(receive: receive, unavailable: unavailable) }
    func makeUIViewController(context: Context) -> DataScannerViewController {
        let scanner = DataScannerViewController(recognizedDataTypes: [.barcode(symbologies: [.qr])], qualityLevel: .balanced,
            recognizesMultipleItems: false, isHighFrameRateTrackingEnabled: false, isGuidanceEnabled: true, isHighlightingEnabled: true)
        scanner.delegate = context.coordinator; return scanner
    }
    func updateUIViewController(_ scanner: DataScannerViewController, context: Context) {
        if active && !context.coordinator.delivered {
            do { if !scanner.isScanning { try scanner.startScanning() } }
            catch { Task { unavailable() } }
        } else { scanner.stopScanning() }
    }
    static func dismantleUIViewController(_ scanner: DataScannerViewController, coordinator: Coordinator) { scanner.stopScanning(); scanner.delegate = nil }
    @MainActor final class Coordinator: NSObject, DataScannerViewControllerDelegate {
        let receive: (String) -> Void; let unavailable: () -> Void
        var delivered = false
        init(receive: @escaping (String) -> Void, unavailable: @escaping () -> Void) { self.receive = receive; self.unavailable = unavailable }
        func dataScanner(_ scanner: DataScannerViewController, didAdd addedItems: [RecognizedItem], allItems: [RecognizedItem]) {
            guard !delivered, let value = allItems.compactMap({ item -> String? in if case .barcode(let code) = item { return code.payloadStringValue }; return nil }).first else { return }
            delivered = true; scanner.stopScanning(); receive(value)
        }
        func dataScanner(_ scanner: DataScannerViewController, becameUnavailableWithError error: DataScannerViewController.ScanningUnavailable) { scanner.stopScanning(); unavailable() }
    }
}
