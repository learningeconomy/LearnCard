import XCTest

@MainActor final class CredentialAuthoringUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testWebFormatsAreSeparateAndCancellingTypeSelectionPreservesDraft() {
        let app = openBuilder()
        let category = app.buttons["draft-category"], format = app.buttons["draft-format"]
        reveal(format, app); format.tap()
        for value in ["badge", "award", "certificate", "media"] { XCTAssertTrue(app.buttons["builder-format-\(value)"].exists) }
        for value in ["course", "competency", "membership", "license", "microCredential"] { XCTAssertFalse(app.buttons["builder-format-\(value)"].exists) }
        capture(app, "Four web visual formats")
        app.buttons["builder-format-award"].tap()
        XCTAssertTrue(format.label.contains("Award")); XCTAssertTrue(category.label.contains("Certificate"))
        category.tap()
        let sheet = app.scrollViews["builder-category-sheet"]
        for value in ["badge", "achievement", "qualification", "studies", "portfolio", "assistance", "experience", "id"] {
            let row = app.buttons["builder-category-\(value)"]; reveal(row, app, in: sheet); XCTAssertTrue(row.isHittable)
        }
        XCTAssertFalse(app.buttons["builder-category-family"].exists); XCTAssertFalse(app.buttons["builder-category-aiTopic"].exists)
        let qualifications = app.buttons["builder-category-qualification"]; reveal(qualifications, app, in: sheet); qualifications.tap()
        XCTAssertTrue(app.buttons["builder-type-License"].waitForExistence(timeout: 5))
        app.buttons["builder-selector-cancel"].firstMatch.tap()
        XCTAssertTrue(category.label.contains("Achievements")); XCTAssertTrue(category.label.contains("Certificate"))
        XCTAssertTrue(format.label.contains("Award"))
    }

    func testPortfolioTypeSearchAndCreationStayInPortfolio() {
        let app = openBuilder(); fillBasics(app, title: "Native portfolio project")
        pickCategory("portfolio", type: "ext:Project", query: "Project", app: app)
        XCTAssertTrue(app.buttons["draft-category"].label.contains("Portfolio")); XCTAssertTrue(app.buttons["draft-category"].label.contains("Project"))
        XCTAssertTrue(app.buttons["draft-format"].label.contains("Media"))
        capture(app, "Portfolio and Project separate from Media format")
        app.buttons["create-next"].tap(); app.buttons["create-next"].tap()
        XCTAssertTrue(app.staticTexts["Type: Project"].exists)
        app.buttons["create-confirm"].tap()
        let done = app.alerts.buttons["Done"]; if done.waitForExistence(timeout: 3) { done.tap() }
        let filter = app.buttons["collection-category-portfolio"]; XCTAssertTrue(filter.waitForExistence(timeout: 5))
        let bar = app.scrollViews["collection-categories"]
        for _ in 0..<8 {
            if bar.frame.insetBy(dx: 2, dy: -1).contains(filter.frame) { break }
            let forward = filter.frame.midX > bar.frame.midX
            bar.coordinate(withNormalizedOffset: CGVector(dx: forward ? 0.85 : 0.15, dy: 0.5)).press(forDuration: 0.15,
                thenDragTo: bar.coordinate(withNormalizedOffset: CGVector(dx: forward ? 0.15 : 0.85, dy: 0.5)), withVelocity: .slow, thenHoldForDuration: 0.1)
        }
        XCTAssertTrue(filter.isHittable); filter.tap()
        let credential = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Native portfolio project")).firstMatch
        XCTAssertTrue(credential.waitForExistence(timeout: 5)); credential.tap()
        XCTAssertEqual(app.staticTexts["credential-metadata-category"].label, "Portfolio")
    }

    func testQualificationsAndFixedIDFormatUseWebTypes() {
        let app = openBuilder()
        pickCategory("qualification", type: "License", query: nil, app: app)
        XCTAssertTrue(app.buttons["draft-category"].label.contains("Qualifications")); XCTAssertTrue(app.buttons["draft-category"].label.contains("License"))
        capture(app, "Qualifications category and License type")
        pickCategory("id", type: "ext:SchoolID", query: "School", app: app)
        XCTAssertTrue(app.buttons["draft-category"].label.contains("IDs")); XCTAssertTrue(app.buttons["draft-format"].label.contains("ID card"))
        app.buttons["draft-format"].tap()
        XCTAssertTrue(app.buttons["builder-format-id"].waitForExistence(timeout: 5)); XCTAssertTrue(app.buttons["builder-format-id"].isSelected)
        XCTAssertFalse(app.buttons["builder-format-badge"].exists); XCTAssertFalse(app.buttons["builder-format-media"].exists)
        capture(app, "IDs retain the dedicated ID card format")
    }

    func testArabicAccessibilityCategoryTypeAndFormatSheets() {
        let app = openBuilder(["--locale", "ar", "--large-type", "--preview-dark"])
        pickCategory("qualification", type: "License", query: "رخصة", app: app)
        let category = app.buttons["draft-category"]; reveal(category, app)
        XCTAssertTrue(category.label.contains("رخصة")); XCTAssertGreaterThanOrEqual(category.frame.height, 44)
        let format = app.buttons["draft-format"]; reveal(format, app); format.tap()
        let award = app.buttons["builder-format-award"]; XCTAssertTrue(award.waitForExistence(timeout: 5)); XCTAssertTrue(award.label.contains("جائزة"))
        capture(app, "Arabic accessibility web format choices")
        award.tap(); XCTAssertTrue(category.label.contains("رخصة")); XCTAssertTrue(format.label.contains("جائزة"))
    }

    private func pickCategory(_ value: String, type: String, query: String?, app: XCUIApplication) {
        let selector = app.buttons["draft-category"]; reveal(selector, app); selector.tap()
        let row = app.buttons["builder-category-\(value)"]
        reveal(row, app, in: app.scrollViews["builder-category-sheet"]); row.tap()
        let list = app.scrollViews["builder-type-sheet"]; XCTAssertTrue(list.waitForExistence(timeout: 5))
        if let query { let search = app.textFields["builder-type-search"]; search.tap(); search.typeText(query + "\n") }
        let choice = app.buttons["builder-type-\(type)"]; reveal(choice, app, in: list)
        capture(app, "Category-specific credential types \(value)")
        choice.tap(); XCTAssertTrue(selector.waitForExistence(timeout: 5))
    }
    private func fillBasics(_ app: XCUIApplication, title: String) {
        let field = app.textFields["draft-title"]; reveal(field, app); field.tap(); field.typeText(title)
        let summary = app.descendants(matching: .any)["draft-summary"].firstMatch
        reveal(summary, app); summary.tap(); summary.typeText("A synthetic portfolio project."); app.toolbars.buttons["Done"].tap()
    }
    private func openBuilder(_ extra: [String] = []) -> XCUIApplication {
        let app = XCUIApplication(); app.launchArguments = ["--demo"] + (extra.contains("--locale") ? [] : ["--locale", "en"]) + extra
        app.launch(); app.openCollection(); app.openCredentialTools(); app.buttons["collection-action-create"].tap()
        XCTAssertTrue(app.textFields["draft-title"].waitForExistence(timeout: 5)); return app
    }
    private func reveal(_ element: XCUIElement, _ app: XCUIApplication, in scroll: XCUIElement? = nil) {
        let viewport = scroll ?? app.scrollViews["create-content"]
        XCTAssertTrue(viewport.waitForExistence(timeout: 5))
        for _ in 0..<8 {
            if element.exists && element.isHittable && element.frame.minY >= viewport.frame.minY + 4 && element.frame.maxY <= viewport.frame.maxY - 4 { return }
            if element.exists && element.frame.minY < viewport.frame.minY { viewport.swipeDown() } else { viewport.swipeUp() }
        }
        XCTAssertTrue(element.isHittable)
    }
    private func capture(_ app: XCUIApplication, _ title: String) {
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = title; shot.lifetime = .keepAlways; add(shot)
    }
}
