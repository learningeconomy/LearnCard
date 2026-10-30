import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// Supply an untouched npm tarball extraction as the first argument. Only these seven
// reviewed source files enter the patch; Gradle output and Bun cache tags never do.
const root = resolve(import.meta.dirname, '..');
const plugin = resolve(root, 'node_modules/@capacitor-community/sqlite');
const baseline = resolve(process.argv[2] ?? 'missing-baseline');
if (JSON.parse(readFileSync(resolve(baseline, 'package.json'))).version !== '8.1.1') {
    throw new Error('Supply an unmodified SQLite plugin 8.1.1 package directory');
}
if (JSON.parse(readFileSync(resolve(plugin, 'package.json'))).version !== '8.1.1') {
    throw new Error('This patch is reviewed only against SQLite plugin 8.1.1');
}
const update = (file, before, after) => {
    const path = resolve(plugin, file);
    const source = readFileSync(path, 'utf8');
    if (source.includes(after)) return;
    if (source.split(before).length !== 2) throw new Error(`Patch context changed: ${file}`);
    writeFileSync(path, source.replace(before, after));
};
copyFileSync(
    resolve(root, 'packages/learn-card-base/native/sqlite/LearnCardEncryptedDatabase.java'),
    resolve(
        plugin,
        'android/src/main/java/com/getcapacitor/community/database/sqlite/SQLite/LearnCardEncryptedDatabase.java'
    )
);
copyFileSync(
    resolve(root, 'packages/learn-card-base/native/sqlite/LearnCardEncryptedDatabase.swift'),
    resolve(plugin, 'ios/Plugin/Utils/LearnCardEncryptedDatabase.swift')
);
update(
    'android/src/main/java/com/getcapacitor/community/database/sqlite/CapacitorSQLite.java',
    '    public Boolean isSecretStored() throws Exception {',
    `
    public boolean prepareEncryptedDatabase(String database) throws Exception {
        if (!isEncryption || !"learncardDB".equals(database)) throw new Exception("Encrypted account storage is unavailable");
        return com.getcapacitor.community.database.sqlite.SQLite.LearnCardEncryptedDatabase.prepare(
            context.getDatabasePath("learncardDBSQLite.db"),
            new com.getcapacitor.community.database.sqlite.SQLite.LearnCardEncryptedDatabase.Secrets() {
                public String read() { return sharedPreferences.getString("secret", ""); }
                public void write(String secret) throws Exception {
                    if (!sharedPreferences.edit().putString("secret", secret).commit()) {
                        throw new Exception("Cannot persist account storage secret");
                    }
                }
            });
    }

    public Boolean isSecretStored() throws Exception {`
);
update(
    'android/src/main/java/com/getcapacitor/community/database/sqlite/CapacitorSQLitePlugin.java',
    '    @PluginMethod\n    public void echo(PluginCall call) {',
    `
    @PluginMethod
    public void prepareEncryptedDatabase(PluginCall call) {
        try {
            if (implementation == null) throw new Exception("Unavailable");
            boolean migrated = implementation.prepareEncryptedDatabase(call.getString("database"));
            JSObject result = new JSObject();
            result.put("version", 1);
            result.put("encrypted", true);
            result.put("migrated", migrated);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Encrypted account storage is unavailable");
        }
    }

    @PluginMethod
    public void echo(PluginCall call) {`
);
update(
    'ios/Plugin/CapacitorSQLitePlugin.swift',
    '        CAPPluginMethod(name: "echo", returnType: CAPPluginReturnPromise),',
    '        CAPPluginMethod(name: "prepareEncryptedDatabase", returnType: CAPPluginReturnPromise),\n        CAPPluginMethod(name: "echo", returnType: CAPPluginReturnPromise),'
);
update(
    'ios/Plugin/CapacitorSQLitePlugin.swift',
    '    @objc func echo(_ call: CAPPluginCall) {',
    `
    @objc func prepareEncryptedDatabase(_ call: CAPPluginCall) {
        do {
            guard let implementation = implementation else { throw CapacitorSQLiteError.failed(message: "Unavailable") }
            let migrated = try implementation.prepareEncryptedDatabase(call.getString("database") ?? "")
            call.resolve(["version": 1, "encrypted": true, "migrated": migrated])
        } catch {
            call.reject("Encrypted account storage is unavailable")
        }
    }

    @objc func echo(_ call: CAPPluginCall) {`
);
update(
    'ios/Plugin/CapacitorSQLite.swift',
    '    // MARK: - Echo',
    `
    func prepareEncryptedDatabase(_ database: String) throws -> Bool {
        guard isEncryption && database == "learncardDB" else {
            throw CapacitorSQLiteError.failed(message: "Encrypted account storage is unavailable")
        }
        let path = try UtilsFile.getFilePath(databaseLocation: databaseLocation, fileName: "learncardDBSQLite.db")
        let migrated = try LearnCardEncryptedDatabase.prepare(path: path, readSecret: {
            do {
                return try KeychainWrapper().getGenericPasswordFor(account: self.account, service: "unlockSecret")
            } catch let error as KeychainWrapperError {
                if error.type == .itemNotFound { return nil }
                throw error
            }
        }, writeSecret: { secret in
            try UtilsSecret.setPassphrase(account: self.account, passphrase: secret)
        })
        var url = URL(fileURLWithPath: path)
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        try url.setResourceValues(values)
        try FileManager.default.setAttributes([.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication], ofItemAtPath: path)
        return migrated
    }

    // MARK: - Echo`
);
update(
    'ios/Plugin/Models/KeychainServices.swift',
    '            // 5\n            kSecValueData as String: passwordData',
    '            // 5\n            kSecValueData as String: passwordData,\n            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly'
);

const files = [
    'android/src/main/java/com/getcapacitor/community/database/sqlite/CapacitorSQLite.java',
    'android/src/main/java/com/getcapacitor/community/database/sqlite/CapacitorSQLitePlugin.java',
    'android/src/main/java/com/getcapacitor/community/database/sqlite/SQLite/LearnCardEncryptedDatabase.java',
    'ios/Plugin/CapacitorSQLite.swift',
    'ios/Plugin/CapacitorSQLitePlugin.swift',
    'ios/Plugin/Models/KeychainServices.swift',
    'ios/Plugin/Utils/LearnCardEncryptedDatabase.swift',
];
let patch = '';
for (const file of files) {
    const before = resolve(baseline, file);
    const oldPath = existsSync(before) ? before : '/dev/null';
    try {
        execFileSync('diff', [
            '-u',
            '-L',
            oldPath === '/dev/null' ? oldPath : `a/${file}`,
            '-L',
            `b/${file}`,
            oldPath,
            resolve(plugin, file),
        ]);
    } catch (error) {
        if (error.status !== 1) throw error;
        const creation = oldPath === '/dev/null' ? 'new file mode 100644\n' : '';
        patch += `diff --git a/${file} b/${file}\n${creation}${error.stdout.toString()}`;
    }
}
writeFileSync(resolve(root, 'patches/@capacitor-community%2Fsqlite@8.1.1.patch'), patch);
