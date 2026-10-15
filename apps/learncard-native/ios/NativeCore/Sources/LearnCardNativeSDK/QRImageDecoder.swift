import Foundation
import Vision
import ImageIO

public enum QRImageError: String, Error, LocalizedError, Sendable {
    case none, multiple, large
    public var errorDescription: String? { NativeText.text("claims.image.\(rawValue)") }
}
public enum QRImageDecoder {
    /// Decode locally; never upload the photo or guess which of several codes to claim.
    public static func decode(_ data: Data) throws -> String {
        guard data.count <= 20 * 1024 * 1024,
              let source = CGImageSourceCreateWithData(data as CFData, nil),
              let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
              let width = properties[kCGImagePropertyPixelWidth] as? Int,
              let height = properties[kCGImagePropertyPixelHeight] as? Int, width > 0, height > 0,
              width <= 20_000_000 / height else { throw QRImageError.large }
        let orientation = CGImagePropertyOrientation(rawValue: (properties[kCGImagePropertyOrientation] as? UInt32) ?? 1) ?? .up
        let request = VNDetectBarcodesRequest(); request.symbologies = [.qr]
        try VNImageRequestHandler(data: data, orientation: orientation).perform([request])
        let values = Set((request.results ?? []).compactMap(\.payloadStringValue).filter { !$0.isEmpty })
        guard !values.isEmpty else { throw QRImageError.none }
        guard values.count == 1, let value = values.first else { throw QRImageError.multiple }
        return value
    }
}
