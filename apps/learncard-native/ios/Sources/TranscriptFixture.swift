#if DEBUG
import Foundation
import LearnCardNativeCore
import LearnCardNativeSDK

/// In-memory, unsigned example; no real account or issuer is contacted.
actor TranscriptFixture: CredentialService {
    private var claimed = false
    private let demo = DemoCredentialService()

    private var transcript: Credential {
        func course(_ name: String, _ code: String, _ grade: String) -> CredentialTranscriptRecord {
            CredentialTranscriptRecord(name: name, code: code,
                credits: CredentialTranscriptCredits(amount: 0.5, unit: "credit", kind: "earned"),
                results: [CredentialTranscriptResult(label: "Grade", value: grade)])
        }
        var details = CredentialDetails()
        details.transcript = CredentialTranscript(kind: "academic", learner: "Maya Chen", groups: [
            CredentialTranscriptGroup(kind: "courses", term: "Fall 2025", records: [
                course("English Language Arts", "ENG 11", "A"), course("Algebra II", "MATH 11", "A−"),
                course("Biology", "BIO 11", "B+")]),
            CredentialTranscriptGroup(kind: "courses", term: "Spring 2026", records: [
                course("World History", "HIST 11", "A"), course("Environmental Science", "SCI 11", "A−"),
                course("Digital Media", "ART 11", "A")])
        ])
        return Credential(id: "detail-transcript", title: "Grade 11 Transcript", issuer: "Westbridge School",
            summary: "A record of Maya’s Grade 11 coursework.", kind: .learning,
            date: Date(timeIntervalSince1970: 1_782_777_600), category: "LearningHistory", details: details)
    }

    func snapshot() async throws -> CollectionSnapshot {
        let base = await demo.snapshot()
        return CollectionSnapshot(credentials: claimed ? [transcript] + base.credentials : base.credentials,
            offers: claimed ? base.offers : [transcript] + base.offers, activity: base.activity)
    }
    func claim(offerID: String) async throws -> CollectionSnapshot {
        guard offerID == "detail-transcript", !claimed else { throw ClientError.offerUnavailable }
        claimed = true
        return try await snapshot()
    }
    func create(title: String, summary: String, kind: CredentialKind) async throws -> CollectionSnapshot { throw AccountError.unavailable }
    func create(draft: CredentialDraft) async throws -> CollectionSnapshot { throw AccountError.unavailable }
    func creations(cursor: String?) async throws -> CreationPage { CreationPage(credentials: []) }
    func send(credentialID: String, recipient: String) async throws -> CollectionSnapshot { throw AccountError.unavailable }
    func share(credentialIDs: [String], title: String, requestID: String, passcode: String?) async throws -> CredentialShare {
        guard claimed, credentialIDs == ["detail-transcript"] else { throw AccountError.unavailable }
        return CredentialShare(sampleText: transcript.sampleShareText)
    }
}
#endif
