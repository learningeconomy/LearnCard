const assert = require('node:assert/strict');
const { test } = require('node:test');
const { execFile } = require('node:child_process');
const { once } = require('node:events');
const { mkdtemp, rm, writeFile } = require('node:fs/promises');
const { createServer } = require('node:http');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { setTimeout: sleep } = require('node:timers/promises');
const { promisify } = require('node:util');
const { withSentryRateLimitRetry } = require('../../scripts/sentry-rate-limit-retry.cjs');

const rateLimit = () => new Error('sentry reported an error: request failure (http status: 429)');
const hookFor = async (callbacks, options = {}) => {
    let onEnd;
    await withSentryRateLimitRetry(
        { name: 'sentry-test', setup: build => callbacks.forEach(build.onEnd) },
        { wait: async () => {}, warn: () => {}, ...options }
    ).setup({
        onEnd: callback => {
            onEnd = callback;
        },
    });
    return (result = { errors: [] }) => onEnd(result);
};

test('concurrent bundles serialize Sentry hooks, including the cooldown', async () => {
    const events = [];
    let finishCooldown;
    let startedCooldown;
    const cooldownStarted = new Promise(resolve => {
        startedCooldown = resolve;
    });
    const cooldown = new Promise(resolve => {
        finishCooldown = resolve;
    });
    let calls = 0;
    const first = await hookFor(
        [
            () => {
                events.push('release');
            },
            () => {
                events.push('upload');
                if (++calls === 1) throw rateLimit();
            },
            () => {
                events.push('finalize');
            },
        ],
        {
            wait: async () => {
                startedCooldown();
                await cooldown;
            },
        }
    );
    const second = await hookFor([
        () => {
            events.push('second bundle');
        },
    ]);
    const firstBuild = first();
    await cooldownStarted;
    const secondBuild = second();
    await Promise.resolve();
    assert.deepEqual(events, ['release', 'upload']);
    finishCooldown();
    await Promise.all([firstBuild, secondBuild]);
    assert.deepEqual(events, ['release', 'upload', 'upload', 'finalize', 'second bundle']);
});

test('persistent 429s exhaust bounded backoff with jitter and leave the queue usable', async () => {
    const delays = [];
    let calls = 0;
    const error = rateLimit();
    const hook = await hookFor(
        [
            () => {
                calls++;
                throw error;
            },
        ],
        {
            wait: async delay => delays.push(delay),
            random: () => 0.5,
        }
    );
    await assert.rejects(hook(), candidate => candidate === error);
    assert.equal(calls, 4);
    assert.deepEqual(delays, [5_500, 10_500, 20_500]);
    let nextRan = false;
    const next = await hookFor([
        () => {
            nextRan = true;
        },
    ]);
    await next();
    assert.equal(nextRan, true);
});

test('non-rate-limit errors are preserved without retry', async () => {
    for (const message of [
        'sentry reported an error: request failure (http status: 401)',
        'sentry reported an error: request failure (http status: 503)',
        '429 errors in the application source',
    ]) {
        let calls = 0;
        const error = new Error(message);
        const hook = await hookFor([
            () => {
                calls++;
                throw error;
            },
        ]);
        await assert.rejects(hook(), candidate => candidate === error);
        assert.equal(calls, 1);
    }
});

test('compilation errors skip Sentry API work and hook diagnostics survive', async () => {
    let calls = 0;
    const hook = await hookFor([
        () => {
            calls++;
            return { warnings: [{ text: 'upload warning' }] };
        },
        () => ({ errors: [{ text: 'upload failed' }] }),
    ]);
    await hook({ errors: [{ text: 'compile failed' }] });
    assert.equal(calls, 0);
    assert.deepEqual(await hook(), {
        errors: [{ text: 'upload failed' }],
        warnings: [{ text: 'upload warning' }],
    });
});

// Exercise each service's configured plugin and actual CLI through real esbuild
// builds. Children receive only synthetic credentials and a loopback Sentry URL.
// Shorten waits, but retain the production queue and retry logic.
for (const service of ['brain-service', 'learn-cloud-service', 'lca-api']) {
    test(
        `${service}: concurrent real builds recover from create/finalize 429s`,
        { timeout: 20_000 },
        async () => {
            const root = path.resolve(__dirname, '../..');
            const directory = await mkdtemp(path.join(tmpdir(), 'sentry-plugin-429-'));
            const config = path.join(directory, '.sentryclirc');
            await writeFile(config, '');
            const attempts = { POST: 0, PUT: 0 };
            let inFlight = 0;
            let maxInFlight = 0;
            const server = createServer(async (request, response) => {
                for await (const chunk of request) {
                    void chunk;
                }
                inFlight++;
                maxInFlight = Math.max(maxInFlight, inFlight);
                const count = ++attempts[request.method];
                await sleep(20);
                response.writeHead(count === 1 ? 429 : 200, { 'Content-Type': 'application/json' });
                response.end(
                    JSON.stringify(
                        count === 1
                            ? { detail: 'Too many requests', error: 'apigateway' }
                            : {
                                  version: 'plugin-429-contract',
                                  dateCreated: '2026-10-19T00:00:00Z',
                              }
                    )
                );
                inFlight--;
            });
            try {
                server.listen(0, '127.0.0.1');
                await once(server, 'listening');
                await promisify(execFile)(
                    process.execPath,
                    [
                        '-e',
                        `
                const fs = require('node:fs');
                const path = require('node:path');
                const vm = require('node:vm');
                const { createRequire } = require('node:module');
                const root = process.argv[1];
                const rootRequire = createRequire(path.join(root, 'package.json'));
                const { build } = rootRequire('esbuild');
                const filename = path.join(root, 'services/learn-card-network', process.argv[2], 'esbuildPlugins.cjs');
                const serviceRequire = createRequire(filename);
                const module = { exports: {} };
                vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
                    module, process,
                    require: name => name.endsWith('/sentry-rate-limit-retry.cjs')
                        ? { withSentryRateLimitRetry: plugin => serviceRequire(name).withSentryRateLimitRetry(plugin, {
                            wait: async () => {}, warn: () => {}, random: () => 0,
                        }) }
                        : serviceRequire(name),
                }, { filename });
                Promise.all(Array.from({ length: 4 }, (_, index) => build({
                    stdin: { contents: 'console.log("compiled")' },
                    outfile: path.join(process.cwd(), index + '.js'),
                    bundle: true, write: false, logLevel: 'silent',
                    plugins: module.exports.slice(-1),
                }))).catch(error => { console.error(error); process.exitCode = 1; });
            `,
                        root,
                        service,
                    ],
                    {
                        cwd: directory,
                        timeout: 15_000,
                        env: {
                            PATH: process.env.PATH,
                            SENTRY_CONF: config,
                            SENTRY_URL: `http://127.0.0.1:${server.address().port}/`,
                            SENTRY_AUTH_TOKEN: 'synthetic-test-token',
                            SENTRY_ORG: 'test-org',
                            SENTRY_PROJECT: 'test-project',
                            SENTRY_RELEASE: 'plugin-429-contract',
                            SENTRY_BUILD_TELEMETRY: 'false',
                            SENTRY_DISABLE_UPDATE_CHECK: '1',
                            SENTRY_LOAD_DOTENV: '0',
                        },
                    }
                );
                assert.equal(maxInFlight, 1, 'Sentry API work must stay serialized across bundles');
                assert.equal(attempts.POST, 6, '4 releases plus retries of create and finalize');
                assert.equal(attempts.PUT, 5, '4 finalizations plus the 429 retry');
            } finally {
                await new Promise(resolve => server.close(resolve));
                await rm(directory, { recursive: true, force: true });
            }
        }
    );
}
