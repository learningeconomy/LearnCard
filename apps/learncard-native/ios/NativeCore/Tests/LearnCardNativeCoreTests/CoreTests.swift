import Foundation
import Testing
@testable import LearnCardNativeCore

@Test func claimMovesAnOfferAndCannotDuplicateIt() async throws {
    let service = DemoCredentialService()
    let result = try await service.claim(offerID: "first-aid")
    #expect(result.credentials.count == 4)
    #expect(result.offers.count == 1)
    #expect(result.activity.count == 1)
    await #expect(throws: ClientError.offerUnavailable) {
        try await service.claim(offerID: "first-aid")
    }
    #expect(await service.snapshot().credentials.count == 4)
}

@Test func createThenSendRecordsActivityWithoutRemovingTheOriginal() async throws {
    let service = DemoCredentialService()
    let created = try await service.create(title: "  Thank you  ", summary: "For being there.", kind: .achievement)
    let credential = try #require(created.credentials.first)
    #expect(credential.title == "Thank you")
    #expect(credential.createdByMe)
    let sent = try await service.send(credentialID: credential.id, recipient: "  Alex  ")
    #expect(sent.credentials.count == 4)
    #expect(sent.activity.first?.detail == "Thank you → Alex")
    #expect(credential.sampleShareText.contains("unsigned"))
}

@Test func receivedSamplesCannotBeReissuedAsMine() async {
    let service = DemoCredentialService()
    await #expect(throws: ClientError.cannotSend) {
        try await service.send(credentialID: "design", recipient: "Alex")
    }
}

@Test func invalidDraftsAndRecipientsLeaveStateUntouched() async throws {
    let service = DemoCredentialService()
    await #expect(throws: ClientError.invalidDraft) {
        try await service.create(title: " \n ", summary: "Test", kind: .learning)
    }
    await #expect(throws: ClientError.invalidDraft) {
        try await service.create(title: String(repeating: "a", count: 101), summary: "Test", kind: .learning)
    }
    let created = try await service.create(title: "Test", summary: "Test", kind: .learning)
    let credential = try #require(created.credentials.first)
    await #expect(throws: ClientError.invalidRecipient) {
        try await service.send(credentialID: credential.id, recipient: " ")
    }
    #expect(await service.snapshot().activity.count == 1)
}

@Test func concurrentClaimsOnlyAddOneCredential() async {
    let service = DemoCredentialService()
    await withTaskGroup(of: Bool.self) { group in
        for _ in 0..<8 {
            group.addTask { (try? await service.claim(offerID: "mentor")) != nil }
        }
        var successes = 0
        for await success in group { if success { successes += 1 } }
        #expect(successes == 1)
    }
    #expect(await service.snapshot().credentials.count == 4)
}

@Test func dedicatedSampleLinkResolves() throws {
    let url = try #require(URL(string: "learncard-native-demo://claim/first-aid"))
    #expect(try DemoClaimLink(url: url).offerID == "first-aid")
}

@Test(arguments: [
    "https://learncard.app/claim/boost?boostUri=example",
    "https://claim/first-aid", "learncard-native-demo://evil/first-aid",
    "learncard-native-demo://claim/unknown", "learncard-native-demo://claim/first-aid/extra",
    "learncard-native-demo://claim/first-aid?challenge=x", "learncard-native-demo://claim/first-aid#x",
    "learncard-native-demo://user@claim/first-aid", "learncard-native-demo://claim:80/first-aid",
]) func rejectNonDemoAndMalformedLinks(value: String) throws {
    let url = try #require(URL(string: value))
    #expect(throws: ClientError.unsupportedLink) { try DemoClaimLink(url: url) }
}
