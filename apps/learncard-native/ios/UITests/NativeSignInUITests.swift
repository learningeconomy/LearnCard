import XCTest

/// Real account screens/controller; synthetic provider proofs and isolated Keychain only.
@MainActor final class NativeSignInUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testGoogleReturnsToHomeAndSurvivesBackgroundAndRelaunch() {
        let app = launch("oauth-ready")
        assertProviders(app); capture(app, "Native Apple Google and email sign-in")
        app.buttons["sign-in-google"].tap()
        XCTAssertTrue(app.staticTexts["page-title-home"].waitForExistence(timeout: 15))
        XCUIDevice.shared.press(.home); XCTAssertTrue(app.wait(for: .runningBackground, timeout: 5)); app.activate()
        XCTAssertTrue(app.staticTexts["page-title-home"].waitForExistence(timeout: 15))
        app.terminate(); app.launchArguments.removeAll { $0 == "--fixture-reset" }; app.launch()
        XCTAssertTrue(app.staticTexts["page-title-home"].waitForExistence(timeout: 15))
    }
    func testAppleUsesExistingRecoveryAndNewAccountUsesBirthdayGate() {
        var app = launch("oauth-recovery"); assertProviders(app); app.buttons["sign-in-apple"].tap()
        XCTAssertTrue(app.secureTextFields["email-recovery-key"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.staticTexts["page-title-home"].exists)
        app.terminate(); app = launch("oauth-signup"); assertProviders(app); app.buttons["sign-in-google"].tap()
        XCTAssertTrue(app.buttons["signup-birth-date"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["signup-continue"].isEnabled)
        XCTAssertFalse(app.staticTexts["page-title-home"].exists)
    }
    func testCancelledProviderPreservesTypedEmailWithoutError() {
        let app = launch("oauth-cancel"); assertProviders(app)
        let email = app.textFields["account-email"]; email.tap()
        email.typeText("typed@example.com\n")
        app.buttons["sign-in-google"].tap()
        XCTAssertTrue(app.buttons["send-sign-in-code"].waitForExistence(timeout: 10))
        XCTAssertEqual(email.value as? String, "typed@example.com")
        XCTAssertFalse(app.descendants(matching: .any)["account-error"].exists)
    }
    func testConflictingProviderShowsFriendlyEmailFallback() {
        let app = launch("oauth-failure"); assertProviders(app); app.buttons["sign-in-apple"].tap()
        let error = app.descendants(matching: .any)["account-error"].firstMatch
        XCTAssertTrue(error.waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["send-sign-in-code"].isEnabled)
        capture(app, "Native provider conflict and email fallback")
        app.buttons["send-sign-in-code"].tap()
        XCTAssertTrue(app.textFields["sign-in-code"].waitForExistence(timeout: 10))
    }
    func testTrueBackgroundCancelsProviderWhileInactivePresentationIsAllowed() {
        let app = launch("oauth-delayed"); assertProviders(app); app.buttons["sign-in-google"].tap()
        XCTAssertTrue(app.staticTexts["Finishing sign-in…"].waitForExistence(timeout: 10))
        XCUIDevice.shared.press(.home); XCTAssertTrue(app.wait(for: .runningBackground, timeout: 5)); app.activate()
        XCTAssertTrue(app.buttons["sign-in-google"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.descendants(matching: .any)["account-error"].exists)
        XCTAssertFalse(app.staticTexts["page-title-home"].exists)
    }
    func testArabicAccessibilityDarkButtonsFitAndRemainActionable() {
        let app = launch("oauth-cancel", language: "ar", extra: ["--large-type", "--preview-dark"])
        assertProviders(app)
        let google = app.buttons["sign-in-google"]
        for _ in 0..<4 where !google.isHittable { app.swipeUp() }
        XCTAssertEqual(google.label, "المتابعة باستخدام Google")
        XCTAssertLessThanOrEqual(google.frame.maxX, app.frame.maxX)
        XCTAssertGreaterThanOrEqual(google.frame.height, 54)
        capture(app, "Native sign-in Arabic accessibility dark")
        google.tap(); XCTAssertTrue(app.buttons["send-sign-in-code"].waitForExistence(timeout: 10))
    }
    func testArabicDefaultTypographyMatchesEnglishTextSettingInLightAndDark() {
        let english = launch("oauth-cancel", extra: ["--standard-type"])
        assertProviders(english)
        let buttonHeight = english.buttons["sign-in-google"].frame.height
        let titleHeight = english.staticTexts["page-title-account-access"].frame.height
        capture(english, "Native sign-in English standard text")
        english.terminate()
        for dark in [false, true] {
            let app = launch("oauth-cancel", language: "ar", extra: ["--standard-type"] + (dark ? ["--preview-dark"] : []))
            assertProviders(app)
            let google = app.buttons["sign-in-google"]
            XCTAssertEqual(google.label, "المتابعة باستخدام Google")
            XCTAssertEqual(google.frame.height, buttonHeight, accuracy: 1, "Default Arabic must use the same text-size setting as English.")
            XCTAssertLessThanOrEqual(app.staticTexts["page-title-account-access"].frame.height, titleHeight * 1.5)
            XCTAssertTrue(google.isHittable)
            XCTAssertGreaterThanOrEqual(google.frame.minX, 0)
            XCTAssertLessThanOrEqual(google.frame.maxX, app.frame.maxX)
            capture(app, "Native sign-in Arabic standard text \(dark ? "dark" : "light")")
            google.tap()
            XCTAssertTrue(app.buttons["send-sign-in-code"].waitForExistence(timeout: 10))
            XCTAssertFalse(app.descendants(matching: .any)["account-error"].exists)
            app.terminate()
        }
    }
    func testUnregisteredProvidersAreAbsentFromEmailOnlySignIn() {
        let app = launch("sign-in")
        XCTAssertTrue(app.buttons["send-sign-in-code"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["sign-in-apple"].exists); XCTAssertFalse(app.buttons["sign-in-google"].exists)
    }
    func testPendingClaimReturnsToReviewAfterProviderSignInAndRecovery() {
        let app = launch("oauth-recovery"); assertProviders(app)
        let scan = app.buttons["signed-out-scan"]
        for _ in 0..<4 where !scan.isHittable { app.swipeUp() }
        scan.tap(); app.swipeUp()
        let input = app.textFields["claim-link"]; XCTAssertTrue(input.waitForExistence(timeout: 5)); input.tap()
        input.typeText("https://staging.learncard.app/claim/boost?boostUri=lc%3Anetwork%3Astaging.network.learncard.com%2Ftrpc%3Aboost%3Asample&challenge=synthetic-token")
        app.swipeUp(); app.buttons["review-link"].tap()
        XCTAssertTrue(app.buttons["claim-sign-in"].waitForExistence(timeout: 5)); app.buttons["claim-sign-in"].tap()
        let google = app.buttons["sign-in-google"]
        for _ in 0..<4 where !google.isHittable { app.swipeDown() }
        google.tap()
        let key = app.secureTextFields["email-recovery-key"]
        XCTAssertTrue(key.waitForExistence(timeout: 10)); key.tap(); key.typeText("synthetic-recovery-key")
        app.buttons["recover-account"].tap()
        XCTAssertTrue(app.buttons["claim"].waitForExistence(timeout: 15))
        XCTAssertFalse(app.buttons["claim-view"].exists, "Provider sign-in never accepts a credential without review.")
        capture(app, "Pending credential review after Google and account recovery")
    }
    private func launch(_ scenario: String, language: String = "en", extra: [String] = []) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["--account-fixture", scenario, UUID().uuidString, "--fixture-reset", "--locale", language] + extra
        app.launch(); return app
    }
    private func assertProviders(_ app: XCUIApplication) {
        XCTAssertTrue(app.buttons["sign-in-apple"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["sign-in-google"].exists)
        XCTAssertGreaterThanOrEqual(app.buttons["sign-in-apple"].frame.height, 44)
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot)
    }
}
