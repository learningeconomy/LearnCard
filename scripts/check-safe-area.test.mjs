import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(new URL('./check-safe-area.mjs', import.meta.url));

test('fails when the shrink-only allowlist contains a stale entry', t => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'safe-area-gate-'));
    t.after(() => rmSync(fixtureRoot, { recursive: true, force: true }));

    const fixtureScript = join(fixtureRoot, 'scripts/check-safe-area.mjs');
    const staleFile = 'apps/learn-card-app/src/legacy.ts';
    mkdirSync(dirname(fixtureScript), { recursive: true });
    mkdirSync(dirname(join(fixtureRoot, staleFile)), { recursive: true });
    copyFileSync(scriptPath, fixtureScript);
    writeFileSync(
        join(fixtureRoot, 'scripts/safe-area-allowlist.json'),
        JSON.stringify({ files: [staleFile] })
    );
    writeFileSync(join(fixtureRoot, staleFile), 'export const insetFree = true;\n');

    assert.equal(spawnSync('git', ['init', '-q'], { cwd: fixtureRoot }).status, 0);
    assert.equal(spawnSync('git', ['add', '.'], { cwd: fixtureRoot }).status, 0);

    const result = spawnSync(process.execPath, ['scripts/check-safe-area.mjs'], {
        cwd: fixtureRoot,
        encoding: 'utf8',
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /stale allowlist entr/i);
    assert.match(result.stderr, /apps\/learn-card-app\/src\/legacy\.ts/);
});
