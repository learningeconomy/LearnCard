import XCTest
import LearnCardNativeCore
@testable import LearnCardNativeSDK

final class AuthoringLocalizationTests: XCTestCase {
    func testEveryWebTypeFormatAndCategoryHasNativeTranslations() throws {
        let catalog = try XCTUnwrap(CredentialAuthoringCatalog.current)
        let keys = catalog.categories.flatMap { $0.types.map { "builder.type.\($0.type)" } }
            + CreationCategory.allCases.map { "builder.categoryHint.\($0.displayCategory.rawValue)" }
            + CredentialDisplayFormat.allCases.map { "builder.display.\($0.rawValue)" }
        for language in [NativeLanguage.en, .es, .fr, .ar] {
            for key in keys { XCTAssertNotEqual(NativeText.text(key, language: language), key) }
        }
    }
}
