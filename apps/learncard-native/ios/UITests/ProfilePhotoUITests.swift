import XCTest

@MainActor final class ProfilePhotoUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testPhotoDraftCancelRetrySavePreserveRemoveAndResume() {
        let app = launch(extra: ["--profile-save-failure"])
        openEditor(app)
        chooseFixturePhoto(app)
        app.navigationBars.buttons.element(boundBy: 0).tap()
        app.buttons["account-edit-profile"].tap()
        assertPhoto(app, "Default avatar") // Leaving before Save publishes nothing.
        chooseFixturePhoto(app)
        save(app)
        XCTAssertTrue(app.descendants(matching: .any)["profile-error"].waitForExistence(timeout: 10))
        assertPhoto(app, "New photo, not saved")
        save(app)
        XCTAssertTrue(app.buttons["account-edit-profile"].waitForExistence(timeout: 10))
        app.buttons["account-edit-profile"].tap(); assertPhoto(app, "Current photo")
        save(app) // Name/bio-only save must preserve the image.
        app.buttons["account-edit-profile"].tap(); assertPhoto(app, "Current photo")
        app.buttons["profile-photo-remove"].tap(); assertPhoto(app, "Default avatar")
        save(app)
        XCTAssertTrue(app.buttons["account-edit-profile"].waitForExistence(timeout: 10))
        XCUIDevice.shared.press(.home); XCTAssertTrue(app.wait(for: .runningBackground, timeout: 5))
        app.activate(); openEditor(app); assertPhoto(app, "Default avatar")
    }

    func testSystemPhotoPickerCancelKeepsNameAndPhotoDraft() {
        let app = launch(); openEditor(app)
        let name = app.textFields["profile-name"]
        name.tap(); name.typeText(" draft")
        app.buttons["profile-photo-choose"].tap()
        let cancel = app.buttons["Cancel"].firstMatch
        XCTAssertTrue(cancel.waitForExistence(timeout: 10)); cancel.tap()
        XCTAssertTrue(name.waitForExistence(timeout: 5)); XCTAssertTrue((name.value as? String)?.contains("draft") == true)
        assertPhoto(app, "Default avatar")
        XCTAssertFalse(app.descendants(matching: .any)["profile-error"].exists)
    }

    func testArabicAccessibilityPhotoEditorShowsFullActions() {
        let app = launch(extra: ["--locale", "ar", "--large-type"]); openEditor(app)
        let choose = app.buttons["profile-photo-choose"]
        XCTAssertTrue(choose.waitForExistence(timeout: 5)); XCTAssertEqual(choose.label, "اختيار صورة")
        XCTAssertGreaterThanOrEqual(choose.frame.height, 44)
        XCTAssertLessThan(choose.frame.maxX, app.frame.maxX + 1)
        chooseFixturePhoto(app, status: "صورة جديدة، لم تُحفظ")
        let remove = app.buttons["profile-photo-remove"]
        XCTAssertTrue(remove.exists); XCTAssertGreaterThanOrEqual(remove.frame.height, 44)
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Arabic accessibility profile photo"; shot.lifetime = .keepAlways; add(shot)
    }

    private func launch(extra: [String] = []) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["--account-fixture", "ready", UUID().uuidString, "--fixture-reset", "--profile-photo-fixture"] + (extra.contains("--locale") ? [] : ["--locale", "en"]) + extra
        app.launch(); return app
    }
    private func openEditor(_ app: XCUIApplication) {
        XCTAssertTrue(app.staticTexts["page-title-collection"].waitForExistence(timeout: 15))
        app.buttons["account"].tap()
        let edit = app.buttons["account-edit-profile"]
        XCTAssertTrue(edit.waitForExistence(timeout: 5)); edit.tap()
        XCTAssertTrue(app.buttons["profile-photo-choose"].waitForExistence(timeout: 5))
    }
    private func chooseFixturePhoto(_ app: XCUIApplication, status: String = "New photo, not saved") {
        let choose = app.buttons["profile-photo-test-select"]
        if !choose.isHittable { app.swipeUp() }
        choose.tap(); assertPhoto(app, status)
    }
    private func assertPhoto(_ app: XCUIApplication, _ value: String) {
        let photo = app.descendants(matching: .any)["profile-photo-preview"].firstMatch
        XCTAssertTrue(photo.waitForExistence(timeout: 5))
        let ready = XCTNSPredicateExpectation(predicate: NSPredicate(format: "value == %@", value), object: photo)
        XCTAssertEqual(XCTWaiter.wait(for: [ready], timeout: 5), .completed)
    }
    private func save(_ app: XCUIApplication) {
        let button = app.buttons["profile-save"]
        if !button.isHittable { app.swipeUp() }
        XCTAssertTrue(button.waitForExistence(timeout: 5)); button.tap()
    }
}
