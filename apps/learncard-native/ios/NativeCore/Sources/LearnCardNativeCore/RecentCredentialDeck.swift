import Foundation

public enum CredentialDeckStep: Sendable { case newer, older }

/// A bounded reading position, never a credential deletion or dismissal operation.
public struct RecentCredentialDeck: Equatable, Sendable {
    public static let limit = 5
    public private(set) var ids: [String] = []
    public private(set) var index = 0
    public var activeID: String? { ids.indices.contains(index) ? ids[index] : nil }
    public init(ids: [String] = []) { reconcile(ids: ids) }

    public static func latest(in records: [Credential], category: CredentialCategory? = nil) -> [Credential] {
        var seen = Set<String>()
        return Array(records.enumerated().filter { $0.element.belongsInCollection && (category == nil || $0.element.displayCategory == category) }
            .sorted { a, b in a.element.date == b.element.date ? a.offset < b.offset : a.element.date > b.element.date }
            .map(\.element).filter { seen.insert($0.id).inserted }.prefix(limit))
    }

    public mutating func reconcile(ids newIDs: [String]) {
        let active = activeID
        var seen = Set<String>()
        ids = Array(newIDs.filter { seen.insert($0).inserted }.prefix(Self.limit))
        index = active.flatMap { ids.firstIndex(of: $0) } ?? 0
    }
    public func target(for step: CredentialDeckStep) -> Int? {
        let value = index + (step == .older ? 1 : -1)
        return ids.indices.contains(value) ? value : nil
    }
    @discardableResult public mutating func move(_ step: CredentialDeckStep) -> Bool {
        guard let target = target(for: step) else { return false }
        index = target; return true
    }
    public static func horizontalIntent(x: Double, y: Double) -> Bool {
        x.isFinite && y.isFinite && abs(x) > abs(y) * 1.25
    }
    public static func swipe(x: Double, y: Double, velocity: Double, width: Double, rightToLeft: Bool) -> CredentialDeckStep? {
        guard width.isFinite, width > 0, velocity.isFinite, horizontalIntent(x: x, y: y) else { return nil }
        let committed = abs(x) >= max(44, min(width * 0.22, 96))
        let flicked = abs(x) >= 16 && abs(velocity) >= 650 && x * velocity > 0
        guard committed || flicked else { return nil }
        return (rightToLeft ? x > 0 : x < 0) ? .older : .newer
    }
}
