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
            // Short gutter drags avoid overshooting a row on compact phones.
            let scroll = app.scrollViews.firstMatch
            let down = element.exists && element.frame.minY < 100
            let start = scroll.coordinate(withNormalizedOffset: CGVector(dx: 0.03, dy: down ? 0.35 : 0.65))
            let end = scroll.coordinate(withNormalizedOffset: CGVector(dx: 0.03, dy: down ? 0.60 : 0.40))
            start.press(forDuration: 0.1, thenDragTo: end)
        }
        XCTAssertTrue(element.isHittable)
    }
    private func capture(_ app: XCUIApplication, _ name: String) { let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot) }
    func testSampleReviewCancellationConsentAndRetryAndMilestoneProgress() {
        let app = launch()
        let samples = app.buttons["build-sample-native-sample-student"]
        reveal(samples, app); samples.tap()
        XCTAssertTrue(app.buttons["consent-agree"].waitForExistence(timeout: 5))
        let receive = app.switches["consent-permission-Achievement"]
        XCTAssertEqual(receive.value as? String, "1")
        reveal(receive, app); receive.tap()
        XCTAssertFalse(app.buttons["consent-agree"].isEnabled)
        receive.tap(); XCTAssertTrue(app.buttons["consent-agree"].isEnabled)
        capture(app, "Sample credential access review")
        app.navigationBars.buttons["Cancel"].tap()
        XCTAssertFalse(app.staticTexts["build-sample-result"].exists)
        reveal(samples, app); samples.tap(); app.buttons["consent-agree"].tap()
        let result = app.staticTexts["build-sample-result"]
        XCTAssertTrue(result.waitForExistence(timeout: 10)); XCTAssertTrue(result.label.contains("12"))
        reveal(samples, app); samples.tap()
        XCTAssertTrue(result.waitForExistence(timeout: 5)); XCTAssertTrue(result.label.contains("12"))
        reveal(app.staticTexts["build-progress"], app)
        XCTAssertTrue(app.staticTexts["build-progress"].label.contains("0 of 4"))
        capture(app, "Optional document milestones and sample credentials")
        reveal(app.buttons["build-documents"], app); app.buttons["build-documents"].tap()
        let sampleFile = app.buttons["intake-synthetic-file"]; reveal(sampleFile, app); sampleFile.tap()
        app.buttons["intake-file-action"].tap()
        XCTAssertTrue(app.staticTexts["intake-complete"].waitForExistence(timeout: 5)); app.buttons["intake-file-action"].tap()
        reveal(app.staticTexts["build-progress"], app)
        XCTAssertTrue(app.staticTexts["build-progress"].label.contains("1 of 4"))
        capture(app, "One saved document milestone")
    }
    func testSampleSyncStaysVisibleAcrossTabsAndRefreshesPassport() {
        for flags in [["--locale", "en", "--standard-type"], ["--locale", "ar", "--preview-dark", "--large-type"]] {
            let app = launch(flags + ["--sample-sync-slow"])
            let samples = app.buttons["build-sample-native-sample-student"]
            reveal(samples, app); samples.tap()
            XCTAssertTrue(app.buttons["consent-agree"].waitForExistence(timeout: 5)); app.buttons["consent-agree"].tap()
            let banner = app.otherElements["sample-sync-banner"]
            XCTAssertTrue(banner.waitForExistence(timeout: 5))
            app.buttons["nav-collection"].tap()
            XCTAssertTrue(banner.exists); XCTAssertFalse(app.alerts.firstMatch.exists)
            XCTAssertTrue(app.staticTexts["sample-sync-detail"].exists)
            capture(app, "Sample sync progress on Passport \(flags[1])")
            app.buttons["nav-apps"].tap(); XCTAssertTrue(banner.exists)
            let passport = app.buttons["sample-sync-passport"]
            XCTAssertTrue(passport.waitForExistence(timeout: 30)); XCTAssertTrue(passport.isHittable)
            XCTAssertFalse(app.buttons["sample-sync-retry"].exists)
            XCTAssertTrue(app.staticTexts["sample-sync-detail"].label.contains("12"))
            XCTAssertLessThanOrEqual(banner.frame.maxY, app.otherElements["bottom-navigation"].frame.minY + 1)
            capture(app, "Sample sync completion on Apps \(flags[1])")
            passport.tap(); XCTAssertTrue(app.staticTexts["page-title-collection"].waitForExistence(timeout: 5))
            XCTAssertTrue(app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'credential-sample-student-'" )).firstMatch.waitForExistence(timeout: 5))
            XCTAssertFalse(app.alerts.firstMatch.exists)
            app.buttons["sample-sync-dismiss"].tap(); XCTAssertFalse(banner.exists)
            app.terminate()
        }
    }
    func testPartialSampleSyncKeepsRetryAvailableAcrossTabs() {
        let app = launch(["--locale", "en", "--standard-type", "--sample-sync-partial"])
        let samples = app.buttons["build-sample-native-sample-student"]
        reveal(samples, app); samples.tap()
        XCTAssertTrue(app.buttons["consent-agree"].waitForExistence(timeout: 5)); app.buttons["consent-agree"].tap()
        app.buttons["nav-collection"].tap()
        let retry = app.buttons["sample-sync-retry"]
        XCTAssertTrue(retry.waitForExistence(timeout: 15)); capture(app, "Partial sample sync has a visible retry")
        retry.tap()
        XCTAssertTrue(app.buttons["sample-sync-passport"].waitForExistence(timeout: 15))
        XCTAssertFalse(retry.exists)
        XCTAssertTrue(app.staticTexts["sample-sync-detail"].label.contains("12")); XCTAssertFalse(app.alerts.firstMatch.exists)
        capture(app, "Retried sample sync completed without duplicates")
    }
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
