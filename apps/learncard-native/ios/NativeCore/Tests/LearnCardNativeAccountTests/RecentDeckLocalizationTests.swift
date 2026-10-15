import XCTest
@testable import LearnCardNativeSDK

final class RecentDeckLocalizationTests: XCTestCase {
    func testRecentDeckPositionAndActionCopyInEveryLanguage() {
        for language in [NativeLanguage.en, .es, .fr, .ar] {
            let position = NativeText.format("collection.stackPosition", "2", "5", language: language)
            XCTAssertTrue(position.contains("2")); XCTAssertTrue(position.contains("5")); XCTAssertFalse(position.contains("%"))
            for key in ["collection.stackNewer", "collection.stackOlder", "collection.stackHint", "collection.stackPartial", "collection.stackOpenHint"] {
                XCTAssertNotEqual(NativeText.text(key, language: language), key)
            }
        }
    }
}
