import XCTest

@MainActor final class FamiliesUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private func launch(locale: String = "en", dark: Bool = false) -> XCUIApplication {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--locale", locale]
        if dark { app.launchArguments.append("--preview-dark") }
        app.launch(); XCTAssertTrue(app.buttons["nav-home"].waitForExistence(timeout: 10)); app.buttons["nav-home"].tap()
        let families = app.buttons["home-families"]; if !families.isHittable { app.swipeUp() }
        XCTAssertTrue(families.waitForExistence(timeout: 5)); families.tap(); return app
    }
    func testNativeRosterAndEditingDoNotOfferChildAccountSwitching() {
        let app = launch(); app.buttons["family-sample-family"].tap()
        let child = app.buttons["family-member-emma-manager"]
        if !child.isHittable { app.swipeUp() }; XCTAssertTrue(child.waitForExistence(timeout: 5)); child.tap()
        XCTAssertTrue(app.staticTexts["Emma"].waitForExistence(timeout: 5)); XCTAssertFalse(app.buttons["Switch account"].exists)
        app.navigationBars.buttons.element(boundBy: 0).tap()
        let edit = app.buttons["family-edit"]; if !edit.isHittable { app.swipeUp() }; edit.tap()
        let name = app.textFields["family-name"]; XCTAssertTrue(name.waitForExistence(timeout: 5)); name.tap()
        name.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: "The Chen family".count)); name.typeText("Our adventures")
        app.buttons["family-color-lilac"].tap(); app.buttons["family-save"].tap()
        XCTAssertTrue(app.staticTexts["Our adventures"].waitForExistence(timeout: 5))
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Native family roster after editing"; shot.lifetime = .keepAlways; add(shot)
    }
    func testCreateRequiresPINAndAddsFamilyWithoutSendingLiveMessages() {
        let app = launch(); app.buttons["family-create"].tap()
        let name = app.textFields["family-name"]; XCTAssertTrue(name.waitForExistence(timeout: 5)); name.tap(); name.typeText("Our learning circle")
        XCTAssertFalse(app.buttons["family-save"].isEnabled)
        let pin = app.secureTextFields["family-pin"]; if !pin.isHittable { app.swipeUp() }; pin.tap(); pin.typeText("12345")
        app.buttons["family-save"].tap()
        XCTAssertTrue(app.staticTexts["Our learning circle"].waitForExistence(timeout: 5), app.debugDescription)
    }
    func testGuardianInvitationShowsAccessReviewAndDoesNotImmediatelyAddGuardian() {
        let app = launch(); app.buttons["family-sample-family"].tap()
        let invite = app.buttons["family-invite"]; if !invite.isHittable { app.swipeUp() }; invite.tap()
        let search = app.textFields["family-recipient-search"]; XCTAssertTrue(search.waitForExistence(timeout: 5)); search.tap(); search.typeText("Alex")
        let recipient = app.buttons["family-recipient-Alex Morgan"]; XCTAssertTrue(recipient.waitForExistence(timeout: 5)); recipient.tap()
        XCTAssertTrue(app.staticTexts["After accepting, they can manage this family, its members and its children’s profiles."].exists)
        let pin = app.secureTextFields["family-invite-pin"]; if !pin.isHittable { app.swipeUp() }; pin.tap(); pin.typeText("00000")
        app.buttons["family-invite-send"].tap(); XCTAssertTrue(app.staticTexts["family-invite-error"].waitForExistence(timeout: 5))
        XCTAssertEqual(pin.value as? String, "Five-digit PIN")
        pin.tap(); pin.typeText("12345"); app.buttons["family-invite-send"].tap()
        XCTAssertTrue(app.staticTexts["Invitation sent. They become a guardian after accepting."].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["family-member-Alex Morgan"].exists)
    }
    func testFrenchArabicAndDarkFamilyScreens() {
        for (locale, title) in [("fr", "Familles"), ("ar", "العائلات"), ("en", "Families")] {
            let app = launch(locale: locale, dark: locale == "en")
            XCTAssertEqual(app.staticTexts["page-title-families"].label, title)
            app.buttons["family-sample-family"].tap(); XCTAssertTrue(app.buttons["family-member-avery"].waitForExistence(timeout: 5))
            let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Families \(locale) \(locale == "en" ? "dark" : "light")"; shot.lifetime = .keepAlways; add(shot)
            app.terminate()
        }
    }
    func testAccountBackgroundClearsFamilyEditorAndReturnsToCollection() {
        let app = XCUIApplication(); app.launchArguments = ["--account-fixture", "ready", UUID().uuidString, "--fixture-reset", "--locale", "en"]
        app.launch(); XCTAssertTrue(app.buttons["Account"].waitForExistence(timeout: 10)); app.buttons["Account"].tap(); app.buttons["account-families"].tap()
        XCTAssertTrue(app.buttons["family-create"].waitForExistence(timeout: 5)); app.buttons["family-create"].tap()
        let pin = app.secureTextFields["family-pin"]; if !pin.isHittable { app.swipeUp() }; XCTAssertTrue(pin.waitForExistence(timeout: 5)); pin.tap(); pin.typeText("123")
        XCUIDevice.shared.press(.home); XCTAssertTrue(app.wait(for: .runningBackground, timeout: 5)); app.activate()
        XCTAssertTrue(app.staticTexts["page-title-collection"].waitForExistence(timeout: 10)); XCTAssertFalse(app.secureTextFields["family-pin"].exists)
    }
}
