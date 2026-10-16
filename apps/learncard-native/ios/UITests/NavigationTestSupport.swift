import XCTest

@MainActor extension XCUIApplication {
    /// Collection-specific tests navigate there explicitly; Home is the real entry screen.
    func openCollection(file: StaticString = #filePath, line: UInt = #line) {
        let destination = buttons["nav-collection"]
        XCTAssertTrue(destination.waitForExistence(timeout: 15), file: file, line: line)
        destination.tap()
    }
    func openCredentialTools(file: StaticString = #filePath, line: UInt = #line) {
        let add = buttons["create"]
        XCTAssertTrue(add.waitForExistence(timeout: 10), file: file, line: line); add.tap()
        let tools = buttons["learner-more-tools"]
        XCTAssertTrue(tools.waitForExistence(timeout: 5), file: file, line: line)
        for _ in 0..<3 { if tools.isHittable { break }; swipeUp() }
        tools.tap()
        XCTAssertTrue(buttons["collection-action-create"].waitForExistence(timeout: 5), file: file, line: line)
    }
    func exploreLearnerWelcome(file: StaticString = #filePath, line: UInt = #line) {
        let explore = buttons["learner-welcome-explore"]
        XCTAssertTrue(explore.waitForExistence(timeout: 15), file: file, line: line); explore.tap()
        XCTAssertTrue(staticTexts["page-title-home"].waitForExistence(timeout: 10), file: file, line: line)
    }

}
