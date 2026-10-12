import XCTest
import JavaScriptCore

final class ExperimentUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    @MainActor
    func testCollectionTitleAndScrollingBrand() {
        let app = XCUIApplication()
        app.launchArguments = ["--demo"]
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
        app.launchArguments = ["--demo"]
        app.launch()
        for title in ["Inbox", "Apps", "Home", "Collection"] {
            app.tabBars.buttons[title].tap()
            let heading = app.staticTexts["page-title-\(title.lowercased())"]
            XCTAssertTrue(heading.waitForExistence(timeout: 5), app.debugDescription)
            XCTAssertTrue(heading.isHittable, app.debugDescription)
        }
    }

    @MainActor
    func testClaimMovesSampleIntoCollection() throws {
        let app = XCUIApplication()
        app.launchArguments = ["--demo"]
        app.launch()
        app.tabBars.buttons["Inbox"].tap()
        let offer = app.buttons["offer-first-aid"]
        XCTAssertTrue(offer.waitForExistence(timeout: 10))
        offer.tap()
        app.buttons["claim"].tap()
        XCTAssertTrue(app.alerts["Done"].waitForExistence(timeout: 5))
        app.alerts["Done"].buttons["Done"].tap()
        XCTAssertFalse(app.buttons["offer-first-aid"].exists)
        app.tabBars.buttons["Collection"].tap()
        XCTAssertTrue(app.buttons["credential-first-aid"].waitForExistence(timeout: 5))
        app.tabBars.buttons["Home"].tap()
        XCTAssertTrue(app.staticTexts["Added to your collection"].exists)
    }

    @MainActor
    func testCreateAndRecordSend() throws {
        let app = XCUIApplication()
        app.launchArguments = ["--demo"]
        app.launch()
        app.buttons["create"].tap()
        let title = app.textFields["draft-title"]
        XCTAssertTrue(title.waitForExistence(timeout: 5))
        title.tap()
        title.typeText("A thoughtful teammate")
        let summary = app.descendants(matching: .any)["draft-summary"]
        summary.tap()
        summary.typeText("Thank you for helping the team learn.")
        app.swipeUp()
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
        app.tabBars.buttons["Home"].tap()
        XCTAssertTrue(app.staticTexts["Sample send recorded"].exists)
    }

    @MainActor
    func testReceiveReviewsBeforeClaiming() throws {
        let app = XCUIApplication()
        app.launchArguments = ["--demo"]
        app.launch()
        app.tabBars.buttons["Home"].tap()
        app.buttons["receive"].tap()
        app.buttons["use-sample-link"].tap()
        app.buttons["review-link"].tap()
        XCTAssertTrue(app.buttons["claim"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Ready to help"].exists)
        app.buttons["Cancel"].tap()
        app.tabBars.buttons["Inbox"].tap()
        XCTAssertTrue(app.buttons["offer-first-aid"].exists)
    }

    @MainActor
    func testNativeShareSheetAndDarkMode() throws {
        let app = XCUIApplication()
        app.launchArguments = ["--demo"]
        app.launchArguments = ["--demo", "--preview-dark"]
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
