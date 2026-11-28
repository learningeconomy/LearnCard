import Foundation
import XCTest
import LearnCardNativeCore
@testable import LearnCardNativeSDK

final class CredentialDetailTests: XCTestCase {
    func testLegacyCredentialDecodesWithoutProjectingAnEnglishSummaryIntoVerifiedState() throws {
        let value: [String: Any] = ["id": "legacy", "title": "Legacy credential", "issuer": "Issuer", "summary": "About",
            "kind": "Achievements", "date": "2026-10-17T00:00:00Z", "createdByMe": false, "isSample": false,
            "signedPayload": "{\"original\":true}", "verificationSummary": "Signature checked. Issuer trust and status not checked."]
        let envelope = String(data: try JSONSerialization.data(withJSONObject: ["ok": true, "value": value]), encoding: .utf8)!
        let credential: Credential = try AccountReply.decode(envelope, method: "snapshot")
        XCTAssertNil(credential.signatureState); XCTAssertNil(credential.details)
        XCTAssertEqual(credential.signedPayload, "{\"original\":true}")
    }

    func testDetailWireFieldsRetainProofScopeFractionalDatesReferencesAndZeroResults() throws {
        var details = CredentialDetails()
        details.criteria = [CredentialNarrative(text: "Complete the work.", url: URL(string: "https://example.org/criteria"))]
        details.alignments = [CredentialAlignment(name: "Adaptability", framework: "Skills", code: "3.6")]
        details.fields = [CredentialDetailField(kind: "creditsEarned", value: "0")]
        details.results = [CredentialResult(name: "Hours", value: "0")]
        details.validUntil = Date(timeIntervalSince1970: 1_800_000_000.125)
        let credential = Credential(id: "rich", title: "Rich credential", issuer: "Issuer", summary: "About", kind: .achievement,
            date: .now, isSample: false, signedPayload: "{\"proof\":\"unchanged\"}", signatureState: .verified, details: details)
        let encoder = JSONEncoder(); encoder.dateEncodingStrategy = .custom { date, encoder in
            var container = encoder.singleValueContainer(); let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]; try container.encode(formatter.string(from: date))
        }
        let value = try JSONSerialization.jsonObject(with: encoder.encode(credential))
        let envelope = String(data: try JSONSerialization.data(withJSONObject: ["ok": true, "value": value]), encoding: .utf8)!
        let decoded: Credential = try AccountReply.decode(envelope, method: "snapshot")
        XCTAssertEqual(decoded.signatureState, .verified)
        XCTAssertEqual(decoded.details, details)
        XCTAssertEqual(decoded.signedPayload, credential.signedPayload)
    }
    func testTranscriptWireProjectionPreservesSparseDetailsAndSignedPayload() throws {
        let value: [String: Any] = ["id": "transcript", "title": "Transcript", "issuer": "School", "summary": "About",
            "kind": "Learning", "date": "2026-06-01T00:00:00Z", "createdByMe": false, "isSample": false,
            "signedPayload": "{\"proof\":\"unchanged\"}", "details": [
                "criteria": [], "alignments": [], "evidence": [], "fields": [], "results": [],
                "transcript": ["kind": "academic", "learner": "Maya Chen", "partial": true, "groups": [[
                    "kind": "courses", "term": "Fall 2025", "records": [["name": "Biology",
                        "credits": ["amount": 0, "kind": "earned"], "results": [["label": "Grade", "value": "A"]]]]]]]]]
        let envelope = String(data: try JSONSerialization.data(withJSONObject: ["ok": true, "value": value]), encoding: .utf8)!
        let credential: Credential = try AccountReply.decode(envelope, method: "snapshot")
        let transcript = try XCTUnwrap(credential.details?.transcript)
        XCTAssertEqual(transcript.learner, "Maya Chen"); XCTAssertEqual(transcript.partial, true)
        XCTAssertEqual(transcript.groups.first?.records.first?.credits?.amount, 0)
        XCTAssertNil(transcript.groups.first?.records.first?.credits?.unit)
        XCTAssertEqual(transcript.groups.first?.records.first?.results.first?.value, "A")
        XCTAssertEqual(credential.signedPayload, "{\"proof\":\"unchanged\"}")
    }

}
