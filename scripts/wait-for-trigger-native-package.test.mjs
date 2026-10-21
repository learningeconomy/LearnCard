import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
    chmodSync,
    copyFileSync,
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptName = 'wait-for-trigger-native-package.mjs';
const scriptPath = fileURLToPath(new URL(scriptName, import.meta.url));
const packageName = '@learncard/didkit-plugin-node';
const bindingName = `${packageName}-linux-x64-gnu`;
const supported =
    process.platform === 'linux' &&
    process.arch === 'x64' &&
    Boolean(process.report.getReport().header.glibcVersionRuntime);

const createFixture = (t, outcomes) => {
    const root = mkdtempSync(join(tmpdir(), 'native-readiness-test-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    mkdirSync(join(root, 'scripts'));
    mkdirSync(join(root, 'bin'));
    const manifestPath = join(root, 'packages/plugins/didkit-plugin-node/package.json');
    mkdirSync(dirname(manifestPath), { recursive: true });
    writeFileSync(manifestPath, JSON.stringify({ name: packageName, version: '9.8.7' }));
    copyFileSync(scriptPath, join(root, 'scripts', scriptName));

    const attemptsPath = join(root, 'attempts.json');
    const probePath = join(root, 'probe-ran');
    const npmPath = join(root, 'bin/npm');
    // This executable simulates npm publication states; no registry request is made.
    writeFileSync(
        npmPath,
        `#!/usr/bin/env node
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const attemptsPath = ${JSON.stringify(attemptsPath)};
const outcomes = ${JSON.stringify(outcomes)};
const attempts = existsSync(attemptsPath) ? JSON.parse(readFileSync(attemptsPath, 'utf8')) : [];
const outcome = outcomes[Math.min(attempts.length, outcomes.length - 1)];
attempts.push(process.cwd());
writeFileSync(attemptsPath, JSON.stringify(attempts));

const args = process.argv.slice(2);
const publicInstall =
    args.includes('${packageName}@9.8.7') &&
    args.includes('${bindingName}@9.8.7') &&
    args.includes('--registry=https://registry.npmjs.org/') &&
    args.includes('--ignore-scripts') &&
    !process.env.npm_config_registry &&
    !process.env.NODE_AUTH_TOKEN;
if (!publicInstall) {
    console.log(JSON.stringify({ error: { code: 'EUSAGE', summary: 'Not an isolated exact public install' } }));
    process.exit(1);
}
if (outcome.code) {
    console.log(JSON.stringify({ error: { code: outcome.code, summary: outcome.message || 'Not available' } }));
    process.exit(1);
}
if (outcome.hangInstall) {
    setInterval(() => {}, 1000);
} else {
    const bindingRoot = join(process.cwd(), 'node_modules', '${bindingName}');
    const wrapperRoot = join(process.cwd(), 'node_modules', '${packageName}');
    mkdirSync(bindingRoot, { recursive: true });
    mkdirSync(wrapperRoot, { recursive: true });
    writeFileSync(join(bindingRoot, 'index.js'), outcome.brokenBinding
        ? "throw new Error('native binding cannot load');"
        : 'module.exports = {};');
    writeFileSync(join(wrapperRoot, 'index.js'),
        'exports.getDidKitPlugin = async () => { ' +
        'require(${JSON.stringify(bindingName)}); ' +
        (outcome.brokenPlugin ? "throw new Error('plugin initialization failed');" : '') +
        (outcome.pendingPlugin ? 'await new Promise(() => {});' : '') +
        'require("node:fs").writeFileSync(' + ${JSON.stringify(JSON.stringify(probePath))} + ', "loaded"); ' +
        'return { name: "DIDKit" }; };');
    console.log(JSON.stringify({ added: 2 }));
}
`
    );
    chmodSync(npmPath, 0o755);

    return {
        root,
        probePath,
        attempts: () =>
            existsSync(attemptsPath) ? JSON.parse(readFileSync(attemptsPath, 'utf8')) : [],
        run: (args = []) =>
            spawnSync(
                process.execPath,
                [
                    join('scripts', scriptName),
                    '--timeout-ms',
                    '5000',
                    '--poll-interval-ms',
                    '1',
                    ...args,
                ],
                {
                    cwd: root,
                    env: {
                        ...process.env,
                        PATH: `${join(root, 'bin')}:${process.env.PATH}`,
                        npm_config_registry: 'https://private.invalid/',
                        NODE_AUTH_TOKEN: 'fixture-token-not-a-real-credential',
                    },
                    encoding: 'utf8',
                    timeout: 10_000,
                    killSignal: 'SIGKILL',
                }
            ),
    };
};

const assertCleaned = fixture => {
    for (const installPath of fixture.attempts()) {
        assert.equal(
            existsSync(dirname(installPath)),
            false,
            'temporary install and cache are removed'
        );
    }
};

test(
    'waits through wrapper and binding publication delays before loading the plugin',
    { skip: !supported },
    t => {
        const fixture = createFixture(t, [{ code: 'E404' }, { code: 'ETARGET' }, {}]);
        const result = fixture.run();

        assert.equal(result.status, 0, result.stderr);
        assert.equal(fixture.attempts().length, 3);
        assert.equal(readFileSync(fixture.probePath, 'utf8'), 'loaded');
        assertCleaned(fixture);
    }
);

test('fails within the deadline when publication never completes', { skip: !supported }, t => {
    const fixture = createFixture(t, [{ code: 'E404' }]);
    const result = fixture.run(['--timeout-ms', '1000', '--poll-interval-ms', '2000']);

    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, /Timed out/);
    assert.equal(fixture.attempts().length, 1);
    assert.equal(existsSync(fixture.probePath), false);
    assertCleaned(fixture);
});

test(
    'does not retry non-publication errors even when their message mentions E404',
    { skip: !supported },
    t => {
        const fixture = createFixture(t, [
            { code: 'E401', message: 'E404 is not the failure code' },
            {},
        ]);
        const result = fixture.run();

        assert.equal(result.status, 1, result.stderr);
        assert.match(result.stderr, /npm install failed \(E401\)/);
        assert.equal(fixture.attempts().length, 1);
        assert.equal(existsSync(fixture.probePath), false);
        assertCleaned(fixture);
    }
);

test('rejects an installed binding that cannot load without retrying', { skip: !supported }, t => {
    const fixture = createFixture(t, [{ brokenBinding: true }, {}]);
    const result = fixture.run();

    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, /Native load verification failed[\s\S]*native binding cannot load/);
    assert.equal(fixture.attempts().length, 1);
    assert.equal(existsSync(fixture.probePath), false);
    assertCleaned(fixture);
});

test(
    'requires successful plugin initialization, not just a resolvable binding',
    { skip: !supported },
    t => {
        const fixture = createFixture(t, [{ brokenPlugin: true }]);
        const result = fixture.run();

        assert.equal(result.status, 1, result.stderr);
        assert.match(
            result.stderr,
            /Native load verification failed[\s\S]*plugin initialization failed/
        );
        assertCleaned(fixture);
    }
);

test(
    'fails closed when plugin initialization never resolves but Node has no pending handles',
    { skip: !supported },
    t => {
        const fixture = createFixture(t, [{ pendingPlugin: true }]);
        const result = fixture.run();

        assert.equal(result.status, 1, result.stderr);
        assert.match(result.stderr, /Native load verification failed/);
        assert.equal(existsSync(fixture.probePath), false);
        assertCleaned(fixture);
    }
);

test(
    'kills a stalled npm process at the deadline and cleans its temporary directory',
    { skip: !supported },
    t => {
        const fixture = createFixture(t, [{ hangInstall: true }]);
        const result = fixture.run(['--timeout-ms', '1000']);

        assert.equal(result.status, 1, result.stderr);
        assert.match(result.stderr, /could not complete[\s\S]*(ETIMEDOUT|SIGKILL)/);
        assert.equal(fixture.attempts().length, 1);
        assertCleaned(fixture);
    }
);

test('rejects invalid timing arguments before attempting installation', t => {
    const fixture = createFixture(t, [{}]);
    const result = fixture.run(['--timeout-ms', '0']);

    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, /Usage:/);
    assert.deepEqual(fixture.attempts(), []);
});
