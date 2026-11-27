import XCTest

@MainActor final class TranscriptUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testTranscriptOfferCanBeReviewedClaimedAndReopened() {
        let app = XCUIApplication()
        app.launchArguments = ["--demo", "--transcript-fixture", "--locale", "en"]
        app.launch(); app.openCollection(); app.buttons["nav-inbox"].tap()
        let offer = app.buttons["offer-detail-transcript"]
        XCTAssertTrue(offer.waitForExistence(timeout: 10)); offer.tap()
        let course = app.staticTexts["English Language Arts"]
        for _ in 0..<7 where !course.isHittable { app.swipeUp() }
        XCTAssertTrue(course.isHittable); XCTAssertTrue(app.descendants(matching: .any)["transcript-learner"].firstMatch.exists)
        let before = XCTAttachment(screenshot: app.screenshot()); before.name = "Unsigned transcript offer details"; before.lifetime = .keepAlways; add(before)
        let claim = app.buttons["claim"]
        for _ in 0..<7 where !claim.isHittable { app.swipeDown() }
        XCTAssertTrue(claim.isHittable); claim.tap()
        XCTAssertTrue(app.alerts["Done"].waitForExistence(timeout: 5)); app.alerts["Done"].buttons["Done"].tap()
        let skip = app.buttons["connection-prompt-skip"]
        if skip.waitForExistence(timeout: 5) { skip.tap() }
        app.buttons["nav-collection"].tap()
        let saved = app.buttons["credential-detail-transcript"]
        XCTAssertTrue(saved.waitForExistence(timeout: 10)); saved.tap()
        for _ in 0..<7 where !course.isHittable { app.swipeUp() }
        XCTAssertTrue(course.isHittable)
        let after = XCTAttachment(screenshot: app.screenshot()); after.name = "Unsigned transcript saved in Passport"; after.lifetime = .keepAlways; add(after)
    }
}
