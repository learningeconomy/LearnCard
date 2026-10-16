import Foundation

public struct SignupDraft: Codable, Sendable, Equatable {
    public var dob = ""
    public var country = ""
    public var name = ""
    public var profileId = ""
    public var image: String?
    public var guardianEmail: String?
    public var teenAcknowledged = false
    public var termsAccepted = false
    public var aiEnabled = false
    public var analyticsEnabled = false
    public var bugReportsEnabled = false
    public init() {}
    public var validProfile: Bool {
        !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && name.count <= 100 &&
        profileId.range(of: "^[a-z0-9-]{3,25}$", options: .regularExpression) != nil
    }
    public func commandInput() throws -> [String: Any] {
        try JSONSerialization.jsonObject(with: JSONEncoder().encode(self)) as? [String: Any] ?? [:]
    }
}
public struct SignupProgress: Decodable, Sendable {
    public let draft: SignupDraft?
    public let backupNeedsReplacement: Bool
    public let recoveryConfirmed: Bool
    public let guardianSent: Bool
    public init(draft: SignupDraft? = nil, backupNeedsReplacement: Bool = false, recoveryConfirmed: Bool = false, guardianSent: Bool = false) {
        self.draft = draft; self.backupNeedsReplacement = backupNeedsReplacement; self.recoveryConfirmed = recoveryConfirmed; self.guardianSent = guardianSent
    }
}
public struct SignupBackup: Decodable, Sendable, Identifiable {
    public let id: String
    public let contents: String
    public let filename: String
    public init(id: String, contents: String, filename: String = "LearnCard-Recovery.json") { self.id = id; self.contents = contents; self.filename = filename }
}
public enum SignupError: String, Error, LocalizedError, Sendable {
    case invalid, underage, taken, changed, connection, recovery, privacy, unavailable
    public var errorDescription: String? { NativeText.text("signup.error.\(rawValue)") }
}
public enum SignupStorage {
    public static func key(userID: String) -> String { "signup:learncard:staging:\(userID)" }
}
public struct SignupEligibility: Sendable, Equatable {
    public let age: Int
    public let guardianRequired: Bool
    public let teenNotice: Bool
    public let isMinor: Bool
    public var underage: Bool { age < 13 }
}
/// Generated from the same shared country/age table used by SDK mutation validation.
public struct SignupPolicy: Decodable, Sendable {
    public let countries: [String: String]
    public let eu: [String]
    public let consentAges: [String: Int]
    public let defaultConsentAge: Int
    public static func load() throws -> Self {
        guard let url = Bundle.module.url(forResource: "signup-policy", withExtension: "json") else { throw AccountError.unavailable }
        return try JSONDecoder().decode(Self.self, from: Data(contentsOf: url))
    }
    public static func civilDate(_ date: Date, timeZone: TimeZone = .current) -> String {
        let format = DateFormatter(); format.locale = Locale(identifier: "en_US_POSIX"); format.calendar = Calendar(identifier: .gregorian)
        format.timeZone = timeZone; format.dateFormat = "yyyy-MM-dd"; return format.string(from: date)
    }
    private func parts(_ text: String) throws -> (Int, Int, Int) {
        guard text.range(of: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$", options: .regularExpression) != nil else { throw SignupError.invalid }
        let items = text.split(separator: "-").compactMap { Int($0) }
        guard items.count == 3, items[0] >= 1900 else { throw SignupError.invalid }
        var calendar = Calendar(identifier: .gregorian); calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        guard let date = calendar.date(from: DateComponents(year: items[0], month: items[1], day: items[2])),
              Self.civilDate(date, timeZone: calendar.timeZone) == text else { throw SignupError.invalid }
        return (items[0], items[1], items[2])
    }
    public func eligibility(dob: String, country: String, today: String = SignupPolicy.civilDate(Date())) throws -> SignupEligibility {
        guard countries[country] != nil else { throw SignupError.invalid }
        let (y, m, d) = try parts(dob), (ty, tm, td) = try parts(today)
        guard dob <= today else { throw SignupError.invalid }
        let age = ty - y - ((tm < m || (tm == m && td < d)) ? 1 : 0)
        let inEU = eu.contains(country), threshold = consentAges[country] ?? defaultConsentAge
        return SignupEligibility(age: age, guardianRequired: inEU && age >= 13 && age < threshold,
                                 teenNotice: !inEU && age >= 13 && age < 18, isMinor: age < (inEU ? threshold : 18))
    }
    public func validate(_ draft: SignupDraft) throws {
        let result = try eligibility(dob: draft.dob, country: draft.country)
        guard !result.underage else { throw SignupError.underage }
        guard draft.validProfile, draft.termsAccepted,
              !result.teenNotice || draft.teenAcknowledged,
              !result.guardianRequired || FirebaseSession.normalizedEmail(draft.guardianEmail ?? "") != nil else { throw SignupError.invalid }
    }
}
