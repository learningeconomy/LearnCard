import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

/// Omission preserves the current image; removal explicitly clears the web profile's image field.
public enum ProfileImageUpdate: Equatable, Sendable {
    case unchanged, remove, replace(URL)

    public func commandInput(name: String, bio: String) -> [String: String] {
        var input = ["name": name, "bio": bio]
        switch self {
        case .unchanged: break
        case .remove: input["image"] = ""
        case .replace(let url): input["image"] = url.absoluteString
        }
        return input
    }
}

public enum ProfilePhotoEdit: Equatable, Sendable {
    case unchanged, remove, jpeg(Data)
}

/// Downsample before decoding, orient and crop to a square, then re-encode only pixels.
/// The uploaded JPEG contains no source EXIF, GPS, filename or other photo metadata.
public enum ProfilePhoto {
    public static func prepare(_ data: Data) throws -> Data {
        guard !data.isEmpty, data.count <= 25_000_000,
              let source = CGImageSourceCreateWithData(data as CFData, [kCGImageSourceShouldCache: false] as CFDictionary),
              let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
              let width = properties[kCGImagePropertyPixelWidth] as? Int,
              let height = properties[kCGImagePropertyPixelHeight] as? Int,
              width > 0, height > 0, width <= 16_000, height <= 16_000,
              width * height <= 80_000_000,
              let thumbnail = CGImageSourceCreateThumbnailAtIndex(source, 0, [
                kCGImageSourceCreateThumbnailFromImageAlways: true,
                kCGImageSourceCreateThumbnailWithTransform: true,
                kCGImageSourceThumbnailMaxPixelSize: 1024,
              ] as CFDictionary) else { throw AccountError.unavailable }
        let side = min(thumbnail.width, thumbnail.height)
        guard let cropped = thumbnail.cropping(to: CGRect(x: (thumbnail.width - side) / 2, y: (thumbnail.height - side) / 2, width: side, height: side)),
              let context = CGContext(data: nil, width: side, height: side, bitsPerComponent: 8, bytesPerRow: 0,
                                      space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)
        else { throw AccountError.unavailable }
        let rect = CGRect(x: 0, y: 0, width: side, height: side)
        context.setFillColor(CGColor(gray: 1, alpha: 1)); context.fill(rect); context.draw(cropped, in: rect)
        let output = NSMutableData()
        guard let pixels = context.makeImage(),
              let destination = CGImageDestinationCreateWithData(output, UTType.jpeg.identifier as CFString, 1, nil)
        else { throw AccountError.unavailable }
        CGImageDestinationAddImage(destination, pixels, [kCGImageDestinationLossyCompressionQuality: 0.82] as CFDictionary)
        guard CGImageDestinationFinalize(destination), output.length <= 1_000_000 else { throw AccountError.unavailable }
        return output as Data
    }
}
