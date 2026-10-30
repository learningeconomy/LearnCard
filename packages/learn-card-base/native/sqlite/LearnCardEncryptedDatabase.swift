import Foundation
import Darwin
import Security
import SQLCipher

/// Native-only bootstrap. Secrets never cross the Capacitor bridge.
/// The same file is included in the pinned SQLite plugin patch and host migration tests.
enum LearnCardEncryptedDatabase {
    static func prepare(
        path: String,
        readSecret: () throws -> String?,
        writeSecret: (String) throws -> Void,
        checkpoint: (String) throws -> Void = { _ in }
    ) throws -> Bool {
        let manager = FileManager.default
        let parent = URL(fileURLWithPath: path).deletingLastPathComponent().path
        try manager.createDirectory(atPath: parent, withIntermediateDirectories: true)
        let lock = Darwin.open(path + ".encryption.lock", O_CREAT | O_RDWR, S_IRUSR | S_IWUSR)
        guard lock >= 0 else { throw failure("Cannot lock account storage") }
        defer { Darwin.close(lock) }
        guard flock(lock, LOCK_EX) == 0 else { throw failure("Cannot lock account storage") }
        defer { flock(lock, LOCK_UN) }

        var exists = manager.fileExists(atPath: path)
        if exists {
            let attributes = try manager.attributesOfItem(atPath: path)
            guard attributes[.type] as? FileAttributeType == .typeRegular,
                  let size = attributes[.size] as? NSNumber else {
                throw failure("Account storage is unreadable")
            }
            // An interrupted initial SQLite open may leave an empty file with no data to convert.
            exists = size.uint64Value > 0
            if !exists {
                for suffix in ["-wal", "-shm", "-journal"] where manager.fileExists(atPath: path + suffix) {
                    let sidecar = try manager.attributesOfItem(atPath: path + suffix)
                    guard let size = sidecar[.size] as? NSNumber, size.uint64Value == 0 else {
                        throw failure("Empty account storage has recovery sidecars")
                    }
                }
            }
        }
        var secret = try readSecret() ?? ""
        if exists {
            let file = try FileHandle(forReadingFrom: URL(fileURLWithPath: path))
            let header = try file.read(upToCount: 16)
            try file.close()
            guard header?.count == 16 else { throw failure("Account storage is unreadable") }
            if header != Data("SQLite format 3\0".utf8) {
                guard !secret.isEmpty else { throw failure("Account storage secret is unavailable") }
                // The plugin's keyed open authenticates the file without a duplicate KDF/full scan here.
                return false
            }
            // A killed plaintext writer can leave a hot rollback journal. SQLite needs a writable
            // handle to recover committed state before validation; never delete recovery sidecars.
            try withDatabase(path: path, secret: "", writable: true) { source in
                guard try scalar(source, "PRAGMA integrity_check") == "ok" else {
                    throw failure("Account storage integrity check failed")
                }
            }
        }
        if secret.isEmpty {
            var bytes = [UInt8](repeating: 0, count: 32)
            guard SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes) == errSecSuccess else {
                throw failure("Cannot provision account storage")
            }
            secret = bytes.map { String(format: "%02x", $0) }.joined()
            try writeSecret(secret)
            guard try readSecret() == secret else { throw failure("Cannot persist account storage secret") }
        }
        try checkpoint("after-secret")

        // Stage on the same filesystem. The authoritative file is never moved aside/deleted.
        let staged = path + ".encryption.tmp"
        for suffix in ["", "-journal", "-wal", "-shm"] {
            if manager.fileExists(atPath: staged + suffix) { try manager.removeItem(atPath: staged + suffix) }
        }
        defer {
            for suffix in ["", "-journal", "-wal", "-shm"] { try? manager.removeItem(atPath: staged + suffix) }
        }
        if exists {
            try withDatabase(path: path, secret: "", writable: true) { source in
                // Fold WAL into the source before replacing its inode; reject active writers.
                guard try scalar(source, "PRAGMA wal_checkpoint(TRUNCATE)") == "0" else {
                    throw failure("Account storage is busy")
                }
                guard try scalar(source, "PRAGMA journal_mode=DELETE") == "delete" else {
                    throw failure("Account storage is busy")
                }
                let version = try scalar(source, "PRAGMA user_version")
                try execute(source, "ATTACH DATABASE '\(escaped(staged))' AS encrypted KEY '\(escaped(secret))'")
                try execute(source, "PRAGMA encrypted.synchronous=FULL")
                try execute(source, "BEGIN EXCLUSIVE")
                do {
                    try execute(source, "SELECT sqlcipher_export('encrypted')")
                    try execute(source, "PRAGMA encrypted.user_version=\(version)")
                    try execute(source, "COMMIT")
                } catch {
                    try? execute(source, "ROLLBACK")
                    throw error
                }
                try execute(source, "DETACH DATABASE encrypted")
            }
        } else {
            try withDatabase(path: staged, secret: secret, writable: true) { target in
                try execute(target, "PRAGMA synchronous=FULL")
                // Force an encrypted header even before application schema initialization.
                try execute(target, "PRAGMA user_version=1")
            }
        }
        try checkpoint("before-validate")
        try validate(path: staged, secret: secret)
        let stagedFD = Darwin.open(staged, O_RDONLY)
        guard stagedFD >= 0 else { throw failure("Cannot sync account storage") }
        let synced = fsync(stagedFD)
        Darwin.close(stagedFD)
        guard synced == 0 else { throw failure("Cannot sync account storage") }
        try checkpoint("before-replace")
        guard rename(staged, path) == 0 else { throw failure("Cannot replace account storage") }
        try checkpoint("after-replace")
        let directoryFD = Darwin.open(parent, O_RDONLY)
        guard directoryFD >= 0 else { throw failure("Cannot sync account storage directory") }
        let directorySynced = fsync(directoryFD)
        Darwin.close(directoryFD)
        guard directorySynced == 0 else { throw failure("Cannot sync account storage directory") }
        return exists
    }

    static func validate(path: String, secret: String) throws {
        try withDatabase(path: path, secret: secret, writable: false) { db in
            guard try scalar(db, "PRAGMA integrity_check") == "ok" else {
                throw failure("Account storage integrity check failed")
            }
            if !secret.isEmpty {
                var statement: OpaquePointer?
                guard sqlite3_prepare_v2(db, "PRAGMA cipher_integrity_check", -1, &statement, nil) == SQLITE_OK else {
                    throw failure("Account storage authentication failed")
                }
                defer { sqlite3_finalize(statement) }
                guard sqlite3_step(statement) == SQLITE_DONE else {
                    throw failure("Account storage authentication failed")
                }
            }
        }
    }

    static func withDatabase<T>(
        path: String, secret: String, writable: Bool, operation: (OpaquePointer) throws -> T
    ) throws -> T {
        var handle: OpaquePointer?
        let flags = writable ? SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE : SQLITE_OPEN_READONLY
        guard sqlite3_open_v2(path, &handle, flags | SQLITE_OPEN_FULLMUTEX, nil) == SQLITE_OK,
              let db = handle else {
            if let handle = handle { sqlite3_close(handle) }
            throw failure("Cannot open account storage")
        }
        defer { sqlite3_close(db) }
        sqlite3_busy_timeout(db, 5_000)
        if !secret.isEmpty { try execute(db, "PRAGMA key='\(escaped(secret))'") }
        return try operation(db)
    }

    static func execute(_ db: OpaquePointer, _ sql: String) throws {
        guard sqlite3_exec(db, sql, nil, nil, nil) == SQLITE_OK else {
            // Never return SQL, filenames, keys or native error text to JavaScript/logs.
            throw failure("Account storage operation failed")
        }
    }

    static func scalar(_ db: OpaquePointer, _ sql: String) throws -> String {
        var statement: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else {
            throw failure("Account storage query failed")
        }
        defer { sqlite3_finalize(statement) }
        guard sqlite3_step(statement) == SQLITE_ROW, let value = sqlite3_column_text(statement, 0) else {
            throw failure("Account storage query failed")
        }
        return String(cString: value)
    }

    private static func escaped(_ value: String) -> String { value.replacingOccurrences(of: "'", with: "''") }
    private static func failure(_ message: String) -> NSError {
        NSError(domain: "LearnCardSQLiteEncryption", code: 1, userInfo: [NSLocalizedDescriptionKey: message])
    }
}
