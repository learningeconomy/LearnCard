import XCTest
@testable import LearnCardNativeSDK

final class LearnerLocalizationTests: XCTestCase {
    func testLearnerWelcomeIntakeAndHomeStatesHaveCompleteFourLanguageCopy() {
        let keys = ["welcomeTitle", "welcomeBody", "receive", "keep", "choose", "firstAdd", "explore", "add", "addTitle", "addBody", "tools", "more", "guide", "emptyTitle", "emptyBody", "recent", "loadedRecords", "loading", "unavailable", "partialTitle", "partialBody", "loadMore", "retry", "share", "shareBody", "incoming", "expanded", "collapsed"].map { "learner.\($0)" }
        for language in [NativeLanguage.en, .es, .fr, .ar] {
            for key in keys + ["people.send", "people.sendBody"] {
                let value = NativeText.text(key, language: language)
                XCTAssertNotEqual(value, key); XCTAssertFalse(value.isEmpty); XCTAssertFalse(value.contains("%"))
            }
        }
    }
}
