import Foundation
import Observation
import LearnCardNativeCore

@MainActor @Observable public final class ConsumerAppsStore {
    public let service: any ConsumerAppService
    public private(set) var apps: [ConsumerApp] = []
    public private(set) var installedApps: [ConsumerApp] = []
    public private(set) var connections: [DataConnection] = []
    public private(set) var links: [ManagedCredentialLink] = []
    public private(set) var browseBusy = false
    public private(set) var installedBusy = false
    public private(set) var privacyBusy = false
    public private(set) var actionBusy = false
    public private(set) var hasMoreApps = false
    public private(set) var hasMoreInstalled = false
    public private(set) var hasMorePrivacy = false
    public var error: ConsumerAppError?
    public var notice: String?
    private var category: String?
    private var appsCursor: String?
    private var installedCursor: String?
    private var connectionsCursor: String?
    private var linksCursor: String?
    private var browseRequest = 0
    private var generation = 0

    public init(service: any ConsumerAppService) { self.service = service }
    public func browse(category: String? = nil, more: Bool = false, allPages: Bool = false) async {
        if more && (browseBusy || !hasMoreApps) { return }
        browseRequest += 1
        let request = browseRequest, expected = generation
        self.category = category; browseBusy = true; error = nil
        defer { if expected == generation && request == browseRequest { browseBusy = false } }
        do {
            var page = try await service.browse(category: category, cursor: more ? appsCursor : nil)
            guard expected == generation, request == browseRequest, !Task.isCancelled else { return }
            apps = merged(more ? apps : [], page.records)
            var seen = Set<String>()
            while allPages && page.hasMore {
                try check(expected)
                guard request == browseRequest else { return }
                guard let cursor = page.cursor, seen.insert(cursor).inserted, seen.count < 100 else { throw ConsumerAppError.connection }
                page = try await service.browse(category: category, cursor: cursor)
                try check(expected)
                guard request == browseRequest else { return }
                apps = merged(apps, page.records)
            }
            appsCursor = page.cursor; hasMoreApps = page.hasMore
        } catch { if expected == generation && request == browseRequest && !Task.isCancelled { self.error = friendly(error) } }
    }
    public func loadInstalled(more: Bool = false) async {
        guard !installedBusy, !more || hasMoreInstalled else { return }
        let expected = generation; installedBusy = true
        defer { if expected == generation { installedBusy = false } }
        do {
            var page = try await service.installed(cursor: more ? installedCursor : nil)
            guard expected == generation, !Task.isCancelled else { return }
            installedApps = merged(more ? installedApps : [], page.records)
            var seen = Set<String>()
            while page.hasMore {
                try check(expected)
                guard let cursor = page.cursor, seen.insert(cursor).inserted, seen.count < 100 else { throw ConsumerAppError.connection }
                page = try await service.installed(cursor: cursor)
                try check(expected)
                installedApps = merged(installedApps, page.records)
            }
            installedCursor = page.cursor; hasMoreInstalled = page.hasMore
        } catch { if expected == generation && !Task.isCancelled { self.error = friendly(error) } }
    }
    public func loadPrivacy(more: Bool = false) async {
        guard !privacyBusy, !more || hasMorePrivacy else { return }
        let expected = generation; privacyBusy = true; error = nil
        defer { if expected == generation { privacyBusy = false } }
        do {
            let page = try await service.dataSharing(connectionsCursor: more ? connectionsCursor : nil, linksCursor: more ? linksCursor : nil, more: more)
            guard expected == generation, !Task.isCancelled else { return }
            connections = merged(more ? connections : [], page.connections)
            links = merged(more ? links : [], page.links)
            connectionsCursor = page.connectionsCursor; linksCursor = page.linksCursor
            hasMorePrivacy = page.hasMoreConnections || page.hasMoreLinks
        } catch { if expected == generation && !Task.isCancelled { self.error = friendly(error) } }
    }
    public func isInstalled(_ id: String) -> Bool { installedApps.contains { $0.id == id } }
    public func review(_ app: ConsumerApp) async throws -> ConsumerConsentReview? {
        try await review(id: app.id)
    }
    public func review(id: String) async throws -> ConsumerConsentReview? {
        let expected = generation, result = try await service.review(id)
        guard expected == generation, !Task.isCancelled else { throw AccountError.cancelled }
        return result
    }
    public func add(_ app: ConsumerApp, decision: ConsumerConsentDecision? = nil) async -> Bool {
        await action { expected in
            if let decision { try await self.service.consent(decision) }
            try self.check(expected)
            try await self.service.install(app.id)
            try self.check(expected)
            await self.loadInstalled(); try self.check(expected); await self.loadPrivacy()
        }
    }
    public func agree(_ decision: ConsumerConsentDecision, addApp: Bool) async -> Bool {
        await action { expected in
            try await self.service.consent(decision); try self.check(expected)
            if addApp { try await self.service.install(decision.listingID); try self.check(expected) }
            await self.loadInstalled(); try self.check(expected); await self.loadPrivacy()
        }
    }
    public func remove(_ app: ConsumerApp) async -> Bool {
        await action { expected in try await self.service.remove(app.id); try self.check(expected); await self.loadInstalled() }
    }
    public func launch(_ app: ConsumerApp) async throws -> ConsumerAppLaunch {
        let expected = generation, result = try await service.launch(app.id)
        guard expected == generation, !Task.isCancelled, result.id == app.id, result.origin != nil else { throw AccountError.cancelled }
        return result
    }
    public func withdraw(_ connection: DataConnection) async -> Bool {
        await action { expected in try await self.service.withdraw(connection.id); try self.check(expected); await self.loadPrivacy() }
    }
    public func stop(_ link: ManagedCredentialLink) async -> Bool {
        await action { expected in
            let complete = try await self.service.stopLink(link)
            try self.check(expected)
            if !complete { self.notice = "sharing.pending" }
            await self.loadPrivacy()
        }
    }
    public func fail(_ error: any Error) { self.error = friendly(error) }
    public func lock() {
        generation += 1; browseRequest += 1
        apps = []; installedApps = []; connections = []; links = []
        error = nil; notice = nil
        browseBusy = false; installedBusy = false; privacyBusy = false; actionBusy = false
        appsCursor = nil; installedCursor = nil; connectionsCursor = nil; linksCursor = nil
        hasMoreApps = false; hasMoreInstalled = false; hasMorePrivacy = false
    }
    private func check(_ expected: Int) throws {
        guard expected == generation, !Task.isCancelled else { throw AccountError.cancelled }
    }
    private func action(_ operation: (Int) async throws -> Void) async -> Bool {
        guard !actionBusy else { return false }
        let expected = generation; actionBusy = true; error = nil; notice = nil
        defer { if expected == generation { actionBusy = false } }
        do {
            try await operation(expected)
            guard expected == generation, !Task.isCancelled else { return false }
            return true
        } catch { if expected == generation && !Task.isCancelled { self.error = friendly(error) }; return false }
    }
    private func friendly(_ error: any Error) -> ConsumerAppError { error as? ConsumerAppError ?? .connection }
    private func merged<T: Identifiable>(_ old: [T], _ new: [T]) -> [T] where T.ID: Hashable {
        var records = old
        for record in new {
            if let index = records.firstIndex(where: { $0.id == record.id }) { records[index] = record }
            else { records.append(record) }
        }
        return records
    }
}
