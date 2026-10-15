import Foundation
import XCTest
import CoreImage
import ImageIO
import UniformTypeIdentifiers
import LearnCardNativeCore
@testable import LearnCardNativeSDK

private let publicClaim = "https://staging.learncard.app/claim/boost?boostUri=lc%3Anetwork%3Astaging.network.learncard.com%2Ftrpc%3Aboost%3Asample&challenge=synthetic-token"
@MainActor private final class ClaimStub: ClaimService {
    var previews = 0, issues = 0, finishes = 0
    var lostReply = false, failFinish = false, reconcileKnown = false
    var previewGate: CheckedContinuation<Void, Never>?
    var issueGate: CheckedContinuation<Void, Never>?
    var holdPreview = false, holdIssue = false
    let value = Credential(id: "issued", title: "Sample", issuer: "Public Studio", summary: "Unsigned test", kind: .achievement, date: .now, category: "Accomplishment")
    func preview(_ link: NativeClaimLink) async throws -> Credential {
        previews += 1
        if holdPreview { await withCheckedContinuation { previewGate = $0 } }
        return value
    }
    func issue(_ link: NativeClaimLink) async throws -> ClaimReceipt {
        issues += 1
        if holdIssue { await withCheckedContinuation { issueGate = $0 } }
        if lostReply { throw ClaimError.connection }
        return ClaimReceipt(uri: value.id)
    }
    func finish(_ receipt: ClaimReceipt) async throws -> Credential { finishes += 1; if failFinish { throw ClaimError.connection }; return value }
    func reconcile(_ link: NativeClaimLink, since: Date) -> ClaimReceipt? { reconcileKnown ? ClaimReceipt(uri: value.id) : nil }
}

private actor RefusingClaimJournal: ClaimJournal {
    func read(_ key: String) -> ClaimReceipt? { nil }
    func write(_ receipt: ClaimReceipt, key: String) throws { throw ClaimError.storage }
    func remove(_ key: String) {}
}
@MainActor private final class HeldClaimJournal: ClaimJournal {
    var receipt: ClaimReceipt?
    var gate: CheckedContinuation<Void, Never>?
    func read(_ key: String) -> ClaimReceipt? { receipt }
    func write(_ receipt: ClaimReceipt, key: String) async { self.receipt = receipt; await withCheckedContinuation { gate = $0 } }
    func remove(_ key: String) { receipt = nil }
}
@MainActor final class ClaimFlowTests: XCTestCase {
    func testBackgroundBeforeIssuanceRemovesUnusedAttemptMarker() async throws {
        let journal = HeldClaimJournal(), service = ClaimStub(), flow = NativeClaimStore(journal: journal)
        flow.connect(service: service, accountID: "alice"); await flow.receive(publicClaim)
        let claim = Task { await flow.confirm() }
        while journal.gate == nil { await Task.yield() }
        flow.lock(); journal.gate?.resume(); await claim.value
        XCTAssertEqual(service.issues, 0); XCTAssertNil(journal.receipt)
        flow.connect(service: service, accountID: "alice")
        for _ in 0..<50 where flow.phase != "review" { await Task.yield() }
        XCTAssertEqual(flow.phase, "review")
    }
    func testProtectedJournalFailurePreventsIssuance() async throws {
        let service = ClaimStub(), flow = NativeClaimStore(journal: RefusingClaimJournal())
        flow.connect(service: service, accountID: "alice"); await flow.receive(publicClaim); await flow.confirm()
        XCTAssertEqual(service.issues, 0); XCTAssertEqual(flow.error, .storage); XCTAssertTrue(flow.canRetry)
    }
    func testStagingParserPreservesEncodedCapabilityAndRejectsOtherProtocols() throws {
        let parsed = try NativeClaimLink(publicClaim.replacingOccurrences(of: "synthetic-token", with: "a%2Bb%3D"))
        XCTAssertEqual(parsed.challenge, "a+b=")
        XCTAssertEqual(parsed.boostURI, "lc:network:staging.network.learncard.com/trpc:boost:sample")
        XCTAssertEqual(try NativeClaimLink(publicClaim.replacingOccurrences(of: "https://staging.learncard.app/claim/boost", with: "learncard-lab://claim")), try NativeClaimLink(publicClaim))
        for value in ["https://learncard.app/claim/boost?boostUri=x&challenge=y", publicClaim + "&challenge=second", publicClaim + "#private", publicClaim.replacingOccurrences(of: "staging.learncard.app", with: "staging.learncard.app.evil.test"), publicClaim.replacingOccurrences(of: "https://", with: "http://"), publicClaim.replacingOccurrences(of: "staging.learncard.app", with: "user@staging.learncard.app"), publicClaim.replacingOccurrences(of: "/claim/boost", with: "/share/other"), publicClaim.replacingOccurrences(of: "staging.network", with: "network"), "openid-credential-offer://?credential_offer=x", "learncard-native-demo://claim/first-aid", publicClaim + String(repeating: "a", count: 9000)] {
            XCTAssertThrowsError(try NativeClaimLink(value))
        }
        XCTAssertNoThrow(try NativeClaimLink("learncard-native-demo://claim/first-aid", allowDemo: true))
    }
    func testReviewNeverIssuesAndConfirmationCannotIssueTwice() async throws {
        let service = ClaimStub(), flow = NativeClaimStore(journal: MemoryClaimJournal())
        flow.connect(service: service, accountID: "alice"); await flow.receive(publicClaim)
        XCTAssertEqual(flow.phase, "review"); XCTAssertEqual(service.issues, 0)
        await flow.confirm(); await flow.confirm()
        XCTAssertEqual(service.issues, 1); XCTAssertEqual(flow.phase, "complete"); XCTAssertEqual(flow.credential?.id, "issued")
    }
    func testPendingLinkWaitsForSignInAndRecoveryThenResumesReview() async throws {
        let service = ClaimStub(), flow = NativeClaimStore(journal: MemoryClaimJournal())
        await flow.receive(publicClaim); XCTAssertEqual(flow.phase, "signIn"); XCTAssertNil(flow.credential)
        flow.isPresented = false // Return to the real sign-in/recovery screen without losing intent.
        flow.connect(service: service, accountID: "alice")
        for _ in 0..<50 where flow.phase != "review" { await Task.yield() }
        XCTAssertEqual(flow.phase, "review"); XCTAssertTrue(flow.isPresented); XCTAssertEqual(service.issues, 0)
        flow.clear(); XCTAssertNil(flow.link)
    }
    func testLockDropsPreviewAndLateReadCannotReopenIt() async throws {
        let service = ClaimStub(), flow = NativeClaimStore(journal: MemoryClaimJournal()); service.holdPreview = true
        flow.connect(service: service, accountID: "alice")
        let read = Task { await flow.receive(publicClaim) }
        while service.previewGate == nil { await Task.yield() }
        flow.lock(); service.previewGate?.resume(); await read.value
        XCTAssertNil(flow.credential); XCTAssertFalse(flow.isPresented); XCTAssertEqual(flow.phase, "signIn")
        service.holdPreview = false; flow.connect(service: service, accountID: "alice")
        for _ in 0..<50 where flow.phase != "review" { await Task.yield() }
        XCTAssertEqual(flow.phase, "review")
        flow.lock(); flow.connect(service: service, accountID: "bob"); XCTAssertNil(flow.link); XCTAssertNil(flow.credential)
    }
    func testKnownReceiptFinishesAfterRelaunchWithoutIssuingAgain() async throws {
        let journal = MemoryClaimJournal(), service = ClaimStub(), first = NativeClaimStore(journal: journal)
        first.connect(service: service, accountID: "alice"); await first.receive(publicClaim); service.failFinish = true
        await first.confirm(); XCTAssertEqual(first.phase, "failed"); XCTAssertEqual(service.issues, 1)
        first.lock(); service.failFinish = false
        let next = NativeClaimStore(journal: journal); next.connect(service: service, accountID: "alice"); await next.receive(publicClaim)
        XCTAssertEqual(next.phase, "complete"); XCTAssertEqual(service.issues, 1)
    }
    func testLostResponseRemainsBlockedAcrossNewStoreAndReconcilesWithoutIssuing() async throws {
        let journal = MemoryClaimJournal(), service = ClaimStub(), first = NativeClaimStore(journal: journal)
        first.connect(service: service, accountID: "alice"); await first.receive(publicClaim); service.lostReply = true
        await first.confirm(); XCTAssertEqual(first.error, .uncertain); XCTAssertEqual(service.issues, 1)
        let next = NativeClaimStore(journal: journal); next.connect(service: service, accountID: "alice"); await next.receive(publicClaim)
        XCTAssertEqual(next.error, .uncertain); await next.confirm(); XCTAssertEqual(service.issues, 1)
        service.reconcileKnown = true; await next.resolve(); XCTAssertEqual(next.phase, "complete"); XCTAssertEqual(service.issues, 1)
    }
    func testLateIssueReceiptIsSavedButCannotUpdateLockedUI() async throws {
        let journal = MemoryClaimJournal(), service = ClaimStub(), flow = NativeClaimStore(journal: journal)
        flow.connect(service: service, accountID: "alice"); await flow.receive(publicClaim); service.holdIssue = true
        let claim = Task { await flow.confirm() }
        while service.issueGate == nil { await Task.yield() }
        flow.lock(); service.issueGate?.resume(); await claim.value
        XCTAssertNil(flow.credential); XCTAssertFalse(flow.isPresented); XCTAssertEqual(service.finishes, 0)
        flow.connect(service: service, accountID: "alice")
        for _ in 0..<50 where flow.phase != "complete" { await Task.yield() }
        XCTAssertEqual(flow.phase, "complete"); XCTAssertEqual(service.issues, 1)
    }
    func testKeychainReceiptIsAccountScopedAndContainsNoClaimCapability() async throws {
        let vault = KeychainVault(service: "org.learncard.claim-tests.\(UUID().uuidString)"), journal = KeychainClaimJournal(vault: vault)
        let link = try NativeClaimLink(publicClaim), key = link.receiptKey(accountID: "alice")
        XCTAssertFalse(key.contains(link.challenge)); XCTAssertNotEqual(key, link.receiptKey(accountID: "bob"))
        try await journal.write(ClaimReceipt(uri: "known-owned-uri"), key: key)
        let loaded = try await KeychainClaimJournal(vault: vault).read(key); XCTAssertEqual(loaded?.uri, "known-owned-uri")
        let data = try await vault.read(key); XCTAssertFalse(String(data: data!, encoding: .utf8)!.contains(link.challenge))
        try await journal.remove(key)
    }
    func testActualQRPhotoDecoderAndUnreadableImage() throws {
        let filter = CIFilter(name: "CIQRCodeGenerator")!; filter.setValue(Data(publicClaim.utf8), forKey: "inputMessage")
        let image = filter.outputImage!.transformed(by: CGAffineTransform(scaleX: 8, y: 8)), cg = CIContext().createCGImage(image, from: image.extent)!
        let data = NSMutableData(), destination = CGImageDestinationCreateWithData(data, UTType.png.identifier as CFString, 1, nil)!
        CGImageDestinationAddImage(destination, cg, nil); XCTAssertTrue(CGImageDestinationFinalize(destination))
        XCTAssertEqual(try QRImageDecoder.decode(data as Data), publicClaim)
        XCTAssertThrowsError(try QRImageDecoder.decode(Data("not an image".utf8)))
        filter.setValue(Data("another synthetic code".utf8), forKey: "inputMessage")
        let second = filter.outputImage!.transformed(by: CGAffineTransform(scaleX: 8, y: 8))
        let other = CIContext().createCGImage(second, from: second.extent)!
        let width = cg.width + other.width + 120, height = max(cg.height, other.height) + 80
        let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        context.setFillColor(CGColor(gray: 1, alpha: 1)); context.fill(CGRect(x: 0, y: 0, width: width, height: height))
        context.draw(cg, in: CGRect(x: 30, y: 30, width: cg.width, height: cg.height))
        context.draw(other, in: CGRect(x: cg.width + 90, y: 30, width: other.width, height: other.height))
        let pair = NSMutableData(), pairDestination = CGImageDestinationCreateWithData(pair, UTType.png.identifier as CFString, 1, nil)!
        CGImageDestinationAddImage(pairDestination, context.makeImage()!, nil); XCTAssertTrue(CGImageDestinationFinalize(pairDestination))
        XCTAssertThrowsError(try QRImageDecoder.decode(pair as Data)) { XCTAssertEqual($0 as? QRImageError, .multiple) }
    }
}
