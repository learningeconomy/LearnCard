import XCTest
import UIKit

@MainActor final class AccountMotionUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testLaunchAndReconnectKeepTheStaticLaunchMarkPositionAndSize() {
        for mode in ["launch", "reconnect"] {
            let app = launch(mode, extra: ["--motion-reduced"])
            let mark = app.descendants(matching: .any)["brand-motion-mark"].firstMatch
            XCTAssertTrue(mark.waitForExistence(timeout: 5))
            XCTAssertEqual(mark.frame.midY, app.frame.height * 0.365, accuracy: 3)
            XCTAssertEqual(mark.frame.width, min(224, app.frame.width * 0.57), accuracy: 1)
            capture(app, "Shared launch composition \(mode)"); app.terminate()
        }
    }

    func testSettledLogoKeepsStopMotionLifeAndBackgroundFloats() {
        let app = launch("launch", extra: ["--motion-settled"])
        let mark = app.descendants(matching: .any)["brand-motion-mark"].firstMatch
        XCTAssertTrue(mark.waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Opening LearnCard…"].exists)
        let first = mark.screenshot().pngRepresentation
        let moves = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in mark.screenshot().pngRepresentation != first }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [moves], timeout: 5), .completed)
        let backdrop = lowerBackdrop(app)
        let floats = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in self.lowerBackdrop(app) != backdrop }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [floats], timeout: 5), .completed)
        capture(app, "Settled stop-motion mosaic and floating paint")
    }
    func testReduceMotionShowsStillMosaicInDarkAppearance() {
        let app = launch("reconnect", extra: ["--motion-reduced", "--preview-dark"])
        let mark = app.descendants(matching: .any)["brand-motion-mark"].firstMatch
        XCTAssertTrue(mark.waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Connecting your account…"].exists)
        let first = mark.screenshot().pngRepresentation
        let changes = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in mark.screenshot().pngRepresentation != first }, object: nil)
        changes.isInverted = true
        XCTAssertEqual(XCTWaiter.wait(for: [changes], timeout: 1.2), .completed)
        capture(app, "Calm dark reconnect with Reduce Motion")
    }
    func testLockedScreenSupportsArabicAccessibilityAndVisibleContinue() {
        let app = launch("locked", extra: ["--motion-reduced", "--locale", "ar", "--large-type"])
        XCTAssertTrue(app.staticTexts["مرحبًا بعودتك"].waitForExistence(timeout: 5))
        let next = app.buttons["resume-saved-account"]
        if !next.isHittable { app.swipeUp() }
        XCTAssertTrue(next.isHittable); XCTAssertGreaterThanOrEqual(next.frame.height, 44)
        XCTAssertLessThan(next.frame.maxX, app.frame.maxX + 1)
        capture(app, "Arabic accessibility lock screen")
    }
    private func launch(_ mode: String, extra: [String] = []) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["--motion-review", mode] + (extra.contains("--locale") ? [] : ["--locale", "en"]) + extra
        app.launch(); return app
    }
    private func capture(_ app: XCUIApplication, _ title: String) {
        let image = XCTAttachment(screenshot: app.screenshot()); image.name = title; image.lifetime = .keepAlways; add(image)
    }
    private func lowerBackdrop(_ app: XCUIApplication) -> Data? {
        guard let image = app.screenshot().image.cgImage,
              let crop = image.cropping(to: CGRect(x: 0, y: Double(image.height) * 0.79, width: Double(image.width), height: Double(image.height) * 0.18)) else { return nil }
        return UIImage(cgImage: crop).pngData()
    }
}
