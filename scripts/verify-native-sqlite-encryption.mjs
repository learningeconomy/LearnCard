import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
    options: {
        'sqlcipher-dir': { type: 'string' },
        output: { type: 'string' },
    },
});
if (process.platform !== 'darwin' || !values['sqlcipher-dir'] || !values.output) {
    throw new Error(
        'Use macOS with --sqlcipher-dir <built SQLCipher 4.14.0> --output <private evidence directory>'
    );
}
const root = resolve(import.meta.dirname, '..');
const source = join(root, 'packages/learn-card-base/native/sqlite');
const plugin = join(root, 'node_modules/@capacitor-community/sqlite');
for (const [local, installed] of [
    ['LearnCardEncryptedDatabase.swift', 'ios/Plugin/Utils/LearnCardEncryptedDatabase.swift'],
    [
        'LearnCardEncryptedDatabase.java',
        'android/src/main/java/com/getcapacitor/community/database/sqlite/SQLite/LearnCardEncryptedDatabase.java',
    ],
]) {
    if (!readFileSync(join(source, local)).equals(readFileSync(join(plugin, installed)))) {
        throw new Error(`Installed native patch differs from reviewed source: ${local}`);
    }
}
const sqlcipher = resolve(values['sqlcipher-dir']);
const output = resolve(values.output);
mkdirSync(output, { recursive: true, mode: 0o700 });
const module = join(output, 'module');
mkdirSync(module, { recursive: true });
writeFileSync(
    join(module, 'module.modulemap'),
    `module SQLCipher [system] { header ${JSON.stringify(join(sqlcipher, 'sqlite3.h'))} export * }\n`
);
const library = join(output, 'libsqlite3.dylib');
cpSync(join(sqlcipher, 'libsqlite3.dylib'), library);
execFileSync('install_name_tool', ['-id', library, library]);
const binary = join(output, 'migration-tests');
execFileSync('swiftc', [
    '-O',
    '-I',
    module,
    '-L',
    output,
    '-lsqlite3',
    join(source, 'LearnCardEncryptedDatabase.swift'),
    join(source, 'tests/main.swift'),
    '-o',
    binary,
]);
const result = execFileSync(binary, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
const parsed = JSON.parse(result);
writeFileSync(join(output, 'summary.json'), JSON.stringify(parsed, null, 2) + '\n');
console.log(JSON.stringify(parsed, null, 2));
