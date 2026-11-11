import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(new URL('./export-keycloak-realm.sh', import.meta.url));
const fixture = JSON.parse(
    readFileSync(
        new URL('../infra/keycloak/realms/learncard-dev-realm.json', import.meta.url),
        'utf8'
    )
);
const originalFixture = 'existing fixture must survive a failed export\n';

const runExport = (t, exportedRealm) => {
    const root = mkdtempSync(join(tmpdir(), 'keycloak-export-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const realmDir = join(root, 'infra/keycloak/realms');
    const binDir = join(root, 'bin');
    mkdirSync(realmDir, { recursive: true });
    mkdirSync(binDir);
    const fixturePath = join(realmDir, 'learncard-dev-realm.json');
    const sourcePath = join(root, 'export.json');
    writeFileSync(fixturePath, originalFixture);
    writeFileSync(sourcePath, exportedRealm === undefined ? '' : JSON.stringify(exportedRealm));
    // Exercise the real shell script and jq; only replace the Docker export.
    writeFileSync(
        join(binDir, 'docker'),
        `#!/usr/bin/env bash
set -euo pipefail
case "$*" in
    *" run "*) cp "$KEYCLOAK_TEST_EXPORT" "$PWD/infra/keycloak/realms/.learncard-export.tmp.json" ;;
esac
`,
        { mode: 0o755 }
    );
    const result = spawnSync('bash', [scriptPath], {
        cwd: root,
        env: {
            ...process.env,
            PATH: `${binDir}:${process.env.PATH}`,
            KEYCLOAK_TEST_EXPORT: sourcePath,
        },
        encoding: 'utf8',
    });
    assert.ifError(result.error);
    assert.deepEqual(readdirSync(realmDir), ['learncard-dev-realm.json']);
    return { ...result, fixtureText: readFileSync(fixturePath, 'utf8') };
};

test('normalizes fixture secrets and passwords before replacing the fixture', t => {
    const exportedRealm = structuredClone(fixture);
    for (const client of exportedRealm.clients.filter(client => !client.publicClient)) {
        client.secret = 'exported-client-secret';
    }
    exportedRealm.users[0].credentials = [
        { type: 'password', secretData: 'exported-password-hash' },
    ];
    const result = runExport(t, exportedRealm);
    assert.equal(result.status, 0, result.stderr);
    const normalized = JSON.parse(result.fixtureText);
    assert.equal(
        normalized.clients.find(client => client.clientId === 'lca-api').secret,
        'dev-only-secret'
    );
    assert.equal(
        normalized.clients.find(client => client.clientId === 'ci-tests').secret,
        'ci-tests-dev-only-secret'
    );
    assert.deepEqual(normalized.users[0].credentials, [
        { type: 'password', value: 'password', temporary: false },
    ]);
    assert.doesNotMatch(result.fixtureText, /exported-client-secret|exported-password-hash/);
});

for (const clientId of ['lca-api', 'ci-tests']) {
    for (const change of ['removed', 'renamed', 'duplicated']) {
        test(`preserves the fixture when ${clientId} is ${change}`, t => {
            const exportedRealm = structuredClone(fixture);
            const client = exportedRealm.clients.find(client => client.clientId === clientId);
            client.secret = 'exported-client-secret';
            if (change === 'removed') {
                exportedRealm.clients = exportedRealm.clients.filter(
                    client => client.clientId !== clientId
                );
            } else if (change === 'renamed') {
                client.clientId = `${clientId}-renamed`;
            } else {
                exportedRealm.clients.push(structuredClone(client));
            }
            const result = runExport(t, exportedRealm);
            assert.notEqual(result.status, 0);
            assert.match(
                result.stderr,
                /Expected exactly one lca-api client and one ci-tests client/
            );
            assert.equal(result.fixtureText, originalFixture);
        });
    }
}

test('preserves the fixture when another client contains an exported secret', t => {
    const exportedRealm = structuredClone(fixture);
    exportedRealm.clients.push({ clientId: 'unexpected-client', secret: 'exported-client-secret' });
    const result = runExport(t, exportedRealm);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Unexpected client secret in fixture export/);
    assert.equal(result.fixtureText, originalFixture);
});

test('preserves the fixture when the export is empty', t => {
    const result = runExport(t, undefined);
    assert.notEqual(result.status, 0);
    assert.equal(result.fixtureText, originalFixture);
});
