import Foundation
import Observation
import CryptoKit
import LearnCardNativeCore

public enum ClaimError: String, Error, LocalizedError, Sendable {
    case unavailable, changed, signature, family, connection, signIn, pending, unsupported, environment, uncertain, storage, expired
    public var errorDescription: String? { NativeText.text("claims.error.\(rawValue)") }
}

/// Claim capabilities are kept out of descriptions, analytics and defaults.
public struct NativeClaimLink: Equatable, Sendable {
    public let boostURI: String
    public let challenge: String
    public init(_ input: String, allowDemo: Bool = false) throws {
        let text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard text.utf8.count <= 8192, !text.unicodeScalars.contains(where: { $0.value < 32 }),
              let url = URL(string: text), let parts = URLComponents(url: url, resolvingAgainstBaseURL: false),
              parts.user == nil, parts.password == nil, parts.port == nil, parts.fragment == nil else { throw ClaimError.unsupported }
        if allowDemo, let sample = try? DemoClaimLink(url: url) { boostURI = "demo:\(sample.offerID)"; challenge = "demo"; return }
        let native = parts.scheme == "learncard-lab" && parts.host == "claim" && (parts.path == "" || parts.path == "/")
        let staging = parts.scheme == "https" && ["staging.learncard.app", "staging.learncard.ai"].contains(parts.host ?? "") && parts.path == "/claim/boost"
        if parts.scheme == "https", ["learncard.app", "learncard.ai"].contains(parts.host ?? "") { throw ClaimError.environment }
        guard native || staging else { throw ClaimError.unsupported }
        let values = parts.queryItems ?? []
        guard values.filter({ $0.name == "boostUri" }).count == 1, values.filter({ $0.name == "challenge" }).count == 1,
              let uri = values.first(where: { $0.name == "boostUri" })?.value,
              let secret = values.first(where: { $0.name == "challenge" })?.value, !secret.isEmpty, secret.utf8.count <= 2048,
              !secret.unicodeScalars.contains(where: { CharacterSet.whitespacesAndNewlines.contains($0) || $0.value < 32 }) else { throw ClaimError.unsupported }
        guard uri.range(of: #"^lc:network:staging\.network\.learncard\.com/trpc:boost:[A-Za-z0-9_-]{1,200}$"#, options: .regularExpression) != nil else { throw ClaimError.environment }
        boostURI = uri; challenge = secret
    }
    var input: [String: Any] { ["boostURI": boostURI, "challenge": challenge] }
    public var webURL: URL? {
        guard !boostURI.hasPrefix("demo:") else { return nil }
        var url = URLComponents(string: "https://staging.learncard.app/claim/boost")!
        url.queryItems = [URLQueryItem(name: "boostUri", value: boostURI), URLQueryItem(name: "challenge", value: challenge)]
        return url.url
    }
    func receiptKey(accountID: String) -> String {
        let hash = { (value: String) in SHA256.hash(data: Data(value.utf8)).map { String(format: "%02x", $0) }.joined() }
        return "claim-receipt:\(hash(accountID)):\(hash(boostURI + "\n" + challenge))"
    }
}
public struct ClaimReceipt: Codable, Sendable {
    public var uri: String?
    public var startedAt: Date?
    public init(uri: String? = nil, startedAt: Date = Date()) { self.uri = uri; self.startedAt = startedAt }
}
public protocol ClaimJournal: Sendable {
    func read(_ key: String) async throws -> ClaimReceipt?
    func write(_ receipt: ClaimReceipt, key: String) async throws
    func remove(_ key: String) async throws
}
public actor KeychainClaimJournal: ClaimJournal {
    private let vault: KeychainVault
    public init(vault: KeychainVault = KeychainVault()) { self.vault = vault }
    public func read(_ key: String) async throws -> ClaimReceipt? { try await vault.read(key).map { try JSONDecoder().decode(ClaimReceipt.self, from: $0) } }
    public func write(_ receipt: ClaimReceipt, key: String) async throws { try await vault.write(JSONEncoder().encode(receipt), key: key) }
    public func remove(_ key: String) async throws { try await vault.remove(key) }
}
public actor MemoryClaimJournal: ClaimJournal {
    private var values: [String: ClaimReceipt] = [:]
    public init() {}
    public func read(_ key: String) -> ClaimReceipt? { values[key] }
    public func write(_ receipt: ClaimReceipt, key: String) { values[key] = receipt }
    public func remove(_ key: String) { values[key] = nil }
}
public protocol ClaimService: Sendable {
    func preview(_ link: NativeClaimLink) async throws -> Credential
    func issue(_ link: NativeClaimLink) async throws -> ClaimReceipt
    func finish(_ receipt: ClaimReceipt) async throws -> Credential
    func reconcile(_ link: NativeClaimLink, since: Date) async throws -> ClaimReceipt?
}
public extension ClaimService { func reconcile(_ link: NativeClaimLink, since: Date) async throws -> ClaimReceipt? { nil } }
@MainActor public final class LiveClaimService: ClaimService {
    private let runtime: AccountRuntime
    public init(runtime: AccountRuntime) { self.runtime = runtime }
    public func preview(_ link: NativeClaimLink) async throws -> Credential { try await runtime.command("claimsPreview", input: link.input) }
    public func issue(_ link: NativeClaimLink) async throws -> ClaimReceipt { try await runtime.command("claimsIssue", input: link.input) }
    public func finish(_ receipt: ClaimReceipt) async throws -> Credential {
        guard let uri = receipt.uri else { throw ClaimError.uncertain }
        return try await runtime.command("claimsFinish", input: ["uri": uri])
    }
    public func reconcile(_ link: NativeClaimLink, since: Date) async throws -> ClaimReceipt? {
        try await runtime.command("claimsReconcile", input: ["boostURI": link.boostURI, "since": ISO8601DateFormatter().string(from: since)])
    }
}
public actor DemoClaimService: ClaimService {
    private let service: any CredentialService
    public init(service: any CredentialService = DemoCredentialService()) { self.service = service }
    public func preview(_ link: NativeClaimLink) async throws -> Credential {
        let snapshot = try await service.snapshot(), id = link.boostURI.replacingOccurrences(of: "demo:", with: "")
        guard let value = (snapshot.offers + snapshot.credentials).first(where: { $0.id == id }) else { throw ClaimError.unavailable }
        return value
    }
    public func issue(_ link: NativeClaimLink) -> ClaimReceipt { ClaimReceipt(uri: link.boostURI.replacingOccurrences(of: "demo:", with: "")) }
    public func finish(_ receipt: ClaimReceipt) async throws -> Credential {
        let snapshot = try await service.snapshot()
        if let existing = snapshot.credentials.first(where: { $0.id == receipt.uri }) { return existing }
        guard let id = receipt.uri, let value = try await service.claim(offerID: id).credentials.first(where: { $0.id == id }) else { throw ClaimError.unavailable }
        return value
    }
}

@MainActor @Observable public final class NativeClaimStore {
    public var isPresented = false
    public private(set) var phase = "entry"
    public private(set) var credential: Credential?
    public private(set) var error: ClaimError?
    public private(set) var canRetry = false
    public private(set) var link: NativeClaimLink?
    public let isDemo: Bool
    private let journal: any ClaimJournal
    private var service: (any ClaimService)?
    private var accountID: String?
    private var boundAccount: String?
    private var generation = 0
    private var receivedAt = Date()
    public init(isDemo: Bool = false, journal: any ClaimJournal = KeychainClaimJournal()) { self.isDemo = isDemo; self.journal = journal }
    public func connect(service: (any ClaimService)?, accountID: String) {
        if let boundAccount, boundAccount != accountID { clear() }
        self.service = service; self.accountID = accountID
        if link != nil { boundAccount = accountID; isPresented = true; Task { await resolve() } }
    }
    public func open() { if phase == "complete" { clear() }; isPresented = true }
    public func receive(_ input: String) async {
        guard phase != "claiming" else { return }
        generation += 1; credential = nil; error = nil; canRetry = false; isPresented = true
        do { link = try NativeClaimLink(input, allowDemo: isDemo); receivedAt = Date(); boundAccount = accountID; await resolve() }
        catch { link = nil; fail(error, retry: false) }
    }
    public func resolve() async {
        guard let link else { return }
        guard let service, let accountID else { phase = "signIn"; return }
        guard Date().timeIntervalSince(receivedAt) < 900 else { fail(ClaimError.expired, retry: false); return }
        let expected = generation; phase = "resolving"; error = nil; canRetry = false
        do {
            if let receipt = try await journal.read(link.receiptKey(accountID: accountID)) {
                guard expected == generation else { return }
                var known = receipt
                if known.uri == nil {
                    guard let reconciled = try await service.reconcile(link, since: receipt.startedAt ?? receivedAt) else { throw ClaimError.uncertain }
                    try await journal.write(reconciled, key: link.receiptKey(accountID: accountID)); known = reconciled
                }
                guard expected == generation else { return }
                let value = try await service.finish(known)
                guard expected == generation else { return }; credential = value; phase = "complete"; return
            }
            guard expected == generation else { return }
            let value = try await service.preview(link)
            guard expected == generation else { return }; credential = value; phase = "review"
        } catch { if expected == generation { fail(error, retry: true) } }
    }
    public func confirm() async {
        guard phase == "review", let link, let service, let accountID else { return }
        let expected = generation, key = link.receiptKey(accountID: accountID)
        phase = "claiming"; error = nil; canRetry = false
        var issued: ClaimReceipt?
        var attempted = false
        do {
            if let previous = try await journal.read(key) { guard previous.uri != nil else { throw ClaimError.uncertain }; issued = previous }
            else {
                // Fail closed before issuance if the protected attempt record cannot be saved.
                try await journal.write(ClaimReceipt(), key: key)
                guard expected == generation else {
                    // No mutation was started. Do not strand the user behind an uncertain marker.
                    try? await journal.remove(key)
                    return
                }
                attempted = true
                let receipt = try await service.issue(link)
                // Even a late reply is saved for this original account before touching UI.
                try await journal.write(receipt, key: key); issued = receipt
            }
            guard expected == generation, let issued else { return }
            let value = try await service.finish(issued)
            guard expected == generation else { return }; credential = value; phase = "complete"
        } catch {
            if issued == nil, let failure = error as? ClaimError, [.changed, .family, .unavailable].contains(failure) {
                // These typed failures are emitted only by preflight, before issuance.
                try? await journal.remove(key)
                if expected == generation { fail(failure, retry: true) }
            } else if expected == generation {
                let failure: any Error = issued == nil ? (attempted ? ClaimError.uncertain : (error as? ClaimError ?? .storage)) : error
                fail(failure, retry: true)
            }
        }
    }
    public func lock() {
        generation += 1; service = nil; accountID = nil; credential = nil; error = nil; canRetry = false
        phase = link == nil ? "entry" : "signIn"; isPresented = false
    }
    public func clear() { generation += 1; link = nil; boundAccount = nil; credential = nil; error = nil; canRetry = false; phase = "entry"; isPresented = false }
    private func fail(_ value: any Error, retry: Bool) { error = value as? ClaimError ?? .connection; canRetry = retry && error != .family && error != .signature; phase = "failed" }
}
