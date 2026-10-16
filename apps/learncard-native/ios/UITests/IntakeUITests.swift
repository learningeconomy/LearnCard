import XCTest

@MainActor final class IntakeUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private func launch(_ args: [String] = ["--locale", "en", "--standard-type"], fixtures: Bool = true) -> XCUIApplication {
        let app = XCUIApplication(); app.launchArguments = ["--demo"] + (fixtures ? ["--intake-file-fixture"] : []) + args; app.launch()
        XCTAssertTrue(app.buttons["home-build"].waitForExistence(timeout: 15))
        reveal(app.buttons["home-build"], app); app.buttons["home-build"].tap()
        XCTAssertTrue(app.buttons["build-documents"].waitForExistence(timeout: 5)); return app
    }
    private func reveal(_ element: XCUIElement, _ app: XCUIApplication) {
        for _ in 0..<10 {
            if element.exists && element.isHittable && element.frame.minY > 100 && element.frame.maxY < app.frame.maxY - 100 { return }
            if element.exists && element.frame.minY < 100 { app.swipeDown() } else { app.swipeUp() }
        }
        XCTAssertTrue(element.isHittable)
    }
    private func capture(_ app: XCUIApplication, _ name: String) { let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot) }
    func testDocumentPickerCancellationReviewSaveAndPrivateViewer() {
        let app = launch(); capture(app, "Build native file routes")
        reveal(app.buttons["build-documents"], app); app.buttons["build-documents"].tap()
        XCTAssertTrue(app.buttons["intake-kind-certificate"].waitForExistence(timeout: 5)); capture(app, "Native document kinds English")
        app.buttons["intake-file-action"].tap()
        let picker = app.navigationBars["FullDocumentManagerViewControllerNavigationBar"]
        XCTAssertTrue(picker.waitForExistence(timeout: 10)); picker.buttons["Cancel"].tap()
        XCTAssertFalse(app.staticTexts["intake-file-name"].exists)
        let sample = app.buttons["intake-synthetic-file"]; reveal(sample, app); sample.tap()
        XCTAssertTrue(app.staticTexts["intake-file-name"].waitForExistence(timeout: 5)); XCTAssertFalse(app.staticTexts["intake-complete"].exists)
        capture(app, "Native document review before private save")
        app.buttons["intake-file-action"].tap(); XCTAssertTrue(app.staticTexts["intake-complete"].waitForExistence(timeout: 5))
        capture(app, "Native document save result")
        app.buttons["intake-file-action"].tap()
        let document = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'intake-document-'")).firstMatch
        XCTAssertTrue(document.waitForExistence(timeout: 5)); reveal(document, app); document.tap()
        let done = app.buttons["QLOverlayDoneButtonAccessibilityIdentifier"].firstMatch
        XCTAssertTrue(done.waitForExistence(timeout: 10))
        let contents = app.textViews.matching(NSPredicate(format: "label CONTAINS 'Synthetic personal document for native regression checks.'")).firstMatch
        XCTAssertTrue(contents.waitForExistence(timeout: 15), "Wait for the original content, not only Quick Look's loading controls")
        capture(app, "Native saved original Quick Look"); done.tap()
        XCTAssertTrue(app.staticTexts["page-title-build"].waitForExistence(timeout: 5))
    }
    func testJSONReviewSelectionImportsOnlyChosenOriginal() {
        let app = launch(); reveal(app.buttons["build-credential-file"], app); app.buttons["build-credential-file"].tap()
        let sample = app.buttons["intake-synthetic-file"]; XCTAssertTrue(sample.waitForExistence(timeout: 5)); reveal(sample, app); sample.tap()
        let course = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'intake-candidate-' AND label CONTAINS 'Imported course'")).firstMatch
        XCTAssertTrue(course.waitForExistence(timeout: 5)); reveal(course, app); course.tap()
        XCTAssertFalse(course.isSelected); capture(app, "Native credential review with explicit selection")
        app.buttons["intake-file-action"].tap(); XCTAssertTrue(app.staticTexts["intake-complete"].waitForExistence(timeout: 5)); XCTAssertTrue(app.staticTexts["intake-complete"].label.contains("1"))
        app.buttons["intake-file-action"].tap(); app.buttons["nav-collection"].tap()
        let project = app.buttons.matching(NSPredicate(format: "label CONTAINS 'Imported project'")).firstMatch
        XCTAssertTrue(project.waitForExistence(timeout: 5)); XCTAssertFalse(app.buttons.matching(NSPredicate(format: "label CONTAINS 'Imported course'")).firstMatch.exists)
    }
    func testBackgroundClearsUnsavedReviewAndAddOffersFileRoute() {
        let app = launch(); reveal(app.buttons["build-documents"], app); app.buttons["build-documents"].tap()
        let sample = app.buttons["intake-synthetic-file"]; XCTAssertTrue(sample.waitForExistence(timeout: 5)); reveal(sample, app); sample.tap()
        XCTAssertTrue(app.staticTexts["intake-file-name"].waitForExistence(timeout: 5))
        XCUIDevice.shared.press(.home); XCTAssertTrue(app.wait(for: .runningBackground, timeout: 5)); app.activate()
        XCTAssertTrue(app.buttons["intake-file-action"].waitForExistence(timeout: 5)); XCTAssertFalse(app.staticTexts["intake-file-name"].exists)
        app.navigationBars.buttons["Cancel"].firstMatch.tap(); app.buttons["nav-home"].tap()
        let back = app.navigationBars.buttons.firstMatch; if back.exists { back.tap() }
        app.buttons["create"].tap(); let files = app.buttons["learner-intake-files"]; XCTAssertTrue(files.waitForExistence(timeout: 5)); reveal(files, app); files.tap()
        XCTAssertTrue(app.buttons["build-documents"].waitForExistence(timeout: 5)); XCTAssertFalse(app.webViews.firstMatch.exists)
    }
    func testArabicDarkFileSheetsAtStandardAndAccessibilitySizes() {
        for extra in [["--standard-type"], ["--large-type"]] {
            let app = launch(["--locale", "ar", "--preview-dark"] + extra, fixtures: false)
            reveal(app.buttons["build-documents"], app); app.buttons["build-documents"].tap()
            let cancel = app.navigationBars.buttons["إلغاء"].firstMatch
            XCTAssertTrue(cancel.waitForExistence(timeout: 5)); XCTAssertGreaterThan(cancel.frame.midX, app.frame.midX)
            let diploma = app.buttons["intake-kind-diploma"]; reveal(diploma, app); diploma.tap(); XCTAssertTrue(diploma.isSelected)
            XCTAssertGreaterThanOrEqual(app.buttons["intake-file-action"].frame.height, 44)
            capture(app, "Native Arabic document sheet \(extra[0])")
            cancel.tap(); app.terminate()
        }
    }
}
