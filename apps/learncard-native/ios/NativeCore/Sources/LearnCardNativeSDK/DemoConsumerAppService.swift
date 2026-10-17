import Foundation
import LearnCardNativeCore

/// Isolated fixtures for consumer interaction tests. No email, app install, contract
/// publication, credential issuance or external browsing reaches a real account.
public actor DemoConsumerAppService: ConsumerAppService {
    private var apps: [ConsumerApp]
    private var installedIDs: Set<String> = ["sample-earth"]
    public private(set) var sampleConsented = false
    private var sampleReviews = Set<String>()
    private var agreed = false
    private var withdrawn = false
    private var stopped = false
    private var reviews: Set<String> = []

    public init(emptyInstalled: Bool = false) {
        if emptyInstalled { installedIDs = [] }
        apps = try! Self.decode("""
        [
          {"id":"sample-earth","title":"Earth Explorers","tagline":"Small steps. A brighter tomorrow.","description":"Learn about the world around you and celebrate what you discover.","category":"learning","screenshots":[],"launchType":"EMBEDDED_IFRAME","host":"staging.learncard.app","permissions":["request_identity","send_credential"],"featured":true,"launchable":true},
          {"id":"sample-studio","title":"Creative Studio","tagline":"Express ideas. Build skills.","description":"Practice creativity and keep a record of your learning.","category":"tools","screenshots":[],"launchType":"EMBEDDED_IFRAME","host":"staging.learncard.app","permissions":["request_identity"],"contractURI":"sample-contract","featured":false,"launchable":true}
        ]
        """)
    }
    public func browse(category: String?, cursor: String?) throws -> ConsumerAppPage {
        let records = apps.filter { category == nil || $0.category == category }
        return try Self.page(records)
    }
    public func installed(cursor: String?) throws -> ConsumerAppPage {
        try Self.page(apps.filter { installedIDs.contains($0.id) }.map { var app = $0; app.installedAt = .now; return app })
    }
    public func install(_ id: String) throws {
        guard apps.contains(where: { $0.id == id }), id != "sample-studio" || agreed && !withdrawn else { throw ConsumerAppError.decision }
        installedIDs.insert(id)
    }
    public func remove(_ id: String) { installedIDs.remove(id) }
    public func review(_ id: String) throws -> ConsumerConsentReview? {
        if id == "native-sample-student" {
            let reviewID = UUID().uuidString; sampleReviews.insert(reviewID)
            return try Self.decode("""
            {"id":"\(reviewID)","listingID":"native-sample-student","contractURI":"sample-student-contract","title":"Sample student","description":"Add twelve fictional learning records to explore your Passport.","recipients":[{"id":"sample-school","name":"Sample school"}],"readCredentials":[],"readPersonal":[],"writeCredentials":[{"id":"Achievement","required":false,"defaultEnabled":true,"choices":[]}],"writePersonal":[],"allowsAnonymous":false}
            """)
        }
        guard id == "sample-studio" else { return nil }
        let reviewID = UUID().uuidString; reviews.insert(reviewID)
        return try Self.decode("""
        {"id":"\(reviewID)","listingID":"sample-studio","contractURI":"sample-contract","title":"Creative Studio","description":"Connect your learning with your creative projects.","recipients":[{"id":"sample-studio-owner","name":"Creative Learning Studio"}],"readCredentials":[{"id":"Learning","required":false,"choices":[{"id":"design","title":"Design for people"}]}],"readPersonal":[{"id":"Name","required":false,"choices":[]}],"writeCredentials":[{"id":"Achievement","required":true,"choices":[]}],"writePersonal":[],"allowsAnonymous":false}
        """)
    }
    public func consent(_ decision: ConsumerConsentDecision) throws {
        if decision.anonymize { throw ConsumerAppError.unsupported }
        if decision.listingID == "native-sample-student" {
            guard sampleReviews.contains(decision.reviewID), decision.writeCategories.contains("Achievement") else { throw ConsumerAppError.changed }
            sampleConsented = true; sampleReviews.remove(decision.reviewID); return
        }
        guard reviews.contains(decision.reviewID), decision.listingID == "sample-studio", decision.writeCategories.contains("Achievement") else { throw ConsumerAppError.changed }
        agreed = true; withdrawn = false
    }
    public func launch(_ id: String) throws -> ConsumerAppLaunch {
        guard let app = apps.first(where: { $0.id == id }), installedIDs.contains(id), id != "sample-studio" || agreed && !withdrawn else { throw ConsumerAppError.changed }
        return try Self.decode("""
        {"id":"\(id)","title":"\(app.title)","url":"https://staging.learncard.app/native-consumer-fixture","embedded":true,"contractURI":\(id == "sample-studio" ? "\"sample-contract\"" : "null")}
        """)
    }
    public func identity(_ id: String, origin: String, challenge: String?) throws -> PartnerValue {
        guard installedIDs.contains(id), origin == "https://staging.learncard.app" else { throw ConsumerAppError.decision }
        return .object(["token": .string("synthetic-identity-proof"), "user": .object(["did": .string("did:example:native-sample")]), "expiresIn": .number(3600)])
    }
    public func event(_ id: String, event: PartnerValue) throws -> PartnerValue {
        guard installedIDs.contains(id) else { throw ConsumerAppError.unavailable }
        return .object(["success": .bool(true)])
    }
    public func dataSharing(connectionsCursor: String?, linksCursor: String?, more: Bool) throws -> DataSharingPage {
        let connections = agreed ? """
        [{"id":"sample-terms","contractURI":"sample-contract","title":"Creative Studio","status":"\(withdrawn ? "withdrawn" : "live")","recipients":[{"id":"sample-studio-owner","name":"Creative Learning Studio"}],"disclosures":[{"id":"write:Achievement","direction":"write","label":"Achievement"}]}]
        """ : "[]"
        return try Self.decode("""
        {"connections":\(connections),"links":[{"id":"sample-link","title":"My learning highlights","selectedCount":2,"version":1,"status":"\(stopped ? "stopped" : "active")","contentState":"finalized","createdAt":"2026-10-12T12:00:00Z","passcodeProtected":false}],"hasMoreConnections":false,"hasMoreLinks":false}
        """)
    }
    public func withdraw(_ id: String) throws {
        guard id == "sample-terms" else { throw ConsumerAppError.unavailable }
        withdrawn = true
    }
    public func stopLink(_ link: ManagedCredentialLink) throws -> Bool {
        guard link.id == "sample-link" else { throw ConsumerAppError.unavailable }
        stopped = true; return true
    }
    public func linkURL(_ id: String) throws -> URL {
        guard id == "sample-link", !stopped else { throw ConsumerAppError.inactive }
        return URL(string: "learncard-native-demo://share/sample-link")!
    }
    private static func decode<T: Decodable>(_ text: String) throws -> T {
        let decoder = JSONDecoder(); decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(T.self, from: Data(text.utf8))
    }
    private static func page(_ records: [ConsumerApp]) throws -> ConsumerAppPage {
        let encoder = JSONEncoder(); encoder.dateEncodingStrategy = .iso8601
        let data = try encoder.encode(records)
        return try decode("{\"records\":\(String(decoding: data, as: UTF8.self)),\"hasMore\":false}")
    }
}
