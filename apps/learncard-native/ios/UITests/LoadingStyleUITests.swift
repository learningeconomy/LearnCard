import XCTest

@MainActor final class LoadingStyleUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private func review(_ flags: [String]) -> XCUIApplication {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--loading-gallery"] + flags; app.launch()
        XCTAssertTrue(app.staticTexts["page-title-loading-review"].waitForExistence(timeout: 15))
        return app
    }
    func testContextualLoadingAndDeterminateProgressKeepTheirMeaning() {
        let app = review(["--locale", "en", "--standard-type"])
        XCTAssertTrue(app.staticTexts["Checking availability…"].exists)
        XCTAssertFalse(app.buttons["loading-review-button"].isEnabled)
        let progress = app.progressIndicators["loading-review-determinate"]
        XCTAssertTrue(progress.exists); XCTAssertTrue((progress.value as? String ?? "").contains("40"))
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Inline loading native English"; shot.lifetime = .keepAlways; add(shot)
    }
    func testArabicDarkReducedLoadingLabelsRemainReachable() {
        let app = review(["--locale", "ar", "--preview-dark", "--large-type", "--motion-reduced"])
        let status = app.descendants(matching: .any).matching(identifier: "loading-review-status").firstMatch
        XCTAssertTrue(status.exists)
        let button = app.buttons["loading-review-button"]
        for _ in 0..<6 where !button.isHittable { app.swipeUp() }
        XCTAssertTrue(button.exists); XCTAssertFalse(button.isEnabled)
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Inline loading Arabic dark accessibility reduced motion"; shot.lifetime = .keepAlways; add(shot)
    }
}
