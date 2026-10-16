import XCTest
@testable import LearnCardNativeSDK

final class CollectionEmptyLocalizationTests: XCTestCase {
    func testEmptyStatesAndSignupPhotoHaveCompleteCopyAndCategoryFormatting() {
        let keys = ["collection.empty.title", "collection.empty.body", "collection.empty.categoryTitle", "collection.empty.categoryBody", "collection.empty.loadedTitle", "collection.empty.loadedBody", "collection.empty.viewAll", "signup.photo.add", "signup.photo.change", "signup.photo.hint"]
        for language in [NativeLanguage.en, .es, .fr, .ar] {
            for key in keys { XCTAssertNotEqual(NativeText.text(key, language: language), key) }
            let title = NativeText.text("credentialCategory.portfolio", language: language)
            let body = NativeText.format("collection.empty.categoryBody", title, language: language)
            XCTAssertTrue(body.contains(title)); XCTAssertFalse(body.contains("%@"))
        }
    }
}
