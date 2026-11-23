import XCTest

final class SmokeSignInWalletUITests: XCTestCase {
    func testDemoEmailSignInShowsPassportAndCredentialCard() {
        continueAfterFailure = false

        let app = XCUIApplication()
        app.launch()

        let web = app.webViews.firstMatch
        XCTAssertTrue(web.waitForExistence(timeout: 90), "LearnCard WebView did not launch")

        // WKWebView can expose accessible names in place of DOM identifiers.
        let email = web.descendants(matching: .textField).matching(
            NSPredicate(
                format: "identifier == %@ OR label IN %@ OR placeholderValue IN %@",
                argumentArray: [
                    "login-email",
                    ["Email", "Correo electrónico", "E-mail", "البريد الإلكتروني"],
                    ["Email address", "Dirección de correo", "Adresse e-mail", "عنوان البريد الإلكتروني"],
                ]
            )
        ).firstMatch
        XCTAssertTrue(email.waitForExistence(timeout: 90), "Email field did not appear")
        email.tap()
        email.typeText("demo@learningeconomy.io")

        let submit = web.descendants(matching: .button).matching(
            NSPredicate(
                format: "identifier == %@ OR label IN %@",
                argumentArray: [
                    "login-email-submit",
                    [
                        "Sign in with Email", "Iniciar sesión con correo",
                        "Se connecter par e-mail", "تسجيل الدخول بالبريد الإلكتروني",
                    ],
                ]
            )
        ).firstMatch
        XCTAssertTrue(submit.waitForExistence(timeout: 30), "Email sign-in button did not appear")
        submit.tap()

        let heading = web.descendants(matching: .any).matching(
            NSPredicate(
                format: "identifier == %@ OR label IN %@",
                argumentArray: [
                    "wallet-heading",
                    ["My Passport", "Passport", "Pasaporte", "Passeport", "جواز السفر"],
                ]
            )
        ).firstMatch
        XCTAssertTrue(heading.waitForExistence(timeout: 120), "Passport did not load after demo sign-in")

        let card = web.descendants(matching: .any).matching(
            NSPredicate(
                format: "identifier BEGINSWITH 'credential-card-' OR label == 'Credential card'"
            )
        ).firstMatch

        // The demo profile can render the categories above Recently Added.
        if !card.waitForExistence(timeout: 10) {
            for _ in 0..<5 {
                web.swipeUp()
                if card.waitForExistence(timeout: 3) { break }
            }
        }
        XCTAssertTrue(card.waitForExistence(timeout: 60), "Passport did not show a credential card")
    }
}
