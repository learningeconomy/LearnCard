import XCTest

@MainActor final class AccountAccessUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testSignInCodeLimitResendAndRecoveryDestination() {
        let app = launch("sign-in")
        XCTAssertTrue(app.buttons["send-sign-in-code"].waitForExistence(timeout: 10))
        capture(app, "Account access welcome")
        app.buttons["send-sign-in-code"].tap()
        let code = app.textFields["sign-in-code"]
        XCTAssertTrue(code.waitForExistence(timeout: 10)); code.tap(); code.typeText("123")
        XCTAssertFalse(app.buttons["verify-sign-in-code"].isEnabled)
        code.typeText("45678")
        XCTAssertEqual(code.value as? String, "123456")
        capture(app, "Account sign-in code entry")
        app.buttons["resend-sign-in-code"].tap()
        XCTAssertTrue(code.waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["verify-sign-in-code"].isEnabled)
        code.tap(); code.typeText("123456"); app.buttons["verify-sign-in-code"].tap()
        XCTAssertTrue(app.secureTextFields["email-recovery-key"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["From your LearnCard recovery email. Different from your sign-in code."].exists)
        XCTAssertFalse(app.buttons["recover-account"].isEnabled)
        capture(app, "Account email recovery")
    }

    func testRecoveryMethodCancelPreservesInputAndSwitchingClearsIt() {
        let app = launch("recovery")
        let email = app.secureTextFields["email-recovery-key"]
        XCTAssertTrue(email.waitForExistence(timeout: 10)); email.tap(); email.typeText("synthetic-partial-key")
        XCTAssertTrue(app.buttons["recover-account"].isEnabled)
        app.buttons["choose-recovery-method"].tap()
        XCTAssertTrue(app.scrollViews["recovery-method-sheet"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["recovery-method-email"].isSelected)
        capture(app, "Designed recovery method sheet")
        app.buttons["recovery-method-cancel"].tap()
        XCTAssertTrue(email.waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["recover-account"].isEnabled)
        app.buttons["choose-recovery-method"].tap(); app.buttons["recovery-method-phrase"].tap()
        let phrase = app.secureTextFields["recovery-phrase"]
        XCTAssertTrue(phrase.waitForExistence(timeout: 5)); XCTAssertFalse(app.buttons["recover-account"].isEnabled)
        phrase.tap(); phrase.typeText("synthetic saved words")
        app.buttons["choose-recovery-method"].tap(); app.buttons["recovery-method-backup"].tap()
        XCTAssertTrue(app.buttons["choose-recovery-backup"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.secureTextFields["backup-password"].exists)
        XCTAssertFalse(app.buttons["recover-account"].isEnabled)
        capture(app, "Account backup recovery")
        app.buttons["choose-recovery-method"].tap(); app.buttons["recovery-method-email"].tap()
        XCTAssertTrue(email.waitForExistence(timeout: 5)); XCTAssertFalse(app.buttons["recover-account"].isEnabled)
    }

    func testBackgroundClearsUnsubmittedSignInCode() {
        let app = launch("sign-in")
        XCTAssertTrue(app.buttons["send-sign-in-code"].waitForExistence(timeout: 10)); app.buttons["send-sign-in-code"].tap()
        let code = app.textFields["sign-in-code"]
        XCTAssertTrue(code.waitForExistence(timeout: 10)); code.tap(); code.typeText("123456")
        XCUIDevice.shared.press(.home); XCTAssertTrue(app.wait(for: .runningBackground, timeout: 5))
        app.activate()
        XCTAssertTrue(app.buttons["send-sign-in-code"].waitForExistence(timeout: 10))
        app.buttons["send-sign-in-code"].tap()
        XCTAssertTrue(code.waitForExistence(timeout: 10)); XCTAssertFalse(app.buttons["verify-sign-in-code"].isEnabled)
    }

    func testBackgroundClearsUnsubmittedBackupPassword() {
        let app = launch("recovery")
        XCTAssertTrue(app.buttons["choose-recovery-method"].waitForExistence(timeout: 10))
        app.buttons["choose-recovery-method"].tap(); app.buttons["recovery-method-backup"].tap()
        let password = app.secureTextFields["backup-password"]
        XCTAssertTrue(password.waitForExistence(timeout: 5)); password.tap(); password.typeText("synthetic-private-password")
        XCTAssertNotEqual(password.value as? String, "Backup password")
        XCUIDevice.shared.press(.home); XCTAssertTrue(app.wait(for: .runningBackground, timeout: 5)); app.activate()
        XCTAssertTrue(password.waitForExistence(timeout: 10))
        XCTAssertEqual(password.value as? String, "Backup password")
        XCTAssertFalse(app.buttons["recover-account"].isEnabled)
    }

    func testArabicLargeTextDarkRecoveryAndMethodSheet() {
        let app = launch("recovery", language: "ar", extra: ["--large-type", "--preview-dark"])
        XCTAssertTrue(app.secureTextFields["email-recovery-key"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["choose-recovery-method"].label.contains("بريد الاستعادة"))
        capture(app, "Arabic accessibility dark recovery")
        app.buttons["choose-recovery-method"].tap()
        XCTAssertTrue(app.scrollViews["recovery-method-sheet"].waitForExistence(timeout: 5))
        let method = app.buttons["recovery-method-phrase"]
        XCTAssertGreaterThan(method.frame.height, 110, "The actual presented sheet must inherit accessibility text size.")
        capture(app, "Arabic accessibility dark method sheet")
        app.buttons["recovery-method-backup"].tap()
        XCTAssertTrue(app.buttons["choose-recovery-backup"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["recover-account"].isEnabled)
    }

    private func launch(_ scenario: String, language: String = "en", extra: [String] = []) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["--account-fixture", scenario, UUID().uuidString, "--fixture-reset", "--locale", language] + extra
        app.launch(); return app
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot)
    }
}
