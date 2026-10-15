import XCTest

@MainActor final class CredentialBuilderUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testRequiredDetailsBackNavigationAndCriteriaSurviveReview() {
        let app = openBuilder()
        capture(app, "Colorful credential design")
        XCTAssertFalse(app.buttons["create-next"].isEnabled)
        let title = app.textFields["draft-title"]
        title.tap(); title.typeText("A brilliant teammate")
        XCTAssertFalse(app.buttons["create-next"].isEnabled)
        let summary = app.descendants(matching: .any)["draft-summary"].firstMatch
        summary.tap(); summary.typeText("Thank you for making room for everyone.")
        app.toolbars.buttons["Done"].tap()
        app.swipeUp()
        let criteria = app.buttons["draft-criteria-section"]
        reveal(criteria, in: app)
        criteria.tap()
        let field = app.descendants(matching: .any)["draft-criteria"].firstMatch
        reveal(field, in: app)
        field.tap(); field.typeText("Helped three new teammates get started.")
        app.toolbars.buttons["Done"].tap()
        app.buttons["create-next"].tap()
        XCTAssertTrue(app.buttons["recipient-self"].waitForExistence(timeout: 5))
        capture(app, "Illustrated credential recipient choices")
        app.buttons["recipient-other"].tap()
        XCTAssertTrue(app.buttons["recipient-Alex Morgan"].waitForExistence(timeout: 5))
        app.buttons["recipient-picker-cancel"].tap()
        XCTAssertFalse(app.buttons["create-next"].isEnabled) // Choosing someone requires a confirmed member.
        app.buttons["recipient-self"].tap()
        app.buttons["create-next"].tap()
        XCTAssertTrue(app.buttons["create-confirm"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["create-confirm"].isEnabled)
        XCTAssertTrue(app.staticTexts["draft-delivery"].exists)
        capture(app, "Credential review before creating")
        app.buttons["create-back"].tap(); app.buttons["create-back"].tap()
        XCTAssertEqual(title.value as? String, "A brilliant teammate")
        XCTAssertEqual(summary.value as? String, "Thank you for making room for everyone.")
        app.swipeUp()
        XCTAssertEqual(field.value as? String, "Helped three new teammates get started.")
        // Reviewing/back never publishes a draft.
        app.navigationBars.buttons["Cancel"].tap()
        XCTAssertFalse(app.staticTexts["A brilliant teammate"].exists)
    }

    func testArtworkPickerCancelPreservesCredentialDraft() {
        let app = openBuilder()
        let title = app.textFields["draft-title"]
        title.tap(); title.typeText("A keeper")
        app.toolbars.buttons["Done"].tap()
        app.swipeDown()
        app.buttons["draft-artwork"].tap()
        let cancel = app.buttons["Cancel"].firstMatch
        XCTAssertTrue(cancel.waitForExistence(timeout: 10)); cancel.tap()
        XCTAssertTrue(title.waitForExistence(timeout: 5))
        XCTAssertEqual(title.value as? String, "A keeper")
        XCTAssertFalse(app.descendants(matching: .any)["create-error"].exists)
    }

    func testArabicLargeTextDarkBuilderAndNestedRecipientPicker() {
        let app = openBuilder(extra: ["--locale", "ar", "--large-type", "--preview-dark"])
        XCTAssertTrue(app.staticTexts["أضف بهجة إلى يوم أحدهم."].exists)
        let next = app.buttons["create-next"]
        XCTAssertEqual(next.label, "متابعة")
        XCTAssertGreaterThanOrEqual(next.frame.height, 44)
        let title = app.textFields["draft-title"]
        reveal(title, in: app)
        title.tap(); title.typeText("Kindness")
        app.toolbars.buttons["تم"].tap()
        let summary = app.descendants(matching: .any)["draft-summary"].firstMatch
        reveal(summary, in: app)
        summary.tap(); summary.typeText("Everyone is welcome.")
        app.toolbars.buttons["تم"].tap()
        capture(app, "Arabic accessibility design fields in dark mode")
        next.tap()
        let other = app.buttons["recipient-other"]
        reveal(other, in: app)
        XCTAssertTrue(other.isHittable)
        XCTAssertLessThanOrEqual(other.frame.maxX, app.frame.maxX + 1)
        other.tap()
        XCTAssertTrue(app.navigationBars["اختيار شخص"].waitForExistence(timeout: 5))
        let search = app.buttons["recipient-search-confirm"]
        XCTAssertEqual(search.label, "بحث")
        XCTAssertGreaterThanOrEqual(search.frame.height, 44)
        capture(app, "Arabic accessibility nested recipient picker")
        let person = app.buttons["recipient-Alex Morgan"]
        if !person.isHittable { app.swipeUp() }
        person.tap(); next.tap()
        let confirm = app.buttons["create-confirm"]
        XCTAssertTrue(confirm.waitForExistence(timeout: 5)); XCTAssertTrue(confirm.isHittable)
        XCTAssertEqual(confirm.label, "إنشاء وإرسال")
        capture(app, "Arabic accessibility credential review")
    }

    // A partly visible element can be "hittable" even when its center is under a fixed tray.
    // Scroll it fully into the content viewport, as a person would before choosing it.
    private func reveal(_ element: XCUIElement, in app: XCUIApplication) {
        let scroll = app.scrollViews["create-content"]
        for _ in 0..<6 {
            let frame = element.frame, viewport = scroll.frame
            if frame.minY >= viewport.minY + 4 && frame.maxY <= viewport.maxY - 4 { return }
            if frame.minY < viewport.minY { scroll.swipeDown() } else { scroll.swipeUp() }
        }
        XCTAssertTrue(element.isHittable)
    }
    private func openBuilder(extra: [String] = []) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["--demo"] + (extra.contains("--locale") ? [] : ["--locale", "en"]) + extra
        app.launch()
        XCTAssertTrue(app.buttons["create"].waitForExistence(timeout: 10)); app.buttons["create"].tap()
        app.buttons["collection-action-create"].tap()
        XCTAssertTrue(app.textFields["draft-title"].waitForExistence(timeout: 5)); return app
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot)
    }
}
