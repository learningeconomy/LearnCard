import XCTest

@MainActor final class CredentialActivityUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private func launch(_ flags: [String]) -> XCUIApplication {
        let app = XCUIApplication(); app.launchArguments = ["--demo"] + flags; app.launch()
        XCTAssertTrue(app.buttons["nav-collection"].waitForExistence(timeout: 15))
        app.buttons["nav-collection"].tap()
        XCTAssertTrue(app.buttons["passport-refresh"].waitForExistence(timeout: 5))
        return app
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot)
    }
    func testSlowCredentialCheckIsVisibleOnPassportAndInboxAcrossNavigation() {
        for locale in ["en", "ar"] {
            let app = launch(["--locale", locale, locale == "ar" ? "--large-type" : "--standard-type", "--credential-refresh-slow"] + (locale == "ar" ? ["--preview-dark"] : []))
            app.buttons["passport-refresh"].tap()
            let passport = app.staticTexts["passport-activity-title"]
            let checking = locale == "en" ? "Checking for credentials…" : "جارٍ التحقق من الشهادات…"
            XCTAssertTrue(passport.waitForExistence(timeout: 3))
            XCTAssertEqual(passport.label, checking)
            XCTAssertFalse(app.buttons["passport-refresh"].exists)
            capture(app, "Passport checking credentials \(locale)")
            app.buttons["nav-inbox"].tap()
            XCTAssertEqual(app.staticTexts["inbox-activity-title"].label, checking)
            XCTAssertFalse(app.buttons["inbox-refresh"].exists)
            capture(app, "Inbox shares incoming credential check \(locale)")
            XCTAssertTrue(app.buttons["inbox-refresh"].waitForExistence(timeout: 15))
            app.buttons["inbox-refresh"].tap()
            XCTAssertTrue(app.staticTexts["inbox-activity-detail"].waitForExistence(timeout: 3))
            app.buttons["nav-collection"].tap()
            XCTAssertTrue(app.staticTexts["passport-activity-detail"].waitForExistence(timeout: 3))
            XCTAssertTrue(app.buttons["passport-refresh"].waitForExistence(timeout: 15))
            XCTAssertFalse(app.alerts.firstMatch.exists)
            app.terminate()
        }
    }
    func testFailedCheckRetainsPassportAndOffersInlineRetryOnBothPages() {
        let app = launch(["--locale", "en", "--standard-type", "--credential-refresh-failure"])
        app.buttons["passport-refresh"].tap()
        let failed = app.staticTexts["passport-activity-title"]
        XCTAssertTrue(failed.waitForExistence(timeout: 3))
        let retry = app.buttons["passport-refresh"]
        XCTAssertTrue(retry.waitForExistence(timeout: 15)); XCTAssertTrue(retry.label.contains("Try Again"))
        XCTAssertEqual(failed.label, "Couldn’t finish checking")
        XCTAssertTrue(app.staticTexts["page-title-collection"].isHittable)
        XCTAssertTrue(app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'credential-'" )).firstMatch.exists)
        XCTAssertFalse(app.alerts.firstMatch.exists); capture(app, "Passport keeps credentials after a failed check")
        app.buttons["nav-inbox"].tap()
        XCTAssertTrue(app.buttons["nav-inbox"].isSelected)
        XCTAssertTrue(app.staticTexts["inbox-activity-title"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.staticTexts["inbox-activity-title"].label, "Couldn’t finish checking")
        app.buttons["inbox-refresh"].tap()
        XCTAssertTrue(app.buttons["inbox-refresh"].waitForExistence(timeout: 15))
        XCTAssertEqual(app.staticTexts["inbox-activity-title"].label, "A little good news.")
        XCTAssertFalse(app.alerts.firstMatch.exists); capture(app, "Inbox retry completes without an alert")
    }
}
