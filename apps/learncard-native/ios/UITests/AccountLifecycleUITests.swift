import XCTest

@MainActor final class AccountLifecycleUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testBackgroundAndResumeReopensCollectionRepeatedly() {
        let app = launch("ready")
        assertCollection(app)
        for _ in 0..<2 {
            XCUIDevice.shared.press(.home)
            XCTAssertTrue(app.wait(for: .runningBackground, timeout: 5))
            app.activate()
            assertCollection(app)
            XCTAssertFalse(app.buttons["recover-account"].exists)
        }
    }

    func testFailedEmailRecoveryClearsInputThenRetrySurvivesBackgroundAndRelaunch() {
        let app = launch("recovery")
        recover(app, key: "wrong-synthetic-key")
        XCTAssertTrue(app.descendants(matching: .any)["account-error"].waitForExistence(timeout: 15))
        XCTAssertTrue(app.secureTextFields["email-recovery-key"].exists)
        XCTAssertFalse(app.buttons["recover-account"].isEnabled)
        recover(app)
        assertCollection(app)
        XCUIDevice.shared.press(.home); XCTAssertTrue(app.wait(for: .runningBackground, timeout: 5))
        app.activate(); assertCollection(app)
        relaunch(app); assertCollection(app)
        XCTAssertFalse(app.buttons["recover-account"].exists)
    }

    func testBackgroundClearsUnsubmittedRecoveryInput() {
        let app = launch("recovery")
        let key = app.secureTextFields["email-recovery-key"]
        XCTAssertTrue(key.waitForExistence(timeout: 5)); key.tap(); key.typeText("synthetic-recovery-key")
        XCUIDevice.shared.press(.home); XCTAssertTrue(app.wait(for: .runningBackground, timeout: 5))
        app.activate()
        XCTAssertTrue(app.buttons["recover-account"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["recover-account"].isEnabled)
        XCTAssertFalse(app.staticTexts["page-title-collection"].exists)
    }

    func testSignOutAndRelaunchRequireSignInButKeepRememberedRecovery() {
        let app = launch("ready"); assertCollection(app)
        app.buttons["Account"].tap()
        let signOut = app.buttons["account-sign-out"]
        XCTAssertTrue(signOut.waitForExistence(timeout: 5)); app.swipeUp(); signOut.tap()
        assertSignIn(app)
        relaunch(app); assertSignIn(app)
        signIn(app); assertCollection(app)
        XCTAssertFalse(app.buttons["recover-account"].exists)
    }

    func testForgetDeviceRequiresRecoveryAfterSignInAndCancelPreservesSession() {
        let app = launch("ready"); assertCollection(app)
        app.buttons["Account"].tap()
        let forget = app.buttons["account-forget-device"]
        XCTAssertTrue(forget.waitForExistence(timeout: 5)); app.swipeUp(); forget.tap()
        let dialog = app.sheets.firstMatch
        XCTAssertTrue(dialog.waitForExistence(timeout: 5))
        let cancel = app.buttons["Cancel"]
        if cancel.exists { cancel.tap() }
        else {
            // iOS 26's compact confirmation popover cancels through its outside region.
            let outside = app.otherElements["PopoverDismissRegion"]
            XCTAssertTrue(outside.waitForExistence(timeout: 5)); outside.tap()
        }
        let dismissed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: dialog)
        XCTAssertEqual(XCTWaiter.wait(for: [dismissed], timeout: 5), .completed)
        XCTAssertTrue(app.buttons["account-sign-out"].exists)
        forget.tap()
        XCTAssertTrue(dialog.waitForExistence(timeout: 5)); dialog.buttons["Sign Out & Forget Device"].tap()
        assertSignIn(app); relaunch(app); assertSignIn(app)
        signIn(app)
        XCTAssertTrue(app.buttons["recover-account"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.staticTexts["page-title-collection"].exists)
        recover(app); assertCollection(app)
    }

    private func launch(_ scenario: String) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["--account-fixture", scenario, UUID().uuidString, "--fixture-reset", "--locale", "en"]
        app.launch(); return app
    }
    private func relaunch(_ app: XCUIApplication) {
        app.terminate(); app.launchArguments.removeAll { $0 == "--fixture-reset" }; app.launch()
    }
    private func assertCollection(_ app: XCUIApplication, file: StaticString = #filePath, line: UInt = #line) {
        app.openCollection(file: file, line: line)
        XCTAssertTrue(app.staticTexts["page-title-collection"].waitForExistence(timeout: 15), file: file, line: line)
        XCTAssertTrue(app.buttons["credential-design"].waitForExistence(timeout: 10), file: file, line: line)
        XCTAssertFalse(app.buttons["send-sign-in-code"].exists, file: file, line: line)
    }
    private func assertSignIn(_ app: XCUIApplication) {
        XCTAssertTrue(app.buttons["send-sign-in-code"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.staticTexts["page-title-collection"].exists)
        XCTAssertFalse(app.staticTexts["page-title-home"].exists)
        XCTAssertFalse(app.buttons["credential-design"].exists)
    }
    private func signIn(_ app: XCUIApplication) {
        app.buttons["send-sign-in-code"].tap()
        let code = app.textFields["sign-in-code"]
        XCTAssertTrue(code.waitForExistence(timeout: 5)); code.tap(); code.typeText("123456")
        app.buttons["verify-sign-in-code"].tap()
    }
    private func recover(_ app: XCUIApplication, key: String = "synthetic-recovery-key") {
        let input = app.secureTextFields["email-recovery-key"]
        XCTAssertTrue(input.waitForExistence(timeout: 10)); input.tap(); input.typeText(key)
        let button = app.buttons["recover-account"]
        let enabled = XCTNSPredicateExpectation(predicate: NSPredicate(format: "enabled == true"), object: button)
        XCTAssertEqual(XCTWaiter.wait(for: [enabled], timeout: 10), .completed)
        button.tap()
    }
}
