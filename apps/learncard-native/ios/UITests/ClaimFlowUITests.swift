import XCTest

@MainActor final class ClaimFlowUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private let publicLink = "https://staging.learncard.app/claim/boost?boostUri=lc%3Anetwork%3Astaging.network.learncard.com%2Ftrpc%3Aboost%3Asample&challenge=synthetic-token"
    private func capture(_ app: XCUIApplication, _ name: String) {
        let image = XCTAttachment(screenshot: app.screenshot()); image.name = name; image.lifetime = .keepAlways; add(image)
    }
    func testScanEntryReviewAndSuccessDoNotSkipConfirmation() {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--locale", "en"]; app.launch()
        app.buttons["nav-inbox"].tap(); app.buttons["inbox-scan"].tap()
        XCTAssertTrue(app.buttons["claim-photo"].waitForExistence(timeout: 5))
        capture(app, "Scanner with camera availability and local photo or paste alternatives")
        app.swipeUp(); app.buttons["use-sample-link"].tap(); app.buttons["review-link"].tap()
        XCTAssertTrue(app.buttons["claim"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["claim-view"].exists)
        capture(app, "Native claim review before explicit confirmation")
        app.swipeUp(); app.buttons["claim"].tap()
        XCTAssertTrue(app.buttons["claim-view"].waitForExistence(timeout: 10))
        capture(app, "Illustrated successful credential claim")
        app.buttons["claim-view"].tap(); XCTAssertTrue(app.navigationBars["Credential"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Ready to help"].exists)
    }
    func testClaimCompletionWithFrenchLargeTextInDarkMode() {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--locale", "fr", "--preview-dark", "--large-type"]; app.launch()
        app.buttons["nav-inbox"].tap(); app.buttons["inbox-scan"].tap()
        app.swipeUp(); app.swipeUp(); app.buttons["use-sample-link"].tap(); app.buttons["review-link"].tap()
        XCTAssertTrue(app.buttons["claim"].waitForExistence(timeout: 5)); app.swipeUp(); app.swipeUp(); app.buttons["claim"].tap()
        XCTAssertTrue(app.buttons["claim-view"].waitForExistence(timeout: 10)); app.swipeUp()
        capture(app, "French dark claim completion at accessibility text size")
        XCTAssertTrue(app.buttons["claim-view"].isHittable)
    }
    func testUnsupportedCodeHasNoClaimActionAndCanReturnToScannerInArabicDark() {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--locale", "ar", "--preview-dark"]; app.launch()
        app.buttons["nav-inbox"].tap(); app.buttons["inbox-scan"].tap(); app.swipeUp()
        let input = app.textFields["claim-link"]; XCTAssertTrue(input.waitForExistence(timeout: 5)); input.tap(); input.typeText("https://learncard.app/claim/boost?boostUri=production&challenge=synthetic")
        app.swipeUp(); app.buttons["review-link"].tap()
        XCTAssertTrue(app.staticTexts["claim-error"].waitForExistence(timeout: 5)); XCTAssertFalse(app.buttons["claim"].exists)
        capture(app, "Wrong environment claim explanation in Arabic dark mode")
        app.buttons["claim-another"].tap(); XCTAssertTrue(app.buttons["claim-photo"].waitForExistence(timeout: 5))
    }
    func testPendingCodeSurvivesRecoveryAndBackgroundThenReturnsToReview() {
        let app = XCUIApplication(); app.launchArguments = ["--account-fixture", "recovery", UUID().uuidString, "--fixture-reset", "--locale", "en"]; app.launch()
        XCTAssertTrue(app.buttons["signed-out-scan"].waitForExistence(timeout: 10)); app.buttons["signed-out-scan"].tap(); app.swipeUp()
        let input = app.textFields["claim-link"]; input.tap(); input.typeText(publicLink); app.swipeUp(); app.buttons["review-link"].tap()
        XCTAssertTrue(app.buttons["claim-sign-in"].waitForExistence(timeout: 5)); app.buttons["claim-sign-in"].tap()
        XCUIDevice.shared.press(.home); XCTAssertTrue(app.wait(for: .runningBackground, timeout: 5)); app.activate()
        // A retained code asks for sign-in without exposing the old account's credential.
        if app.buttons["claim-sign-in"].waitForExistence(timeout: 2) { app.buttons["claim-sign-in"].tap() }
        let recovery = app.secureTextFields["email-recovery-key"]; XCTAssertTrue(recovery.waitForExistence(timeout: 10)); recovery.tap(); recovery.typeText("synthetic-recovery-key")
        app.buttons["recover-account"].tap()
        XCTAssertTrue(app.buttons["claim"].waitForExistence(timeout: 15)); XCTAssertFalse(app.buttons["claim-view"].exists)
        XCTAssertTrue(app.staticTexts["Ready to help"].exists)
        capture(app, "Pending code resumed after native email recovery")
    }
}
