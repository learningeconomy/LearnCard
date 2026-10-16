import XCTest

@MainActor final class CollectionEmptyUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private func launch(_ flags: [String] = []) -> XCUIApplication {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--locale", "en"] + flags
        app.launch(); app.openCollection(); return app
    }
    private func state(_ app: XCUIApplication, _ kind: String) -> XCUIElement {
        app.descendants(matching: .any)["collection-empty-\(kind)"].firstMatch
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot)
    }
    func testCategoryFocusAndTypedSearchHaveDifferentEmptyStates() {
        let app = launch(); app.buttons["collection-category-badge"].tap()
        XCTAssertTrue(state(app, "category").waitForExistence(timeout: 5)); XCTAssertFalse(state(app, "search").exists)
        XCTAssertFalse(app.buttons["collection-search-reset"].exists)
        let search = app.textFields["collection-search"]; search.tap()
        XCTAssertTrue(state(app, "category").exists); XCTAssertFalse(state(app, "search").exists)
        search.typeText("astronaut\n")
        XCTAssertTrue(state(app, "search").waitForExistence(timeout: 5)); XCTAssertFalse(state(app, "category").exists)
        app.buttons["collection-search-clear"].tap()
        XCTAssertTrue(state(app, "category").waitForExistence(timeout: 5))
        capture(app, "Empty Badges category is not an empty search")
        app.buttons["collection-empty-view-all"].tap()
        XCTAssertTrue(app.buttons["credential-design"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["collection-category-all"].isSelected)
    }
    func testEmptyCollectionOffersWorkingScanAndCreateRoutes() {
        let app = launch(["--empty-collection"])
        XCTAssertTrue(state(app, "all").waitForExistence(timeout: 5)); XCTAssertFalse(state(app, "search").exists)
        app.swipeUp(); capture(app, "New collection with drawn passport and useful actions")
        app.buttons["collection-empty-scan"].tap()
        XCTAssertTrue(app.buttons["use-sample-link"].waitForExistence(timeout: 5))
        app.buttons["Cancel"].tap()
        app.buttons["collection-empty-create"].tap()
        XCTAssertTrue(app.textFields["draft-title"].waitForExistence(timeout: 5))
    }
    func testEmptyLoadedPageDoesNotClaimTheAccountHasNoCredentials() {
        let app = launch(["--empty-page"])
        XCTAssertTrue(state(app, "all").waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Nothing loaded here yet"].exists)
        XCTAssertFalse(app.buttons["collection-empty-scan"].exists)
        app.swipeUp(); app.buttons["Load More"].tap()
        XCTAssertTrue(app.buttons["credential-design"].waitForExistence(timeout: 5)); XCTAssertFalse(state(app, "all").exists)
    }
    func testEmptyCollectionAndCategorySupportArabicLargeTextInDarkMode() {
        let app = launch(["--empty-collection", "--locale", "ar", "--large-type", "--preview-dark"])
        XCTAssertTrue(state(app, "all").waitForExistence(timeout: 5))
        app.swipeUp(); XCTAssertTrue(app.buttons["collection-empty-scan"].isHittable)
        capture(app, "Empty collection Arabic large text dark")
        app.swipeDown(); app.swipeDown(); app.buttons["collection-category-badge"].tap()
        XCTAssertTrue(state(app, "category").waitForExistence(timeout: 5)); XCTAssertFalse(state(app, "search").exists)
        app.swipeUp(); XCTAssertTrue(app.buttons["collection-empty-view-all"].isHittable)
        capture(app, "Empty category Arabic large text dark")
    }
}
