import XCTest
import JavaScriptCore

final class ExperimentUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    @MainActor
    func testCollectionTitleAndScrollingBrand() {
        let app = XCUIApplication()
        app.launchArguments = ["--demo", "--locale", "en"]
        app.launch()
        XCTAssertTrue(app.staticTexts["page-title-collection"].waitForExistence(timeout: 10), app.debugDescription)
        XCTAssertTrue(app.staticTexts["page-title-collection"].isHittable)
        XCTAssertTrue(app.descendants(matching: .any)["learncard-brand-full"].exists)
        app.swipeUp()
        XCTAssertTrue(app.navigationBars.staticTexts["Collection"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.descendants(matching: .any)["learncard-brand-compact"].waitForExistence(timeout: 5), app.debugDescription)
        app.swipeDown()
        XCTAssertTrue(app.staticTexts["page-title-collection"].isHittable)
        XCTAssertTrue(app.descendants(matching: .any)["learncard-brand-full"].waitForExistence(timeout: 5), app.debugDescription)
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Native collection with flat background and left branding"
        screenshot.lifetime = .keepAlways
        add(screenshot)
    }

    @MainActor
    func testMainDestinationsHaveVisibleTitles() {
        let app = XCUIApplication()
        app.launchArguments = ["--demo", "--locale", "en"]
        app.launch()
        for title in ["Inbox", "Apps", "Home", "Collection"] {
            app.buttons["nav-\(title.lowercased())"].tap()
            let heading = app.staticTexts["page-title-\(title.lowercased())"]
            XCTAssertTrue(heading.waitForExistence(timeout: 5), app.debugDescription)
            XCTAssertTrue(heading.isHittable, app.debugDescription)
        }
    }

    @MainActor
    func testClaimMovesSampleIntoCollection() throws {
        let app = XCUIApplication()
        app.launchArguments = ["--demo", "--locale", "en"]
        app.launch()
        app.buttons["nav-inbox"].tap()
        let offer = app.buttons["offer-first-aid"]
        XCTAssertTrue(offer.waitForExistence(timeout: 10))
        offer.tap()
        app.buttons["claim"].tap()
        XCTAssertTrue(app.alerts["Done"].waitForExistence(timeout: 5))
        app.alerts["Done"].buttons["Done"].tap()
        XCTAssertFalse(app.buttons["offer-first-aid"].exists)
        app.buttons["nav-collection"].tap()
        XCTAssertTrue(app.buttons["credential-first-aid"].waitForExistence(timeout: 5))
        app.buttons["nav-home"].tap()
        XCTAssertTrue(app.staticTexts["Added to your collection"].exists)
    }

    @MainActor
    func testCreateAndRecordSend() throws {
        let app = XCUIApplication()
        app.launchArguments = ["--demo", "--locale", "en"]
        app.launch()
        app.buttons["create"].tap(); app.buttons["Create new"].tap()
        let title = app.textFields["draft-title"]
        XCTAssertTrue(title.waitForExistence(timeout: 5))
        title.tap()
        title.typeText("A thoughtful teammate")
        let summary = app.descendants(matching: .any)["draft-summary"]
        summary.tap()
        summary.typeText("Thank you for helping the team learn.")
        app.swipeUp()
        app.buttons["create-next"].tap()
        app.buttons["create-next"].tap()
        app.buttons["create-confirm"].tap()
        XCTAssertTrue(app.alerts["Done"].waitForExistence(timeout: 5))
        app.alerts["Done"].buttons["Done"].tap()
        app.staticTexts["A thoughtful teammate"].tap()
        app.swipeUp()
        app.buttons["send"].tap()
        app.buttons["send-confirm"].tap()
        XCTAssertTrue(app.alerts["Done"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.alerts["Done"].staticTexts["Sample send recorded. No message was delivered."].exists)
        app.alerts["Done"].buttons["Done"].tap()
        app.buttons["nav-home"].tap()
        XCTAssertTrue(app.staticTexts["Sample send recorded"].exists)
    }

    @MainActor
    func testTrayAndAccountSettings() {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--locale", "en"]; app.launch()
        XCTAssertTrue(app.buttons["nav-apps"].waitForExistence(timeout: 5))
        app.buttons["Account"].tap()
        XCTAssertTrue(app.buttons["account-edit-profile"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["account-security"].exists)
        app.buttons["account-security"].tap()
        XCTAssertTrue(app.navigationBars["Recovery & security"].waitForExistence(timeout: 5))
    }

    @MainActor
    func testPlusActionsAndMultipleCredentialSharing() {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--locale", "en"]; app.launch()
        app.buttons["create"].tap()
        XCTAssertTrue(app.buttons["Create new"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["Send existing creation"].exists)
        app.buttons["Share credentials"].tap()
        XCTAssertTrue(app.buttons["share-select-design"].waitForExistence(timeout: 5))
        app.buttons["share-select-design"].tap(); app.buttons["share-select-community"].tap()
        app.buttons["share-review"].tap()
        app.buttons["share-confirm"].tap()
        XCTAssertTrue(app.buttons["share-bundle"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Sample selection ready"].exists)
        app.buttons["share-bundle"].tap()
        let copy = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "Copy")).firstMatch
        XCTAssertTrue(copy.waitForExistence(timeout: 5), app.debugDescription)
    }

    @MainActor
    func testCreationFormatAndCategoryUseActionSheets() {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--locale", "en"]; app.launch()
        app.buttons["create"].tap(); app.buttons["Create new"].tap(); app.swipeUp()
        app.buttons["draft-format"].tap()
        let formatSheet = app.sheets.firstMatch
        XCTAssertTrue(formatSheet.waitForExistence(timeout: 5), app.debugDescription)
        formatSheet.buttons["Certificate"].tap()
        XCTAssertTrue(app.buttons["draft-format"].waitForExistence(timeout: 5))
        let formatUpdated = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label CONTAINS %@", "Certificate"), object: app.buttons["draft-format"])
        XCTAssertEqual(XCTWaiter.wait(for: [formatUpdated], timeout: 5), .completed, app.debugDescription)
        app.buttons["draft-category"].tap()
        let categorySheet = app.sheets.firstMatch
        XCTAssertTrue(categorySheet.waitForExistence(timeout: 5), app.debugDescription)
        categorySheet.buttons["Learning"].tap()
        let categoryUpdated = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label CONTAINS %@", "Learning"), object: app.buttons["draft-category"])
        XCTAssertEqual(XCTWaiter.wait(for: [categoryUpdated], timeout: 5), .completed, app.debugDescription)
    }

    @MainActor
    func testCreateForSomeoneKeepsTemplateSeparateFromCollection() {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--locale", "en"]; app.launch()
        app.buttons["create"].tap(); app.buttons["Create new"].tap()
        XCTAssertTrue(app.buttons["draft-artwork"].exists)
        let title = app.textFields["draft-title"]; title.tap(); title.typeText("Native kindness badge")
        let summary = app.descendants(matching: .any)["draft-summary"]; summary.tap(); summary.typeText("Recognizing a thoughtful teammate.")
        app.swipeUp(); app.buttons["create-next"].tap()
        app.buttons["recipient-other"].tap()
        XCTAssertTrue(app.buttons["recipient-Alex Morgan"].waitForExistence(timeout: 5))
        app.buttons["recipient-Alex Morgan"].tap()
        app.buttons["create-next"].tap()
        XCTAssertTrue(app.staticTexts["For Alex Morgan"].exists)
        app.buttons["create-confirm"].tap()
        XCTAssertTrue(app.alerts["Done"].waitForExistence(timeout: 5)); app.alerts["Done"].buttons["Done"].tap()
        XCTAssertFalse(app.staticTexts["Native kindness badge"].exists)
        app.buttons["nav-home"].tap(); app.buttons["home-creations"].tap()
        XCTAssertTrue(app.staticTexts["Native kindness badge"].waitForExistence(timeout: 5))
    }

    @MainActor
    func testReceiveReviewsBeforeClaiming() throws {
        let app = XCUIApplication()
        app.launchArguments = ["--demo", "--locale", "en"]
        app.launch()
        app.buttons["nav-home"].tap()
        app.buttons["receive"].tap()
        app.buttons["use-sample-link"].tap()
        app.buttons["review-link"].tap()
        XCTAssertTrue(app.buttons["claim"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Ready to help"].exists)
        app.buttons["Cancel"].tap()
        app.buttons["nav-inbox"].tap()
        XCTAssertTrue(app.buttons["offer-first-aid"].exists)
    }

    @MainActor
    func testNativeShareSheetAndDarkMode() throws {
        let app = XCUIApplication()
        app.launchArguments = ["--demo", "--locale", "en"]
        app.launchArguments = ["--demo", "--preview-dark", "--locale", "en"]
        app.launch()
        app.buttons["credential-design"].tap()
        app.swipeUp()
        app.buttons["share"].tap()
        let copyAction = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "Copy")).firstMatch
        XCTAssertTrue(copyAction.waitForExistence(timeout: 10), app.debugDescription)
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Native share sheet in dark mode"
        screenshot.lifetime = .keepAlways
        add(screenshot)
    }

    @MainActor
    func testDetailCardTiltReleasesScrollingAndAllowsClaim() {
        checkDetailCardScrollingAndClaim(reduceMotion: false)
    }

    @MainActor
    func testReducedMotionDetailCardStaysStaticAndAllowsClaim() {
        checkDetailCardScrollingAndClaim(reduceMotion: true)
    }

    @MainActor
    private func checkDetailCardScrollingAndClaim(reduceMotion: Bool) {
        let app = XCUIApplication()
        app.launchArguments = ["--demo", "--locale", "en", "--large-type"]
        if reduceMotion { app.launchArguments.append("--card-reduce-motion") }
        app.launch()
        XCTAssertTrue(app.buttons["nav-inbox"].waitForExistence(timeout: 10)); app.buttons["nav-inbox"].tap()
        let offer = app.buttons["offer-first-aid"]
        XCTAssertTrue(offer.waitForExistence(timeout: 5)); offer.tap()
        let card = app.descendants(matching: .any).matching(identifier: "credential-interactive-card").firstMatch
        XCTAssertTrue(card.waitForExistence(timeout: 5))
        XCTAssertEqual(app.staticTexts["Hold and drag to tilt"].exists, !reduceMotion)
        let start = card.coordinate(withNormalizedOffset: CGVector(dx: 0.4, dy: 0.35))
        let end = card.coordinate(withNormalizedOffset: CGVector(dx: 0.7, dy: 0.45))
        start.press(forDuration: 0.5, thenDragTo: end)
        // Exercise a quick swipe starting on the card after release, not only outside it.
        let oldFrame = card.frame
        card.swipeUp()
        // Accessibility bounds clip to the viewport once the top passes the navigation bar.
        XCTAssertTrue(card.frame.minY < oldFrame.minY - 3 || card.frame.height < oldFrame.height - 3 || !card.isHittable,
                      "A quick swipe on the card did not scroll the detail page")
        let claim = app.buttons["claim"]
        for _ in 0..<4 where !claim.isHittable { app.swipeUp() }
        XCTAssertTrue(claim.isHittable); claim.tap()
        XCTAssertTrue(app.alerts["Done"].waitForExistence(timeout: 5))
        app.alerts["Done"].buttons["Done"].tap()
        XCTAssertFalse(app.buttons["offer-first-aid"].exists)
    }

    func testJavaScriptCoreRuntimeCapabilities() throws {
        // Probe the simulator's iOS JSContext, without loading secrets or LearnCard SDK code.
        let context = try XCTUnwrap(JSContext())
        let capabilities = try XCTUnwrap(context.evaluateScript("""
            JSON.stringify({ WebAssembly: typeof WebAssembly, fetch: typeof fetch,
                crypto: typeof crypto, indexedDB: typeof indexedDB, window: typeof window })
            """)?.toString())
        print("LEARN_CARD_RUNTIME_CAPABILITIES: \(capabilities)")
        let attachment = XCTAttachment(string: capabilities)
        attachment.name = "iOS JavaScriptCore capability probe"
        attachment.lifetime = .keepAlways
        add(attachment)
        // This is diagnostic evidence, not a compatibility assertion about React Native's Hermes.
    }
}
