import XCTest
import Foundation
import Security
@testable import CapacitorSQLitePlugin

/// Run in a newly created, task-owned iOS simulator. The test runner owns all fixtures.
final class NativeKeychainTests: XCTestCase {
    func testPluginMigrationUsesDeviceKeychainAndReopens() throws {
        let prefix = "learncard.sqlite.synthetic.\(UUID().uuidString)"
        let account = prefix + "_CapacitorSQLitePlugin"
        let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("learncardDBSQLite.db")
        XCTAssertFalse(FileManager.default.fileExists(atPath: url.path), "Use a fresh test-runner container")
        defer {
            for suffix in ["", "-wal", "-shm", "-journal", ".encryption.lock", ".encryption.tmp"] {
                try? FileManager.default.removeItem(atPath: url.path + suffix)
            }
            try? KeychainWrapper().deleteGenericPasswordFor(account: account, service: "unlockSecret")
        }
        try LearnCardEncryptedDatabase.withDatabase(path: url.path, secret: "", writable: true) { db in
            try LearnCardEncryptedDatabase.execute(db, """
                CREATE TABLE users(uid TEXT PRIMARY KEY, privateKey TEXT);
                CREATE TABLE sss_shares(id TEXT PRIMARY KEY, share TEXT);
                CREATE TABLE reactQuery(id TEXT PRIMARY KEY, cache TEXT);
                INSERT INTO users VALUES ('synthetic', 'SYNTHETIC_PRIVATE_KEY');
                INSERT INTO sss_shares VALUES ('pending', 'SYNTHETIC_RESUME_TOKEN');
                PRAGMA user_version=1;
            """)
        }
        var config = SqliteConfig()
        config.iosDatabaseLocation = "Documents"
        config.iosIsEncryption = 1
        config.biometricAuth = 0
        config.iosKeychainPrefix = prefix
        let plugin = CapacitorSQLite(config: config)
        XCTAssertTrue(try plugin.prepareEncryptedDatabase("learncardDB"))
        XCTAssertTrue(try plugin.isSecretStored().boolValue)
        XCTAssertNil(try Data(contentsOf: url).range(of: Data("SYNTHETIC_PRIVATE_KEY".utf8)))
        XCTAssertTrue(try url.resourceValues(forKeys: [.isExcludedFromBackupKey]).isExcludedFromBackup == true)
        try plugin.createConnection("learncardDB", encrypted: true, mode: "secret", version: 1, vUpgDict: [:], readonly: false)
        try plugin.open("learncardDB", readonly: false)
        XCTAssertFalse(try plugin.prepareEncryptedDatabase("learncardDB")) // retained connection / JS reload
        let rows = try plugin.query("learncardDB", statement: "SELECT share FROM sss_shares WHERE id=?", values: ["pending"], readonly: false)
        // Native iOS query results include an ios_columns metadata row; the JS wrapper removes it.
        XCTAssertEqual(rows.compactMap { $0["share"] as? String }, ["SYNTHETIC_RESUME_TOKEN"])
        try plugin.closeConnection("learncardDB", readonly: false)
        let reloaded = CapacitorSQLite(config: config)
        XCTAssertFalse(try reloaded.prepareEncryptedDatabase("learncardDB"))

        let (page, pageSize) = try LearnCardEncryptedDatabase.withDatabase(path: url.path, secret: UtilsSecret.getPassphrase(account: account), writable: false) { db in
            (Int(try LearnCardEncryptedDatabase.scalar(db, "SELECT rootpage FROM sqlite_master WHERE name='reactQuery'"))!,
             Int(try LearnCardEncryptedDatabase.scalar(db, "PRAGMA cipher_page_size"))!)
        }
        XCTAssertGreaterThan(page, 1)
        var damaged = try Data(contentsOf: url)
        damaged[(page - 1) * pageSize + 128] ^= 1
        try damaged.write(to: url)
        XCTAssertThrowsError(try LearnCardEncryptedDatabase.validate(path: url.path, secret: UtilsSecret.getPassphrase(account: account)))
        XCTAssertFalse(try reloaded.prepareEncryptedDatabase("learncardDB"))
        try reloaded.createConnection("learncardDB", encrypted: true, mode: "secret", version: 1, vUpgDict: [:], readonly: false)
        try reloaded.open("learncardDB", readonly: false)
        let accounts = try reloaded.query("learncardDB", statement: "SELECT privateKey FROM users", values: [], readonly: false)
        XCTAssertEqual(accounts.compactMap { $0["privateKey"] as? String }, ["SYNTHETIC_PRIVATE_KEY"])
        try reloaded.closeConnection("learncardDB", readonly: false)
        XCTAssertEqual(try Data(contentsOf: url), damaged)

        // Inspect only the fixture item's policy attributes, never return its secret bytes.
        var attributes: CFTypeRef?
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: account,
            kSecAttrService as String: "unlockSecret",
            kSecReturnAttributes as String: true,
        ]
        XCTAssertEqual(SecItemCopyMatching(query as CFDictionary, &attributes), errSecSuccess)
        let stored = attributes as? [String: Any]
        XCTAssertEqual(stored?[kSecAttrAccessible as String] as? String, kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly as String)

        try UtilsSecret.setPassphrase(account: account, passphrase: "WRONG_SYNTHETIC_SECRET")
        let wrong = CapacitorSQLite(config: config)
        XCTAssertFalse(try wrong.prepareEncryptedDatabase("learncardDB"))
        try wrong.createConnection("learncardDB", encrypted: true, mode: "secret", version: 1, vUpgDict: [:], readonly: false)
        XCTAssertThrowsError(try wrong.open("learncardDB", readonly: false))
        XCTAssertEqual(try Data(contentsOf: url), damaged)
    }
}
