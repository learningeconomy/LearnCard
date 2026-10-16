import XCTest

/// Synthetic boundaries, production welcome, routing, profile/session and claim screens.
@MainActor final class LearnerArrivalUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot)
    }
    func testWelcomeSkipPersistsAcrossBackgroundAndRelaunch() {
        let app = XCUIApplication()
        app.launchArguments = ["--account-fixture", "learner-welcome", UUID().uuidString, "--fixture-reset", "--locale", "en"]
        app.launch(); XCTAssertTrue(app.staticTexts["learner-welcome"].waitForExistence(timeout: 15))
        XCTAssertFalse(app.buttons["nav-home"].exists)
        capture(app, "Learner optional welcome English")
        app.exploreLearnerWelcome()
        XCUIDevice.shared.press(.home); XCTAssertTrue(app.wait(for: .runningBackground, timeout: 5)); app.activate()
        XCTAssertTrue(app.staticTexts["page-title-home"].waitForExistence(timeout: 15)); XCTAssertFalse(app.staticTexts["learner-welcome"].exists)
        app.terminate(); app.launchArguments.removeAll { $0 == "--fixture-reset" }; app.launch()
        XCTAssertTrue(app.staticTexts["page-title-home"].waitForExistence(timeout: 15)); XCTAssertFalse(app.staticTexts["learner-welcome"].exists)
        let guide = app.buttons["home-welcome"]
        for _ in 0..<8 { if guide.exists && guide.isHittable { break }; app.swipeUp() }
        XCTAssertTrue(guide.isHittable); guide.tap()
        XCTAssertTrue(app.staticTexts["learner-welcome"].waitForExistence(timeout: 5)); app.exploreLearnerWelcome()
    }
    func testWelcomeAddOpensChooserAndLinkModeWaitsForUserInput() {
        let app = XCUIApplication()
        app.launchArguments = ["--account-fixture", "learner-welcome", UUID().uuidString, "--fixture-reset", "--locale", "en"]
        app.launch(); XCTAssertTrue(app.buttons["learner-welcome-add"].waitForExistence(timeout: 15)); app.buttons["learner-welcome-add"].tap()
        XCTAssertTrue(app.staticTexts["learner-intake"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["claim-photo"].exists); XCTAssertFalse(app.textFields["claim-link"].exists)
        capture(app, "Learner Add three native routes")
        app.buttons["learner-intake-link"].tap()
        XCTAssertTrue(app.textFields["claim-link"].waitForExistence(timeout: 10)); XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["claim"].exists)
        capture(app, "Learner Add claim link awaiting explicit review")
        app.navigationBars.buttons["Cancel"].tap()
        XCTAssertTrue(app.staticTexts["page-title-home"].waitForExistence(timeout: 5))
        app.buttons["create"].tap(); XCTAssertTrue(app.buttons["learner-intake-photo"].waitForExistence(timeout: 5))
        app.buttons["learner-intake-photo"].tap()
        let photos = app.navigationBars["Photos"]
        XCTAssertTrue(photos.waitForExistence(timeout: 10)); photos.buttons["Cancel"].tap()
        let closed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: photos)
        XCTAssertEqual(XCTWaiter.wait(for: [closed], timeout: 5), .completed)
        XCTAssertTrue(app.buttons["claim-photo"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.descendants(matching: .any)["claim-camera"].firstMatch.exists)
        app.navigationBars.buttons["Cancel"].tap()
        XCTAssertTrue(app.staticTexts["page-title-home"].waitForExistence(timeout: 5))
    }
    func testHomeEmptyAndPartialPassportsHaveDifferentActions() {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--empty-collection", "--locale", "en"]; app.launch()
        XCTAssertTrue(app.buttons["home-first-add"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["home-share"].exists)
        capture(app, "Learner fresh Home English")
        app.buttons["home-first-add"].tap(); XCTAssertTrue(app.buttons["learner-intake-photo"].waitForExistence(timeout: 5))
        app.buttons["Cancel"].tap(); XCTAssertTrue(app.buttons["home-first-add"].waitForExistence(timeout: 5))
        app.terminate(); app.launchArguments = ["--demo", "--empty-page", "--locale", "en"]; app.launch()
        XCTAssertTrue(app.buttons["home-load-more"].waitForExistence(timeout: 10)); XCTAssertFalse(app.buttons["home-first-add"].exists)
        app.buttons["home-load-more"].tap()
        XCTAssertTrue(app.buttons["home-collection"].waitForExistence(timeout: 10))
    }
    func testArabicDarkWelcomeAndIntakeAtStandardAndAccessibilitySizes() {
        for extra in [[], ["--large-type"]] {
            let app = XCUIApplication()
            app.launchArguments = ["--account-fixture", "learner-welcome", UUID().uuidString, "--fixture-reset", "--locale", "ar", "--preview-dark"] + extra
            app.launch(); let add = app.buttons["learner-welcome-add"]
            XCTAssertTrue(add.waitForExistence(timeout: 15)); XCTAssertTrue(add.isHittable)
            capture(app, "Learner Arabic dark welcome \(extra.isEmpty ? "standard" : "accessibility")")
            add.tap(); let link = app.buttons["learner-intake-link"]
            XCTAssertTrue(link.waitForExistence(timeout: 10))
            let cancel = app.navigationBars.buttons["إلغاء"].firstMatch
            XCTAssertTrue(cancel.waitForExistence(timeout: 5))
            XCTAssertGreaterThan(cancel.frame.midX, app.frame.midX, "Arabic sheet navigation must use RTL, including its cancellation action")
            let icon = link.images["DrawnSharing"]
            XCTAssertTrue(icon.exists)
            XCTAssertGreaterThan(icon.frame.midX, link.frame.midX, "The route illustration belongs on the leading RTL edge")
            for _ in 0..<4 { if link.isHittable { break }; app.swipeUp() }
            XCTAssertTrue(link.isHittable); XCTAssertGreaterThanOrEqual(link.frame.height, 44)
            capture(app, "Learner Arabic dark intake \(extra.isEmpty ? "standard" : "accessibility")")
            app.terminate()
        }
    }
}
