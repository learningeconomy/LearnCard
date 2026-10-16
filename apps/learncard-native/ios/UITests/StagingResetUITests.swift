import XCTest

/// Synthetic accounts only. These never authorize or invoke the live reset.
@MainActor final class StagingResetUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    func testResetRequiresMatchingEmailAndReopensFirstTimeSetupWithSharedLogin() {
        let app = launch("reset-ready"); openReset(app)
        let button = app.buttons["reset-confirm"]; reveal(button, app); XCTAssertFalse(button.isEnabled)
        let input = app.textFields["reset-email"]; input.tap(); input.typeText("other@example.invalid")
        XCTAssertFalse(button.isEnabled)
        input.tap(); input.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: 21) + "native-test@example.invalid")
        app.swipeUp(); XCTAssertTrue(button.isEnabled); button.tap()
        XCTAssertTrue(app.buttons["signup-birth-date"].waitForExistence(timeout: 15))
        XCTAssertFalse(app.buttons["send-sign-in-code"].exists); XCTAssertFalse(app.staticTexts["page-title-collection"].exists)
        relaunch(app); XCTAssertTrue(app.buttons["signup-birth-date"].waitForExistence(timeout: 15))
    }
    func testInterruptedResetSurvivesBackgroundAndRelaunchWithoutShowingCollection() {
        let app = launch("reset-interrupted"); openReset(app); confirm(app)
        XCTAssertTrue(app.buttons["reset-resume"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.descendants(matching: .any)["reset-error"].firstMatch.exists)
        XCTAssertFalse(app.staticTexts["page-title-collection"].exists)
        XCUIDevice.shared.press(.home); XCTAssertTrue(app.wait(for: .runningBackground, timeout: 5)); app.activate()
        XCTAssertTrue(app.buttons["reset-resume"].waitForExistence(timeout: 10)); XCTAssertFalse(app.staticTexts["page-title-collection"].exists)
        relaunch(app); XCTAssertTrue(app.buttons["reset-resume"].waitForExistence(timeout: 10)); app.buttons["reset-resume"].tap()
        XCTAssertTrue(app.buttons["signup-birth-date"].waitForExistence(timeout: 10))
    }
    func testResetConfirmationArabicLargeTextAndDarkMode() {
        let app = launch("reset-ready", language: "ar", extra: ["--large-type", "--preview-dark"])
        openReset(app); let input = app.textFields["reset-email"]; reveal(input, app)
        XCTAssertFalse(app.buttons["reset-confirm"].isEnabled)
        let attachment = XCTAttachment(screenshot: app.screenshot()); attachment.name = "Staging reset - Arabic large dark"; attachment.lifetime = .keepAlways; add(attachment)
    }
    func testResumeButtonRemainsReadableAndUsableInLightAndDarkAppearance() {
        for extra in [[], ["--preview-dark"]] {
            let app = launch("reset-pending", extra: extra), button = app.buttons["reset-resume"]
            XCTAssertTrue(button.waitForExistence(timeout: 10)); XCTAssertTrue(button.isHittable)
            XCTAssertGreaterThanOrEqual(button.frame.height, 54)
            let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Reset continuation \(extra.isEmpty ? "light" : "dark")"; shot.lifetime = .keepAlways; add(shot)
            button.tap(); XCTAssertTrue(app.buttons["signup-birth-date"].waitForExistence(timeout: 10)); app.terminate()
        }
    }
    private func launch(_ scenario: String, language: String = "en", extra: [String] = []) -> XCUIApplication {
        let app = XCUIApplication(); app.launchArguments = ["--account-fixture", scenario, UUID().uuidString, "--fixture-reset", "--locale", language] + extra; app.launch(); return app
    }
    private func relaunch(_ app: XCUIApplication) { app.terminate(); app.launchArguments.removeAll { $0 == "--fixture-reset" }; app.launch() }
    private func openReset(_ app: XCUIApplication) {
        XCTAssertTrue(app.buttons["account"].waitForExistence(timeout: 15)); app.buttons["account"].tap()
        let link = app.buttons["account-staging-reset"]; XCTAssertTrue(link.waitForExistence(timeout: 5)); reveal(link, app); link.tap()
        XCTAssertTrue(app.textFields["reset-email"].waitForExistence(timeout: 5))
    }
    private func confirm(_ app: XCUIApplication) {
        let input = app.textFields["reset-email"]; reveal(input, app); input.tap(); input.typeText("native-test@example.invalid")
        let button = app.buttons["reset-confirm"]; reveal(button, app); button.tap()
    }
    private func reveal(_ element: XCUIElement, _ app: XCUIApplication) { for _ in 0..<4 { if element.isHittable { break }; app.swipeUp() } }
}
