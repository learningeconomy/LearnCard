#if DEBUG
import Foundation
import LearnCardNativeCore
import LearnCardNativeSDK

/// Isolated display/publication states for --demo only. Never reads an identity or publishes a real link.
actor CredentialDetailFixture: CredentialService {
    private let demo = DemoCredentialService()
    private var attempts = 0
    private var request: String?
    private var statusAttempts: [String: Int] = [:]
    func snapshot() -> CollectionSnapshot {
        var details = CredentialDetails()
        details.criteria = [CredentialNarrative(text: String(repeating: "Complete supervised community work, reflect on your progress, and demonstrate thoughtful leadership in a team. ", count: 6) + "Finish with a project reflection.", url: URL(string: "https://example.org/criteria"))]
        details.alignments = ["Adaptability", "Teamwork", "Self advocacy", "Digital confidence"].map {
            CredentialAlignment(name: $0, text: "Apply this skill in unfamiliar situations and reflect on what you learned.", framework: "Community skills framework", code: "3.6", url: URL(string: "https://example.org/skills"))
        }
        details.evidence = [CredentialNarrative(name: "Community project", text: "A reflection and portfolio of completed work.", url: URL(string: "https://example.org/project"))]
        details.fields = [CredentialDetailField(kind: "role", value: "Peer mentor"), CredentialDetailField(kind: "term", value: "Autumn 2026"), CredentialDetailField(kind: "creditsEarned", value: "3")]
        details.results = [CredentialResult(name: "Project assessment", value: "Distinction", text: "Assessed against the project rubric.")]
        details.activityStartDate = Date(timeIntervalSince1970: 1_772_323_200)
        details.activityEndDate = Date(timeIntervalSince1970: 1_790_000_000)
        details.validUntil = Date(timeIntervalSince1970: 1_840_000_000)
        let rich = Credential(id: "detail-rich", title: "Community leadership", issuer: "Community Skills Lab",
            summary: String(repeating: "Recognizing thoughtful leadership, collaboration, and the care you brought to your community. ", count: 5),
            kind: .achievement, date: .now, isSample: false,
            signedPayload: "{\"isolatedDisplayFixture\":true}", signatureState: .verified, details: details)
        let unavailable = Credential(id: "detail-unavailable", title: "A credential to check", issuer: "Example issuer", summary: "Sparse verification display fixture.", kind: .achievement,
            date: .now.addingTimeInterval(-100), isSample: false, signatureState: .unavailable)
        let failed = Credential(id: "detail-not-verified", title: "A signature to review", issuer: "Example issuer", summary: "No lifecycle status can be inferred from this result.", kind: .achievement,
            date: .now.addingTimeInterval(-200), isSample: false, signatureState: .notVerified)
        let statuses = ["revoked", "suspended", "no-status"].enumerated().map { offset, name in
            Credential(id: "detail-\(name)", title: "Status example: \(name)", issuer: "Example issuer", summary: "Isolated lifecycle fixture; no issuer status is changed.", kind: .achievement,
                date: .now.addingTimeInterval(Double(-300 - offset)), isSample: false, signatureState: .verified)
        }
        return CollectionSnapshot(credentials: [rich, unavailable, failed] + statuses, offers: [], activity: [])
    }
    func credentialStatus(credentialID: String) async throws -> CredentialStatusCheck {
        statusAttempts[credentialID, default: 0] += 1
        try await Task.sleep(for: .milliseconds(650))
        let state: CredentialStatusCheck.State
        switch credentialID {
        case "detail-rich": state = statusAttempts[credentialID] == 1 ? .active : .unavailable
        case "detail-revoked": state = .revoked
        case "detail-suspended": state = statusAttempts[credentialID] == 1 ? .suspended : .active
        case "detail-no-status": state = .notProvided
        default: state = .unavailable
        }
        return CredentialStatusCheck(state: state, source: [.active, .revoked, .suspended].contains(state) ? .network : nil,
            checkedAt: [.active, .revoked, .suspended].contains(state) ? .now : nil, purposes: [.revocation, .suspension])
    }
    func claim(offerID: String) async throws -> CollectionSnapshot { throw AccountError.unavailable }
    func create(title: String, summary: String, kind: CredentialKind) async throws -> CollectionSnapshot { try await demo.create(title: title, summary: summary, kind: kind) }
    func create(draft: CredentialDraft) async throws -> CollectionSnapshot { try await demo.create(draft: draft) }
    func creations(cursor: String?) async throws -> CreationPage { CreationPage(credentials: []) }
    func send(credentialID: String, recipient: String) async throws -> CollectionSnapshot { throw AccountError.unavailable }
    func share(credentialIDs: [String], title: String, requestID: String, passcode: String?) async throws -> CredentialShare {
        guard credentialIDs == ["detail-rich"], title == "Community leadership", passcode == nil, request == nil || request == requestID else { throw AccountError.unavailable }
        request = requestID; attempts += 1
        try await Task.sleep(for: .milliseconds(500))
        if attempts == 1 { throw AccountError.connection }
        if attempts == 2 { return CredentialShare(pending: true) }
        guard attempts == 3 else { throw AccountError.unavailable }
        return CredentialShare(url: URL(string: "https://example.invalid/presentations/native-detail#content-key=fixture-only"))
    }
}
#endif
