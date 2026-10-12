import XCTest

final class KeychainLifecycleTests: XCTestCase {
    @MainActor func testDeviceOnlyAccessAndAccountIsolation() {
        let app = XCUIApplication()
        app.launchArguments = ["--keychain-probe"]
        app.launch()
        XCTAssertTrue(app.staticTexts["Device-only storage verified"].waitForExistence(timeout: 15), app.debugDescription)
    }
}
