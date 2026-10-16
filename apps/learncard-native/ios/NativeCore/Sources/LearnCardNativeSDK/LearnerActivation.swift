import CryptoKit
import Foundation
import Observation

@MainActor public protocol LearnerActivationStorage {
    func value(for key: String) -> String?
    func set(_ value: String, for key: String)
}

@MainActor public final class PreferenceLearnerActivationStorage: LearnerActivationStorage {
    private let preferences: UserDefaults
    public init(preferences: UserDefaults = .standard) { self.preferences = preferences }
    public func value(for key: String) -> String? { preferences.string(forKey: key) }
    public func set(_ value: String, for key: String) { preferences.set(value, forKey: key) }
}

@MainActor public final class MemoryLearnerActivationStorage: LearnerActivationStorage {
    private var values: [String: String] = [:]
    public init() {}
    public func value(for key: String) -> String? { values[key] }
    public func set(_ value: String, for key: String) { values[key] = value }
}

/// Optional activation follows required setup; it never grants account readiness.
/// Only a versioned pending/finished flag is persisted, under a hashed account scope.
@MainActor @Observable public final class LearnerActivationStore {
    public private(set) var needsWelcome = false
    private var intakeRequested = false
    private var activeKey: String?
    private var ready = false
    private let storage: any LearnerActivationStorage

    public init(storage: any LearnerActivationStorage = MemoryLearnerActivationStorage()) { self.storage = storage }

    public func observe(accountID: String, phase: String, hasPendingClaim: Bool = false) {
        let key = Self.key(accountID)
        if activeKey != key { intakeRequested = false }
        activeKey = key
        ready = phase == "ready"
        if ["needs_setup", "missing_profile", "finish_setup", "pending_approval"].contains(phase) {
            storage.set("pending", for: key)
        }
        needsWelcome = ready && storage.value(for: key) == "pending"
        if ready && hasPendingClaim { finish() }
    }

    public func finish(openIntake: Bool = false) {
        guard ready, let activeKey else { return }
        storage.set("finished", for: activeKey)
        needsWelcome = false
        intakeRequested = openIntake
    }

    public func takeIntakeRequest() -> Bool {
        guard ready else { return false }
        defer { intakeRequested = false }
        return intakeRequested
    }

    public func lock() {
        activeKey = nil; ready = false; needsWelcome = false; intakeRequested = false
    }

    static func key(_ accountID: String) -> String {
        let digest = SHA256.hash(data: Data(accountID.utf8)).map { String(format: "%02x", $0) }.joined()
        return "learncard.native.learner-activation.v1.\(digest)"
    }
}
