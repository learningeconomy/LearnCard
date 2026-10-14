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
        let expandedBrandWidth = app.descendants(matching: .any).matching(identifier: "learncard-brand-full").firstMatch.frame.width
        app.swipeUp()
        XCTAssertTrue(app.navigationBars.staticTexts["Collection"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.descendants(matching: .any)["learncard-brand-compact"].waitForExistence(timeout: 5), app.debugDescription)
        let compactBrand = app.descendants(matching: .any).matching(identifier: "learncard-brand-compact").firstMatch
        let collapsed = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            compactBrand.exists && compactBrand.frame.width < expandedBrandWidth * 0.6
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [collapsed], timeout: 5), .completed,
                       "Scrolling should remove the wordmark after its transition")
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
        skipSampleConnectionPrompt(app)
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
    func testLoopingDetailCardAllowsScrollingAndClaim() {
        checkDetailCardScrollingAndClaim(reduceMotion: false)
    }

    @MainActor
    func testReducedMotionDetailAllowsScrollingAndClaim() {
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
        let card = app.descendants(matching: .any).matching(identifier: "credential-detail-card").firstMatch
        XCTAssertTrue(card.waitForExistence(timeout: 5))
        XCTAssertFalse(app.staticTexts["Hold and drag to tilt"].exists)
        // The looping visual must not capture touches or interfere with native scrolling.
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
        skipSampleConnectionPrompt(app)
        XCTAssertFalse(app.buttons["offer-first-aid"].exists)
    }

    @MainActor private func skipSampleConnectionPrompt(_ app: XCUIApplication) {
        let skip = app.buttons["connection-prompt-skip"]
        XCTAssertTrue(skip.waitForExistence(timeout: 5)); skip.tap()
        XCTAssertTrue(app.buttons["nav-inbox"].waitForExistence(timeout: 5))
    }

    @MainActor func testInboxConnectionRequestAndUpdatesHaveDistinctActions() {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--locale", "en"]; app.launch()
        XCTAssertTrue(app.buttons["nav-inbox"].waitForExistence(timeout: 10)); app.buttons["nav-inbox"].tap()
        let accept = app.buttons["inbox-accept-sample-request"]
        for _ in 0..<6 where !accept.isHittable { app.swipeUp() }
        XCTAssertTrue(accept.isHittable)
        let before = XCTAttachment(screenshot: app.screenshot()); before.name = "Drawn Inbox connection requests and updates"; before.lifetime = .keepAlways; add(before)
        accept.tap(); XCTAssertFalse(accept.exists)
        XCTAssertTrue(app.staticTexts["Connected"].waitForExistence(timeout: 5))
        let dismiss = app.buttons["inbox-dismiss-sample-request"]; XCTAssertTrue(dismiss.isHittable); dismiss.tap()
        XCTAssertFalse(dismiss.exists); XCTAssertFalse(app.staticTexts["Alex Morgan"].exists)
    }

    @MainActor func testClaimConnectionPromptRequiresExplicitDecision() {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--locale", "en"]; app.launch()
        app.buttons["nav-inbox"].tap(); let offer = app.buttons["offer-first-aid"]
        XCTAssertTrue(offer.waitForExistence(timeout: 10)); offer.tap(); app.buttons["claim"].tap()
        XCTAssertTrue(app.alerts["Done"].waitForExistence(timeout: 5)); app.alerts["Done"].buttons["Done"].tap()
        let connect = app.buttons["connection-prompt-connect"]
        XCTAssertTrue(connect.waitForExistence(timeout: 5)); XCTAssertTrue(app.buttons["connection-prompt-skip"].exists)
        let image = XCTAttachment(screenshot: app.screenshot()); image.name = "Post-claim native connection decision"; image.lifetime = .keepAlways; add(image)
        connect.tap(); XCTAssertTrue(app.buttons["nav-inbox"].waitForExistence(timeout: 5))
        XCTAssertFalse(connect.exists)
    }

    @MainActor
    func testSharedHeaderActionsAndAccountAcrossTabs() {
        let app = XCUIApplication()
        app.launchArguments = ["--demo", "--locale", "en"]
        app.launch()
        for tab in ["inbox", "apps", "home", "collection"] {
            app.buttons["nav-\(tab)"].tap()
            XCTAssertTrue(app.descendants(matching: .any)["learncard-brand-full"].waitForExistence(timeout: 5))
            XCTAssertTrue(app.buttons["create"].isHittable)
            XCTAssertTrue(app.buttons["account"].isHittable)
            if tab == "inbox" {
                let screenshot = XCTAttachment(screenshot: app.screenshot())
                screenshot.name = "Drawn Inbox and shared header"; screenshot.lifetime = .keepAlways; add(screenshot)
            }
            app.buttons["account"].tap()
            XCTAssertTrue(app.buttons["account-language"].waitForExistence(timeout: 5))
            app.navigationBars.buttons["Done"].tap()
            app.buttons["create"].tap()
            for action in ["Create new", "Send existing creation", "Share credentials"] {
                XCTAssertTrue(app.buttons[action].waitForExistence(timeout: 5))
            }
            app.buttons["Create new"].tap()
            XCTAssertTrue(app.textFields["draft-title"].waitForExistence(timeout: 5))
            app.navigationBars.buttons["Cancel"].tap()
        }
    }

    @MainActor
    func testCollectionSearchShowsAllMatchesWithoutLatestCardAndCanReset() {
        let app = XCUIApplication()
        app.launchArguments = ["--demo", "--locale", "en"]
        app.launch()
        XCTAssertTrue(app.buttons["credential-design"].waitForExistence(timeout: 10))
        let search = app.textFields["collection-search"]
        search.tap(); search.typeText("design\n")
        XCTAssertTrue(app.staticTexts["Search results"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.staticTexts["Latest issued"].exists)
        XCTAssertTrue(app.buttons["credential-design"].exists)
        XCTAssertFalse(app.buttons["credential-community"].exists)
        XCTAssertTrue(app.staticTexts["1 match"].exists)
        let results = XCTAttachment(screenshot: app.screenshot())
        results.name = "Compact Collection search results"; results.lifetime = .keepAlways; add(results)
        app.buttons["collection-search-clear"].tap()
        search.tap(); search.typeText("astronaut\n")
        XCTAssertTrue(app.staticTexts["No matches yet"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.staticTexts["Latest issued"].exists)
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Illustrated Collection search empty state"; screenshot.lifetime = .keepAlways; add(screenshot)
        app.buttons["collection-search-reset"].tap()
        XCTAssertTrue(app.staticTexts["Latest issued"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["credential-design"].exists)
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
