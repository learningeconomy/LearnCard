import XCTest
import LearnCardNativeCore
@testable import LearnCardNativeSDK

@MainActor private final class OfferReader: CredentialOfferService {
    var page: CredentialOfferPage
    var failRead = false
    private(set) var seenCachedIDs: [String] = []
    private let initial: CollectionSnapshot

    init(initial: CollectionSnapshot) {
        self.initial = initial
        page = CredentialOfferPage(ids: initial.offers.map(\.id), credentials: [])
    }

    func snapshot() async throws -> CollectionSnapshot { initial }
    func credentialOffers(cachedIDs: [String]) async throws -> CredentialOfferPage {
        seenCachedIDs = cachedIDs
        if failRead { throw AccountError.connection }
        return page
    }

    func claim(offerID: String) async throws -> CollectionSnapshot { throw AccountError.unavailable }
    func create(title: String, summary: String, kind: CredentialKind) async throws -> CollectionSnapshot {
        throw AccountError.unavailable
    }
    func create(draft: CredentialDraft) async throws -> CollectionSnapshot { throw AccountError.unavailable }
    func creations(cursor: String?) async throws -> CreationPage { throw AccountError.unavailable }
    func send(credentialID: String, recipient: String) async throws -> CollectionSnapshot { throw AccountError.unavailable }
    func share(credentialIDs: [String], title: String, requestID: String, passcode: String?) async throws -> CredentialShare {
        throw AccountError.unavailable
    }
}

@MainActor final class CredentialArrivalTests: XCTestCase {
    func testNewOfferUpdatesInboxAndPreservesPassportWithoutRepeatAlerts() async {
        let known = credential("known")
        let incoming = credential("incoming")
        let saved = credential("saved")
        let activity = Activity(title: "Previously saved", detail: saved.title, symbol: "tray")
        let service = OfferReader(initial: CollectionSnapshot(
            credentials: [saved], offers: [known], activity: [activity], hasMore: true
        ))
        let store = NativeAppStore(service: service)

        await store.refresh()
        await store.refreshCredentialOffers()
        XCTAssertEqual(service.seenCachedIDs, [known.id])
        XCTAssertEqual(store.inboxCount, 1)
        XCTAssertNil(store.latestCredentialArrival)

        service.page = CredentialOfferPage(ids: [incoming.id, known.id], credentials: [incoming])
        await store.refreshCredentialOffers()
        XCTAssertEqual(store.inboxCount, 2)
        XCTAssertEqual(store.latestCredentialArrival?.id, incoming.id)
        XCTAssertEqual(store.snapshot?.offers, [incoming, known])
        XCTAssertEqual(store.snapshot?.credentials, [saved])
        XCTAssertEqual(store.snapshot?.activity.map(\.id), [activity.id])
        XCTAssertEqual(store.snapshot?.hasMore, true)

        store.dismissCredentialArrival()
        service.page = CredentialOfferPage(ids: [incoming.id, known.id], credentials: [])
        await store.refreshCredentialOffers()
        XCTAssertEqual(Set(service.seenCachedIDs), Set([incoming.id, known.id]))
        XCTAssertNil(store.latestCredentialArrival)

        service.page = CredentialOfferPage(ids: [known.id], credentials: [])
        await store.refreshCredentialOffers()
        XCTAssertEqual(store.inboxCount, 1)
        service.page = CredentialOfferPage(ids: [incoming.id, known.id], credentials: [incoming])
        await store.refreshCredentialOffers()
        XCTAssertEqual(store.inboxCount, 2)
        XCTAssertNil(store.latestCredentialArrival)
    }

    func testFailedAndIncompleteOfferReadsRetainInboxWithoutAnAlert() async {
        let known = credential("known")
        let service = OfferReader(initial: CollectionSnapshot(credentials: [], offers: [known], activity: []))
        let store = NativeAppStore(service: service)
        await store.refresh()

        service.failRead = true
        await store.refreshCredentialOffers()
        service.failRead = false
        service.page = CredentialOfferPage(ids: ["missing"], credentials: [])
        await store.refreshCredentialOffers()

        XCTAssertEqual(store.snapshot?.offers, [known])
        XCTAssertEqual(store.inboxCount, 1)
        XCTAssertNil(store.latestCredentialArrival)
        XCTAssertNil(store.error)
        XCTAssertNil(store.refreshError)
    }

    private func credential(_ id: String) -> Credential {
        Credential(id: id, title: id, issuer: "Community Skills Lab", summary: "Sample credential",
                   kind: .learning, date: Date(timeIntervalSince1970: 1))
    }
}
