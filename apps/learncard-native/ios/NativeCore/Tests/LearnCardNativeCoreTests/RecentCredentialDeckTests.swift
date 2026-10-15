import Foundation
import Testing
@testable import LearnCardNativeCore

private func deckRecord(_ id: String, offset: Double, category: String = "Achievement") -> Credential {
    Credential(id: id, title: "Moment \(id)", issuer: "Studio", summary: "Original record",
               kind: .achievement, date: Date(timeIntervalSince1970: 100_000 + offset), signedPayload: "original-\(id)", category: category)
}

@Test func recentDeckUsesFiveLatestDistinctRecordsInCategoryAndPreservesPayloads() {
    let records = (1...8).reversed().map { deckRecord("\($0)", offset: -Double($0)) }
        + [deckRecord("family", offset: 100, category: "Family"), deckRecord("portfolio", offset: 50, category: "Accomplishment"), deckRecord("1", offset: -50)]
    let deck = RecentCredentialDeck.latest(in: records, category: .achievement)
    #expect(deck.map(\.id) == ["1", "2", "3", "4", "5"])
    #expect(deck.map(\.signedPayload) == ["original-1", "original-2", "original-3", "original-4", "original-5"])
    #expect(RecentCredentialDeck.latest(in: records).first?.id == "portfolio")
    #expect(RecentCredentialDeck.latest(in: records, category: .portfolio).map(\.id) == ["portfolio"])
    #expect(RecentCredentialDeck.latest(in: records, category: .qualification).isEmpty)
}

@Test func deckPositionIsBoundedRetainsIdentityOnRefreshAndResetsIfRemoved() {
    var deck = RecentCredentialDeck(ids: ["a", "a", "b", "c", "d", "e", "f"])
    #expect(deck.ids == ["a", "b", "c", "d", "e"])
    let beforeFirst = deck.move(.newer); #expect(!beforeFirst)
    for _ in 0..<10 { deck.move(.older) }
    #expect(deck.activeID == "e"); #expect(deck.index == 4)
    let afterLast = deck.move(.older); let returned = deck.move(.newer)
    #expect(!afterLast); #expect(returned); #expect(deck.activeID == "d")
    deck.reconcile(ids: ["new", "a", "d", "b", "c"])
    #expect(deck.activeID == "d"); #expect(deck.index == 2)
    deck.reconcile(ids: ["new", "a"]); #expect(deck.activeID == "new"); #expect(deck.index == 0)
    deck.reconcile(ids: []); let movedEmpty = deck.move(.older)
    #expect(deck.activeID == nil); #expect(!movedEmpty)
}

@Test func horizontalIntentAndThresholdsPreserveScrollingAndCancelledDrags() {
    #expect(!RecentCredentialDeck.horizontalIntent(x: 20, y: 100))
    #expect(!RecentCredentialDeck.horizontalIntent(x: .nan, y: 1))
    #expect(RecentCredentialDeck.swipe(x: 20, y: 2, velocity: 20, width: 360, rightToLeft: false) == nil)
    #expect(RecentCredentialDeck.swipe(x: 30, y: 90, velocity: 900, width: 360, rightToLeft: false) == nil)
    #expect(RecentCredentialDeck.swipe(x: -20, y: 2, velocity: 900, width: 360, rightToLeft: false) == nil)
    #expect(RecentCredentialDeck.swipe(x: -20, y: 2, velocity: -900, width: 360, rightToLeft: false) == .older)
    #expect(RecentCredentialDeck.swipe(x: -100, y: 5, velocity: -20, width: 360, rightToLeft: false) == .older)
    #expect(RecentCredentialDeck.swipe(x: 100, y: 5, velocity: 20, width: 360, rightToLeft: false) == .newer)
    #expect(RecentCredentialDeck.swipe(x: 100, y: 5, velocity: 20, width: 360, rightToLeft: true) == .older)
    #expect(RecentCredentialDeck.swipe(x: 100, y: 5, velocity: 20, width: 0, rightToLeft: true) == nil)
}

@Test func equalDatesKeepExistingCollectionOrderAndBrowsingDoesNotChangeRecords() {
    let records = [deckRecord("design", offset: 0), deckRecord("community", offset: 0)]
    let latest = RecentCredentialDeck.latest(in: records)
    #expect(latest.map(\.id) == ["design", "community"])
    var cursor = RecentCredentialDeck(ids: latest.map(\.id)); cursor.move(.older); cursor.move(.newer)
    #expect(latest == records); #expect(cursor.activeID == "design")
}
