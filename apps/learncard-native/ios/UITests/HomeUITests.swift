import XCTest

@MainActor final class HomeUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func launch(_ arguments: [String] = ["--locale", "en"]) -> XCUIApplication {
        let app = XCUIApplication(); app.launchArguments = ["--demo"] + arguments; app.launch()
        XCTAssertTrue(app.buttons["nav-home"].waitForExistence(timeout: 10)); app.buttons["nav-home"].tap()
        XCTAssertTrue(app.staticTexts["page-title-home"].waitForExistence(timeout: 5))
        return app
    }
    private func reveal(_ element: XCUIElement, in app: XCUIApplication) {
        for _ in 0..<5 where !element.isHittable { app.swipeUp() }
        XCTAssertTrue(element.isHittable, app.debugDescription)
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot)
    }
    func testHomeSummaryAndPrimaryActionsReachExistingFlows() {
        let app = launch()
        XCTAssertEqual(app.staticTexts["home-summary-offers"].label, "2 credentials to review")
        capture(app, "Drawn Home with illustrated Inbox and larger house navigation")
        app.buttons["home-inbox"].tap()
        XCTAssertTrue(app.buttons["offer-first-aid"].waitForExistence(timeout: 5))
        app.buttons["nav-home"].tap(); app.buttons["home-collection"].tap()
        XCTAssertTrue(app.staticTexts["page-title-collection"].waitForExistence(timeout: 5))
        app.buttons["nav-home"].tap(); app.buttons["home-create"].tap()
        XCTAssertTrue(app.textFields["draft-title"].waitForExistence(timeout: 5))
    }
    func testHomeAppsAndDataSharingUseNativeDestinations() {
        let app = launch(), installed = app.buttons["home-app-sample-earth"]
        reveal(installed, in: app); installed.tap()
        XCTAssertTrue(app.staticTexts["Earth Explorers"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.webViews.firstMatch.exists)
        app.navigationBars.buttons.element(boundBy: 0).tap()
        let all = app.buttons["home-apps"]; reveal(all, in: app); all.tap()
        XCTAssertTrue(app.staticTexts["page-title-apps"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["app-sample-earth"].exists)
        let query = app.textFields["apps-search"]
        query.tap(); query.typeText("No matching app")
        XCTAssertFalse(app.buttons["app-sample-earth"].exists)
        app.buttons["nav-home"].tap(); reveal(app.buttons["home-apps"], in: app); app.buttons["home-apps"].tap()
        XCTAssertTrue(app.buttons["app-sample-earth"].waitForExistence(timeout: 5), "See all must clear an earlier Apps filter")
        app.buttons["app-sample-earth"].tap()
        XCTAssertTrue(app.buttons["app-detail-action"].waitForExistence(timeout: 5))
        app.buttons["nav-home"].tap(); reveal(app.buttons["home-apps"], in: app); app.buttons["home-apps"].tap()
        XCTAssertTrue(app.textFields["apps-search"].waitForExistence(timeout: 5), "See all must return from a previous Apps detail to My apps")
        app.buttons["nav-home"].tap()
        let sharing = app.buttons["home-data-sharing"]; reveal(sharing, in: app); sharing.tap()
        XCTAssertTrue(app.staticTexts["page-title-sharing"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.webViews.firstMatch.exists)
    }
    func testHomeDarkFrenchAndArabicLargeTypeRemainUsable() {
        var app = launch(["--locale", "fr", "--preview-dark"])
        XCTAssertEqual(app.staticTexts["page-title-home"].label, "Accueil")
        XCTAssertFalse(app.staticTexts["home-summary-offers"].label.contains("%"))
        capture(app, "Home French dark appearance")
        app.terminate()
        app = launch(["--locale", "ar", "--large-type"])
        XCTAssertTrue(app.buttons["home-inbox"].isHittable)
        for tab in ["collection", "inbox", "apps", "home"] {
            XCTAssertGreaterThanOrEqual(app.buttons["nav-\(tab)"].frame.height, 44)
            XCTAssertGreaterThanOrEqual(app.buttons["nav-\(tab)"].frame.width, 44)
        }
        capture(app, "Home Arabic accessibility type with stacked Inbox illustration")
        let collection = app.buttons["home-collection"]; reveal(collection, in: app); collection.tap()
        XCTAssertTrue(app.staticTexts["page-title-collection"].waitForExistence(timeout: 5))
    }
}
