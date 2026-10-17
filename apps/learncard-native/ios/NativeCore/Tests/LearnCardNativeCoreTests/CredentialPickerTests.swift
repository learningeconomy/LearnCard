import Foundation
import Testing
@testable import LearnCardNativeCore

private func pickerRecord(_ id: String, category: String = "Accomplishment", title: String = "Design portfolio", issuer: String = "École Studio", date: String = "2026-10-15T12:00:00Z", signed: Bool = true) -> Credential {
    Credential(id: id, title: title, issuer: issuer, summary: "Research practice", kind: .achievement,
               date: ISO8601DateFormatter().date(from: date)!, signedPayload: signed ? "original-\(id)" : nil, category: category)
}
private let pickerNow = ISO8601DateFormatter().date(from: "2026-10-15T20:00:00Z")!
private var pickerCalendar: Calendar { var value = Calendar(identifier: .gregorian); value.timeZone = TimeZone(identifier: "America/New_York")!; return value }

@Test func pickerCombinesCategoriesAndAccentInsensitiveWordsAcrossHundredsOfRecords() {
    let records = (0..<300).map { pickerRecord("\($0)", category: $0.isMultiple(of: 2) ? "Qualifications" : "Accomplishment") }
        + [pickerRecord("family", category: "Family"), pickerRecord("missing", signed: false)]
    var query = CredentialPickerQuery(); query.categories = [.qualification]; query.text = "  ECOLE   research design  "
    let results = query.results(in: records, selected: [], live: true, locale: Locale(identifier: "en"))
    #expect(results.count == 150)
    #expect(results.allSatisfy { $0.displayCategory == .qualification && $0.signedPayload == "original-\($0.id)" })
    query.categories.insert(.portfolio)
    #expect(query.results(in: records, selected: [], live: true).count == 300)
}

@Test func pickerUsesInclusiveLocalDatesAndExcludesUnknownDates() {
    var query = CredentialPickerQuery(now: pickerNow, calendar: pickerCalendar); query.dateRange = .custom
    query.from = ISO8601DateFormatter().date(from: "2026-10-14T18:00:00Z")!
    query.through = ISO8601DateFormatter().date(from: "2026-10-15T18:00:00Z")!
    let records = [pickerRecord("before", date: "2026-10-14T03:59:59Z"), pickerRecord("start", date: "2026-10-14T04:00:00Z"),
                   pickerRecord("last", date: "2026-10-16T03:59:59Z"), pickerRecord("after", date: "2026-10-16T04:00:00Z"),
                   pickerRecord("unknown", date: "1970-01-01T00:00:00Z")]
    #expect(Set(query.results(in: records, selected: [], live: true, calendar: pickerCalendar).map(\.id)) == ["start", "last"])
    query.dateRange = .any
    #expect(query.results(in: records, selected: [], live: true).count == 5)
}

@Test func pickerRelativeDateRangesHaveCalendarDayBoundaries() {
    var query = CredentialPickerQuery(now: pickerNow, calendar: pickerCalendar); query.dateRange = .recent
    let records = [pickerRecord("recent", date: "2026-09-16T04:00:00Z"), pickerRecord("older", date: "2026-09-16T03:59:59Z"),
                   pickerRecord("future", date: "2026-10-16T04:00:00Z"), pickerRecord("year", date: "2026-01-01T05:00:00Z"),
                   pickerRecord("last-year", date: "2026-01-01T04:59:59Z")]
    #expect(query.results(in: records, selected: [], live: true, now: pickerNow, calendar: pickerCalendar).map(\.id) == ["recent"])
    query.dateRange = .year
    #expect(Set(query.results(in: records, selected: [], live: true, now: pickerNow, calendar: pickerCalendar).map(\.id)) == ["recent", "older", "future", "year"])
}

@Test func pickerSortsDeterministicallyWithoutChangingOriginalPayloads() {
    let records = [pickerRecord("b", title: "Course 10", issuer: "Z Studio", date: "2026-10-10T12:00:00Z"),
                   pickerRecord("a", title: "Course 2", issuer: "A Studio"), pickerRecord("c", title: "Course 2", issuer: "A Studio")]
    var query = CredentialPickerQuery()
    #expect(query.results(in: records, selected: [], live: true).map(\.id) == ["a", "c", "b"])
    query.sort = .oldest
    #expect(query.results(in: records, selected: [], live: true).map(\.id) == ["b", "a", "c"])
    query.sort = .title
    #expect(query.results(in: records, selected: [], live: true).map(\.id) == ["a", "c", "b"])
    query.sort = .issuer
    #expect(query.results(in: records, selected: [], live: true).map(\.signedPayload) == ["original-a", "original-c", "original-b"])
}

@Test func selectedAuditIgnoresFiltersAndNeverAddsNewOrHiddenCredentials() {
    let records = [pickerRecord("portfolio"), pickerRecord("qualification", category: "Qualifications"), pickerRecord("not-chosen")]
    var selection = CredentialPickerSelection(); selection.toggle("portfolio"); selection.toggle("qualification")
    var query = CredentialPickerQuery(); query.text = "no-match"; query.categories = [.id]; query.dateRange = .recent
    #expect(query.results(in: records, selected: selection.ids, live: true).isEmpty)
    #expect(query.needsCompleteCollection)
    query.selectedOnly = true
    #expect(!query.needsCompleteCollection)
    #expect(Set(query.results(in: records, selected: selection.ids, live: true).map(\.id)) == selection.ids)
    selection.toggle("portfolio")
    #expect(query.results(in: records, selected: selection.ids, live: true).map(\.id) == ["qualification"])
    #expect(selection.ids == ["qualification"])
}

@Test func selectionLimitStillAllowsDeselectingAndNeverSelectsAnEntireFilter() {
    var selection = CredentialPickerSelection()
    for id in 0..<100 { selection.toggle("\(id)") }
    #expect(selection.ids.count == 50); #expect(!selection.ids.contains("50"))
    selection.toggle("0"); selection.toggle("99")
    #expect(selection.ids.count == 50); #expect(selection.ids.contains("99"))
    selection.clear(); #expect(selection.ids.isEmpty)
}

@Test func passportDateSortKeepsUnavailableDatesLastInBothDirections() {
    let records = [pickerRecord("unknown", date: "1970-01-01T00:00:00Z"), pickerRecord("new"),
                   pickerRecord("old", date: "2025-10-15T12:00:00Z")]
    var query = CredentialPickerQuery()
    #expect(records[0].issueDate == nil)
    #expect(query.results(in: records, selected: [], live: false).map(\.id) == ["new", "old", "unknown"])
    query.sort = .oldest
    #expect(query.results(in: records, selected: [], live: false).map(\.id) == ["old", "new", "unknown"])
    query.dateRange = .year
    #expect(query.results(in: records, selected: [], live: false, now: pickerNow, calendar: pickerCalendar).map(\.id) == ["new"])
}

@Test func passportBrowseRetainsUnreadableRecordsAndCombinesTextCategoryAndDate() {
    let records = [pickerRecord("unreadable", category: "Qualifications", signed: false),
                   pickerRecord("portfolio"), pickerRecord("other-issuer", category: "Qualifications", issuer: "Another School"),
                   pickerRecord("old", category: "Qualifications", date: "2025-10-15T12:00:00Z")]
    var query = CredentialPickerQuery(now: pickerNow, calendar: pickerCalendar)
    query.categories = [.qualification]; query.text = "ecole research"; query.dateRange = .year; query.sort = .issuer
    #expect(query.results(in: records, selected: [], live: false, now: pickerNow, calendar: pickerCalendar, locale: Locale(identifier: "en")).map(\.id) == ["unreadable"])
    #expect(query.results(in: records, selected: [], live: true, now: pickerNow, calendar: pickerCalendar).isEmpty)
    query.resetFilters(); query.text = ""
    #expect(query.sort == .issuer)
    #expect(query.results(in: records, selected: [], live: false).count == 4)
}
