import XCTest
final class KeyboardAnimationTests: XCTestCase {
    func testKeyboardAnimation() throws {
        continueAfterFailure = false
        let app = XCUIApplication(bundleIdentifier: "com.learncard.app")
        app.launch()
        let search = app.webViews.textFields["Search"]
        XCTAssertTrue(search.waitForExistence(timeout: 90), app.debugDescription)
        sleep(2)
        search.tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 10))
        sleep(2)
        app.webViews.buttons["Dismiss keyboard"].tap()
        sleep(2)
        search.tap()
        sleep(2)
        app.webViews.buttons["Dismiss keyboard"].tap()
        sleep(2)
    }
}
