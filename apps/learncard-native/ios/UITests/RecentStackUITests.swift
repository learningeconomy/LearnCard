import XCTest

@MainActor final class RecentStackUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private func launch(extra: [String] = [], locale: String = "en") -> XCUIApplication {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--stack-fixtures", "--locale", locale] + extra; app.launch()
        XCTAssertTrue(app.buttons["stack-older"].waitForExistence(timeout: 10)); return app
    }
    private func active(_ id: String, in app: XCUIApplication) -> XCUIElement {
        app.descendants(matching: .any)["latest-stack"].buttons["credential-\(id)"]
    }
    private func position(_ value: Int, in app: XCUIApplication) {
        let expected = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label == %@", "\(value) of 5"), object: app.staticTexts["stack-position"])
        XCTAssertEqual(XCTWaiter.wait(for: [expected], timeout: 5), .completed, app.debugDescription)
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot)
    }
    func testSwipesTraverseFiveWithBoundsAndOpenTheActiveCredential() {
        let app = launch(); position(1, in: app)
        XCTAssertFalse(app.buttons["stack-newer"].isEnabled)
        for value in 1..<5 {
            let card = active("stack-\(value)", in: app)
            XCTAssertTrue(card.waitForExistence(timeout: 5)); card.swipeLeft(velocity: .slow); position(value + 1, in: app)
        }
        XCTAssertFalse(app.buttons["stack-older"].isEnabled)
        active("stack-5", in: app).swipeLeft(velocity: .slow); position(5, in: app)
        active("stack-5", in: app).swipeRight(velocity: .slow); position(4, in: app)
        capture(app, "Recent credential stack rewound to four of five")
        active("stack-4", in: app).tap()
        XCTAssertTrue(app.descendants(matching: .any)["credential-detail-card"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Learning moment 4"].exists)
        app.navigationBars.buttons.firstMatch.tap(); position(4, in: app)
        for value in (1...3).reversed() { app.buttons["stack-newer"].tap(); position(value, in: app) }
        XCTAssertFalse(app.buttons["stack-newer"].isEnabled)
    }
    func testShortDragAndVerticalScrollKeepPositionAndSearchResetsTheDeck() {
        let app = launch(); let card = active("stack-1", in: app)
        XCTAssertTrue(card.waitForExistence(timeout: 5))
        let start = card.coordinate(withNormalizedOffset: CGVector(dx: 0.55, dy: 0.5))
        let end = start.withOffset(CGVector(dx: -24, dy: 0))
        start.press(forDuration: 0.1, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.1)
        position(1, in: app)
        let before = card.frame; card.swipeUp(velocity: .slow)
        XCTAssertTrue(card.frame.minY < before.minY - 3 || card.frame.height < before.height - 3 || !card.isHittable, "A vertical card swipe should scroll Collection")
        position(1, in: app)
        app.swipeDown(); app.swipeDown()
        app.buttons["stack-older"].tap(); position(2, in: app)
        let second = active("stack-2", in: app)
        let reverseStart = second.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        reverseStart.press(forDuration: 0.1, thenDragTo: reverseStart.withOffset(CGVector(dx: 24, dy: 0)), withVelocity: .slow, thenHoldForDuration: 0.1)
        position(2, in: app)
        let search = app.textFields["collection-search"]; search.tap(); search.typeText("moment\n")
        XCTAssertTrue(app.staticTexts["Search results"].waitForExistence(timeout: 5)); XCTAssertFalse(app.buttons["stack-older"].exists)
        app.buttons["collection-search-clear"].tap(); position(1, in: app)
        capture(app, "Recent stack keeps vertical page scrolling and resets after search")
    }
    func testCategoryResetAndMirroredReducedMotionBrowsing() {
        let app = launch(extra: ["--card-reduce-motion", "--preview-dark"], locale: "ar")
        let first = active("stack-1", in: app); XCTAssertTrue(first.waitForExistence(timeout: 5))
        first.swipeRight(velocity: .slow)
        XCTAssertTrue(active("stack-2", in: app).waitForExistence(timeout: 5), app.debugDescription)
        let chip = app.buttons["collection-category-qualification"], bar = app.scrollViews["collection-categories"]
        for _ in 0..<6 where !bar.frame.insetBy(dx: 2, dy: -1).contains(chip.frame) {
            let forward = chip.frame.midX > bar.frame.midX
            let start = bar.coordinate(withNormalizedOffset: CGVector(dx: forward ? 0.85 : 0.15, dy: 0.5))
            let end = bar.coordinate(withNormalizedOffset: CGVector(dx: forward ? 0.15 : 0.85, dy: 0.5))
            start.press(forDuration: 0.15, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.1)
        }
        chip.tap()
        XCTAssertTrue(active("category-qualification", in: app).waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["stack-older"].exists)
        capture(app, "Single-card category after Arabic reduced-motion stack browsing")
    }
}
