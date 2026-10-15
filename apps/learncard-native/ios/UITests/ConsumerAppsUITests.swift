import XCTest

@MainActor final class ConsumerAppsUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private func launch(locale: String = "en") -> XCUIApplication {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--locale", locale]; app.launch()
        XCTAssertTrue(app.buttons["nav-apps"].waitForExistence(timeout: 10)); app.buttons["nav-apps"].tap()
        return app
    }
    func testDiscoverConsentInstallAndNativeDataSharing() {
        let app = launch()
        app.buttons["Discover"].tap()
        let discoverShot = XCTAttachment(screenshot: app.screenshot()); discoverShot.name = "Drawn Apps discovery with actual sample metadata"; discoverShot.lifetime = .keepAlways; add(discoverShot)
        let studio = app.buttons["app-sample-studio"]
        XCTAssertTrue(studio.waitForExistence(timeout: 5), app.debugDescription); studio.tap()
        app.buttons["app-detail-action"].tap()
        XCTAssertTrue(app.buttons["consent-agree"].waitForExistence(timeout: 5), app.debugDescription)
        XCTAssertTrue(app.staticTexts["Creative Learning Studio"].exists)
        let optional = app.switches["consent-permission-Learning"]
        XCTAssertEqual(optional.value as? String, "0")
        optional.tap()
        app.buttons["consent-choice-design"].tap()
        app.buttons["consent-agree"].tap()
        XCTAssertTrue(app.buttons["app-remove"].waitForExistence(timeout: 5), app.debugDescription)
        app.swipeUp()
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
        XCTAssertTrue(app.staticTexts["page-title-collection"].waitForExistence(timeout: 10))
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
        XCTAssertTrue(app.staticTexts["page-title-collection"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.buttons["nav-inbox"].label, "Boîte de réception")
        app.terminate(); app.launchArguments.removeLast(2); app.launchArguments.removeAll { $0 == "--fixture-reset" }; app.launch()
        XCTAssertTrue(app.staticTexts["page-title-collection"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.buttons["nav-inbox"].label, "Boîte de réception")
        XCTAssertFalse(app.buttons["recover-account"].exists)
    }
}
