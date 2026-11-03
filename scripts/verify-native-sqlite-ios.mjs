import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, writeFileSync, openSync, closeSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { output: { type: 'string' } } });
if (process.platform !== 'darwin' || !values.output)
    throw new Error('Use macOS and --output <new private directory>');
const root = resolve(import.meta.dirname, '..');
const output = resolve(values.output);
mkdirSync(output, { recursive: true, mode: 0o700 });
const fixture = join(output, 'fixture');
mkdirSync(fixture);
const installed = join(root, 'node_modules/@capacitor-community/sqlite');
cpSync(join(installed, 'ios'), join(fixture, 'ios'), { recursive: true });
const manifest = readFileSync(join(installed, 'Package.swift'), 'utf8');
// npm 8.1.1 declares ios/PluginTests but does not ship it. Supply our regression there.
if (!manifest.includes('path: "ios/PluginTests"')) throw new Error('Upstream test target changed');
writeFileSync(join(fixture, 'Package.swift'), manifest);
mkdirSync(join(fixture, 'ios/PluginTests'));
cpSync(
    join(root, 'packages/learn-card-base/native/sqlite/tests/NativeKeychainTests.swift'),
    join(fixture, 'ios/PluginTests/NativeKeychainTests.swift')
);
const host = join(output, 'host');
execFileSync('ruby', [
    join(root, 'packages/learn-card-base/native/sqlite/tests/make-ios-probe.rb'),
    host,
    fixture,
    join(root, 'packages/learn-card-base/native/sqlite/tests/NativeKeychainTests.swift'),
]);
const log = openSync(join(output, 'xcode-private.log'), 'w', 0o600);
let simulator;
try {
    simulator = execFileSync(
        'xcrun',
        [
            'simctl',
            'create',
            'Codex SQLite Encryption Synthetic',
            'com.apple.CoreSimulator.SimDeviceType.iPhone-16',
            'com.apple.CoreSimulator.SimRuntime.iOS-18-1',
        ],
        { encoding: 'utf8' }
    ).trim();
    if (!/^[A-F0-9-]{36}$/i.test(simulator)) throw new Error('Unexpected created simulator ID');
    writeFileSync(join(output, 'owned-simulator.json'), JSON.stringify({ simulator }) + '\n', {
        mode: 0o600,
    });
    execFileSync('xcrun', ['simctl', 'boot', simulator]);
    console.error(
        'Running the real patched plugin and Keychain in a fresh task-owned iOS simulator.'
    );
    execFileSync(
        'xcodebuild',
        [
            '-project',
            join(host, 'Probe.xcodeproj'),
            '-scheme',
            'Probe',
            '-destination',
            `platform=iOS Simulator,id=${simulator}`,
            '-derivedDataPath',
            join(output, 'derived'),
            '-resultBundlePath',
            join(output, 'tests.xcresult'),
            '-parallel-testing-enabled',
            'NO',
            '-maximum-concurrent-test-simulator-destinations',
            '1',
            'test',
        ],
        { cwd: host, stdio: ['ignore', log, log] }
    );
    console.log('iOS native-plugin/Keychain fixture passed; private xcresult and log retained.');
} finally {
    closeSync(log);
    if (simulator && /^[A-F0-9-]{36}$/i.test(simulator)) {
        try {
            execFileSync('xcrun', ['simctl', 'shutdown', simulator], { stdio: 'ignore' });
        } catch {
            /* Already stopped is safe to delete. */
        }
        execFileSync('xcrun', ['simctl', 'delete', simulator]);
    }
}
