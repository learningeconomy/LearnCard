import XCTest

/// Public synthetic accounts only; production signup screens/controller, real sheet presentation.
@MainActor final class SignupUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testPhotoThumbnailAndRowBothOpenThePickerWithoutLosingProfileDraft() {
        let app = launch("signup"); birthday(app); country(app, code: "US", query: "United States")
        app.buttons["signup-continue"].tap()
        let name = app.textFields["signup-name"]; XCTAssertTrue(name.waitForExistence(timeout: 10))
        name.tap(); name.typeText("Photo draft\n")
        app.keyboards.buttons["Done"].tap()
        let closed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: app.keyboards.firstMatch)
        XCTAssertEqual(XCTWaiter.wait(for: [closed], timeout: 5), .completed)
        let photo = app.buttons["signup-photo"]; XCTAssertTrue(photo.waitForExistence(timeout: 5))
        for x in [0.14, 0.83] {
            for _ in 0..<5 where photo.frame.minY < 80 || photo.frame.maxY > app.frame.maxY - 150 || !photo.isHittable {
                app.scrollViews["signup-form"].swipeDown()
            }
            XCTAssertTrue(photo.isHittable); XCTAssertGreaterThan(photo.frame.minY, 70)
            capture(app, "Visible signup photo row before tap \(x)")
            photo.coordinate(withNormalizedOffset: CGVector(dx: x, dy: 0.5)).tap()
            let cancel = app.buttons["Cancel"].firstMatch; XCTAssertTrue(cancel.waitForExistence(timeout: 10)); cancel.tap()
            XCTAssertTrue(photo.waitForExistence(timeout: 5)); XCTAssertEqual(name.value as? String, "Photo draft")
        }
        capture(app, "Signup entire photo row with camera affordance")
    }
    func testPhotoRowRemainsUsableInArabicAccessibilityDarkLayout() {
        let app = launch("signup", language: "ar", extra: ["--large-type", "--preview-dark"])
        birthday(app); country(app, code: "US", query: "United States"); app.buttons["signup-continue"].tap()
        let photo = app.buttons["signup-photo"]; XCTAssertTrue(photo.waitForExistence(timeout: 10)); reveal(photo, app)
        XCTAssertEqual(photo.label, "إضافة صورة للملف الشخصي")
        XCTAssertGreaterThanOrEqual(photo.frame.height, 90); XCTAssertLessThanOrEqual(photo.frame.maxX, app.frame.maxX)
        let scroll = app.scrollViews["signup-form"]
        for _ in 0..<5 {
            let top = scroll.frame.minY + 16, bottom = scroll.frame.maxY - 16
            if photo.frame.minY >= top && photo.frame.maxY <= bottom { break }
            let start = scroll.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.6))
            let end = scroll.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: photo.frame.maxY > bottom ? 0.4 : 0.8))
            start.press(forDuration: 0.1, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.2)
        }
        XCTAssertTrue(photo.isHittable)
        XCTAssertGreaterThanOrEqual(photo.frame.minY, scroll.frame.minY)
        XCTAssertLessThanOrEqual(photo.frame.maxY, scroll.frame.maxY)
        capture(app, "Signup photo row Arabic accessibility dark")
    }

    func testFreshSetupRequiresExplicitBirthdayCountryAndAvailableUsername() {
        let app = launch("signup")
        XCTAssertTrue(app.buttons["signup-birth-date"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["signup-continue"].isEnabled)
        capture(app, "First-time setup - about you")
        birthday(app); country(app, code: "US", query: "United States")
        app.buttons["signup-continue"].tap()
        let name = app.textFields["signup-name"]
        XCTAssertTrue(name.waitForExistence(timeout: 10)); reveal(name, app); name.tap(); name.typeText("New Learner")
        let username = app.textFields["signup-username"]; reveal(username, app); username.tap(); username.typeText("taken")
        let status = app.descendants(matching: .any)["signup-username-status"].firstMatch
        XCTAssertTrue(status.waitForExistence(timeout: 10)); XCTAssertFalse(app.buttons["signup-continue"].isEnabled)
        username.tap(); username.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: 5) + "new-learner")
        waitEnabled(app.buttons["signup-continue"]); username.typeText("\n"); app.swipeDown(); capture(app, "First-time setup - profile")
        app.buttons["signup-continue"].tap()
        XCTAssertTrue(app.switches["signup-choice-ai"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.switches["signup-choice-ai"].value as? String, "0")
        XCTAssertEqual(app.switches["signup-choice-analytics"].value as? String, "0")
        XCTAssertEqual(app.switches["signup-choice-bugs"].value as? String, "0")
        XCTAssertFalse(app.buttons["signup-create"].isEnabled)
        capture(app, "First-time setup - private choices")
    }
    func testUnder13HasFamilyHandoffAndCannotPrepareAccount() {
        let app = launch("signup"); birthday(app, year: "2020"); country(app, code: "US", query: "United States")
        XCTAssertTrue(app.buttons["signup-family-handoff"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["signup-continue"].isEnabled)
        XCTAssertFalse(app.staticTexts["page-title-collection"].exists); XCTAssertFalse(app.staticTexts["page-title-home"].exists)
        capture(app, "First-time setup - family handoff")
    }
    func testIrishTeenRequiresGuardianEmailBeforeContinuing() {
        let app = launch("signup"); birthday(app, year: String(Calendar.current.component(.year, from: Date()) - 14)); country(app, code: "IE", query: "Ireland")
        let guardian = app.textFields["signup-guardian-email"]
        XCTAssertTrue(guardian.waitForExistence(timeout: 5)); XCTAssertFalse(app.buttons["signup-continue"].isEnabled)
        reveal(guardian, app); guardian.tap(); guardian.typeText("parent@example.invalid")
        waitEnabled(app.buttons["signup-continue"]); app.buttons["signup-continue"].tap()
        XCTAssertTrue(app.textFields["signup-name"].waitForExistence(timeout: 5)); XCTAssertFalse(app.staticTexts["page-title-collection"].exists); XCTAssertFalse(app.staticTexts["page-title-home"].exists)
    }
    func testBackupExportCancelDoesNotCreateProfileAndBackgroundClearsSecrets() {
        let app = launch("signup-resume")
        fillBackup(app)
        app.buttons["signup-create"].tap()
        let cancel = app.buttons["Cancel"].firstMatch
        XCTAssertTrue(app.buttons["Save"].waitForExistence(timeout: 15)); capture(app, "First-time setup - save encrypted backup")
        if cancel.exists { cancel.tap() }
        else { app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.08)).press(forDuration: 0.1, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.85))) }
        XCTAssertTrue(app.descendants(matching: .any)["signup-backup-ready"].firstMatch.waitForExistence(timeout: 10))
        XCTAssertFalse(app.staticTexts["page-title-collection"].exists); XCTAssertFalse(app.staticTexts["page-title-home"].exists)
        XCUIDevice.shared.press(.home); XCTAssertTrue(app.wait(for: .runningBackground, timeout: 5)); app.activate()
        let password = app.secureTextFields["signup-backup-password"]
        XCTAssertTrue(password.waitForExistence(timeout: 10)); reveal(password, app)
        XCTAssertEqual(password.value as? String, "Recovery file password (12+ characters)")
        XCTAssertFalse(app.buttons["signup-create"].isEnabled)
        XCTAssertFalse(app.staticTexts["page-title-collection"].exists); XCTAssertFalse(app.staticTexts["page-title-home"].exists)
        app.terminate(); app.launchArguments.removeAll { $0 == "--fixture-reset" }; app.launch()
        XCTAssertTrue(password.waitForExistence(timeout: 10)); XCTAssertFalse(app.buttons["signup-create"].isEnabled)
    }
    func testSystemFileSaveCompletesSetupOnlyAfterExportCallback() {
        let app = launch("signup-resume"); fillBackup(app); app.buttons["signup-create"].tap()
        let save = app.buttons["Save"]; XCTAssertTrue(save.waitForExistence(timeout: 15)); save.tap()
        let replace = app.buttons["Replace"]; if replace.waitForExistence(timeout: 2) { replace.tap() }
        XCTAssertTrue(app.staticTexts["page-title-home"].waitForExistence(timeout: 15))
        XCTAssertFalse(app.buttons["signup-create"].exists)
    }
    func testPreviouslyConfirmedBackupFinishesWithoutGeneratingAnotherIdentityOrFile() {
        let app = launch("signup-confirmed")
        let finish = app.buttons["signup-create"]; XCTAssertTrue(finish.waitForExistence(timeout: 10)); XCTAssertTrue(finish.isEnabled)
        XCTAssertFalse(app.secureTextFields["signup-backup-password"].exists)
        finish.tap(); XCTAssertTrue(app.staticTexts["page-title-home"].waitForExistence(timeout: 15))
    }
    func testGuardianEmailSendAndCheckNeverImplyApproval() {
        let app = launch("pending-approval")
        XCTAssertTrue(app.buttons["signup-check-approval"].waitForExistence(timeout: 10))
        capture(app, "First-time setup - waiting for parent")
        let send = app.buttons["signup-send-approval"]; reveal(send, app); send.tap()
        waitEnabled(app.buttons["signup-check-approval"]); app.buttons["signup-check-approval"].tap()
        waitEnabled(app.buttons["signup-check-approval"])
        XCTAssertFalse(app.staticTexts["page-title-collection"].exists); XCTAssertFalse(app.staticTexts["page-title-home"].exists)
        XCUIDevice.shared.press(.home); XCTAssertTrue(app.wait(for: .runningBackground, timeout: 5)); app.activate()
        XCTAssertTrue(app.buttons["signup-check-approval"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.staticTexts["page-title-collection"].exists); XCTAssertFalse(app.staticTexts["page-title-home"].exists)
    }
    func testServerConfirmedApprovalOpensHome() {
        let app = launch("pending-approval", extra: ["--fixture-approve-after-check"])
        XCTAssertTrue(app.buttons["signup-check-approval"].waitForExistence(timeout: 10)); app.buttons["signup-check-approval"].tap()
        XCTAssertTrue(app.staticTexts["page-title-home"].waitForExistence(timeout: 15))
    }
    func testArabicAccessibilityDarkNestedCountrySheetAndSignupLayout() {
        let app = launch("signup", language: "ar", extra: ["--large-type", "--preview-dark"])
        let country = app.buttons["signup-country"]
        XCTAssertTrue(country.waitForExistence(timeout: 10)); reveal(country, app); country.tap()
        let search = app.searchFields.firstMatch; XCTAssertTrue(search.waitForExistence(timeout: 5)); search.tap(); search.typeText("Ireland")
        let row = app.buttons["signup-country-IE"]; XCTAssertTrue(row.waitForExistence(timeout: 5))
        XCTAssertGreaterThan(row.frame.height, 70)
        capture(app, "Arabic large text dark - country sheet"); row.tap()
        let dismissed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: search)
        XCTAssertEqual(XCTWaiter.wait(for: [dismissed], timeout: 5), .completed)
        app.scrollViews["signup-form"].swipeDown(); app.scrollViews["signup-form"].swipeDown()
        capture(app, "Arabic large text dark - signup")
        XCTAssertFalse(app.buttons["signup-continue"].isEnabled)
    }
    private func launch(_ scenario: String, language: String = "en", extra: [String] = []) -> XCUIApplication {
        let app = XCUIApplication(); app.launchArguments = ["--account-fixture", scenario, UUID().uuidString, "--fixture-reset", "--locale", language] + extra; app.launch(); return app
    }
    private func birthday(_ app: XCUIApplication, year: String? = nil) {
        let button = app.buttons["signup-birth-date"]; XCTAssertTrue(button.waitForExistence(timeout: 10)); reveal(button, app); button.tap()
        let done = app.buttons["signup-birth-done"]; XCTAssertTrue(done.waitForExistence(timeout: 5))
        if let year { let wheel = app.pickerWheels.element(boundBy: 2); XCTAssertTrue(wheel.waitForExistence(timeout: 5)); wheel.adjust(toPickerWheelValue: year) }
        done.tap()
    }
    private func country(_ app: XCUIApplication, code: String, query: String) {
        let button = app.buttons["signup-country"]; reveal(button, app); button.tap()
        let search = app.searchFields.firstMatch; XCTAssertTrue(search.waitForExistence(timeout: 5)); search.tap(); search.typeText(query)
        let row = app.buttons["signup-country-\(code)"]; XCTAssertTrue(row.waitForExistence(timeout: 5)); row.tap()
    }
    private func fillBackup(_ app: XCUIApplication) {
        let terms = app.switches["signup-terms"]; XCTAssertTrue(terms.waitForExistence(timeout: 10))
        let password = app.secureTextFields["signup-backup-password"]; reveal(password, app); password.tap(); password.typeText("synthetic-test-password")
        let confirmation = app.secureTextFields["signup-backup-confirm"]; reveal(confirmation, app); confirmation.tap(); confirmation.typeText("synthetic-test-password\n")
        waitEnabled(app.buttons["signup-create"])
        capture(app, "First-time setup - recovery backup")
    }
    private func reveal(_ element: XCUIElement, _ app: XCUIApplication) {
        for _ in 0..<7 {
            if element.isHittable && element.frame.maxY < app.frame.maxY - 140 && element.frame.minY > 70 { return }
            app.scrollViews["signup-form"].swipeUp()
        }
        XCTAssertTrue(element.isHittable)
    }
    private func waitEnabled(_ element: XCUIElement) {
        let ready = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == true AND enabled == true"), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [ready], timeout: 10), .completed)
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot)
    }
}
