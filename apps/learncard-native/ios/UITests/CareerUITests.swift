import XCTest

@MainActor final class CareerUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private func reveal(_ element: XCUIElement, app: XCUIApplication) {
        for _ in 0..<14 where !element.isHittable {
            let scroll = app.scrollViews.firstMatch
            let x = app.launchArguments.contains("ar") ? 0.98 : 0.02
            let above = element.exists && element.frame.midY < scroll.frame.midY
            scroll.coordinate(withNormalizedOffset: CGVector(dx: x, dy: above ? 0.25 : 0.75))
                .press(forDuration: 0.05, thenDragTo: scroll.coordinate(withNormalizedOffset: CGVector(dx: x, dy: above ? 0.75 : 0.25)))
        }
        XCTAssertTrue(element.isHittable, app.debugDescription)
    }
    private func start(locale: String = "en", extra: [String] = []) -> XCUIApplication {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--standard-type", "--locale", locale] + extra; app.launch()
        XCTAssertTrue(app.buttons["nav-apps"].waitForExistence(timeout: 15)); app.buttons["nav-apps"].tap()
        let entry = app.buttons["apps-careers"]; reveal(entry, app: app); entry.tap()
        XCTAssertTrue(app.staticTexts["page-title-careers"].waitForExistence(timeout: 10)); return app
    }
    private func search(_ text: String, app: XCUIApplication) {
        let input = app.textFields["career-input"]; XCTAssertTrue(input.waitForExistence(timeout: 10)); reveal(input, app: app); input.tap(); input.typeText(text)
        app.buttons["career-search"].tap()
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot)
    }
    func testCareerSearchResourcesRetryAndExplicitGoalReview() {
        let app = start(extra: ["--career-resource-retry"]); search("photo", app: app)
        let result = app.buttons["career-result-27-4021.00"]; XCTAssertTrue(result.waitForExistence(timeout: 10))
        capture(app, "Career search native English"); reveal(result, app: app); result.tap()
        XCTAssertTrue(app.staticTexts["career-detail-title"].waitForExistence(timeout: 10)); capture(app, "Career detail native English")
        let programs = app.buttons["career-programs"]; reveal(programs, app: app); programs.tap()
        XCTAssertTrue(app.staticTexts["career-program-error"].waitForExistence(timeout: 10)); programs.tap()
        XCTAssertTrue(app.staticTexts["Sample school"].waitForExistence(timeout: 10)); capture(app, "Career learning options native English")
        let goal = app.buttons["career-add-goal"]; reveal(goal, app: app); goal.tap()
        XCTAssertTrue(app.buttons["goals-save"].waitForExistence(timeout: 10)); XCTAssertFalse(app.buttons["goals-save"].isEnabled)
        let input = app.descendants(matching: .any).matching(identifier: "goal-input").firstMatch
        XCTAssertEqual(input.value as? String, "Photographers"); capture(app, "Career goal review native English")
        app.buttons["goal-add"].tap(); XCTAssertTrue(app.buttons["goals-save"].isEnabled); app.buttons["goals-save"].tap()
        XCTAssertTrue(goal.waitForExistence(timeout: 10)); goal.tap()
        XCTAssertTrue(app.staticTexts["Photographers"].waitForExistence(timeout: 10)); XCTAssertFalse(app.buttons["goals-save"].isEnabled)
    }
    func testNoResultsAndFailedSearchDoNotEraseTheLastSuccessfulResult() {
        let app = start(); search("empty", app: app)
        XCTAssertTrue(app.staticTexts["Try another direction"].waitForExistence(timeout: 10)); capture(app, "Career no results native English")
        app.buttons["career-clear"].tap(); search("photo", app: app)
        XCTAssertTrue(app.buttons["career-result-27-4021.00"].waitForExistence(timeout: 10))
        let input = app.textFields["career-input"]; input.tap(); input.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: 5) + "offline")
        XCTAssertEqual(input.value as? String, "offline"); app.buttons["career-search"].tap()
        XCTAssertTrue(app.staticTexts["career-feedback"].waitForExistence(timeout: 10)); XCTAssertFalse(app.staticTexts["Try another direction"].exists); XCTAssertTrue(app.buttons["career-result-27-4021.00"].exists)
        app.buttons["career-clear"].tap(); search("photo", app: app)
        XCTAssertTrue(app.buttons["career-result-27-4021.00"].waitForExistence(timeout: 10))
    }
    func testArabicDarkAccessibilityCareerAndGoalReview() {
        let app = start(locale: "ar", extra: ["--preview-dark", "--large-type"]); search("photo", app: app)
        let result = app.buttons["career-result-27-4021.00"]; XCTAssertTrue(result.waitForExistence(timeout: 10)); reveal(result, app: app)
        capture(app, "Career search Arabic dark accessibility"); result.tap()
        let goal = app.buttons["career-add-goal"]; reveal(goal, app: app); goal.tap()
        XCTAssertTrue(app.buttons["goals-save"].waitForExistence(timeout: 10))
        let input = app.descendants(matching: .any).matching(identifier: "goal-input").firstMatch; reveal(input, app: app)
        XCTAssertLessThan(app.buttons["goal-add"].frame.minX, input.frame.minX)
        capture(app, "Career goal review Arabic dark accessibility")
        app.buttons["goals-cancel"].tap(); app.buttons["تجاهل التغييرات"].tap()
        XCTAssertTrue(goal.waitForExistence(timeout: 10))
    }
    func testDisabledPrivacyChoiceHasNoSearchOrProviderResults() {
        let app = start(extra: ["--career-disabled"])
        XCTAssertTrue(app.staticTexts["career-feedback"].waitForExistence(timeout: 10)); XCTAssertFalse(app.textFields["career-input"].exists); XCTAssertFalse(app.buttons["career-result-27-4021.00"].exists)
        capture(app, "Career disabled by preferences native English")
    }
}
