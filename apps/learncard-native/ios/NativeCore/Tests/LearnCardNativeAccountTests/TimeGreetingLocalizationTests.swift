import XCTest
import LearnCardNativeCore
@testable import LearnCardNativeSDK

final class TimeGreetingLocalizationTests: XCTestCase {
    func testEveryDayGreetingHasNamedAndUnnamedTranslationsWithFoundationInsertion() {
        for language in [NativeLanguage.en, .es, .fr, .ar] {
            for greeting in LocalDaytime.Greeting.allCases {
                let key = "home.time.\(greeting.rawValue)"
                let plain = NativeText.text(key, language: language)
                XCTAssertNotEqual(plain, key)
                XCTAssertFalse(plain.contains("%@"))
                let named = NativeText.format(key + ".name", "Amina", language: language)
                XCTAssertTrue(named.contains("Amina"), "\(language):\(key)")
                XCTAssertFalse(named.contains("%@") || named.contains("{0}"))
            }
        }
        XCTAssertEqual(NativeText.text("home.time.morning", language: .en), "Good morning")
        XCTAssertEqual(NativeText.text("home.time.evening", language: .ar), "مساء الخير")
    }
}
