import XCTest

@MainActor final class RootScrollUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testRootPagesEndAboveTrayAtStandardSize() {
        checkPageEnds(arguments: ["--locale", "en", "--standard-type"])
    }

    func testRootPagesEndAboveTrayInArabicDark() {
        checkPageEnds(arguments: ["--locale", "ar", "--standard-type", "--preview-dark"])
    }

    func testRootPagesEndAboveTrayWithAccessibilityType() {
        checkPageEnds(arguments: ["--locale", "ar", "--large-type", "--preview-dark"])
    }

    private func checkPageEnds(arguments: [String], file: StaticString = #filePath, line: UInt = #line) {
        let app = XCUIApplication()
        app.launchArguments = ["--demo", "--empty-apps"] + arguments
        app.launch()
        let tray = app.descendants(matching: .any).matching(identifier: "bottom-navigation").firstMatch
        XCTAssertTrue(tray.waitForExistence(timeout: 10), file: file, line: line)
        // RTL moves the native scrollbar to the left. Drag in the opposite
        // gutter so this remains a content pan rather than scrollbar scrubbing.
        let gutter = arguments.contains("ar") ? 0.98 : 0.02

        // These are the actual final controls in the unmodified, in-memory sample data.
        for (tab, lastID) in [("apps", "apps-resume"), ("home", "home-creations"),
                              ("collection", "credential-member"), ("inbox", "inbox-dismiss-sample-connection")] {
            app.buttons["nav-\(tab)"].tap()
            XCTAssertFalse(app.tabBars.buttons.allElementsBoundByIndex.contains { $0.isHittable },
                           "Only the custom tray may be visible; a second system tab bar would hide this regression", file: file, line: line)
            let last = app.buttons[lastID]
            let scroll = app.scrollViews.firstMatch
            XCTAssertTrue(scroll.waitForExistence(timeout: 5), file: file, line: line)
            var previous: CGRect?
            for _ in 0..<14 {
                // The credential stack has its own gestures. Pan in the page gutter
                // so this check measures scrolling without opening an active card.
                let start = scroll.coordinate(withNormalizedOffset: CGVector(dx: gutter, dy: 0.82))
                let end = scroll.coordinate(withNormalizedOffset: CGVector(dx: gutter, dy: 0.22))
                start.press(forDuration: 0.05, thenDragTo: end)
                if last.exists && last.isHittable {
                    let current = last.frame
                    if let previous, abs(previous.minY - current.minY) < 1 { break }
                    previous = current
                }
            }
            XCTAssertTrue(last.isHittable, app.debugDescription, file: file, line: line)

            // Check the released, settled position, not a temporary rubber-band overscroll.
            var prior = last.frame
            var unchanged = 0
            let settled = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
                let current = last.frame
                unchanged = abs(current.minY - prior.minY) < 0.5 ? unchanged + 1 : 0
                prior = current
                return unchanged >= 2
            }, object: nil)
            XCTAssertEqual(XCTWaiter.wait(for: [settled], timeout: 5), .completed, file: file, line: line)
            let screenshot = XCTAttachment(screenshot: app.screenshot())
            screenshot.name = "Settled page bottom \(tab) \(arguments.joined(separator: " "))"
            screenshot.lifetime = .keepAlways; add(screenshot)
            XCTAssertGreaterThanOrEqual(last.frame.height, 44, file: file, line: line)
            XCTAssertLessThanOrEqual(last.frame.maxY, tray.frame.minY - 12,
                                     "\(tab) ends at \(last.frame.maxY), behind tray starting at \(tray.frame.minY)", file: file, line: line)
        }
    }
}
