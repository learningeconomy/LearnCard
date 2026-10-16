import Foundation
import Testing
@testable import LearnCardNativeCore

@Test func homeDoesNotConfuseUnloadedFailedPartialAndEmptyPassports() {
    #expect(LearnerHomeSummary(snapshot: nil, hasError: false).content == .loading)
    #expect(LearnerHomeSummary(snapshot: nil, hasError: true).content == .unavailable)
    let empty = CollectionSnapshot(credentials: [], offers: [], activity: [])
    #expect(LearnerHomeSummary(snapshot: empty, hasError: false).content == .empty)
    #expect(LearnerHomeSummary(snapshot: empty, hasError: true).content == .unavailable)
    let partial = CollectionSnapshot(credentials: [], offers: [], activity: [], hasMore: true)
    #expect(LearnerHomeSummary(snapshot: partial, hasError: false).content == .partial)
}
@Test func homeUsesRecentPersonalCredentialsAndPreservesThemDuringRefreshFailure() {
    func record(_ id: String, _ date: Double, _ category: String = "Achievement") -> Credential {
        Credential(id: id, title: id, issuer: "Synthetic School", summary: "", kind: .achievement, date: Date(timeIntervalSince1970: date), category: category)
    }
    let snapshot = CollectionSnapshot(credentials: [record("old", 1), record("new", 3), record("middle", 2), record("family", 4, "Family")], offers: [record("offer", 5)], activity: [], hasMore: true)
    let summary = LearnerHomeSummary(snapshot: snapshot, hasError: true)
    #expect(summary.content == .records); #expect(summary.hasMore)
    #expect(summary.recent.map(\.id) == ["new", "middle"])
}
