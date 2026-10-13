import Foundation
import LearnCardNativeCore

public enum ConsumerAppError: String, Error, LocalizedError, Sendable {
    case connection, unavailable, changed, guardian, decision, signIn, unsupported, inactive
    public var errorDescription: String? { NativeText.text("error.\(rawValue)") }
}

@MainActor public final class LiveConsumerAppService: ConsumerAppService {
    private let runtime: AccountRuntime
    public init(runtime: AccountRuntime) { self.runtime = runtime }
    public func browse(category: String?, cursor: String?) async throws -> ConsumerAppPage {
        var input: [String: Any] = [:]
        if let category { input["category"] = category }; if let cursor { input["cursor"] = cursor }
        return try await runtime.command("appsBrowse", input: input)
    }
    public func installed(cursor: String?) async throws -> ConsumerAppPage {
        try await runtime.command("appsInstalled", input: cursor.map { ["cursor": $0] } ?? [:])
    }
    public func install(_ id: String) async throws { let _: Bool = try await runtime.command("appsInstall", input: ["id": id]) }
    public func remove(_ id: String) async throws { let _: Bool = try await runtime.command("appsRemove", input: ["id": id]) }
    public func review(_ id: String) async throws -> ConsumerConsentReview? { try await runtime.command("appsReview", input: ["id": id]) }
    public func consent(_ decision: ConsumerConsentDecision) async throws {
        let input = try JSONSerialization.jsonObject(with: JSONEncoder().encode(decision)) as? [String: Any] ?? [:]
        let _: Bool = try await runtime.command("appsConsent", input: input)
    }
    public func launch(_ id: String) async throws -> ConsumerAppLaunch { try await runtime.command("appsLaunch", input: ["id": id]) }
    public func identity(_ id: String, origin: String, challenge: String?) async throws -> PartnerValue {
        var input: [String: Any] = ["id": id, "origin": origin]; if let challenge { input["challenge"] = challenge }
        return try await runtime.command("appsIdentity", input: input)
    }
    public func event(_ id: String, event: PartnerValue) async throws -> PartnerValue {
        let raw = try JSONSerialization.jsonObject(with: JSONEncoder().encode(event))
        return try await runtime.command("appsEvent", input: ["id": id, "event": raw])
    }
    public func dataSharing(connectionsCursor: String?, linksCursor: String?, more: Bool) async throws -> DataSharingPage {
        var input: [String: Any] = ["more": more]
        if let connectionsCursor { input["connectionsCursor"] = connectionsCursor }; if let linksCursor { input["linksCursor"] = linksCursor }
        return try await runtime.command("privacySnapshot", input: input)
    }
    public func withdraw(_ id: String) async throws { let _: Bool = try await runtime.command("privacyWithdraw", input: ["id": id]) }
    public func stopLink(_ link: ManagedCredentialLink) async throws -> Bool {
        struct Reply: Decodable { let complete: Bool }
        let reply: Reply = try await runtime.command("privacyStopLink", input: ["id": link.id, "version": link.version])
        return reply.complete
    }
    public func linkURL(_ id: String) async throws -> URL {
        struct Reply: Decodable { let url: URL }
        let reply: Reply = try await runtime.command("privacyLinkURL", input: ["id": id])
        return reply.url
    }
}

/// Live hosts without a consumer capability fail visibly instead of showing demo account data.
public actor UnavailableConsumerAppService: ConsumerAppService {
    public init() {}
    public func browse(category: String?, cursor: String?) throws -> ConsumerAppPage { throw ConsumerAppError.unavailable }
    public func installed(cursor: String?) throws -> ConsumerAppPage { throw ConsumerAppError.unavailable }
    public func install(_ id: String) throws { throw ConsumerAppError.unavailable }
    public func remove(_ id: String) throws { throw ConsumerAppError.unavailable }
    public func review(_ id: String) throws -> ConsumerConsentReview? { throw ConsumerAppError.unavailable }
    public func consent(_ decision: ConsumerConsentDecision) throws { throw ConsumerAppError.unavailable }
    public func launch(_ id: String) throws -> ConsumerAppLaunch { throw ConsumerAppError.unavailable }
    public func identity(_ id: String, origin: String, challenge: String?) throws -> PartnerValue { throw ConsumerAppError.unavailable }
    public func event(_ id: String, event: PartnerValue) throws -> PartnerValue { throw ConsumerAppError.unavailable }
    public func dataSharing(connectionsCursor: String?, linksCursor: String?, more: Bool) throws -> DataSharingPage { throw ConsumerAppError.unavailable }
    public func withdraw(_ id: String) throws { throw ConsumerAppError.unavailable }
    public func stopLink(_ link: ManagedCredentialLink) throws -> Bool { throw ConsumerAppError.unavailable }
    public func linkURL(_ id: String) throws -> URL { throw ConsumerAppError.unavailable }
}
