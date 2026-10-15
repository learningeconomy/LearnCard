import XCTest
import ImageIO
import CoreGraphics
import UniformTypeIdentifiers
@testable import LearnCardNativeSDK

final class ProfilePhotoTests: XCTestCase {
    func testPhotoEditingCopyIsAvailableInEveryLanguage() {
        for language in [NativeLanguage.en, .es, .fr, .ar] {
            for key in ["profile.photo.title", "profile.photo.current", "profile.photo.new", "profile.photo.default", "profile.photo.caption",
                        "profile.photo.change", "profile.photo.choose", "profile.photo.remove", "profile.photo.preparing", "profile.photo.error",
                        "profile.details", "profile.name", "profile.bio", "profile.uploading", "profile.saving", "profile.save",
                        "profile.save.error", "profile.signin.caption", "profile.save.caption"] {
                XCTAssertNotEqual(NativeText.text(key, language: language), key)
            }
        }
    }

    func testPreparesBoundedSquareJPEGWithoutSourceMetadata() throws {
        let context = try XCTUnwrap(CGContext(data: nil, width: 2000, height: 1000, bitsPerComponent: 8, bytesPerRow: 0,
                                              space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue))
        context.setFillColor(CGColor(gray: 0.5, alpha: 1)); context.fill(CGRect(x: 0, y: 0, width: 2000, height: 1000))
        let image = try XCTUnwrap(context.makeImage()), source = NSMutableData()
        let destination = try XCTUnwrap(CGImageDestinationCreateWithData(source, UTType.jpeg.identifier as CFString, 1, nil))
        CGImageDestinationAddImage(destination, image, [kCGImagePropertyOrientation: 6,
            kCGImagePropertyGPSDictionary: [kCGImagePropertyGPSLatitude: 10, kCGImagePropertyGPSLatitudeRef: "N"],
            kCGImagePropertyExifDictionary: [kCGImagePropertyExifUserComment: "private source comment"],
        ] as CFDictionary)
        XCTAssertTrue(CGImageDestinationFinalize(destination))
        let result = try ProfilePhoto.prepare(source as Data)
        XCTAssertLessThanOrEqual(result.count, 1_000_000)
        let decoded = try XCTUnwrap(CGImageSourceCreateWithData(result as CFData, nil))
        XCTAssertEqual(CGImageSourceGetType(decoded) as String?, UTType.jpeg.identifier)
        let properties = try XCTUnwrap(CGImageSourceCopyPropertiesAtIndex(decoded, 0, nil) as? [CFString: Any])
        let width = try XCTUnwrap(properties[kCGImagePropertyPixelWidth] as? Int)
        XCTAssertEqual(width, properties[kCGImagePropertyPixelHeight] as? Int); XCTAssertLessThanOrEqual(width, 1024)
        XCTAssertNil(properties[kCGImagePropertyGPSDictionary])
        let exif = properties[kCGImagePropertyExifDictionary] as? [CFString: Any]
        XCTAssertNil(exif?[kCGImagePropertyExifUserComment])
    }

    func testRejectsUnreadableOrOversizedPhotoBeforeUpload() {
        for data in [Data(), Data("not an image".utf8), Data(repeating: 0, count: 25_000_001)] {
            XCTAssertThrowsError(try ProfilePhoto.prepare(data))
        }
    }

    func testCommandDistinguishesKeepingClearingAndReplacingPhoto() {
        XCTAssertNil(ProfileImageUpdate.unchanged.commandInput(name: "Person", bio: "")["image"])
        XCTAssertEqual(ProfileImageUpdate.remove.commandInput(name: "Person", bio: "")["image"], "")
        let url = URL(string: "https://cdn.filestackcontent.com/synthetic-photo")!
        XCTAssertEqual(ProfileImageUpdate.replace(url).commandInput(name: "Person", bio: "")["image"], url.absoluteString)
    }
}
