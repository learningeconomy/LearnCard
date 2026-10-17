import Foundation
import CryptoKit
import LearnCardNativeCore

public enum IntakeKind: String, Codable, CaseIterable, Identifiable, Sendable {
    case resume, certificate, transcript, diploma, rawVC
    public var id: String { rawValue }
    public var title: String { NativeText.text("intake.kind.\(rawValue)") }
    public var byteLimit: Int { self == .rawVC ? 1_048_576 : 4_194_304 }
}

public enum IntakePreviewCache {
    /// Remove only our protected Quick Look copies left by an interrupted process.
    public static func cleanStaleFiles() {
        let root = FileManager.default.temporaryDirectory
        for url in (try? FileManager.default.contentsOfDirectory(at: root, includingPropertiesForKeys: nil)) ?? [] where url.lastPathComponent.hasPrefix("lc-intake-") {
            try? FileManager.default.removeItem(at: url)
        }
    }
}
public enum IntakeError: String, Error, LocalizedError, Sendable {
    case signIn, file, size, empty, changed, connection, busy, unavailable
    public var errorDescription: String? { NativeText.text("intake.error.\(rawValue)") }
}
public struct IntakeFile: Sendable {
    public let name: String
    public let data: Data
    public init(name: String, data: Data, kind: IntakeKind) throws {
        guard !data.isEmpty, data.count <= kind.byteLimit else { throw IntakeError.size }
        guard !name.isEmpty, name.utf8.count <= 180, !name.contains("/"), !name.contains("\\"), !name.unicodeScalars.contains(where: { $0.value < 32 }) else { throw IntakeError.file }
        let ext = (name as NSString).pathExtension.lowercased()
        guard kind == .rawVC ? ext == "json" : ["pdf", "txt", "docx", "png", "jpg", "jpeg", "webp"].contains(ext) else { throw IntakeError.file }
        self.name = name; self.data = data
    }
    /// Bounded read, including providers whose advertised size changes during download.
    public static func read(_ url: URL, kind: IntakeKind) throws -> IntakeFile {
        let access = url.startAccessingSecurityScopedResource(); defer { if access { url.stopAccessingSecurityScopedResource() } }
        let handle = try FileHandle(forReadingFrom: url); defer { try? handle.close() }
        let data = try handle.read(upToCount: kind.byteLimit + 1) ?? Data()
        return try IntakeFile(name: url.lastPathComponent, data: data, kind: kind)
    }
}
public struct IntakeCandidate: Codable, Identifiable, Sendable {
    public let id: String
    public let title: String
    public let issuer: String
    public let category: String
    public let signature: String
    public let eligible: Bool
    public init(id: String, title: String, issuer: String, category: String = "Achievement", signature: String = "unavailable", eligible: Bool = true) { self.id = id; self.title = title; self.issuer = issuer; self.category = category; self.signature = signature; self.eligible = eligible }
}
public struct IntakeReview: Codable, Sendable {
    public let id: String
    public let kind: IntakeKind
    public let name: String
    public let size: Int
    public let replacesResume: Bool
    public let rejected: Int
    public let candidates: [IntakeCandidate]
    public init(id: String, kind: IntakeKind, name: String, size: Int, replacesResume: Bool = false, rejected: Int = 0, candidates: [IntakeCandidate] = []) { self.id = id; self.kind = kind; self.name = name; self.size = size; self.replacesResume = replacesResume; self.rejected = rejected; self.candidates = candidates }
}
public struct IntakeResult: Codable, Equatable, Sendable {
    public let added: Int
    public let existing: Int
    public let failed: Int
    public init(added: Int, existing: Int = 0, failed: Int = 0) { self.added = added; self.existing = existing; self.failed = failed }
}
public struct IntakeDocument: Codable, Identifiable, Sendable {
    public let id: String
    public let uri: String
    public let kind: IntakeKind
    public let name: String
    public let size: String
    public init(id: String, uri: String, kind: IntakeKind, name: String, size: String) { self.id = id; self.uri = uri; self.kind = kind; self.name = name; self.size = size }
}
public struct IntakeStatus: Codable, Sendable {
    public let counts: [String: Int]
    public let documents: [IntakeDocument]
    public let limited: Bool
    public init(counts: [String: Int] = [:], documents: [IntakeDocument] = [], limited: Bool = false) { self.counts = counts; self.documents = documents; self.limited = limited }
}
public struct IntakeDocumentData: Codable, Sendable { public let name: String; public let base64: String }
public struct SampleCredentialBundle: Codable, Identifiable, Sendable {
    public let id: String
    public let title: String
    public let expected: Int
    public let connected: Bool
    public init(id: String, title: String, expected: Int, connected: Bool) {
        self.id = id; self.title = title; self.expected = expected; self.connected = connected
    }
}

public protocol IntakeService: Sendable {
    func samples() async throws -> [SampleCredentialBundle]
    func syncSample(id: String) async throws -> IntakeResult
    func status() async throws -> IntakeStatus
    func prepare(_ file: IntakeFile, kind: IntakeKind) async throws -> IntakeReview
    func commit(id: String, selected: [String]) async throws -> IntakeResult
    func document(id: String) async throws -> IntakeDocumentData
    func discard(id: String) async
}
public extension IntakeService {
    func discard(id: String) async {}
    func samples() async throws -> [SampleCredentialBundle] { throw ConsumerAppError.unavailable }
    func syncSample(id: String) async throws -> IntakeResult { throw ConsumerAppError.unavailable }
}
@MainActor public final class LiveIntakeService: IntakeService {
    private let runtime: AccountRuntime
    public init(runtime: AccountRuntime) { self.runtime = runtime }
    public func status() async throws -> IntakeStatus { try await runtime.command("intakeStatus") }
    public func samples() async throws -> [SampleCredentialBundle] { try await runtime.command("samplesStatus") }
    public func syncSample(id: String) async throws -> IntakeResult { try await runtime.command("samplesSync", input: ["id": id]) }
    public func prepare(_ file: IntakeFile, kind: IntakeKind) async throws -> IntakeReview { try await runtime.command("intakePrepare", input: ["kind": kind.rawValue, "name": file.name, "base64": file.data.base64EncodedString()]) }
    public func commit(id: String, selected: [String]) async throws -> IntakeResult { try await runtime.command("intakeCommit", input: ["id": id, "selected": selected]) }
    public func document(id: String) async throws -> IntakeDocumentData { try await runtime.command("intakeDocument", input: ["id": id]) }
    public func discard(id: String) async { struct Reply: Decodable { let discarded: Bool }; let _: Reply? = try? await runtime.command("intakeDiscard", input: ["id": id]) }
}
public actor UnavailableIntakeService: IntakeService {
    public init() {}
    public func status() throws -> IntakeStatus { throw IntakeError.unavailable }
    public func prepare(_ file: IntakeFile, kind: IntakeKind) throws -> IntakeReview { throw IntakeError.unavailable }
    public func commit(id: String, selected: [String]) throws -> IntakeResult { throw IntakeError.unavailable }
    public func document(id: String) throws -> IntakeDocumentData { throw IntakeError.unavailable }
}

/// Local review only. No original is uploaded or credential issued in demo mode.
public actor DemoIntakeService: IntakeService {
    private var files: [String: IntakeFile] = [:]
    private var reviews: [String: IntakeReview] = [:]
    private var saved = Set<String>()
    private var documents: [IntakeDocument] = []
    private let service: any CredentialService
    private let consumer: DemoConsumerAppService
    public init(service: any CredentialService = DemoCredentialService(), consumer: DemoConsumerAppService = DemoConsumerAppService()) { self.service = service; self.consumer = consumer }
    public func samples() async -> [SampleCredentialBundle] {
        [SampleCredentialBundle(id: "native-sample-student", title: "Sample student", expected: 12, connected: await consumer.sampleConsented)]
    }
    public func syncSample(id: String) async throws -> IntakeResult {
        guard id == "native-sample-student", await consumer.sampleConsented else { throw ConsumerAppError.decision }
        guard let demo = service as? DemoCredentialService else { throw ConsumerAppError.unavailable }
        var added = 0, existing = 0
        for number in 1...12 {
            let key = "sample-student-\(number)"
            if saved.contains(key) { existing += 1; continue }
            await demo.importSample(id: key, title: "Sample learning \(number)", issuer: "Sample school")
            saved.insert(key); added += 1
        }
        return IntakeResult(added: added, existing: existing)
    }
    public func status() -> IntakeStatus {
        var counts = Dictionary(uniqueKeysWithValues: IntakeKind.allCases.map { ($0.rawValue, 0) })
        for document in documents { counts[document.kind.rawValue, default: 0] += 1 }
        counts["rawVC"] = saved.filter { $0.hasPrefix("vc:") }.count
        return IntakeStatus(counts: counts, documents: documents)
    }
    public func prepare(_ file: IntakeFile, kind: IntakeKind) throws -> IntakeReview {
        var candidates: [IntakeCandidate] = []
        if kind == .rawVC {
            guard let raw = try? JSONSerialization.jsonObject(with: file.data) else { throw IntakeError.file }
            let values = (raw as? [String: Any])?["verifiableCredential"] ?? raw
            let list = values as? [[String: Any]] ?? (values as? [String: Any]).map { [$0] } ?? []
            candidates = list.compactMap { item in
                guard item["credentialSubject"] != nil, item["issuer"] != nil else { return nil }
                let bytes = (try? JSONSerialization.data(withJSONObject: item, options: [.sortedKeys])) ?? file.data
                let id = SHA256.hash(data: bytes).map { String(format: "%02x", $0) }.joined()
                return IntakeCandidate(id: "vc:\(id)", title: item["name"] as? String ?? file.name, issuer: (item["issuer"] as? [String: Any])?["name"] as? String ?? "Sample issuer")
            }
            guard !candidates.isEmpty else { throw IntakeError.empty }
        }
        let id = UUID().uuidString
        let review = IntakeReview(id: id, kind: kind, name: file.name, size: file.data.count, replacesResume: kind == .resume && documents.contains { $0.kind == .resume }, candidates: candidates)
        files[id] = file; reviews[id] = review; return review
    }
    public func commit(id: String, selected: [String]) async throws -> IntakeResult {
        guard let review = reviews[id], let file = files[id] else { throw IntakeError.changed }
        if review.kind == .rawVC {
            var added = 0, existing = 0
            for candidate in review.candidates where selected.contains(candidate.id) {
                if saved.contains(candidate.id) { existing += 1; continue }
                if let demo = service as? DemoCredentialService { await demo.importSample(id: candidate.id, title: candidate.title, issuer: candidate.issuer) }
                saved.insert(candidate.id); added += 1
            }
            return IntakeResult(added: added, existing: existing)
        }
        if documents.contains(where: { files[$0.id]?.data == file.data && $0.kind == review.kind }) { return IntakeResult(added: 0, existing: 1) }
        if review.kind == .resume { documents.removeAll { $0.kind == .resume } }
        documents.append(IntakeDocument(id: id, uri: "demo:\(id)", kind: review.kind, name: file.name, size: String(file.data.count)))
        return IntakeResult(added: 1)
    }
    public func document(id: String) throws -> IntakeDocumentData { guard let file = files[id], documents.contains(where: { $0.id == id }) else { throw IntakeError.changed }; return IntakeDocumentData(name: file.name, base64: file.data.base64EncodedString()) }
    public func discard(id: String) { reviews[id] = nil; if !documents.contains(where: { $0.id == id }) { files[id] = nil } }
}
