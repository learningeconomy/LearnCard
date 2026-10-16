import XCTest

@MainActor final class SharePickerUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private func open(locale: String = "en", extra: [String] = []) -> XCUIApplication {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--locale", locale] + extra; app.launch(); app.openCollection()
        app.openCredentialTools()
        app.buttons["collection-action-share"].tap()
        XCTAssertTrue(app.textFields["share-search"].waitForExistence(timeout: 5)); return app
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot)
    }
    private func reveal(_ element: XCUIElement, app: XCUIApplication) {
        for _ in 0..<7 where !element.isHittable { app.swipeUp() }
        XCTAssertTrue(element.isHittable, app.debugDescription)
    }
    func testFiltersRetainHiddenSelectionsAndSelectedScopeReviewsExactlyThoseItems() {
        let app = open(extra: ["--category-fixtures"])
        app.buttons["share-select-design"].tap(); app.buttons["share-select-community"].tap()
        app.buttons["share-filters"].tap()
        let category = app.buttons["share-filter-portfolio"]; reveal(category, app: app); category.tap()
        app.buttons["share-filter-qualification"].tap()
        app.buttons["share-filter-apply"].tap()
        XCTAssertTrue(app.buttons["share-select-design"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["share-select-community"].exists)
        capture(app, "Share picker category filters retain hidden selections")
        app.segmentedControls["share-scope"].buttons.element(boundBy: 1).tap()
        XCTAssertTrue(app.buttons["share-select-community"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["share-select-category-qualification"].exists)
        app.buttons["share-review"].tap()
        let form = app.descendants(matching: .any)["share-review-form"]
        XCTAssertTrue(form.waitForExistence(timeout: 5))
        XCTAssertTrue(form.staticTexts["Design for people"].exists)
        XCTAssertTrue(form.staticTexts["Community builder"].exists)
        XCTAssertFalse(form.staticTexts["Professional license"].exists)
        app.buttons["Back"].tap()
        XCTAssertTrue(app.buttons["share-select-community"].waitForExistence(timeout: 5))
        app.buttons["share-select-community"].tap()
        XCTAssertEqual(app.staticTexts["share-selection-count"].label, "1 selected")
    }
    func testSearchReachesTheLastPageAndDateFilterCanBeClearedWithoutLosingSelection() {
        let app = open(extra: ["--share-picker-fixtures"])
        let search = app.textFields["share-search"]; search.tap(); search.typeText("Archive 239\n")
        let match = app.buttons["share-select-share-fixture-239"]
        XCTAssertTrue(match.waitForExistence(timeout: 15), app.debugDescription); match.tap()
        XCTAssertFalse(app.staticTexts["More to load"].exists)
        app.buttons["share-filters"].tap(); app.buttons["share-date-year"].tap(); app.buttons["share-filter-apply"].tap()
        XCTAssertTrue(app.staticTexts["No matches this time"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.staticTexts["share-selection-count"].label, "1 selected")
        app.buttons["share-filter-reset"].tap()
        XCTAssertTrue(match.waitForExistence(timeout: 5)); XCTAssertTrue(match.isSelected)
        app.buttons["share-sort"].tap(); app.sheets.firstMatch.buttons["Oldest first"].tap()
        XCTAssertTrue(match.waitForExistence(timeout: 5))
        capture(app, "Search found and selected a credential beyond the first two hundred")
        app.buttons["share-review"].tap(); app.buttons["share-confirm"].tap()
        XCTAssertTrue(app.buttons["share-bundle"].waitForExistence(timeout: 5))
    }
    func testDarkArabicAccessibilityTypeHasUsableFiltersAndReview() {
        let app = open(locale: "ar", extra: ["--preview-dark", "--large-type"])
        let filters = app.buttons["share-filters"]; reveal(filters, app: app); filters.tap()
        XCTAssertTrue(app.buttons["share-date-custom"].waitForExistence(timeout: 5)); app.buttons["share-date-custom"].tap()
        let date = app.datePickers["share-date-from"]; reveal(date, app: app)
        XCTAssertTrue(date.exists)
        app.buttons["share-filter-apply"].tap()
        let design = app.buttons["share-select-design"]; reveal(design, app: app); design.tap()
        XCTAssertGreaterThan(design.frame.height, 150, "The presented sheet must actually use accessibility type")
        XCTAssertGreaterThan(app.navigationBars.buttons.firstMatch.frame.midX, app.frame.midX, "Arabic navigation should mirror")
        let review = app.buttons["share-review"]; XCTAssertTrue(review.isHittable); XCTAssertTrue(review.isEnabled)
        capture(app, "Arabic dark large-type sharing picker and reachable review")
        review.tap(); XCTAssertTrue(app.buttons["share-confirm"].waitForExistence(timeout: 5))
    }
}
