import XCTest

@MainActor final class PassportBrowseUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private func launch(_ flags: [String] = []) -> XCUIApplication {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--standard-type"] + flags
        if !flags.contains("--locale") { app.launchArguments += ["--locale", "en"] }
        app.launch(); app.openCollection(); return app
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot)
    }
    private func reveal(_ element: XCUIElement, app: XCUIApplication) {
        for _ in 0..<10 where !element.isHittable {
            let scroll = app.scrollViews.firstMatch
            let x = app.launchArguments.contains("ar") ? 0.98 : 0.02
            let above = element.exists && element.frame.midY < scroll.frame.midY
            scroll.coordinate(withNormalizedOffset: CGVector(dx: x, dy: above ? 0.25 : 0.8))
                .press(forDuration: 0.05, thenDragTo: scroll.coordinate(withNormalizedOffset: CGVector(dx: x, dy: above ? 0.8 : 0.25)))
        }
        XCTAssertTrue(element.isHittable, app.debugDescription)
    }

    func testCategoryDoesNotCreateResetRowAndDateResetStaysWithControls() {
        let app = launch(["--empty-collection"])
        app.buttons["collection-category-achievement"].tap()
        XCTAssertTrue(app.staticTexts["collection-empty-category"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["passport-reset-browse"].exists)
        capture(app, "Unobstructed category empty illustration and compact browse controls")
        let dates = app.buttons["passport-dates"], sort = app.buttons["passport-sort"]
        let reset = app.buttons["passport-reset-browse"]
        for (order, label) in [("oldest", "Oldest first"), ("title", "Title A–Z"), ("issuer", "Issuer A–Z")] {
            sort.tap(); app.buttons["passport-sort-\(order)"].tap()
            XCTAssertTrue(reset.isHittable)
            XCTAssertEqual(sort.label, "Sort: \(label)")
            XCTAssertEqual(dates.frame.midY, sort.frame.midY, accuracy: 2)
            XCTAssertEqual(reset.frame.midY, sort.frame.midY, accuracy: 2)
            for button in [dates, sort, reset] {
                XCTAssertGreaterThanOrEqual(button.frame.height, 44)
                // Accessibility frames include the capsule's outer stroke.
                XCTAssertGreaterThanOrEqual(button.frame.minX, 19)
                XCTAssertLessThanOrEqual(button.frame.maxX, app.frame.maxX - 19)
            }
            if order == "oldest" { capture(app, "Passport date sort and reset on one line") }
        }
        reset.tap(); XCTAssertFalse(reset.exists)
    }

    func testIssuerAndDateAreExplicitOnCardDetailAndSortedList() {
        let app = launch()
        let card = app.buttons["credential-design"]
        XCTAssertTrue(card.waitForExistence(timeout: 10))
        XCTAssertTrue(card.label.contains("Issued by Open Learning Studio"), card.label)
        XCTAssertTrue(card.label.contains("Issued Oct"), card.label)
        card.tap()
        XCTAssertTrue(app.staticTexts["credential-metadata-from"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.staticTexts["credential-metadata-from"].label, "Open Learning Studio")
        XCTAssertTrue(app.staticTexts["Issued by"].exists)
        XCTAssertTrue(app.staticTexts["Issue date"].exists)
        capture(app, "Credential detail with explicit issuer and issue date")
        app.navigationBars.buttons.firstMatch.tap()
        app.buttons["passport-sort"].tap()
        XCTAssertTrue(app.scrollViews["passport-sort-sheet"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["passport-sort-newest"].isSelected)
        capture(app, "Designed Passport sort sheet")
        app.buttons["passport-sort-title"].tap()
        let first = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "credential-")).firstMatch
        XCTAssertTrue(first.waitForExistence(timeout: 5))
        XCTAssertEqual(first.identifier, "credential-member")
        XCTAssertTrue(first.label.contains("Issued by Learning Circle")); XCTAssertTrue(first.label.contains("Issued Oct"))
        XCTAssertFalse(app.staticTexts["Latest issued"].exists)
        capture(app, "Passport alphabetical results and labelled metadata")
        app.buttons["passport-reset-browse"].tap()
        XCTAssertFalse(app.otherElements["latest-stack"].exists)
    }

    func testSearchChecksRemainingPagesAndDateDraftCanCancelApplyAndReset() {
        let app = launch(["--share-picker-fixtures"])
        let search = app.textFields["collection-search"]; search.tap(); search.typeText("Archive 239\n")
        let match = app.buttons["credential-share-fixture-239"]
        XCTAssertTrue(match.waitForExistence(timeout: 15), app.debugDescription)
        XCTAssertTrue(app.staticTexts["1 match"].exists)
        XCTAssertFalse(app.staticTexts["passport-paging-status"].exists)
        app.buttons["passport-dates"].tap(); app.buttons["passport-date-year"].tap()
        app.buttons["passport-options-cancel"].tap()
        XCTAssertTrue(match.waitForExistence(timeout: 5)); XCTAssertFalse(app.buttons["passport-dates"].isSelected)
        app.buttons["passport-dates"].tap(); app.buttons["passport-date-year"].tap()
        app.buttons["passport-date-apply"].tap()
        XCTAssertTrue(app.staticTexts["collection-empty-search"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.staticTexts["collection-empty-category"].exists)
        XCTAssertFalse(match.exists)
        capture(app, "Search across the whole Passport with an issue-date filter")
        app.buttons["collection-search-reset"].tap()
        XCTAssertTrue(match.waitForExistence(timeout: 5)); XCTAssertEqual(search.value as? String, "Archive 239")
        app.buttons["collection-search-clear"].tap()
        XCTAssertFalse(app.otherElements["latest-stack"].exists)
    }

    func testArabicAccessibilityDateSheetAndControlsRemainUsable() {
        let app = launch(["--locale", "ar", "--large-type", "--preview-dark"])
        let dates = app.buttons["passport-dates"]; reveal(dates, app: app); dates.tap()
        XCTAssertTrue(app.buttons["passport-date-custom"].label.contains("تواريخ"), app.debugDescription)
        let custom = app.buttons["passport-date-custom"]; reveal(custom, app: app); custom.tap()
        let from = app.datePickers["passport-date-from"]; reveal(from, app: app)
        let through = app.datePickers["passport-date-through"]; reveal(through, app: app)
        XCTAssertGreaterThanOrEqual(through.frame.minX, 0); XCTAssertLessThanOrEqual(through.frame.maxX, app.frame.maxX)
        XCTAssertTrue(app.buttons["passport-date-apply"].isHittable)
        capture(app, "Arabic large-text custom date sheet")
        app.buttons["passport-date-apply"].tap()
        let reset = app.buttons["passport-reset-browse"]; reveal(reset, app: app)
        XCTAssertTrue(app.buttons["passport-dates"].isSelected)
        capture(app, "Arabic large-text Passport browse controls")
        reset.tap(); XCTAssertFalse(app.buttons["passport-dates"].isSelected)
    }
}
