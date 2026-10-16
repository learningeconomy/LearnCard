import XCTest
@testable import LearnCardNativeCore

final class CredentialAuthoringTests: XCTestCase {
    func testCatalogMatchesAuditedConsumerScopeWithoutSpecializedOrBrowseOnlyCategories() throws {
        let catalog = try XCTUnwrap(CredentialAuthoringCatalog.current)
        XCTAssertEqual(catalog.sourceRevision.count, 40)
        XCTAssertEqual(catalog.formats, ["badge", "award", "certificate", "media"])
        XCTAssertEqual(Set(catalog.categories.map(\.category)), Set(CreationCategory.allCases.map(\.rawValue)))
        XCTAssertEqual(catalog.categories.reduce(0) { $0 + $1.types.count }, 115)
        XCTAssertEqual(Set(CreationCategory.allCases.map(\.displayCategory)), Set([.badge, .achievement, .qualification, .studies, .portfolio, .assistance, .experience, .id]))
    }
    func testTypeAndFormatRemainIndependentAndCategorySurvivesTheWire() throws {
        let draft = CredentialDraft(title: "A qualification", summary: "A completed qualification", kind: .achievement,
                                    achievementType: "License", category: .qualification, displayType: .badge)
        XCTAssertTrue(draft.authoringIsValid)
        let object = try XCTUnwrap(JSONSerialization.jsonObject(with: JSONEncoder().encode(draft)) as? [String: Any])
        XCTAssertEqual(object["category"] as? String, "Qualifications")
        XCTAssertEqual(object["displayType"] as? String, "badge")
        XCTAssertEqual(object["achievementType"] as? String, "License")
        let old = try JSONDecoder().decode(CredentialDraft.self, from: Data(#"{"requestID":"old","title":"Old","summary":"Still readable","kind":"Learning","achievementType":"Course","criteria":""}"#.utf8))
        XCTAssertNil(old.category); XCTAssertNil(old.displayType); XCTAssertTrue(old.authoringIsValid)
    }
    func testCategoryTypeAndFixedIDFormatRejectMisclassification() {
        XCTAssertFalse(CredentialDraft(title: "Test", summary: "Test", kind: .achievement, achievementType: "License", category: .portfolio, displayType: .badge).authoringIsValid)
        XCTAssertFalse(CredentialDraft(title: "Test", summary: "Test", kind: .membership, achievementType: "ext:SchoolID", category: .id, displayType: .media).authoringIsValid)
        XCTAssertTrue(CredentialDraft(title: "Test", summary: "Test", kind: .membership, achievementType: "ext:SchoolID", category: .id, displayType: .id).authoringIsValid)
        XCTAssertTrue(CreationCategory.portfolio.types.contains { $0.type == "ext:Project" })
        XCTAssertEqual(CreationCategory.id.formats, [.id]); XCTAssertEqual(CreationCategory.portfolio.defaultFormat, .media)
    }
    func testDemoCreationAppearsInTheChosenCollectionCategory() async throws {
        let service = DemoCredentialService(emptyCollection: true)
        let result = try await service.create(draft: CredentialDraft(title: "Design project", summary: "A project", kind: .achievement,
                                                                   achievementType: "ext:Project", category: .portfolio, displayType: .media))
        XCTAssertEqual(result.credentials.first?.displayCategory, .portfolio)
        let creations = await service.creations(cursor: nil)
        XCTAssertEqual(creations.credentials.first?.category, "Accomplishment")
    }
}
