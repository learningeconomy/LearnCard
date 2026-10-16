import XCTest

@MainActor extension XCUIApplication {
    /// Collection-specific tests navigate there explicitly; Home is the real entry screen.
    func openCollection(file: StaticString = #filePath, line: UInt = #line) {
        let destination = buttons["nav-collection"]
        XCTAssertTrue(destination.waitForExistence(timeout: 15), file: file, line: line)
        destination.tap()
    }
}
