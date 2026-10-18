import XCTest

@MainActor final class LearnerSkillsUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private func reveal(_ element: XCUIElement, app: XCUIApplication) {
        for _ in 0..<12 { if element.exists && element.isHittable { return }; app.swipeUp() }
        XCTAssertTrue(element.isHittable)
    }
    private func start(locale: String = "en", extra: [String] = []) -> XCUIApplication {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--locale", locale] + extra; app.launch()
        XCTAssertTrue(app.buttons["nav-apps"].waitForExistence(timeout: 15)); app.buttons["nav-apps"].tap()
        let entry = app.buttons["apps-skills"]; reveal(entry, app: app); entry.tap()
        XCTAssertTrue(app.staticTexts["page-title-skills"].waitForExistence(timeout: 10)); return app
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot)
    }
    func testSkillSourcesOpenTheActualCredential() {
        let app = start()
        XCTAssertTrue(app.buttons["skill-Communication"].waitForExistence(timeout: 10))
        capture(app, "Skills overview native English")
        reveal(app.buttons["skill-Communication"], app: app)
        app.buttons["skill-Communication"].tap()
        XCTAssertTrue(app.buttons["skill-source-design"].waitForExistence(timeout: 10))
        capture(app, "Skill sources native English")
        app.buttons["skill-source-design"].tap()
        XCTAssertTrue(app.staticTexts["Design for people"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["share"].waitForExistence(timeout: 5))
    }
    func testGoalSaveReopenAndDiscardPreserveTheSavedValue() {
        let app = start(); let edit = app.buttons["goals-edit"]; reveal(edit, app: app); edit.tap()
        let input = app.descendants(matching: .any).matching(identifier: "goal-input").firstMatch
        XCTAssertTrue(input.waitForExistence(timeout: 10)); XCTAssertFalse(app.buttons["goals-save"].isEnabled)
        input.tap(); input.typeText("Present with confidence")
        reveal(app.buttons["goal-add"], app: app); app.buttons["goal-add"].tap()
        XCTAssertTrue(app.buttons["goals-save"].isEnabled)
        capture(app, "Personal goals native draft English")
        app.buttons["goals-save"].tap()
        XCTAssertTrue(edit.waitForExistence(timeout: 10)); edit.tap()
        XCTAssertTrue(app.staticTexts["Present with confidence"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["goals-save"].isEnabled)
        app.buttons["goal-remove-0"].tap(); app.buttons["goals-cancel"].tap()
        app.buttons["Discard changes"].tap()
        XCTAssertTrue(edit.waitForExistence(timeout: 10)); XCTAssertTrue(app.staticTexts["Present with confidence"].exists)
    }
    func testEmptySkillsAndArabicAccessibilityGoalsStayUsable() {
        let app = start(locale: "ar", extra: ["--empty-collection", "--preview-dark", "--large-type"])
        let edit = app.buttons["goals-edit"]; reveal(edit, app: app)
        XCTAssertTrue(app.staticTexts["أهدافك"].exists)
        capture(app, "Skills empty Arabic dark accessibility")
        edit.tap(); XCTAssertTrue(app.buttons["goals-save"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["goals-save"].isEnabled)
        let input = app.descendants(matching: .any).matching(identifier: "goal-input").firstMatch
        reveal(input, app: app)
        XCTAssertLessThan(app.buttons["goal-add"].frame.minX, input.frame.minX, "Arabic sheet must inherit right-to-left layout")
        let tray = app.buttons["goals-save"].frame; XCTAssertGreaterThan(tray.height, 44); XCTAssertLessThan(tray.maxY, app.frame.maxY)
        capture(app, "Personal goals Arabic dark accessibility")
        app.buttons["goals-cancel"].tap(); XCTAssertTrue(edit.waitForExistence(timeout: 10))
    }
}
