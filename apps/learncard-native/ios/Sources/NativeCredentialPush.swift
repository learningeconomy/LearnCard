import CryptoKit
import Foundation
import Observation
import UIKit
import UserNotifications
#if canImport(FirebaseMessaging) && canImport(FirebaseCore)
import FirebaseCore
import FirebaseMessaging
#endif

/// Owns the device-side token. Inbox content always comes from an authenticated offer read.
@MainActor @Observable
final class NativeCredentialPush {
    static let shared = NativeCredentialPush()

    private(set) var token: String?
    private(set) var arrivalRevision: Int = 0

    private let ownerKey = "native-credential-push-owner"
    private let invalidationKey = "native-credential-push-pending-invalidation"
    private let preferences = UserDefaults.standard
    private var owner: String?
    private var generation = 0
    private var startingGeneration: Int?
    private var acceptsTokens = false
    private var invalidation: Task<Bool, Never>?
    #if canImport(FirebaseMessaging) && canImport(FirebaseCore)
    private var firebaseConfigured = false
    private var messagingDelegate = NativeCredentialMessagingDelegate()
    #endif

    private init() {}

    func token(for accountID: String) -> String? {
        guard !accountID.isEmpty, owner == digest(accountID) else { return nil }
        return token
    }

    private func digest(_ accountID: String) -> String {
        SHA256.hash(data: Data(accountID.utf8)).map { String(format: "%02x", $0) }.joined()
    }

    func start(for accountID: String) async {
        #if canImport(FirebaseMessaging) && canImport(FirebaseCore)
        guard !accountID.isEmpty, let messaging = configureMessaging() else { return }
        let owner = digest(accountID)
        if self.owner != owner {
            if self.owner != nil { endSession() }
            self.owner = owner
            generation &+= 1
        }
        let attempt = generation
        guard startingGeneration != attempt else { return }
        startingGeneration = attempt
        defer { if startingGeneration == attempt { startingGeneration = nil } }

        if preferences.bool(forKey: invalidationKey) ||
            preferences.string(forKey: ownerKey).map({ $0 != owner }) == true {
            stopReceiving()
            guard await invalidateToken(using: messaging).value, attempt == generation, !Task.isCancelled else { return }
        }

        let center = UNUserNotificationCenter.current()
        let status = await center.notificationSettings().authorizationStatus
        guard attempt == generation, !Task.isCancelled else { return }
        let allowed: Bool
        switch status {
        case .authorized, .provisional, .ephemeral:
            allowed = true
        case .notDetermined:
            allowed = (try? await center.requestAuthorization(options: [.alert, .badge, .sound])) ?? false
        default:
            allowed = false
        }
        guard attempt == generation, !Task.isCancelled else { return }
        guard allowed else {
            stopReceiving()
            return
        }

        // Mark ownership before enabling registration, even if the process exits before the callback.
        preferences.set(owner, forKey: ownerKey)
        acceptsTokens = true
        UIApplication.shared.registerForRemoteNotifications()
        #endif
    }

    func endSession() {
        owner = nil
        generation &+= 1
        stopReceiving()
        let center = UNUserNotificationCenter.current()
        center.removeAllDeliveredNotifications()
        Task { try? await center.setBadgeCount(0) }
        #if canImport(FirebaseMessaging) && canImport(FirebaseCore)
        guard preferences.string(forKey: ownerKey) != nil || preferences.bool(forKey: invalidationKey) else { return }
        preferences.set(true, forKey: invalidationKey)
        if let messaging = configureMessaging() { _ = invalidateToken(using: messaging) }
        #endif
    }

    fileprivate func receivedArrival() {
        arrivalRevision &+= 1
    }

    fileprivate func failedAPNsRegistration() {
        stopReceiving()
    }

    fileprivate func registeredAPNsToken(_ data: Data) {
        #if canImport(FirebaseMessaging) && canImport(FirebaseCore)
        guard acceptsTokens, let environment = apnsEnvironment, let messaging = configureMessaging() else { return }
        messaging.setAPNSToken(data, type: environment == "development" ? .sandbox : .prod)
        messaging.isAutoInitEnabled = true
        let attempt = generation
        messaging.token { value, _ in
            Task { @MainActor in
                guard self.generation == attempt else { return }
                self.updateToken(value)
            }
        }
        #endif
    }

    private func stopReceiving() {
        let wasReceiving = acceptsTokens
        acceptsTokens = false
        token = nil
        if wasReceiving || UIApplication.shared.isRegisteredForRemoteNotifications {
            UIApplication.shared.unregisterForRemoteNotifications()
        }
        #if canImport(FirebaseMessaging) && canImport(FirebaseCore)
        if firebaseConfigured {
            let messaging = Messaging.messaging()
            messaging.isAutoInitEnabled = false
            messaging.apnsToken = nil
        }
        #endif
    }

    #if canImport(FirebaseMessaging) && canImport(FirebaseCore)
    fileprivate func updateToken(_ value: String?) {
        guard acceptsTokens, let value, !value.isEmpty,
              Messaging.messaging().fcmToken == value else { return }
        token = value
    }

    private func invalidateToken(using messaging: Messaging) -> Task<Bool, Never> {
        if let invalidation { return invalidation }
        preferences.set(true, forKey: invalidationKey)
        let task = Task { @MainActor in
            let deleted = await withCheckedContinuation { (continuation: CheckedContinuation<Bool, Never>) in
                messaging.deleteToken { error in continuation.resume(returning: error == nil) }
            }
            if deleted {
                preferences.removeObject(forKey: ownerKey)
                preferences.removeObject(forKey: invalidationKey)
            }
            invalidation = nil
            return deleted
        }
        invalidation = task
        return task
    }

    private var apnsEnvironment: String? {
        guard let value = Bundle.main.object(forInfoDictionaryKey: "LCNativeAPNSEnvironment") as? String,
              value == "development" || value == "production" else { return nil }
        return value
    }

    private struct Configuration: Decodable {
        let bundleID: String
        let projectID: String
        let senderID: String
        let appID: String
        let apiKey: String
    }

    private func configureMessaging() -> Messaging? {
        if firebaseConfigured { return Messaging.messaging() }
        guard apnsEnvironment != nil,
              let url = Bundle.main.url(forResource: "NativeCredentialPushConfig", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let registration = try? JSONDecoder().decode(Configuration.self, from: data),
              registration.bundleID == Bundle.main.bundleIdentifier,
              registration.projectID == "learncard" else { return nil }
        let options = FirebaseOptions(googleAppID: registration.appID, gcmSenderID: registration.senderID)
        options.projectID = registration.projectID
        options.apiKey = registration.apiKey
        FirebaseApp.configure(options: options)
        firebaseConfigured = true
        let messaging = Messaging.messaging()
        messaging.isAutoInitEnabled = false
        messaging.delegate = messagingDelegate
        return messaging
    }
    #endif
}

@MainActor
final class NativeCredentialPushDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NativeCredentialPush.shared.registeredAPNsToken(deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: any Error) {
        NativeCredentialPush.shared.failedAPNsRegistration()
    }

    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        if Self.isCredentialArrival(notification.request.content.userInfo) {
            await NativeCredentialPush.shared.receivedArrival()
        }
        // The active SwiftUI app uses its own credential alert instead of an iOS banner.
        return []
    }

    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse) async {
        if Self.isCredentialArrival(response.notification.request.content.userInfo) {
            await NativeCredentialPush.shared.receivedArrival()
        }
    }

    private nonisolated static func isCredentialArrival(_ userInfo: [AnyHashable: Any]) -> Bool {
        struct Payload: Decodable { let type: String }
        // FCM copies its data fields into APNs userInfo. Decode only the notification discriminator.
        guard let raw = userInfo["raw"] as? String, raw.utf8.count <= 4_096,
              let payload = try? JSONDecoder().decode(Payload.self, from: Data(raw.utf8)) else { return false }
        return payload.type == "CREDENTIAL_RECEIVED" || payload.type == "BOOST_RECEIVED"
    }
}

#if canImport(FirebaseMessaging) && canImport(FirebaseCore)
private final class NativeCredentialMessagingDelegate: NSObject, MessagingDelegate {
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        Task { @MainActor in NativeCredentialPush.shared.updateToken(fcmToken) }
    }
}
#endif
