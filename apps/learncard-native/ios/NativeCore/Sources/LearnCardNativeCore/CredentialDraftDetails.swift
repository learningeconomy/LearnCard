import Foundation

/// Optional consumer-builder fields, serialized in the same OBv3 locations as the web creator.
public struct CredentialDraftDetails: Codable, Sendable, Equatable {
    public var criteriaURL = ""
    public var fieldOfStudy = ""
    public var role = ""
    public var term = ""
    public var activityStartDate: Date?
    public var activityEndDate: Date?
    public var validUntil: Date?
    public var evidence: [CredentialDraftEvidence] = []
    public init() {}

    public var isEmpty: Bool {
        [criteriaURL, fieldOfStudy, role, term].allSatisfy { $0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty } &&
        activityStartDate == nil && activityEndDate == nil && validUntil == nil && evidence.allSatisfy(\.isEmpty)
    }
    public var validationIssue: CredentialDraftDetailsIssue? {
        if criteriaURL.count > 2000 || fieldOfStudy.count > 200 || role.count > 200 || term.count > 200 ||
            evidence.count > 5 || evidence.contains(where: { $0.url.count > 2000 || $0.name.count > 120 || $0.summary.count > 1000 }) { return .limits }
        if !criteriaURL.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !Self.isWebURL(criteriaURL) { return .link }
        if evidence.contains(where: { !$0.isEmpty && !Self.isWebURL($0.url) }) { return .link }
        if let start = activityStartDate, let end = activityEndDate, end < start { return .dateOrder }
        if [activityStartDate, activityEndDate, validUntil].compactMap({ $0 }).contains(where: { !$0.timeIntervalSince1970.isFinite }) { return .dateOrder }
        return nil
    }
    public static func isWebURL(_ value: String) -> Bool {
        guard let url = URL(string: value.trimmingCharacters(in: .whitespacesAndNewlines)),
              ["http", "https"].contains(url.scheme?.lowercased() ?? ""),
              let host = url.host, !host.isEmpty, url.user == nil, url.password == nil else { return false }
        return true
    }
    /// Date-only choices retain the user's local calendar day; expiry includes that whole day.
    public static func dateOnly(_ date: Date, expires: Bool, calendar: Calendar = .current) -> Date {
        let start = calendar.startOfDay(for: date)
        return expires ? (calendar.date(byAdding: .day, value: 1, to: start) ?? start).addingTimeInterval(-1) : start
    }
}

public enum CredentialDraftDetailsIssue: String, Sendable { case limits, link, dateOrder }

public struct CredentialDraftEvidence: Codable, Sendable, Equatable, Identifiable {
    public var id = UUID()
    public var url = ""
    public var name = ""
    public var summary = ""
    public init(url: String = "", name: String = "", summary: String = "") {
        self.url = url; self.name = name; self.summary = summary
    }
    public var isEmpty: Bool { [url, name, summary].allSatisfy { $0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty } }
    private enum CodingKeys: String, CodingKey { case url, name, summary }
}
