import XCTest

@MainActor final class PeopleBuildUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private func launch(_ args: [String] = ["--locale", "en"]) -> XCUIApplication {
        let app = XCUIApplication(); app.launchArguments = ["--demo"] + args; app.launch(); XCTAssertTrue(app.buttons["nav-home"].waitForExistence(timeout: 10)); return app
    }
    private func reveal(_ element: XCUIElement, _ app: XCUIApplication) {
        for _ in 0..<10 {
            if element.exists && element.isHittable && element.frame.maxY < app.buttons["nav-home"].frame.minY && element.frame.minY > 105 { return }
            if element.exists && element.frame.minY < 105 { app.swipeDown() } else { app.swipeUp() }
        }
        XCTAssertTrue(element.isHittable, app.debugDescription)
    }
    private func capture(_ app: XCUIApplication, _ name: String) { let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot) }
    private func confirm(_ label: String, excluding identifier: String, _ app: XCUIApplication) {
        let action = app.buttons.matching(NSPredicate(format: "label == %@ AND identifier != %@", label, identifier)).firstMatch
        XCTAssertTrue(action.waitForExistence(timeout: 5)); action.tap()
    }
    private func back(_ app: XCUIApplication) { app.navigationBars.buttons.element(boundBy: 0).tap() }
    func testHomeSharingAndPeoplePrecedeCreatorToolsAndScanIsAnIllustratedAction() {
        let app = launch(), sharing = app.buttons["home-data-sharing"]
        XCTAssertGreaterThan(sharing.frame.minY, app.buttons["home-people"].frame.minY)
        XCTAssertLessThan(sharing.frame.minY, app.buttons["home-apps"].frame.minY)
        XCTAssertTrue(app.buttons["home-create"].exists, "Secondary creation stays discoverable without a disclosure")
        reveal(sharing, app); capture(app, "Home primary actions include Data Sharing"); sharing.tap(); XCTAssertTrue(app.staticTexts["page-title-sharing"].waitForExistence(timeout: 5)); back(app)
        let scan = app.buttons["receive"]; reveal(scan, app); XCTAssertGreaterThanOrEqual(scan.frame.height, 68); XCTAssertTrue(scan.label.contains("camera")); capture(app, "Home illustrated Scan action"); scan.tap()
        XCTAssertTrue(app.descendants(matching: .any)["claim-camera"].firstMatch.waitForExistence(timeout: 5))
    }
    func testPeopleRequestsAcceptUpdatesConnectionsAndInbox() {
        let app = launch(), people = app.buttons["home-people"]; reveal(people, app); people.tap()
        XCTAssertTrue(app.buttons["person-jordan"].waitForExistence(timeout: 5)); capture(app, "Native People connections")
        app.buttons["people-scope-requests"].tap(); XCTAssertTrue(app.buttons["person-alex"].waitForExistence(timeout: 5)); app.buttons["person-alex"].tap()
        XCTAssertTrue(app.buttons["person-action-accept"].waitForExistence(timeout: 5)); capture(app, "Connection request profile"); app.buttons["person-action-accept"].tap()
        XCTAssertTrue(app.buttons["person-action-disconnect"].waitForExistence(timeout: 5)); XCTAssertEqual(app.staticTexts["person-status"].label, "Connected"); back(app)
        app.buttons["people-scope-connections"].tap(); XCTAssertTrue(app.buttons["person-alex"].waitForExistence(timeout: 5))
        app.buttons["nav-inbox"].tap(); let row = app.buttons["inbox-accept-sample-request"]; XCTAssertFalse(row.exists)
        app.buttons["inbox-people"].tap(); XCTAssertTrue(app.staticTexts["page-title-people"].waitForExistence(timeout: 5)); XCTAssertTrue(app.buttons["people-scope-requests"].isSelected)
    }
    func testConnectedPersonOffersNewAndExistingCredentialsWithRecipientCarriedForward() {
        let app = launch(), people = app.buttons["home-people"]; reveal(people, app); people.tap()
        let jordan = app.buttons["person-jordan"]; XCTAssertTrue(jordan.waitForExistence(timeout: 5)); jordan.tap()
        let send = app.buttons["person-send"]; reveal(send, app); capture(app, "Connected profile with Send a credential"); send.tap()
        let recipient = app.descendants(matching: .any)["creations-recipient"].firstMatch
        XCTAssertTrue(recipient.waitForExistence(timeout: 5)); XCTAssertTrue(recipient.label.contains("Jordan Lee"))
        capture(app, "New or existing credential for the selected connection")
        XCTAssertFalse(app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'creation-'")).firstMatch.exists)
        let create = app.buttons["creations-create"]; reveal(create, app); create.tap()
        let title = app.textFields["draft-title"]; XCTAssertTrue(title.waitForExistence(timeout: 5)); title.tap(); title.typeText("A thoughtful collaborator")
        let summary = app.descendants(matching: .any)["draft-summary"].firstMatch; summary.tap(); summary.typeText("For helping the group learn together.")
        app.toolbars.buttons["Done"].tap(); app.buttons["create-next"].tap()
        XCTAssertTrue(app.buttons["recipient-other"].waitForExistence(timeout: 5)); XCTAssertTrue(app.buttons["recipient-other"].isSelected)
        XCTAssertTrue(app.staticTexts["@jordan"].exists)
        app.buttons["create-next"].tap()
        XCTAssertTrue(app.staticTexts["draft-delivery"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["draft-delivery"].label.contains("Jordan Lee"))
        capture(app, "Explicit review retains the selected connection")
        app.navigationBars.buttons["Cancel"].tap()
        XCTAssertTrue(recipient.waitForExistence(timeout: 5))
        XCTAssertFalse(app.staticTexts["A thoughtful collaborator"].exists, "Review and cancellation must not publish a draft")
        create.tap()
        XCTAssertTrue(title.waitForExistence(timeout: 5)); title.tap(); title.typeText("A thoughtful collaborator")
        summary.tap(); summary.typeText("For helping the group learn together.")
        app.toolbars.buttons["Done"].tap(); app.buttons["create-next"].tap(); app.buttons["create-next"].tap(); app.buttons["create-confirm"].tap()
        let done = app.alerts["Done"]
        XCTAssertTrue(done.waitForExistence(timeout: 5)); done.buttons["Done"].tap()
        XCTAssertTrue(send.waitForExistence(timeout: 5)); send.tap()
        let existing = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'creation-'")).firstMatch
        reveal(existing, app); existing.tap()
        XCTAssertTrue(app.buttons["send-confirm"].waitForExistence(timeout: 5))
        let picker = app.descendants(matching: .any)["send-recipient-picker"].firstMatch
        XCTAssertTrue(picker.label.contains("Jordan Lee") || (picker.value as? String) == "Jordan Lee")
        capture(app, "Existing credential retains the selected connection")
        app.navigationBars.buttons["Cancel"].tap()
        XCTAssertTrue(recipient.waitForExistence(timeout: 5))
    }
    func testAddShowsCreateAndSendDirectlyAtStandardAndArabicAccessibilitySizes() {
        var normalCreateHeight: CGFloat = 0
        for args in [["--locale", "en", "--standard-type"], ["--locale", "ar", "--large-type", "--preview-dark"]] {
            let app = launch(args); app.openCredentialTools()
            XCTAssertFalse(app.buttons["learner-more-tools"].exists)
            let send = app.buttons["collection-action-send"]
            for _ in 0..<4 { if send.isHittable { break }; app.swipeUp() }
            XCTAssertTrue(send.isHittable); capture(app, "Direct create and send in Add \(args.contains("ar") ? "Arabic accessibility" : "English standard")")
            send.tap(); XCTAssertTrue(app.buttons["creations-create"].waitForExistence(timeout: 5))
            XCTAssertGreaterThanOrEqual(app.buttons["creations-create"].frame.height, 44)
            if args.contains("ar") {
                XCTAssertGreaterThan(app.buttons["creations-create"].frame.height, normalCreateHeight,
                                     "The nested picker must honor the accessibility preview size")
            } else { normalCreateHeight = app.buttons["creations-create"].frame.height }
            app.terminate()
        }
    }
    func testAccountPeopleFindAndSentRequestCancellation() {
        let app = launch(); app.buttons["account"].tap(); app.buttons["account-people"].tap()
        XCTAssertTrue(app.staticTexts["page-title-people"].waitForExistence(timeout: 5)); app.buttons["people-scope-find"].tap()
        let search = app.textFields["people-search"]; search.tap(); search.typeText("robin\n")
        let robin = app.buttons["person-robin"]; XCTAssertTrue(robin.waitForExistence(timeout: 5)); reveal(robin, app); robin.tap()
        app.buttons["person-action-connect"].tap(); XCTAssertTrue(app.buttons["person-action-cancel"].waitForExistence(timeout: 5)); XCTAssertEqual(app.staticTexts["person-status"].label, "Request sent")
        app.buttons["person-action-cancel"].tap(); confirm("Cancel request", excluding: "person-action-cancel", app)
        XCTAssertTrue(app.buttons["person-action-connect"].waitForExistence(timeout: 5)); capture(app, "Profile after explicit request cancellation")
        let block = app.buttons["person-action-block"]; reveal(block, app); block.tap(); confirm("Block person", excluding: "person-action-block", app)
        let unblock = app.buttons["person-action-unblock"]; XCTAssertTrue(unblock.waitForExistence(timeout: 5)); unblock.tap(); confirm("Unblock person", excluding: "person-action-unblock", app)
        XCTAssertTrue(app.buttons["person-action-connect"].waitForExistence(timeout: 5))
    }
    func testBuildMyLearnCardOffersWorkingClaimRoutesWithoutAutomaticAdding() {
        let app = launch(), build = app.buttons["home-build"]; reveal(build, app); build.tap()
        XCTAssertTrue(app.buttons["build-scan"].waitForExistence(timeout: 5)); capture(app, "Native Build My LearnCard intake")
        app.buttons["build-link"].tap(); let link = app.textFields["claim-link"]; XCTAssertTrue(link.waitForExistence(timeout: 5)); XCTAssertFalse(app.descendants(matching: .any)["claim-camera"].firstMatch.exists)
        link.tap(); link.typeText("learncard-native-demo://claim/first-aid\n")
        let review = app.buttons["review-link"]; if !review.isHittable { app.swipeUp() }; review.tap()
        XCTAssertTrue(app.buttons["claim"].waitForExistence(timeout: 5)); capture(app, "Build claim link reaches explicit review")
        app.navigationBars.buttons["Cancel"].tap(); XCTAssertTrue(app.buttons["build-scan"].waitForExistence(timeout: 5))
        app.buttons["build-scan"].tap(); XCTAssertTrue(app.descendants(matching: .any)["claim-camera"].firstMatch.waitForExistence(timeout: 5))
        app.navigationBars.buttons["Cancel"].tap(); app.buttons["build-photo"].tap()
        let cancel = app.buttons["Cancel"].firstMatch; XCTAssertTrue(cancel.waitForExistence(timeout: 10)); capture(app, "Build QR photo uses the system picker")
        cancel.tap(); XCTAssertTrue(app.buttons["claim-photo"].waitForExistence(timeout: 5)); XCTAssertFalse(app.descendants(matching: .any)["claim-camera"].firstMatch.exists)
    }
    func testPeopleArabicLargeTextAndBuildNavigationRemainNative() {
        let app = launch(["--locale", "ar", "--large-type", "--preview-dark"]), people = app.buttons["home-people"]; reveal(people, app); people.tap()
        XCTAssertTrue(app.buttons["person-jordan"].waitForExistence(timeout: 5)); reveal(app.buttons["person-jordan"], app); capture(app, "People Arabic accessibility dark")
        XCTAssertGreaterThanOrEqual(app.buttons["person-jordan"].frame.height, 94); XCTAssertFalse(app.webViews.firstMatch.exists)
        back(app); let build = app.buttons["home-build"]; reveal(build, app); build.tap(); XCTAssertTrue(app.buttons["build-scan"].waitForExistence(timeout: 5)); capture(app, "Build My LearnCard Arabic accessibility dark")
        XCTAssertFalse(app.webViews.firstMatch.exists)
    }
}
