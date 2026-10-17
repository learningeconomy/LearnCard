import Foundation

public enum CredentialPickerDate: String, CaseIterable, Sendable {
    case any, recent, year, custom
}

public enum CredentialPickerSort: String, CaseIterable, Sendable {
    case newest, oldest, title, issuer
}

/// A local query over paged collection records. Filtering never changes the explicit selection.
public struct CredentialPickerQuery: Equatable, Sendable {
    public var text = ""
    public var categories = Set<CredentialCategory>()
    public var dateRange: CredentialPickerDate = .any
    public var from: Date
    public var through: Date
    public var sort: CredentialPickerSort = .newest
    public var selectedOnly = false

    public init(now: Date = .now, calendar: Calendar = .current) {
        from = calendar.date(from: calendar.dateComponents([.year], from: now)) ?? now
        through = now
    }

    public var filterCount: Int { categories.count + (dateRange == .any ? 0 : 1) }
    /// Oldest/alphabetical order and filters require later pages, not just the first thirty items.
    public var needsCompleteCollection: Bool {
        !selectedOnly && (!text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || filterCount > 0 || sort != .newest)
    }

    public mutating func resetFilters() { categories = []; dateRange = .any }

    public func results(in credentials: [Credential], selected: Set<String>, live: Bool,
                        now: Date = .now, calendar: Calendar = .current, locale: Locale = .current) -> [Credential] {
        let terms = text.split(whereSeparator: \.isWhitespace).map(String.init)
        let today = calendar.startOfDay(for: now)
        let lower: Date?
        let upper: Date?
        switch dateRange {
        case .any: lower = nil; upper = nil
        case .recent:
            lower = calendar.date(byAdding: .day, value: -29, to: today)
            upper = calendar.date(byAdding: .day, value: 1, to: today)
        case .year:
            lower = calendar.date(from: calendar.dateComponents([.year], from: now))
            upper = lower.flatMap { calendar.date(byAdding: .year, value: 1, to: $0) }
        case .custom:
            lower = calendar.startOfDay(for: min(from, through))
            upper = calendar.date(byAdding: .day, value: 1, to: calendar.startOfDay(for: max(from, through)))
        }
        return credentials.filter { credential in
            guard credential.belongsInCollection, !live || credential.signedPayload != nil else { return false }
            // This is an audit of everything that will be disclosed, including choices hidden by filters.
            if selectedOnly { return selected.contains(credential.id) }
            guard categories.isEmpty || categories.contains(credential.displayCategory) else { return false }
            if let lower, let upper {
                // The adapter uses epoch zero when issuance date is unavailable.
                guard let date = credential.issueDate, date >= lower, date < upper else { return false }
            }
            let searchable = "\(credential.title) \(credential.issuer) \(credential.summary)"
            return terms.allSatisfy { searchable.range(of: $0, options: [.caseInsensitive, .diacriticInsensitive], locale: locale) != nil }
        }.sorted { a, b in
            switch sort {
            case .newest, .oldest:
                // Missing dates belong at the end in either direction, never under "oldest".
                if (a.issueDate == nil) != (b.issueDate == nil) { return a.issueDate != nil }
                if a.date != b.date { return sort == .newest ? a.date > b.date : a.date < b.date }
            case .title, .issuer:
                let first = sort == .title ? a.title : a.issuer
                let second = sort == .title ? b.title : b.issuer
                let order = first.compare(second, options: [.caseInsensitive, .diacriticInsensitive, .numeric], locale: locale)
                if order != .orderedSame { return order == .orderedAscending }
            }
            return a.id < b.id
        }
    }
}

/// Only explicit row taps add credentials; a filter or newly fetched page cannot select anything.
public struct CredentialPickerSelection: Equatable, Sendable {
    public static let limit = 50
    public private(set) var ids = Set<String>()
    public init() {}
    public mutating func toggle(_ id: String) {
        if ids.contains(id) { ids.remove(id) }
        else if ids.count < Self.limit { ids.insert(id) }
    }
    public mutating func clear() { ids = [] }
}
