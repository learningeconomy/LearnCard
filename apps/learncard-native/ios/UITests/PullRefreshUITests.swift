import XCTest

@MainActor final class PullRefreshUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private func launch(_ flags: [String] = []) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["--demo", "--standard-type", "--credential-refresh-slow", "--refresh-motion-review"]
            + (flags.contains("--locale") ? [] : ["--locale", "en"]) + flags
        app.launch()
        XCTAssertTrue(app.buttons["nav-home"].waitForExistence(timeout: 15))
        return app
    }
    private func pull(_ app: XCUIApplication, amount: Double = 0.76) {
        let scroll = app.scrollViews.firstMatch
        // Start below the native header, clear of header/deck controls. XCTest
        // waits for native refresh to finish before returning from this gesture.
        let start = scroll.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.21))
        let end = scroll.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.21 + amount))
        start.press(forDuration: 0.05, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.3)
    }
    private func restingPosition(_ title: XCUIElement) -> CGFloat {
        var previous = title.frame.minY
        var stable = 0
        let settled = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            let y = title.frame.minY
            stable = abs(y - previous) < 0.5 ? stable + 1 : 0
            previous = y
            return stable >= 2 && y > 100
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [settled], timeout: 5), .completed)
        return title.frame.minY
    }
    private func checkReturnedPosition(_ title: XCUIElement, restingTop: CGFloat) {
        let settled = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in abs(title.frame.minY - restingTop) < 2 }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [settled], timeout: 5), .completed)
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot)
    }

    func testHomeRefreshAwaitsReadAndFinishesWithoutLeavingSpace() {
        let app = launch()
        let title = app.staticTexts["page-title-home"]
        XCTAssertTrue(title.waitForExistence(timeout: 5))
        let restingTop = restingPosition(title)
        let deck = app.descendants(matching: .any).matching(identifier: "latest-stack").firstMatch
        let position = deck.value as? String
        let began = Date.now
        pull(app)
        // The ten-second fixture must run, rather than being cancelled by an
        // animation state update as the native refresh control is replaced.
        XCTAssertGreaterThanOrEqual(Date.now.timeIntervalSince(began), 8)
        checkReturnedPosition(title, restingTop: restingTop)
        XCTAssertTrue(deck.exists); XCTAssertEqual(deck.value as? String, position)
        XCTAssertFalse(app.alerts.firstMatch.exists)
        capture(app, "Home refresh collapses after the actual read")
    }

    func testShortPullDoesNotRefreshAndFailureKeepsInlineRetry() {
        let app = launch(["--credential-refresh-failure"])
        app.buttons["nav-collection"].tap()
        let idle = app.buttons["passport-refresh"]
        XCTAssertTrue(idle.waitForExistence(timeout: 5))
        let title = app.staticTexts["page-title-collection"]
        let restingTop = restingPosition(title)
        pull(app, amount: 0.04)
        XCTAssertTrue(idle.isHittable)
        XCTAssertFalse(idle.label.contains("Try Again"), "A short pull must not start the failing read")
        pull(app)
        XCTAssertTrue(idle.waitForExistence(timeout: 12))
        XCTAssertTrue(idle.label.contains("Try Again"))
        XCTAssertFalse(app.alerts.firstMatch.exists)
        capture(app, "Passport pull failure retains content and inline retry")
        pull(app)
        XCTAssertTrue(idle.waitForExistence(timeout: 12))
        XCTAssertFalse(idle.label.contains("Try Again"))
        checkReturnedPosition(title, restingTop: restingTop)
        XCTAssertTrue(app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'credential-'" )).firstMatch.exists)
    }

    func testArabicReducedRefreshFinishesAndNavigatesWithoutStuckState() {
        let app = launch(["--locale", "ar", "--large-type", "--preview-dark", "--motion-reduced"])
        app.buttons["nav-inbox"].tap()
        XCTAssertTrue(app.buttons["inbox-refresh"].waitForExistence(timeout: 5))
        let title = app.staticTexts["page-title-inbox"]
        XCTAssertTrue(title.label.contains("الوارد"), "The Arabic fixture must not be overridden by an earlier locale argument")
        let restingTop = restingPosition(title)
        let began = Date.now
        pull(app)
        XCTAssertGreaterThanOrEqual(Date.now.timeIntervalSince(began), 8)
        checkReturnedPosition(title, restingTop: restingTop)
        capture(app, "Arabic dark accessibility refresh finishes without extra space")
        app.buttons["nav-collection"].tap()
        XCTAssertTrue(app.buttons["passport-refresh"].waitForExistence(timeout: 12))
        app.buttons["nav-inbox"].tap()
        XCTAssertTrue(app.buttons["inbox-refresh"].waitForExistence(timeout: 5))
        XCTAssertEqual(title.frame.minY, restingTop, accuracy: 2)
        XCTAssertFalse(app.alerts.firstMatch.exists)
    }

    func testFastAppsRefreshLeavesNoOrnamentOrExtraSpace() {
        let app = launch()
        app.buttons["nav-apps"].tap()
        let title = app.staticTexts["page-title-apps"]
        XCTAssertTrue(title.waitForExistence(timeout: 5))
        let restingTop = restingPosition(title)
        pull(app)
        checkReturnedPosition(title, restingTop: restingTop)
        XCTAssertTrue(app.segmentedControls["apps-segment"].isHittable)
        app.segmentedControls["apps-segment"].buttons["Discover"].tap()
        XCTAssertTrue(app.textFields["apps-search"].isHittable)
        XCTAssertFalse(app.alerts.firstMatch.exists)
    }
}
