import XCTest

@MainActor final class CredentialDetailUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private func open(_ flags: [String] = []) -> XCUIApplication {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--credential-detail-fixtures", "--standard-type"] + flags
        if !flags.contains("--locale") { app.launchArguments += ["--locale", "en"] }
        app.launch(); app.openCollection(); app.buttons["credential-detail-rich"].tap(); return app
    }
    private func capture(_ app: XCUIApplication, _ title: String) {
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = title; shot.lifetime = .keepAlways; add(shot)
    }
    private func reveal(_ element: XCUIElement, app: XCUIApplication) {
        func clearOfChrome() -> Bool {
            guard element.isHittable else { return false }
            let scroll = app.scrollViews.firstMatch
            let top = max(scroll.frame.minY, app.navigationBars.firstMatch.frame.maxY)
            let share = app.buttons["share"]
            let bottom = share.exists && share.isHittable ? share.frame.minY : scroll.frame.maxY
            return element.frame.minY >= top + 4 && element.frame.maxY <= bottom - 4
        }
        for _ in 0..<14 where !clearOfChrome() {
            let scroll = app.scrollViews.firstMatch
            let x = app.launchArguments.contains("ar") ? 0.98 : 0.02
            let above = element.exists && element.frame.minY < app.navigationBars.firstMatch.frame.maxY + 4
            scroll.coordinate(withNormalizedOffset: CGVector(dx: x, dy: above ? 0.25 : 0.75))
                .press(forDuration: 0.05, thenDragTo: scroll.coordinate(withNormalizedOffset: CGVector(dx: x, dy: above ? 0.75 : 0.25)))
        }
        XCTAssertTrue(clearOfChrome(), app.debugDescription)
    }

    func testOptionalDetailsExpandWithoutDisplacingPrimaryShareAndExportIsSecondary() {
        let app = open()
        XCTAssertTrue(app.buttons["credential-verification"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.buttons["credential-verification"].label, "Signature verified")
        XCTAssertTrue(app.buttons["share"].isHittable)
        XCTAssertLessThanOrEqual(app.buttons["share"].frame.maxY, app.otherElements["bottom-navigation"].frame.minY)
        capture(app, "Credential detail hierarchy and scoped signature fixture")
        let criteria = app.buttons["credential-criteria-0-expand"]; reveal(criteria, app: app); criteria.tap()
        XCTAssertEqual(criteria.label, "Show less")
        XCTAssertGreaterThanOrEqual(criteria.frame.height, 44)
        capture(app, "Expanded credential criteria fixture with pinned Share")
        let all = app.buttons["credential-alignments-all"]; reveal(all, app: app)
        XCTAssertGreaterThanOrEqual(all.frame.height, 44)
        XCTAssertFalse(app.staticTexts["Digital confidence"].exists)
        all.tap(); XCTAssertTrue(app.staticTexts["Digital confidence"].exists)
        capture(app, "Credential alignment references fixture")
        XCTAssertTrue(app.buttons["share"].isHittable)
        XCTAssertFalse(app.buttons["credential-export"].exists)
        let more = app.buttons["credential-more-options"]; reveal(more, app: app); more.tap()
        XCTAssertTrue(app.buttons["credential-export"].waitForExistence(timeout: 5), app.debugDescription)
        reveal(app.buttons["credential-export"], app: app)
        capture(app, "Secondary signed JSON export fixture")
    }

    func testSingleShareNeedsAnActionRetriesPendingAndReusesTheReadyQR() {
        let app = open(); app.buttons["share"].tap()
        XCTAssertTrue(app.buttons["credential-share-create"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.images["credential-share-qr"].exists)
        XCTAssertFalse(app.staticTexts["credential-share-error"].exists)
        app.buttons["credential-share-create"].tap()
        XCTAssertTrue(app.staticTexts["credential-share-error"].waitForExistence(timeout: 5))
        app.buttons["credential-share-create"].tap()
        XCTAssertTrue(app.staticTexts["credential-share-pending"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.images["credential-share-qr"].exists)
        app.buttons["credential-share-create"].tap()
        XCTAssertTrue(app.images["credential-share-qr"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["credential-share-system"].exists)
        capture(app, "Single credential presentation QR fixture")
        let copy = app.buttons["credential-share-copy"]; reveal(copy, app: app); copy.tap()
        XCTAssertTrue(copy.label.contains("Link copied"))
        capture(app, "Copied single credential presentation link fixture")
        app.buttons["credential-share-close"].tap(); app.buttons["share"].tap()
        XCTAssertTrue(app.images["credential-share-qr"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["credential-share-create"].exists)
    }

    func testUnavailableAndUnverifiedSignaturesDoNotBecomeTrustedOrRevoked() {
        let app = open(); app.navigationBars.buttons.firstMatch.tap()
        app.buttons["credential-detail-not-verified"].tap()
        XCTAssertEqual(app.buttons["credential-verification"].label, "Signature not verified")
        XCTAssertFalse(app.staticTexts["Revoked"].exists); XCTAssertFalse(app.staticTexts["Suspended"].exists)
        app.navigationBars.buttons.firstMatch.tap(); app.buttons["credential-detail-unavailable"].tap()
        XCTAssertEqual(app.buttons["credential-verification"].label, "Verification unavailable")
        XCTAssertFalse(app.buttons["share"].exists)
        XCTAssertFalse(app.otherElements["credential-criteria"].exists)
    }

    func testArabicAccessibilityDetailKeepsActionsAndExpandableContentUsable() {
        let app = open(["--locale", "ar", "--large-type", "--preview-dark"])
        XCTAssertTrue(app.buttons["share"].isHittable)
        let criteria = app.buttons["credential-criteria-0-expand"]; reveal(criteria, app: app); criteria.tap()
        capture(app, "Arabic dark accessibility credential criteria fixture")
        XCTAssertEqual(criteria.label, "عرض أقل", app.debugDescription)
        XCTAssertGreaterThanOrEqual(criteria.frame.minX, 0); XCTAssertLessThanOrEqual(criteria.frame.maxX, app.frame.maxX)
        XCTAssertTrue(app.buttons["share"].isHittable)
    }
}
