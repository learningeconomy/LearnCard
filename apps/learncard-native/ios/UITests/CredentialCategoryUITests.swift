import XCTest

@MainActor final class CredentialCategoryUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private func launch(locale: String = "en", dark: Bool = false) -> XCUIApplication {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--category-fixtures", "--locale", locale]
        if dark { app.launchArguments.append("--preview-dark") }
        app.launch(); XCTAssertTrue(app.buttons["collection-category-all"].waitForExistence(timeout: 10))
        return app
    }
    private func select(_ category: String, in app: XCUIApplication) {
        let chip = app.buttons["collection-category-\(category)"]
        let bar = app.scrollViews["collection-categories"]
        XCTAssertTrue(chip.exists, app.debugDescription)
        // XCTest can throw while asking an entirely offscreen chip for hittability.
        // Reveal its frame before asking for an activation point.
        for _ in 0..<8 {
            if bar.frame.insetBy(dx: 2, dy: -1).contains(chip.frame) { break }
            let forward = chip.frame.midX > bar.frame.midX
            let start = bar.coordinate(withNormalizedOffset: CGVector(dx: forward ? 0.85 : 0.15, dy: 0.5))
            let end = bar.coordinate(withNormalizedOffset: CGVector(dx: forward ? 0.15 : 0.85, dy: 0.5))
            start.press(forDuration: 0.05, thenDragTo: end)
        }
        XCTAssertTrue(chip.isHittable, app.debugDescription); chip.tap()
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot)
    }
    func testPortfolioAndQualificationsHaveSeparateFiltersAndCorrectDetails() {
        let app = launch()
        select("portfolio", in: app)
        XCTAssertTrue(app.buttons["credential-design"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["credential-community"].exists)
        XCTAssertFalse(app.buttons["credential-category-qualification"].exists)
        capture(app, "Portfolio filter retains the original Accomplishment category")
        app.buttons["credential-design"].tap()
        XCTAssertEqual(app.staticTexts["credential-metadata-category"].label, "Portfolio")
        app.navigationBars.buttons.element(boundBy: 0).tap()
        select("qualification", in: app)
        let qualification = app.buttons["credential-category-qualification"]
        XCTAssertTrue(qualification.waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["credential-design"].exists)
        XCTAssertFalse(app.buttons["credential-community"].exists)
        capture(app, "Orange Qualifications filter and illustrated certificate")
        qualification.tap()
        XCTAssertEqual(app.staticTexts["credential-metadata-category"].label, "Qualifications")
    }
    func testCategorySearchDoesNotLeakOtherGroupsAndFamiliesStaySeparate() {
        let app = launch()
        XCTAssertFalse(app.buttons["collection-category-family"].exists)
        select("achievement", in: app)
        XCTAssertTrue(app.buttons["credential-community"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["credential-design"].exists)
        select("portfolio", in: app)
        let search = app.textFields["collection-search"]; search.tap(); search.typeText("Community\n")
        XCTAssertFalse(app.buttons["credential-community"].exists)
        XCTAssertFalse(app.buttons["credential-design"].exists)
        app.buttons["collection-search-clear"].tap()
        XCTAssertTrue(app.buttons["credential-design"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["credential-community"].exists)
        select("assistance", in: app)
        let assistance = app.buttons["credential-category-assistance"]
        XCTAssertTrue(assistance.waitForExistence(timeout: 5))
        assistance.tap(); XCTAssertEqual(app.staticTexts["credential-metadata-category"].label, "Assistance")
    }
    func testQualificationsFilterIsLocalizedInDarkFrenchAndArabic() {
        for (locale, title) in [("fr", "Qualifications"), ("ar", "المؤهلات")] {
            let app = launch(locale: locale, dark: true)
            select("qualification", in: app)
            XCTAssertEqual(app.buttons["collection-category-qualification"].label, title)
            XCTAssertTrue(app.buttons["credential-category-qualification"].waitForExistence(timeout: 5))
            capture(app, "Qualifications \(locale) dark with native reading direction")
            app.terminate()
        }
    }
}
