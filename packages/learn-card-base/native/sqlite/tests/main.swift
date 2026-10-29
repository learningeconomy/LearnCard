import Foundation
import SQLCipher
import Darwin

typealias Database = LearnCardEncryptedDatabase
func require(_ condition: @autoclosure () throws -> Bool) throws {
    let result = try condition()
    precondition(result)
}
let manager = FileManager.default

func readSecret(_ path: String) throws -> String? {
    manager.fileExists(atPath: path) ? try String(contentsOfFile: path, encoding: .utf8) : nil
}

func prepare(_ path: String, fault: String? = nil) throws -> Bool {
    try Database.prepare(path: path, readSecret: { try readSecret(path + ".synthetic-secret") }, writeSecret: {
        try $0.write(toFile: path + ".synthetic-secret", atomically: true, encoding: .utf8)
    }, checkpoint: { point in
        if point == fault { _exit(77) }
    })
}

func seed(_ path: String, rows: Int = 100, wal: Bool = false) throws {
    try Database.withDatabase(path: path, secret: "", writable: true) { db in
        if wal { try Database.execute(db, "PRAGMA journal_mode=WAL") }
        try Database.execute(db, """
            CREATE TABLE users(uid TEXT PRIMARY KEY, privateKey TEXT);
            CREATE TABLE sss_shares(id TEXT PRIMARY KEY, share TEXT);
            CREATE TABLE credentials(id INTEGER PRIMARY KEY, credential TEXT);
            CREATE TABLE reactQuery(id TEXT PRIMARY KEY, cache TEXT);
            CREATE VIEW credential_count AS SELECT count(*) AS n FROM credentials;
            INSERT INTO users VALUES ('synthetic-user', 'SYNTHETIC_PRIVATE_KEY');
            INSERT INTO sss_shares VALUES ('device', 'SYNTHETIC_DEVICE_SHARE'), ('device:version','7'), ('pending','SYNTHETIC_RESUME_TOKEN');
            PRAGMA user_version=7;
            BEGIN;
        """)
        for index in 0..<rows {
            try Database.execute(db, "INSERT INTO credentials VALUES (\(index), '\(String(repeating: "x", count: 1024))')")
        }
        try Database.execute(db, "COMMIT")
        if wal { _exit(0) } // Retain a real uncheckpointed WAL as a process-death input.
    }
}

func check(_ path: String, encrypted: Bool, rows: Int = 100) throws {
    let secret = encrypted ? try readSecret(path + ".synthetic-secret")! : ""
    try Database.withDatabase(path: path, secret: secret, writable: false) { db in
        try require(try Database.scalar(db, "SELECT privateKey FROM users") == "SYNTHETIC_PRIVATE_KEY")
        try require(try Database.scalar(db, "SELECT share FROM sss_shares WHERE id='pending'") == "SYNTHETIC_RESUME_TOKEN")
        try require(try Database.scalar(db, "SELECT share FROM sss_shares WHERE id='device:version'") == "7")
        try require(try Database.scalar(db, "SELECT n FROM credential_count") == String(rows))
        try require(try Database.scalar(db, "PRAGMA user_version") == "7")
    }
}

func child(_ arguments: [String], wait: Bool = true) throws -> Process {
    let process = Process()
    process.executableURL = URL(fileURLWithPath: CommandLine.arguments[0])
    process.arguments = arguments
    process.standardOutput = FileHandle.nullDevice
    process.standardError = FileHandle.nullDevice
    try process.run()
    if wait { process.waitUntilExit() }
    return process
}

func expectFailure(_ operation: () throws -> Void) {
    do { try operation(); fatalError("Expected failure") } catch { }
}

func timed(_ operation: () throws -> Void) rethrows -> Double {
    let start = DispatchTime.now().uptimeNanoseconds
    try operation()
    return Double(DispatchTime.now().uptimeNanoseconds - start) / 1_000_000
}

func summary(_ samples: [Double]) -> [String: Double] {
    let values = samples.sorted()
    return ["p50Ms": values[values.count / 2], "p95Ms": values[min(values.count - 1, Int(Double(values.count) * 0.95))]]
}

if CommandLine.arguments.count > 2 {
    let mode = CommandLine.arguments[1], path = CommandLine.arguments[2]
    if mode == "wal" { try seed(path, wal: true) }
    else { _ = try prepare(path, fault: mode == "prepare" ? nil : mode) }
    exit(0)
}

let directory = manager.temporaryDirectory.appendingPathComponent("learncard-sqlite-synthetic-\(UUID().uuidString)")
try manager.createDirectory(at: directory, withIntermediateDirectories: true)
defer { try? manager.removeItem(at: directory) }
var passed: [String] = []
func path(_ name: String) -> String { directory.appendingPathComponent(name + ".db").path }

let fresh = path("fresh")
try require(try !prepare(fresh))
try Database.validate(path: fresh, secret: readSecret(fresh + ".synthetic-secret")!)
expectFailure { try Database.validate(path: fresh, secret: "") }
expectFailure { try Database.validate(path: fresh, secret: "WRONG_SYNTHETIC_SECRET") }
try require(try !prepare(fresh))
passed.append("fresh-encryption-reopen-and-wrong-key")

let migrated = path("migrated")
try seed(migrated)
for suffix in ["", "-journal", "-wal", "-shm"] {
    try Data("SYNTHETIC_STALE_STAGING".utf8).write(to: URL(fileURLWithPath: migrated + ".encryption.tmp" + suffix))
}
try require(try prepare(migrated))
try check(migrated, encrypted: true)
try require(try !prepare(migrated))
passed.append("plaintext-conversion-preserves-schema-version-and-recovery-material")

for point in ["after-secret", "before-replace", "after-replace"] {
    let file = path(point)
    try seed(file)
    let process = try child([point, file])
    try require(process.terminationStatus == 77)
    try check(file, encrypted: point == "after-replace")
    let secret = try readSecret(file + ".synthetic-secret")
    _ = try prepare(file)
    try require(try readSecret(file + ".synthetic-secret") == secret)
    try check(file, encrypted: true)
    passed.append("process-death-\(point)-and-retry")
}

let missing = path("missing-secret")
try seed(missing)
_ = try prepare(missing)
try manager.removeItem(atPath: missing + ".synthetic-secret")
let original = try Data(contentsOf: URL(fileURLWithPath: missing))
expectFailure { _ = try prepare(missing) }
try require(try Data(contentsOf: URL(fileURLWithPath: missing)) == original)
try require(!manager.fileExists(atPath: missing + ".synthetic-secret"))
passed.append("missing-secret-does-not-regenerate-or-replace")

let corrupt = path("corrupt")
try Data("SQLite format 3\0BAD_SYNTHETIC_DATA".utf8).write(to: URL(fileURLWithPath: corrupt))
let corruptBytes = try Data(contentsOf: URL(fileURLWithPath: corrupt))
expectFailure { _ = try prepare(corrupt) }
try require(try Data(contentsOf: URL(fileURLWithPath: corrupt)) == corruptBytes)
passed.append("corrupt-original-preserved")

let storeFailure = path("secret-write-failure")
try seed(storeFailure)
expectFailure {
    _ = try Database.prepare(path: storeFailure, readSecret: { nil }, writeSecret: { _ in throw NSError(domain: "synthetic", code: 1) })
}
try check(storeFailure, encrypted: false)
passed.append("secret-write-failure-preserves-plaintext")

let wal = path("wal")
try require(try child(["wal", wal]).terminationStatus == 0)
try require(manager.fileExists(atPath: wal + "-wal"))
_ = try prepare(wal)
try check(wal, encrypted: true)
passed.append("uncheckpointed-wal-recovered-before-conversion")

let concurrent = path("concurrent")
try seed(concurrent)
let first = try child(["prepare", concurrent], wait: false)
let second = try child(["prepare", concurrent], wait: false)
first.waitUntilExit(); second.waitUntilExit()
try require(first.terminationStatus == 0 && second.terminationStatus == 0)
try check(concurrent, encrypted: true)
passed.append("cross-process-bootstrap-lock")

// Same engine, fixture, durability settings and query on both sides. No native bridge timing claim.
let plainBench = path("benchmark-plain"), cipherBench = path("benchmark-cipher")
try seed(plainBench, rows: 1_000); try seed(cipherBench, rows: 1_000)
let conversionMs = try timed { _ = try prepare(cipherBench) }
let cipherSecret = try readSecret(cipherBench + ".synthetic-secret")!
var metrics: [String: Any] = ["migrationMs": conversionMs]
for (name, file, secret) in [("plaintext", plainBench, ""), ("encrypted", cipherBench, cipherSecret)] {
    var opened: [Double] = [], warm: [Double] = [], writes: [Double] = []
    for _ in 0..<10 {
        opened.append(try timed {
            try Database.withDatabase(path: file, secret: secret, writable: false) { db in
                _ = try Database.scalar(db, "SELECT credential FROM credentials WHERE id=12")
            }
        })
    }
    try Database.withDatabase(path: file, secret: secret, writable: true) { db in
        _ = try Database.scalar(db, "SELECT count(*) FROM credentials")
        for _ in 0..<50 {
            warm.append(try timed { _ = try Database.scalar(db, "SELECT credential FROM credentials WHERE id=12") })
        }
        let blob = String(repeating: "s", count: 1_048_576)
        for _ in 0..<10 {
            writes.append(try timed {
                try Database.execute(db, "BEGIN; INSERT OR REPLACE INTO reactQuery VALUES ('snapshot', '\(blob)'); COMMIT;")
            })
        }
    }
    metrics[name] = ["openFirstReadClose": summary(opened), "warmPointRead": summary(warm), "oneMiBSnapshotCommit": summary(writes)]
}
let output: [String: Any] = ["passed": passed, "metrics": metrics, "platform": "macOS host Swift + SQLCipher 4.14.0; no Capacitor bridge or protected-store proof", "syntheticRows": 1_000]
let json = try JSONSerialization.data(withJSONObject: output, options: [.prettyPrinted, .sortedKeys])
FileHandle.standardOutput.write(json)
FileHandle.standardOutput.write(Data("\n".utf8))
