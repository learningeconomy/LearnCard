import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkKeyboardPatches, parseLockfile } from './check-keyboard-patches.mjs';

const fixture = () => {
    const dependencies = { '@capacitor/android': '8.5.2', '@capacitor/keyboard': '8.0.6' };
    const patchedDependencies = Object.fromEntries(
        Object.entries(dependencies).map(([name, version]) => [
            `${name}@${version}`,
            `patches/${name.replace('/', '%2F')}@${version}.patch`,
        ])
    );
    return {
        manifest: { patchedDependencies },
        manifests: { 'apps/scouts': { dependencies: { ...dependencies } } },
        lock: {
            patchedDependencies: { ...patchedDependencies },
            workspaces: { 'apps/scouts': { dependencies: { ...dependencies } } },
            packages: Object.fromEntries(
                Object.entries(dependencies).map(([name, version]) => [
                    name,
                    [`${name}@${version}`],
                ])
            ),
        },
        patchExists: () => true,
    };
};

test('accepts the paired patches with exact declarations and resolutions', () => {
    assert.deepEqual(checkKeyboardPatches(fixture()), []);
});

test('rejects app ranges, mismatched lock pins, and a mismatched shared dependency', () => {
    for (const declared of ['^8.0.6', '^8.0.3', '8.0.7']) {
        const input = fixture();
        input.manifests['apps/scouts'].dependencies['@capacitor/keyboard'] = declared;
        assert.match(checkKeyboardPatches(input).join('\n'), /apps\/scouts: pin/);
    }
    const input = fixture();
    input.lock.workspaces['apps/scouts'].dependencies['@capacitor/keyboard'] = '^8.0.6';
    assert.match(checkKeyboardPatches(input).join('\n'), /apps\/scouts: pin/);
});

test('rejects a native-core bump or a nested keyboard resolution that drops a patch', () => {
    for (const [name, version] of [
        ['@capacitor/android', '8.5.3'],
        ['@capacitor/keyboard', '8.0.7'],
    ]) {
        const input = fixture();
        input.lock.packages[`nested/${name}`] = [`${name}@${version}`];
        assert.match(checkKeyboardPatches(input).join('\n'), /every resolved version/);
    }
});

test('rejects missing patch declarations, mismatched paths, or missing files', () => {
    for (const target of ['manifest', 'lock']) {
        const input = fixture();
        delete input[target].patchedDependencies['@capacitor/android@8.5.2'];
        assert.match(checkKeyboardPatches(input).join('\n'), /must both declare/);
    }
    const input = fixture();
    input.patchExists = () => false;
    assert.match(checkKeyboardPatches(input).join('\n'), /patch file is missing/);
});

test('parses trailing commas without rewriting commas, quotes, or escapes inside strings', () => {
    assert.deepEqual(parseLockfile(String.raw`{"x":["a,}","a\"b", "a\\",],}`), {
        x: ['a,}', 'a"b', 'a\\'],
    });
});
