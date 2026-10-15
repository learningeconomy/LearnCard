import Foundation
import Testing
@testable import LearnCardNativeCore

@Test func passportCategoriesRemainDistinctDespiteLegacyKind() {
    let values: [(String, CredentialCategory)] = [("Social Badge", .badge), ("Achievement", .achievement), ("Qualifications", .qualification), ("Course", .studies), ("Learning History", .studies), ("Accomplishment", .portfolio), ("Accommodation", .assistance), ("Resume", .experience), ("Work History", .experience), ("ID", .id), ("Membership", .id), ("Skill", .skill), ("AI Topic", .aiTopic), ("AI Pathway", .aiPathway), ("AI Insight", .aiInsight)]
    for (raw, expected) in values {
        let credential = Credential(id: raw, title: raw, issuer: "Studio", summary: "", kind: .achievement, date: .now, category: raw)
        #expect(credential.displayCategory == expected)
        #expect(credential.belongsInCollection)
    }
}
@Test func familyStaysSeparateAndUnknownCategoriesAreNotRelabeledAsAchievements() {
    let family = Credential(id: "family", title: "Family", issuer: "Guardian", summary: "", kind: .membership, date: .now, category: "Family")
    #expect(!family.belongsInCollection)
    #expect(!CredentialCategory.collectionCategories.contains(.family))
    #expect(CredentialCategory.resolve("partner.custom", fallback: .achievement) == .other)
    #expect(CredentialCategory.resolve(nil, fallback: .learning) == .studies)
    #expect(CredentialCategory.resolve("", fallback: .membership) == .id)
    #expect(Set(CredentialCategory.collectionCategories).count == CredentialCategory.collectionCategories.count)
}
