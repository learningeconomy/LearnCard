import XCTest

@MainActor final class ConsumerAppsUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private func launch(locale: String = "en", extra: [String] = []) -> XCUIApplication {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--locale", locale] + extra; app.launch()
        XCTAssertTrue(app.buttons["nav-apps"].waitForExistence(timeout: 10)); app.buttons["nav-apps"].tap()
        return app
    }
    private func reveal(_ element: XCUIElement, in app: XCUIApplication) {
        for _ in 0..<8 { if element.exists && element.isHittable { return }; app.swipeUp() }
        XCTAssertTrue(element.isHittable, app.debugDescription)
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot)
    }
    func testEmptyAppsLeadWithDiscoverAndSearchKeepsUtilitiesAvailable() {
        let app = launch(extra: ["--empty-apps", "--standard-type"])
        let empty = app.otherElements["apps-empty"]
        XCTAssertTrue(app.buttons["apps-empty-discover"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.otherElements["apps-no-results"].exists)
        XCTAssertLessThan(empty.frame.minY, app.staticTexts["apps-tools-heading"].frame.minY)
        capture(app, "Rendered My apps empty with Discover and lower utilities")
        app.buttons["apps-empty-discover"].tap()
        XCTAssertTrue(app.buttons["app-sample-earth"].waitForExistence(timeout: 5))
        capture(app, "Rendered Discover with real sample featured flag")
        app.buttons["My apps"].tap()
        let search = app.textFields["apps-search"]; search.tap(); search.typeText("No matching app\n")
        XCTAssertTrue(app.otherElements["apps-no-results"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["apps-empty-discover"].exists, "Typed search must not become the new-app invitation")
        XCTAssertTrue(app.buttons["apps-data-sharing"].exists)
        app.buttons["apps-clear-search"].tap()
        XCTAssertTrue(app.buttons["apps-empty-discover"].waitForExistence(timeout: 5))
        reveal(app.buttons["apps-data-sharing"], in: app); app.buttons["apps-data-sharing"].tap()
        XCTAssertTrue(app.staticTexts["page-title-sharing"].waitForExistence(timeout: 5))
    }
    func testUnavailableAppsNeverClaimEmptyAndKeepNativeToolsReachable() {
        let app = launch(extra: ["--unavailable-apps", "--standard-type"])
        XCTAssertTrue(app.otherElements["consumer-error"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["apps-empty-discover"].exists)
        XCTAssertFalse(app.otherElements["apps-no-results"].exists)
        reveal(app.buttons["apps-families"], in: app); app.buttons["apps-families"].tap()
        XCTAssertTrue(app.staticTexts["page-title-families"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.webViews.firstMatch.exists)
    }
    func testSeveralAppsKeepDirectOpenActionsAheadOfUtilities() {
        let app = launch(extra: ["--standard-type"])
        app.buttons["Discover"].tap()
        reveal(app.buttons["app-sample-studio"], in: app); app.buttons["app-sample-studio"].tap()
        capture(app, "Rendered compact app listing")
        app.buttons["app-detail-action"].tap()
        XCTAssertTrue(app.buttons["consent-agree"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.switches["consent-permission-Learning"].value as? String, "0")
        capture(app, "Rendered compact access optional off")
        let required = app.descendants(matching: .any).matching(identifier: "consent-permission-Achievement").firstMatch
        reveal(required, in: app)
        capture(app, "Rendered compact access required scope fixed")
        app.buttons["consent-agree"].tap()
        XCTAssertTrue(app.buttons["app-remove"].waitForExistence(timeout: 5))
        app.navigationBars.buttons.element(boundBy: 0).tap(); app.buttons["My apps"].tap()
        let earth = app.buttons["app-open-sample-earth"], studio = app.buttons["app-open-sample-studio"]
        XCTAssertTrue(earth.waitForExistence(timeout: 5)); XCTAssertTrue(studio.exists)
        XCTAssertLessThan(earth.frame.minY, studio.frame.minY)
        XCTAssertLessThan(studio.frame.minY, app.staticTexts["apps-tools-heading"].frame.minY)
        capture(app, "Rendered My apps with two actual sample installations")
        reveal(studio, in: app); studio.tap()
        XCTAssertTrue(app.webViews.staticTexts["Partner SDK connected"].waitForExistence(timeout: 15))
    }
    func testArabicAccessibilityAppsAndConsentKeepChoicesAndCancelUsable() {
        let app = launch(locale: "ar", extra: ["--large-type", "--preview-dark"])
        let installed = app.buttons["app-sample-earth"]; XCTAssertTrue(installed.waitForExistence(timeout: 5))
        XCTAssertGreaterThan(installed.frame.height, 110, "Review fixture must actually use accessibility type")
        capture(app, "Rendered My apps Arabic dark accessibility")
        app.buttons["استكشاف"].tap()
        reveal(app.buttons["app-sample-studio"], in: app); app.buttons["app-sample-studio"].tap()
        reveal(app.buttons["app-detail-action"], in: app); app.buttons["app-detail-action"].tap()
        let optional = app.switches["consent-permission-Learning"]
        XCTAssertTrue(optional.waitForExistence(timeout: 5))
        XCTAssertEqual(optional.value as? String, "0")
        XCTAssertFalse(app.switches["consent-permission-Achievement"].exists, "Required access must not look editable")
        capture(app, "Rendered access Arabic dark accessibility")
        let agree = app.buttons["consent-agree"]; XCTAssertTrue(agree.exists)
        XCTAssertGreaterThanOrEqual(agree.frame.height, 54)
        app.buttons["إلغاء"].tap()
        XCTAssertTrue(app.buttons["app-detail-action"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["app-remove"].exists, "Opening/cancelling consent must not install an app")
    }
    func testDiscoverConsentInstallAndNativeDataSharing() {
        let app = launch()
        app.buttons["Discover"].tap()
        let discoverShot = XCTAttachment(screenshot: app.screenshot()); discoverShot.name = "Drawn Apps discovery with actual sample metadata"; discoverShot.lifetime = .keepAlways; add(discoverShot)
        let studio = app.buttons["app-sample-studio"]
        reveal(studio, in: app); studio.tap()
        capture(app, "Rendered app listing with supplied sample metadata")
        app.buttons["app-detail-action"].tap()
        XCTAssertTrue(app.buttons["consent-agree"].waitForExistence(timeout: 5), app.debugDescription)
        XCTAssertTrue(app.staticTexts["Creative Learning Studio"].exists)
        let optional = app.switches["consent-permission-Learning"]
        XCTAssertEqual(optional.value as? String, "0")
        XCTAssertTrue(app.staticTexts["No credentials selected"].exists)
        XCTAssertFalse(app.switches["consent-permission-Achievement"].exists)
        capture(app, "Rendered access optional off before agreement")
        optional.tap()
        app.buttons["consent-choice-design"].tap()
        app.buttons["consent-agree"].tap()
        XCTAssertTrue(app.buttons["app-remove"].waitForExistence(timeout: 5), app.debugDescription)
        reveal(app.buttons["Data Sharing"], in: app)
        app.buttons["Data Sharing"].tap()
        XCTAssertTrue(app.buttons["sharing-connection-sample-terms"].waitForExistence(timeout: 5))
        app.buttons["sharing-connection-sample-terms"].tap()
        app.buttons["connection-stop"].tap()
        app.buttons["Stop sharing"].firstMatch.tap()
        XCTAssertTrue(app.staticTexts["Sharing stopped"].waitForExistence(timeout: 5), app.debugDescription)
        XCTAssertFalse(app.buttons["connection-stop"].exists)
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Native agreement recipients and withdrawal"; shot.lifetime = .keepAlways; add(shot)
    }
    func testInstalledAppOpensDirectlyFromMyApps() {
        let app = launch()
        let appsShot = XCTAttachment(screenshot: app.screenshot()); appsShot.name = "Drawn My apps tools and app rows"; appsShot.lifetime = .keepAlways; add(appsShot)
        let open = app.buttons["app-open-sample-earth"]
        for _ in 0..<3 where !open.isHittable { app.swipeUp() }
        XCTAssertTrue(open.waitForExistence(timeout: 5)); open.tap()
        XCTAssertTrue(app.webViews.staticTexts["Partner SDK connected"].waitForExistence(timeout: 15), app.debugDescription)
        app.buttons["browser-close"].tap()
        XCTAssertTrue(app.buttons["app-open-sample-earth"].waitForExistence(timeout: 5))
    }
    func testRealPartnerSDKHandshakeIdentityCancelAcceptAndUnsupportedRequest() {
        let app = launch()
        app.buttons["app-sample-earth"].tap(); app.buttons["app-detail-action"].tap()
        XCTAssertTrue(app.webViews.staticTexts["Partner SDK connected"].waitForExistence(timeout: 15), app.debugDescription)
        app.webViews.buttons["Connect account"].tap()
        XCTAssertTrue(app.alerts.firstMatch.waitForExistence(timeout: 5))
        app.alerts.buttons["Cancel"].tap()
        XCTAssertTrue(app.webViews.staticTexts["Identity declined"].waitForExistence(timeout: 5))
        app.webViews.buttons["Connect account"].tap()
        app.alerts.buttons["Share & sign in"].firstMatch.tap()
        XCTAssertTrue(app.webViews.staticTexts["Identity connected"].waitForExistence(timeout: 5), app.debugDescription)
        app.webViews.buttons["Request unsupported feature"].tap()
        XCTAssertTrue(app.webViews.staticTexts["Unsupported request rejected"].waitForExistence(timeout: 5))
        app.buttons["browser-close"].tap()
        XCTAssertTrue(app.buttons["app-detail-action"].waitForExistence(timeout: 5))
    }
    func testConsumerBrowserIsClosedDuringAccountBackgroundAndResume() {
        let app = XCUIApplication()
        app.launchArguments = ["--account-fixture","ready",UUID().uuidString,"--fixture-reset","--locale","en"]
        app.launch(); XCTAssertTrue(app.buttons["nav-apps"].waitForExistence(timeout: 10)); app.buttons["nav-apps"].tap()
        app.buttons["app-sample-earth"].tap(); app.buttons["app-detail-action"].tap()
        XCTAssertTrue(app.webViews.staticTexts["Partner SDK connected"].waitForExistence(timeout: 15), app.debugDescription)
        XCUIDevice.shared.press(.home); XCTAssertTrue(app.wait(for: .runningBackground, timeout: 5)); app.activate()
        XCTAssertTrue(app.staticTexts["page-title-home"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["browser-close"].exists)
        app.buttons["nav-apps"].tap(); XCTAssertTrue(app.buttons["app-sample-earth"].waitForExistence(timeout: 5))
    }
    func testFrenchAndArabicAppsTitlesAndStableNavigationIdentifiers() {
        for (locale, title, discover) in [("fr","Apps","Découvrir"),("ar","التطبيقات","استكشاف")] {
            let app = launch(locale: locale)
            XCTAssertEqual(app.staticTexts["page-title-apps"].label, title)
            XCTAssertTrue(app.buttons[discover].exists, app.debugDescription)
            app.buttons[discover].tap(); XCTAssertTrue(app.buttons["app-sample-studio"].waitForExistence(timeout: 5))
            let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Apps \(locale) with native direction"; shot.lifetime = .keepAlways; add(shot)
            app.terminate()
        }
    }
    func testProfileDataSharingStaysNative() {
        let app = XCUIApplication(); app.launchArguments = ["--demo","--locale","en"]; app.launch()
        app.buttons["Account"].tap(); app.buttons["account-data-sharing"].tap()
        XCTAssertTrue(app.staticTexts["page-title-sharing"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Your shared links"].exists)
        let privacyShot = XCTAttachment(screenshot: app.screenshot()); privacyShot.name = "Drawn native Data Sharing overview"; privacyShot.lifetime = .keepAlways; add(privacyShot)
        XCTAssertFalse(app.webViews.firstMatch.exists)
    }
    func testLanguageChangeKeepsAccountAndPersistsAfterRelaunch() {
        let app = XCUIApplication()
        app.launchArguments = ["--account-fixture", "ready", UUID().uuidString, "--fixture-reset", "--locale", "en"]
        app.launch(); XCTAssertTrue(app.buttons["nav-inbox"].waitForExistence(timeout: 10))
        app.buttons["Account"].tap(); app.buttons["account-language"].tap(); app.buttons["language-fr"].tap()
        XCUIDevice.shared.press(.home); XCTAssertTrue(app.wait(for: .runningBackground, timeout: 5)); app.activate()
        XCTAssertTrue(app.staticTexts["page-title-home"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.buttons["nav-inbox"].label, "Boîte de réception")
        app.terminate(); app.launchArguments.removeLast(2); app.launchArguments.removeAll { $0 == "--fixture-reset" }; app.launch()
        XCTAssertTrue(app.staticTexts["page-title-home"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.buttons["nav-inbox"].label, "Boîte de réception")
        XCTAssertFalse(app.buttons["recover-account"].exists)
    }
}
