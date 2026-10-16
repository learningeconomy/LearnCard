import Foundation

/// An empty page, failed read and genuinely empty Passport have different next actions.
public struct LearnerHomeSummary: Sendable {
    public enum Content: Sendable, Equatable { case loading, unavailable, empty, partial, records }
    public let content: Content
    public let recent: [Credential]
    public let hasMore: Bool
    public init(snapshot: CollectionSnapshot?, hasError: Bool) {
        hasMore = snapshot?.hasMore ?? false
        recent = Array(RecentCredentialDeck.latest(in: (snapshot?.credentials ?? []).filter(\.belongsInCollection)).prefix(2))
        if !recent.isEmpty { content = .records }
        else if hasError { content = .unavailable }
        else if snapshot == nil { content = .loading }
        else { content = hasMore ? .partial : .empty }
    }
}
