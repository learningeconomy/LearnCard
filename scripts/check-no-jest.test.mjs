import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const guardScriptName = ['check-no', ['jest', 'mjs'].join('.')].join('-');
const scriptPath = fileURLToPath(new URL(guardScriptName, import.meta.url));
const timerApis = [
    'useFakeTimers',
    'useRealTimers',
    'runAllTicks',
    'runAllTimers',
    'runAllTimersAsync',
    'runAllImmediates',
    'advanceTimersByTime',
    'advanceTimersByTimeAsync',
    'runOnlyPendingTimers',
    'runOnlyPendingTimersAsync',
    'advanceTimersToNextTimer',
    'advanceTimersToNextTimerAsync',
    'advanceTimersToNextFrame',
    'clearAllTimers',
    'getTimerCount',
    'now',
    'setSystemTime',
    'setTimerTickMode',
    'getRealSystemTime',
    'setTimeout',
];
const otherRuntimeApis = [
    'resetAllMocks',
    'doMock',
    'unmock',
    'requireActual',
    'isolateModules',
    'retryTimes',
    'futureRuntimeApi',
];

const createFixtureRoot = t => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'no-jest-gate-'));
    const fixtureScript = join(fixtureRoot, 'scripts', guardScriptName);

    t.after(() => rmSync(fixtureRoot, { recursive: true, force: true }));
    mkdirSync(dirname(fixtureScript), { recursive: true });
    copyFileSync(scriptPath, fixtureScript);

    return fixtureRoot;
};

const runGuard = fixtureRoot =>
    spawnSync(process.execPath, [join('scripts', guardScriptName)], {
        cwd: fixtureRoot,
        encoding: 'utf8',
    });

test('rejects every Jest timer API', t => {
    const fixtureRoot = createFixtureRoot(t);
    const fixtureFile = join(fixtureRoot, 'timer.test.ts');
    const runtimeName = 'jest';

    for (const api of timerApis) {
        writeFileSync(fixtureFile, `${runtimeName}.${api}();\n`);

        const result = runGuard(fixtureRoot);

        assert.notEqual(result.status, 0, `${api} should be rejected`);
        assert.match(result.stderr, /timer\.test\.ts: uses the Jest runtime API/);
    }
});

test('rejects other and future Jest runtime APIs without an allowlist', t => {
    const fixtureRoot = createFixtureRoot(t);
    const fixtureFile = join(fixtureRoot, 'runtime.test.ts');
    const runtimeName = 'jest';

    for (const api of otherRuntimeApis) {
        writeFileSync(fixtureFile, `${runtimeName} . ${api}();\n`);

        const result = runGuard(fixtureRoot);

        assert.notEqual(result.status, 0, `${api} should be rejected`);
        assert.match(result.stderr, /runtime\.test\.ts: uses the Jest runtime API/);
    }
});

test('does not reject the same timer method names on vi', t => {
    const fixtureRoot = createFixtureRoot(t);
    const fixtureFile = join(fixtureRoot, 'timer.test.ts');

    writeFileSync(fixtureFile, timerApis.map(api => `vi.${api}();`).join('\n'));

    const result = runGuard(fixtureRoot);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /No active Jest usage found/);
});
