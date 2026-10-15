import Foundation
import Testing
@testable import LearnCardNativeCore

@Test func optionalDraftDatesAndEvidenceHavePortableWireValues() throws {
    var details = CredentialDraftDetails()
    details.criteriaURL = "https://example.org/criteria"
    details.fieldOfStudy = "Design"; details.role = "Mentor"; details.term = "Autumn"
    details.activityStartDate = Date(timeIntervalSince1970: 1_790_000_000)
    details.validUntil = Date(timeIntervalSince1970: 1_800_000_000)
    details.evidence = [CredentialDraftEvidence(url: "https://example.org/work", name: "Portfolio", summary: "My work")]
    let encoder = JSONEncoder(); encoder.dateEncodingStrategy = .iso8601
    let data = try encoder.encode(CredentialDraft(title: "Test", summary: "Test", kind: .achievement, details: details))
    let object = try #require(JSONSerialization.jsonObject(with: data) as? [String: Any])
    let wire = try #require(object["details"] as? [String: Any])
    #expect(wire["validUntil"] is String)
    #expect((wire["evidence"] as? [[String: String]])?.first?["url"] == "https://example.org/work")
    #expect((wire["evidence"] as? [[String: String]])?.first?["id"] == nil)
    let decoder = JSONDecoder(); decoder.dateDecodingStrategy = .iso8601
    #expect(try decoder.decode(CredentialDraft.self, from: data).details?.validUntil == details.validUntil)
    let legacy = try encoder.encode(CredentialDraft(title: "Old", summary: "Old", kind: .learning))
    #expect(try decoder.decode(CredentialDraft.self, from: legacy).details == nil)
}

@Test func optionalDraftValidationProtectsLinksLimitsAndDateOrder() {
    var details = CredentialDraftDetails()
    #expect(details.isEmpty); #expect(details.validationIssue == nil)
    details.evidence = [CredentialDraftEvidence()]
    #expect(details.isEmpty); #expect(details.validationIssue == nil)
    details.evidence[0].name = "A project"
    #expect(details.validationIssue == .link)
    details.evidence[0].url = "https://example.org/work"
    #expect(details.validationIssue == nil)
    details.criteriaURL = "javascript:alert(1)"; #expect(details.validationIssue == .link)
    details.criteriaURL = "https://user:secret@example.org/work"; #expect(details.validationIssue == .link)
    details.criteriaURL = ""; details.activityStartDate = Date(timeIntervalSince1970: 200); details.activityEndDate = Date(timeIntervalSince1970: 100)
    #expect(details.validationIssue == .dateOrder)
    details.activityStartDate = nil; details.role = String(repeating: "x", count: 201)
    #expect(details.validationIssue == .limits)
}

@Test func dateOnlyExpiryIncludesTheSelectedLocalDayAcrossDaylightSaving() throws {
    var calendar = Calendar(identifier: .gregorian); calendar.timeZone = try #require(TimeZone(identifier: "America/New_York"))
    let picked = try #require(calendar.date(from: DateComponents(year: 2026, month: 11, day: 1, hour: 12)))
    let start = CredentialDraftDetails.dateOnly(picked, expires: false, calendar: calendar)
    let expiry = CredentialDraftDetails.dateOnly(picked, expires: true, calendar: calendar)
    #expect(calendar.component(.day, from: expiry) == 1)
    #expect(calendar.component(.hour, from: expiry) == 23)
    #expect(expiry.timeIntervalSince(start) == 25 * 3600 - 1)
}

@Test func invalidOptionalDraftLeavesTheSampleCollectionAndCreationsUntouched() async throws {
    let service = DemoCredentialService(); let before = await service.snapshot()
    var details = CredentialDraftDetails(); details.evidence = [CredentialDraftEvidence(url: "file:///tmp/private")]
    await #expect(throws: ClientError.invalidDraft) { try await service.create(draft: CredentialDraft(title: "Test", summary: "Test", kind: .achievement, details: details)) }
    #expect(await service.snapshot().credentials.count == before.credentials.count)
    #expect(try await service.creations().credentials.isEmpty)
}
